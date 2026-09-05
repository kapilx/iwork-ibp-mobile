import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, LessThan, Repository } from "typeorm";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { ClaimSyncJob, ClaimSyncJobPriority, ClaimSyncJobStatus } from "../../../../service-lib/src/lib/entities/claim-sync-job.entity";
import { MstrExtApplicationRef } from "../../../../service-lib/src/lib/entities/mstr-ext-application-ref.entity";
import { TpaExternalFeatureConfig } from "../../../../service-lib/src/lib/entities/tpa-external-feature-config.entity";
import { PolicyTpaMap } from "../../../../service-lib/src/lib/entities/policy-tpa-map.entity";
import { RawTpaClaimResponse, RawTpaClaimResponseStatus } from "../../../../service-lib/src/lib/entities/raw-tpa-claim-response.entity";
import { ENV } from "../../../../service-lib/src/lib/environment";

// Jobs stuck in PROCESSING longer than this are reset to PENDING (crash recovery)
const STUCK_JOB_THRESHOLD_MS = 2 * 60 * 60 * 1000;

// Jobs to pick per worker run
const BATCH_SIZE = 20;

// Default limits when no TPA config row controls concurrency
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY_MS = 10_000;
const DEFAULT_TIMEOUT_MS = 120_000;

// Random inter-job delay bounds (ms) — avoids burst-pattern fingerprinting
const MIN_DELAY_MS = 450;
const MAX_DELAY_MS = 550;

const FETCH_CLAIMS_API_TYPE = "FETCH_CLAIMS";

// Fallback app key if no config row found for the TPA
const FALLBACK_APP_KEY = "tpa-claims";

// Document-service endpoint for the magic-URL / TPA proxy call
const MAGIC_URL_PATH = "/external-app-sso/magic-url";

