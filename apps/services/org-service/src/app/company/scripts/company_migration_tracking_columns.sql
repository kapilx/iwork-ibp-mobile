-- =============================================================================
-- company_migration_tracking_columns.sql
--
-- Adds migration-tracking columns to `company`, mirroring the equivalent
-- columns already on `policy` (mig_ref_no, updated_via_sql_lid,
-- updated_via_sql_at) and extending the same pattern with a "created via
-- SQL" pair for company's create-only migration flow:
--
--   mig_ref_no           VARCHAR(255) — persists the source view's `unique_id`
--                                     for this company (previously nothing
--                                     on `company`/`contact` retained this,
--                                     which is why cross-run duplicate
--                                     detection wasn't possible for company
--                                     migration). Matches policy.mig_ref_no's
--                                     type exactly (character varying(255)).
--   created_via_sql_lid  INTEGER    — lookup_data id, TOGGLE_TYPE (Yes/No):
--                                     9401 = TOGGLE_TYPE_YES, 9402 =
--                                     TOGGLE_TYPE_NO. DEFAULTs to 9402 (No)
--                                     so a company created through the
--                                     normal application flow (which knows
--                                     nothing about this column) is
--                                     correctly "No" rather than NULL.
--                                     CompanyService.migrateCompanies()
--                                     explicitly overrides this to 9401 on
--                                     every row it creates.
--   created_via_sql_at   TIMESTAMPTZ — when the migration created the row
--                                     (NULL for app-created companies).
--   updated_via_sql_lid  INTEGER    — same TOGGLE_TYPE lookup, for a future
--                                     update-company flow (mirrors
--                                     policy.updated_via_sql_lid). Also
--                                     DEFAULTs to 9402 (No) for the same
--                                     reason — an application-driven update
--                                     didn't happen "via SQL".
--   updated_via_sql_at   TIMESTAMPTZ — when such an update last happened.
--
-- Run once by hand (psql -f, or any DB client) against the org-service DB.
-- Idempotent: safe to re-run (including on a database where this script
-- already ran once without the DEFAULT, or with mig_ref_no as TEXT — the
-- ALTER COLUMN statements below apply regardless of whether the column
-- already existed).
-- =============================================================================

BEGIN;

ALTER TABLE company ADD COLUMN IF NOT EXISTS mig_ref_no VARCHAR(255);
ALTER TABLE company ADD COLUMN IF NOT EXISTS created_via_sql_lid INTEGER;
ALTER TABLE company ADD COLUMN IF NOT EXISTS created_via_sql_at TIMESTAMPTZ;
ALTER TABLE company ADD COLUMN IF NOT EXISTS updated_via_sql_lid INTEGER;
ALTER TABLE company ADD COLUMN IF NOT EXISTS updated_via_sql_at TIMESTAMPTZ;

-- Covers the case where this script already ran once with mig_ref_no as TEXT.
ALTER TABLE company ALTER COLUMN mig_ref_no TYPE VARCHAR(255);

ALTER TABLE company ALTER COLUMN created_via_sql_lid SET DEFAULT 9402;
ALTER TABLE company ALTER COLUMN updated_via_sql_lid SET DEFAULT 9402;

CREATE INDEX IF NOT EXISTS idx_company_mig_ref_no ON company (mig_ref_no);

COMMIT;

-- Manual verification after running:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company'
  AND column_name IN ('mig_ref_no', 'created_via_sql_lid', 'created_via_sql_at', 'updated_via_sql_lid', 'updated_via_sql_at');
