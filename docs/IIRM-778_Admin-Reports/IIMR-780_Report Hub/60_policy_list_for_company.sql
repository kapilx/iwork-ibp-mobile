-- ============================================================================
-- Report: Policy List For Company
-- name (used in URL/endpoint): policy_list_for_company    |    id: 60    |    order_no: 31
-- end_point: policy_list_for_company
-- created_at: 2026-07-02 14:34:10.225256    updated_at: 2026-07-02 14:34:10.225256
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
-- 1. MAIN QUERY  (admin_reports.query, id = 60)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
    p.id                       AS "policyId",
    p.policy_name              AS "policyName",
    p.insurer_policy_number    AS "policyNumber"
FROM policy p
WHERE p.company_id = ###companyId###
ORDER BY p.policy_name$Q$
--   WHERE id = 60;

SELECT
    p.id                       AS "policyId",
    p.policy_name              AS "policyName",
    p.insurer_policy_number    AS "policyNumber"
FROM policy p
WHERE p.company_id = ###companyId###
ORDER BY p.policy_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 60)
-- ------------------------------------------------------------------
-- Filter: Company
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : hidden
--   >>> HIDDEN field -- the generic /report screen cannot render an input for this.
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 60)
-- ------------------------------------------------------------------
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   policyName                   -> Policy Name                    (variable: policyName, type: string, align: left)
--   policyNumber                 -> Policy Number                  (variable: policyNumber, type: string, align: left)

-- ------------------------------------------------------------------
-- 5. KNOWN ISSUES
-- ------------------------------------------------------------------
-- 1. companyId -- this report's only filter -- is configured input_field_type = 'hidden' in admin_reports_parameters (section 2). No way to supply a value from the generic /report screen; selecting this report there always returns zero rows.

