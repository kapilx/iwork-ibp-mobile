-- ============================================================================
-- Report: Policy List For Enrollment Period
-- name (used in URL/endpoint): policy_list_for_enrollment_period    |    id: 65    |    order_no: 9991
-- end_point: policy_list_for_enrollment_period
-- created_at: 2026-07-15 04:43:11.868927    updated_at: 2026-07-15 04:43:11.868927
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
-- 1. MAIN QUERY  (admin_reports.query, id = 65)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT DISTINCT
  p.id                                                    AS "policyId",
  p.policy_name                                           AS "policyName",
  p.insurer_policy_number                                 AS "policyNumber",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                  AS "policyFrom",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                  AS "policyTo"
FROM policy p
INNER JOIN policy_enrollment_employee_policy_map pepm
  ON pepm.policy_id = p.id
  AND pepm.deleted_at IS NULL
INNER JOIN policy_enrollment_employee pee
  ON pee.id = pepm.employee_id
  AND pee.company_id = ###companyId###
  AND pee.deleted_at IS NULL
LEFT JOIN document_processing_file dpf
  ON dpf.document_id = pepm.enrollment_addition_batch_id
WHERE (
    NULLIF(###enrollmentPeriodIds###, '') IS NULL
    OR EXISTS (
      SELECT 1 FROM document_processing_file ref
      WHERE ref.id = ANY(string_to_array(###enrollmentPeriodIds###, ',')::int[])
        AND ref.enrollment_start_date = dpf.enrollment_start_date
        AND ref.enrollment_end_date   = dpf.enrollment_end_date
    )
  )
ORDER BY p.policy_name$Q$
--   WHERE id = 65;

SELECT DISTINCT
  p.id                                                    AS "policyId",
  p.policy_name                                           AS "policyName",
  p.insurer_policy_number                                 AS "policyNumber",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                  AS "policyFrom",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                  AS "policyTo"
FROM policy p
INNER JOIN policy_enrollment_employee_policy_map pepm
  ON pepm.policy_id = p.id
  AND pepm.deleted_at IS NULL
INNER JOIN policy_enrollment_employee pee
  ON pee.id = pepm.employee_id
  AND pee.company_id = ###companyId###
  AND pee.deleted_at IS NULL
LEFT JOIN document_processing_file dpf
  ON dpf.document_id = pepm.enrollment_addition_batch_id
WHERE (
    NULLIF(###enrollmentPeriodIds###, '') IS NULL
    OR EXISTS (
      SELECT 1 FROM document_processing_file ref
      WHERE ref.id = ANY(string_to_array(###enrollmentPeriodIds###, ',')::int[])
        AND ref.enrollment_start_date = dpf.enrollment_start_date
        AND ref.enrollment_end_date   = dpf.enrollment_end_date
    )
  )
ORDER BY p.policy_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 65)
-- ------------------------------------------------------------------
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : integer
--   input_field    : input
--   order_no       : 1
--
-- Filter: Enrollment Period IDs
--   parameter_name : enrollmentPeriodIds
--   token in query : ###enrollmentPeriodIds###
--   data_type      : varchar
--   input_field    : input
--   order_no       : 2
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 65)
-- ------------------------------------------------------------------
-- (no result mappings configured -- every column falls back to its raw query alias)

