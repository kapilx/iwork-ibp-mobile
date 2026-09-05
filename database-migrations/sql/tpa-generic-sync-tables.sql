-- ============================================================
-- Generic TPA/External API Sync Pipeline Tables
-- Purpose: Reusable job queue + raw response store for ANY sync type
--   configured via mstr_ext_application_ref (flowType = SYNC).
--   Used for: Hospital sync, and all future SYNC integrations.
--
-- Pattern mirrors tpa-claims-sync-tables.sql but is scope-agnostic:
--   - sync_type controls which scheduler/parser handles the row
--   - scope_type + scope_id allow PER_POLICY / PER_TPA / GLOBAL runs
--
-- Tables:
--   1. sync_job          — job queue, one row per sync unit per run
--   2. raw_sync_response — raw JSON from external API
-- ============================================================

-- ── 1. sync_job ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sync_job (
  id             SERIAL PRIMARY KEY,
  app_ref_id     INT          NOT NULL REFERENCES public.mstr_ext_application_ref(id) ON DELETE CASCADE,
  -- Which external API config drives this job
  sync_type      VARCHAR(50)  NOT NULL,
  -- Machine key matching mstr_ext_application_ref.label or a well-known type
  -- e.g. 'HOSPITAL_NETWORK', 'CLAIMS', 'ECARD'
  scope_type     VARCHAR(20)  NOT NULL DEFAULT 'GLOBAL'
                   CHECK (scope_type IN ('PER_POLICY', 'PER_TPA', 'GLOBAL')),
  scope_id       INT,
  -- PER_POLICY → policy.id, PER_TPA → tpa.id, GLOBAL → NULL
  priority       VARCHAR(10)  NOT NULL DEFAULT 'NORMAL'
                   CHECK (priority IN ('HIGH', 'NORMAL')),
  status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  retry_count    INT          NOT NULL DEFAULT 0,
  dynamic_params JSONB,
  -- Any scope-specific params passed to the API (policy dates, group codes, etc.)
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  error_message  TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Worker picks PENDING jobs; partial index keeps scan fast
CREATE INDEX IF NOT EXISTS idx_sync_job_pending
  ON public.sync_job (sync_type, priority, created_at)
  WHERE status = 'PENDING';

-- Crash recovery: PROCESSING jobs older than threshold
CREATE INDEX IF NOT EXISTS idx_sync_job_processing_started
  ON public.sync_job (started_at)
  WHERE status = 'PROCESSING';

-- Dedup check: avoid re-queuing when a recent run exists
CREATE INDEX IF NOT EXISTS idx_sync_job_app_ref_scope
  ON public.sync_job (app_ref_id, scope_type, scope_id, status);

COMMENT ON TABLE public.sync_job IS
  'Generic job queue for any external API sync (flowType=SYNC on mstr_ext_application_ref). '
  'Producer creates PENDING rows. Worker calls TPA/API, stores raw response, marks COMPLETED/FAILED. '
  'Parser/loader reads raw_sync_response and writes into target tables per response mappings.';

-- ── 2. raw_sync_response ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.raw_sync_response (
  id                SERIAL PRIMARY KEY,
  job_id            INT          NOT NULL REFERENCES public.sync_job(id) ON DELETE CASCADE,
  app_ref_id        INT          NOT NULL REFERENCES public.mstr_ext_application_ref(id) ON DELETE CASCADE,
  sync_type         VARCHAR(50)  NOT NULL,
  scope_type        VARCHAR(20)  NOT NULL,
  scope_id          INT,
  response_payload  JSONB        NOT NULL,
  -- Full API response. Parser applies mstr_ext_app_response_mapping (DB_COLUMN rows)
  -- to write into the target table defined on mstr_ext_application_ref.sync_target_table
  processing_status VARCHAR(20)  NOT NULL DEFAULT 'RECEIVED'
                      CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'FAILED')),
  error_message     TEXT,
  received_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Parser picks RECEIVED rows ordered by age
CREATE INDEX IF NOT EXISTS idx_raw_sync_response_received
  ON public.raw_sync_response (sync_type, received_at)
  WHERE processing_status = 'RECEIVED';

-- Cleanup cron: delete PROCESSED rows past retention
CREATE INDEX IF NOT EXISTS idx_raw_sync_response_processed_age
  ON public.raw_sync_response (created_at)
  WHERE processing_status = 'PROCESSED';

-- Lookup by scope for debugging / admin
CREATE INDEX IF NOT EXISTS idx_raw_sync_response_scope
  ON public.raw_sync_response (app_ref_id, scope_type, scope_id);

COMMENT ON TABLE public.raw_sync_response IS
  'Stores raw external API responses for any SYNC type before they are parsed. '
  'Worker inserts RECEIVED. Parser applies DB_COLUMN response mappings to upsert into target table, '
  'then marks PROCESSED. Cleanup cron deletes PROCESSED rows after retention window.';

-- ── Rollback (run manually if needed) ────────────────────────
-- DROP TABLE IF EXISTS public.raw_sync_response;
-- DROP TABLE IF EXISTS public.sync_job;
