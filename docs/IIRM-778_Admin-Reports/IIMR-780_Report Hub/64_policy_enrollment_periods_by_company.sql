-- ============================================================================
-- Report: Policy Enrollment Periods By Company
-- name (used in URL/endpoint): policy_enrollment_periods_by_company    |    id: 64    |    order_no: 9990
-- end_point: policy_enrollment_periods_by_company
-- created_at: 2026-07-15 04:43:11.834736    updated_at: 2026-07-15 04:43:11.834736
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
-- 1. MAIN QUERY  (admin_reports.query, id = 64)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT DISTINCT ON (dpf.enrollment_start_date, dpf.enrollment_end_date)
  dpf.id                                                                      AS "periodId",
  TO_CHAR(dpf.enrollment_start_date, 'DD Mon YYYY') || ' – ' ||
    TO_CHAR(dpf.enrollment_end_date, 'DD Mon YYYY')                          AS "label",
  dpf.enrollment_start_date                                                  AS "enrollmentStartDate",
  dpf.enrollment_end_date                                                    AS "enrollmentEndDate"
FROM document_processing_file dpf
INNER JOIN policy_enrollment_employee_policy_map pepm
  ON pepm.enrollment_addition_batch_id = dpf.document_id
  AND pepm.deleted_at IS NULL
INNER JOIN policy_enrollment_employee pee
  ON pee.id = pepm.employee_id
  AND pee.company_id = ###companyId###
  AND pee.deleted_at IS NULL
WHERE dpf.enrollment_start_date IS NOT NULL
  AND dpf.enrollment_end_date IS NOT NULL
ORDER BY dpf.enrollment_start_date DESC, dpf.enrollment_end_date DESC, dpf.id ASC$Q$
--   WHERE id = 64;

SELECT DISTINCT ON (dpf.enrollment_start_date, dpf.enrollment_end_date)
  dpf.id                                                                      AS "periodId",
  TO_CHAR(dpf.enrollment_start_date, 'DD Mon YYYY') || ' – ' ||
    TO_CHAR(dpf.enrollment_end_date, 'DD Mon YYYY')                          AS "label",
  dpf.enrollment_start_date                                                  AS "enrollmentStartDate",
  dpf.enrollment_end_date                                                    AS "enrollmentEndDate"
FROM document_processing_file dpf
INNER JOIN policy_enrollment_employee_policy_map pepm
  ON pepm.enrollment_addition_batch_id = dpf.document_id
  AND pepm.deleted_at IS NULL
INNER JOIN policy_enrollment_employee pee
  ON pee.id = pepm.employee_id
  AND pee.company_id = ###companyId###
  AND pee.deleted_at IS NULL
WHERE dpf.enrollment_start_date IS NOT NULL
  AND dpf.enrollment_end_date IS NOT NULL
ORDER BY dpf.enrollment_start_date DESC, dpf.enrollment_end_date DESC, dpf.id ASC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 64)
-- ------------------------------------------------------------------
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : integer
--   input_field    : input
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 64)
-- ------------------------------------------------------------------
-- (no result mappings configured -- every column falls back to its raw query alias)

