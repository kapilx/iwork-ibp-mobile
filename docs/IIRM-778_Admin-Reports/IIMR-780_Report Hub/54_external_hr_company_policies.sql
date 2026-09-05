-- ============================================================================
-- Report: External HR – Company Policies
-- name (used in URL/endpoint): external_hr_company_policies    |    id: 54    |    order_no: 100
-- end_point: external_hr_company_policies
-- created_at: 2026-05-13 12:11:21.843585    updated_at: 2026-06-01 19:06:18.465929
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
-- 1. MAIN QUERY  (admin_reports.query, id = 54)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  ap.id,
  ap.policy_name        AS name,
  ap.insurer_policy_number AS "policyNumber",
  TO_CHAR(ap.policy_from, 'DD Mon YYYY') AS "policyFrom",
  TO_CHAR(ap.policy_to,   'DD Mon YYYY') AS "policyTo",
  COALESCE(
    (SELECT i.display_name
     FROM policy_insurer_map pim
     JOIN insurer i ON i.id = pim.insurer_id
     WHERE pim.policy_id = ap.id
     ORDER BY pim.share_percentage DESC NULLS LAST, pim.id
     LIMIT 1),
    '—'
  ) AS "insurerName"
FROM policy ap
WHERE ap.company_id = ###companyId###
  AND (
    ap.is_installment_policy IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM lookup_data inst_ld
      WHERE inst_ld.id = ap.is_installment_policy
        AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES'
        AND inst_ld.deleted_at IS NULL
    )
  )
ORDER BY ap.policy_name ASC$Q$
--   WHERE id = 54;

SELECT
  ap.id,
  ap.policy_name        AS name,
  ap.insurer_policy_number AS "policyNumber",
  TO_CHAR(ap.policy_from, 'DD Mon YYYY') AS "policyFrom",
  TO_CHAR(ap.policy_to,   'DD Mon YYYY') AS "policyTo",
  COALESCE(
    (SELECT i.display_name
     FROM policy_insurer_map pim
     JOIN insurer i ON i.id = pim.insurer_id
     WHERE pim.policy_id = ap.id
     ORDER BY pim.share_percentage DESC NULLS LAST, pim.id
     LIMIT 1),
    '—'
  ) AS "insurerName"
FROM policy ap
WHERE ap.company_id = ###companyId###
  AND (
    ap.is_installment_policy IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM lookup_data inst_ld
      WHERE inst_ld.id = ap.is_installment_policy
        AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES'
        AND inst_ld.deleted_at IS NULL
    )
  )
ORDER BY ap.policy_name ASC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 54)
-- ------------------------------------------------------------------
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 54)
-- ------------------------------------------------------------------
--   id                           -> ID                             (variable: id, type: number, align: right)
--   name                         -> Policy Name                    (variable: name, type: string, align: left)

