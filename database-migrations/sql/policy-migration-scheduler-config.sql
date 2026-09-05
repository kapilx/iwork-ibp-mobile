-- Makes the policy migration cron DB-driven (enable/disable + expression editable from admin UI),
-- matching the convention in generic-tpa-sync-scheduler-config.sql.
-- Default: 02:30 UTC daily (offset 30 min AFTER COMPANY_MIGRATION_DAILY —
-- the policy migration's missed-company phase resolves company_id via
-- company.mig_ref_no, so the company migration must have already run and
-- populated that column for same-day-migrated companies to resolve).
-- Handler lives in scheduler-service (PolicyMigrationScheduler), which
-- POSTs to policy-service's existing POST /policy/migrate-policies
-- endpoint — no business logic here, just the schedule. See
-- apps/services/scheduler-service/src/app/scheduler/policy-migration.scheduler.ts.
-- Note: application_scheduler_configuration has no unique constraint on scheduler_key, so using WHERE NOT EXISTS guard.

INSERT INTO application_scheduler_configuration
  (scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
SELECT * FROM (VALUES
  ('POLICY_MIGRATION_DAILY', 'Policy Migration (Daily)', '30 2 * * *', true, true, 'idle', 'Calls policy-service POST /policy/migrate-policies once daily: reads the source view(s) directly from the client database, migrates policies in batches, and uploads raw/error CSVs to S3.', 0)
) AS v(scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
WHERE NOT EXISTS (
  SELECT 1 FROM application_scheduler_configuration asc2 WHERE asc2.scheduler_key = v.scheduler_key
);
