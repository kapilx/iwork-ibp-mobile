-- ============================================================================
-- Report: CD Account Details
-- name (used in URL/endpoint): cd_account_details    |    id: 45    |    order_no: 11
-- end_point: cd_account_details
-- created_at: 2026-05-08 12:10:03.360642    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 45)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  cd.id                                                                               AS "cdAccountId",
  cd.cd_account_number                                                                AS "cdAccountNumber",
  cd.cd_account_name                                                                  AS "cdAccountName",
  p.insurer_policy_number                                                             AS "policyNumber",
  p.id                                                                                AS "policyId",
  COALESCE(cd.balance_amount, 0)                                                      AS "depositBalance",
  COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) AS "utilisedAmount",
  ROUND(COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) * 100.0 / NULLIF(cd.balance_amount, 0), 1) AS "utilisationPercent",
  TO_CHAR(cd.updated_at, 'DD/MM/YYYY')                                                AS "lastUpdated"
FROM caution_deposit cd
INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
INNER JOIN policy p ON p.id = cdpm.policy_id
LEFT JOIN caution_deposit_transaction cdt ON cdt.caution_deposit_id = cd.id
WHERE cd.company_id = ###companyId###
  AND cd.status = 'ACTIVE'
  AND (###search### = '' OR cd.cd_account_name ILIKE '%' || ###search### || '%' OR p.insurer_policy_number ILIKE '%' || ###search### || '%')
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.policy_id = p.id
        AND peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
GROUP BY cd.id, cd.cd_account_number, cd.cd_account_name, cd.balance_amount, cd.updated_at, p.insurer_policy_number, p.id
ORDER BY "utilisationPercent" DESC NULLS LAST$Q$
--   WHERE id = 45;

SELECT
  cd.id                                                                               AS "cdAccountId",
  cd.cd_account_number                                                                AS "cdAccountNumber",
  cd.cd_account_name                                                                  AS "cdAccountName",
  p.insurer_policy_number                                                             AS "policyNumber",
  p.id                                                                                AS "policyId",
  COALESCE(cd.balance_amount, 0)                                                      AS "depositBalance",
  COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) AS "utilisedAmount",
  ROUND(COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) * 100.0 / NULLIF(cd.balance_amount, 0), 1) AS "utilisationPercent",
  TO_CHAR(cd.updated_at, 'DD/MM/YYYY')                                                AS "lastUpdated"
FROM caution_deposit cd
INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
INNER JOIN policy p ON p.id = cdpm.policy_id
LEFT JOIN caution_deposit_transaction cdt ON cdt.caution_deposit_id = cd.id
WHERE cd.company_id = ###companyId###
  AND cd.status = 'ACTIVE'
  AND (###search### = '' OR cd.cd_account_name ILIKE '%' || ###search### || '%' OR p.insurer_policy_number ILIKE '%' || ###search### || '%')
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.policy_id = p.id
        AND peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
GROUP BY cd.id, cd.cd_account_number, cd.cd_account_name, cd.balance_amount, cd.updated_at, p.insurer_policy_number, p.id
ORDER BY "utilisationPercent" DESC NULLS LAST

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 45)
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
-- Filter: Search
--   parameter_name : search
--   token in query : ###search###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 45)
-- ------------------------------------------------------------------
--   cdAccountId                  -> CD Account ID                  (variable: cdAccountId, type: number, align: right)
--   cdAccountNumber              -> CD Account Number              (variable: cdAccountNumber, type: string, align: left)
--   cdAccountName                -> CD Account Name                (variable: cdAccountName, type: string, align: left)
--   policyNumber                 -> Policy Number                  (variable: policyNumber, type: string, align: left)
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   depositBalance               -> Deposit Balance                (variable: depositBalance, type: number, align: right)
--   utilisedAmount               -> Utilised Amount                (variable: utilisedAmount, type: number, align: right)
--   utilisationPercent           -> Utilisation Percent            (variable: utilisationPercent, type: number, align: right)
--   lastUpdated                  -> Last Updated                   (variable: lastUpdated, type: string, align: left)

