import { Injectable } from "@nestjs/common";
import { DataSource, In, IsNull } from "typeorm";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import {
  HCL_INTAKE_STATUS,
  HclEmployeeIntake,
} from "../../../../service-lib/src/lib/entities/hcl-employee-intake.entity";
import { HclApiRequestLog } from "../../../../service-lib/src/lib/entities/hcl-api-request-log.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";

export interface HclApiRequestLogInput {
  endpoint: string;
  httpMethod: string;
  requestIp?: string | null;
  requestHeaders?: Record<string, unknown> | null;
  requestPayload?: unknown;
  responseStatus?: number | null;
  responsePayload?: unknown;
}

export interface HclIntakeRecordInput {
  flagOperationType: string;
  groupcode?: string | null;
  policyNo?: string | null;
  policyId?: number | null;
  companyId?: number | null;
  ein: string;
  hclDepid?: number | null;
  checkSum?: string | null;
  rawPayload: Record<string, unknown>;
  parsedEmployee: Record<string, unknown>;
  parsedDependents: Record<string, unknown>[];
}

// DataSource-based (not TypeOrmModule.forFeature) — matches the existing
// convention in hr.repository.ts for ad-hoc repository access to entities
// this module doesn't otherwise own.
//
// Every method below wraps its DB call in try/catch: logs the full error
// (message + stack) via the structured logger, then rethrows unchanged —
// the service layer decides what HTTP status/response shape a failure here
// becomes. This repository never had that logging before; a DB-level
// failure here was invisible until it surfaced (or didn't) several layers
// up. See HclIntegrationService.processEnrollData's own top-level catch for
// the same reasoning applied at the service layer.
@Injectable()
export class HclIntegrationRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.EXTERNAL_INTEGRATION_SERVICE);
  }

  private get repo() {
    return this.dataSource.getRepository(HclEmployeeIntake);
  }

  private logStep(method: string, messageData: unknown): void {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "HclIntegrationRepository",
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
        location: "HclIntegrationRepository",
        method,
        payload,
        messageData: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      }),
    });
    throw err;
  }

  // Resolve a policy from HCL's policyno. Returns nulls if it doesn't match
  // any policy — the caller (HclIntegrationService.processEnrollData) now
  // treats that as a hard rejection, not a best-effort/nullable outcome, so
  // this raw lookup itself stays a plain "found or not" helper. Note: HCL's
  // own document sample payloads use placeholder values ("900020001111",
  // "NA") that will never resolve — real HCL traffic must send a policyno
  // that exists in this table.
  async resolvePolicy(
    policyno: string | undefined,
  ): Promise<{ policyId: number | null; companyId: number | null }> {
    this.logStep("resolvePolicy", { message: "Starting", policyno });
    try {
      if (!policyno) return { policyId: null, companyId: null };
      const policy = await this.dataSource
        .getRepository(Policy)
        .findOne({ where: { insurerPolicyNumber: policyno } });
      const result = policy
        ? { policyId: policy.id, companyId: policy.companyId ?? null }
        : { policyId: null, companyId: null };
      this.logStep("resolvePolicy", { message: "Completed", policyno, ...result });
      return result;
    } catch (err) {
      this.logAndRethrow("resolvePolicy", { policyno }, err);
    }
  }

  // Dedup lookup (TRD §7) — best-effort key the document actually supports:
  // (ein, check_sum). Returns the existing row if this exact request was
  // already accepted before.
  async findExisting(
    ein: string,
    checkSum: string | null | undefined,
    hclDepid?: number | null,
  ): Promise<HclEmployeeIntake | null> {
    this.logStep("findExisting", { message: "Starting", ein, hclDepid });
    try {
      if (!checkSum) return null;
      const existing = await this.repo.findOne({
        where: { ein, checkSum, ...(hclDepid != null ? { hclDepid } : {}) },
      });
      this.logStep("findExisting", { message: "Completed", ein, found: Boolean(existing), existingId: existing?.id });
      return existing;
    } catch (err) {
      this.logAndRethrow("findExisting", { ein, hclDepid }, err);
    }
  }

  async insert(record: HclIntakeRecordInput): Promise<HclEmployeeIntake> {
    this.logStep("insert", { message: "Starting", ein: record.ein, policyId: record.policyId });
    try {
      const entity = this.repo.create({
        ...record,
        status: HCL_INTAKE_STATUS.RECEIVED,
      });
      const saved = await this.repo.save(entity);
      this.logStep("insert", { message: "Completed", ein: record.ein, intakeId: saved.id });
      return saved;
    } catch (err) {
      this.logAndRethrow("insert", { ein: record.ein, policyId: record.policyId }, err);
    }
  }

  // Paginated — a company can accumulate a large number of intake rows over
  // time (every AD/BI/DD/etc. HCL ever pushed), and the RiskWatch dialog
  // this backs was originally fetching the entire unbounded set in one call.
  // page is 1-indexed; limit defaults to 10 to match the dialog's page size.
  async findByCompany(
    companyId: number,
    status?: string,
    page = 1,
    limit = 10,
  ): Promise<{ records: HclEmployeeIntake[]; total: number }> {
    this.logStep("findByCompany", { message: "Starting", companyId, status, page, limit });
    try {
      const [records, total] = await this.repo.findAndCount({
        where: { companyId, ...(status ? { status: status as any } : {}) },
        order: { createdAt: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      });
      this.logStep("findByCompany", { message: "Completed", companyId, total, returned: records.length });
      return { records, total };
    } catch (err) {
      this.logAndRethrow("findByCompany", { companyId, status, page, limit }, err);
    }
  }

  // Rows whose policyno never resolved to a real policy (TRD §3, §5.1) —
  // e.g. HCL's own placeholder test payloads ("900020001111", "NA"), or a
  // genuinely unmapped policy in production. These are otherwise invisible
  // to findByCompany/findByPolicy since both filter on a non-null id, so
  // without this an admin has no way to see intake that arrived but never
  // got attached to a company.
  async findUnresolved(status?: string): Promise<HclEmployeeIntake[]> {
    this.logStep("findUnresolved", { message: "Starting", status });
    try {
      const records = await this.repo.find({
        where: { companyId: IsNull(), ...(status ? { status: status as any } : {}) },
        order: { createdAt: "DESC" },
      });
      this.logStep("findUnresolved", { message: "Completed", returned: records.length });
      return records;
    } catch (err) {
      this.logAndRethrow("findUnresolved", { status }, err);
    }
  }

  async findByPolicy(
    policyId: number,
    status?: string,
  ): Promise<HclEmployeeIntake[]> {
    this.logStep("findByPolicy", { message: "Starting", policyId, status });
    try {
      const records = await this.repo.find({
        where: { policyId, ...(status ? { status: status as any } : {}) },
        order: { createdAt: "DESC" },
      });
      this.logStep("findByPolicy", { message: "Completed", policyId, returned: records.length });
      return records;
    } catch (err) {
      this.logAndRethrow("findByPolicy", { policyId, status }, err);
    }
  }

  async findByIds(ids: number[]): Promise<HclEmployeeIntake[]> {
    this.logStep("findByIds", { message: "Starting", ids });
    try {
      if (!ids.length) return [];
      const records = await this.repo.find({ where: { id: In(ids) } });
      this.logStep("findByIds", { message: "Completed", requested: ids.length, returned: records.length });
      return records;
    } catch (err) {
      this.logAndRethrow("findByIds", { ids }, err);
    }
  }

  // Called once an admin has submitted the selected records into the
  // existing enrollment-upload pipeline (TRD §2 step 8e).
  async markProcessing(
    ids: number[],
    documentProcessingFileId: number,
    endorsementId: number | undefined,
    updatedBy: number,
  ): Promise<void> {
    this.logStep("markProcessing", { message: "Starting", ids, documentProcessingFileId, endorsementId });
    try {
      if (!ids.length) return;
      await this.repo.update(
        { id: In(ids) },
        {
          status: HCL_INTAKE_STATUS.PROCESSING,
          documentProcessingFileId,
          endorsementId: endorsementId ?? null,
          // Clear any failure_reason from a previous failed attempt — this is
          // a fresh submission being retried, and the stale message must not
          // survive alongside a later PROCESSED status if this attempt
          // succeeds (found via real data: a row showed status=PROCESSED with
          // a leftover failure_reason from the prior document_processing_file
          // it was submitted against before the retry).
          failureReason: null,
          updatedBy,
        },
      );
      this.logStep("markProcessing", { message: "Completed", ids, documentProcessingFileId });
    } catch (err) {
      this.logAndRethrow("markProcessing", { ids, documentProcessingFileId, endorsementId }, err);
    }
  }

  // Reconciliation (TRD §10/§11). Superseded in practice by
  // HclIntakeReconciliationScheduler (scheduler-service), which queries/
  // updates hcl_employee_intake directly rather than through this
  // repository — kept for any future caller that wants the same effect via
  // this service's own repository layer.
  async markProcessed(ids: number[], endorsementId: number | null): Promise<void> {
    this.logStep("markProcessed", { message: "Starting", ids, endorsementId });
    try {
      if (!ids.length) return;
      await this.repo.update(
        { id: In(ids) },
        {
          status: HCL_INTAKE_STATUS.PROCESSED,
          endorsementId,
          processedAt: new Date(),
        },
      );
      this.logStep("markProcessed", { message: "Completed", ids, endorsementId });
    } catch (err) {
      this.logAndRethrow("markProcessed", { ids, endorsementId }, err);
    }
  }

  async markFailed(ids: number[], failureReason: string): Promise<void> {
    this.logStep("markFailed", { message: "Starting", ids });
    try {
      if (!ids.length) return;
      await this.repo.update(
        { id: In(ids) },
        {
          status: HCL_INTAKE_STATUS.FAILED,
          failureReason,
          processedAt: new Date(),
        },
      );
      this.logStep("markFailed", { message: "Completed", ids });
    } catch (err) {
      this.logAndRethrow("markFailed", { ids }, err);
    }
  }

  async findPendingReconciliation(): Promise<HclEmployeeIntake[]> {
    this.logStep("findPendingReconciliation", { message: "Starting" });
    try {
      const records = await this.repo
        .createQueryBuilder("intake")
        .where("intake.status = :status", { status: HCL_INTAKE_STATUS.PROCESSING })
        .andWhere("intake.document_processing_file_id IS NOT NULL")
        .getMany();
      this.logStep("findPendingReconciliation", { message: "Completed", returned: records.length });
      return records;
    } catch (err) {
      this.logAndRethrow("findPendingReconciliation", {}, err);
    }
  }

  // One row per inbound HTTP call — see hcl-api-request-log.entity.ts for
  // why this is separate from the per-employee hcl_employee_intake rows.
  // Deliberately NOT wrapped in logAndRethrow's rethrow-on-failure pattern —
  // the caller (HclIntegrationService.processEnrollData) treats this purely
  // as a best-effort audit write and must never let a logging failure
  // affect the actual response already computed for HCL.
  async logApiRequest(record: HclApiRequestLogInput): Promise<void> {
    this.logStep("logApiRequest", { message: "Starting", endpoint: record.endpoint });
    try {
      const entity = this.dataSource.getRepository(HclApiRequestLog).create(record);
      const saved = await this.dataSource.getRepository(HclApiRequestLog).save(entity);
      this.logStep("logApiRequest", { message: "Completed", endpoint: record.endpoint, logId: saved.id });
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "HclIntegrationRepository",
          method: "logApiRequest",
          payload: { endpoint: record.endpoint },
          messageData: err instanceof Error ? { message: err.message, stack: err.stack } : err,
        }),
      });
    }
  }
}
