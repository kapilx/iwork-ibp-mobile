-- ============================================================================
-- Report: Employee Login Activity Report
-- name (used in URL/endpoint): employee_login_activity    |    id: 19    |    order_no: 10
-- end_point: employee_login_activity
-- created_at: 2026-06-30 13:32:03.99336    updated_at: 2026-07-02 17:41:44.400407
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
-- 1. MAIN QUERY  (admin_reports.query, id = 19)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
    c.display_name                                         AS "Company name",
    pee.company_employee_id                                AS "Employee Id",
    pee.employee_name                                      AS "Name",
    pee.email                                               AS "Email",
    pee.phone_number                                        AS "Phone number",
    u.login_name                                            AS "login name",
    COUNT(DISTINCT ual.id)                                  AS "Total login count",
    CASE WHEN COUNT(DISTINCT ual.id) > 0 THEN 'Yes' ELSE 'No' END AS "Has logged in",
    TO_CHAR(MAX(ual.action_date), 'DD-MM-YYYY')             AS "Last login"
FROM policy_enrollment_employee_policy_map pepm
INNER JOIN policy_enrollment_employee pee
    ON pee.id = pepm.employee_id
   AND pee.deleted_at IS NULL
LEFT JOIN document_processing_file dpf
    ON dpf.document_id = pepm.enrollment_addition_batch_id
LEFT JOIN users u
    ON u.id = pee.user_id
   AND u.deleted_at IS NULL
LEFT JOIN user_activity_log ual
    ON ual.user_id = pee.user_id
   AND ual.activity_key = 'LOGGED_IN'
LEFT JOIN company c
    ON c.id = pee.company_id
WHERE pepm.deleted_at IS NULL
  AND pee.company_id = ###companyId###
  AND pepm.policy_id = ###policyId###
  AND (
    NULLIF(###enrollmentPeriodId###, '')::int IS NULL
    OR dpf.id = NULLIF(###enrollmentPeriodId###, '')::int
  )
GROUP BY
    pee.id, pee.company_employee_id, pee.employee_name,
    pee.email, pee.phone_number,
    u.login_name, c.display_name
ORDER BY COUNT(DISTINCT ual.id) DESC, pee.employee_name$Q$
--   WHERE id = 19;

SELECT
    c.display_name                                         AS "Company name",
    pee.company_employee_id                                AS "Employee Id",
    pee.employee_name                                      AS "Name",
    pee.email                                               AS "Email",
    pee.phone_number                                        AS "Phone number",
    u.login_name                                            AS "login name",
    COUNT(DISTINCT ual.id)                                  AS "Total login count",
    CASE WHEN COUNT(DISTINCT ual.id) > 0 THEN 'Yes' ELSE 'No' END AS "Has logged in",
    TO_CHAR(MAX(ual.action_date), 'DD-MM-YYYY')             AS "Last login"
FROM policy_enrollment_employee_policy_map pepm
INNER JOIN policy_enrollment_employee pee
    ON pee.id = pepm.employee_id
   AND pee.deleted_at IS NULL
LEFT JOIN document_processing_file dpf
    ON dpf.document_id = pepm.enrollment_addition_batch_id
LEFT JOIN users u
    ON u.id = pee.user_id
   AND u.deleted_at IS NULL
LEFT JOIN user_activity_log ual
    ON ual.user_id = pee.user_id
   AND ual.activity_key = 'LOGGED_IN'
LEFT JOIN company c
    ON c.id = pee.company_id
WHERE pepm.deleted_at IS NULL
  AND pee.company_id = ###companyId###
  AND pepm.policy_id = ###policyId###
  AND (
    NULLIF(###enrollmentPeriodId###, '')::int IS NULL
    OR dpf.id = NULLIF(###enrollmentPeriodId###, '')::int
  )
GROUP BY
    pee.id, pee.company_employee_id, pee.employee_name,
    pee.email, pee.phone_number,
    u.login_name, c.display_name
ORDER BY COUNT(DISTINCT ual.id) DESC, pee.employee_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 19)
-- ------------------------------------------------------------------
-- Filter: Company
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : hidden
--   >>> HIDDEN field -- the generic /report screen cannot render an input for this.
--   order_no       : 1
--
-- Filter: Policy
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : number
--   input_field    : hidden
--   >>> HIDDEN field -- the generic /report screen cannot render an input for this.
--   order_no       : 2
--
-- Filter: Enrollment Period
--   parameter_name : enrollmentPeriodId
--   token in query : ###enrollmentPeriodId###
--   data_type      : number
--   input_field    : hidden
--   >>> HIDDEN field -- the generic /report screen cannot render an input for this.
--   order_no       : 3
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 19)
-- ------------------------------------------------------------------
--   employee_record_id           -> Employee ID                    (variable: employeeRecordId, type: number, align: right)
--   company_employee_id          -> Employee Code                  (variable: companyEmployeeId, type: string, align: left)
--   employee_name                -> Employee Name                  (variable: employeeName, type: string, align: left)
--   employee_email               -> Email                          (variable: employeeEmail, type: string, align: left)
--   employee_phone               -> Phone                          (variable: employeePhone, type: string, align: left)
--   login_name                   -> Login Username                 (variable: loginName, type: string, align: left)
--   user_email                   -> Portal Email                   (variable: userEmail, type: string, align: left)
--   user_mobile                  -> Portal Mobile                  (variable: userMobile, type: string, align: left)
--   login_count                  -> Login Count                    (variable: loginCount, type: number, align: right)
--   has_logged_in                -> Has Logged In                  (variable: hasLoggedIn, type: string, align: left)
--   last_login_date              -> Last Login Date                (variable: lastLoginDate, type: date, align: left)

-- ------------------------------------------------------------------
-- 5. KNOWN ISSUES
-- ------------------------------------------------------------------
-- 1. Both of this report's mandatory filters (companyId, policyId) AND its optional one (enrollmentPeriodId) are configured input_field_type = 'hidden' in admin_reports_parameters (section 2). The generic /report screen has no rendering path for hidden inputs -- this report can never be filtered or run successfully from that screen. It reads like a report meant to be embedded in a specific HR Portal policy page, where these IDs would arrive from page context instead.
-- 2. admin_reports_results_mappings (section 3) expects snake_case columns (employee_record_id, company_employee_id, login_count, has_logged_in, last_login_date, ...) but the live query below returns differently-named, human-readable spaced aliases ('Company name', 'Employee Id', 'Total login count', 'Has logged in', 'Last login'). None of the mappings match any actual output column -- if this report is ever fixed to be reachable, every column would still show a raw fallback header instead of a configured one.

