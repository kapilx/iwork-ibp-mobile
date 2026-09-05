-- =============================================================================
-- policy-renewal-array-fix.sql
--
-- Fixes the policy_renewal_status report (id=58) which was already inserted
-- by hr-alter-scripts.sql.  The original query used:
--
--   WHERE o.ref_policy_id IN (###policyIds###)
--
-- buildQuery wraps the value in single quotes → IN ('1234,5678') — a string
-- comparison, not a list.  Also fails when policyIds = '[]' (empty JSON
-- array) or '' (empty string).
--
-- The fix replaces IN (...) with = ANY(regexp_split_to_table(...)) which
-- handles all input forms safely:
--   NULL / '' / '[]' → 0 rows from subquery → WHERE never matches (fine for
--                       the case where "no policies" means "no results")
--   '[1,2,3]'        → strips brackets → '1,2,3' → split → correct list
--   '1,2,3'          → split → correct list
--
-- Safe to re-run (idempotent: only updates when regexp_split_to_table not
-- already present in the query).
-- =============================================================================

BEGIN;

DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE public.admin_reports
  SET
    query      = $qr$
SELECT
  o.ref_policy_id   AS "policyId",
  oam.activity_key  AS "activityKey",
  oam.activity_name AS "activityName",
  ld.lookup_key     AS "statusKey"
FROM opportunity_activity_map oam
JOIN opportunity o  ON o.id = oam.opportunity_id
JOIN lookup_data ld ON ld.id = oam.status_lid
WHERE o.ref_policy_id = ANY(
  SELECT val::INTEGER
  FROM regexp_split_to_table(
    NULLIF(TRIM(REGEXP_REPLACE(###policyIds###, '[\[\]\s]', '', 'g')), ''),
    ','
  ) AS val
  WHERE val ~ '^\d+$'
)
  AND o.expiry_date > CURRENT_DATE
  AND ld.lookup_key IN (
    'OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS',
    'OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED',
    'OPPORTUNITY_ACTIVITY_STATUS_APPROVED',
    'OPPORTUNITY_ACTIVITY_STATUS_REJECTED'
  )
ORDER BY
  o.ref_policy_id ASC,
  CASE ld.lookup_key
    WHEN 'OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS' THEN 1
    WHEN 'OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED' THEN 2
    WHEN 'OPPORTUNITY_ACTIVITY_STATUS_APPROVED' THEN 3
    WHEN 'OPPORTUNITY_ACTIVITY_STATUS_REJECTED' THEN 4
    ELSE 5
  END ASC
$qr$,
    updated_at = NOW()
  WHERE name = 'policy_renewal_status'
    AND query NOT LIKE '%regexp_split_to_table%';

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    RAISE NOTICE 'policy_renewal_status: already patched or report not found — skip';
  ELSE
    RAISE NOTICE 'policy_renewal_status: array fix applied (% row updated)', rows_updated;
  END IF;
END $$;

COMMIT;
