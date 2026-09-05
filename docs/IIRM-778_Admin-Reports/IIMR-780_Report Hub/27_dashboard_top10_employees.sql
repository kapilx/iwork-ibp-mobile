-- ============================================================================
-- Report: Dashboard Top 10 Employees by Claims
-- name (used in URL/endpoint): dashboard_top10_employees    |    id: 27    |    order_no: 26
-- end_point: dashboard_top10_employees
-- created_at: 2026-05-08 12:04:47.227841    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 27)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH cur_year AS (
  SELECT
    pee.id                                                                    AS employee_id,
    pee.company_employee_id                                                   AS employee_code,
    COALESCE(pee.full_name, pee.employee_name, '—')                         AS employee_name,
    COALESCE(pee.designation, '—')                                          AS department,
    COUNT(c.id)                                                               AS total_claims,
    COALESCE(SUM(c.claim_amount), 0)                                         AS total_amount,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC)              AS cur_rank
  FROM policy_claim c
  INNER JOIN policy_enrollment_employee pee ON pee.id = c.employee_id AND pee.deleted_at IS NULL
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '' OR ld.lookup_key = ###policyType###)
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
    AND c.claim_dt BETWEEN ###policyPeriodStart###::date AND ###policyPeriodEnd###::date
    AND (###claimType###   = '' OR LOWER(COALESCE(c.clm_type,'')) LIKE '%'||LOWER(###claimType###)||'%')
    AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''
         OR (LOWER(###memberType###)='employee'  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)='dependent' AND c.dependent_id IS NOT NULL))
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
    )
  GROUP BY pee.id, pee.company_employee_id, pee.full_name, pee.employee_name, pee.designation
  ORDER BY total_amount DESC
  LIMIT 10
),
prev_year_ranked AS (
  SELECT
    c.employee_id,
    COALESCE(SUM(c.claim_amount), 0)                    AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC) AS prev_rank
  FROM policy_claim c
  INNER JOIN policy_enrollment_employee pee_py ON pee_py.id = c.employee_id AND pee_py.deleted_at IS NULL
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND c.claim_dt BETWEEN (###policyPeriodStart###::date - INTERVAL '1 year')
                       AND (###policyPeriodEnd###::date   - INTERVAL '1 year')
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee_py.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
    )
  GROUP BY c.employee_id
)
SELECT
  cy.employee_id                                                                       AS "employeeId",
  cy.employee_code                                                                     AS "employeeCode",
  cy.employee_name                                                                     AS "employeeName",
  cy.department                                                                        AS "department",
  cy.total_claims                                                                      AS "totalClaims",
  cy.total_amount                                                                      AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                     AS "totalAmountPrevYear",
  py.prev_rank                                                                         AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END        AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py,0)) * 100.0 / NULLIF(py.total_amount_py,0), 1) AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.employee_id = cy.employee_id
ORDER BY cy.total_amount DESC$Q$
--   WHERE id = 27;

WITH cur_year AS (
  SELECT
    pee.id                                                                    AS employee_id,
    pee.company_employee_id                                                   AS employee_code,
    COALESCE(pee.full_name, pee.employee_name, '—')                         AS employee_name,
    COALESCE(pee.designation, '—')                                          AS department,
    COUNT(c.id)                                                               AS total_claims,
    COALESCE(SUM(c.claim_amount), 0)                                         AS total_amount,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC)              AS cur_rank
  FROM policy_claim c
  INNER JOIN policy_enrollment_employee pee ON pee.id = c.employee_id AND pee.deleted_at IS NULL
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '' OR ld.lookup_key = ###policyType###)
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
    AND c.claim_dt BETWEEN ###policyPeriodStart###::date AND ###policyPeriodEnd###::date
    AND (###claimType###   = '' OR LOWER(COALESCE(c.clm_type,'')) LIKE '%'||LOWER(###claimType###)||'%')
    AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''
         OR (LOWER(###memberType###)='employee'  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)='dependent' AND c.dependent_id IS NOT NULL))
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
    )
  GROUP BY pee.id, pee.company_employee_id, pee.full_name, pee.employee_name, pee.designation
  ORDER BY total_amount DESC
  LIMIT 10
),
prev_year_ranked AS (
  SELECT
    c.employee_id,
    COALESCE(SUM(c.claim_amount), 0)                    AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC) AS prev_rank
  FROM policy_claim c
  INNER JOIN policy_enrollment_employee pee_py ON pee_py.id = c.employee_id AND pee_py.deleted_at IS NULL
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND c.claim_dt BETWEEN (###policyPeriodStart###::date - INTERVAL '1 year')
                       AND (###policyPeriodEnd###::date   - INTERVAL '1 year')
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee_py.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
    )
  GROUP BY c.employee_id
)
SELECT
  cy.employee_id                                                                       AS "employeeId",
  cy.employee_code                                                                     AS "employeeCode",
  cy.employee_name                                                                     AS "employeeName",
  cy.department                                                                        AS "department",
  cy.total_claims                                                                      AS "totalClaims",
  cy.total_amount                                                                      AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                     AS "totalAmountPrevYear",
  py.prev_rank                                                                         AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END        AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py,0)) * 100.0 / NULLIF(py.total_amount_py,0), 1) AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.employee_id = cy.employee_id
ORDER BY cy.total_amount DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 27)
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
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 27)
-- ------------------------------------------------------------------
--   employeeId                   -> Employee ID                    (variable: employeeId, type: number, align: right)
--   employeeCode                 -> Employee Code                  (variable: employeeCode, type: string, align: left)
--   employeeName                 -> Employee Name                  (variable: employeeName, type: string, align: left)
--   department                   -> Designation / Dept             (variable: department, type: string, align: left)
--   totalClaims                  -> Total Claims                   (variable: totalClaims, type: number, align: right)
--   totalAmount                  -> Total Amount                   (variable: totalAmount, type: number, align: right)
--   totalAmountPrevYear          -> Total Amount (Prev Year)       (variable: totalAmountPrevYear, type: number, align: right)
--   rankPrevYear                 -> Rank (Prev Year)               (variable: rankPrevYear, type: number, align: right)
--   rankChange                   -> Rank Change                    (variable: rankChange, type: number, align: right)
--   yoYChangePercent             -> YoY Change (%)                 (variable: yoYChangePercent, type: number, align: right)

