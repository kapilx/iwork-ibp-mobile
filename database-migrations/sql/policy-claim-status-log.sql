-- policy_claim_status_log
-- Tracks every status transition on a claim.
-- policy_claim.claim_status = latest state (single source of truth)
-- policy_claim_settlement    = financial settlement records (unchanged)
-- this table              = full state history (one row per state change)

CREATE TABLE IF NOT EXISTS policy_claim_status_log (
    id                  SERIAL PRIMARY KEY,
    claim_id            INT NOT NULL REFERENCES policy_claim(id) ON DELETE CASCADE,
    previous_status     VARCHAR(50),
    new_status          VARCHAR(50) NOT NULL,
    settlement_amount   NUMERIC(15, 2),         -- populated only when new_status = settled
    settlement_date     DATE,                   -- populated only when new_status = settled
    source              VARCHAR(20) NOT NULL DEFAULT 'MANUAL',  -- UPLOAD | TPA_SYNC | MANUAL
    source_ref_id       INT,                    -- file_upload_id (UPLOAD) or sync_job_id (TPA_SYNC)
    changed_by          INT NOT NULL DEFAULT 0,
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcsl_claim_id      ON policy_claim_status_log(claim_id);
CREATE INDEX IF NOT EXISTS idx_pcsl_new_status    ON policy_claim_status_log(new_status);
CREATE INDEX IF NOT EXISTS idx_pcsl_changed_at    ON policy_claim_status_log(changed_at);

COMMENT ON TABLE  policy_claim_status_log                   IS 'Full audit trail of claim status transitions';
COMMENT ON COLUMN policy_claim_status_log.source            IS 'UPLOAD=file upload, TPA_SYNC=generic scheduler, MANUAL=admin action';
COMMENT ON COLUMN policy_claim_status_log.source_ref_id     IS 'ID of the file_upload or sync_job that triggered this change';
COMMENT ON COLUMN policy_claim_status_log.settlement_amount IS 'Populated only when new_status indicates settlement';
