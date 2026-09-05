-- ============================================================================
-- Report: Portfolio Company Policies
-- name (used in URL/endpoint): portfolio_company_policies    |    id: 52    |    order_no: 25
-- end_point: portfolio_company_policies
-- created_at: 2026-05-08 12:14:00.640021    updated_at: 2026-06-29 17:24:14.570823
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
-- 1. MAIN QUERY  (admin_reports.query, id = 52)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH loc_filter AS (
  SELECT NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL AS is_all
),
loc_id_set AS (
  SELECT val::INTEGER AS loc_id
  FROM regexp_split_to_table(
    COALESCE(NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ''),
    ','
  ) AS val
  WHERE val ~ '^\d+$'
),
loc_employees AS (
  SELECT DISTINCT
    pee.id       AS employee_id,
    peepm.policy_id
  FROM policy_enrollment_employee pee
  INNER JOIN policy_enrollment_employee_policy_map peepm
    ON peepm.employee_id = pee.id AND peepm.deleted_at IS NULL
  WHERE pee.deleted_at IS NULL
    AND NOT (SELECT is_all FROM loc_filter)
    AND pee.policy_config_location_id IN (
      SELECT cpcl_loc.id
      FROM company_policy_configuration_location cpcl_loc
      WHERE cpcl_loc.address_id IN (SELECT loc_id FROM loc_id_set)
    )
),
loc_policy_emp_counts AS (
  -- Location employee count per policy
  SELECT policy_id, COUNT(DISTINCT employee_id) AS loc_emp_count
  FROM loc_employees
  GROUP BY policy_id
),
total_policy_emp_counts AS (
  -- Total employee count per policy (only for policies with location employees)
  SELECT peepm.policy_id, COUNT(DISTINCT peepm.employee_id) AS total_emp_count
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
    AND peepm.policy_id IN (SELECT policy_id FROM loc_policy_emp_counts)
  GROUP BY peepm.policy_id
),
endorsement_premiums AS (
  SELECT e.policy_id, SUM(e.net_premium) AS total_endorsement_premium
  FROM endorsement e
  INNER JOIN policy p_ep ON p_ep.id = e.policy_id
  WHERE e.net_premium IS NOT NULL
    AND p_ep.company_id = ###companyId###
  GROUP BY e.policy_id
),
policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  WHERE pim.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_tpa AS (
  SELECT DISTINCT ON (ptm.policy_id)
    ptm.policy_id,
    t.name AS tpa_name
  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  WHERE ptm.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)
  ORDER BY ptm.policy_id, ptm.id
)
SELECT
  p.id                                                           AS "policyId",
  p.company_id                                                   AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                             AS "policyTypeCode",
  ld.value                                                       AS "policyTypeName",
  pi.insurer_name                                                AS "insurerName",
  COALESCE(pt.tpa_name, '—')                                    AS "tpaName",
  p.insurer_policy_number                                        AS "policyNumber",
  -- Pro-rate premium: full premium when no location filter,
  -- location_emp/total_emp × net_premium when location is selected.
  ROUND(
    COALESCE(ep.total_endorsement_premium, p.net_premium) * COALESCE(
      lpec.loc_emp_count::numeric / NULLIF(tpec.total_emp_count::numeric, 0),
      1.0
    ),
    2
  )                                                              AS "premiumAmount",
  TO_CHAR(p.policy_from, 'DD/MM/YYYY')                          AS "startDate",
  TO_CHAR(p.policy_to,   'DD/MM/YYYY')                          AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                             THEN 'Expired'
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL '60 days'        THEN 'Renewal Due'
    ELSE 'Active'
  END                                                            AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld              ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld         ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi           ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt               ON pt.policy_id = p.id
LEFT JOIN loc_policy_emp_counts  lpec ON lpec.policy_id = p.id
LEFT JOIN total_policy_emp_counts tpec ON tpec.policy_id = p.id
LEFT JOIN endorsement_premiums ep ON ep.policy_id = p.id
WHERE p.company_id = ###companyId###
  AND (
    (SELECT is_all FROM loc_filter)
    OR p.id IN (SELECT policy_id FROM loc_policy_emp_counts)
  )
  AND (###externalHrUserId### IS NULL
       OR p.id IN (
         SELECT policy_id
         FROM external_hr_policy_map
         WHERE hr_management_id = ###externalHrUserId###::INTEGER
       ))
AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
ORDER BY p.policy_from DESC$Q$
--   WHERE id = 52;

