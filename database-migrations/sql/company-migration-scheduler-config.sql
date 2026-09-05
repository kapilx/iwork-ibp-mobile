-- Makes the company migration cron DB-driven (enable/disable + expression editable from admin UI),
-- matching the convention in generic-tpa-sync-scheduler-config.sql /
-- policy-migration-scheduler-config.sql.
-- Default: 02:00 UTC daily, BEFORE POLICY_MIGRATION_DAILY (02:30 UTC).
-- Company migration must run first: the policy migration's missed-company
-- phase resolves company_id by looking up company.mig_ref_no, which is
-- only populated once a company has gone through this job. Handler lives
-- in scheduler-service (CompanyMigrationScheduler), which POSTs to
-- org-service's existing POST /company/migrate-companies endpoint — no
-- business logic here, just the schedule. See
-- apps/services/scheduler-service/src/app/scheduler/company-migration.scheduler.ts.
-- Note: application_scheduler_configuration has no unique constraint on scheduler_key, so using WHERE NOT EXISTS guard.

INSERT INTO application_scheduler_configuration
  (scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
SELECT * FROM (VALUES
  ('COMPANY_MIGRATION_DAILY', 'Company Migration (Daily)', '0 2 * * *', true, true, 'idle', 'Calls org-service POST /company/migrate-companies once daily: reads the source views directly from the client database (company/contact/company_address/contact_address), migrates records in batches, and uploads raw/error/success CSVs to S3.', 0)
) AS v(scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
WHERE NOT EXISTS (
  SELECT 1 FROM application_scheduler_configuration asc2 WHERE asc2.scheduler_key = v.scheduler_key
);
