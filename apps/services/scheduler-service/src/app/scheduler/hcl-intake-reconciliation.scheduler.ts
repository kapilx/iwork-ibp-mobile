import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DataSource, In } from "typeorm";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";
import {
  HCL_INTAKE_STATUS,
  HclEmployeeIntake,
} from "../../../../service-lib/src/lib/entities/hcl-employee-intake.entity";
import { DocumentProcessingFile } from "../../../../service-lib/src/lib/entities/document-processing-file.entity";
import { PolicyEnrollmentUploadSummary } from "../../../../service-lib/src/lib/entities/policy-enrollment-upload-summary.entity";
import { PolicyEnrollmentEmployee } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity";
import { PolicyEnrollmentEmployeePolicyMap } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity";

// Operation types where "does this EIN now exist as a mapped employee on
// this policy" is a meaningful proxy for "did this specific row succeed" —
// they all add/upsert an employee. DD/ED/ES mean deactivation/removal, where
// the employee row still existing proves nothing about whether that
// specific instruction succeeded, so those stay on batch-level reporting.
const ADDITION_STYLE_OPERATIONS = new Set(["AD", "BI", "ET", "NA"]);

// Bridges the existing enrollment-upload pipeline's own status
// (document_processing_file.process_status: CREATED/PROCESSING/COMPLETED/
// FAILED — set by EnrollmentUploadScheduler, unmodified by this feature)
// back onto hcl_employee_intake rows, which have no way to observe that
// pipeline's outcome on their own — nothing in that pipeline notifies an
// external caller when a document_processing_file finishes; it only updates
// its own row. See:
// docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md §10.
//
// Batch-level granularity only (TRD §11): a document_processing_file's
// process_status reflects the whole submitted file, not individual
// employees within it — every hcl_employee_intake row linked to the same
// document_processing_file_id transitions together.
@Injectable()
export class HclIntakeReconciliationScheduler {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.SCHEDULER_SERVICE);
  }

  // Runs every 2 minutes — matches the polling cadence already used by
  // EnrollmentUploadScheduler's own document_processing_file consumption.
  @Cron("*/2 * * * *")
  async reconcile(): Promise<void> {
    if (IS_DEMO_ENVIRONMENT) return;

    const intakeRepo = this.dataSource.getRepository(HclEmployeeIntake);
    const docRepo = this.dataSource.getRepository(DocumentProcessingFile);
    const summaryRepo = this.dataSource.getRepository(PolicyEnrollmentUploadSummary);
    const employeeRepo = this.dataSource.getRepository(PolicyEnrollmentEmployee);
    const employeePolicyMapRepo = this.dataSource.getRepository(PolicyEnrollmentEmployeePolicyMap);

    const pending = await intakeRepo
      .createQueryBuilder("intake")
      .where("intake.status = :status", { status: HCL_INTAKE_STATUS.PROCESSING })
      .andWhere("intake.document_processing_file_id IS NOT NULL")
      .getMany();

    if (!pending.length) return;

    const byDocFile = new Map<number, HclEmployeeIntake[]>();
    for (const row of pending) {
      const key = row.documentProcessingFileId as number;
      if (!byDocFile.has(key)) byDocFile.set(key, []);
      byDocFile.get(key)!.push(row);
    }

    for (const [documentProcessingFileId, rows] of byDocFile) {
      await this.reconcileBatch(
        documentProcessingFileId,
        rows,
        intakeRepo,
        docRepo,
        summaryRepo,
        employeeRepo,
        employeePolicyMapRepo,
      );
    }
  }

  // No per-row failure detail exists anywhere we can surface to an HR admin
  // (TRD §11 — batch-level granularity only; a hard crash has no persisted
  // reason at all — see the FAILED branch below). The actionable next step
  // is always the same: escalate to the CRM/insurer-ops team with the two
  // identifiers they need to look the batch up on the Endorsement page
  // themselves (entityId on document_processing_file is the policy id —
  // entityType is always "policy" for this document_type).
  // `doc` typed loosely (matches docRepo/summaryRepo's own untyped
  // ReturnType<DataSource["getRepository"]> declarations in this file) —
  // only endorsementId/entityId are actually read here.
  private buildCrmEscalationNote(doc: any): string {
    return (
      `Please share Endorsement ID ${doc.endorsementId ?? "N/A"} and Policy ID ${doc.entityId} ` +
      `with your CRM — they can check the failure details on the Endorsement page.`
    );
  }

  // Checks whether this specific row's EIN actually landed in
  // policy_enrollment_employee, mapped to this row's policy — real,
  // evidence-based per-row verification instead of trusting the pipeline's
  // batch-only success/error counts. Confirmed necessary against real data:
  // an employee (EIN 90089) was genuinely created by the pipeline, yet its
  // intake row was marked FAILED under the old blanket "any error in this
  // batch fails everything" logic, because a different row in the same
  // batch failed. Only meaningful for addition-style operations (see
  // ADDITION_STYLE_OPERATIONS) — for DD/ED/ES, "the employee still exists"
  // says nothing about whether that specific deactivation/removal succeeded.
  private async didRowSucceed(
    row: HclEmployeeIntake,
    employeeRepo: ReturnType<DataSource["getRepository"]>,
    employeePolicyMapRepo: ReturnType<DataSource["getRepository"]>,
  ): Promise<boolean> {
    if (!row.companyId || !row.policyId) return false;
    const employee = await employeeRepo.findOne({
      where: { companyEmployeeId: row.ein, companyId: row.companyId },
    });
    if (!employee) return false;
    const mapping = await employeePolicyMapRepo.findOne({
      where: { employeeId: employee.id, policyId: row.policyId },
    });
    return Boolean(mapping);
  }

  private async reconcileBatch(
    documentProcessingFileId: number,
    rows: HclEmployeeIntake[],
    intakeRepo: ReturnType<DataSource["getRepository"]>,
    docRepo: ReturnType<DataSource["getRepository"]>,
    summaryRepo: ReturnType<DataSource["getRepository"]>,
    employeeRepo: ReturnType<DataSource["getRepository"]>,
    employeePolicyMapRepo: ReturnType<DataSource["getRepository"]>,
  ): Promise<void> {
    try {
      const doc = await docRepo.findOne({ where: { id: documentProcessingFileId } });
      if (!doc) return; // shouldn't happen; leave PROCESSING for the next tick

      const ids = In(rows.map((r) => r.id));

      if (doc.processStatus === "COMPLETED") {
        // process_status = COMPLETED only means "the job ran to completion
        // without throwing" — it does NOT mean any employee was actually
        // added. processEmployeeUpload/processEmployeeUploadWithRedis marks
        // the job COMPLETED even when every single row failed row-level
        // validation (e.g. "no valid records; marked as COMPLETED"),
        // recording the real per-batch outcome separately on
        // policy_enrollment_upload_summary (success_count/error_count).
        // Confirmed against real data: a batch with success_count=0,
        // error_count=3 still reported process_status=COMPLETED. Trusting
        // process_status alone would have marked genuinely-failed HCL
        // records PROCESSED.
        const summary = await summaryRepo.findOne({
          where: { documentProcessingFileId },
          order: { id: "DESC" },
        });

        if (summary && summary.errorCount > 0) {
          // Don't blanket-fail the whole batch — verify each row that CAN
          // be verified (addition-style operations) against the real
          // resulting employee table, and only fall back to "can't tell,
          // assume failed" for rows where that check isn't meaningful.
          const verifiable = rows.filter((r) => ADDITION_STYLE_OPERATIONS.has(r.flagOperationType));
          const unverifiable = rows.filter((r) => !ADDITION_STYLE_OPERATIONS.has(r.flagOperationType));

          const succeededIds: number[] = [];
          const failedNotFoundIds: number[] = [];
          for (const row of verifiable) {
            const ok = await this.didRowSucceed(row, employeeRepo, employeePolicyMapRepo);
            (ok ? succeededIds : failedNotFoundIds).push(row.id);
          }

          const batchContext =
            `document_processing_file #${documentProcessingFileId}, ` +
            `error_file_upload_id=${summary.errorFileUploadId ?? "n/a"} ` +
            `(${summary.successCount} succeeded, ${summary.errorCount} rejected overall in this batch).`;

          if (succeededIds.length) {
            await intakeRepo.update(
              { id: In(succeededIds) },
              {
                status: HCL_INTAKE_STATUS.PROCESSED,
                endorsementId: doc.endorsementId ?? null,
                failureReason: null,
                processedAt: new Date(),
              },
            );
          }
          if (failedNotFoundIds.length) {
            await intakeRepo.update(
              { id: In(failedNotFoundIds) },
              {
                status: HCL_INTAKE_STATUS.FAILED,
                failureReason:
                  `This record's employee was not found in the resulting enrollment data — ${batchContext} ` +
                  `${this.buildCrmEscalationNote(doc)} Retry by re-selecting this record.`,
                processedAt: new Date(),
              },
            );
          }
          if (unverifiable.length) {
            await intakeRepo.update(
              { id: In(unverifiable.map((r) => r.id)) },
              {
                status: HCL_INTAKE_STATUS.FAILED,
                failureReason:
                  `This batch had rejected rows and this record's operation type doesn't allow confirming ` +
                  `its own outcome by checking whether the employee exists (only meaningful for addition-style ` +
                  `operations) — ${batchContext} ${this.buildCrmEscalationNote(doc)} Retry by re-selecting.`,
                processedAt: new Date(),
              },
            );
          }
        } else {
          // No summary row found (unexpected) or a clean success
          // (errorCount === 0) — treat as success, matching prior behavior.
          await intakeRepo.update(
            { id: ids },
            {
              status: HCL_INTAKE_STATUS.PROCESSED,
              endorsementId: doc.endorsementId ?? null,
              failureReason: null,
              processedAt: new Date(),
            },
          );
        }
      } else if (doc.processStatus === "FAILED") {
        // process_status = FAILED means EnrollmentUploadScheduler's job
        // threw an uncaught exception (confirmed: its catch block only
        // writes processStatus, e.g. enrollment-upload.scheduler.ts:3749-
        // 3765 — the actual err.message/stack goes to this.logger.error()
        // only, never to any DB column). There is genuinely no structured
        // reason retrievable from the database for this case — unlike a
        // COMPLETED-with-rejected-rows batch, which at least has an error
        // xlsx via policy_enrollment_upload_summary. Said explicitly below
        // instead of implying more detail exists than actually does.
        await intakeRepo.update(
          { id: ids },
          {
            status: HCL_INTAKE_STATUS.FAILED,
            failureReason:
              `Enrollment upload crashed while processing (document_processing_file #${documentProcessingFileId}). ` +
              `No structured error was captured by that pipeline for this failure mode. ${this.buildCrmEscalationNote(doc)} ` +
              `Retry by re-selecting these records once the underlying issue is fixed.`,
            processedAt: new Date(),
          },
        );
      }
      // CREATED / PROCESSING: still in flight, left as-is for the next tick.
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "HclIntakeReconciliationScheduler",
          method: "reconcileBatch",
          messageData:
            err instanceof Error ? { message: err.message, stack: err.stack } : err,
        }),
      });
    }
  }
}
