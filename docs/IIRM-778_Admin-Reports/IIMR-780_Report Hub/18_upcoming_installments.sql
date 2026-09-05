-- ============================================================================
-- Report: Upcoming Installments
-- name (used in URL/endpoint): upcoming_installments    |    id: 18    |    order_no: 47
-- end_point: upcoming_installments
-- created_at: 2026-05-28 19:16:50.473142    updated_at: 2026-05-28 19:16:50.473142
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
-- 1. MAIN QUERY  (admin_reports.query, id = 18)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  pi.id AS "installmentId",
  COALESCE(pi.installment_no, 'Installment ' || COALESCE(pi.installment_sequence::text, '1')) AS "installmentLabel",
  pi.installment_sequence AS "installmentSeq",
  pi.installment_date AS "installmentDate",
  COALESCE(pi.total_installment_amount, pi.installment_net_amount) AS "installmentAmount",
  pi.installment_percentage AS "installmentPercent"
FROM policy_installments pi
WHERE pi.policy_id = ###policyId###
  AND pi.deleted_at IS NULL
  AND pi.installment_date >= CURRENT_DATE
ORDER BY pi.installment_date ASC$Q$
--   WHERE id = 18;

SELECT
  pi.id AS "installmentId",
  COALESCE(pi.installment_no, 'Installment ' || COALESCE(pi.installment_sequence::text, '1')) AS "installmentLabel",
  pi.installment_sequence AS "installmentSeq",
  pi.installment_date AS "installmentDate",
  COALESCE(pi.total_installment_amount, pi.installment_net_amount) AS "installmentAmount",
  pi.installment_percentage AS "installmentPercent"
FROM policy_installments pi
WHERE pi.policy_id = ###policyId###
  AND pi.deleted_at IS NULL
  AND pi.installment_date >= CURRENT_DATE
ORDER BY pi.installment_date ASC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 18)
-- ------------------------------------------------------------------
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
--   data_type      : number
--   input_field    : input
--   order_no       : 2
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 18)
-- ------------------------------------------------------------------
-- (no result mappings configured -- every column falls back to its raw query alias)

