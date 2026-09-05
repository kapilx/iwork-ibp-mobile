-- ============================================================================
-- Report: External HR – User Detail
-- name (used in URL/endpoint): external_hr_user_detail    |    id: 57    |    order_no: 103
-- end_point: external_hr_user_detail
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
-- 1. MAIN QUERY  (admin_reports.query, id = 57)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  hum.id                              AS "hrManagementId",
  hum.user_id                         AS "userId",
  hum.user_name                       AS "fullName",
  hum.email_id                        AS "email",
  hum.role_key                        AS "roleKey",
  hum.company_id                      AS "companyId",
  hum.company_name                    AS "companyName",
  hum.phone_number                    AS "phoneNumber",
  hum.date_of_birth                   AS "dateOfBirth",
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('policyId', epm.policy_id))
      FILTER (WHERE epm.policy_id IS NOT NULL),
    '[]'
  )                                   AS "policies",
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('addressId', elm.address_id))
      FILTER (WHERE elm.address_id IS NOT NULL),
    '[]'
  )                                   AS "locations"
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map   epm ON epm.hr_management_id = hum.id
LEFT JOIN external_hr_location_map elm ON elm.hr_management_id = hum.id
WHERE hum.role_key   = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND hum.id         = ###userId###
GROUP BY hum.id, hum.user_id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_id, hum.company_name, hum.phone_number, hum.date_of_birth$Q$
--   WHERE id = 57;

SELECT
  hum.id                              AS "hrManagementId",
  hum.user_id                         AS "userId",
  hum.user_name                       AS "fullName",
  hum.email_id                        AS "email",
  hum.role_key                        AS "roleKey",
  hum.company_id                      AS "companyId",
  hum.company_name                    AS "companyName",
  hum.phone_number                    AS "phoneNumber",
  hum.date_of_birth                   AS "dateOfBirth",
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('policyId', epm.policy_id))
      FILTER (WHERE epm.policy_id IS NOT NULL),
    '[]'
  )                                   AS "policies",
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('addressId', elm.address_id))
      FILTER (WHERE elm.address_id IS NOT NULL),
    '[]'
  )                                   AS "locations"
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map   epm ON epm.hr_management_id = hum.id
LEFT JOIN external_hr_location_map elm ON elm.hr_management_id = hum.id
WHERE hum.role_key   = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND hum.id         = ###userId###
GROUP BY hum.id, hum.user_id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_id, hum.company_name, hum.phone_number, hum.date_of_birth

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 57)
-- ------------------------------------------------------------------
-- Filter: User ID
--   parameter_name : userId
--   token in query : ###userId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 57)
-- ------------------------------------------------------------------
--   hr_management_id             -> HR Management ID               (variable: hrManagementId, type: number, align: right)
--   user_id                      -> User ID                        (variable: userId, type: number, align: right)
--   full_name                    -> Full Name                      (variable: fullName, type: string, align: left)
--   email                        -> Email                          (variable: email, type: string, align: left)
--   role_key                     -> Role Key                       (variable: roleKey, type: string, align: left)
--   company_id                   -> Company ID                     (variable: companyId, type: number, align: right)
--   company_name                 -> Company Name                   (variable: companyName, type: string, align: left)
--   policies                     -> Policies                       (variable: policies, type: string, align: left)
--   locations                    -> Locations                      (variable: locations, type: string, align: left)
--   phone_number                 -> Phone                          (variable: phoneNumber, type: string, align: left)
--   date_of_birth                -> Date of Birth                  (variable: dateOfBirth, type: string, align: left)

