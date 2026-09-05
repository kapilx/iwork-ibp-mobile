-- ============================================================================
-- Report: External HR – User List
-- name (used in URL/endpoint): external_hr_user_list    |    id: 56    |    order_no: 102
-- end_point: external_hr_user_list
-- created_at: 2026-05-13 12:11:21.843585    updated_at: 2026-05-13 12:11:21.843585
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
-- 1. MAIN QUERY  (admin_reports.query, id = 56)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  hum.id                              AS "hrManagementId",
  hum.user_id                         AS "userId",
  hum.user_name                       AS "fullName",
  hum.email_id                        AS "email",
  hum.role_key                        AS "roleKey",
  hum.company_name                    AS "companyName",
  hum.company_id                      AS "companyId",
  COUNT(DISTINCT epm.policy_id)       AS "policyCount",
  hum.created_at                      AS "createdAt"
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map epm ON epm.hr_management_id = hum.id
WHERE hum.role_key = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND (###companyId### = '' OR hum.company_id::text = ###companyId###)
  AND (###search### = ''
       OR hum.user_name ILIKE '%' || ###search### || '%'
       OR hum.email_id  ILIKE '%' || ###search### || '%')
GROUP BY hum.id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_name, hum.company_id, hum.created_at
ORDER BY hum.created_at DESC$Q$
--   WHERE id = 56;

SELECT
  hum.id                              AS "hrManagementId",
  hum.user_id                         AS "userId",
  hum.user_name                       AS "fullName",
  hum.email_id                        AS "email",
  hum.role_key                        AS "roleKey",
  hum.company_name                    AS "companyName",
  hum.company_id                      AS "companyId",
  COUNT(DISTINCT epm.policy_id)       AS "policyCount",
  hum.created_at                      AS "createdAt"
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map epm ON epm.hr_management_id = hum.id
WHERE hum.role_key = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND (###companyId### = '' OR hum.company_id::text = ###companyId###)
  AND (###search### = ''
       OR hum.user_name ILIKE '%' || ###search### || '%'
       OR hum.email_id  ILIKE '%' || ###search### || '%')
GROUP BY hum.id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_name, hum.company_id, hum.created_at
ORDER BY hum.created_at DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 56)
-- ------------------------------------------------------------------
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

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 56)
-- ------------------------------------------------------------------
--   hr_management_id             -> HR Management ID               (variable: hrManagementId, type: number, align: right)
--   user_id                      -> User ID                        (variable: userId, type: number, align: right)
--   full_name                    -> Full Name                      (variable: fullName, type: string, align: left)
--   email                        -> Email                          (variable: email, type: string, align: left)
--   role_key                     -> Role Key                       (variable: roleKey, type: string, align: left)
--   company_name                 -> Company Name                   (variable: companyName, type: string, align: left)
--   company_id                   -> Company ID                     (variable: companyId, type: number, align: right)
--   policy_count                 -> Policy Count                   (variable: policyCount, type: number, align: right)
--   created_at                   -> Created At                     (variable: createdAt, type: string, align: left)

