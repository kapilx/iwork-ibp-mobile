import { ConflictException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import axios from "axios";
import Redis from "ioredis";
import { InjectRepository } from "@nestjs/typeorm";
import { createRedisClient } from "../../../../service-lib/src/lib/utils/redis.util";
import { In, Repository } from "typeorm";
import { AdminReportParameter } from "../../../../service-lib/src/lib/entities";
import { TpaClaimData } from "../../../../service-lib/src/lib/entities/tpa-claim-data.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { PolicyClaim } from "../../../../service-lib/src/lib/entities/policy-employee-claim.entity";
import { PolicyClaimSettlement } from "../../../../service-lib/src/lib/entities/policy-employee-claim-settlement.entity";
import { PolicyEnrollmentEmployee } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity";
import { PolicyEnrollmentEmployeePolicyMap } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity";
import { CreateExternalHrDto } from "./dto/create-external-hr.dto";
import { UpdateExternalHrDto } from "./dto/update-external-hr.dto";
import {
  applyPasswordProtection,
  generatePasswordFromConfig,
  isPasswordProtectionEnabled,
} from "../../../../service-lib/src/lib/utils/password-protection.utils";
import { USER_STATUS_ACTIVE, USER_STATUS_INACTIVE } from "../../../../../../libs/service-lib/src/lib/constants";
import { FilePasswordConfigClient } from "../../../../service-lib/src/lib/service-communication/file-password-config-client";
import { HrRepository } from "./hr.repository";

// ─── TPA external claims constants ────────────────────────────────────────────
const TPA_CLAIMS_DATA_TYPE = "TPA";
const TPA_CLAIMS_APP_KEY = "tpa-claims";
// Direct backend-to-backend path — no gateway prefix
const TPA_CLAIMS_MAGIC_URL_PATH = "/external-app-sso/magic-url";
const TPA_CLAIMS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TPA_CLAIMS_LOCK_TTL_SECONDS = 360; // 6 min — covers the full 5-min TPA fetch window
const TPA_CLAIMS_API_TIMEOUT_MS = 300_000; // 5 min — ibp-service → document-service (covers auth + data calls)

@Injectable()
export class HrService implements OnModuleInit, OnModuleDestroy {
  // Small metadata caches — report schema (5 min TTL) and HR context per-user (60 s TTL).
  // These hold tiny objects so an in-memory Map is fine; a periodic sweep evicts expired entries.
  private readonly reportMetaCache = new Map<string, { report: any; params: any[]; expiresAt: number }>();
  private readonly reportMetaPending = new Map<string, Promise<{ report: any; params: any[] }>>();
  private readonly hrCtxCache = new Map<number, { ctx: { isExternalHr: boolean; policyIds: number[]; resolvedHrId: number }; expiresAt: number }>();
  private readonly hrCtxPending = new Map<number, Promise<{ isExternalHr: boolean; policyIds: number[]; resolvedHrId: number }>>();

  // Large query results go to Redis (90 s TTL with auto-eviction) so Node.js heap stays clean.
  // Falls back to no-cache when Redis is unavailable (STORAGE_TYPE != valkey).
  private readonly resultPending = new Map<string, Promise<{ data: any[]; count: number }>>();
  private readonly countPending = new Map<string, Promise<{ count: number }>>();

  // Shared Redis singleton — reused for result cache + TPA locks/timestamps.
  // Per-request new Redis() instances are replaced with this.
  private redis: Redis | null = null;
  private metaCacheEvictInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly hrRepository: HrRepository,
    @InjectRepository(TpaClaimData)
    private readonly tpaClaimRepo: Repository<TpaClaimData>,
    @InjectRepository(PolicyClaim)
    private readonly policyClaimRepo: Repository<PolicyClaim>,
    @InjectRepository(PolicyClaimSettlement)
    private readonly policyClaimSettlementRepo: Repository<PolicyClaimSettlement>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly policyEnrollmentEmployeeRepo: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly policyEnrollmentEmployeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
  ) {}

  onModuleInit() {
    this.redis = createRedisClient({
      logger: console as any,
      traceId: "hr-service-init",
      location: "HrService",
      method: "onModuleInit",
    });
    // Sweep expired entries from the small in-memory Maps every 30 s
    this.metaCacheEvictInterval = setInterval(() => {
      const now = Date.now();
      this.reportMetaCache.forEach((v, k) => { if (now > v.expiresAt) this.reportMetaCache.delete(k); });
      this.hrCtxCache.forEach((v, k) => { if (now > v.expiresAt) this.hrCtxCache.delete(k); });
    }, 30_000);
  }

  onModuleDestroy() {
    if (this.metaCacheEvictInterval) clearInterval(this.metaCacheEvictInterval);
    this.redis?.disconnect();
  }

  // ─── TPA Claims DB store/read (frontend fetches via external-app-sso) ────

  async storeClaimsMIS(policyNumber: string, claims: Record<string, any>[]): Promise<void> {
    for (const c of claims) {
      const tpaClaimNo: string | null = c.TPA_CLAIM_NO ?? c.INSURANCE_CLAIM_NO ?? null;

      // Upsert tpa_claim_data
      let tpaRecord = tpaClaimNo
        ? await this.tpaClaimRepo.findOne({ where: { policyNumber, tpaClaimNo, dataType: "MIS" } })
        : null;
      if (tpaRecord) {
        tpaRecord.claimData = c;
        tpaRecord.fetchedAt = new Date();
      } else {
        tpaRecord = this.tpaClaimRepo.create({
          policyNumber,
          tpaClaimNo: tpaClaimNo ?? undefined,
          dataType: "MIS",
          claimData: c,
        });
      }
      const savedTpa = await this.tpaClaimRepo.save(tpaRecord);
      const tpaRefId = savedTpa.id;

      // tpa_claim_data is the guaranteed store — policy_claim + settlement are best-effort.
      const claimNumber: string | null = c.INSURANCE_CLAIM_NO ?? null;
      if (!claimNumber) continue;

      try {
        let claim = await this.policyClaimRepo.findOne({ where: { claimNumber } });

        if (claim) {
          claim.tpaClaimNo = tpaClaimNo ?? undefined;
          claim.claimStatus = this.toEntityStr(c.STATUS);
          claim.claimHospital = this.toEntityStr(c.HOSPITAL_NAME);
          claim.claimHospitalLocation = this.toEntityStr(c.HOSPITAL_CITY);
          claim.claimDateOfAdmission = this.toEntityDate(c.DATE_OF_ADMISSION);
          claim.claimDateOfDischarge = this.toEntityDate(c.DATE_OF_DISCHARGE);
          claim.claimAmount = this.toEntityNum(c.ESTIMATED_CLAIM_AMOUNT);
          claim.patientName = this.toEntityStr(c.BENEFICIARY_NAME);
          claim.patientRelation = this.toEntityStr(c.RELATION);
          claim.totalSumInsured = this.toEntityNum(c.SUM_INSURED);
          claim.tpaClaimRefId = tpaRefId;
        } else {
          const policy = await this.policyRepo.findOne({
            where: { insurerPolicyNumber: policyNumber },
            select: ["id"],
          });
          const tpaHealthId = this.toEntityStr(c.TPA_HEALTH_ID);
          const employee = tpaHealthId
            ? await this.policyEnrollmentEmployeeRepo.findOne({
                where: { employeeTpaId: tpaHealthId },
                select: ["id"],
              })
            : null;
          if (!policy?.id || !employee?.id) {
            console.warn(`[storeClaimsMIS] Skipping ${claimNumber}: policy=${policy?.id ?? "?"} employee=${employee?.id ?? "?"}`);
            continue;
          }
          claim = this.policyClaimRepo.create({
            policyId: policy.id,
            employeeId: employee.id,
            employeeTpaId: tpaHealthId ?? "",
            claimNumber,
            tpaClaimNo: tpaClaimNo ?? undefined,
            employeeName: this.toEntityStr(c.EMPLOYEE_NAME),
            patientName: this.toEntityStr(c.BENEFICIARY_NAME),
            patientRelation: this.toEntityStr(c.RELATION),
            patientTpaId: tpaHealthId,
            claimHospital: this.toEntityStr(c.HOSPITAL_NAME),
            claimHospitalLocation: this.toEntityStr(c.HOSPITAL_CITY),
            claimDateOfAdmission: this.toEntityDate(c.DATE_OF_ADMISSION),
            claimDateOfDischarge: this.toEntityDate(c.DATE_OF_DISCHARGE),
            claimAmount: this.toEntityNum(c.ESTIMATED_CLAIM_AMOUNT),
            claimStatus: this.toEntityStr(c.STATUS),
            claimType: this.toEntityStr(c.TYPE_OF_CLAIM),
            claimDescription: this.toEntityStr(c.AILMENT),
            totalSumInsured: this.toEntityNum(c.SUM_INSURED),
            policyNumber,
            tpaClaimRefId: tpaRefId,
          });
        }

        const savedClaim = await this.policyClaimRepo.save(claim);
        const claimId = savedClaim.id;

        const paidAmount = this.toEntityNum(c.PAID_AMOUNT);
        const settlementDate = this.toEntityDate(c.DATE_OF_SETTLEMENT);

        if (paidAmount !== null || settlementDate !== null) {
          let settlement = await this.policyClaimSettlementRepo.findOne({ where: { claimId } });
          if (settlement) {
            settlement.settlementAmount = paidAmount;
            settlement.settlementDate = settlementDate;
          } else {
            settlement = this.policyClaimSettlementRepo.create({ claimId, settlementAmount: paidAmount, settlementDate });
          }
          await this.policyClaimSettlementRepo.save(settlement);
        }
      } catch (err) {
        console.warn("[storeClaimsMIS] policy_claim write skipped for %s:", claimNumber, (err as Error).message);
      }
    }
  }

  async storeIndividualClaim(policyNumber: string, tpaClaimNo: string, detail: Record<string, any>): Promise<void> {
    // 1. Upsert tpa_claim_data INDIVIDUAL record (full GoodHealth response)
    let tpaRecord = await this.tpaClaimRepo.findOne({ where: { policyNumber, tpaClaimNo, dataType: "INDIVIDUAL" } });
    if (tpaRecord) {
      tpaRecord.claimData = detail;
      tpaRecord.fetchedAt = new Date();
    } else {
      tpaRecord = this.tpaClaimRepo.create({ policyNumber, tpaClaimNo, dataType: "INDIVIDUAL", claimData: detail });
    }
    const savedTpa = await this.tpaClaimRepo.save(tpaRecord);
    const tpaRefId = savedTpa.id;

    // 2. Merge updated fields into the existing TPA sync record (dataType="TPA")
    //    so that fetchTpaClaimRows returns fresh data on next load instead of stale MIS JSON.
    try {
      const tpaSyncRecord = await this.tpaClaimRepo.findOne({
        where: { tpaClaimNo, dataType: TPA_CLAIMS_DATA_TYPE },
      });
      if (tpaSyncRecord) {
        const existing = (tpaSyncRecord.claimData ?? {}) as Record<string, any>;
        tpaSyncRecord.claimData = {
          ...existing,
          // GoodHealth camelCase field names mapped to existing MIS UPPER_CASE keys
          CLAIM_STATUS:         detail.claimStatus    ?? detail.STATUS          ?? existing["CLAIM_STATUS"],
          APPROVED_AMOUNT:      detail.approvedAmount ?? existing["APPROVED_AMOUNT"],
          CHEQUE_AMOUNT:        detail.chequeAmount   ?? detail.PAID_AMOUNT     ?? existing["CHEQUE_AMOUNT"],
          SETTLED_DATE:         detail.settledDate    ?? detail.DATE_OF_SETTLEMENT ?? existing["SETTLED_DATE"],
          APPROVED_DATE:        detail.approvedDate   ?? existing["APPROVED_DATE"],
          NEFT_DATE:            detail.neftDate       ?? existing["NEFT_DATE"],
          NEFT_REF_NO:          detail.neftRefNo      ?? existing["NEFT_REF_NO"],
          PRE_AUTH_STATUS:      detail.preAuthStatus  ?? existing["PRE_AUTH_STATUS"],
          PRE_AUTH_STATUS_DATE: detail.preAuthStatusDate ?? existing["PRE_AUTH_STATUS_DATE"],
          DISPATCH_DATE:        detail.dispatchDate   ?? existing["DISPATCH_DATE"],
          HOSPITAL_NAME:        detail.hospitalName   ?? detail.HOSPITAL_NAME   ?? existing["HOSPITAL_NAME"],
          HOSPITAL_CITY:        detail.hospitalCity   ?? existing["HOSPITAL_CITY"],
          HOSPITAL_STATE:       detail.hospitalState  ?? existing["HOSPITAL_STATE"],
          DEDUCTION_AMOUNT:     detail.deductionAmount ?? existing["DEDUCTION_AMOUNT"],
          DEDUCTION_REASONS:    detail.deductionReasons ?? existing["DEDUCTION_REASONS"],
        };
        tpaSyncRecord.fetchedAt = new Date();
        await this.tpaClaimRepo.save(tpaSyncRecord);
      }
    } catch (err) {
      console.warn(`[storeIndividualClaim] TPA sync record merge skipped for ${tpaClaimNo}:`, (err as Error).message);
    }

    // 3. Update policy_claim + settlement (best-effort)
    try {
      const insuranceClaimNo: string | null = detail.INSURANCE_CLAIM_NO ?? null;
      const claim = insuranceClaimNo
        ? await this.policyClaimRepo.findOne({ where: [{ tpaClaimNo }, { claimNumber: insuranceClaimNo }] })
        : await this.policyClaimRepo.findOne({ where: { tpaClaimNo } });

      if (claim) {
        const newStatus = detail.STATUS ?? detail.claimStatus;
        if (newStatus) claim.claimStatus = newStatus;
        const newHospital = detail.HOSPITAL_NAME ?? detail.hospitalName;
        if (newHospital) claim.claimHospital = newHospital;
        claim.tpaClaimRefId = tpaRefId;
        const savedClaim = await this.policyClaimRepo.save(claim);
        const claimId = savedClaim.id;

        const paidAmount = this.toEntityNum(detail.PAID_AMOUNT ?? detail.chequeAmount ?? detail.approvedAmount);
        const settlementDate = this.toEntityDate(detail.DATE_OF_SETTLEMENT ?? detail.settledDate ?? detail.neftDate);

        if (paidAmount !== null || settlementDate !== null) {
          let settlement = await this.policyClaimSettlementRepo.findOne({ where: { claimId } });
          if (settlement) {
            settlement.settlementAmount = paidAmount;
            settlement.settlementDate = settlementDate;
          } else {
            settlement = this.policyClaimSettlementRepo.create({ claimId, settlementAmount: paidAmount, settlementDate });
          }
          await this.policyClaimSettlementRepo.save(settlement);
        }
      }
    } catch (err) {
      console.warn("[storeIndividualClaim] policy_claim write skipped for %s:", tpaClaimNo, (err as Error).message);
    }
  }

  async getStoredClaims(policyNumber: string): Promise<TpaClaimData[]> {
    return this.tpaClaimRepo.find({
      where: { policyNumber, dataType: "MIS" },
      order: { fetchedAt: "DESC" },
    });
  }

  async getStoredIndividualClaim(tpaClaimNo: string): Promise<TpaClaimData | null> {
    return this.tpaClaimRepo.findOne({ where: { tpaClaimNo, dataType: "INDIVIDUAL" } });
  }

  // ─── On-demand TPA external claims (tpa-claims app key) ─────────────────────
  //
  // Flow:
  //   1. Check tpa_claim_data for this policy — if last fetch < 24 h, serve from DB.
  //   2. Otherwise acquire a Redis lock on tpa-claims:fetch:{policyNumber}
  //      (prevents duplicate API calls when multiple users open the same policy at once).
  //   3. If lock acquired  → call TPA API → UPSERT into tpa_claim_data + policy_claim → return fresh data.
  //   4. If lock not acquired → another request is already fetching → return cached rows + refreshing: true.

  async getOrFetchTpaClaims(
    policyNumber: string,
    policyStartDate: string,
    policyEndDate: string,
    authHeader = "",
    employeeId?: number,
  ): Promise<{ claims: Record<string, any>[]; refreshing: boolean; lastFetchedAt: string | null }> {
    // Resolve employee's TPA ID so we can filter claims to just this employee.
    // undefined = no employee filter requested (admin/policy context — return all claims)
    // null      = employeeId given but no TPA ID found — return empty, not all policy claims
    const employeeTpaId = employeeId
      ? await this.getEmployeeTpaId(employeeId)
      : undefined;

    const lastFetchedAt = await this.getTpaClaimsLastFetchedAt(policyNumber);
    const isStale =
      !lastFetchedAt ||
      Date.now() - lastFetchedAt.getTime() > TPA_CLAIMS_TTL_MS;

    if (!isStale) {
      const rows = await this.fetchTpaClaimRows(policyNumber, employeeTpaId);
      return {
        claims: rows,
        refreshing: false,
        lastFetchedAt: lastFetchedAt!.toISOString(),
      };
    }

    // ── Login-triggered TPA fetch disabled ────────────────────────────────
    // Nightly scheduler (TpaClaimsWorkerScheduler) now handles all TPA syncs.
    // Login flow just returns whatever is in the DB — nightly data is acceptable.
    // Re-enable the block below if on-demand refresh is needed again.
    //
    // const lockKey = `tpa-claims:fetch:${policyNumber}`;
    // const { client: redisClient, acquired } = await this.tryAcquireRedisLock(
    //   lockKey,
    //   TPA_CLAIMS_LOCK_TTL_SECONDS,
    // );
    // if (acquired) {
    //   this.backgroundFetchTpaClaims(
    //     redisClient, lockKey, policyNumber, policyStartDate, policyEndDate, authHeader,
    //   ).catch((err) => {
    //     this.logger.error?.({ level: "error", message: `[TPA background fetch] ${err?.message ?? err}` });
    //   });
    // } else {
    //   redisClient?.disconnect();
    // }

    // ── Fire-and-forget TPA fetch ─────────────────────────────────────────
    // The ALB has a 60-second idle timeout that we cannot change.
    // Awaiting the TPA API (which can take 2–5 min) will always 504.
    // Fix: return whatever is cached immediately with refreshing:true,
    // then fetch in background. The next call returns fresh data.
    const lockKey = `tpa-claims:fetch:${policyNumber}`;
    const { acquired } = await this.tryAcquireRedisLock(
      lockKey,
      TPA_CLAIMS_LOCK_TTL_SECONDS,
    );

    if (acquired) {
      // Start background fetch — do NOT await (fire-and-forget)
      this.backgroundFetchTpaClaims(
        lockKey,
        policyNumber,
        policyStartDate,
        policyEndDate,
        authHeader,
      ).catch((err) => {
        console.error({
          level: "error",
          message: `[TPA background fetch] ${err?.message ?? err}`,
        });
      });
    }

    // Respond immediately with whatever is currently cached
    const rows = await this.fetchTpaClaimRows(policyNumber, employeeTpaId);
    return {
      claims: rows,
      refreshing: false,
      lastFetchedAt: lastFetchedAt?.toISOString() ?? null,
    };
  }

  private async backgroundFetchTpaClaims(
    lockKey: string,
    policyNumber: string,
    policyStartDate: string,
    policyEndDate: string,
    authHeader: string,
  ): Promise<void> {
    const startedAt = Date.now();
    console.log(`[TPA-BG] START policyNumber=${policyNumber} startedAt=${new Date().toISOString()}`);
    try {
      const apiClaims = await this.fetchExternalTpaClaimsFromApi(
        policyNumber,
        policyStartDate,
        policyEndDate,
        authHeader,
      );
      console.log(`[TPA-BG] FETCHED policyNumber=${policyNumber} claimsCount=${apiClaims.length} durationMs=${Date.now() - startedAt}`);
      if (apiClaims.length > 0) {
        await this.storeExternalTpaClaims(policyNumber, apiClaims);
        console.log(`[TPA-BG] STORED policyNumber=${policyNumber} durationMs=${Date.now() - startedAt}`);
      }
      // Always record fetch timestamp — even when API returns [] so we don't re-fetch within TTL
      await this.setTpaFetchTimestamp(policyNumber);
      console.log(`[TPA-BG] TIMESTAMP_SET policyNumber=${policyNumber} claimsCount=${apiClaims.length} durationMs=${Date.now() - startedAt}`);
    } catch (err: any) {
      console.error(`[TPA-BG] ERROR policyNumber=${policyNumber} durationMs=${Date.now() - startedAt} error=${err?.message ?? err}`);
      throw err;
    } finally {
      await this.releaseRedisLock(lockKey);
    }
  }

  private async getEmployeeTpaId(employeeId: number): Promise<string | null> {
    const map = await this.policyEnrollmentEmployeePolicyMapRepo.findOne({
      where: { employeeId },
      select: ["employeeTpaId"],
    });
    return map?.employeeTpaId ?? null;
  }

  private async fetchTpaClaimRows(
    policyNumber: string,
    employeeTpaId: string | null | undefined,
  ): Promise<Record<string, any>[]> {
    if (!employeeTpaId) return [];
    const rows = await this.tpaClaimRepo.find({
      where: { policyNumber, dataType: TPA_CLAIMS_DATA_TYPE, employeeTpaId },
      order: { fetchedAt: "DESC" },
    });
    return rows.map((r) => r.claimData);
  }

  private async getTpaClaimsLastFetchedAt(policyNumber: string): Promise<Date | null> {
    // Check Redis policy-level fetch timestamp first (covers empty-API-response case)
    const redisTs = await this.getTpaFetchTimestampFromRedis(policyNumber);
    if (redisTs) return redisTs;

    // Fallback: check tpa_claim_data (for policies with actual stored claims)
    const result = await this.tpaClaimRepo
      .createQueryBuilder("tcd")
      .select("MAX(tcd.fetchedAt)", "maxFetched")
      .where("tcd.policyNumber = :policyNumber", { policyNumber })
      .andWhere("tcd.dataType = :dataType", { dataType: TPA_CLAIMS_DATA_TYPE })
      .getRawOne<{ maxFetched: string | null }>();
    const raw = result?.maxFetched;
    return raw ? new Date(raw) : null;
  }

  private async fetchExternalTpaClaimsFromApi(
    policyNumber: string,
    policyStartDate: string,
    policyEndDate: string,
    authHeader = "",
  ): Promise<Record<string, any>[]> {
    const baseUrl =
      process.env["URL_DOCUMENT_SERVICE"] ?? "http://localhost:3013";

    // Dynamic TPA lookup: resolve appKey from tpa_external_feature_config by policy.
    // Falls back to hardcoded constant so existing behaviour is unchanged if no config found.
    const dynamicAppKey = await this.hrRepository.getTpaAppKeyForPolicy(policyNumber, "FETCH_CLAIMS");
    const resolvedAppKey = dynamicAppKey ?? TPA_CLAIMS_APP_KEY;

    console.log(`[fetchExternalTpaClaimsFromApi] policyNumber=${policyNumber} appKey=${resolvedAppKey} (${dynamicAppKey ? "dynamic" : "fallback"})`);

    const payload = {
      appKey: resolvedAppKey,
      dynamicFields: { policyNo: policyNumber, policyStartDate, policyEndDate },
    };
    try {
      const response = await axios.post<Record<string, any> | Record<string, any>[]>(
        `${baseUrl}${TPA_CLAIMS_MAGIC_URL_PATH}`,
        payload,
        {
          timeout: TPA_CLAIMS_API_TIMEOUT_MS,
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      );
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === "object") {
        const inner = (data as any)?.data;
        if (Array.isArray(inner)) return inner;
        return [data];
      }
      return [];
    } catch (err) {
      const status = (err as any)?.response?.status;
      console.warn(
        "[fetchExternalTpaClaimsFromApi] TPA API call failed (status=%s):",
        status ?? "unknown",
        (err as Error).message,
      );
      return [];
    }
  }

  // Converts "" / null / undefined → null for numeric and varchar columns.
  private nb(val: unknown): unknown {
    return val === null || val === undefined || val === "" ? null : val;
  }

  // Converts TPA date strings to YYYY-MM-DD for PostgreSQL.
  // Handles: null/undefined/"" → null, DD/MM/YYYY → YYYY-MM-DD, ISO passthrough.
  private toSqlDate(val: unknown): string | null {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    if (!s) return null;
    // DD/MM/YYYY or DD-MM-YYYY
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    // Already ISO YYYY-MM-DD or parseable
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    return null;
  }

  private toEntityDate(val: unknown): Date | null {
    const s = this.toSqlDate(val);
    return s ? new Date(s) : null;
  }

  private toEntityNum(val: unknown): number | null {
    const v = this.nb(val);
    return v === null ? null : Number(v);
  }

  private toEntityStr(val: unknown): string | null {
    const v = this.nb(val);
    return v === null ? null : String(v);
  }

  private async storeExternalTpaClaims(
    policyNumber: string,
    claims: Record<string, any>[],
  ): Promise<void> {
    let saved = 0, skipped = 0, failed = 0;
    const errorBuckets: Record<string, number> = {};

    console.log(`[storeExternalTpaClaims] Starting — total claims from API: ${claims.length}`);

    for (const c of claims) {
      const tpaClaimNo: string | null = c["CLAIM_ID"] ?? null;
      const employeeTpaId: string | null = c["TPA_ID"] ?? null;

      if (!tpaClaimNo) {
        skipped++;
        continue;
      }

      try {
        await this.tpaClaimRepo.manager.transaction(async (em) => {
          const claimRepo = em.getRepository(PolicyClaim);
          const settlementRepo = em.getRepository(PolicyClaimSettlement);
          const tpaRepo = em.getRepository(TpaClaimData);

          // Find existing policy_claim rows for this (tpaClaimNo + employeeTpaId)
          const matchWhere = employeeTpaId
            ? { tpaClaimNo, employeeTpaId }
            : { tpaClaimNo };
          const existingClaims = await claimRepo.find({
            where: matchWhere,
            select: ["id", "claimStatus", "claimNumber"],
          });

          // If the already-stored record is SETTLED but the incoming one is not,
          // skip — a pending duplicate must not erase a settled row.
          const incomingStatus = String(c["CLAIM_STATUS"] ?? "").toLowerCase();
          const alreadySettled = existingClaims.some(
            (r) => String(r.claimStatus ?? "").toLowerCase() === "settled",
          );
          if (alreadySettled && incomingStatus !== "settled") {
            console.log(
              `[storeExternalTpaClaims] Skipping — claim=${tpaClaimNo} employeeTpaId=${employeeTpaId} already settled, incoming="${incomingStatus}"`,
            );
            return;
          }

          // Portal-submitted claims (have claim_number) must be UPDATED, not deleted+inserted.
          // Deleting them would lose our CLM- number, employee_id, and other portal data.
          const portalClaim = existingClaims.find((r) => !!r.claimNumber);

          // Resolve policy and employee IDs
          const policy = await em.getRepository(Policy).findOne({
            where: { insurerPolicyNumber: policyNumber },
            select: ["id"],
          });
          const employee = employeeTpaId
            ? await em.getRepository(PolicyEnrollmentEmployee).findOne({
                where: { employeeTpaId },
                select: ["id"],
              })
            : null;

          if (!policy?.id) {
            console.warn(`[storeExternalTpaClaims] policy not found for policyNumber=${policyNumber}, claim=${tpaClaimNo}`);
          }
          if (!employee?.id) {
            console.warn(`[storeExternalTpaClaims] employee not found for employeeTpaId=${employeeTpaId}, claim=${tpaClaimNo}`);
          }

          const hospitalLocation = [c["HOSPITAL_CITY"], c["HOSPITAL_STATE"]].filter(Boolean).join(", ") || null;

          let savedClaim: PolicyClaim;

          if (portalClaim) {
            // UPDATE path — portal claim found: merge TPA data into the existing row
            console.log(
              `[storeExternalTpaClaims] Updating portal claim id=${portalClaim.id} claimNumber=${portalClaim.claimNumber} with TPA data`,
            );
            await claimRepo.update(portalClaim.id, {
              claimType:               this.toEntityStr(c["CLAIM_TYPE"]) ?? undefined,
              claimPreAuthId:          this.toEntityStr(c["PRE_AUTH_NO"]) ?? undefined,
              claimPreAuthDate:        this.toEntityDate(c["PRE_AUTH_REQUEST_DATE"]) ?? undefined,
              claimPreAuthAmount:      this.toEntityNum(c["PRE_AUTH_AMOUNT"]) ?? undefined,
              claimDateOfAdmission:    this.toEntityDate(c["DATE_OF_ADMISSION"]) ?? undefined,
              claimDateOfDischarge:    this.toEntityDate(c["DATE_OF_DISCHARGE"]) ?? undefined,
              claimDate:               this.toEntityDate(c["CLAIM_REG_DATE"]) ?? undefined,
              claimAmount:             this.toEntityNum(c["CLAIM_AMOUNT"]) ?? undefined,
              claimAllowedAmount:      this.toEntityNum(c["APPROVED_AMOUNT"]) ?? undefined,
              claimStatus:             this.toEntityStr(c["CLAIM_STATUS"]) ?? undefined,
              claimDescription:        this.toEntityStr(c["AILMENT"]) ?? undefined,
              claimHospital:           this.toEntityStr(c["HOSPITAL_NAME"]) ?? undefined,
              claimHospitalLocation:   hospitalLocation ?? undefined,
              patientName:             this.toEntityStr(c["PATIENT_NAME"]) ?? undefined,
              patientRelation:         this.toEntityStr(c["PATIENT_RELATION"]) ?? undefined,
              totalSumInsured:         this.toEntityNum(c["SUM_INSURED"]) ?? undefined,
              totalAvailableBalance:   this.toEntityNum(c["BALANCE_SUM_INSURED"]) ?? undefined,
              policyStartDate:         this.toEntityDate(c["POLICY_START_DATE"]) ?? undefined,
              policyEndDate:           this.toEntityDate(c["POLICY_END_DATE"]) ?? undefined,
            });
            // Re-fetch the updated claim for settlement processing
            savedClaim = (await claimRepo.findOne({ where: { id: portalClaim.id } }))!;
          } else {
            // INSERT path — pure TPA sync record: delete old rows then insert fresh
            const pureTpaIds = existingClaims.filter((r) => !r.claimNumber).map((r) => r.id);
            if (pureTpaIds.length > 0) {
              await settlementRepo.delete({ claimId: In(pureTpaIds) });
              await claimRepo.delete(matchWhere);
            }
            const newClaim = claimRepo.create({
              policyId: (policy?.id ?? null) as unknown as number,
              employeeId: (employee?.id ?? null) as unknown as number,
              employeeTpaId: employeeTpaId ?? "",
              tpaClaimNo,
              claimType: this.toEntityStr(c["CLAIM_TYPE"]),
              claimPreAuthId: this.toEntityStr(c["PRE_AUTH_NO"]),
              claimPreAuthDate: this.toEntityDate(c["PRE_AUTH_REQUEST_DATE"]),
              claimPreAuthAmount: this.toEntityNum(c["PRE_AUTH_AMOUNT"]),
              claimDateOfAdmission: this.toEntityDate(c["DATE_OF_ADMISSION"]),
              claimDateOfDischarge: this.toEntityDate(c["DATE_OF_DISCHARGE"]),
              claimDate: this.toEntityDate(c["CLAIM_REG_DATE"]),
              claimAmount: this.toEntityNum(c["CLAIM_AMOUNT"]),
              claimAllowedAmount: this.toEntityNum(c["APPROVED_AMOUNT"]),
              claimStatus: this.toEntityStr(c["CLAIM_STATUS"]),
              claimDescription: this.toEntityStr(c["AILMENT"]),
              claimHospital: this.toEntityStr(c["HOSPITAL_NAME"]),
              claimHospitalLocation: hospitalLocation,
              employeeName: this.toEntityStr(c["EMPLOYEE_NAME"]),
              patientName: this.toEntityStr(c["PATIENT_NAME"]),
              patientRelation: this.toEntityStr(c["PATIENT_RELATION"]),
              totalSumInsured: this.toEntityNum(c["SUM_INSURED"]),
              totalAvailableBalance: this.toEntityNum(c["BALANCE_SUM_INSURED"]),
              companyName: this.toEntityStr(c["COMPANY_NAME"]),
              policyNumber,
              policyStartDate: this.toEntityDate(c["POLICY_START_DATE"]),
              policyEndDate: this.toEntityDate(c["POLICY_END_DATE"]),
            });
            savedClaim = await claimRepo.save(newClaim);
          }

          const claimId = savedClaim!.id;

          // Upsert tpa_claim_data
          let tpaRecord = await tpaRepo.findOne({
            where: { policyNumber, tpaClaimNo, dataType: TPA_CLAIMS_DATA_TYPE },
          });
          if (tpaRecord) {
            tpaRecord.employeeTpaId = employeeTpaId ?? "";
            tpaRecord.claimData = c;
            tpaRecord.fetchedAt = new Date();
          } else {
            tpaRecord = tpaRepo.create({
              policyNumber,
              tpaClaimNo,
              employeeTpaId: employeeTpaId ?? "",
              dataType: TPA_CLAIMS_DATA_TYPE,
              claimData: c,
            });
          }
          const savedTpa = await tpaRepo.save(tpaRecord);

          // Update tpa_claim_ref_id on the policy_claim row
          if (claimId && savedTpa.id) {
            await em.query(
              `UPDATE public.policy_claim SET tpa_claim_ref_id = $1 WHERE id = $2`,
              [savedTpa.id, claimId],
            );
          }

          // Settlement — fresh insert since old rows were deleted above
          const isSettled = String(c["CLAIM_STATUS"] ?? "").toLowerCase() === "settled";
          const chequeAmount = this.toEntityNum(c["CHEQUE_AMOUNT"]);
          const settledDate = this.toEntityDate(c["SETTLED_DATE"]);

          if (isSettled && (chequeAmount !== null || settledDate !== null)) {
            const settlement = settlementRepo.create({
              claimId,
              settlementAmount: chequeAmount,
              settlementDate: settledDate,
              settlementNo: this.toEntityStr(c["NEFT_REF_NO"]),
              disallowedAmount: this.toEntityNum(c["DEDUCTION_AMOUNT"]),
              settlementDetails: this.toEntityStr(c["DEDUCTION_REASONS"]),
            });
            await settlementRepo.save(settlement);
          }
        });
        saved++;
      } catch (err) {
        failed++;
        const msg = (err as Error).message ?? "unknown";
        // Bucket identical errors so the summary stays readable
        errorBuckets[msg] = (errorBuckets[msg] ?? 0) + 1;
        console.error(
          `[storeExternalTpaClaims] Failed for claim=${tpaClaimNo} employeeTpaId=${employeeTpaId}: ${msg}`,
        );
      }
    }

    console.log(
      `[storeExternalTpaClaims] Done — total=${claims.length} saved=${saved} skipped(no CLAIM_ID)=${skipped} failed=${failed}`,
    );
    if (failed > 0) {
      console.error("[storeExternalTpaClaims] Error breakdown:", errorBuckets);
    }
  }

  // ─── Redis lock helpers ───────────────────────────────────────────────────────

  private async tryAcquireRedisLock(
    key: string,
    ttlSeconds: number,
  ): Promise<{ acquired: boolean }> {
    if (!this.redis) {
      // Redis not configured — proceed without lock (best-effort, duplicate calls accepted)
      return { acquired: true };
    }

    try {
      const result = await this.redis.set(key, "1", "EX", ttlSeconds, "NX");
      return { acquired: result === "OK" };
    } catch {
      return { acquired: true }; // Redis unreachable — proceed without lock
    }
  }

  // ── Fetch-timestamp helpers (policy-level, survives empty API responses) ──────
  // Key: tpa-claims:fetched-at:{policyNumber}  TTL: 24 h (same as TPA_CLAIMS_TTL_MS)

  private async setTpaFetchTimestamp(policyNumber: string): Promise<void> {
    if (!this.redis) return;
    try {
      const ttlSeconds = Math.floor(TPA_CLAIMS_TTL_MS / 1000);
      await this.redis.set(`tpa-claims:fetched-at:${policyNumber}`, new Date().toISOString(), "EX", ttlSeconds);
    } catch { /* non-fatal — falls back to DB check */ }
  }

  private async getTpaFetchTimestampFromRedis(policyNumber: string): Promise<Date | null> {
    if (!this.redis) return null;
    try {
      const val = await this.redis.get(`tpa-claims:fetched-at:${policyNumber}`);
      return val ? new Date(val) : null;
    } catch { return null; }
  }

  private async releaseRedisLock(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch { /* non-fatal */ }
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private stripTrailingOrderBy(query: string): string {
    const normalized = query.trim().replace(/;$/, "");
    const orderByIndex = normalized.toUpperCase().lastIndexOf("ORDER BY");

    if (orderByIndex === -1) {
      return normalized;
    }

    return normalized.slice(0, orderByIndex).trimEnd();
  }

  private buildQuery(
    rawQuery: string,
    params: Record<string, string>,
    parameterList: AdminReportParameter[],
  ): string {
    let query = rawQuery;
    parameterList.forEach((param) => {
      const key = param.queryParameter;
      const value = params[param.parameterName];
      const replacement =
        value === "#99#" || value === undefined || value === null
          ? "NULL"
          : `'${String(value).replace(/'/g, "''")}'`;
      query = query.replace(
        new RegExp(this.escapeRegExp(key), "g"),
        replacement,
      );
    });
    return query;
  }

async generateReport(
    reportName: string,
    params: Record<string, string>,
    options: { page: number; limit: number; sort?: string; noCount?: boolean },
    userId = 0,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
    const cacheKey = `hr:report:${reportName}:${userId}:${JSON.stringify(params)}:${options.page}:${options.limit}`;
    // Stampede protection: if another request is already running this exact query, wait for it
    const pendingResult = this.resultPending.get(cacheKey);
    if (pendingResult) {
      return pendingResult;
    }

    // Fix 2: cache report metadata with stampede protection
    // Parallel calls share one in-flight promise so DB is hit only once even on cold start.
    const now = Date.now();
    const REPORT_META_TTL_MS = 5 * 60 * 1000; // 5 minutes — migrations take effect without restart
    let meta = this.reportMetaCache.get(reportName);
    if (!meta || meta.expiresAt < now) {
      this.reportMetaCache.delete(reportName);
      let pending = this.reportMetaPending.get(reportName);
      if (!pending) {
        pending = this.hrRepository.findReport(reportName).then(async (report) => {
          if (!report) throw new NotFoundException("Report not found");
          const params2 = await this.hrRepository.findParameters(report.id);
          const resolved = { report, params: params2, expiresAt: Date.now() + REPORT_META_TTL_MS };
          this.reportMetaCache.set(reportName, resolved);
          return resolved;
        }).finally(() => {
          // Must clear on BOTH success and failure — otherwise the very first
          // lookup for a report name that doesn't exist yet (e.g. queried
          // moments before its migration runs) permanently poisons this
          // pending-promise cache: every later call reuses the same rejected
          // promise forever, since nothing else ever clears it.
          this.reportMetaPending.delete(reportName);
        });
        this.reportMetaPending.set(reportName, pending);
      }
      meta = await pending;
    }
    const { report, params: parameterList } = meta!;

    const enrichedParams = { ...params };
    // Fix 3: cache getExternalHrContext with stampede protection — 60s TTL
    if (userId > 0) {
      const cached = this.hrCtxCache.get(userId);
      let ctx: { isExternalHr: boolean; policyIds: number[]; resolvedHrId: number };
      if (cached && cached.expiresAt > Date.now()) {
        ctx = cached.ctx;
      } else {
        let pending = this.hrCtxPending.get(userId);
        if (!pending) {
          pending = this.hrRepository.getExternalHrContext(userId)
            .then((c) => {
              this.hrCtxCache.set(userId, { ctx: c, expiresAt: Date.now() + 60_000 });
              return c;
            })
            .catch(() => ({ isExternalHr: false, policyIds: [], resolvedHrId: userId }))
            .finally(() => { this.hrCtxPending.delete(userId); });
          this.hrCtxPending.set(userId, pending);
        }
        ctx = await pending;
      }
      if (ctx.isExternalHr) {
        enrichedParams["externalHrUserId"] = String(ctx.resolvedHrId);
      }
    }

    const mappedParams: Record<string, string> = {};
    parameterList.forEach((param: AdminReportParameter) => {
      mappedParams[param.parameterName] = enrichedParams[param.parameterName];
    });

    const rawQuery = this.buildQuery(report.query, mappedParams, parameterList)
      .replace(/###[a-zA-Z0-9_]+###/g, "''");
    const baseQuery = rawQuery;
    let finalQuery = baseQuery.trim().replace(/;$/, "");

    if (options.sort) {
      finalQuery = this.stripTrailingOrderBy(finalQuery);
      const sorts = options.sort
        .split(",")
        .map((s) => {
          const [field, ord] = s.split(":");
          return `"${field}" ${ord ? ord.toUpperCase() : "ASC"}`;
        })
        .join(", ");
      finalQuery += ` ORDER BY ${sorts}`;
    }

    if (options.limit > 0) {
      finalQuery += ` LIMIT ${options.limit} OFFSET ${(options.page - 1) * options.limit}`;
    }

    const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery.trim().replace(/;$/, "")}) as base`;

    const execPromise = (async (): Promise<{ data: any[]; count: number }> => {
      try {
        // Fix 1: when limit=0 (fetch all rows) or noCount=true, skip the COUNT wrapper.
        // The count CTE re-runs the entire query (including all CTEs) for a single number,
        // doubling execution time for every portfolio/enrollment call that uses limit=0.
        if (options.limit === 0 || options.noCount) {
          const data = await this.hrRepository.query(finalQuery);
          return { data, count: data.length };
        }

        const [data, countResult] = await Promise.all([
          this.hrRepository.query(finalQuery),
          this.hrRepository.query(countQuery),
        ]);

        return { data, count: parseInt(countResult[0].count, 10) };
      } finally {
        this.resultPending.delete(cacheKey);
      }
    })();

    this.resultPending.set(cacheKey, execPromise);

    const result = await execPromise;
    return result;
  }

  /**
   * Drops the cached row counts for a report (all params), regardless of the
   * 5 min TTL on `hr:count:*`. Call this right after a mutation that changes
   * what the report would return (e.g. extending an enrollment period), so the
   * next countReport() re-runs the query instead of serving a stale count.
   *
   * generateReport() itself has no result cache — `resultPending` is only
   * in-flight dedupe and clears in its own `finally` — so there is nothing else
   * to drop here. Best-effort: never throws, and no-ops when Redis is absent.
   */
  async invalidateReportCache(reportName: string): Promise<void> {
    if (!this.redis) return;
    const pattern = `hr:count:${reportName}:*`;
    try {
      let cursor = "0";
      do {
        const [next, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== "0");
    } catch {
      // Non-fatal: Redis cache invalidation failed, but the count cache will expire on its own TTL.
    }
  }

  async getEmployeeProfile(
    employeeId: number | null,
    search: string | null,
  ): Promise<{ data: any[]; count: number }> {
    const data = await this.hrRepository.getEmployeeProfile(employeeId, search);
    return { data, count: data.length };
  }

  async getPendingEnrollmentEmployeeIds(policyId: number): Promise<number[]> {
    return this.hrRepository.getPendingEnrollmentEmployeeIds(policyId);
  }

  async setEmployeeVip(employeeId: number, isVip: boolean): Promise<void> {
    await this.hrRepository.setEmployeeVip(employeeId, isVip);
  }

  async setEmployeeBlocked(employeeId: number, isBlocked: boolean): Promise<void> {
    await this.hrRepository.setEmployeeBlocked(employeeId, isBlocked);
  }

  async globalSearch(companyId: number, q: string, userId = 0, explicitHrId: number | null = null) {
    // Use explicitly passed hrManagementId, or resolve from userId header
    let hrManagementId: number | null = explicitHrId;
    if (!hrManagementId && userId > 0) {
      const ctx = await this.hrRepository.getExternalHrContext(userId);
      if (ctx.isExternalHr) hrManagementId = ctx.resolvedHrId;
    }
    return this.hrRepository.globalSearch(companyId, q, hrManagementId);
  }

  async getCompanyHierarchy(search: string, page: number, limit: number) {
    return this.hrRepository.getCompanyHierarchy(search, page, limit);
  }

  async countReport(
    reportName: string,
    params: Record<string, string>,
    userId = 0,
  ): Promise<{ count: number }> {
    // Cache key is shared across all admins (no userId) — same company+filters = same count.
    const countCacheKey = `hr:count:${reportName}:${JSON.stringify(params)}`;

    // Redis cache check — 5 min TTL so first admin warms it for everyone else
    if (this.redis) {
      try {
        const cached = await this.redis.get(countCacheKey);
        if (cached) return { count: parseInt(cached, 10) };
      } catch { /* Redis unavailable — fall through */ }
    }

    // Stampede protection — if two admins hit simultaneously, only one DB query runs
    const existing = this.countPending.get(countCacheKey);
    if (existing) return existing;

    const promise = (async (): Promise<{ count: number }> => {
      try {
        // Check if a dedicated count report exists (e.g. "enrollment_count" for "enrollment").
        // If yes, run it directly — it's a lightweight COUNT SQL, returns in milliseconds.
        // If no, fall back to the slow COUNT(*) wrap of the main query.
        const countReportName = `${reportName}_count`;
        const countReportExists = await this.hrRepository.findReport(countReportName);
        let count: number;
        if (countReportExists) {
          const { data } = await this.generateReport(countReportName, params, { page: 1, limit: 1, noCount: true }, userId);
          count = parseInt(String(data[0]?.count ?? data[0]?.COUNT ?? "0"), 10);
        } else {
          ({ count } = await this.generateReport(reportName, params, { page: 1, limit: 1 }, userId));
        }

        if (this.redis) {
          try { await this.redis.setex(countCacheKey, 300, String(count)); } catch { /* non-fatal */ }
        }
        return { count };
      } finally {
        this.countPending.delete(countCacheKey);
      }
    })();

    this.countPending.set(countCacheKey, promise);
    return promise;
  }

  async downloadReport(
    reportName: string,
    params: Record<string, string>,
    userId = 0,
  ): Promise<{ data: Buffer; fileName: string; mimeType: string }> {
    // Chunked download: fetch 500 rows at a time and convert to CSV lines immediately.
    // This keeps peak heap usage to ~1 chunk of row objects instead of the entire dataset.
    const CHUNK_SIZE = 10000;
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const csvLines: string[] = [];
    let page = 1;

    while (true) {
      const { data: chunk } = await this.generateReport(reportName, params, {
        page,
        limit: CHUNK_SIZE,
        noCount: true,
      }, userId);

      if (chunk.length === 0) break;

      if (page === 1) {
        csvLines.push(Object.keys(chunk[0]).map(escape).join(","));
      }
      for (const row of chunk) {
        csvLines.push(Object.values(row).map(escape).join(","));
      }
      // chunk dereferenced here — eligible for GC before next iteration

      if (chunk.length < CHUNK_SIZE) break;
      page++;
    }

    const csv = csvLines.join("\n");
    const fileBuffer = Buffer.from(csv, "utf8");

    const moduleKey = "hr_reports";
    const isModulePasswordEnabled = await this.getModulePasswordConfig(moduleKey);
    const shouldProtect = isPasswordProtectionEnabled() && isModulePasswordEnabled;

    if (!shouldProtect) {
      return {
        data: fileBuffer,
        fileName: `${reportName}.csv`,
        mimeType: "text/csv",
      };
    }

    const filePasswordConfigClient = new FilePasswordConfigClient();
    const passwordConfig = await filePasswordConfigClient.getConfiguration();
    const password = generatePasswordFromConfig(passwordConfig, null);

    const protectedFile = await applyPasswordProtection(
      fileBuffer,
      `${reportName}.csv`,
      password,
      moduleKey,
      isModulePasswordEnabled,
    );

    return {
      data: protectedFile.data,
      fileName: protectedFile.fileName,
      mimeType: protectedFile.mimeType,
    };
  }

  private async getModulePasswordConfig(categoryKey: string): Promise<boolean> {
    try {
      const documentServiceUrl =
        process.env["URL_DOCUMENT_SERVICE"] || "http://localhost:3013";
      const response = await axios.get(
        `${documentServiceUrl}/password-protection-config/${categoryKey}`,
        { timeout: 5000 },
      );
      const enablePassword = response?.data?.enablePassword;
      return Boolean(
        enablePassword === true ||
          enablePassword === 1 ||
          enablePassword === "true",
      );
    } catch {
      return false;
    }
  }

  private normalizeIndianPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    return phone.startsWith("+") ? phone : `+${digits}`;
  }

  async createExternalHrUser(
    dto: CreateExternalHrDto,
  ): Promise<{ hrManagementId: number }> {
    const existing = await this.hrRepository.findHrUserByEmail(dto.email);
    if (existing) {
      const roleLabel = existing.role_key === "HR_ADMIN" ? "HR Admin"
        : existing.role_key === "ONLY_HR" ? "HR"
        : existing.role_key === "EXTERNAL_HR" ? "External HR"
        : existing.role_key;
      throw new ConflictException(
        `A user with this email already exists as ${roleLabel}${existing.company_name ? ` (${existing.company_name})` : ""}.`,
      );
    }

    const baseLoginName = `${dto.firstName}${dto.lastName}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");
    const loginName = await this.hrRepository.generateUniqueLoginName(baseLoginName);

    // Resolve companies list — multi-company takes precedence over legacy single fields
    const companyEntries = dto.companies?.length
      ? dto.companies
      : dto.companyId != null
        ? [{ companyId: dto.companyId, policyIds: dto.policyIds ?? [], locationIds: dto.locationIds }]
        : [];

    const primaryCompanyId = companyEntries[0]?.companyId ?? dto.companyId;
    const companyName = primaryCompanyId ? await this.hrRepository.getCompanyName(primaryCompanyId) : null;

    const hrRecord = await this.hrRepository.createHrUserManagement({
      user_name: `${dto.firstName} ${dto.lastName}`,
      email_id: dto.email.toLowerCase().trim(),
      login_name: loginName,
      role_key: dto.roleKey ?? "EXTERNAL_HR",
      company_id: primaryCompanyId ?? null,
      company_name: companyName ?? undefined,
      phone_number: dto.phone ? this.normalizeIndianPhone(dto.phone) : dto.phone,
      date_of_birth: dto.dateOfBirth ?? null,
    });

    for (const entry of companyEntries) {
      if (entry.policyIds.length > 0) {
        await this.hrRepository.insertExternalHrPolicyMappings(hrRecord.id, entry.companyId, entry.policyIds);
      }
      if (entry.locationIds?.length) {
        await this.hrRepository.insertExternalHrLocationMappings(hrRecord.id, entry.companyId, entry.locationIds);
      }
    }

    return { hrManagementId: hrRecord.id };
  }

  async getEnrollmentUploadSummaryByEndorsement(
    policyId: number,
    endorsementId: number,
    page: number,
    limit: number,
  ) {
    return this.hrRepository.getEnrollmentUploadSummaryByEndorsement(
      policyId,
      endorsementId,
      page,
      limit,
    );
  }

  async getEndorsementStats(policyId: number, endorsementId: number, locationIds: number[] = []) {
    return this.hrRepository.getEndorsementStats(policyId, endorsementId, locationIds);
  }

  async updateExternalHrUser(
    hrManagementId: number,
    dto: UpdateExternalHrDto,
  ): Promise<{ hrManagementId: number }> {
    const hrRecord = await this.hrRepository.findHrManagementById(hrManagementId);
    if (!hrRecord) {
      throw new NotFoundException("HR user not found.");
    }

    const isInternalHr = hrRecord.role_key === "HR_ADMIN" || hrRecord.role_key === "ONLY_HR";

    const updateData: {
      user_name?: string;
      role_key?: string;
      phone_number?: string;
      date_of_birth?: string | null;
      user_status_key?: string;
      company_id?: number | null;
      company_name?: string | null;
      deleted_at?: Date | null;
    } = {};

    if (dto.firstName && dto.lastName) {
      updateData.user_name = `${dto.firstName} ${dto.lastName}`;
    }
    if (dto.phone) {
      updateData.phone_number = this.normalizeIndianPhone(dto.phone);
    }
    if (dto.dateOfBirth !== undefined) {
      updateData.date_of_birth = dto.dateOfBirth || null;
    }
    if (dto.status) {
      updateData.user_status_key = dto.status === "ACTIVE" ? USER_STATUS_ACTIVE : USER_STATUS_INACTIVE;
    }

    // Update primary company for all HR types
    const primaryCompanyId = dto.companies?.[0]?.companyId ?? dto.companyId;
    if (primaryCompanyId != null) {
      updateData.company_id = primaryCompanyId;
      const companyName = await this.hrRepository.getCompanyName(primaryCompanyId);
      updateData.company_name = companyName ?? null;
    }

    if (Object.keys(updateData).length > 0) {
      await this.hrRepository.updateHrUserManagement(hrRecord.id, updateData);
    }

    // Update policy/location mappings for all HR types (internal HR can also have access restrictions)
    if (dto.companies?.length) {
      await this.hrRepository.deleteExternalHrPolicyMappings(hrManagementId);
      await this.hrRepository.deleteExternalHrLocationMappings(hrManagementId);
      for (const entry of dto.companies) {
        if (entry.policyIds.length > 0) {
          await this.hrRepository.insertExternalHrPolicyMappings(hrManagementId, entry.companyId, entry.policyIds);
        }
        if (entry.locationIds?.length) {
          await this.hrRepository.insertExternalHrLocationMappings(hrManagementId, entry.companyId, entry.locationIds);
        }
      }
    } else if (!isInternalHr) {
      // Legacy flat-field path only for external HR (internal HR always uses multi-company)
      const effectiveCompanyId = primaryCompanyId ?? hrRecord.company_id;
      if (dto.policyIds !== undefined && effectiveCompanyId) {
        await this.hrRepository.deleteExternalHrPolicyMappings(hrManagementId);
        if (dto.policyIds.length > 0) {
          await this.hrRepository.insertExternalHrPolicyMappings(hrManagementId, effectiveCompanyId, dto.policyIds);
        }
      }
      if (dto.locationIds !== undefined && effectiveCompanyId) {
        await this.hrRepository.deleteExternalHrLocationMappings(hrManagementId);
        if (dto.locationIds.length > 0) {
          await this.hrRepository.insertExternalHrLocationMappings(hrManagementId, effectiveCompanyId, dto.locationIds);
        }
      }
    }

    return { hrManagementId };
  }

  async listHrAdminUsers(params: {
    companyId?: number;
    search?: string;
    page: number;
    limit: number;
  }) {
    return this.hrRepository.listHrAdminUsers(params);
  }

  async getHrUserDetail(hrManagementId: number) {
    const [record, policyMappings, locationMappings] = await Promise.all([
      this.hrRepository.findHrManagementById(hrManagementId),
      this.hrRepository.getHrUserPolicyMappings(hrManagementId),
      this.hrRepository.getHrUserLocationMappings(hrManagementId),
    ]);
    if (!record) return null;
    const nameParts = (record.user_name || "").split(" ");

    // Build companies grouped by client company ID (from map tables — NOT from hr_user_management.company_id
    // which is the HR admin's parent org, not the client companies they manage)
    const companyMap = new Map<number, { companyId: number; policyIds: number[]; locationIds: number[] }>();
    for (const pm of policyMappings) {
      if (!companyMap.has(pm.companyId)) companyMap.set(pm.companyId, { companyId: pm.companyId, policyIds: [], locationIds: [] });
      companyMap.get(pm.companyId)!.policyIds.push(pm.policyId);
    }
    for (const lm of locationMappings) {
      if (!companyMap.has(lm.companyId)) companyMap.set(lm.companyId, { companyId: lm.companyId, policyIds: [], locationIds: [] });
      companyMap.get(lm.companyId)!.locationIds.push(lm.addressId);
    }

    // Fetch company names for all client company IDs in one query
    const clientCompanyIds = Array.from(companyMap.keys());
    const companyNameMap = await this.hrRepository.getCompanyNamesByIds(clientCompanyIds);

    const companies = Array.from(companyMap.values()).map((c) => ({
      ...c,
      companyName: companyNameMap.get(c.companyId) || "",
    }));

    return {
      hrManagementId: record.id,
      fullName: record.user_name || "",
      firstName: nameParts[0] || "",
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
      email: record.email_id || "",
      phone: record.phone_number || "",
      dateOfBirth: record.date_of_birth
        ? (record.date_of_birth instanceof Date
            ? record.date_of_birth.toISOString().slice(0, 10)
            : String(record.date_of_birth).slice(0, 10))
        : "",
      roleKey: record.role_key || "",
      companyId: record.company_id,
      companyName: record.company_name || "",
      status: record.user_status_key === USER_STATUS_INACTIVE ? "INACTIVE" : "ACTIVE",
      companies,
      policyMappings,
      locationMappings,
    };
  }
  async updateEnrollmentWindow(
    employeeId: number,
    policyId: number,
    enrollmentStartDate: string | null,
    enrollmentEndDate: string | null,
  ) {
    const map = await this.policyEnrollmentEmployeePolicyMapRepo.findOne({
      where: { employeeId, policyId },
    });
    if (!map) {
      throw new NotFoundException(
        `No enrollment mapping found for employee ${employeeId} and policy ${policyId}`,
      );
    }
    map.enrollmentStartDate = enrollmentStartDate ? new Date(enrollmentStartDate) : null;
    map.enrollmentEndDate = enrollmentEndDate ? new Date(enrollmentEndDate) : null;
    await this.policyEnrollmentEmployeePolicyMapRepo.save(map);
    return { success: true };
  }
}
