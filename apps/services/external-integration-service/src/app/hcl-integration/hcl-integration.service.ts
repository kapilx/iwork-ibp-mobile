import { Injectable, UnauthorizedException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { HclEmployeeIntake } from "../../../../service-lib/src/lib/entities/hcl-employee-intake.entity";
import {
  HCL_AD_MESSAGES,
  HCL_BI_MESSAGES,
  HCL_DD_MESSAGE,
  HCL_ED_MESSAGE,
  HCL_ENV_PASSWORD_KEY,
  HCL_ENV_USERNAME_KEY,
  HCL_ES_MESSAGE,
  HCL_ET_MESSAGE,
  HCL_INVALID_CREDENTIALS_MESSAGE,
  HCL_NA_MESSAGE,
} from "./hcl-integration.constants";
import {
  EEmpHclDto,
  HclGetEmpStatusEntryDto,
  HclProcessEnrollDataDto,
  HclProcessEnrollDataResponseDto,
} from "./dto/hcl-process-enroll-data.dto";
import { HclIntegrationRepository } from "./hcl-integration.repository";

// Operation types whose documented sample response uses the per-entry
// GetEmpStatus[] array (with the top-level GetStatus left in the document's
// own "callStatus: false" batch-summary shape — see hcl-integration.constants
// header comment and TRD §4). All other operations are single-employee-
// oriented and use GetStatus alone, GetEmpStatus: [].
const BATCH_STYLE_OPERATIONS = new Set(["BI", "DD"]);

class HclValidationError extends Error {}

@Injectable()
export class HclIntegrationService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly hclRepo: HclIntegrationRepository,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.EXTERNAL_INTEGRATION_SERVICE);
  }

  // Top-level safety net — every branch below this point returns a proper
  // {status, body} matching HCL's documented shape, but nothing previously
  // caught a genuinely unexpected failure (a DB hiccup in resolvePolicy/
  // findExisting/insert, or any error validateOperationFields didn't
  // anticipate). Uncaught, that propagated straight through this method and
  // the controller (neither had a catch) to Nest's default exception
  // filter — a generic 500 that never touched our own logger, so it was
  // invisible to anyone grepping the structured logs. Now it's always
  // logged here (full message + stack) and always answered with HCL's
  // documented failure shape instead of a framework-generic response.
  async processEnrollData(
    body: unknown,
    userId: number,
    requestMeta?: {
      endpoint: string;
      httpMethod: string;
      ip?: string | null;
      headers?: Record<string, unknown> | null;
    },
  ): Promise<{ status: number; body: HclProcessEnrollDataResponseDto }> {
    this.logStep("processEnrollData", { message: "Starting doProcessEnrollData", userId });
    let result: { status: number; body: HclProcessEnrollDataResponseDto };
    try {
      result = await this.doProcessEnrollData(body, userId);
      this.logStep("processEnrollData", { message: "doProcessEnrollData completed", status: result.status });
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "HclIntegrationService",
          method: "processEnrollData",
          payload: { body },
          messageData:
            err instanceof Error ? { message: err.message, stack: err.stack } : err,
        }),
      });
      result = {
        status: 500,
        body: this.failureResponse(
          `Unexpected error while processing request: ${err instanceof Error ? err.message : "unknown error"}`,
        ),
      };
    }

    // Per-request audit log — one row per HTTP call regardless of outcome,
    // separate from the per-employee hcl_employee_intake rows. Best-effort:
    // logApiRequest already swallows its own errors, and requestMeta is
    // optional so this is a no-op if the controller ever calls this method
    // without it.
    if (requestMeta) {
      this.logStep("processEnrollData", { message: "Writing per-request audit log", endpoint: requestMeta.endpoint });
      await this.hclRepo.logApiRequest({
        endpoint: requestMeta.endpoint,
        httpMethod: requestMeta.httpMethod,
        requestIp: requestMeta.ip ?? null,
        requestHeaders: requestMeta.headers ?? null,
        requestPayload: body,
        responseStatus: result.status,
        responsePayload: result.body,
      });
    }

    this.logStep("processEnrollData", { message: "Returning response", status: result.status });
    return result;
  }

  private async doProcessEnrollData(
    body: unknown,
    userId: number,
  ): Promise<{ status: number; body: HclProcessEnrollDataResponseDto }> {
    // ── 1. Shape validation (TRD §4) ────────────────────────────────────
    const dto = plainToInstance(HclProcessEnrollDataDto, body);
    const errors = await validate(dto, { whitelist: true });
    if (errors.length) {
      const detail = errors
        .map((e) => Object.values(e.constraints ?? {}).join(", "))
        .join("; ");
      this.logStep("doProcessEnrollData", { message: "Rejected — shape validation failed", detail });
      return {
        status: 400,
        body: this.failureResponse(`Invalid request: ${detail}`),
      };
    }
    this.logStep("doProcessEnrollData", {
      message: "Step 1/5 passed — shape validation",
      flagOperationType: dto.Flag_operationType,
      policyno: dto.policyno,
      entryCount: dto.objEMPLOYEE_DATA?.length,
    });

    // ── 2. Authenticate (TRD §12 — net-new pattern, self-validated here,
    // not a generic guard, until a second inbound-credentialed integration
    // justifies one) ────────────────────────────────────────────────────
    const expectedUsername = ENV[HCL_ENV_USERNAME_KEY];
    const expectedPassword = ENV[HCL_ENV_PASSWORD_KEY];
    if (
      !expectedUsername ||
      !expectedPassword ||
      dto.UserName !== expectedUsername ||
      dto.Password !== expectedPassword
    ) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "HclIntegrationService",
          method: "processEnrollData",
          messageData: `Auth failed for UserName="${dto.UserName}"`,
        }),
      });
      throw new UnauthorizedException(
        this.failureResponse(HCL_INVALID_CREDENTIALS_MESSAGE),
      );
    }

    // ── 3. Per-operation required-field validation (TRD §4 table) ───────
    try {
      this.validateOperationFields(dto);
    } catch (err) {
      if (err instanceof HclValidationError) {
        this.logStep("doProcessEnrollData", { message: "Rejected — per-operation field validation failed", reason: err.message });
        return { status: 400, body: this.failureResponse(err.message) };
      }
      throw err;
    }
    this.logStep("doProcessEnrollData", { message: "Step 3/5 passed — per-operation field validation", flagOperationType: dto.Flag_operationType });

    // ── 4. Resolve policy/company — required, not best-effort (TRD §3, §5.1,
    // per direct instruction: a request whose policyno doesn't identify a
    // real policy in our DB must be rejected outright, not silently stored
    // with a null policy/company). Rejected before any intake row is
    // inserted — this request produces no row at all, not an unresolved one.
    if (!dto.policyno) {
      this.logStep("doProcessEnrollData", { message: "Rejected — policyno missing" });
      return {
        status: 400,
        body: this.failureResponse("policyno is missing in the request."),
      };
    }
    const { policyId, companyId } = await this.hclRepo.resolvePolicy(
      dto.policyno,
    );
    if (!policyId) {
      this.logStep("doProcessEnrollData", { message: "Rejected — policyno did not resolve to a policy", policyno: dto.policyno });
      return {
        status: 400,
        body: this.failureResponse(
          `Policy number "${dto.policyno}" is not available in IIRM database.`,
        ),
      };
    }
    this.logStep("doProcessEnrollData", { message: "Step 4/5 passed — policy resolved", policyno: dto.policyno, policyId, companyId });

    // ── 5. Per-entry dedup + intake insert (TRD §7) ──────────────────────
    const empStatuses: HclGetEmpStatusEntryDto[] = [];
    for (const entry of dto.objEMPLOYEE_DATA) {
      const emp = entry.E_EMP_HCL;
      const ein = String(emp.EIN);
      const dependents = entry.E_DEP_HCL ?? [];
      const relevantDepId =
        dto.Flag_operationType === "DD"
          ? this.coerceDepId(dto.Del_hcldepid)
          : dependents[0]?.HCL_DEPID ?? null;

      const existing = await this.hclRepo.findExisting(
        ein,
        emp.CHECK_SUM ?? null,
        dto.Flag_operationType === "DD" ? relevantDepId : undefined,
      );

      if (!existing) {
        const inserted = await this.hclRepo.insert({
          flagOperationType: dto.Flag_operationType,
          groupcode: dto.Groupcode ?? null,
          policyNo: dto.policyno ?? null,
          policyId,
          companyId,
          ein,
          hclDepid: relevantDepId,
          checkSum: emp.CHECK_SUM ?? null,
          rawPayload: body as Record<string, unknown>,
          parsedEmployee: emp as unknown as Record<string, unknown>,
          parsedDependents: dependents as unknown as Record<string, unknown>[],
        });
        this.logStep("doProcessEnrollData", {
          message: "Intake row inserted",
          ein,
          hclDepid: relevantDepId,
          intakeId: inserted.id,
        });
      } else {
        this.logStep("doProcessEnrollData", {
          message: `Duplicate request for EIN=${emp.EIN} (ein, checkSum) — treated as idempotent replay, no new intake row inserted.`,
          ein,
          existingIntakeId: existing.id,
        });
      }

      empStatuses.push(this.buildEmployeeStatus(dto.Flag_operationType, emp));
    }

    this.logStep("doProcessEnrollData", {
      message: "Step 5/5 passed — dedup/insert complete, building response",
      flagOperationType: dto.Flag_operationType,
      entriesProcessed: empStatuses.length,
    });
    return {
      status: 200,
      body: this.buildResponse(dto.Flag_operationType, dto, empStatuses),
    };
  }

  // ─── Per-operation required-field checks (TRD §4) ──────────────────────

  private validateOperationFields(dto: HclProcessEnrollDataDto): void {
    if (!dto.objEMPLOYEE_DATA.length) {
      throw new HclValidationError("objEMPLOYEE_DATA must contain at least one entry");
    }

    for (const entry of dto.objEMPLOYEE_DATA) {
      const emp = entry.E_EMP_HCL;
      if (!emp.EIN) throw new HclValidationError("E_EMP_HCL.EIN is required");

      switch (dto.Flag_operationType) {
        case "AD":
          if (emp.IS_EMPAD === undefined || emp.IS_EMPAD === null) {
            throw new HclValidationError("E_EMP_HCL.IS_EMPAD is required for AD");
          }
          if (emp.IS_EMCP === undefined || emp.IS_EMCP === null) {
            throw new HclValidationError("E_EMP_HCL.IS_EMCP is required for AD");
          }
          break;
        case "BI":
          if (!emp.INSUREDNAME) {
            throw new HclValidationError("E_EMP_HCL.INSUREDNAME is required for BI");
          }
          break;
        case "DD":
          if (this.coerceDepId(dto.Del_hcldepid) === null) {
            throw new HclValidationError("Del_hcldepid is required for DD");
          }
          break;
        case "NA": {
          const deps = entry.E_DEP_HCL ?? [];
          if (!deps.length) {
            throw new HclValidationError("E_DEP_HCL must contain at least one entry for NA");
          }
          for (const dep of deps) {
            if (!dep.DEP_NAME || dep.HCL_DEPREL === undefined || !dep.DEP_DOB || !dep.DEP_GENDER) {
              throw new HclValidationError(
                "E_DEP_HCL entries require DEP_NAME, HCL_DEPREL, DEP_DOB, DEP_GENDER for NA",
              );
            }
          }
          break;
        }
        // ED, ES, ET: only EIN required beyond the common shape, per the
        // document's own samples.
      }
    }
  }

  private coerceDepId(value: number | string | undefined): number | null {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  // ─── Response building — messages copied verbatim from the document ────

  private buildEmployeeStatus(
    flagType: string,
    emp: EEmpHclDto,
  ): HclGetEmpStatusEntryDto {
    let returnMessage: string;
    if (flagType === "BI") {
      returnMessage =
        (emp.NO_OF_DEPENDENTS ?? 0) > 0
          ? HCL_BI_MESSAGES.WITH_DEPENDENTS
          : HCL_BI_MESSAGES.WITHOUT_DEPENDENTS;
    } else if (flagType === "DD") {
      returnMessage = HCL_DD_MESSAGE;
    } else {
      returnMessage = this.singleEmployeeMessage(flagType, emp);
    }
    return {
      callStatus: true,
      ein: String(emp.EIN),
      procedureStatus: true,
      returnMessage,
      returnValue: 1,
    };
  }

  private singleEmployeeMessage(flagType: string, emp: EEmpHclDto): string {
    switch (flagType) {
      case "AD": {
        const isEmcp = emp.IS_EMCP === 1;
        const isActivating = emp.IS_EMPAD === 1;
        if (isEmcp && isActivating) return HCL_AD_MESSAGES.EMCP_ACTIVATED;
        if (!isEmcp && isActivating) return HCL_AD_MESSAGES.GHMI_ACTIVATED;
        if (isEmcp && !isActivating) return HCL_AD_MESSAGES.EMCP_DEACTIVATED;
        return HCL_AD_MESSAGES.GHMI_DEACTIVATED;
      }
      case "ED":
        return HCL_ED_MESSAGE;
      case "ES":
        return HCL_ES_MESSAGE;
      case "ET":
        return HCL_ET_MESSAGE;
      case "NA":
        return HCL_NA_MESSAGE;
      default:
        return "Processed successfully.";
    }
  }

  private buildResponse(
    flagType: string,
    dto: HclProcessEnrollDataDto,
    empStatuses: HclGetEmpStatusEntryDto[],
  ): HclProcessEnrollDataResponseDto {
    if (BATCH_STYLE_OPERATIONS.has(flagType)) {
      // Replicated verbatim from the document's own BI/DD sample OUTPUT
      // Response: GetStatus.callStatus is false even though every
      // GetEmpStatus[] entry succeeded. This looks like a quirk of HCL's
      // reference implementation, not a typo — reproduced exactly per the
      // instruction to match their documented contract field-for-field,
      // since their HRMS client code may already depend on this shape.
      return {
        GetEmpDetails: null,
        GetEmpStatus: empStatuses,
        GetStatus: {
          callStatus: false,
          procedureStatus: false,
          returnMessage: "",
          returnValue: 0,
        },
      };
    }

    const emp = dto.objEMPLOYEE_DATA[0]?.E_EMP_HCL;
    const returnMessage = emp
      ? this.singleEmployeeMessage(flagType, emp)
      : "Processed successfully.";
    return {
      GetEmpDetails: null,
      GetEmpStatus: [],
      GetStatus: {
        callStatus: true,
        procedureStatus: true,
        returnMessage,
        returnValue: 1,
      },
    };
  }

  private failureResponse(message: string): HclProcessEnrollDataResponseDto {
    return {
      GetEmpDetails: null,
      GetEmpStatus: [],
      GetStatus: {
        callStatus: false,
        procedureStatus: false,
        returnMessage: message,
        returnValue: 0,
      },
    };
  }

  // ─── RiskWatch read/select API (TRD §8) ─────────────────────────────────
  //
  // Every method below logs (full message + stack) and rethrows on failure
  // — same reasoning as processEnrollData's top-level catch and the
  // repository layer's logAndRethrow: previously a repository-level failure
  // here propagated straight to the controller's own catch with no
  // service-layer trace of what was being attempted, making a genuine DB
  // issue indistinguishable from a "not found" in the logs.

  private logStep(method: string, messageData: unknown): void {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "HclIntegrationService",
        method,
        messageData,
      }),
    });
  }

  private logAndRethrow(method: string, payload: Record<string, unknown>, err: unknown): never {
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "failure",
        location: "HclIntegrationService",
        method,
        payload,
        messageData: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      }),
    });
    throw err;
  }

  async listForCompany(
    companyId: number,
    status?: string,
    page = 1,
    limit = 10,
  ): Promise<{ records: HclEmployeeIntake[]; total: number; page: number; limit: number }> {
    this.logStep("listForCompany", { message: "Starting", companyId, status, page, limit });
    try {
      const { records, total } = await this.hclRepo.findByCompany(companyId, status, page, limit);
      this.logStep("listForCompany", { message: "Completed", companyId, total, returned: records.length });
      return { records, total, page, limit };
    } catch (err) {
      this.logAndRethrow("listForCompany", { companyId, status, page, limit }, err);
    }
  }

  // Rows that arrived but whose policyno never resolved to a real policy —
  // invisible to listForCompany/listForPolicy since both require a non-null
  // id. Lets an admin (or a developer testing with HCL's own sample
  // payloads, whose policyno is always a placeholder) see them at all.
  async listUnresolved(status?: string): Promise<HclEmployeeIntake[]> {
    this.logStep("listUnresolved", { message: "Starting", status });
    try {
      const records = await this.hclRepo.findUnresolved(status);
      this.logStep("listUnresolved", { message: "Completed", returned: records.length });
      return records;
    } catch (err) {
      this.logAndRethrow("listUnresolved", { status }, err);
    }
  }

  async listForPolicy(
    policyId: number,
    status?: string,
  ): Promise<HclEmployeeIntake[]> {
    this.logStep("listForPolicy", { message: "Starting", policyId, status });
    try {
      const records = await this.hclRepo.findByPolicy(policyId, status);
      this.logStep("listForPolicy", { message: "Completed", policyId, returned: records.length });
      return records;
    } catch (err) {
      this.logAndRethrow("listForPolicy", { policyId, status }, err);
    }
  }

  // Called by the frontend once it has driven the selected records through
  // the existing enrollment-upload endpoint (reusing ZohoEndorsementPage's
  // flow — TRD §6, §8) and knows the resulting document_processing_file id.
  // Final PROCESSED/FAILED status is set later by the scheduler-service
  // reconciliation poller (TRD §10), never optimistically here (PRD FR-7).
  async markSelectedProcessing(
    intakeIds: number[],
    documentProcessingFileId: number,
    endorsementId: number | undefined,
    userId: number,
  ): Promise<void> {
    this.logStep("markSelectedProcessing", { message: "Starting", intakeIds, documentProcessingFileId, endorsementId, userId });
    try {
      const rows = await this.hclRepo.findByIds(intakeIds);
      const eligible = rows
        .filter((r) => r.status === "RECEIVED" || r.status === "FAILED")
        .map((r) => r.id);
      this.logStep("markSelectedProcessing", {
        message: "Eligible rows resolved",
        requested: intakeIds.length,
        eligible: eligible.length,
        skipped: intakeIds.length - eligible.length,
      });
      await this.hclRepo.markProcessing(
        eligible,
        documentProcessingFileId,
        endorsementId,
        userId,
      );
      this.logStep("markSelectedProcessing", { message: "Completed", documentProcessingFileId });
    } catch (err) {
      this.logAndRethrow(
        "markSelectedProcessing",
        { intakeIds, documentProcessingFileId, endorsementId },
        err,
      );
    }
  }
}
