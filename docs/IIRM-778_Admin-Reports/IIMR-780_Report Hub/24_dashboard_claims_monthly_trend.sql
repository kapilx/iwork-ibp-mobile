-- ============================================================================
-- Report: Dashboard Claims Monthly Trend
-- name (used in URL/endpoint): dashboard_claims_monthly_trend    |    id: 24    |    order_no: 23
-- end_point: dashboard_claims_monthly_trend
-- created_at: 2026-05-08 12:03:43.680983    updated_at: 2026-05-29 09:01:34.590637
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
-- 1. MAIN QUERY  (admin_reports.query, id = 24)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH policy_window AS (
  SELECT id, company_id, policy_from, policy_to
  FROM policy WHERE id = ###policyId###
),
date_spine AS (
  SELECT generate_series(
    date_trunc('month', pw.policy_from),
    date_trunc('month', pw.policy_to),
    INTERVAL '1 month'
  ) AS month_start
  FROM policy_window pw
),
monthly_cur AS (
  SELECT
    date_trunc('month', c.claim_dt) AS claim_month,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='cashless'), 0)       AS cashless_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='reimbursement'), 0)  AS reimbursement_amount,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='cashless')                            AS cashless_count,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='reimbursement')                       AS reimbursement_count
  FROM policy_claim c
  INNER JOIN policy_window pw ON pw.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND c.claim_dt BETWEEN pw.policy_from AND pw.policy_to
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_f.id FROM policy_enrollment_employee pee_f
        WHERE pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_f.deleted_at IS NULL
      )
    )
  GROUP BY date_trunc('month', c.claim_dt)
),
monthly_prev AS (
  SELECT
    date_trunc('month', c.claim_dt) + INTERVAL '1 year' AS claim_month,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='cashless'), 0)       AS cashless_amount_prev_year,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='reimbursement'), 0)  AS reimbursement_amount_prev_year,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='cashless')                            AS cashless_count_prev_year,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='reimbursement')                       AS reimbursement_count_prev_year
  FROM policy_claim c
  INNER JOIN policy_window pw ON 1=1
  WHERE c.deleted_at IS NULL
    AND c.policy_id = COALESCE(
      (SELECT opp.ref_policy_id FROM policy p2
       JOIN opportunity opp ON opp.id = p2.opportunity_id AND opp.ref_policy_id IS NOT NULL
       WHERE p2.id = ###policyId### LIMIT 1),
      pw.id
    )
    AND c.claim_dt BETWEEN (pw.policy_from - INTERVAL '1 year') AND (pw.policy_to - INTERVAL '1 year')
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_f.id FROM policy_enrollment_employee pee_f
        WHERE pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_f.deleted_at IS NULL
      )
    )
  GROUP BY date_trunc('month', c.claim_dt)
)
SELECT
  TO_CHAR(ds.month_start, 'Mon ''YY')           AS "month",
  ds.month_start                                  AS "monthStart",
  COALESCE(mc.cashless_amount, 0)                AS "cashlessAmount",
  COALESCE(mc.reimbursement_amount, 0)           AS "reimbursementAmount",
  COALESCE(mc.cashless_count, 0)                 AS "cashlessCount",
  COALESCE(mc.reimbursement_count, 0)            AS "reimbursementCount",
  COALESCE(mp.cashless_amount_prev_year, 0)      AS "cashlessAmountPrevYear",
  COALESCE(mp.reimbursement_amount_prev_year, 0) AS "reimbursementAmountPrevYear",
  COALESCE(mp.cashless_count_prev_year, 0)       AS "cashlessCountPrevYear",
  COALESCE(mp.reimbursement_count_prev_year, 0)  AS "reimbursementCountPrevYear"
FROM date_spine ds
LEFT JOIN monthly_cur  mc ON DATE(mc.claim_month) = DATE(ds.month_start)
LEFT JOIN monthly_prev mp ON DATE(mp.claim_month) = DATE(ds.month_start)
ORDER BY ds.month_start$Q$
--   WHERE id = 24;

