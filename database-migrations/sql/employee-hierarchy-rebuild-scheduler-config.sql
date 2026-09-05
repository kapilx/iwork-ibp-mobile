-- Makes the employee_hierarchy rebuild a DB-driven daily cron (enable/disable +
-- expression editable from admin UI), matching the convention in
-- company-migration-scheduler-config.sql / policy-migration-scheduler-config.sql.
-- Default: 03:00 UTC daily -- after COMPANY_MIGRATION_DAILY (02:00) and
-- POLICY_MIGRATION_DAILY (02:30). No ordering dependency on those two; a
-- distinct slot just avoids piling extra DB load onto the same minute.
-- Handler lives in scheduler-service (EmployeeHierarchyRebuildScheduler),
-- which POSTs to org-service's existing POST /employee/rebuild-hierarchy
-- endpoint -- no business logic here, just the schedule. See
-- apps/services/scheduler-service/src/app/scheduler/employee-hierarchy-rebuild.scheduler.ts.
-- Note: application_scheduler_configuration has no unique constraint on scheduler_key, so using WHERE NOT EXISTS guard.

INSERT INTO application_scheduler_configuration
  (scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
SELECT * FROM (VALUES
  ('EMPLOYEE_HIERARCHY_REBUILD_DAILY', 'Employee Hierarchy Rebuild (Daily)', '0 3 * * *', true, true, 'idle', 'Calls org-service POST /employee/rebuild-hierarchy once daily to fully rebuild the employee_hierarchy flat closure table from the live users table, self-healing any drift left by incremental updates.', 0)
) AS v(scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
WHERE NOT EXISTS (
  SELECT 1 FROM application_scheduler_configuration asc2 WHERE asc2.scheduler_key = v.scheduler_key
);
