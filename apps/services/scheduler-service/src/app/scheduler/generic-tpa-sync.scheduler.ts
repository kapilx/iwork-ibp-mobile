import { Injectable, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, LessThan, MoreThan, QueryRunner, Repository } from "typeorm";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { MstrExtApplicationRef } from "../../../../service-lib/src/lib/entities/mstr-ext-application-ref.entity";
import { MstrExtAppResponseMapping } from "../../../../service-lib/src/lib/entities/mstr-ext-app-response-mapping.entity";
import { TpaExternalFeatureConfig } from "../../../../service-lib/src/lib/entities/tpa-external-feature-config.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { SyncJob, SyncJobPriority, SyncJobScopeType, SyncJobStatus } from "../../../../service-lib/src/lib/entities/sync-job.entity";
import { RawSyncResponse, RawSyncResponseStatus } from "../../../../service-lib/src/lib/entities/raw-sync-response.entity";
import { PolicyEnrollmentEmployeePolicyMap } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity";
import { PolicyEnrollmentDependent } from "../../../../service-lib/src/lib/entities/policy-enrollment-dependent.entity";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { SCHEDULER_HANDLERS } from "../../../../../../libs/service-lib/src/lib/constants";
import { ENV, IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";

const SYSTEM_USER_ID = 0;
const WORKER_BATCH_SIZE = 10;
const PARSER_BATCH_SIZE = 20;
const RETRY_DELAY_MS = 5_000;
const DEFAULT_RETRY_COUNT = 3;
const RETENTION_DAYS = 7;
// Crash recovery: PROCESSING jobs stuck longer than this are reset
const STUCK_JOB_THRESHOLD_MS = 2 * 60 * 60 * 1000;

// ── Cron-due check ─────────────────────────────────────────────────────────────
// Returns true if the 5-part cron expression would have fired within the last 30 min.
function isCronDue(cronExpr: string): boolean {
    try {
        const parts = cronExpr.trim().split(/\s+/);
        if (parts.length !== 5) return false;
        const [minPart, hourPart] = parts;
        const now = new Date();
        for (let offset = 0; offset < 5; offset++) {
            const t = new Date(now.getTime() - offset * 60 * 1000);
            const minuteMatch = minPart === "*" || Number(minPart) === t.getUTCMinutes();
            const hourMatch = hourPart === "*" || Number(hourPart) === t.getUTCHours();
            if (minuteMatch && hourMatch) return true;
        }
        return false;
    } catch {
        return false;
    }
}

// ── Dot-notation extractor ─────────────────────────────────────────────────────
function extractDotNotation(obj: any, path: string): string {
    const value = path.split(".").reduce((acc: any, key: string) => {
        if (acc === null || acc === undefined) return undefined;
        if (Array.isArray(acc)) return acc[Number(key)];
        return acc[key];
    }, obj);
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

// ── Normalise API response to a flat array ─────────────────────────────────────
function ensureArray(data: any, dataPath: string | null): any[] {
    if (dataPath) {
        const parts = dataPath.split(".");
        let result: any = data;
        for (const p of parts) result = result?.[p];
        if (Array.isArray(result)) return result;
        if (result && typeof result === "object") return [result];
        return [];
    }
    if (Array.isArray(data)) return data;
    for (const key of ["data", "records", "items", "results", "list"]) {
        if (Array.isArray(data?.[key])) return data[key];
    }
    if (data && typeof data === "object") return [data];
    return [];
}

@Injectable()
export class GenericTpaSyncScheduler implements OnModuleInit {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
        @InjectRepository(MstrExtApplicationRef)
        private readonly appRefRepo: Repository<MstrExtApplicationRef>,
        @InjectRepository(MstrExtAppResponseMapping)
        private readonly mappingRepo: Repository<MstrExtAppResponseMapping>,
        @InjectRepository(TpaExternalFeatureConfig)
        private readonly featureConfigRepo: Repository<TpaExternalFeatureConfig>,
        @InjectRepository(Policy)
        private readonly policyRepo: Repository<Policy>,
        @InjectRepository(SyncJob)
        private readonly syncJobRepo: Repository<SyncJob>,
        @InjectRepository(RawSyncResponse)
        private readonly rawSyncRepo: Repository<RawSyncResponse>,
        @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
        private readonly enrollmentMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
        @InjectRepository(PolicyEnrollmentDependent)
        private readonly enrollmentDependentRepo: Repository<PolicyEnrollmentDependent>,
        private readonly traceIdService: TraceIdService,
        private readonly dynamicCronService: DynamicCronService,
    ) {
        this.logger = createLogger(this.traceIdService, serviceNames.SCHEDULER_SERVICE);
    }

    async onModuleInit() {
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "GenericTpaSyncScheduler", method: "onModuleInit", messageData: "Registering dynamic cron handlers" }) });

        const KEYS = ["GENERIC_TPA_SYNC_PRODUCER", "GENERIC_TPA_SYNC_WORKER", "GENERIC_TPA_SYNC_PARSER"];
        const handlers = new Map<string, () => Promise<void>>();

        for (const key of KEYS) {
            const methodName = SCHEDULER_HANDLERS[key];
            if (!methodName) { this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "GenericTpaSyncScheduler", method: "onModuleInit", payload: { key }, messageData: "No handler mapping found for key" }) }); continue; }
            const method = this[methodName as keyof GenericTpaSyncScheduler];
            if (typeof method === "function") {
                handlers.set(key, (method as () => Promise<void>).bind(this));
                this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "GenericTpaSyncScheduler", method: "onModuleInit", payload: { key, methodName }, messageData: "Handler registered" }) });
            }
        }

        this.dynamicCronService.registerHandlers(handlers);
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "GenericTpaSyncScheduler", method: "onModuleInit", messageData: "GenericTpaSyncScheduler handlers registered" }) });
    }

    // ─── Step 1: Producer ────────────────────────────────────────────────────
    // Checks each SYNC config's schedule; creates PENDING sync_job rows for due configs.
    // Schedule controlled via application_scheduler_configuration (key: GENERIC_TPA_SYNC_PRODUCER).
    async runProducer(): Promise<void> {
        const configs = await this.appRefRepo.find({ where: { flowType: "SYNC", isActive: true } });
        if (configs.length === 0) return;

        this.logInfo("runProducer", `Checking ${configs.length} SYNC configs`);

        for (const config of configs) {
            if (!config.syncSchedule || !isCronDue(config.syncSchedule)) continue;

            this.logInfo("runProducer", `Schedule due for "${config.label}" (scope=${config.syncScope ?? "GLOBAL"})`);
            await this.createJobsForConfig(config).catch((err) => {
                this.logError("runProducer", `Failed to create jobs for "${config.label}": ${err.message}`);
            });
        }
    }

    private async createJobsForConfig(config: MstrExtApplicationRef): Promise<void> {
        const scope = (config.syncScope as SyncJobScopeType) ?? SyncJobScopeType.GLOBAL;
        const syncType = config.label;

        if (scope === SyncJobScopeType.GLOBAL) {
            await this.enqueueJob(config.id, syncType, scope, null, {});

        } else if (scope === SyncJobScopeType.PER_TPA) {
            const featureConfigs = await this.featureConfigRepo.find({
                where: { appRefId: config.id, isActive: true },
                select: ["tpaId"],
            });
            const tpaIds = [...new Set(featureConfigs.map((f) => f.tpaId).filter(Boolean) as number[])];
            for (const tpaId of tpaIds) {
                await this.enqueueJob(config.id, syncType, scope, tpaId, { tpaId: String(tpaId) });
            }
            this.logInfo("runProducer", `"${config.label}" PER_TPA — enqueued ${tpaIds.length} jobs`);

        } else if (scope === SyncJobScopeType.PER_POLICY) {
            // Get TPAs configured for this app ref — only sync policies belonging to those TPAs
            const featureConfigs = await this.featureConfigRepo.find({
                where: { appRefId: config.id, isActive: true },
                select: ["tpaId"],
            });
            const tpaIds = [...new Set(featureConfigs.map((f) => f.tpaId).filter(Boolean) as number[])];

            if (tpaIds.length === 0) {
                this.logInfo("runProducer", `"${config.label}" PER_POLICY — no active TPA configs, skipping`);
                return;
            }

            const policies = await this.policyRepo
                .createQueryBuilder("p")
                .innerJoin("policy_tpa_map", "ptm", "ptm.policy_id = p.id")
                .where("p.insurer_policy_number IS NOT NULL")
                .andWhere("p.policy_to >= NOW()")
                .andWhere("ptm.tpa_id IN (:...tpaIds)", { tpaIds })
                .select(["p.id", "p.insurerPolicyNumber", "p.policyFrom", "p.policyTo", "p.externalInsurerName", "p.externalTpaPolicyId"])
                .getMany();

            for (const policy of policies) {
                const fmt = (d: Date) => {
                    const dt = new Date(d);
                    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
                };
                await this.enqueueJob(config.id, syncType, scope, policy.id, {
                    policyNumber: policy.insurerPolicyNumber,
                    policyId: String(policy.id),
                    policyCommencementDate: fmt(policy.policyFrom),
                    policyValidUpdate: fmt(policy.policyTo),
                    startDate: fmt(policy.policyFrom),
                    endDate: fmt(policy.policyTo),
                    ...(policy.externalInsurerName ? { insurerName: policy.externalInsurerName } : {}),
                    ...(policy.externalTpaPolicyId ? { entityId: policy.externalTpaPolicyId } : {}),
                });
            }
            this.logInfo("runProducer", `"${config.label}" PER_POLICY — enqueued ${policies.length} jobs for TPAs [${tpaIds.join(",")}]`);
        }
    }

    private async enqueueJob(
        appRefId: number,
        syncType: string,
        scopeType: SyncJobScopeType,
        scopeId: number | null,
        dynamicParams: Record<string, string>,
    ): Promise<void> {
        // Check TTL — skip if a COMPLETED job exists for this scope within syncTtlHours
        const appRef = await this.appRefRepo.findOne({ where: { id: appRefId }, select: ["syncTtlHours"] });
        const ttlHours = appRef?.syncTtlHours ?? 24;
        const ttlCutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);

        const recentJob = await this.syncJobRepo.findOne({
            where: {
                appRefId,
                scopeType,
                scopeId: scopeId ?? undefined,
                status: SyncJobStatus.COMPLETED,
                completedAt: MoreThan(ttlCutoff),
            },
            order: { completedAt: "DESC" },
        });

        if (recentJob?.completedAt && recentJob.completedAt > ttlCutoff) {
            this.logInfo("runProducer", `TTL hit — "${syncType}" scope=${scopeId ?? "global"} synced ${Math.round((Date.now() - recentJob.completedAt.getTime()) / 3600000)}h ago, skipping`);
            return;
        }

        // Skip if a PENDING or PROCESSING job already exists for this scope
        const existingActive = await this.syncJobRepo.findOne({
            where: {
                appRefId,
                scopeType,
                scopeId: scopeId ?? undefined,
                status: In([SyncJobStatus.PENDING, SyncJobStatus.PROCESSING]),
            },
        });
        if (existingActive) {
            this.logInfo("runProducer", `Active job already exists for "${syncType}" scope=${scopeId ?? "global"} — skipping`);
            return;
        }

        const job = this.syncJobRepo.create({
            appRefId,
            syncType,
            scopeType,
            scopeId,
            priority: SyncJobPriority.NORMAL,
            status: SyncJobStatus.PENDING,
            dynamicParams,
        });
        await this.syncJobRepo.save(job);
        this.logInfo("runProducer", `Created job id=${job.id} "${syncType}" scope=${scopeId ?? "global"}`);
    }

    // Picks up to WORKER_BATCH_SIZE pending job ids, round-robin across
    // distinct app_ref_id groups (via ROW_NUMBER partitioned by app_ref_id),
    // instead of pure global FIFO. Without this, a single high-volume TPA
    // (e.g. many Claims/Hospital-Network jobs queued back-to-back) can
    // permanently starve out a lower-volume TPA's jobs, since strict
    // createdAt-ASC ordering always drains the oldest group first and never
    // reaches the others while that group keeps refilling.
    private async pickFairPendingJobIds(
        queryRunner: QueryRunner,
        batchSize: number,
    ): Promise<number[]> {
        const distinctGroups: Array<{ app_ref_id: number }> = await queryRunner.manager.query(
            `SELECT DISTINCT app_ref_id FROM sync_job WHERE status = $1`,
            [SyncJobStatus.PENDING],
        );
        const groupCount = distinctGroups.length;
        if (groupCount === 0) return [];

        const perGroupLimit = Math.max(1, Math.ceil(batchSize / groupCount));
        // Every group's rank-1 row must always fit — otherwise, once distinct
        // active groups exceed batchSize, the outer LIMIT could cut off a
        // group's only candidate before it's ever picked, silently reviving
        // the same starvation this fix exists to prevent. Widening the cap
        // to cover at least one row per group makes "every active group gets
        // picked every run" unconditional rather than true only while
        // groupCount <= batchSize.
        const cap = Math.max(batchSize, groupCount);

        const rows: Array<{ id: number }> = await queryRunner.manager.query(
            `SELECT id FROM (
               SELECT id, ROW_NUMBER() OVER (
                 PARTITION BY app_ref_id
                 ORDER BY (priority = 'HIGH') DESC, created_at ASC
               ) AS rn
               FROM sync_job
               WHERE status = $1
             ) ranked
             WHERE rn <= $2
             ORDER BY rn ASC
             LIMIT $3`,
            [SyncJobStatus.PENDING, perGroupLimit, cap],
        );
        return rows.map((r) => r.id);
    }

    // Same fairness fix as pickFairPendingJobIds above, but for raw_sync_response
    // (used by the parser) — round-robin across app_ref_id groups instead of
    // plain receivedAt-ASC FIFO, so one TPA's high volume of raw responses
    // can't perpetually starve out a lower-volume TPA's from ever being parsed.
    private async pickFairRawResponseIds(
        queryRunner: QueryRunner,
        batchSize: number,
    ): Promise<number[]> {
        const distinctGroups: Array<{ app_ref_id: number }> = await queryRunner.manager.query(
            `SELECT DISTINCT app_ref_id FROM raw_sync_response WHERE processing_status = $1`,
            [RawSyncResponseStatus.RECEIVED],
        );
        const groupCount = distinctGroups.length;
        if (groupCount === 0) return [];

        const perGroupLimit = Math.max(1, Math.ceil(batchSize / groupCount));
        const cap = Math.max(batchSize, groupCount);

        const rows: Array<{ id: number }> = await queryRunner.manager.query(
            `SELECT id FROM (
               SELECT id, ROW_NUMBER() OVER (
                 PARTITION BY app_ref_id
                 ORDER BY received_at ASC
               ) AS rn
               FROM raw_sync_response
               WHERE processing_status = $1
             ) ranked
             WHERE rn <= $2
             ORDER BY rn ASC
             LIMIT $3`,
            [RawSyncResponseStatus.RECEIVED, perGroupLimit, cap],
        );
        return rows.map((r) => r.id);
    }

    // ─── Step 2: Worker ───────────────────────────────────────────────────────
    // Picks PENDING sync_jobs, calls TPA API via document-service, stores raw response.
    // Schedule controlled via application_scheduler_configuration (key: GENERIC_TPA_SYNC_WORKER).
    async runWorker(): Promise<void> {
        await this.recoverStuckJobs();

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let jobs: SyncJob[] = [];
        try {
            const fairIds = await this.pickFairPendingJobIds(queryRunner, WORKER_BATCH_SIZE);
            jobs = fairIds.length
                ? await queryRunner.manager
                    .getRepository(SyncJob)
                    .createQueryBuilder("j")
                    .where("j.id IN (:...ids)", { ids: fairIds })
                    .andWhere("j.status = :status", { status: SyncJobStatus.PENDING })
                    .orderBy("j.priority = 'HIGH'", "DESC")
                    .addOrderBy("j.createdAt", "ASC")
                    .setLock("pessimistic_write")
                    .setOnLocked("skip_locked")
                    .getMany()
                : [];

            if (jobs.length > 0) {
                await queryRunner.manager.getRepository(SyncJob).update(
                    { id: In(jobs.map((j) => j.id)) },
                    { status: SyncJobStatus.PROCESSING, startedAt: new Date() },
                );
            }
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }

        if (jobs.length === 0) return;
        this.logInfo("runWorker", `Picked ${jobs.length} jobs`);

        for (const job of jobs) {
            await this.processWorkerJob(job);
        }
    }

    private async processWorkerJob(job: SyncJob): Promise<void> {
        this.logInfo("runWorker", `>>> jobId=${job.id} type="${job.syncType}" scope=${job.scopeType} scopeId=${job.scopeId ?? "global"}`);

        const appConfig = await this.appRefRepo.findOne({ where: { id: job.appRefId } });
        if (!appConfig) {
            await this.syncJobRepo.update(job.id, {
                status: SyncJobStatus.FAILED,
                completedAt: new Date(),
                errorMessage: `appRefId=${job.appRefId} not found`,
            });
            return;
        }

        let lastError = "";
        for (let attempt = 0; attempt <= DEFAULT_RETRY_COUNT; attempt++) {
            try {
                const documentServiceUrl = `${ENV["URL_DOCUMENT_SERVICE"] ?? "http://localhost:3013"}/external-app-sso/magic-url`;
                const systemToken = jwt.sign(
                    { userDetails: { emailId: "system-cron@iirm.com" } },
                    ENV["JWT_SECRET"] ?? "secret",
                    { expiresIn: "5m" }
                );

                this.logInfo("runWorker", `jobId=${job.id} attempt=${attempt + 1} → POST ${documentServiceUrl} appKey="${appConfig.label}"`);

                const res = await axios.post(
                    documentServiceUrl,
                    {
                        appKey: appConfig.label,
                        dynamicFields: job.dynamicParams ?? {},
                        // getContextId() in document-service resolves "policy"/"employee" source_type
                        // field mappings off these top-level ids, not off dynamicFields — PER_POLICY jobs
                        // must pass policyId here or every DB-column field mapping resolves to null.
                        policyId: job.scopeType === SyncJobScopeType.PER_POLICY ? job.scopeId ?? undefined : undefined,
                    },
                    { timeout: 120_000, headers: { Authorization: `Bearer ${systemToken}` } },
                );

                // Unwrap document-service HTTP wrapper ({ statusCode, message, data }) → store just data
                const rawData = res.data?.data !== undefined ? res.data.data : res.data;
                this.logInfo("runWorker", `jobId=${job.id} ← status=${res.status} responseKeys=${Object.keys(rawData ?? {}).join(",")}`);

                // Store raw response
                const rawRecord = this.rawSyncRepo.create({
                    jobId: job.id,
                    appRefId: job.appRefId,
                    syncType: job.syncType,
                    scopeType: job.scopeType,
                    scopeId: job.scopeId,
                    responsePayload: Array.isArray(rawData) ? rawData : [rawData],
                    processingStatus: RawSyncResponseStatus.RECEIVED,
                    receivedAt: new Date(),
                });
                await this.rawSyncRepo.save(rawRecord);
                this.logInfo("runWorker", `jobId=${job.id} raw response stored id=${rawRecord.id}`);

                await this.syncJobRepo.update(job.id, {
                    status: SyncJobStatus.COMPLETED,
                    completedAt: new Date(),
                    errorMessage: null,
                });
                return;
            } catch (err: any) {
                lastError = err.message;
                if (attempt < DEFAULT_RETRY_COUNT) {
                    this.logWarn("runWorker", `jobId=${job.id} attempt ${attempt + 1} failed: ${lastError} — retrying`);
                    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
                }
            }
        }

        await this.syncJobRepo.update(job.id, {
            status: SyncJobStatus.FAILED,
            completedAt: new Date(),
            errorMessage: lastError,
            retryCount: () => `retry_count + 1`,
        });
        this.logError("runWorker", `jobId=${job.id} FAILED after ${DEFAULT_RETRY_COUNT + 1} attempts: ${lastError}`);
    }

    // ─── Step 3: Parser ───────────────────────────────────────────────────────
    // Picks RECEIVED raw_sync_response rows, applies DB_COLUMN response mappings,
    // upserts into the target tables defined on mstr_ext_application_ref.
    // Schedule controlled via application_scheduler_configuration (key: GENERIC_TPA_SYNC_PARSER).
    async runParser(): Promise<void> {
        await this.recoverStuckRawResponses();
        this.logInfo("runParser", "Checking for raw responses to process");
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let responses: RawSyncResponse[] = [];
        try {
            const fairIds = await this.pickFairRawResponseIds(queryRunner, PARSER_BATCH_SIZE);
            responses = fairIds.length
                ? await queryRunner.manager
                    .getRepository(RawSyncResponse)
                    .createQueryBuilder("r")
                    .where("r.id IN (:...ids)", { ids: fairIds })
                    .andWhere("r.processingStatus = :status", { status: RawSyncResponseStatus.RECEIVED })
                    .orderBy("r.receivedAt", "ASC")
                    .setLock("pessimistic_write")
                    .setOnLocked("skip_locked")
                    .getMany()
                : [];

            // Mark PROCESSING atomically with the pick — same transaction —
            // so a slow record-by-record parse (e.g. an 11k-record response)
            // can't be re-picked by the next cycle while still in flight.
            if (responses.length > 0) {
                await queryRunner.manager.getRepository(RawSyncResponse).update(
                    { id: In(responses.map((r) => r.id)) },
                    { processingStatus: RawSyncResponseStatus.PROCESSING },
                );
            }
            await queryRunner.commitTransaction();
        } catch (err) {
            this.logError("runParser", err)
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }

        if (responses.length === 0) return;
        this.logInfo("runParser", `Picked ${responses.length} raw responses to process`);

        for (const raw of responses) {
            await this.parseRawResponse(raw);
        }
    }

    private async parseRawResponse(raw: RawSyncResponse): Promise<void> {
        this.logInfo("runParser", `>>> rawId=${raw.id} type="${raw.syncType}" scope=${raw.scopeType} scopeId=${raw.scopeId ?? "global"} records=${raw.responsePayload?.length ?? 0}`);
        try {
            const appConfig = await this.appRefRepo.findOne({ where: { id: raw.appRefId } });
            if (!appConfig) throw new Error(`appRefId=${raw.appRefId} not found`);

            // Resolve actual TPA ID (not policy ID) for tpa_id column injection
            const featureConfig = await this.featureConfigRepo.findOne({ where: { appRefId: raw.appRefId, isActive: true } });
            const syncTpaId: number | null = featureConfig?.tpaId ?? null;

            const mappings = await this.mappingRepo.find({
                where: { appRefId: raw.appRefId },
                order: { step: "ASC", displayOrder: "ASC" },
            });

            const step2DbMappings = mappings.filter((m) => m.step === 2 && m.targetType === "DB_COLUMN");
            if (step2DbMappings.length === 0) {
                this.logWarn("runParser", `rawId=${raw.id} — no DB_COLUMN mappings for appRefId=${raw.appRefId}, marking PROCESSED (nothing to write)`);
                await this.rawSyncRepo.update(raw.id, { processingStatus: RawSyncResponseStatus.PROCESSED });
                return;
            }

            // Group mappings by target table — supports writing to multiple tables per record
            const tableGroups = new Map<string, MstrExtAppResponseMapping[]>();
            for (const m of step2DbMappings) {
                const tbl = m.targetTable ?? appConfig.syncTargetTable;
                if (!tbl) continue;
                if (!tableGroups.has(tbl)) tableGroups.set(tbl, []);
                tableGroups.get(tbl)!.push(m);
            }

            if (tableGroups.size === 0) {
                this.logWarn("runParser", `rawId=${raw.id} — no target tables resolvable, marking PROCESSED`);
                await this.rawSyncRepo.update(raw.id, { processingStatus: RawSyncResponseStatus.PROCESSED });
                return;
            }

            this.logInfo("runParser", `rawId=${raw.id} — writing to tables: ${[...tableGroups.keys()].join(", ")}`);

            // Cache table columns to avoid repeated queries
            const tableColumnCache = new Map<string, Set<string>>();
            const getTableColumns = async (tableName: string): Promise<Set<string>> => {
                if (tableColumnCache.has(tableName)) return tableColumnCache.get(tableName)!;
                const cols: { column_name: string }[] = await this.dataSource.query(
                    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
                    [tableName],
                );
                const set = new Set(cols.map((c) => c.column_name));
                tableColumnCache.set(tableName, set);
                return set;
            };

            // json/jsonb columns need a valid JSON value, not a bare TPA response string —
            // e.g. a plain "Good Health Insurance" string fails Postgres' json parser, it must
            // be serialized to '"Good Health Insurance"' first.
            const jsonColumnCache = new Map<string, Set<string>>();
            const getJsonColumns = async (tableName: string): Promise<Set<string>> => {
                if (jsonColumnCache.has(tableName)) return jsonColumnCache.get(tableName)!;
                const cols: { column_name: string }[] = await this.dataSource.query(
                    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND data_type IN ('json','jsonb')`,
                    [tableName],
                );
                const set = new Set(cols.map((c) => c.column_name));
                jsonColumnCache.set(tableName, set);
                return set;
            };

            // Primary table first (for FK relationships across tables)
            const primaryTable = appConfig.syncTargetTable;
            const orderedTables = primaryTable
                ? [primaryTable, ...[...tableGroups.keys()].filter((t) => t !== primaryTable)]
                : [...tableGroups.keys()];

            // Auto-detect the array path from response mapping keys that contain ".0."
            // e.g. "hospitalsResponse.0.HOSPITALNAME" → arrayPath="hospitalsResponse", fieldKey="HOSPITALNAME"
            // A response can have more than one top-level array (e.g. FHPL's "Table"/"Table1" dataset
            // shape) — only mappings with an outputKey actually drive extraction, and among those we
            // want the array path used by the most mappings, not just the first ".0." match found
            // (which could be an incidental/unmapped array like a "Table.0.count" metadata row).
            const arrayPathCounts = new Map<string, number>();
            for (const m of step2DbMappings) {
                if (!m.outputKey || !m.responseKey.includes(".0.")) continue;
                const path = m.responseKey.split(".0.")[0];
                arrayPathCounts.set(path, (arrayPathCounts.get(path) ?? 0) + 1);
            }
            const arrayPath = [...arrayPathCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

            // Flatten: for each stored payload object, extract the array using arrayPath, then iterate items
            // Handles both formats: unwrapped {hospitalsResponse:[...]} and wrapped {data:{hospitalsResponse:[...]}}
            const allRecords: any[] = [];
            for (const payloadObj of raw.responsePayload) {
                const unwrapped = payloadObj?.data !== undefined ? payloadObj.data : payloadObj;
                if (arrayPath) {
                    const items = ensureArray(unwrapped, arrayPath);
                    allRecords.push(...items);
                } else {
                    allRecords.push(unwrapped);
                }
            }

            this.logInfo("runParser", `rawId=${raw.id} — arrayPath=${arrayPath ?? "none"} totalRecords=${allRecords.length}`);
            if (allRecords.length > 0) {
                const r0 = allRecords[0];
                this.logInfo("runParser", `rawId=${raw.id} FIRST_RECORD_KEYS=${Object.keys(r0).join(",")} | ADDRESS1="${r0["ADDRESS1"] ?? "MISSING"}" | HOSPITAL_NAME="${r0["HOSPITAL_NAME"] ?? "MISSING"}"`);
            }

            let upserted = 0;
            let failed = 0;

            // Raw SQL helpers: bypass TypeORM entity metadata (which maps camelCase property names,
            // not snake_case column names) by going directly to pg with explicit column name strings.
            const rawInsert = async (tableName: string, row: Record<string, any>): Promise<number | null> => {
                const columns = Object.keys(row);
                if (columns.length === 0) return null;
                const values = columns.map(c => row[c]);
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
                const sql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders}) RETURNING id`;
                const result = await this.dataSource.query(sql, values);
                return result?.[0]?.id ?? null;
            };

            const rawUpdate = async (tableName: string, row: Record<string, any>, id: number): Promise<void> => {
                const columns = Object.keys(row);
                if (columns.length === 0) return;
                const setClauses = columns.map((c, i) => `"${c}" = $${i + 1}`).join(", ");
                const values = [...columns.map(c => row[c]), id];
                const sql = `UPDATE "${tableName}" SET ${setClauses} WHERE id = $${columns.length + 1}`;
                await this.dataSource.query(sql, values);
            };

            // Secondary tables (non-primary) written first so their IDs can be FK-injected into primary.
            // FK injection rule: table "mstr_hospital_address" last segment = "address" → injects "address_id" into primary.
            const secondaryTables = orderedTables.filter(t => t !== primaryTable);

            const buildRow = async (tableMappings: MstrExtAppResponseMapping[], record: any, tableColumns: Set<string>, tableName: string): Promise<Record<string, any>> => {
                const jsonColumns = await getJsonColumns(tableName);
                const row: Record<string, any> = { updated_at: new Date(), updated_by: SYSTEM_USER_ID };
                for (const m of tableMappings) {
                    if (!m.outputKey) continue; // skip mappings with no column name set
                    // Guard against stale/mismatched mapping rows (e.g. an outputKey left over from
                    // a STANDARD_KEY-style config) whose column no longer exists on this table —
                    // one bad row shouldn't fail the INSERT for the whole record.
                    if (!tableColumns.has(m.outputKey)) {
                        this.logWarn("runParser", `outputKey="${m.outputKey}" is not a column on this table — skipping mapping (id=${m.id})`);
                        continue;
                    }
                    const fieldKey = arrayPath && m.responseKey.startsWith(`${arrayPath}.0.`)
                        ? m.responseKey.slice(`${arrayPath}.0.`.length)
                        : m.responseKey;
                    const extracted = extractDotNotation(record, fieldKey) || null;
                    // json/jsonb columns reject a bare TPA string ("Good Health Insurance") — it
                    // must be valid JSON, so wrap it as a JSON string value instead.
                    row[m.outputKey] = (jsonColumns.has(m.outputKey) && extracted !== null && typeof extracted === "string")
                        ? JSON.stringify(extracted)
                        : extracted;
                }
                if (syncTpaId !== null && tableColumns.has("tpa_id") && !("tpa_id" in row)) {
                    row["tpa_id"] = syncTpaId;
                }
                // PER_POLICY scope: raw.scopeId = policy.id — inject as policy_id if table needs it
                if (raw.scopeType === "PER_POLICY" && raw.scopeId && tableColumns.has("policy_id") && !("policy_id" in row)) {
                    row["policy_id"] = raw.scopeId;
                }
                if (tableColumns.has("source") && !("source" in row)) {
                    row["source"] = "API_SYNC";
                }
                if (tableColumns.has("raw_data") && !("raw_data" in row)) {
                    row["raw_data"] = record;
                }
                return row;
            };

            for (const [recIdx, record] of allRecords.entries()) {
                // IDs from secondary table inserts — injected as FKs into primary table
                // e.g. inserted id from "mstr_hospital_address" → row["address_id"]
                const secondaryIds: Record<string, number> = {};

                // ── secondary tables (address etc.) ──────────────────────────
                for (const targetTable of secondaryTables) {
                    const tableMappings = tableGroups.get(targetTable);
                    if (!tableMappings) continue;
                    const tableColumns = await getTableColumns(targetTable);
                    const row = await buildRow(tableMappings, record, tableColumns, targetTable);
                    if (recIdx === 0) {
                        this.logInfo("runParser", `[rec#0] ${targetTable} row keys=${Object.keys(row).filter(k => k !== 'raw_data').join(",")} | address_line_1=${row["address_line_1"] ?? "NULL"}`);
                    }
                    try {
                        row["created_at"] = new Date();
                        row["created_by"] = SYSTEM_USER_ID;
                        const newId = await rawInsert(targetTable, row);
                        if (newId) secondaryIds[targetTable] = newId;
                        if (recIdx === 0) this.logInfo("runParser", `[rec#0] ${targetTable} inserted id=${newId}`);
                        upserted++;
                    } catch (err: any) {
                        failed++;
                        this.logError("runParser", `rawId=${raw.id} table=${targetTable} row upsert failed: ${err.message}`);
                    }
                }

                // ── primary table ─────────────────────────────────────────────
                if (!primaryTable) continue;
                const tableMappings = tableGroups.get(primaryTable);
                if (!tableMappings) continue;
                const tableColumns = await getTableColumns(primaryTable);
                const row = await buildRow(tableMappings, record, tableColumns, primaryTable);

                // Inject FK IDs from secondary tables: "mstr_hospital_address" last segment "address" → "address_id"
                for (const [tbl, id] of Object.entries(secondaryIds)) {
                    const lastSegment = tbl.split("_").pop()!;
                    const fkCol = `${lastSegment}_id`;
                    if (tableColumns.has(fkCol) && !(fkCol in row)) {
                        row[fkCol] = id;
                    }
                }

                // ── policy_claim enrichment: resolve employee_id and dependent_id ──
                // employee_id: look up policy_enrollment_employee_policy_map by employee_tpa_id
                //   (scoped to policy_id when available — TPA card IDs are policy-specific)
                // dependent_id: look up policy_enrollment_dependent by patient_tpa_id
                if (primaryTable === "policy_claim") {
                    const empTpaId = row["employee_tpa_id"] as string | null;
                    if (empTpaId && tableColumns.has("employee_id") && !row["employee_id"]) {
                        let empMap = row["policy_id"]
                            ? await this.enrollmentMapRepo.findOne({
                                  where: {
                                      employeeTpaId: empTpaId,
                                      policyId: Number(row["policy_id"]),
                                  },
                                  select: ["employeeId"],
                              })
                            : null;

                        // Fall back to searching every policy under the same company —
                        // TPA card IDs can be tagged against the wrong policy_id on renewal
                        // (the claim's assigned policy_id doesn't always match the policy the
                        // employee's own TPA card is recorded under, e.g. across renewal
                        // periods), so a strict single-policy match can miss a real employee
                        // that genuinely exists elsewhere in the same company.
                        if (!empMap?.employeeId && row["policy_id"]) {
                            const policy = await this.policyRepo.findOne({
                                where: { id: Number(row["policy_id"]) },
                                select: ["companyId"],
                            });
                            if (policy?.companyId) {
                                empMap = await this.enrollmentMapRepo
                                    .createQueryBuilder("peepm")
                                    .innerJoin("policy", "p", "p.id = peepm.policyId")
                                    .where("peepm.employeeTpaId = :empTpaId", { empTpaId })
                                    .andWhere("p.companyId = :companyId", { companyId: policy.companyId })
                                    .andWhere("peepm.deletedAt IS NULL")
                                    .select(["peepm.employeeId"])
                                    .getOne();
                            }
                        }

                        if (empMap?.employeeId) {
                            row["employee_id"] = empMap.employeeId;
                            this.logInfo("runParser", `rawId=${raw.id} employee_tpa_id="${empTpaId}" → employee_id=${empMap.employeeId}`);
                        }
                    }

                    const patientRelation = (row["patient_relation"] as string | null) ?? null;
                    const isSelfClaim = !patientRelation || patientRelation.trim().toLowerCase() === "self";

                    if (!isSelfClaim && tableColumns.has("dependent_id") && !row["dependent_id"]) {
                        const patTpaId = row["patient_tpa_id"] as string | null;
                        let dep = patTpaId
                            ? await this.enrollmentDependentRepo.findOne({
                                  where: { dependentTpaId: patTpaId },
                                  select: ["id"],
                              })
                            : null;

                        // Fallback: some TPAs (e.g. Good Health) never send a distinct
                        // per-dependent ID — only PATIENT_NAME + PATIENT_RELATION — so there's
                        // nothing for the ID-based lookup above to ever match for those. Match
                        // by name + relation instead, scoped strictly to this claim's own
                        // already-resolved employee_id so it can never match a dependent
                        // belonging to a different employee.
                        const patientName = (row["patient_name"] as string | null) ?? null;
                        if (!dep?.id && patientName && row["employee_id"]) {
                            dep = await this.enrollmentDependentRepo
                                .createQueryBuilder("dep")
                                .where("dep.employeeId = :employeeId", { employeeId: Number(row["employee_id"]) })
                                .andWhere("LOWER(TRIM(dep.name)) = LOWER(TRIM(:patientName))", { patientName })
                                .andWhere(
                                    "(LOWER(TRIM(dep.relation)) = LOWER(TRIM(:relation)) OR LOWER(TRIM(dep.relationshipType)) = LOWER(TRIM(:relation)))",
                                    { relation: patientRelation },
                                )
                                .select(["dep.id"])
                                .getOne();
                            if (dep?.id) {
                                this.logInfo("runParser", `rawId=${raw.id} name+relation fallback patientName="${patientName}" relation="${patientRelation}" employeeId=${row["employee_id"]} → dependent_id=${dep.id}`);
                            }
                        }

                        if (dep?.id) {
                            row["dependent_id"] = dep.id;
                            this.logInfo("runParser", `rawId=${raw.id} patient_tpa_id="${patTpaId}" → dependent_id=${dep.id}`);
                        }
                    }
                }

                const dedupColumn = appConfig.syncDedupColumn;
                if (recIdx === 0) {
                    this.logInfo("runParser", `[rec#0] dedupColumn="${dedupColumn}" row.external_hospital_id="${row["external_hospital_id"]}" row.keys=${Object.keys(row).filter(k => k !== "raw_data").join(",")}`);
                }
                try {
                    let primaryRowId: number | null = null;

                    if (dedupColumn && row[dedupColumn]) {
                        // Raw SQL dedup — match on external ID only, not tpa_id (existing rows may have null tpa_id from old runs)
                        const dedupSql = `SELECT id${tableColumns.has("address_id") ? ", address_id" : ""} FROM "${primaryTable}" WHERE "${dedupColumn}" = $1 LIMIT 1`;
                        const [existing] = await this.dataSource.query(dedupSql, [row[dedupColumn]]);
                        if (recIdx === 0) this.logInfo("runParser", `[rec#0] dedup → existing=${JSON.stringify(existing)}`);

                        if (existing?.id) {
                            // For UPDATE: reuse the existing address row; update it in-place
                            if (existing.address_id && secondaryIds["mstr_hospital_address"]) {
                                const addrRow = await buildRow(tableGroups.get("mstr_hospital_address") ?? [], record, await getTableColumns("mstr_hospital_address"), "mstr_hospital_address");
                                addrRow["updated_at"] = new Date();
                                await rawUpdate("mstr_hospital_address", addrRow, existing.address_id);
                                row["address_id"] = existing.address_id;
                                // Remove the newly inserted duplicate address row
                                if (secondaryIds["mstr_hospital_address"] !== existing.address_id) {
                                    await this.dataSource.query(`DELETE FROM mstr_hospital_address WHERE id = $1`, [secondaryIds["mstr_hospital_address"]]);
                                }
                            }
                            await rawUpdate(primaryTable, row, existing.id);
                            primaryRowId = existing.id;
                        } else {
                            row["created_at"] = new Date();
                            row["created_by"] = SYSTEM_USER_ID;
                            primaryRowId = await rawInsert(primaryTable, row);
                        }
                    } else {
                        row["created_at"] = new Date();
                        row["created_by"] = SYSTEM_USER_ID;
                        primaryRowId = await rawInsert(primaryTable, row);
                    }
                    upserted++;

                    // ── policy_claim: upsert tpa_claim_data and link tpa_claim_ref_id ──
                    // Stores the raw TPA record and writes its ID back into policy_claim.tpa_claim_ref_id
                    // so the claim row is always traceable to the exact raw payload it came from.
                    if (primaryTable === "policy_claim" && primaryRowId) {
                        const tpaClaimNo = (row["tpa_claim_no"] ?? null) as string | null;
                        const policyNumber = (row["policy_number"] ?? null) as string | null;
                        if (tpaClaimNo && policyNumber) {
                            try {
                                const [tpaDataRow] = await this.dataSource.query(
                                    `INSERT INTO tpa_claim_data
                                       (policy_number, tpa_claim_no, employee_tpa_id, data_type, claim_data, fetched_at, created_at, created_by, updated_at, updated_by)
                                     VALUES ($1, $2, $3, 'TPA_SYNC', $4, NOW(), NOW(), $5, NOW(), $5)
                                     ON CONFLICT (policy_number, tpa_claim_no, data_type) DO UPDATE
                                       SET claim_data      = EXCLUDED.claim_data,
                                           employee_tpa_id = EXCLUDED.employee_tpa_id,
                                           fetched_at      = NOW(),
                                           updated_at      = NOW()
                                     RETURNING id`,
                                    [policyNumber, tpaClaimNo, row["employee_tpa_id"] ?? null, record, SYSTEM_USER_ID],
                                );
                                if (tpaDataRow?.id) {
                                    await this.dataSource.query(
                                        `UPDATE policy_claim SET tpa_claim_ref_id = $1 WHERE id = $2`,
                                        [tpaDataRow.id, primaryRowId],
                                    );
                                    this.logInfo("runParser", `rawId=${raw.id} claim id=${primaryRowId} → tpa_claim_ref_id=${tpaDataRow.id}`);
                                }
                            } catch (linkErr: any) {
                                this.logWarn("runParser", `rawId=${raw.id} tpa_claim_data link failed: ${linkErr.message}`);
                            }
                        }
                    }
                } catch (err: any) {
                    failed++;
                    this.logError("runParser", `rawId=${raw.id} table=${primaryTable} row upsert failed: ${err.message}`);
                }
            }

            await this.rawSyncRepo.update(raw.id, {
                processingStatus: RawSyncResponseStatus.PROCESSED,
                errorMessage: null,
            });
            this.logInfo("runParser", `rawId=${raw.id} done — upserted=${upserted} failed=${failed} records=${allRecords.length}`);
        } catch (err: any) {
            await this.rawSyncRepo.update(raw.id, {
                processingStatus: RawSyncResponseStatus.FAILED,
                errorMessage: err.message,
            });
            this.logError("runParser", `rawId=${raw.id} FAILED: ${err.message}`);
        }
    }

    // ─── Cleanup — daily at 3 AM ───────────────────────────────────────────────
    @Cron("0 3 * * *")
    async runCleanup(): Promise<void> {
        if (IS_DEMO_ENVIRONMENT) {
            return;
        }
        const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
        const result = await this.rawSyncRepo.delete({
            processingStatus: RawSyncResponseStatus.PROCESSED,
            createdAt: LessThan(cutoff),
        });
        this.logInfo("runCleanup", `Deleted ${result.affected ?? 0} PROCESSED raw responses older than ${RETENTION_DAYS} days`);
    }

    // ─── Structured log helpers ───────────────────────────────────────────────
    private logInfo(method: string, messageData: unknown) {
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "GenericTpaSyncScheduler", method, messageData }) });
    }
    private logWarn(method: string, messageData: unknown) {
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "GenericTpaSyncScheduler", method, messageData }) });
    }
    private logError(method: string, messageData: unknown) {
        this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "GenericTpaSyncScheduler", method, messageData }) });
    }

    // ─── Crash recovery ───────────────────────────────────────────────────────
    private async recoverStuckJobs(): Promise<void> {
        const threshold = new Date(Date.now() - STUCK_JOB_THRESHOLD_MS);
        const stuck = await this.syncJobRepo.find({
            where: { status: SyncJobStatus.PROCESSING, startedAt: LessThan(threshold) },
            select: ["id"],
        });
        if (stuck.length === 0) return;
        await this.syncJobRepo.update(
            { id: In(stuck.map((j) => j.id)) },
            { status: SyncJobStatus.PENDING, startedAt: null },
        );
        this.logWarn("runWorker", `Recovered ${stuck.length} stuck PROCESSING jobs`);
    }

    // raw_sync_response has no dedicated startedAt column — updatedAt is bumped
    // by @UpdateDateColumn whenever runParser sets PROCESSING, so it doubles as
    // the "when did this start" marker for stuck-row recovery here.
    private async recoverStuckRawResponses(): Promise<void> {
        const threshold = new Date(Date.now() - STUCK_JOB_THRESHOLD_MS);
        const stuck = await this.rawSyncRepo.find({
            where: { processingStatus: RawSyncResponseStatus.PROCESSING, updatedAt: LessThan(threshold) },
            select: ["id"],
        });
        if (stuck.length === 0) return;
        await this.rawSyncRepo.update(
            { id: In(stuck.map((r) => r.id)) },
            { processingStatus: RawSyncResponseStatus.RECEIVED },
        );
        this.logWarn("runParser", `Recovered ${stuck.length} stuck PROCESSING raw responses`);
    }
}
