-- =============================================================================
-- policy_migration_error_log.sql
--
-- Permanent, queryable table of per-row/per-column validation failures from
-- policy migration runs (see PolicyService.migratePolicies in policy.service.ts).
-- One row per (source row, failed column) — a single source row can appear
-- multiple times if it fails multiple checks, matching the method's in-memory
-- RowError shape.
--
-- Unlike the ephemeral zz_load_policy_<run_id> / _ref staging tables (which
-- exist only for forensic inspection of one run), this table persists and
-- accumulates across every migration run, so it is NOT zz_-prefixed.
--
-- No resolved/reported bookkeeping: the underlying bad data is never
-- corrected in our own database — it's the client's job to fix it in their
-- source system. Every run's failures are unconditionally dumped to a CSV
-- in S3 (migrate_policy_error_log/) for the client to review, so a row that's
-- still broken next time simply shows up again — nothing to flag here.
--
-- Run once by hand (psql -f, or any DB client) against the policy-service DB.
-- Idempotent: safe to re-run (also drops the earlier resolved/reported
-- columns from a prior version of this script, if present).
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS policy_migration_error_log (
  id BIGSERIAL PRIMARY KEY,
  migration_run_id TEXT NOT NULL,      -- ties back to zz_load_policy_<run_id> / _ref
  batch_number INT NOT NULL,
  row_seq BIGINT,                      -- source view's pagination key for this row (nullable: source may lack it)
  mig_ref_no TEXT,                     -- source row identifier (nullable: row may be missing even this)
  column_name TEXT NOT NULL,
  bad_value TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop bookkeeping columns from an earlier version of this script — no
-- longer needed now that errors are always exported in full, every run.
ALTER TABLE policy_migration_error_log DROP COLUMN IF EXISTS resolved;
ALTER TABLE policy_migration_error_log DROP COLUMN IF EXISTS resolved_at;
ALTER TABLE policy_migration_error_log DROP COLUMN IF EXISTS resolved_by;
ALTER TABLE policy_migration_error_log DROP COLUMN IF EXISTS resolution_notes;
ALTER TABLE policy_migration_error_log DROP COLUMN IF EXISTS reported;
ALTER TABLE policy_migration_error_log DROP COLUMN IF EXISTS reported_at;
ALTER TABLE policy_migration_error_log DROP COLUMN IF EXISTS report_file_key;

DROP INDEX IF EXISTS idx_policy_migration_error_log_unresolved;
DROP INDEX IF EXISTS idx_policy_migration_error_log_unreported;
DROP INDEX IF EXISTS idx_policy_migration_error_log_reported_mig_ref_no;

-- 'create' = migratePolicies' create-policy phase (default, for backward
-- compatibility with rows logged before this column existed).
-- 'update' = the update-policy phase (existing policies whose fields
-- changed at the source — see script-policy-update-pl-20260804-1845.sql).
ALTER TABLE policy_migration_error_log ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'create';

CREATE INDEX IF NOT EXISTS idx_policy_migration_error_log_run ON policy_migration_error_log (migration_run_id);
CREATE INDEX IF NOT EXISTS idx_policy_migration_error_log_mig_ref_no ON policy_migration_error_log (mig_ref_no);
CREATE INDEX IF NOT EXISTS idx_policy_migration_error_log_phase ON policy_migration_error_log (phase);

COMMIT;

-- Manual verification after running:
SELECT count(*) FROM policy_migration_error_log;
