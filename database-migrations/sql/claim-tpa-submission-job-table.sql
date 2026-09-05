-- Claim → TPA delivery queue (fixes: claim intimation/submission used to
-- call the TPA synchronously BEFORE saving anything to our own DB, so a
-- TPA-side failure meant the employee's claim was never stored anywhere at
-- all, even though they successfully submitted it through our application).
--
-- New flow: policy_claim is now saved first and unconditionally; this table
-- queues the actual TPA delivery, decoupled from that save. See
-- apps/services/service-lib/src/lib/entities/claim-tpa-submission-job.entity.ts
-- and ClaimTpaSubmissionScheduler (scheduler-service).

CREATE TABLE IF NOT EXISTS claim_tpa_submission_job (
    id                 SERIAL PRIMARY KEY,
    policy_claim_id    INT NOT NULL REFERENCES policy_claim(id),
    job_type           VARCHAR(20) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempt_count      INT NOT NULL DEFAULT 0,
    max_attempts       INT NOT NULL DEFAULT 3,
    -- Raw incoming request DTO, exactly as the employee submitted it —
    -- kept separate from request_payload (the TPA-bound call) so a support
    -- investigation can see both side by side.
    source_payload     JSONB NOT NULL,
    -- The exact TPA-bound call payload, retrieved and sent as-is at
    -- delivery time — never rebuilt from source data.
    request_payload    JSONB NOT NULL,
    -- The EXACT, fully-resolved request document-service actually sent (or
    -- attempted to send) to the TPA — method/url/headers/body, TPA static
    -- secrets included as-is — captured on every attempt, success or
    -- failure, so a failed delivery can be diagnosed/retried by copy-pasting
    -- this straight at the TPA. Nullable: only populated once at least one
    -- delivery attempt has actually reached document-service.
    resolved_tpa_request JSONB,
    last_error         TEXT,
    last_attempted_at  TIMESTAMPTZ,
    completed_at       TIMESTAMPTZ,
    created_by         INT NOT NULL DEFAULT 0,
    updated_by         INT NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_claim_tpa_submission_job_type
        CHECK (job_type IN ('INTIMATION', 'SUBMIT_CLAIM')),
    CONSTRAINT chk_claim_tpa_submission_job_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_claim_tpa_submission_job_status ON claim_tpa_submission_job (status);
CREATE INDEX IF NOT EXISTS idx_claim_tpa_submission_job_policy_claim_id ON claim_tpa_submission_job (policy_claim_id);

-- Idempotent guard for environments where an earlier version of this script
-- (without source_payload) already created the table — confirmed via a
-- live read-only check that this table doesn't exist anywhere yet, so this
-- is a no-op today, but kept so this script is safe to re-run regardless.
ALTER TABLE claim_tpa_submission_job
    ADD COLUMN IF NOT EXISTS source_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE claim_tpa_submission_job
    ALTER COLUMN source_payload DROP DEFAULT;

-- Live check confirmed this table ALREADY EXISTS (created by an earlier run
-- of this script) without resolved_tpa_request — this ALTER is the one that
-- actually needs to run against that environment. Nullable, no backfill
-- needed (only relevant going forward, from the next delivery attempt).
ALTER TABLE claim_tpa_submission_job
    ADD COLUMN IF NOT EXISTS resolved_tpa_request JSONB;
