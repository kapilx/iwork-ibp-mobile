-- ============================================================================
-- Report: HR Support Tickets
-- name (used in URL/endpoint): hr_support_tickets    |    id: 17    |    order_no: 104
-- end_point: hr_support_tickets
-- created_at: 2026-05-22 08:16:27.944702    updated_at: 2026-05-22 08:16:27.944702
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
-- 1. MAIN QUERY  (admin_reports.query, id = 17)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  rt.id,
  rt.ticket_id                                         AS "ticketId",
  rt.employee_id                                       AS "employeeId",
  COALESCE(emp.full_name, emp.employee_name)           AS "employeeName",
  emp.email_enc                                        AS "employeeEmail",
  emp.designation                                      AS "designation",
  rt.category,
  rt.status,
  rt.priority,
  rt.mail_id                                           AS "mailId",
  LEFT(rt.escalation_description, 120)                 AS "descriptionPreview",
  rt.escalation_description                            AS "description",
  rt.created_at                                        AS "createdAt",
  rt.document_ids                                      AS "documentIds",
  CASE
    WHEN rt.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = rt.created_by AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
      THEN 'CRM'
    WHEN rt.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = rt.created_by AND h.deleted_at IS NULL)
      THEN 'HR'
    WHEN rt.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = rt.mail_id AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
      THEN 'CRM'
    WHEN rt.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = rt.mail_id AND h.deleted_at IS NULL)
      THEN 'HR'
    WHEN EXISTS (SELECT 1 FROM policy_enrollment_employee pe WHERE pe.user_id = rt.created_by)
      THEN 'EMPLOYEE'
    ELSE 'EMPLOYEE'
  END                                                  AS "raisedBy"
FROM raise_ticket rt
INNER JOIN policy_enrollment_employee emp
  ON emp.id = rt.employee_id
WHERE emp.company_id = ###companyId###
  AND (NULLIF(###status###, '')   IS NULL OR rt.status   = ###status###)
  AND (NULLIF(###category###, '') IS NULL OR rt.category = ###category###)
  AND (NULLIF(###search###, '')   IS NULL
       OR emp.employee_name         ILIKE '%' || ###search### || '%'
       OR emp.full_name             ILIKE '%' || ###search### || '%'
       OR rt.ticket_id              ILIKE '%' || ###search### || '%'
       OR rt.escalation_description ILIKE '%' || ###search### || '%')
  AND (NULLIF(###raisedBy###, '') IS NULL OR
    CASE
      WHEN rt.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = rt.created_by AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
        THEN 'CRM'
      WHEN rt.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = rt.created_by AND h.deleted_at IS NULL)
        THEN 'HR'
      WHEN rt.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = rt.mail_id AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
        THEN 'CRM'
      WHEN rt.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = rt.mail_id AND h.deleted_at IS NULL)
        THEN 'HR'
      ELSE 'EMPLOYEE'
    END = ###raisedBy###
  )
ORDER BY rt.created_at DESC$Q$
--   WHERE id = 17;

SELECT
  rt.id,
  rt.ticket_id                                         AS "ticketId",
  rt.employee_id                                       AS "employeeId",
  COALESCE(emp.full_name, emp.employee_name)           AS "employeeName",
  emp.email_enc                                        AS "employeeEmail",
  emp.designation                                      AS "designation",
  rt.category,
  rt.status,
  rt.priority,
  rt.mail_id                                           AS "mailId",
  LEFT(rt.escalation_description, 120)                 AS "descriptionPreview",
  rt.escalation_description                            AS "description",
  rt.created_at                                        AS "createdAt",
  rt.document_ids                                      AS "documentIds",
  CASE
    WHEN rt.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = rt.created_by AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
      THEN 'CRM'
    WHEN rt.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = rt.created_by AND h.deleted_at IS NULL)
      THEN 'HR'
    WHEN rt.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = rt.mail_id AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
      THEN 'CRM'
    WHEN rt.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = rt.mail_id AND h.deleted_at IS NULL)
      THEN 'HR'
    WHEN EXISTS (SELECT 1 FROM policy_enrollment_employee pe WHERE pe.user_id = rt.created_by)
      THEN 'EMPLOYEE'
    ELSE 'EMPLOYEE'
  END                                                  AS "raisedBy"
FROM raise_ticket rt
INNER JOIN policy_enrollment_employee emp
  ON emp.id = rt.employee_id
WHERE emp.company_id = ###companyId###
  AND (NULLIF(###status###, '')   IS NULL OR rt.status   = ###status###)
  AND (NULLIF(###category###, '') IS NULL OR rt.category = ###category###)
  AND (NULLIF(###search###, '')   IS NULL
       OR emp.employee_name         ILIKE '%' || ###search### || '%'
       OR emp.full_name             ILIKE '%' || ###search### || '%'
       OR rt.ticket_id              ILIKE '%' || ###search### || '%'
       OR rt.escalation_description ILIKE '%' || ###search### || '%')
  AND (NULLIF(###raisedBy###, '') IS NULL OR
    CASE
      WHEN rt.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = rt.created_by AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
        THEN 'CRM'
      WHEN rt.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = rt.created_by AND h.deleted_at IS NULL)
        THEN 'HR'
      WHEN rt.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = rt.mail_id AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
        THEN 'CRM'
      WHEN rt.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = rt.mail_id AND h.deleted_at IS NULL)
        THEN 'HR'
      ELSE 'EMPLOYEE'
    END = ###raisedBy###
  )
ORDER BY rt.created_at DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 17)
-- ------------------------------------------------------------------
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Status
--   parameter_name : status
--   token in query : ###status###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: Category
--   parameter_name : category
--   token in query : ###category###
--   data_type      : string
--   input_field    : input
--   order_no       : 3
--
-- Filter: Search Text
--   parameter_name : search
--   token in query : ###search###
--   data_type      : string
--   input_field    : input
--   order_no       : 4
--
-- Filter: Raised By
--   parameter_name : raisedBy
--   token in query : ###raisedBy###
--   data_type      : string
--   input_field    : input
--   order_no       : 5
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 17)
-- ------------------------------------------------------------------
--   id                           -> ID                             (variable: id, type: number, align: right)
--   ticketId                     -> Ticket ID                      (variable: ticketId, type: string, align: left)
--   employeeId                   -> Employee ID                    (variable: employeeId, type: number, align: right)
--   employeeName                 -> Employee Name                  (variable: employeeName, type: string, align: left)
--   employeeEmail                -> Employee Email                 (variable: employeeEmail, type: string, align: left)
--   designation                  -> Department                     (variable: designation, type: string, align: left)
--   category                     -> Category                       (variable: category, type: string, align: left)
--   status                       -> Status                         (variable: status, type: string, align: left)
--   priority                     -> Priority                       (variable: priority, type: string, align: left)
--   mailId                       -> Mail ID                        (variable: mailId, type: string, align: left)
--   descriptionPreview           -> Description Preview            (variable: descriptionPreview, type: string, align: left)
--   description                  -> Description                    (variable: description, type: string, align: left)
--   createdAt                    -> Raised At                      (variable: createdAt, type: string, align: left)
--   documentIds                  -> Document IDs                   (variable: documentIds, type: string, align: left)
--   raisedBy                     -> Raised By                      (variable: raisedBy, type: string, align: left)

