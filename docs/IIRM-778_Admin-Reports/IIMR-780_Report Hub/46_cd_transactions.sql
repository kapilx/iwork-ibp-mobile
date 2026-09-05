-- ============================================================================
-- Report: CD Deposit Transactions
-- name (used in URL/endpoint): cd_transactions    |    id: 46    |    order_no: 12
-- end_point: cd_transactions
-- created_at: 2026-05-08 12:10:14.870678    updated_at: 2026-05-29 09:01:34.590637
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
-- 1. MAIN QUERY  (admin_reports.query, id = 46)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  cdt.id                                                                   AS "txnId",
  TO_CHAR(cdt.transaction_date, 'DD/MM/YYYY')                              AS "txnDate",
  CASE
    WHEN cdt.transaction_type = 'CREDIT_TRANSACTION' THEN 'Deposit'
    ELSE 'Deduction'
  END                                                                       AS "txnType",
  CASE
    WHEN cdt.transaction_type = 'CREDIT_TRANSACTION' THEN  cdt.transaction_amount
    ELSE                                                   -cdt.transaction_amount
  END                                                                       AS "amount",
  cd.cd_account_number                                                      AS "cdAccountNumber",
  p.insurer_policy_number                                                   AS "policyNumber",
  cdt.bank_name                                                             AS "bankName",
  COALESCE(NULLIF(TRIM(cdt.cheque_number), ''), cdt.transaction_reference_id) AS "referenceId",
  cdt.cd_balance_amount                                                     AS "runningBalance",
  e.insurer_endorsement_number                                              AS "endorsementNumber",
  e.endorsement_type                                                        AS "endorsementType",
  COALESCE(e.employee_endorsement_addition_count, 0)                        AS "additionCount",
  COALESCE(e.employee_endorsement_deletion_count, 0)                        AS "deletionCount",
  TO_CHAR(cdt.cheque_date, 'DD/MM/YYYY')                                    AS "transactionValueDate",
  TRIM(u.first_name || ' ' || COALESCE(u.last_name, ''))                   AS "createdBy",
  cdt.remarks                                                               AS "remarks",
  cdt.ifsc_code                                                             AS "ifscCode"
FROM caution_deposit_transaction cdt
INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
LEFT JOIN policy p   ON p.id  = cdt.policy_id
LEFT JOIN endorsement e ON e.id = cdt.endorsement_id
LEFT JOIN users u    ON u.id  = cdt.created_by
WHERE cd.company_id = ###companyId###
  AND (###policyId### = '' OR cdt.policy_id::text = ###policyId###)
  AND (###txnType### = '' OR cdt.transaction_type = ###txnType###)
  AND (NULLIF(###startDate###, '') IS NULL OR cdt.transaction_date >= NULLIF(###startDate###, '')::date)
  AND (NULLIF(###endDate###,   '') IS NULL OR cdt.transaction_date <= NULLIF(###endDate###,   '')::date)
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
  AND (###externalHrUserId### IS NULL
       OR cdt.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
ORDER BY cdt.transaction_date DESC, cdt.id DESC$Q$
--   WHERE id = 46;

SELECT
  cdt.id                                                                   AS "txnId",
  TO_CHAR(cdt.transaction_date, 'DD/MM/YYYY')                              AS "txnDate",
  CASE
    WHEN cdt.transaction_type = 'CREDIT_TRANSACTION' THEN 'Deposit'
    ELSE 'Deduction'
  END                                                                       AS "txnType",
  CASE
    WHEN cdt.transaction_type = 'CREDIT_TRANSACTION' THEN  cdt.transaction_amount
    ELSE                                                   -cdt.transaction_amount
  END                                                                       AS "amount",
  cd.cd_account_number                                                      AS "cdAccountNumber",
  p.insurer_policy_number                                                   AS "policyNumber",
  cdt.bank_name                                                             AS "bankName",
  COALESCE(NULLIF(TRIM(cdt.cheque_number), ''), cdt.transaction_reference_id) AS "referenceId",
  cdt.cd_balance_amount                                                     AS "runningBalance",
  e.insurer_endorsement_number                                              AS "endorsementNumber",
  e.endorsement_type                                                        AS "endorsementType",
  COALESCE(e.employee_endorsement_addition_count, 0)                        AS "additionCount",
  COALESCE(e.employee_endorsement_deletion_count, 0)                        AS "deletionCount",
  TO_CHAR(cdt.cheque_date, 'DD/MM/YYYY')                                    AS "transactionValueDate",
  TRIM(u.first_name || ' ' || COALESCE(u.last_name, ''))                   AS "createdBy",
  cdt.remarks                                                               AS "remarks",
  cdt.ifsc_code                                                             AS "ifscCode"
FROM caution_deposit_transaction cdt
INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
LEFT JOIN policy p   ON p.id  = cdt.policy_id
LEFT JOIN endorsement e ON e.id = cdt.endorsement_id
LEFT JOIN users u    ON u.id  = cdt.created_by
WHERE cd.company_id = ###companyId###
  AND (###policyId### = '' OR cdt.policy_id::text = ###policyId###)
  AND (###txnType### = '' OR cdt.transaction_type = ###txnType###)
  AND (NULLIF(###startDate###, '') IS NULL OR cdt.transaction_date >= NULLIF(###startDate###, '')::date)
  AND (NULLIF(###endDate###,   '') IS NULL OR cdt.transaction_date <= NULLIF(###endDate###,   '')::date)
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
  AND (###externalHrUserId### IS NULL
       OR cdt.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
ORDER BY cdt.transaction_date DESC, cdt.id DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 46)
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
-- Filter: Policy ID
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : number
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
-- Filter: Txn Type
--   parameter_name : txnType
--   token in query : ###txnType###
--   data_type      : string
--   input_field    : input
--   order_no       : 5
--
-- Filter: Search
--   parameter_name : search
--   token in query : ###search###
--   data_type      : string
--   input_field    : input
--   order_no       : 6
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 46)
-- ------------------------------------------------------------------
--   txnId                        -> Transaction ID                 (variable: txnId, type: number, align: right)
--   txnDate                      -> Transaction Date               (variable: txnDate, type: string, align: left)
--   txnType                      -> Transaction Type               (variable: txnType, type: string, align: left)
--   amount                       -> Amount                         (variable: amount, type: number, align: right)
--   policyNumber                 -> Policy Number                  (variable: policyNumber, type: string, align: left)
--   bankName                     -> Bank Name                      (variable: bankName, type: string, align: left)
--   referenceId                  -> Reference ID                   (variable: referenceId, type: string, align: left)
--   runningBalance               -> Running Balance                (variable: runningBalance, type: string, align: left)
--   endorsementNumber            -> Endorsement Number             (variable: endorsementNumber, type: string, align: left)
--   endorsementType              -> Endorsement Type               (variable: endorsementType, type: string, align: left)
--   transactionValueDate         -> Transaction Value Date         (variable: transactionValueDate, type: string, align: left)
--   createdBy                    -> Created By                     (variable: createdBy, type: string, align: left)
--   remarks                      -> Remarks                        (variable: remarks, type: string, align: left)
--   ifscCode                     -> IFSC Code                      (variable: ifscCode, type: string, align: left)
--   cdAccountNumber              -> CD Account Number              (variable: cdAccountNumber, type: string, align: left)

