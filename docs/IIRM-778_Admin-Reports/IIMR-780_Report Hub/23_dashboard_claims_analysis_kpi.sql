-- ============================================================================
-- Report: Dashboard Claims Analysis KPI
-- name (used in URL/endpoint): dashboard_claims_analysis_kpi    |    id: 23    |    order_no: 22
-- end_point: dashboard_claims_analysis_kpi
-- created_at: 2026-05-08 12:03:17.876687    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 23)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH cur_year AS (
  SELECT
    COUNT(c.id)                                                                                         AS total_count,
    COALESCE(SUM(c.claim_amount), 0)                                                                    AS total_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('settled','paid')), 0)         AS paid_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('settled','paid'))                      AS paid_count,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('outstanding','pending')), 0)  AS pending_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('outstanding','pending'))               AS pending_count
  FROM policy_claim c
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '' OR ld.lookup_key = ###policyType###)
    AND (###startDate###   = '' OR c.claim_dt >= ###startDate###::date)
    AND (###endDate###     = '' OR c.claim_dt <= ###endDate###::date)
    AND (###claimType###   = '' OR LOWER(COALESCE(c.clm_type,'')) LIKE '%'||LOWER(###claimType###)||'%')
    AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''
         OR (LOWER(###memberType###)='employee'  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)='dependent' AND c.dependent_id IS NOT NULL))
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_loc.id FROM policy_enrollment_employee pee_loc
        WHERE pee_loc.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_loc.deleted_at IS NULL
      )
    )
),
prev_year AS (
  SELECT
    COUNT(c.id)                                                                                         AS total_count,
    COALESCE(SUM(c.claim_amount), 0)                                                                    AS total_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('settled','paid')), 0)         AS paid_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('settled','paid'))                      AS paid_count,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('outstanding','pending')), 0)  AS pending_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('outstanding','pending'))               AS pending_count
  FROM policy_claim c
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '' OR ld.lookup_key = ###policyType###)
    AND (###startDate###   = '' OR c.claim_dt >= (###startDate###::date - INTERVAL '1 year'))
    AND (###endDate###     = '' OR c.claim_dt <= (###endDate###::date   - INTERVAL '1 year'))
    AND (###claimType###   = '' OR LOWER(COALESCE(c.clm_type,'')) LIKE '%'||LOWER(###claimType###)||'%')
    AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''
         OR (LOWER(###memberType###)='employee'  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)='dependent' AND c.dependent_id IS NOT NULL))
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_loc.id FROM policy_enrollment_employee pee_loc
        WHERE pee_loc.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_loc.deleted_at IS NULL
      )
    )
),
net_premium_agg AS (
  SELECT COALESCE(SUM(p.net_premium), 0) AS total_net_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
)
SELECT
  cy.total_count                                                                         AS "totalClaimsCount",
  cy.total_amount                                                                        AS "totalClaimsAmount",
  cy.paid_amount                                                                         AS "paidClaimsAmount",
  cy.paid_count                                                                          AS "paidClaimsCount",
  cy.pending_amount                                                                      AS "pendingClaimsAmount",
  cy.pending_count                                                                       AS "pendingClaimsCount",
  ROUND(cy.paid_amount * 100.0 / NULLIF(np.total_net_premium, 0), 1)                   AS "claimRatioPercent",
  py.total_count                                                                         AS "totalClaimsCountPrevYear",
  py.total_amount                                                                        AS "totalClaimsAmountPrevYear",
  py.paid_amount                                                                         AS "paidClaimsAmountPrevYear",
  py.paid_count                                                                          AS "paidClaimsCountPrevYear",
  py.pending_amount                                                                      AS "pendingClaimsAmountPrevYear",
  py.pending_count                                                                       AS "pendingClaimsCountPrevYear",
  ROUND(py.paid_amount * 100.0 / NULLIF(np.total_net_premium, 0), 1)                   AS "claimRatioPercentPrevYear",
  ROUND((cy.total_amount   - py.total_amount)   * 100.0 / NULLIF(py.total_amount,  0), 1) AS "totalClaimsAmountYoYChangePercent",
  ROUND((cy.paid_amount    - py.paid_amount)    * 100.0 / NULLIF(py.paid_amount,   0), 1) AS "paidClaimsAmountYoYChangePercent",
  ROUND((cy.pending_amount - py.pending_amount) * 100.0 / NULLIF(py.pending_amount,0), 1) AS "pendingClaimsAmountYoYChangePercent"
FROM cur_year cy
CROSS JOIN prev_year py
CROSS JOIN net_premium_agg np$Q$
--   WHERE id = 23;

WITH cur_year AS (
  SELECT
    COUNT(c.id)                                                                                         AS total_count,
    COALESCE(SUM(c.claim_amount), 0)                                                                    AS total_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('settled','paid')), 0)         AS paid_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('settled','paid'))                      AS paid_count,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('outstanding','pending')), 0)  AS pending_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('outstanding','pending'))               AS pending_count
  FROM policy_claim c
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '' OR ld.lookup_key = ###policyType###)
    AND (###startDate###   = '' OR c.claim_dt >= ###startDate###::date)
    AND (###endDate###     = '' OR c.claim_dt <= ###endDate###::date)
    AND (###claimType###   = '' OR LOWER(COALESCE(c.clm_type,'')) LIKE '%'||LOWER(###claimType###)||'%')
    AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''
         OR (LOWER(###memberType###)='employee'  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)='dependent' AND c.dependent_id IS NOT NULL))
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_loc.id FROM policy_enrollment_employee pee_loc
        WHERE pee_loc.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_loc.deleted_at IS NULL
      )
    )
),
prev_year AS (
  SELECT
    COUNT(c.id)                                                                                         AS total_count,
    COALESCE(SUM(c.claim_amount), 0)                                                                    AS total_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('settled','paid')), 0)         AS paid_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('settled','paid'))                      AS paid_count,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('outstanding','pending')), 0)  AS pending_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('outstanding','pending'))               AS pending_count
  FROM policy_claim c
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '' OR ld.lookup_key = ###policyType###)
    AND (###startDate###   = '' OR c.claim_dt >= (###startDate###::date - INTERVAL '1 year'))
    AND (###endDate###     = '' OR c.claim_dt <= (###endDate###::date   - INTERVAL '1 year'))
    AND (###claimType###   = '' OR LOWER(COALESCE(c.clm_type,'')) LIKE '%'||LOWER(###claimType###)||'%')
    AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''
         OR (LOWER(###memberType###)='employee'  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)='dependent' AND c.dependent_id IS NOT NULL))
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_loc.id FROM policy_enrollment_employee pee_loc
        WHERE pee_loc.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_loc.deleted_at IS NULL
      )
    )
),
net_premium_agg AS (
  SELECT COALESCE(SUM(p.net_premium), 0) AS total_net_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
)
SELECT
  cy.total_count                                                                         AS "totalClaimsCount",
  cy.total_amount                                                                        AS "totalClaimsAmount",
  cy.paid_amount                                                                         AS "paidClaimsAmount",
  cy.paid_count                                                                          AS "paidClaimsCount",
  cy.pending_amount                                                                      AS "pendingClaimsAmount",
  cy.pending_count                                                                       AS "pendingClaimsCount",
  ROUND(cy.paid_amount * 100.0 / NULLIF(np.total_net_premium, 0), 1)                   AS "claimRatioPercent",
  py.total_count                                                                         AS "totalClaimsCountPrevYear",
  py.total_amount                                                                        AS "totalClaimsAmountPrevYear",
  py.paid_amount                                                                         AS "paidClaimsAmountPrevYear",
  py.paid_count                                                                          AS "paidClaimsCountPrevYear",
  py.pending_amount                                                                      AS "pendingClaimsAmountPrevYear",
  py.pending_count                                                                       AS "pendingClaimsCountPrevYear",
  ROUND(py.paid_amount * 100.0 / NULLIF(np.total_net_premium, 0), 1)                   AS "claimRatioPercentPrevYear",
  ROUND((cy.total_amount   - py.total_amount)   * 100.0 / NULLIF(py.total_amount,  0), 1) AS "totalClaimsAmountYoYChangePercent",
  ROUND((cy.paid_amount    - py.paid_amount)    * 100.0 / NULLIF(py.paid_amount,   0), 1) AS "paidClaimsAmountYoYChangePercent",
  ROUND((cy.pending_amount - py.pending_amount) * 100.0 / NULLIF(py.pending_amount,0), 1) AS "pendingClaimsAmountYoYChangePercent"
FROM cur_year cy
CROSS JOIN prev_year py
CROSS JOIN net_premium_agg np

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 23)
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
-- Filter: Start Date
--   parameter_name : startDate
--   token in query : ###startDate###
--   data_type      : date
--   input_field    : input
--   order_no       : 3
--
-- Filter: End Date
--   parameter_name : endDate
--   token in query : ###endDate###
--   data_type      : date
--   input_field    : input
--   order_no       : 4
--
-- Filter: Claim Type
--   parameter_name : claimType
--   token in query : ###claimType###
--   data_type      : string
--   input_field    : input
--   order_no       : 5
--
-- Filter: Claim Status
--   parameter_name : claimStatus
--   token in query : ###claimStatus###
--   data_type      : string
--   input_field    : input
--   order_no       : 6
--
-- Filter: Member Type
--   parameter_name : memberType
--   token in query : ###memberType###
--   data_type      : string
--   input_field    : input
--   order_no       : 7
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 23)
-- ------------------------------------------------------------------
--   totalClaimsCount             -> Total Claims Count             (variable: totalClaimsCount, type: number, align: right)
--   totalClaimsAmount            -> Total Claims Amount            (variable: totalClaimsAmount, type: number, align: right)
--   paidClaimsAmount             -> Paid Claims Amount             (variable: paidClaimsAmount, type: number, align: right)
--   paidClaimsCount              -> Paid Claims Count              (variable: paidClaimsCount, type: number, align: right)
--   pendingClaimsAmount          -> Pending Claims Amount          (variable: pendingClaimsAmount, type: number, align: right)
--   pendingClaimsCount           -> Pending Claims Count           (variable: pendingClaimsCount, type: number, align: right)
--   claimRatioPercent            -> Claim Ratio %                  (variable: claimRatioPercent, type: number, align: right)
--   totalClaimsCountPrevYear     -> Total Claims Count (Prev Year) (variable: totalClaimsCountPrevYear, type: number, align: right)
--   totalClaimsAmountPrevYear    -> Total Claims Amount (Prev Year) (variable: totalClaimsAmountPrevYear, type: number, align: right)
--   paidClaimsAmountPrevYear     -> Paid Claims Amount (Prev Year) (variable: paidClaimsAmountPrevYear, type: number, align: right)
--   paidClaimsCountPrevYear      -> Paid Claims Count (Prev Year)  (variable: paidClaimsCountPrevYear, type: number, align: right)
--   pendingClaimsAmountPrevYear  -> Pending Claims Amount (Prev Year) (variable: pendingClaimsAmountPrevYear, type: number, align: right)
--   pendingClaimsCountPrevYear   -> Pending Claims Count (Prev Year) (variable: pendingClaimsCountPrevYear, type: number, align: right)
--   claimRatioPercentPrevYear    -> Claim Ratio % (Prev Year)      (variable: claimRatioPercentPrevYear, type: number, align: right)
--   totalClaimsAmountYoYChangePercent -> Total Claims YoY Change (%)    (variable: totalClaimsAmountYoYChangePercent, type: number, align: right)
--   paidClaimsAmountYoYChangePercent -> Paid Claims YoY Change (%)     (variable: paidClaimsAmountYoYChangePercent, type: number, align: right)
--   pendingClaimsAmountYoYChangePercent -> Pending Claims YoY Change (%)  (variable: pendingClaimsAmountYoYChangePercent, type: number, align: right)

