-- =============================================================================
-- migration_log.sql
--
-- Generic audit table for ANY system's migration runs — not specific to
-- policy/company. One row per event type per migration run — NOT one row
-- per source record. Gives a single place to see, for any migration_run_id,
-- which phases ran, from which system, how many records succeeded/failed,
-- and where to find the corresponding CSVs in S3.
--
-- `system` identifies the SOURCE system this migrated data came from — NOT
-- our own service name. Any future integration logging here just picks its
-- own `system` value; no schema change needed.
--
-- event_type values in use today (all system = 'finops', since both policy
-- and company migration data originate from the client's finops system):
--   policy_create   - PolicyService.migratePolicies() create phase
--   policy_update   - PolicyService.migratePolicies() update phase
--   policy_missed   - PolicyService.migratePolicies() missed-company phase
--   company_create  - CompanyService.migrateCompanies()
--
-- success_log / error_log store the S3 *key* (not a full URL) of that
-- specific event type's own success/error CSV for that run — e.g.
-- "migrate_policy_success_log/migrate_policy_success_log_create_<runId>.csv".
-- Each event type gets its own pair of files, never shared across phases.
--
-- Run once by hand (psql -f, or any DB client) against the shared database.
-- Idempotent: safe to re-run. If you already have the old
-- `company_policy_migration_log` table from before this table was made
-- generic, run migration-log-generic-rename.sql instead — it renames the
-- existing table and backfills `system` rather than creating a new empty one.
-- =============================================================================

CREATE TABLE IF NOT EXISTS migration_log (
  id BIGSERIAL PRIMARY KEY,
  system TEXT NOT NULL,
  migration_run_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  success_log TEXT,
  error_log TEXT
);

CREATE INDEX IF NOT EXISTS idx_migration_log_run_id ON migration_log (migration_run_id);
CREATE INDEX IF NOT EXISTS idx_migration_log_event_type ON migration_log (event_type);
CREATE INDEX IF NOT EXISTS idx_migration_log_executed_at ON migration_log (executed_at);
CREATE INDEX IF NOT EXISTS idx_migration_log_system ON migration_log (system);
