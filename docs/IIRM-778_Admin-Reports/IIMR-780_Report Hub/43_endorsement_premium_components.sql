-- ============================================================================
-- Report: Endorsement Premium Components
-- name (used in URL/endpoint): endorsement_premium_components    |    id: 43    |    order_no: 23
-- end_point: endorsement_premium_components
-- created_at: 2026-05-08 12:09:33.433056    updated_at: 2026-05-08 12:09:33.433056
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
-- 1. MAIN QUERY  (admin_reports.query, id = 43)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT 'BASE_PREMIUM'                  AS "componentKey",'Base Premium'                  AS "componentLabel",NULL::numeric AS "amount" WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'TAX_AMOUNT',                 'Tax Amount',                  NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'GROSS_PREMIUM',              'Gross Premium',               NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'ADDITION_PREMIUM',           'Addition Premium',            NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'DELETION_PREMIUM',           'Deletion Premium',            NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'CORRECTION_ADDITION_PREMIUM','Correction Addition Premium', NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'CORRECTION_DELETION_PREMIUM','Correction Deletion Premium', NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'NET_PREMIUM',                'Net Premium',                 NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'NET_TAX_AMOUNT',             'Net Tax Amount',              NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'NET_GROSS_PREMIUM',          'Net Gross Premium',           NULL::numeric WHERE ###companyId### IS NOT NULL$Q$
--   WHERE id = 43;

SELECT 'BASE_PREMIUM'                  AS "componentKey",'Base Premium'                  AS "componentLabel",NULL::numeric AS "amount" WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'TAX_AMOUNT',                 'Tax Amount',                  NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'GROSS_PREMIUM',              'Gross Premium',               NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'ADDITION_PREMIUM',           'Addition Premium',            NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'DELETION_PREMIUM',           'Deletion Premium',            NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'CORRECTION_ADDITION_PREMIUM','Correction Addition Premium', NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'CORRECTION_DELETION_PREMIUM','Correction Deletion Premium', NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'NET_PREMIUM',                'Net Premium',                 NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'NET_TAX_AMOUNT',             'Net Tax Amount',              NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT 'NET_GROSS_PREMIUM',          'Net Gross Premium',           NULL::numeric WHERE ###companyId### IS NOT NULL

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 43)
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
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 43)
-- ------------------------------------------------------------------
--   componentKey                 -> Component Key                  (variable: componentKey, type: string, align: left)
--   componentLabel               -> Component Label                (variable: componentLabel, type: string, align: left)
--   amount                       -> Amount                         (variable: amount, type: number, align: right)

