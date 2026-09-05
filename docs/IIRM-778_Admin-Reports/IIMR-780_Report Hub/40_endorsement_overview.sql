-- ============================================================================
-- Report: Endorsement Overview KPIs
-- name (used in URL/endpoint): endorsement_overview    |    id: 40    |    order_no: 20
-- end_point: endorsement_overview
-- created_at: 2026-05-08 12:08:57.413819    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 40)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  COUNT(DISTINCT e.id) AS "totalEndorsements",
  NULL::numeric        AS "netGrossPremium"
FROM endorsement e
INNER JOIN policy p ON p.id = e.policy_id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.policy_id = p.id
        AND peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))$Q$
--   WHERE id = 40;

SELECT
  COUNT(DISTINCT e.id) AS "totalEndorsements",
  NULL::numeric        AS "netGrossPremium"
FROM endorsement e
INNER JOIN policy p ON p.id = e.policy_id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.policy_id = p.id
        AND peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 40)
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
-- Filter: Policy ID
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 40)
-- ------------------------------------------------------------------
--   totalEndorsements            -> Total Endorsements             (variable: totalEndorsements, type: number, align: right)
--   netGrossPremium              -> Net Gross Premium              (variable: netGrossPremium, type: number, align: right)

