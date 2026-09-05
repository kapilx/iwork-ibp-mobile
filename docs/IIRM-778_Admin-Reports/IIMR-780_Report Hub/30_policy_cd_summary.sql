-- ============================================================================
-- Report: Policy CD Summary
-- name (used in URL/endpoint): policy_cd_summary    |    id: 30    |    order_no: 29
-- end_point: policy_cd_summary
-- created_at: 2026-05-08 12:05:38.20827    updated_at: 2026-05-20 12:07:53.342668
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
-- 1. MAIN QUERY  (admin_reports.query, id = 30)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH policy_lives AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id)                    AS employee_count,
    (SELECT COUNT(ped.id)
     FROM policy_enrollment_dependent ped
     WHERE ped.policy_id = peepm.policy_id
       AND ped.deleted_at IS NULL)                        AS dependent_count
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
    AND peepm.policy_id = ###policyId###
  GROUP BY peepm.policy_id
),
policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount,
    MAX(cd.cd_safe_limit)                 AS cd_safe_limit
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = 'DEBIT_TRANSACTION'
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  GROUP BY cdpm.policy_id
),
policy_cd_account AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cd.cd_account_number
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  ORDER BY cdpm.policy_id, cd.id
),
policy_cd_running_balance AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cdt.cd_balance_amount::numeric AS running_balance
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  ORDER BY cdpm.policy_id, cdt.transaction_date DESC NULLS LAST, cdt.id DESC
),
policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
)
SELECT
  p.id                                                                                     AS "policyId",
  p.policy_name                                                                            AS "policyName",
  COALESCE(p.net_premium, 0)                                                              AS "netPremium",
  COALESCE(pcd.available_amount, 0)                                                       AS "cdBalance",
  COALESCE(pcd.used_amount, 0)                                                            AS "cdUsedAmount",
  COALESCE(pcd.used_amount, 0)                                                            AS "usedAmount",
  COALESCE(pcrb.running_balance, pcd.available_amount, 0)                                 AS "cdRunningBalance",
  pca.cd_account_number                                                                    AS "cdAccountNumber",
  COALESCE(pl.employee_count, 0) + COALESCE(pl.dependent_count, 0)                       AS "totalLives",
  COALESCE(pl.employee_count, 0)                                                          AS "employeeCount",
  ROUND(COALESCE(p.net_premium, 0) * COALESCE(pcd.cd_safe_limit, 10) / 100.0, 2)         AS "safeLimit",
  ROUND(
    COALESCE(pcd.used_amount, 0) * 100.0
    / NULLIF(COALESCE(pcd.available_amount, 0) + COALESCE(pcd.used_amount, 0), 0),
    1
  )                                                                                        AS "usedPercent",
  COALESCE(pi.insurer_name, '—')                                                         AS "insurer",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                                                   AS "periodStart",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                                                   AS "periodEnd"
FROM policy p
LEFT JOIN policy_lives              pl   ON pl.policy_id   = p.id
LEFT JOIN policy_cd                 pcd  ON pcd.policy_id  = p.id
LEFT JOIN policy_cd_running_balance pcrb ON pcrb.policy_id = p.id
LEFT JOIN policy_cd_account         pca  ON pca.policy_id  = p.id
LEFT JOIN policy_insurer            pi   ON pi.policy_id   = p.id
WHERE p.id = ###policyId###
  AND p.company_id = ###companyId###$Q$
--   WHERE id = 30;

WITH policy_lives AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id)                    AS employee_count,
    (SELECT COUNT(ped.id)
     FROM policy_enrollment_dependent ped
     WHERE ped.policy_id = peepm.policy_id
       AND ped.deleted_at IS NULL)                        AS dependent_count
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
    AND peepm.policy_id = ###policyId###
  GROUP BY peepm.policy_id
),
policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount,
    MAX(cd.cd_safe_limit)                 AS cd_safe_limit
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = 'DEBIT_TRANSACTION'
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  GROUP BY cdpm.policy_id
),
policy_cd_account AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cd.cd_account_number
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  ORDER BY cdpm.policy_id, cd.id
),
policy_cd_running_balance AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cdt.cd_balance_amount::numeric AS running_balance
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  ORDER BY cdpm.policy_id, cdt.transaction_date DESC NULLS LAST, cdt.id DESC
),
policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
)
SELECT
  p.id                                                                                     AS "policyId",
  p.policy_name                                                                            AS "policyName",
  COALESCE(p.net_premium, 0)                                                              AS "netPremium",
  COALESCE(pcd.available_amount, 0)                                                       AS "cdBalance",
  COALESCE(pcd.used_amount, 0)                                                            AS "cdUsedAmount",
  COALESCE(pcd.used_amount, 0)                                                            AS "usedAmount",
  COALESCE(pcrb.running_balance, pcd.available_amount, 0)                                 AS "cdRunningBalance",
  pca.cd_account_number                                                                    AS "cdAccountNumber",
  COALESCE(pl.employee_count, 0) + COALESCE(pl.dependent_count, 0)                       AS "totalLives",
  COALESCE(pl.employee_count, 0)                                                          AS "employeeCount",
  ROUND(COALESCE(p.net_premium, 0) * COALESCE(pcd.cd_safe_limit, 10) / 100.0, 2)         AS "safeLimit",
  ROUND(
    COALESCE(pcd.used_amount, 0) * 100.0
    / NULLIF(COALESCE(pcd.available_amount, 0) + COALESCE(pcd.used_amount, 0), 0),
    1
  )                                                                                        AS "usedPercent",
  COALESCE(pi.insurer_name, '—')                                                         AS "insurer",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                                                   AS "periodStart",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                                                   AS "periodEnd"
FROM policy p
LEFT JOIN policy_lives              pl   ON pl.policy_id   = p.id
LEFT JOIN policy_cd                 pcd  ON pcd.policy_id  = p.id
LEFT JOIN policy_cd_running_balance pcrb ON pcrb.policy_id = p.id
LEFT JOIN policy_cd_account         pca  ON pca.policy_id  = p.id
LEFT JOIN policy_insurer            pi   ON pi.policy_id   = p.id
WHERE p.id = ###policyId###
  AND p.company_id = ###companyId###

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 30)
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
--   data_type      : number
--   input_field    : input
--   order_no       : 2
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 30)
-- ------------------------------------------------------------------
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   policyName                   -> Policy Name                    (variable: policyName, type: string, align: left)
--   netPremium                   -> Net Premium                    (variable: netPremium, type: number, align: right)
--   cdBalance                    -> CD Balance                     (variable: cdBalance, type: number, align: right)
--   safeLimit                    -> Safe Limit (5%)                (variable: safeLimit, type: number, align: right)
--   usedPercent                  -> Used (%)                       (variable: usedPercent, type: number, align: right)
--   usedAmount                   -> Used Amount                    (variable: usedAmount, type: number, align: right)
--   insurer                      -> Insurer                        (variable: insurer, type: string, align: left)
--   periodStart                  -> Period Start                   (variable: periodStart, type: string, align: left)
--   periodEnd                    -> Period End                     (variable: periodEnd, type: string, align: left)

