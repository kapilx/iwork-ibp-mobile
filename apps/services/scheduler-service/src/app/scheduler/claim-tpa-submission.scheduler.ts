import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DataSource, LessThan, Repository } from "typeorm";
import axios from "axios";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { ENV, IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";
import {
  ClaimTpaSubmissionJob,
  CLAIM_TPA_JOB_STATUS,
} from "../../../../service-lib/src/lib/entities/claim-tpa-submission-job.entity";

// Picks up PENDING claim_tpa_submission_job rows — created by
// CompanyEmployeeService.intimateClaim() in ibp-service, once claim
// persistence there was decoupled from TPA delivery — and asks ibp-service
// to actually attempt delivery. Fixes a real reliability gap: intimateClaim
// used to call the TPA BEFORE saving anything to our own DB, so a TPA-side
// failure (timeout, outage, a claim raised on the policy's last valid day
// hitting a TPA edge case) meant the employee's claim — submitted through
// OUR application, not the TPA's — was never stored anywhere at all. See
// apps/services/service-lib/src/lib/entities/claim-tpa-submission-job.entity.ts
// for the full design.
//
// ibp-service owns all the actual TPA-calling logic
// (callGenericExternalApp/callIsbsBrokerClaimApi/etc. in
// CompanyEmployeeService) — this scheduler only handles timing/polling and
// delegates the real work back to ibp-service via a plain internal HTTP
// call, matching this codebase's existing convention (schedulers here
// either call back into the owning service, or — like
// GenericTpaSyncScheduler — call document-service directly; neither
// duplicates the target service's business logic locally).
@Injectable()
export class ClaimTpaSubmissionScheduler {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly ibpServiceUrl: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.SCHEDULER_SERVICE);
    this.ibpServiceUrl = ENV.URL_IBP_SERVICE || "http://localhost:3025";
  }

  // Matches the polling cadence already used by this codebase's other
  // reconciliation-style pollers (EnrollmentUploadScheduler and similar).
  @Cron("*/2 * * * *")
  async processPendingClaimTpaJobs(): Promise<void> {
    if (IS_DEMO_ENVIRONMENT) return;

    try {
      const jobRepo = this.dataSource.getRepository(ClaimTpaSubmissionJob);
      await this.recoverStuckJobs(jobRepo);
      await this.resurrectFailedJobs(jobRepo);
      const pending = await jobRepo.find({
        where: { status: CLAIM_TPA_JOB_STATUS.PENDING },
        order: { createdAt: "ASC" },
        // Bounded per tick so one noisy backlog can't starve other work on
        // this same 2-minute cron slot — remaining rows just pick up on the
        // next tick.
        take: 20,
      });

      if (!pending.length) return;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ClaimTpaSubmissionScheduler",
          method: "processPendingClaimTpaJobs",
          messageData: `Found ${pending.length} pending claim TPA job(s)`,
        }),
      });

      for (const job of pending) {
        await this.processOne(job.id);
      }
    } catch (err) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimTpaSubmissionScheduler",
          method: "processPendingClaimTpaJobs",
          messageData: err instanceof Error ? { message: err.message, stack: err.stack } : err,
        }),
      });
    }
  }

  // Crash recovery — mirrors the same stuck-job pattern already established
  // by GenericTpaSyncScheduler for its own (unrelated) sync jobs. Without
  // this, a job that ibp-service marked PROCESSING and then crashed/
  // restarted before finishing (e.g. mid-delivery) would sit there forever
  // — processPendingClaimTpaJobs only ever queries status = PENDING, so a
  // stuck PROCESSING row would never be picked up again by anything.
  private async recoverStuckJobs(jobRepo: Repository<ClaimTpaSubmissionJob>): Promise<void> {
    const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes
    const stuck = await jobRepo.find({
      where: {
        status: CLAIM_TPA_JOB_STATUS.PROCESSING,
        lastAttemptedAt: LessThan(stuckThreshold),
      },
    });
    if (!stuck.length) return;

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimTpaSubmissionScheduler",
        method: "recoverStuckJobs",
        messageData: `Recovering ${stuck.length} job(s) stuck in PROCESSING`,
      }),
    });

    for (const job of stuck) {
      const exhausted = job.attemptCount >= job.maxAttempts;
      await jobRepo.update(job.id, {
        status: exhausted ? CLAIM_TPA_JOB_STATUS.FAILED : CLAIM_TPA_JOB_STATUS.PENDING,
        lastError: exhausted
          ? (job.lastError ?? "Stuck in PROCESSING — ibp-service likely crashed/restarted mid-delivery, attempts exhausted"
            )
          : "Stuck in PROCESSING — ibp-service likely crashed/restarted mid-delivery, requeued for retry",
      });
    }
  }

  // Gives a FAILED job (attempts exhausted, terminal per the entity's own
  // design — see claim-tpa-submission-job.entity.ts) one more full shot 24
  // hours after it failed, instead of requiring a human to manually requeue
  // it forever. Rationale: document-service re-fetches ALL of a TPA's static
  // config fresh from the DB on EVERY attempt — mstr_ext_application_ref
  // (credentials, URL, payload template) and tpa_payload_field_mapping are
  // never cached across attempts (confirmed: ExternalAppRepository.findByLabel
  // is a plain findOne, no caching layer) — so if an admin fixes a wrong
  // static key (a stale brokerAPIKey, a corrected hospital/TPA config row,
  // etc.) after a job failed, the NEXT attempt automatically picks up the
  // fix with zero extra work. A permanently-FAILED job would never get that
  // next attempt without this. Note: dynamic per-claim fields frozen into
  // request_payload at intimation/submission time (patientMobile,
  // hospitalCode, etc.) are NOT re-derived here — only the static TPA-side
  // config benefits from a resurrection; a genuinely wrong dynamic field
  // still needs a fresh claim, this won't fix that class of failure.
  //
  // 24h is a cooldown, not a cap — resets attemptCount to 0 (a full fresh
  // 3-attempt budget) each time, so a job that keeps genuinely failing will
  // keep resurrecting once a day indefinitely. This is a deliberate reversal
  // of this table's original "FAILED is terminal, no auto-retry" design
  // (see the entity's own header comment) per explicit product decision —
  // if a permanently-broken claim resurrecting forever every 24h ever
  // becomes noisy, consider capping total resurrection count.
  private async resurrectFailedJobs(jobRepo: Repository<ClaimTpaSubmissionJob>): Promise<void> {
    const cooldownThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    const failed = await jobRepo.find({
      where: {
        status: CLAIM_TPA_JOB_STATUS.FAILED,
        updatedAt: LessThan(cooldownThreshold),
      },
    });
    if (!failed.length) return;

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimTpaSubmissionScheduler",
        method: "resurrectFailedJobs",
        messageData: `Resurrecting ${failed.length} FAILED job(s) — 24h cooldown elapsed, giving them a fresh attempt budget in case static TPA config has since been corrected`,
      }),
    });

    for (const job of failed) {
      await jobRepo.update(job.id, {
        status: CLAIM_TPA_JOB_STATUS.PENDING,
        attemptCount: 0,
        lastError: `[Auto-resurrected after 24h cooldown] Previous failure: ${job.lastError ?? "(no error recorded)"}`,
      });
    }
  }

  private async processOne(jobId: number): Promise<void> {
    try {
      const url = `${this.ibpServiceUrl}/company-employee/internal/claim-tpa-jobs/${jobId}/process`;
      const response = await axios.post(url, {}, { timeout: 90_000 });
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ClaimTpaSubmissionScheduler",
          method: "processOne",
          payload: { jobId },
          messageData: response.data,
        }),
      });
    } catch (err) {
      // ibp-service being unreachable (not the TPA itself) — ibp-service's
      // own processClaimTpaJob never got a chance to run, so the job row is
      // still PENDING and will simply be retried on the next tick. No
      // status update needed here.
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimTpaSubmissionScheduler",
          method: "processOne",
          payload: { jobId },
          messageData: err instanceof Error ? { message: err.message, stack: err.stack } : err,
        }),
      });
    }
  }
}
