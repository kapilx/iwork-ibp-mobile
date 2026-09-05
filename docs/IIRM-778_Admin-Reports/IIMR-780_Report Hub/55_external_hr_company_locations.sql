-- ============================================================================
-- Report: External HR – Company Locations
-- name (used in URL/endpoint): external_hr_company_locations    |    id: 55    |    order_no: 101
-- end_point: external_hr_company_locations
-- created_at: 2026-05-13 12:11:21.843585    updated_at: 2026-06-29 17:24:13.001891
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
-- 1. MAIN QUERY  (admin_reports.query, id = 55)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT DISTINCT ON (a.addr_1) a.id, a.addr_1
FROM company_policy_configuration_location cpcl
JOIN address a ON a.id = cpcl.address_id
WHERE cpcl.company_id = ###companyId###
  AND a.deleted_at IS NULL
ORDER BY a.addr_1 ASC, a.id ASC$Q$
--   WHERE id = 55;

SELECT DISTINCT ON (a.addr_1) a.id, a.addr_1
FROM company_policy_configuration_location cpcl
JOIN address a ON a.id = cpcl.address_id
WHERE cpcl.company_id = ###companyId###
  AND a.deleted_at IS NULL
ORDER BY a.addr_1 ASC, a.id ASC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 55)
-- ------------------------------------------------------------------
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
--   data_type      : integer
--   input_field    : (none -- likely unusable from the UI)
--   order_no       : 2
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 55)
-- ------------------------------------------------------------------
--   id                           -> ID                             (variable: id, type: number, align: right)
--   location_code                -> Location code                  (variable: locationCode, type: string, align: left)

