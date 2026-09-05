-- Make the ExternalHospitalSyncScheduler.backfillMissingGeocode cron DB-driven
-- (enable/disable + expression editable from the iwork Cron Jobs admin page)
-- instead of a static @Cron decorator.
-- Expression stored in UTC. IST equivalent: 7:30 PM.
-- Note: application_scheduler_configuration has no unique constraint on scheduler_key,
-- so using WHERE NOT EXISTS guard (matches generic-tpa-sync-scheduler-config.sql).

INSERT INTO application_scheduler_configuration
  (scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
SELECT * FROM (VALUES
  ('BACKFILL_MISSING_GEOCODE', 'Hospital Geocode Backfill', '0 14 * * *', true, true, 'idle', 'Finds API_SYNC hospital addresses with null latitude/longitude and geocodes them via the Google Maps Geocoding API.', 0)
) AS v(scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
WHERE NOT EXISTS (
  SELECT 1 FROM application_scheduler_configuration asc2 WHERE asc2.scheduler_key = v.scheduler_key
);
