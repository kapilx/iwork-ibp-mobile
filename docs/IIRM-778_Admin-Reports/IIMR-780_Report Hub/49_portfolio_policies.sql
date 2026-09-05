-- ============================================================================
-- Report: Portfolio Policies
-- name (used in URL/endpoint): portfolio_policies    |    id: 49    |    order_no: 22
-- end_point: portfolio_policies
-- created_at: 2026-05-08 12:12:57.608283    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 49)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
)
SELECT
  p.id                                                      AS "policyId",
  p.company_id                                              AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                        AS "policyTypeCode",
  ld.value                                                  AS "policyTypeName",
  pi.insurer_name                                           AS "insurerName",
  p.insurer_policy_number                                   AS "policyNumber",
  p.net_premium                                             AS "premiumAmount",
  TO_CHAR(p.policy_from, 'DD/MM/YYYY')                     AS "startDate",
  TO_CHAR(p.policy_to,   'DD/MM/YYYY')                     AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                        THEN 'Expired'
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL '60 days'   THEN 'Renewal Due'
    ELSE 'Active'
  END                                                       AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi ON pi.policy_id = p.id
WHERE p.company_id IN (
  SELECT id FROM company
  WHERE deleted_at IS NULL
    AND id NOT IN (SELECT DISTINCT group_company_id FROM group_company_map)
)
AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
ORDER BY p.company_id, p.policy_from DESC$Q$
--   WHERE id = 49;

WITH policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
)
SELECT
  p.id                                                      AS "policyId",
  p.company_id                                              AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                        AS "policyTypeCode",
  ld.value                                                  AS "policyTypeName",
  pi.insurer_name                                           AS "insurerName",
  p.insurer_policy_number                                   AS "policyNumber",
  p.net_premium                                             AS "premiumAmount",
  TO_CHAR(p.policy_from, 'DD/MM/YYYY')                     AS "startDate",
  TO_CHAR(p.policy_to,   'DD/MM/YYYY')                     AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                        THEN 'Expired'
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL '60 days'   THEN 'Renewal Due'
    ELSE 'Active'
  END                                                       AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi ON pi.policy_id = p.id
WHERE p.company_id IN (
  SELECT id FROM company
  WHERE deleted_at IS NULL
    AND id NOT IN (SELECT DISTINCT group_company_id FROM group_company_map)
)
AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
ORDER BY p.company_id, p.policy_from DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 49)
-- ------------------------------------------------------------------
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 49)
-- ------------------------------------------------------------------
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   companyId                    -> Company ID                     (variable: companyId, type: number, align: right)
--   policyTypeCode               -> Type Code                      (variable: policyTypeCode, type: string, align: left)
--   policyTypeName               -> Policy Type                    (variable: policyTypeName, type: string, align: left)
--   insurerName                  -> Insurer                        (variable: insurerName, type: string, align: left)
--   policyNumber                 -> Policy No.                     (variable: policyNumber, type: string, align: left)
--   premiumAmount                -> Premium                        (variable: premiumAmount, type: number, align: right)
--   startDate                    -> Start Date                     (variable: startDate, type: string, align: left)
--   endDate                      -> End Date                       (variable: endDate, type: string, align: left)
--   policyStatus                 -> Status                         (variable: policyStatus, type: string, align: left)