WITH loc_filter AS (
  SELECT NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL AS is_all
),
loc_id_set AS (
  SELECT val::INTEGER AS loc_id
  FROM regexp_split_to_table(
    COALESCE(NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ''),
    ','
  ) AS val
  WHERE val ~ '^\d+$'
),
loc_employees AS (
  SELECT DISTINCT
    pee.id       AS employee_id,
    peepm.policy_id
  FROM policy_enrollment_employee pee
  INNER JOIN policy_enrollment_employee_policy_map peepm
    ON peepm.employee_id = pee.id AND peepm.deleted_at IS NULL
  WHERE pee.deleted_at IS NULL
    AND NOT (SELECT is_all FROM loc_filter)
    AND pee.policy_config_location_id IN (
      SELECT cpcl_loc.id
      FROM company_policy_configuration_location cpcl_loc
      WHERE cpcl_loc.address_id IN (SELECT loc_id FROM loc_id_set)
    )
),
loc_policy_emp_counts AS (
  -- Location employee count per policy
  SELECT policy_id, COUNT(DISTINCT employee_id) AS loc_emp_count
  FROM loc_employees
  GROUP BY policy_id
),
total_policy_emp_counts AS (
  -- Total employee count per policy (only for policies with location employees)
  SELECT peepm.policy_id, COUNT(DISTINCT peepm.employee_id) AS total_emp_count
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
    AND peepm.policy_id IN (SELECT policy_id FROM loc_policy_emp_counts)
  GROUP BY peepm.policy_id
),
endorsement_premiums AS (
  SELECT e.policy_id, SUM(e.net_premium) AS total_endorsement_premium
  FROM endorsement e
  INNER JOIN policy p_ep ON p_ep.id = e.policy_id
  WHERE e.net_premium IS NOT NULL
    AND p_ep.company_id = ###companyId###
  GROUP BY e.policy_id
),
policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  WHERE pim.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_tpa AS (
  SELECT DISTINCT ON (ptm.policy_id)
    ptm.policy_id,
    t.name AS tpa_name
  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  WHERE ptm.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)
  ORDER BY ptm.policy_id, ptm.id
)
SELECT
  p.id                                                           AS "policyId",
  p.company_id                                                   AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                             AS "policyTypeCode",
  ld.value                                                       AS "policyTypeName",
  pi.insurer_name                                                AS "insurerName",
  COALESCE(pt.tpa_name, '—')                                    AS "tpaName",
  p.insurer_policy_number                                        AS "policyNumber",
  -- Pro-rate premium: full premium when no location filter,
  -- location_emp/total_emp × net_premium when location is selected.
  ROUND(
    COALESCE(ep.total_endorsement_premium, p.net_premium) * COALESCE(
      lpec.loc_emp_count::numeric / NULLIF(tpec.total_emp_count::numeric, 0),
      1.0
    ),
    2
  )                                                              AS "premiumAmount",
  TO_CHAR(p.policy_from, 'DD/MM/YYYY')                          AS "startDate",
  TO_CHAR(p.policy_to,   'DD/MM/YYYY')                          AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                             THEN 'Expired'
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL '60 days'        THEN 'Renewal Due'
    ELSE 'Active'
  END                                                            AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld              ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld         ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi           ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt               ON pt.policy_id = p.id
LEFT JOIN loc_policy_emp_counts  lpec ON lpec.policy_id = p.id
LEFT JOIN total_policy_emp_counts tpec ON tpec.policy_id = p.id
LEFT JOIN endorsement_premiums ep ON ep.policy_id = p.id
WHERE p.company_id = ###companyId###
  AND (
    (SELECT is_all FROM loc_filter)
    OR p.id IN (SELECT policy_id FROM loc_policy_emp_counts)
  )
  AND (###externalHrUserId### IS NULL
       OR p.id IN (
         SELECT policy_id
         FROM external_hr_policy_map
         WHERE hr_management_id = ###externalHrUserId###::INTEGER
       ))
AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
ORDER BY p.policy_from DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 52)
-- ------------------------------------------------------------------
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : locationIds
--   token in query : ###locationIds###
--   data_type      : (none)
--   input_field    : (none -- likely unusable from the UI)
--   >>> STUB parameter row -- no type/label configured, this filter cannot be used from the generic screen.
--
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 52)
-- ------------------------------------------------------------------
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   companyId                    -> Company ID                     (variable: companyId, type: number, align: right)
--   policyTypeCode               -> Type Code                      (variable: policyTypeCode, type: string, align: left)
--   policyTypeName               -> Policy Type                    (variable: policyTypeName, type: string, align: left)
--   insurerName                  -> Insurer                        (variable: insurerName, type: string, align: left)
--   policyNumber                 -> Policy No.                     (variable: policyNumber, type: string, align: left)
--   premiumAmount                -> Premium                        (variable: premiumAmount, type: number, align: right)
--   startDate                    -> Start Date                     (variable: startDate, type: string, align: left)
--   endDate                      -> End Date                       (variable: endDate, type: string, align: left)
--   policyStatus                 -> Status                         (variable: policyStatus, type: string, align: left)
--   tpaName                      -> TPA                            (variable: tpaName, type: string, align: left)

