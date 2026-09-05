-- ============================================================================
-- Report: Portfolio KPI Summary
-- name (used in URL/endpoint): portfolio_kpi_summary    |    id: 47    |    order_no: 20
-- end_point: portfolio_kpi_summary
-- created_at: 2026-05-08 12:12:27.895499    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 47)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH lh_companies AS (
  SELECT DISTINCT c.id
  FROM company c
  WHERE c.deleted_at IS NULL
    AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId###)
    AND (
      ###hrCompanyId### = ''
      OR c.id::text = ###hrCompanyId###
      OR c.id IN (
        SELECT gcm3.group_company_id FROM group_company_map gcm3
        WHERE gcm3.company_id::text = ###hrCompanyId###
      )
    )
    AND EXISTS (
      SELECT 1
      FROM policy p2
      JOIN policy_type_segregation pts ON pts.policy_type_lid = p2.policy_type_lid
      JOIN lookup_data il ON il.id = pts.iirm_policy_type_lid AND il.deleted_at IS NULL
      WHERE p2.company_id = c.id
        AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
        AND lower(il.value) NOT LIKE '%non-life%'
    )
),
policy_loc_ratios AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id) FILTER (
      WHERE pee_lp.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
    )::numeric AS loc_emp_count,
    COUNT(DISTINCT peepm.employee_id)::numeric AS total_emp_count
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy_enrollment_employee pee_lp
    ON pee_lp.id = peepm.employee_id AND pee_lp.deleted_at IS NULL
  WHERE peepm.deleted_at IS NULL
    AND NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NOT NULL
  GROUP BY peepm.policy_id
)
SELECT
  COUNT(DISTINCT lc.id)::int                                                           AS "totalCompanies",
  COUNT(DISTINCT p.id)::int                                                            AS "totalPolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to >= CURRENT_DATE)::int                AS "activePolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to <  CURRENT_DATE)::int                AS "inactivePolicies",
  COALESCE(SUM(
    COALESCE((SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id AND e.net_premium IS NOT NULL), p.net_premium) * COALESCE(
      plr.loc_emp_count / NULLIF(plr.total_emp_count, 0),
      1.0
    )
  ), 0)::numeric                                                                        AS "totalPremium"
FROM lh_companies lc
LEFT JOIN policy p ON p.company_id = lc.id
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee pee_loc
      INNER JOIN policy_enrollment_employee_policy_map peepm_loc
        ON peepm_loc.employee_id = pee_loc.id
       AND peepm_loc.policy_id = p.id
       AND peepm_loc.deleted_at IS NULL
      WHERE pee_loc.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
      AND pee_loc.deleted_at IS NULL
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
LEFT JOIN policy_loc_ratios plr ON plr.policy_id = p.id$Q$
--   WHERE id = 47;

WITH lh_companies AS (
  SELECT DISTINCT c.id
  FROM company c
  WHERE c.deleted_at IS NULL
    AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId###)
    AND (
      ###hrCompanyId### = ''
      OR c.id::text = ###hrCompanyId###
      OR c.id IN (
        SELECT gcm3.group_company_id FROM group_company_map gcm3
        WHERE gcm3.company_id::text = ###hrCompanyId###
      )
    )
    AND EXISTS (
      SELECT 1
      FROM policy p2
      JOIN policy_type_segregation pts ON pts.policy_type_lid = p2.policy_type_lid
      JOIN lookup_data il ON il.id = pts.iirm_policy_type_lid AND il.deleted_at IS NULL
      WHERE p2.company_id = c.id
        AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
        AND lower(il.value) NOT LIKE '%non-life%'
    )
),
policy_loc_ratios AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id) FILTER (
      WHERE pee_lp.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
    )::numeric AS loc_emp_count,
    COUNT(DISTINCT peepm.employee_id)::numeric AS total_emp_count
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy_enrollment_employee pee_lp
    ON pee_lp.id = peepm.employee_id AND pee_lp.deleted_at IS NULL
  WHERE peepm.deleted_at IS NULL
    AND NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NOT NULL
  GROUP BY peepm.policy_id
)
SELECT
  COUNT(DISTINCT lc.id)::int                                                           AS "totalCompanies",
  COUNT(DISTINCT p.id)::int                                                            AS "totalPolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to >= CURRENT_DATE)::int                AS "activePolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to <  CURRENT_DATE)::int                AS "inactivePolicies",
  COALESCE(SUM(
    COALESCE((SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id AND e.net_premium IS NOT NULL), p.net_premium) * COALESCE(
      plr.loc_emp_count / NULLIF(plr.total_emp_count, 0),
      1.0
    )
  ), 0)::numeric                                                                        AS "totalPremium"
FROM lh_companies lc
LEFT JOIN policy p ON p.company_id = lc.id
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee pee_loc
      INNER JOIN policy_enrollment_employee_policy_map peepm_loc
        ON peepm_loc.employee_id = pee_loc.id
       AND peepm_loc.policy_id = p.id
       AND peepm_loc.deleted_at IS NULL
      WHERE pee_loc.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
      AND pee_loc.deleted_at IS NULL
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
LEFT JOIN policy_loc_ratios plr ON plr.policy_id = p.id

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 47)
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
-- Filter: CRM User ID
--   parameter_name : crmUserId
--   token in query : ###crmUserId###
--   data_type      : string
--   input_field    : input
--   order_no       : 10
--
-- Filter: HR Company ID
--   parameter_name : hrCompanyId
--   token in query : ###hrCompanyId###
--   data_type      : string
--   input_field    : input
--   order_no       : 11
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 47)
-- ------------------------------------------------------------------
--   totalCompanies               -> Total Companies                (variable: totalCompanies, type: number, align: right)
--   totalPolicies                -> Total Policies                 (variable: totalPolicies, type: number, align: right)
--   activePolicies               -> Active Policies                (variable: activePolicies, type: number, align: right)
--   inactivePolicies             -> Inactive Policies              (variable: inactivePolicies, type: number, align: right)
--   totalLives                   -> Total Lives                    (variable: totalLives, type: number, align: right)
--   totalPremium                 -> Total Premium                  (variable: totalPremium, type: number, align: right)

