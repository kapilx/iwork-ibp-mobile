-- Schema change for Service Score summary-details (IIRM-6282)
-- Adds a completion timestamp to `meeting` so meeting-based services
-- (Quarterly/Monthly/Multilateral Meeting) can compute TAT as
-- completed_at - created_at.

ALTER TABLE meeting
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Backfill existing completed meetings so historical rows aren't excluded
-- from Service Score calculations.
UPDATE meeting
SET completed_at = updated_at
WHERE completed_at IS NULL
  AND meeting_status_lid IN (
      SELECT id FROM lookup_data WHERE lookup_key ILIKE '%MEETING_STATUS_COMPLETED%'
  );

-- Correct Service Score weightages (org_id 1) to the canonical business
-- weightages (IIRM-6282 spec) — sums to 100. Most services had been left at
-- a flat default of 10 instead of their intended weightage.
UPDATE mstr_org_service_weightage mosw
SET weightage_score = v.new_weightage,
    updated_at = CURRENT_TIMESTAMP
FROM (VALUES
  ('Endorsement', 4),
  ('Health Claims', 10),
  ('Non Health Claims', 10),
  ('MIR', 10),
  ('Quarterly Meeting', 10),
  ('Monthly Meeting', 10),
  ('Multilateral Meetings', 10),
  ('Renewal Notice', 1),
  ('Renewal Strategy Report', 15),
  ('QCR Submission', 10),
  ('Value Added Service', 10)
) AS v(service_name, new_weightage)
INNER JOIN mstr_service ms ON ms.service_name = v.service_name
WHERE mosw.service_id = ms.id
  AND mosw.org_id = 1;
