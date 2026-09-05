-- ============================================================
-- Seed Script — hr_support_tickets (first-time / clean DB)
-- ============================================================

-- ─── 1. Clean up old raised_by column (if previously run) ───
ALTER TABLE raise_ticket DROP COLUMN IF EXISTS raised_by;
DROP TYPE IF EXISTS ticket_source_enum;

-- ─── 2. Add created_by column to raise_ticket ────────────────
ALTER TABLE raise_ticket
  ADD COLUMN IF NOT EXISTS created_by INTEGER DEFAULT NULL;

-- ─── 3. Seed hr_support_tickets admin report (upsert) ───────
DO $$
DECLARE
  report_id INT;
BEGIN

  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'hr_support_tickets',
    'HR Support Tickets',
    'hr_support_tickets',
    $hr_support_tickets$
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
$hr_support_tickets$,
    'SYSTEM',
    'SYSTEM',
    (SELECT COALESCE(MAX(order_no), 0) + 1 FROM admin_reports)
  )
  ON CONFLICT (name) DO UPDATE
    SET query      = EXCLUDED.query,
        label      = EXCLUDED.label,
        end_point  = EXCLUDED.end_point,
        updated_by = 'SYSTEM'
  RETURNING id INTO report_id;

  -- Clean up existing params and mappings before re-inserting
  DELETE FROM admin_reports_results_mappings WHERE admin_report_id = report_id;
  DELETE FROM admin_reports_parameters        WHERE admin_report_id = report_id;

  -- Parameters
  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES
    (report_id, 'companyId', 'Company ID',  '###companyId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 1),
    (report_id, 'status',    'Status',      '###status###',    'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 2),
    (report_id, 'category',  'Category',    '###category###',  'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 3),
    (report_id, 'search',    'Search Text', '###search###',    'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 4),
    (report_id, 'raisedBy',  'Raised By',   '###raisedBy###',  'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 5);

  -- Result mappings
  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'id',                 'id',                 'ID',                  'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'ticketId',           'ticketId',           'Ticket ID',           'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'employeeId',         'employeeId',         'Employee ID',         'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'employeeName',       'employeeName',       'Employee Name',       'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'employeeEmail',      'employeeEmail',      'Employee Email',      'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'designation',        'designation',        'Department',          'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'category',           'category',           'Category',            'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'status',             'status',             'Status',              'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'priority',           'priority',           'Priority',            'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'mailId',             'mailId',             'Mail ID',             'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'descriptionPreview', 'descriptionPreview', 'Description Preview', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'description',        'description',        'Description',         'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'createdAt',          'createdAt',          'Raised At',           'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'documentIds',        'documentIds',        'Document IDs',        'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'raisedBy',           'raisedBy',           'Raised By',           'string', 'SYSTEM', 'SYSTEM', 'left');

  RAISE NOTICE 'hr_support_tickets seeded with report_id = %', report_id;
END $$;
