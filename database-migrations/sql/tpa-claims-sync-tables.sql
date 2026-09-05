-- ============================================================
-- TPA Claims Sync Pipeline Tables
-- Purpose: Job queue + raw response store for the 3-step pipeline:
--   Producer (nightly) → Worker (TPA API call + raw store) → Parser (raw → DB)
--
-- Tables:
--   1. claim_sync_job          — one row per policy per TPA sync run
--   2. raw_tpa_claim_response  — raw JSON from TPA, held until Parser processes it
-- ============================================================

-- ── 1. claim_sync_job ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.claim_sync_job (
  id                SERIAL PRIMARY KEY,
  policy_id         INT          NOT NULL,
  -- FK to policy — intentionally soft (not REFERENCES) so orphan jobs don't block deletes
  policy_number     VARCHAR(100) NOT NULL,
  tpa_id            INT,
  -- FK to tpa — soft ref so TPA master changes don't cascade-delete history
  priority          VARCHAR(10)  NOT NULL DEFAULT 'NORMAL'
                      CHECK (priority IN ('HIGH', 'NORMAL')),
  status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  retry_count       INT          NOT NULL DEFAULT 0,
  policy_start_date DATE,
  policy_end_date   DATE,
  dynamic_params    JSONB,
  -- TPA-specific extras beyond standard policy fields (e.g. groupCode for Paramount)
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  error_message     TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Worker picks PENDING jobs ordered by priority + age; partial index keeps it fast
CREATE INDEX IF NOT EXISTS idx_claim_sync_job_pending
  ON public.claim_sync_job (priority, created_at)
  WHERE status = 'PENDING';

-- Crash-recovery query: find PROCESSING jobs older than threshold
CREATE INDEX IF NOT EXISTS idx_claim_sync_job_processing_started
  ON public.claim_sync_job (started_at)
  WHERE status = 'PROCESSING';

-- Parser / IBP lookup by policy
CREATE INDEX IF NOT EXISTS idx_claim_sync_job_policy_status
  ON public.claim_sync_job (policy_number, status);

COMMENT ON TABLE public.claim_sync_job IS
  'Job queue for TPA claims sync. Producer creates PENDING rows nightly. '
  'Worker picks them (pessimistic lock), calls TPA, stores raw response, marks COMPLETED/FAILED. '
  'Parser reads raw_tpa_claim_response and writes into policy_claim + policy_claim_settlement.';

-- ── 2. raw_tpa_claim_response ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.raw_tpa_claim_response (
  id                SERIAL PRIMARY KEY,
  job_id            INT          NOT NULL REFERENCES public.claim_sync_job(id) ON DELETE CASCADE,
  policy_number     VARCHAR(100) NOT NULL,
  tpa_id            INT,
  response_payload  JSONB        NOT NULL,
  -- Full claims array from TPA. Parser reads this to upsert into policy_claim.
  processing_status VARCHAR(20)  NOT NULL DEFAULT 'RECEIVED'
                      CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'FAILED')),
  error_message     TEXT,
  received_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Parser picks RECEIVED rows; partial index keeps scan tight
CREATE INDEX IF NOT EXISTS idx_raw_tpa_claim_response_received
  ON public.raw_tpa_claim_response (received_at)
  WHERE processing_status = 'RECEIVED';

-- Cleanup cron: deletes PROCESSED rows older than retention window
CREATE INDEX IF NOT EXISTS idx_raw_tpa_claim_response_processed_age
  ON public.raw_tpa_claim_response (created_at)
  WHERE processing_status = 'PROCESSED';

-- IBP / admin lookup by policy
CREATE INDEX IF NOT EXISTS idx_raw_tpa_claim_response_policy
  ON public.raw_tpa_claim_response (policy_number);

COMMENT ON TABLE public.raw_tpa_claim_response IS
  'Stores raw TPA API claim responses before parsing. '
  'Worker inserts RECEIVED rows. Parser updates to PROCESSED/FAILED. '
  'Cleanup cron deletes PROCESSED rows after 7-day retention window.';

-- ── Rollback (run manually if needed) ────────────────────────
-- DROP TABLE IF EXISTS public.raw_tpa_claim_response;
-- DROP TABLE IF EXISTS public.claim_sync_job;