@Injectable()
export class TpaClaimsWorkerScheduler {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ClaimSyncJob)
    private readonly claimSyncJobRepo: Repository<ClaimSyncJob>,
    @InjectRepository(RawTpaClaimResponse)
    private readonly rawResponseRepo: Repository<RawTpaClaimResponse>,
    @InjectRepository(TpaExternalFeatureConfig)
    private readonly tpaApiConfigRepo: Repository<TpaExternalFeatureConfig>,
    @InjectRepository(MstrExtApplicationRef)
    private readonly extAppRefRepo: Repository<MstrExtApplicationRef>,
    @InjectRepository(PolicyTpaMap)
    private readonly policyTpaMapRepo: Repository<PolicyTpaMap>,
  ) {}

  // ─── Worker Cron ─────────────────────────────────────────────────────────────
  // Runs every 5 min (testing). Production: "0 20 * * *" (01:30 AM IST)
  // @Cron("*/5 * * * *") — disabled: replaced by GenericTpaSyncScheduler
  async runWorker(): Promise<void> {
  console.log("[TpaWorker] Starting run");

  await this.recoverStuckJobs();
  console.log(
    "[TpaWorker] Recovered stuck jobs, proceeding to pick new jobs",
  );

  let jobs: ClaimSyncJob[] = [];

  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    jobs = await queryRunner.manager
      .getRepository(ClaimSyncJob)
      .createQueryBuilder("job")
      .where("job.status = :status", {
        status: ClaimSyncJobStatus.PENDING,
      })
      .orderBy(
        `CASE job.priority
            WHEN '${ClaimSyncJobPriority.HIGH}' THEN 0
            ELSE 1
         END`,
        "ASC",
      )
      .addOrderBy("job.createdAt", "ASC")
      .limit(BATCH_SIZE)
      .setLock("pessimistic_write")
      .setOnLocked("skip_locked")
      .getMany();

    console.log(
      `[TpaWorker] Picked ${jobs.length} jobs inside transaction`,
    );

    // Mark them PROCESSING inside the same transaction
    if (jobs.length > 0) {
      await queryRunner.manager
        .getRepository(ClaimSyncJob)
        .update(
          { id: In(jobs.map((j) => j.id)) },
          {
            status: ClaimSyncJobStatus.PROCESSING,
            startedAt: new Date(),
          },
        );
    }

    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }

  console.log(
    `[TpaWorker] Picked ${jobs.length} jobs for processing`,
  );

  if (jobs.length === 0) {
    console.log("[TpaWorker] No pending jobs, exiting");
    return;
  }

  // Process OUTSIDE the transaction
  for (const job of jobs) {
    try {
      await this.processJob(job);
    } catch (error) {
      console.error(
        `[TpaWorker] Failed processing job ${job.id}`,
        error,
      );
    }

    await this.randomDelay();
  }

  console.log("[TpaWorker] Run complete");
}

  // ─── Process one job ─────────────────────────────────────────────────────────
  private async processJob(job: ClaimSyncJob): Promise<void> {
    console.log(`[TpaWorker:processJob] >>> jobId=${job.id} policyId=${job.policyId} policyNumber=${job.policyNumber} tpaId=${job.tpaId} priority=${job.priority}`);
    const { appKey, config } = await this.resolveConfig(job.policyId);
    let lastError = "";

    for (let attempt = 0; attempt <= DEFAULT_RETRY_COUNT; attempt++) {
      try {
        const claims = await this.fetchClaimsFromTpa(job, appKey, config);

        await this.storeRawResponse(job, claims);

        await this.claimSyncJobRepo.update(job.id, {
          status: ClaimSyncJobStatus.COMPLETED,
          completedAt: new Date(),
          errorMessage: null,
        });

        console.log(
          `[TpaWorker] Completed jobId=${job.id} policyNumber=${job.policyNumber} claims=${claims.length}`,
        );
        return;
      } catch (err: any) {
        lastError = (err as Error).message;
        if (!this.isRetryable(err) || attempt === DEFAULT_RETRY_COUNT) break;

        console.warn(
          `[TpaWorker] Retry ${attempt + 1}/${DEFAULT_RETRY_COUNT} jobId=${job.id} error=${lastError}`,
        );
        await this.delay(DEFAULT_RETRY_DELAY_MS);
      }
    }

    await this.claimSyncJobRepo.update(job.id, {
      status: ClaimSyncJobStatus.FAILED,
      completedAt: new Date(),
      errorMessage: lastError,
      retryCount: () => `retry_count + 1`,
    });

    console.error(
      `[TpaWorker] Failed jobId=${job.id} policyNumber=${job.policyNumber} error=${lastError}`,
    );
  }

  // ─── Resolve appKey + config from tpa_external_feature_config ───────────────
  // Looks up policy → TPA → config row → ext app ref label (appKey).
  // Falls back to FALLBACK_APP_KEY if any step yields no result.
  private async resolveConfig(
    policyId: number,
  ): Promise<{ appKey: string; config: TpaExternalFeatureConfig | null }> {
    console.log(`[TpaWorker:resolveConfig] policyId=${policyId}`);
    const tpaMap = await this.policyTpaMapRepo.findOne({
      where: { policyId },
      select: ["tpaId"],
    });

    if (!tpaMap?.tpaId) {
      console.warn(`[TpaWorker:resolveConfig] No TPA map found for policyId=${policyId} — using fallback`);
      return { appKey: FALLBACK_APP_KEY, config: null };
    }

    const config = await this.tpaApiConfigRepo.findOne({
      where: { tpaId: tpaMap.tpaId, apiType: FETCH_CLAIMS_API_TYPE, isActive: true },
    });

    if (!config?.appRefId) {
      console.warn(`[TpaWorker:resolveConfig] No feature config for tpaId=${tpaMap.tpaId} apiType=${FETCH_CLAIMS_API_TYPE} — using fallback`);
      return { appKey: FALLBACK_APP_KEY, config: null };
    }

    const ref = await this.extAppRefRepo.findOne({
      where: { id: config.appRefId, isActive: true },
      select: ["label"],
    });

    const appKey = ref?.label ?? FALLBACK_APP_KEY;
    console.log(`[TpaWorker:resolveConfig] policyId=${policyId} tpaId=${tpaMap.tpaId} appKey=${appKey}`);
    return { appKey, config };
  }

  // ─── Call TPA via document-service ───────────────────────────────────────────
  // Builds dynamicFields from job data + per-TPA dynamic_param_mapping in config.
  // Extracts the claims array using data_path from config.
  private async fetchClaimsFromTpa(
    job: ClaimSyncJob,
    appKey: string,
    config: TpaExternalFeatureConfig | null,
  ): Promise<Record<string, any>[]> {
    const baseUrl = ENV["URL_DOCUMENT_SERVICE"] ?? "http://localhost:3013";
    const dynamicFields = this.buildDynamicFields(job, config);

    const systemToken = jwt.sign(
      { userDetails: { emailId: "system-cron@iirm.com" } },
      ENV["JWT_SECRET"] ?? "secret",
      { expiresIn: "5m" },
    );

    console.log("[TpaWorker] fetchClaimsFromTpa →", {
      appKey,
      dynamicFields,
      url: `${baseUrl}${MAGIC_URL_PATH}`,
    });

    const response = await axios.post<Record<string, any> | Record<string, any>[]>(
      `${baseUrl}${MAGIC_URL_PATH}`,
      { appKey, dynamicFields },
      {
        timeout: DEFAULT_TIMEOUT_MS,
        headers: { Authorization: `Bearer ${systemToken}` },
      },
    );

    console.log("[TpaWorker] fetchClaimsFromTpa ← status:", response.status, "dataKeys:", Object.keys(response.data ?? {}));

    // Unwrap the document-service standard { statusCode, message, data } envelope
    const envelope = response.data;
    const rawTpaData = (envelope?.statusCode !== undefined && envelope?.data !== undefined)
      ? envelope.data
      : envelope;
    console.log("[TpaWorker] rawTpaData type:", Array.isArray(rawTpaData) ? "array" : typeof rawTpaData, "keys:", rawTpaData && typeof rawTpaData === "object" ? Object.keys(rawTpaData).slice(0, 5) : []);

    return this.extractClaims(rawTpaData, config?.dataPath ?? null);
  }

  // ─── Build dynamicFields using per-TPA param mapping ─────────────────────────
  // dynamic_param_mapping maps our internal field names → TPA API param names.
  // Example: { "policyNumber": "POLICY_NUMBER", "groupCode": "GROUP_CODE" }
  // Extra TPA-specific values (groupCode etc.) come from job.dynamicParams.
  private buildDynamicFields(
    job: ClaimSyncJob,
    config: TpaExternalFeatureConfig | null,
  ): Record<string, any> {
    const mapping = config?.dynamicParamMapping as Record<string, string> | null;

    if (!mapping || Object.keys(mapping).length === 0) {
      // Fallback: legacy defaults when no mapping is configured
      const fields: Record<string, any> = { policyNo: job.policyNumber };
      if (job.policyStartDate) fields.policyStartDate = this.toDateParam(job.policyStartDate);
      if (job.policyEndDate) fields.policyEndDate = this.toDateParam(job.policyEndDate);
      return fields;
    }

    // Merge known job fields with any TPA-specific extras stored in dynamicParams
    const jobValues: Record<string, any> = {
      policyNumber: job.policyNumber,
      policyStartDate: job.policyStartDate ? this.toDateParam(job.policyStartDate) : null,
      policyEndDate: job.policyEndDate ? this.toDateParam(job.policyEndDate) : null,
      ...job.dynamicParams,
    };

    const fields: Record<string, any> = {};
    for (const [ourField, tpaField] of Object.entries(mapping)) {
      const value = jobValues[ourField];
      if (value !== null && value !== undefined) {
        fields[tpaField] = value;
      }
    }
    return fields;
  }

  // ─── Extract claims array from TPA response using dataPath ───────────────────
  // dataPath: dot-notation path like "claimList" or "response.claims".
  // No dataPath: auto-discovers the claims array in the response.
  private extractClaims(data: any, dataPath: string | null): Record<string, any>[] {
    console.log(`[TpaWorker:extractClaims] dataPath=${dataPath ?? "(auto)"} dataType=${Array.isArray(data) ? "array" : typeof data}`);
    if (!data) return [];

    if (dataPath) {
      const parts = dataPath.split(".");
      let result: any = data;
      for (const part of parts) result = result?.[part];
      if (Array.isArray(result)) return result;
      if (result && typeof result === "object") return [result as Record<string, any>];
      return [];
    }

    return this.findClaimsArray(data);
  }

  // Recursively finds the largest/best claims array in any TPA response format
  private findClaimsArray(data: any, depth = 0): Record<string, any>[] {
    if (!data) return [];
    if (Array.isArray(data)) return data.length > 0 ? data : [];
    if (typeof data !== "object") return [];

    // Priority: common claim array key names (case-insensitive check)
    const CLAIM_ARRAY_KEYS = [
      "claimList", "claims", "claimData", "claimDetails", "ClaimDetails",
      "GetClaimMISDetailsResult", "GetClaimsDataResult",
      "data", "list", "records", "items", "result", "results", "rows", "payload",
    ];
    for (const key of CLAIM_ARRAY_KEYS) {
      const val = data[key];
      if (Array.isArray(val) && val.length > 0) {
        console.log(`[TpaWorker:findClaimsArray] found array at key="${key}" length=${val.length}`);
        return val;
      }
    }

    // Find largest array across all keys
    let bestKey: string | null = null;
    let bestLen = 0;
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val) && val.length > bestLen) { bestLen = val.length; bestKey = key; }
    }
    if (bestKey) {
      console.log(`[TpaWorker:findClaimsArray] using largest array at key="${bestKey}" length=${bestLen}`);
      return (data as any)[bestKey] as Record<string, any>[];
    }

    // Recurse one level into nested objects
    if (depth < 2) {
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (val && typeof val === "object" && !Array.isArray(val)) {
          const nested = this.findClaimsArray(val, depth + 1);
          if (nested.length > 0) return nested;
        }
      }
    }

    return [];
  }

  // ─── Store raw TPA response ───────────────────────────────────────────────────
  private async storeRawResponse(
    job: ClaimSyncJob,
    claims: Record<string, any>[],
  ): Promise<void> {
    const raw = new RawTpaClaimResponse();
    raw.jobId = job.id;
    raw.policyNumber = job.policyNumber;
    raw.tpaId = job.tpaId ?? null;
    raw.responsePayload = claims;
    raw.processingStatus = RawTpaClaimResponseStatus.RECEIVED;
    raw.receivedAt = new Date();
    await this.rawResponseRepo.save(raw);
  }

  // ─── Crash recovery ───────────────────────────────────────────────────────────
  private async recoverStuckJobs(): Promise<void> {
    const stuckThreshold = new Date(Date.now() - STUCK_JOB_THRESHOLD_MS);
    console.log(`[TpaWorker] Checking for stuck jobs started before ${stuckThreshold.toISOString()}`);
    const stuck = await this.claimSyncJobRepo.find({
      where: {
        status: ClaimSyncJobStatus.PROCESSING,
        startedAt: LessThan(stuckThreshold),
      },
      select: ["id"],
    });
    console.log(`[TpaWorker] Found ${stuck.length} stuck jobs`);
    if (stuck.length === 0) return;

    await this.claimSyncJobRepo.update(
      { id: In(stuck.map((j) => j.id)) },
      { status: ClaimSyncJobStatus.PENDING, startedAt: null },
    );

    console.warn(`[TpaWorker] Recovered ${stuck.length} stuck PROCESSING jobs`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  private isRetryable(err: any): boolean {
    const status = err?.response?.status;
    return !status || status === 429 || status === 503 || status === 504;
  }

  private toDateParam(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private randomDelay(): Promise<void> {
    const ms = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
