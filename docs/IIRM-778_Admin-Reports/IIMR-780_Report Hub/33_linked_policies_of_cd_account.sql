-- ============================================================================
-- Report: Linked Policies of CD Account
-- name (used in URL/endpoint): linked_policies_of_cd_account    |    id: 33    |    order_no: 30
-- end_point: linked_policies_of_cd_account
-- created_at: 2026-05-08 12:06:45.937996    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 33)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH input_cd_accounts AS (
  SELECT DISTINCT cdpm.caution_deposit_id
  FROM caution_deposit_policy_mapping cdpm
  INNER JOIN caution_deposit cd ON cd.id = cdpm.caution_deposit_id
  WHERE cdpm.policy_id = ###policyId### AND cd.company_id = ###companyId###
),
linked_policy_ids AS (
  SELECT DISTINCT cdpm.policy_id
  FROM caution_deposit_policy_mapping cdpm
  INNER JOIN input_cd_accounts ica ON ica.caution_deposit_id = cdpm.caution_deposit_id
),
employee_counts AS (
  SELECT policy_id, COUNT(DISTINCT employee_id) AS employee_count
  FROM policy_enrollment_employee_policy_map WHERE deleted_at IS NULL GROUP BY policy_id
),
dependent_counts AS (
  SELECT policy_id, COUNT(id) AS dependent_count
  FROM policy_enrollment_dependent WHERE deleted_at IS NULL GROUP BY policy_id
)
SELECT
  p.id                                                                       AS "policyId",
  p.policy_name                                                              AS "policyName",
  ld.lookup_key                                                              AS "policyTypeKey",
  COALESCE(p.insurer_policy_number, '')                                     AS "policyNumber",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                                     AS "periodStart",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                                     AS "periodEnd",
  COALESCE(p.net_premium, 0)                                                AS "netPremium",
  COALESCE(ec.employee_count,0) + COALESCE(dc.dependent_count,0)           AS "totalLives"
FROM linked_policy_ids lpi
INNER JOIN policy      p  ON p.id  = lpi.policy_id AND p.company_id = ###companyId###
INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN  employee_counts  ec ON ec.policy_id = p.id
LEFT JOIN  dependent_counts dc ON dc.policy_id = p.id
AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
ORDER BY p.policy_name$Q$
--   WHERE id = 33;

WITH input_cd_accounts AS (
  SELECT DISTINCT cdpm.caution_deposit_id
  FROM caution_deposit_policy_mapping cdpm
  INNER JOIN caution_deposit cd ON cd.id = cdpm.caution_deposit_id
  WHERE cdpm.policy_id = ###policyId### AND cd.company_id = ###companyId###
),
linked_policy_ids AS (
  SELECT DISTINCT cdpm.policy_id
  FROM caution_deposit_policy_mapping cdpm
  INNER JOIN input_cd_accounts ica ON ica.caution_deposit_id = cdpm.caution_deposit_id
),
employee_counts AS (
  SELECT policy_id, COUNT(DISTINCT employee_id) AS employee_count
  FROM policy_enrollment_employee_policy_map WHERE deleted_at IS NULL GROUP BY policy_id
),
dependent_counts AS (
  SELECT policy_id, COUNT(id) AS dependent_count
  FROM policy_enrollment_dependent WHERE deleted_at IS NULL GROUP BY policy_id
)
SELECT
  p.id                                                                       AS "policyId",
  p.policy_name                                                              AS "policyName",
  ld.lookup_key                                                              AS "policyTypeKey",
  COALESCE(p.insurer_policy_number, '')                                     AS "policyNumber",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                                     AS "periodStart",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                                     AS "periodEnd",
  COALESCE(p.net_premium, 0)                                                AS "netPremium",
  COALESCE(ec.employee_count,0) + COALESCE(dc.dependent_count,0)           AS "totalLives"
FROM linked_policy_ids lpi
INNER JOIN policy      p  ON p.id  = lpi.policy_id AND p.company_id = ###companyId###
INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN  employee_counts  ec ON ec.policy_id = p.id
LEFT JOIN  dependent_counts dc ON dc.policy_id = p.id
AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
ORDER BY p.policy_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 33)
-- ------------------------------------------------------------------
-- Filter: Policy ID
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 2
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 33)
-- ------------------------------------------------------------------
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   policyName                   -> Policy Name                    (variable: policyName, type: string, align: left)
--   policyTypeKey                -> Policy Type                    (variable: policyTypeKey, type: string, align: left)
--   policyNumber                 -> Policy Number                  (variable: policyNumber, type: string, align: left)
--   periodStart                  -> Period Start                   (variable: periodStart, type: string, align: left)
--   periodEnd                    -> Period End                     (variable: periodEnd, type: string, align: left)
--   netPremium                   -> Net Premium                    (variable: netPremium, type: number, align: right)
--   totalLives                   -> Total Lives                    (variable: totalLives, type: number, align: right)

