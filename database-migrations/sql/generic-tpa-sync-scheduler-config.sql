-- Make the three GenericTpaSyncScheduler crons DB-driven (enable/disable + expression editable from admin UI).
-- Expressions stored in UTC. IST equivalents: Producer 10:30 PM, Worker 10:40 PM, Parser 10:50 PM.
-- Note: application_scheduler_configuration has no unique constraint on scheduler_key, so using WHERE NOT EXISTS guard.

INSERT INTO application_scheduler_configuration
  (scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
SELECT * FROM (VALUES
  ('GENERIC_TPA_SYNC_PRODUCER', 'TPA Sync – Producer', '0 17 * * *',   true, true, 'idle', 'Scans active SYNC-type TPA configs, checks per-config cron schedule, enqueues PENDING sync_job rows for due configs.', 0),
  ('GENERIC_TPA_SYNC_WORKER',   'TPA Sync – Worker',   '10 17 * * *',  true, true, 'idle', 'Picks PENDING sync_job rows (batch 10), calls TPA API via document-service, stores raw response in raw_sync_response.', 0),
  ('GENERIC_TPA_SYNC_PARSER',   'TPA Sync – Parser',   '20 17 * * *',  true, true, 'idle', 'Picks RECEIVED raw_sync_response rows (batch 20), applies DB_COLUMN response mappings, upserts into target tables.', 0)
) AS v(scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
WHERE NOT EXISTS (
  SELECT 1 FROM application_scheduler_configuration asc2 WHERE asc2.scheduler_key = v.scheduler_key
);