WITH policy_window AS (
  SELECT id, company_id, policy_from, policy_to
  FROM policy WHERE id = ###policyId###
),
date_spine AS (
  SELECT generate_series(
    date_trunc('month', pw.policy_from),
    date_trunc('month', pw.policy_to),
    INTERVAL '1 month'
  ) AS month_start
  FROM policy_window pw
),
monthly_cur AS (
  SELECT
    date_trunc('month', c.claim_dt) AS claim_month,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='cashless'), 0)       AS cashless_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='reimbursement'), 0)  AS reimbursement_amount,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='cashless')                            AS cashless_count,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='reimbursement')                       AS reimbursement_count
  FROM policy_claim c
  INNER JOIN policy_window pw ON pw.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND c.claim_dt BETWEEN pw.policy_from AND pw.policy_to
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_f.id FROM policy_enrollment_employee pee_f
        WHERE pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_f.deleted_at IS NULL
      )
    )
  GROUP BY date_trunc('month', c.claim_dt)
),
monthly_prev AS (
  SELECT
    date_trunc('month', c.claim_dt) + INTERVAL '1 year' AS claim_month,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='cashless'), 0)       AS cashless_amount_prev_year,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='reimbursement'), 0)  AS reimbursement_amount_prev_year,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='cashless')                            AS cashless_count_prev_year,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''))='reimbursement')                       AS reimbursement_count_prev_year
  FROM policy_claim c
  INNER JOIN policy_window pw ON 1=1
  WHERE c.deleted_at IS NULL
    AND c.policy_id = COALESCE(
      (SELECT opp.ref_policy_id FROM policy p2
       JOIN opportunity opp ON opp.id = p2.opportunity_id AND opp.ref_policy_id IS NOT NULL
       WHERE p2.id = ###policyId### LIMIT 1),
      pw.id
    )
    AND c.claim_dt BETWEEN (pw.policy_from - INTERVAL '1 year') AND (pw.policy_to - INTERVAL '1 year')
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_f.id FROM policy_enrollment_employee pee_f
        WHERE pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_f.deleted_at IS NULL
      )
    )
  GROUP BY date_trunc('month', c.claim_dt)
)
SELECT
  TO_CHAR(ds.month_start, 'Mon ''YY')           AS "month",
  ds.month_start                                  AS "monthStart",
  COALESCE(mc.cashless_amount, 0)                AS "cashlessAmount",
  COALESCE(mc.reimbursement_amount, 0)           AS "reimbursementAmount",
  COALESCE(mc.cashless_count, 0)                 AS "cashlessCount",
  COALESCE(mc.reimbursement_count, 0)            AS "reimbursementCount",
  COALESCE(mp.cashless_amount_prev_year, 0)      AS "cashlessAmountPrevYear",
  COALESCE(mp.reimbursement_amount_prev_year, 0) AS "reimbursementAmountPrevYear",
  COALESCE(mp.cashless_count_prev_year, 0)       AS "cashlessCountPrevYear",
  COALESCE(mp.reimbursement_count_prev_year, 0)  AS "reimbursementCountPrevYear"
FROM date_spine ds
LEFT JOIN monthly_cur  mc ON DATE(mc.claim_month) = DATE(ds.month_start)
LEFT JOIN monthly_prev mp ON DATE(mp.claim_month) = DATE(ds.month_start)
ORDER BY ds.month_start

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 24)
-- ------------------------------------------------------------------
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : locationIds
--   token in query : ###locationIds###
--   data_type      : (none)
--   input_field    : (none -- likely unusable from the UI)
--   >>> STUB parameter row -- no type/label configured, this filter cannot be used from the generic screen.
--
-- Filter: Policy ID
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 24)
-- ------------------------------------------------------------------
--   month                        -> Month                          (variable: month, type: string, align: left)
--   monthStart                   -> Month Start                    (variable: monthStart, type: string, align: left)
--   cashlessAmount               -> Cashless Amount                (variable: cashlessAmount, type: number, align: right)
--   reimbursementAmount          -> Reimbursement Amount           (variable: reimbursementAmount, type: number, align: right)
--   cashlessCount                -> Cashless Count                 (variable: cashlessCount, type: number, align: right)
--   reimbursementCount           -> Reimbursement Count            (variable: reimbursementCount, type: number, align: right)
--   cashlessAmountPrevYear       -> Cashless Amount (Prev Year)    (variable: cashlessAmountPrevYear, type: number, align: right)
--   reimbursementAmountPrevYear  -> Reimbursement Amount (Prev Year) (variable: reimbursementAmountPrevYear, type: number, align: right)
--   cashlessCountPrevYear        -> Cashless Count (Prev Year)     (variable: cashlessCountPrevYear, type: number, align: right)
--   reimbursementCountPrevYear   -> Reimbursement Count (Prev Year) (variable: reimbursementCountPrevYear, type: number, align: right)

