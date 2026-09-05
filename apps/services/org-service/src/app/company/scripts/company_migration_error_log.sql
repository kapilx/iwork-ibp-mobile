-- =============================================================================
-- company_migration_error_log.sql
--
-- Permanent, queryable table of per-group/per-column validation failures from
-- company migration runs (see CompanyService.migrateCompanies in
-- comapny.service.ts). One row per (unique_id group, failed column) — a
-- single group can appear multiple times if it fails multiple checks.
--
-- No resolved/reported bookkeeping (same simplification as
-- policy_migration_error_log): the underlying bad data is corrected in the
-- client's own source system, not ours. Every run's failures are
-- unconditionally dumped to a CSV in S3 (migrate_company_error_log/) — a
-- group that's still broken next time simply shows up again.
--
-- Run once by hand (psql -f, or any DB client) against the org-service DB.
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS company_migration_error_log (
  id BIGSERIAL PRIMARY KEY,
  migration_run_id TEXT NOT NULL,
  batch_number INT NOT NULL,
  unique_id TEXT,               -- the source join key correlating this group's rows across the 4 sheets
  sheet_name TEXT NOT NULL,     -- 'company' | 'contact' | 'company_address' | 'contact_address' | 'correlation'
  column_name TEXT,
  bad_value TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_migration_error_log_run ON company_migration_error_log (migration_run_id);
CREATE INDEX IF NOT EXISTS idx_company_migration_error_log_unique_id ON company_migration_error_log (unique_id);

COMMIT;

-- Manual verification after running:
SELECT count(*) FROM company_migration_error_log;
