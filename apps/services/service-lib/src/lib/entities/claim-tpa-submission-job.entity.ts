import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// Durable queue for claim → TPA delivery. Fixes a real reliability gap:
// CompanyEmployeeService.intimateClaim()/submitClaim() used to call the TPA
// (via document-service's /external-app-sso/magic-url proxy) SYNCHRONOUSLY,
// BEFORE writing anything to our own DB — so a TPA-side failure (timeout,
// TPA outage, a claim raised on the policy's last valid day hitting some
// TPA-side edge case) meant the claim was never stored anywhere at all, even
// though the employee — OUR user, not TPA's — successfully submitted it
// through our application. The employee had no record, no claim number,
// nothing to retry from.
//
// New flow: PolicyClaim is now saved FIRST and unconditionally (see
// CompanyEmployeeService.intimateClaim/submitClaim), and one row here is
// created alongside it, snapshotting the FULL payload needed to actually
// call the TPA later — so delivery to the TPA is fully decoupled from
// whether that call succeeds on the first try. ClaimTpaSubmissionScheduler
// (scheduler-service) polls PENDING rows and calls back into ibp-service's
// internal endpoint to attempt delivery, retrying a bounded number of times
// before leaving a row FAILED for manual follow-up ("fix with the TPA
// later") rather than retrying forever.
export const CLAIM_TPA_JOB_TYPE = {
  INTIMATION: "INTIMATION",
  SUBMIT_CLAIM: "SUBMIT_CLAIM",
} as const;
export type ClaimTpaJobType =
  (typeof CLAIM_TPA_JOB_TYPE)[keyof typeof CLAIM_TPA_JOB_TYPE];

export const CLAIM_TPA_JOB_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  // Terminal — attempts exhausted. Deliberately NOT auto-retried further;
  // per explicit product decision, a claim stuck here needs a human to "fix
  // it with the TPA later," not an endless retry loop.
  FAILED: "FAILED",
} as const;
export type ClaimTpaJobStatus =
  (typeof CLAIM_TPA_JOB_STATUS)[keyof typeof CLAIM_TPA_JOB_STATUS];

@Entity({ name: "claim_tpa_submission_job" })
@Index(["status"])
@Index(["policyClaimId"])
export class ClaimTpaSubmissionJob {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "policy_claim_id", type: "int" })
  policyClaimId!: number;

  // INTIMATION = the initial callGenericExternalApp/callIsbsBrokerClaim
  // delivery that used to happen inline in intimateClaim(); SUBMIT_CLAIM =
  // the MULTI-flow "submit bills/documents" delivery that used to happen
  // inline in submitClaim().
  @Column({ name: "job_type", type: "varchar", length: 20 })
  jobType!: ClaimTpaJobType;

  @Column({
    name: "status",
    type: "varchar",
    length: 20,
    default: CLAIM_TPA_JOB_STATUS.PENDING,
  })
  status!: ClaimTpaJobStatus;

  @Column({ name: "attempt_count", type: "int", default: 0 })
  attemptCount!: number;

  // 3, matching this codebase's existing retry convention for TPA calls
  // (DEFAULT_RETRY_COUNT in generic-tpa-sync.scheduler.ts) rather than
  // inventing a new number.
  @Column({ name: "max_attempts", type: "int", default: 3 })
  maxAttempts!: number;

  // OUR OWN payload — the raw incoming request DTO exactly as the employee
  // submitted it (IntimateClaimDto for INTIMATION jobs, SubmitClaimDto for
  // SUBMIT_CLAIM), before any TPA-specific transformation. Kept separate
  // from requestPayload below so a support/debugging investigation can see
  // both "what the user actually asked for" and "what we transformed it
  // into for the TPA" side by side, without one obscuring the other.
  @Column({ name: "source_payload", type: "jsonb" })
  sourcePayload!: Record<string, unknown>;

  // The exact TPA-bound call payload — everything callGenericExternalApp/
  // callIsbsBrokerClaimApi need to replay the call later, independent of
  // whether the source policy/employee/dependent rows change in the
  // meantime: built once at intimation/submission time from the same
  // inputs the old synchronous code path used (buildGenericIntimationFields's
  // output, or buildIsbsDynamicFields's output, or submitClaim's per-
  // document/single-call fields), plus jobType-specific routing info
  // (appKey, claimFormType, legacyHandler, executionMode). Retrieved and
  // sent as-is at delivery time — the processor never rebuilds/re-derives
  // this from source data, so there's nothing left to fail or go missing
  // between intimation and eventual delivery. Does NOT include the
  // original request's Authorization header — callGenericExternalApp
  // already treats that as optional (falls back to no Authorization header
  // on the outbound call if absent) and a background job has no live user
  // session token to safely reuse or persist.
  @Column({ name: "request_payload", type: "jsonb" })
  requestPayload!: Record<string, unknown>;

  // The EXACT, fully-resolved request document-service actually sent (or
  // attempted to send) to the TPA — method/url/headers/body, TPA static
  // secrets (e.g. ISBS's brokerAPIKey/brokerUsername/brokerPassword)
  // included as-is. Captured from document-service's response/error body on
  // every attempt (see ExternalAppController's debugCapture and
  // CompanyEmployeeService.callGenericExternalApp/callIsbsBrokerClaimApi),
  // regardless of whether the attempt succeeded or failed, so a failed
  // delivery can be diagnosed or manually retried by copy-pasting this
  // straight into Postman/curl against the TPA — no need to reconstruct it
  // from requestPayload + the admin-configured template/field-mapping
  // pipeline. Deliberately includes secrets (unlike this codebase's usual
  // "never log resolved payload values" convention) — accepted trade-off so
  // the stored JSON is actually usable standalone; this table carries the
  // same trust level as other tables already holding plaintext TPA
  // credentials (e.g. mstr_ext_application_ref.basic_auth_password).
  @Column({ name: "resolved_tpa_request", type: "jsonb", nullable: true })
  resolvedTpaRequest?: Record<string, unknown> | null;

  @Column({ name: "last_error", type: "text", nullable: true })
  lastError?: string | null;

  @Column({ name: "last_attempted_at", type: "timestamptz", nullable: true })
  lastAttemptedAt?: Date | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt?: Date | null;

  @Column({ name: "created_by", type: "int", default: 0 })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  updatedBy!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
