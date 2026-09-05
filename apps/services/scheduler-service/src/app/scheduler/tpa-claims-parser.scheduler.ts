import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, LessThan, Repository } from "typeorm";
import { TpaExternalFeatureConfig } from "../../../../service-lib/src/lib/entities/tpa-external-feature-config.entity";
import { MstrExtAppResponseMapping } from "../../../../service-lib/src/lib/entities/mstr-ext-app-response-mapping.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { PolicyClaim } from "../../../../service-lib/src/lib/entities/policy-employee-claim.entity";
import { PolicyClaimSettlement } from "../../../../service-lib/src/lib/entities/policy-employee-claim-settlement.entity";
import { PolicyEnrollmentEmployee } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity";
import { RawTpaClaimResponse, RawTpaClaimResponseStatus } from "../../../../service-lib/src/lib/entities/raw-tpa-claim-response.entity";
import { TpaClaimData } from "../../../../service-lib/src/lib/entities/tpa-claim-data.entity";

const BATCH_SIZE = 30;
const TPA_DATA_TYPE = "TPA";
const FETCH_CLAIMS_API_TYPE = "FETCH_CLAIMS";

// Retain PROCESSED raw responses for 7 days then delete
const RETENTION_DAYS = 7;

@Injectable()
export class TpaClaimsParserScheduler {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(RawTpaClaimResponse)
    private readonly rawResponseRepo: Repository<RawTpaClaimResponse>,
    @InjectRepository(PolicyClaim)
    private readonly policyClaimRepo: Repository<PolicyClaim>,
    @InjectRepository(PolicyClaimSettlement)
    private readonly settlementRepo: Repository<PolicyClaimSettlement>,
    @InjectRepository(TpaClaimData)
    private readonly tpaClaimDataRepo: Repository<TpaClaimData>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly enrollmentEmployeeRepo: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(TpaExternalFeatureConfig)
    private readonly tpaApiConfigRepo: Repository<TpaExternalFeatureConfig>,
    @InjectRepository(MstrExtAppResponseMapping)
    private readonly responseMappingRepo: Repository<MstrExtAppResponseMapping>,
  ) {}

  // ─── Parser Cron ─────────────────────────────────────────────────────────────
  // Runs every 5 min (testing). Production: "30 22 * * *" (04:00 AM IST)
  // @Cron("*/5 * * * *") — disabled: replaced by GenericTpaSyncScheduler
  async runParser(): Promise<void> {
    console.log("[TpaParser] Starting run");

    let responses: RawTpaClaimResponse[] = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      responses = await queryRunner.manager
        .getRepository(RawTpaClaimResponse)
        .createQueryBuilder("r")
        .where("r.processingStatus = :status", {
          status: RawTpaClaimResponseStatus.RECEIVED,
        })
        .orderBy("r.receivedAt", "ASC")
        .limit(BATCH_SIZE)
        .setLock("pessimistic_write")
        .setOnLocked("skip_locked")
        .getMany();

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    console.log(`[TpaParser] Picked ${responses.length} responses to process`);

    if (responses.length === 0) {
      console.log("[TpaParser] No responses to process, exiting");
      return;
    }

    let processed = 0;
    let failed = 0;

    for (const response of responses) {
      try {
        await this.processRawResponse(response);

        await this.rawResponseRepo.update(response.id, {
          processingStatus: RawTpaClaimResponseStatus.PROCESSED,
          errorMessage: null,
        });

        processed++;
        console.log(
          `[TpaParser] Processed responseId=${response.id} policyNumber=${response.policyNumber} claims=${response.responsePayload.length}`,
        );
      } catch (err: any) {
        await this.rawResponseRepo.update(response.id, {
          processingStatus: RawTpaClaimResponseStatus.FAILED,
          errorMessage: (err as Error).message,
        });
        failed++;
        console.error(
          `[TpaParser] Failed responseId=${response.id} policyNumber=${response.policyNumber} error=${(err as Error).message}`,
        );
      }
    }

    console.log(`[TpaParser] Run complete — processed=${processed} failed=${failed}`);
  }

  // ─── Cleanup Cron ────────────────────────────────────────────────────────────
  // @Cron("30 21 * * *") — disabled: replaced by GenericTpaSyncScheduler
  async runCleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.rawResponseRepo.delete({
      processingStatus: RawTpaClaimResponseStatus.PROCESSED,
      createdAt: LessThan(cutoff),
    });
    console.log(
      `[TpaParser:Cleanup] Deleted ${result.affected ?? 0} processed responses older than ${RETENTION_DAYS} days`,
    );
  }

  // ─── Process a single raw response ───────────────────────────────────────────
  // Loads field mappings from mstr_ext_app_response_mapping (same as hospital sync).
  // Falls back to fieldMapping JSON from tpa_external_feature_config for backward compat.
  private async processRawResponse(response: RawTpaClaimResponse): Promise<void> {
    console.log(`[TpaParser:processRawResponse] >>> responseId=${response.id} policyNumber=${response.policyNumber} tpaId=${response.tpaId} claimsCount=${response.responsePayload?.length ?? 0}`);
    const { policyNumber, tpaId, responsePayload: claims } = response;

    // Load TPA config for this response
    const config = tpaId
      ? await this.tpaApiConfigRepo.findOne({
          where: { tpaId, apiType: FETCH_CLAIMS_API_TYPE, isActive: true },
        })
      : null;

    // ── Primary: load from mstr_ext_app_response_mapping (same table as hospital) ──
    const appMappings = config?.appRefId
      ? await this.responseMappingRepo.find({
          where: { appRefId: config.appRefId, step: 2, targetType: "DB_COLUMN" },
          order: { displayOrder: "ASC" },
        })
      : [];

    // Build lookup: db_column_name → tpa_response_key
    // e.g. { "tpa_claim_no": "CLAIM_NO", "employee_tpa_id": "MEM_CARDNO", ... }
    const apiKeyByColumn = new Map<string, string>(
      appMappings.map((m) => [m.outputKey, m.responseKey]),
    );
    const useMappingTable = appMappings.length > 0;

    // ── Fallback: old fieldMapping JSON from config (backward compat) ──
    const fieldMapping = (!useMappingTable && config?.fieldMapping)
      ? (config.fieldMapping as Record<string, string>)
      : null;
    const statusMapping = config?.statusMapping
      ? (config.statusMapping as Record<string, string>)
      : null;

    console.log(`[TpaParser:processRawResponse] useMappingTable=${useMappingTable} appMappings=${appMappings.length} fallbackFieldMapping=${!!fieldMapping} claims=${claims.length}`);

    let saved = 0, skipped = 0, failed = 0;

    // Avoid re-attempting the same status insert for every claim in this batch
    // that shares it — policy_claim_status.status is unique, so the insert
    // itself is race-safe regardless, this just skips the redundant round trip.
    const seenStatusesThisRun = new Set<string>();

    for (const c of claims) {
      // ── Field extraction helper ──────────────────────────────────────────────
      // New (mapping table): claim[apiKeyByColumn.get(dbCol)]
      // Old (fieldMapping JSON): claim[fieldMapping[stdKey]] or claim[stdKey]
      const getVal = (dbCol: string, fallbackStdKey?: string): unknown => {
        if (useMappingTable) {
          const tpaKey = apiKeyByColumn.get(dbCol);
          return tpaKey != null ? (c[tpaKey] ?? null) : null;
        }
        return fallbackStdKey ? this.resolveField(c, fallbackStdKey, fieldMapping) : null;
      };

      const tpaClaimNo: string | null = this.toEntityStr(getVal("tpa_claim_no", "CLAIM_ID"));
      const employeeTpaId: string | null = this.toEntityStr(getVal("employee_tpa_id", "TPA_ID"));

      if (!tpaClaimNo) {
        skipped++;
        console.log(`[TpaParser] Skipping claim — no tpa_claim_no found (mapped from "${apiKeyByColumn.get("tpa_claim_no") ?? "CLAIM_ID"}")`);
        continue;
      }

      try {
        await this.policyClaimRepo.manager.transaction(async (em) => {
          const claimRepo = em.getRepository(PolicyClaim);
          const settlementRepo = em.getRepository(PolicyClaimSettlement);
          const tpaRepo = em.getRepository(TpaClaimData);

          const matchWhere = employeeTpaId ? { tpaClaimNo, employeeTpaId } : { tpaClaimNo };

          const existingClaims = await claimRepo.find({
            where: matchWhere,
            select: ["id", "claimStatus", "claimNumber"],
          });

          // Normalize TPA status string to our internal status via statusMapping
          const rawStatus = this.toEntityStr(getVal("claim_status", "CLAIM_STATUS"));
          const incomingStatus = this.resolveStatus(rawStatus, statusMapping);

          if (rawStatus && !seenStatusesThisRun.has(rawStatus)) {
            await em.query(
              `INSERT INTO policy_claim_status (status, iirm_status, created_by, updated_by)
               VALUES ($1, NULL, 0, 0)
               ON CONFLICT (status) DO NOTHING`,
              [rawStatus],
            );
            seenStatusesThisRun.add(rawStatus);
          }

          // Never overwrite a SETTLED claim with a non-settled one
          const alreadySettled = existingClaims.some(
            (r) => String(r.claimStatus ?? "").toLowerCase() === "settled",
          );
          if (alreadySettled && (incomingStatus ?? "").toLowerCase() !== "settled") {
            return;
          }

          // Portal claims (have claim_number) are updated, not replaced
          const portalClaim = existingClaims.find((r) => !!r.claimNumber);

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

          // Hospital location: try direct mapping first, then combine city + state
          const hospitalCity = this.toEntityStr(getVal("hospital_city_tmp", "HOSPITAL_CITY"));
          const hospitalState = this.toEntityStr(getVal("hospital_state_tmp", "HOSPITAL_STATE"));
          const hospitalLocationDirect = this.toEntityStr(getVal("clm_hospital_location", "HOSPITAL_LOCATION"));
          const hospitalLocation =
            hospitalLocationDirect ??
            ([hospitalCity, hospitalState].filter((v): v is string => !!v).join(", ") || null);

          let savedClaim: PolicyClaim;

          if (portalClaim) {
            await claimRepo.update(portalClaim.id, {
              claimType:             this.toEntityStr(getVal("clm_type", "CLAIM_TYPE")) ?? undefined,
              claimPreAuthId:        this.toEntityStr(getVal("clm_pre_auth_id", "PRE_AUTH_NO")) ?? undefined,
              claimPreAuthDate:      this.toEntityDate(getVal("clm_pre_auth_date", "PRE_AUTH_REQUEST_DATE")) ?? undefined,
              claimPreAuthAmount:    this.toEntityNum(getVal("clm_pre_auth_amt", "PRE_AUTH_AMOUNT")) ?? undefined,
              claimDateOfAdmission:  this.toEntityDate(getVal("clm_doa", "DATE_OF_ADMISSION")) ?? undefined,
              claimDateOfDischarge:  this.toEntityDate(getVal("clm_dod", "DATE_OF_DISCHARGE")) ?? undefined,
              claimDate:             this.toEntityDate(getVal("claim_dt", "CLAIM_REG_DATE")) ?? undefined,
              claimAmount:           this.toEntityNum(getVal("claim_amount", "CLAIM_AMOUNT")) ?? undefined,
              claimAllowedAmount:    this.toEntityNum(getVal("clm_allowed_amt", "APPROVED_AMOUNT")) ?? undefined,
              claimStatus:           incomingStatus ?? undefined,
              claimDescription:      this.toEntityStr(getVal("claim_description", "AILMENT")) ?? undefined,
              claimHospital:         this.toEntityStr(getVal("clm_hospital", "HOSPITAL_NAME")) ?? undefined,
              claimHospitalLocation: hospitalLocation ?? undefined,
              patientName:           this.toEntityStr(getVal("patient_name", "PATIENT_NAME")) ?? undefined,
              patientRelation:       this.toEntityStr(getVal("patient_relation", "PATIENT_RELATION")) ?? undefined,
              totalSumInsured:       this.toEntityNum(getVal("total_sum_insured", "SUM_INSURED")) ?? undefined,
              totalAvailableBalance: this.toEntityNum(getVal("total_available_balance", "BALANCE_SUM_INSURED")) ?? undefined,
              policyStartDate:       this.toEntityDate(getVal("policy_start_date", "POLICY_START_DATE")) ?? undefined,
              policyEndDate:         this.toEntityDate(getVal("policy_end_date", "POLICY_END_DATE")) ?? undefined,
            });
            savedClaim = (await claimRepo.findOne({ where: { id: portalClaim.id } }))!;
          } else {
            const pureTpaIds = existingClaims.filter((r) => !r.claimNumber).map((r) => r.id);
            if (pureTpaIds.length > 0) {
              await settlementRepo.delete({ claimId: In(pureTpaIds) });
              await claimRepo.delete(matchWhere);
            }

            const newClaim = claimRepo.create({
              policyId:              (policy?.id ?? null) as unknown as number,
              employeeId:            (employee?.id ?? null) as unknown as number,
              employeeTpaId:         employeeTpaId ?? "",
              tpaClaimNo,
              claimType:             this.toEntityStr(getVal("clm_type", "CLAIM_TYPE")),
              claimPreAuthId:        this.toEntityStr(getVal("clm_pre_auth_id", "PRE_AUTH_NO")),
              claimPreAuthDate:      this.toEntityDate(getVal("clm_pre_auth_date", "PRE_AUTH_REQUEST_DATE")),
              claimPreAuthAmount:    this.toEntityNum(getVal("clm_pre_auth_amt", "PRE_AUTH_AMOUNT")),
              claimDateOfAdmission:  this.toEntityDate(getVal("clm_doa", "DATE_OF_ADMISSION")),
              claimDateOfDischarge:  this.toEntityDate(getVal("clm_dod", "DATE_OF_DISCHARGE")),
              claimDate:             this.toEntityDate(getVal("claim_dt", "CLAIM_REG_DATE")),
              claimAmount:           this.toEntityNum(getVal("claim_amount", "CLAIM_AMOUNT")),
              claimAllowedAmount:    this.toEntityNum(getVal("clm_allowed_amt", "APPROVED_AMOUNT")),
              claimStatus:           incomingStatus,
              claimDescription:      this.toEntityStr(getVal("claim_description", "AILMENT")),
              claimHospital:         this.toEntityStr(getVal("clm_hospital", "HOSPITAL_NAME")),
              claimHospitalLocation: hospitalLocation,
              employeeName:          this.toEntityStr(getVal("employee_name", "EMPLOYEE_NAME")),
              patientName:           this.toEntityStr(getVal("patient_name", "PATIENT_NAME")),
              patientRelation:       this.toEntityStr(getVal("patient_relation", "PATIENT_RELATION")),
              totalSumInsured:       this.toEntityNum(getVal("total_sum_insured", "SUM_INSURED")),
              totalAvailableBalance: this.toEntityNum(getVal("total_available_balance", "BALANCE_SUM_INSURED")),
              companyName:           this.toEntityStr(getVal("company_name", "COMPANY_NAME")),
              policyNumber,
              policyStartDate:       this.toEntityDate(getVal("policy_start_date", "POLICY_START_DATE")),
              policyEndDate:         this.toEntityDate(getVal("policy_end_date", "POLICY_END_DATE")),
            });
            savedClaim = await claimRepo.save(newClaim);
          }

          // Upsert tpa_claim_data
          let tpaRecord = await tpaRepo.findOne({
            where: { policyNumber, tpaClaimNo, dataType: TPA_DATA_TYPE },
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
              dataType: TPA_DATA_TYPE,
              claimData: c,
            });
          }
          const savedTpa = await tpaRepo.save(tpaRecord);

          if (savedClaim?.id && savedTpa?.id) {
            await em.query(
              `UPDATE public.policy_claim SET tpa_claim_ref_id = $1 WHERE id = $2`,
              [savedTpa.id, savedClaim.id],
            );
          }

          const isSettled = (incomingStatus ?? "").toLowerCase() === "settled";
          const chequeAmount = this.toEntityNum(getVal("cheque_amount_tmp", "CHEQUE_AMOUNT"));
          const settledDate = this.toEntityDate(getVal("settled_date_tmp", "SETTLED_DATE"));

          if (isSettled && (chequeAmount !== null || settledDate !== null)) {
            const settlement = settlementRepo.create({
              claimId: savedClaim!.id,
              settlementAmount: chequeAmount,
              settlementDate: settledDate,
              settlementNo: this.toEntityStr(getVal("neft_ref_no_tmp", "NEFT_REF_NO")),
              disallowedAmount: this.toEntityNum(getVal("deduction_amount_tmp", "DEDUCTION_AMOUNT")),
              settlementDetails: this.toEntityStr(getVal("deduction_reasons_tmp", "DEDUCTION_REASONS")),
            });
            await settlementRepo.save(settlement);
          }
        });

        saved++;
      } catch (err) {
        failed++;
        console.error(
          `[TpaParser] Failed claim=${tpaClaimNo} policyNumber=${policyNumber} error=${(err as Error).message}`,
        );
      }
    }

    console.log(
      `[TpaParser] Policy=${policyNumber} — saved=${saved} skipped=${skipped} failed=${failed}`,
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  // Fallback field resolver for old fieldMapping JSON approach
  private resolveField(
    claim: Record<string, any>,
    stdKey: string,
    fieldMapping: Record<string, string> | null,
  ): unknown {
    if (fieldMapping) {
      const tpaKey = fieldMapping[stdKey];
      if (tpaKey) return claim[tpaKey] ?? null;
    }
    return claim[stdKey] ?? null;
  }

  private resolveStatus(
    rawStatus: string | null,
    statusMapping: Record<string, string> | null,
  ): string | null {
    if (!rawStatus) return null;
    if (statusMapping) {
      const mapped = statusMapping[rawStatus];
      if (mapped) return mapped;
    }
    return rawStatus;
  }

  private nb(val: unknown): unknown {
    return val === null || val === undefined || val === "" ? null : val;
  }

  private toSqlDate(val: unknown): string | null {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    if (!s) return null;
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
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
}
