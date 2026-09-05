-- ============================================================================
-- Report: CD Management KPI Summary
-- name (used in URL/endpoint): cd_kpi_summary    |    id: 44    |    order_no: 10
-- end_point: cd_kpi_summary
-- created_at: 2026-05-08 12:09:48.874743    updated_at: 2026-05-29 09:01:34.590637
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
-- 1. MAIN QUERY  (admin_reports.query, id = 44)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH allowed_cd AS (
  SELECT DISTINCT cd.id
  FROM caution_deposit cd
  WHERE cd.company_id = ###companyId###
    AND cd.status = 'ACTIVE'
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR EXISTS (
        SELECT 1
        FROM caution_deposit_policy_mapping cdpm2
        INNER JOIN policy_enrollment_employee_policy_map peepm_f
          ON peepm_f.policy_id = cdpm2.policy_id AND peepm_f.deleted_at IS NULL
        INNER JOIN policy_enrollment_employee pee_f
          ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
        WHERE cdpm2.caution_deposit_id = cd.id
          AND pee_f.policy_config_location_id = ANY(
            SELECT val::INTEGER FROM regexp_split_to_table(
              NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
            ) AS val WHERE val ~ '^\d+$'
          )
      )
    )
    AND (###externalHrUserId### IS NULL
         OR EXISTS (
           SELECT 1
           FROM caution_deposit_policy_mapping cdpm
           WHERE cdpm.caution_deposit_id = cd.id
             AND cdpm.policy_id IN (
               SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER
             )
         ))
),
account_totals AS (
  SELECT
    COUNT(DISTINCT cd.id)              AS active_accounts_count,
    COALESCE(SUM(cd.balance_amount), 0) AS total_deposit_balance
  FROM caution_deposit cd
  INNER JOIN allowed_cd ac ON ac.id = cd.id
),
utilisation AS (
  SELECT COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) AS total_utilised
  FROM caution_deposit_transaction cdt
  INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
),
last_credit AS (
  SELECT cdt.transaction_date, cdt.transaction_amount, cdt.bank_name
  FROM caution_deposit_transaction cdt
  INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
  WHERE cdt.transaction_type = 'CREDIT_TRANSACTION'
  ORDER BY cdt.transaction_date DESC LIMIT 1
),
balance_trend AS (
  SELECT json_agg(monthly_balance ORDER BY month_start) AS trend_data
  FROM (
    SELECT
      date_trunc('month', cdt.transaction_date) AS month_start,
      SUM(CASE WHEN cdt.transaction_type='CREDIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END)
      - SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION'  THEN cdt.transaction_amount ELSE 0 END) AS monthly_balance
    FROM caution_deposit_transaction cdt
    INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
    WHERE cdt.transaction_date >= date_trunc('month', NOW() - INTERVAL '5 months')
    GROUP BY date_trunc('month', cdt.transaction_date)
    ORDER BY month_start LIMIT 6
  ) t
)
SELECT
  at.total_deposit_balance                                                             AS "totalDepositBalance",
  at.active_accounts_count                                                             AS "activeCdAccountsCount",
  ut.total_utilised                                                                    AS "utilisedAmount",
  ROUND(ut.total_utilised * 100.0 / NULLIF(at.total_deposit_balance, 0), 1)           AS "utilisedPercent",
  TO_CHAR(lc.transaction_date, 'DD/MM/YYYY')                                          AS "lastDepositDate",
  lc.transaction_amount                                                                AS "lastDepositAmount",
  lc.bank_name                                                                         AS "lastDepositBank",
  bt.trend_data                                                                        AS "balanceTrendData"
FROM account_totals at
CROSS JOIN utilisation ut
LEFT JOIN last_credit lc ON true
LEFT JOIN balance_trend bt ON true$Q$
--   WHERE id = 44;

WITH allowed_cd AS (
  SELECT DISTINCT cd.id
  FROM caution_deposit cd
  WHERE cd.company_id = ###companyId###
    AND cd.status = 'ACTIVE'
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR EXISTS (
        SELECT 1
        FROM caution_deposit_policy_mapping cdpm2
        INNER JOIN policy_enrollment_employee_policy_map peepm_f
          ON peepm_f.policy_id = cdpm2.policy_id AND peepm_f.deleted_at IS NULL
        INNER JOIN policy_enrollment_employee pee_f
          ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
        WHERE cdpm2.caution_deposit_id = cd.id
          AND pee_f.policy_config_location_id = ANY(
            SELECT val::INTEGER FROM regexp_split_to_table(
              NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
            ) AS val WHERE val ~ '^\d+$'
          )
      )
    )
    AND (###externalHrUserId### IS NULL
         OR EXISTS (
           SELECT 1
           FROM caution_deposit_policy_mapping cdpm
           WHERE cdpm.caution_deposit_id = cd.id
             AND cdpm.policy_id IN (
               SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER
             )
         ))
),
account_totals AS (
  SELECT
    COUNT(DISTINCT cd.id)              AS active_accounts_count,
    COALESCE(SUM(cd.balance_amount), 0) AS total_deposit_balance
  FROM caution_deposit cd
  INNER JOIN allowed_cd ac ON ac.id = cd.id
),
utilisation AS (
  SELECT COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) AS total_utilised
  FROM caution_deposit_transaction cdt
  INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
),
last_credit AS (
  SELECT cdt.transaction_date, cdt.transaction_amount, cdt.bank_name
  FROM caution_deposit_transaction cdt
  INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
  WHERE cdt.transaction_type = 'CREDIT_TRANSACTION'
  ORDER BY cdt.transaction_date DESC LIMIT 1
),
balance_trend AS (
  SELECT json_agg(monthly_balance ORDER BY month_start) AS trend_data
  FROM (
    SELECT
      date_trunc('month', cdt.transaction_date) AS month_start,
      SUM(CASE WHEN cdt.transaction_type='CREDIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END)
      - SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION'  THEN cdt.transaction_amount ELSE 0 END) AS monthly_balance
    FROM caution_deposit_transaction cdt
    INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
    WHERE cdt.transaction_date >= date_trunc('month', NOW() - INTERVAL '5 months')
    GROUP BY date_trunc('month', cdt.transaction_date)
    ORDER BY month_start LIMIT 6
  ) t
)
SELECT
  at.total_deposit_balance                                                             AS "totalDepositBalance",
  at.active_accounts_count                                                             AS "activeCdAccountsCount",
  ut.total_utilised                                                                    AS "utilisedAmount",
  ROUND(ut.total_utilised * 100.0 / NULLIF(at.total_deposit_balance, 0), 1)           AS "utilisedPercent",
  TO_CHAR(lc.transaction_date, 'DD/MM/YYYY')                                          AS "lastDepositDate",
  lc.transaction_amount                                                                AS "lastDepositAmount",
  lc.bank_name                                                                         AS "lastDepositBank",
  bt.trend_data                                                                        AS "balanceTrendData"
FROM account_totals at
CROSS JOIN utilisation ut
LEFT JOIN last_credit lc ON true
LEFT JOIN balance_trend bt ON true

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 44)
-- ------------------------------------------------------------------
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : locationIds
--   token in query : ###locationIds###
--   data_type      : (none)
--   input_field    : (none -- likely unusable from the UI)
--   >>> STUB parameter row -- no type/label configured, this filter cannot be used from the generic screen.
--
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
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 44)
-- ------------------------------------------------------------------
--   totalDepositBalance          -> Total Deposit Balance          (variable: totalDepositBalance, type: number, align: right)
--   activeCdAccountsCount        -> Active CD Accounts Count       (variable: activeCdAccountsCount, type: number, align: right)
--   utilisedAmount               -> Utilised Amount                (variable: utilisedAmount, type: number, align: right)
--   utilisedPercent              -> Utilised Percent               (variable: utilisedPercent, type: number, align: right)
--   lastDepositDate              -> Last Deposit Date              (variable: lastDepositDate, type: string, align: left)
--   lastDepositAmount            -> Last Deposit Amount            (variable: lastDepositAmount, type: number, align: right)
--   lastDepositBank              -> Last Deposit Bank              (variable: lastDepositBank, type: string, align: left)
--   balanceTrendData             -> Balance Trend Data             (variable: balanceTrendData, type: string, align: left)

