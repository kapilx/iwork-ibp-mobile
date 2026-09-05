-- Tracks per-SBU RO generation progress to prevent duplicate processing across multiple scheduler pods.
-- ro_process_status: NULL = idle, 'PROCESSING' = claimed by a pod
-- ro_process_started_at: used to auto-heal stuck records (pod crash recovery after 2 hours)
ALTER TABLE org_sbu
  ADD COLUMN ro_process_status     VARCHAR(50)  NULL,
  ADD COLUMN ro_process_started_at TIMESTAMPTZ  NULL;
