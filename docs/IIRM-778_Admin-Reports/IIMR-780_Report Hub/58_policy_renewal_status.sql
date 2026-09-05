-- ============================================================================
-- Report: Policy Renewal Status
-- name (used in URL/endpoint): policy_renewal_status    |    id: 58    |    order_no: 58
-- end_point: policy_renewal_status
-- created_at: 2026-05-15 16:04:10.776694    updated_at: 2026-05-19 11:39:31.256311
-- Pulled directly from production 2026-07-23. See IIRM-780_Report-Hub-PRD.md for the
-- functional description and product-level context for this report.
-- ============================================================================
-- HOW TO CHANGE THIS REPORT
-- 1. Edit the query in section 1, then push it with the UPDATE template there.
-- 2. If you add/remove/rename an output column (an `AS "..."` alias in the SELECT),
--    you MUST also update admin_reports_results_mappings (section 3) --
--    query_parameter_name there must match your alias exactly, or that column
--    silently falls back to a raw, unlabelled header. (This has already happened
--    on two other reports in this set -- see their KNOWN ISSUES sections.)
-- 3. If you add a new ###Token### filter, insert a matching row into
--    admin_reports_parameters (section 2) -- query_parameter there must match
--    the token text in the query exactly, including the ### on both sides.
-- 4. Existing filters follow one of two safe patterns -- keep whichever this
--    report already uses unless you're deliberately changing its behavior:
--      optional:  col = COALESCE(###Token###, col)
--      optional (dates): (###Token### IS NULL OR col::date >= ###Token###::date)
--      mandatory: col = ###Token###   <- returns ZERO rows if the filter is unset
-- ============================================================================

-- ------------------------------------------------------------------
-- 1. MAIN QUERY  (admin_reports.query, id = 58)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
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
  END ASC$Q$
--   WHERE id = 58;

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

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 58)
-- ------------------------------------------------------------------
-- Filter: Policy ID
--   parameter_name : policyIds
--   token in query : ###policyIds###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 58)
-- ------------------------------------------------------------------
-- (no result mappings configured -- every column falls back to its raw query alias)

