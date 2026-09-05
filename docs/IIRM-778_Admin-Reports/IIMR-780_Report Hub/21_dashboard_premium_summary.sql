-- ============================================================================
-- Report: Dashboard Premium Summary
-- name (used in URL/endpoint): dashboard_premium_summary    |    id: 21    |    order_no: 20
-- end_point: dashboard_premium_summary
-- created_at: 2026-05-08 12:02:18.92567    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 21)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH cur_year AS (
  SELECT
    COALESCE(SUM(p.premium_at_inception), 0) AS inception_premium,
    0::numeric                                AS addition_premium,
    0::numeric                                AS deletion_premium,
    0::numeric                                AS top_up_premium,
    COALESCE(SUM(p.net_premium), 0)           AS total_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND p.policy_from >= ###policyPeriodStart###::date
    AND p.policy_to   <= ###policyPeriodEnd###::date
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
),
prev_year AS (
  SELECT
    COALESCE(SUM(p.premium_at_inception), 0) AS inception_premium,
    0::numeric                                AS addition_premium,
    0::numeric                                AS deletion_premium,
    0::numeric                                AS top_up_premium,
    COALESCE(SUM(p.net_premium), 0)           AS total_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND p.policy_from >= (###policyPeriodStart###::date - INTERVAL '1 year')
    AND p.policy_to   <= (###policyPeriodEnd###::date   - INTERVAL '1 year')
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
)
SELECT
  cy.inception_premium                                                                AS "inceptionPremium",
  cy.addition_premium                                                                 AS "additionPremium",
  cy.deletion_premium                                                                 AS "deletionPremium",
  cy.top_up_premium                                                                   AS "topUpPremium",
  cy.total_premium                                                                    AS "totalPremium",
  py.inception_premium                                                                AS "inceptionPremiumPrevYear",
  py.addition_premium                                                                 AS "additionPremiumPrevYear",
  py.deletion_premium                                                                 AS "deletionPremiumPrevYear",
  py.top_up_premium                                                                   AS "topUpPremiumPrevYear",
  py.total_premium                                                                    AS "totalPremiumPrevYear",
  ROUND((cy.total_premium - py.total_premium) * 100.0 / NULLIF(py.total_premium, 0), 1) AS "totalPremiumYoYChangePercent"
FROM cur_year cy
CROSS JOIN prev_year py$Q$
--   WHERE id = 21;

WITH cur_year AS (
  SELECT
    COALESCE(SUM(p.premium_at_inception), 0) AS inception_premium,
    0::numeric                                AS addition_premium,
    0::numeric                                AS deletion_premium,
    0::numeric                                AS top_up_premium,
    COALESCE(SUM(p.net_premium), 0)           AS total_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND p.policy_from >= ###policyPeriodStart###::date
    AND p.policy_to   <= ###policyPeriodEnd###::date
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
),
prev_year AS (
  SELECT
    COALESCE(SUM(p.premium_at_inception), 0) AS inception_premium,
    0::numeric                                AS addition_premium,
    0::numeric                                AS deletion_premium,
    0::numeric                                AS top_up_premium,
    COALESCE(SUM(p.net_premium), 0)           AS total_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND p.policy_from >= (###policyPeriodStart###::date - INTERVAL '1 year')
    AND p.policy_to   <= (###policyPeriodEnd###::date   - INTERVAL '1 year')
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
)
SELECT
  cy.inception_premium                                                                AS "inceptionPremium",
  cy.addition_premium                                                                 AS "additionPremium",
  cy.deletion_premium                                                                 AS "deletionPremium",
  cy.top_up_premium                                                                   AS "topUpPremium",
  cy.total_premium                                                                    AS "totalPremium",
  py.inception_premium                                                                AS "inceptionPremiumPrevYear",
  py.addition_premium                                                                 AS "additionPremiumPrevYear",
  py.deletion_premium                                                                 AS "deletionPremiumPrevYear",
  py.top_up_premium                                                                   AS "topUpPremiumPrevYear",
  py.total_premium                                                                    AS "totalPremiumPrevYear",
  ROUND((cy.total_premium - py.total_premium) * 100.0 / NULLIF(py.total_premium, 0), 1) AS "totalPremiumYoYChangePercent"
FROM cur_year cy
CROSS JOIN prev_year py

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 21)
-- ------------------------------------------------------------------
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Policy Type
--   parameter_name : policyType
--   token in query : ###policyType###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: Policy Period Start
--   parameter_name : policyPeriodStart
--   token in query : ###policyPeriodStart###
--   data_type      : date
--   input_field    : input
--   order_no       : 3
--
-- Filter: Policy Period End
--   parameter_name : policyPeriodEnd
--   token in query : ###policyPeriodEnd###
--   data_type      : date
--   input_field    : input
--   order_no       : 4
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 21)
-- ------------------------------------------------------------------
--   inceptionPremium             -> Inception Premium              (variable: inceptionPremium, type: number, align: right)
--   additionPremium              -> Addition Premium               (variable: additionPremium, type: number, align: right)
--   deletionPremium              -> Deletion Premium               (variable: deletionPremium, type: number, align: right)
--   topUpPremium                 -> Top-Up Premium                 (variable: topUpPremium, type: number, align: right)
--   totalPremium                 -> Total Premium                  (variable: totalPremium, type: number, align: right)
--   inceptionPremiumPrevYear     -> Inception Premium (Prev Year)  (variable: inceptionPremiumPrevYear, type: number, align: right)
--   additionPremiumPrevYear      -> Addition Premium (Prev Year)   (variable: additionPremiumPrevYear, type: number, align: right)
--   deletionPremiumPrevYear      -> Deletion Premium (Prev Year)   (variable: deletionPremiumPrevYear, type: number, align: right)
--   topUpPremiumPrevYear         -> Top-Up Premium (Prev Year)     (variable: topUpPremiumPrevYear, type: number, align: right)
--   totalPremiumPrevYear         -> Total Premium (Prev Year)      (variable: totalPremiumPrevYear, type: number, align: right)
--   totalPremiumYoYChangePercent -> Total Premium YoY Change (%)   (variable: totalPremiumYoYChangePercent, type: number, align: right)

