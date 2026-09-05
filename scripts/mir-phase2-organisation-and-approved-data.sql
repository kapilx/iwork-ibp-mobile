-- ─────────────────────────────────────────────────────────────────────────────
-- MIR — Monthly Information Report · Phase-2 incremental schema (IIRM-758_MIR)
--
-- Adds, on top of mir-phase1-schema.sql (already executed — do not modify):
--   1. mir_report.organisation_id          — org captured at generation time,
--      used to scope every live section query's policy_type_lid lookup to
--      active rows for that org (fixes policies leaking in across orgs /
--      inactive lookup_data rows being counted).
--   2. mir_report_section.approved_data    — frozen snapshot of a section's
--      auto-populated rows, taken at Approve time. Once a report is
--      approved/published/acknowledged, reads serve this instead of
--      recomputing live, so later policy/endorsement/claim changes can't
--      retroactively alter figures the Lead CRM already signed off on.
--
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE mir_report ADD COLUMN IF NOT EXISTS organisation_id INT;

ALTER TABLE mir_report_section ADD COLUMN IF NOT EXISTS approved_data JSONB;

COMMIT;
