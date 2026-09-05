-- ============================================================
-- Step 1: Add is_auto_submitted flag to policy_employee_enrollment
-- ============================================================
ALTER TABLE policy_employee_enrollment
  ADD COLUMN IF NOT EXISTS is_auto_submitted BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- Step 2: Backfill — mark all previously auto-submitted enrollments
-- Source: user_activity_log stores isAutoSubmit=true in metadata
-- when the cron sends confirmation emails
-- ============================================================
UPDATE policy_employee_enrollment pee
SET is_auto_submitted = TRUE
FROM (
  SELECT DISTINCT
    (metadata->>'employeeId')::int                          AS employee_id,
    (jsonb_array_elements_text(metadata->'policyIds'))::int AS policy_id
  FROM user_activity_log
  WHERE activity_key     = 'CONFIRMATION_EMAIL_SENT'
    AND activity_category = 'ENROLLMENT'
    AND (metadata->>'isAutoSubmit')::boolean = TRUE
    AND deleted_at IS NULL
) backfill
WHERE pee.employee_id = backfill.employee_id
  AND pee.policy_id   = backfill.policy_id;

-- ============================================================
-- Step 3: Auto-Submitted Enrollments Report
-- Run this anytime to get full employee + policy details
-- DISTINCT ON (employee_id, policy_id) prevents duplicates
-- from multiple map rows for same employee+policy
-- ============================================================
SELECT DISTINCT ON (pee.employee_id, pee.policy_id)
  -- Employee details
  emp.id                          AS employee_id,
  emp.employee_company_id         AS employee_code,
  emp.employee_name               AS employee_name,
  emp.full_name                   AS full_name,
  emp.designation                 AS designation,
  emp.gender                      AS gender,
  emp.policy_location             AS location,

  -- Policy details
  pol.id                          AS policy_id,
  pol.policy_name                 AS policy_name,
  pol.insurer_policy_number       AS insurer_policy_number,
  pol.policy_from                 AS policy_start_date,
  pol.policy_to                   AS policy_end_date,

  -- Company details
  c.company_name                  AS company_name,
  c.id                            AS company_id,

  -- Enrollment window (when the employee was supposed to enroll)
  map.enrollment_start_date       AS enrollment_window_start,
  map.enrollment_end_date         AS enrollment_window_end,

  -- Enrollment details
  pee.employee_enrollment_status_key AS enrollment_status,
  pee.sum_insured                 AS sum_insured,
  pee.total_premium               AS total_premium,
  pee.total_company_pay           AS company_pay,
  pee.total_employee_pay          AS employee_pay,
  pee.updated_at                  AS auto_submitted_at

FROM policy_employee_enrollment pee
INNER JOIN policy_enrollment_employee         emp ON emp.id      = pee.employee_id
INNER JOIN policy                             pol ON pol.id      = pee.policy_id
INNER JOIN company                            c   ON c.id        = pee.company_id
LEFT  JOIN policy_enrollment_employee_policy_map map
                                                  ON map.employee_id = pee.employee_id
                                                 AND map.policy_id   = pee.policy_id
                                                 AND map.deleted_at IS NULL

WHERE pee.is_auto_submitted = TRUE
  AND pee.deleted_at IS NULL

ORDER BY pee.employee_id, pee.policy_id, pee.updated_at DESC;

-- ============================================================
-- Step 4: Legacy Report (before is_auto_submitted flag existed)
-- Uses user_activity_log metadata isAutoSubmit=true
-- DISTINCT ON (employee_id, policy_id) removes duplicates
-- caused by multiple activity log entries for same employee
-- ============================================================
SELECT DISTINCT ON (pee.employee_id, pee.policy_id)
  -- Employee details
  emp.id                          AS employee_id,
  emp.employee_company_id         AS employee_code,
  emp.employee_name               AS employee_name,
  emp.full_name                   AS full_name,
  emp.designation                 AS designation,
  emp.gender                      AS gender,
  emp.policy_location             AS location,

  -- Policy details
  pol.id                          AS policy_id,
  pol.policy_name                 AS policy_name,
  pol.insurer_policy_number       AS insurer_policy_number,
  pol.policy_from                 AS policy_start_date,
  pol.policy_to                   AS policy_end_date,

  -- Company details
  c.company_name                  AS company_name,
  c.id                            AS company_id,

  -- Enrollment window
  map.enrollment_start_date       AS enrollment_window_start,
  map.enrollment_end_date         AS enrollment_window_end,

  -- Enrollment details
  pee.employee_enrollment_status_key AS enrollment_status,
  pee.sum_insured                 AS sum_insured,
  pee.total_premium               AS total_premium,
  pee.total_company_pay           AS company_pay,
  pee.total_employee_pay          AS employee_pay,

  -- Notification proof
  ni.subject                      AS email_subject,
  ni.to_recipients                AS email_sent_to,
  ni.sent_at                      AS auto_submitted_at,
  ni.provider                     AS mail_provider,
  ni.status                       AS mail_status

FROM user_activity_log ual

INNER JOIN notification_info ni
  ON ni.id = ual.reference_id::int
 AND ual.reference_type    = 'NOTIFICATION_INFO'
 AND ual.activity_key      = 'CONFIRMATION_EMAIL_SENT'
 AND ual.activity_category = 'ENROLLMENT'
 AND (ual.metadata->>'isAutoSubmit')::boolean = TRUE
 AND ual.deleted_at IS NULL

-- expand policyIds array — one row per policy per employee
CROSS JOIN LATERAL
  jsonb_array_elements_text(ual.metadata->'policyIds') AS pids(policy_id_text)

INNER JOIN policy_employee_enrollment pee
  ON pee.employee_id = (ual.metadata->>'employeeId')::int
 AND pee.policy_id   = pids.policy_id_text::int
 AND pee.deleted_at IS NULL

INNER JOIN policy_enrollment_employee  emp ON emp.id = pee.employee_id
INNER JOIN policy                      pol ON pol.id = pee.policy_id
INNER JOIN company                     c   ON c.id   = pee.company_id
LEFT  JOIN policy_enrollment_employee_policy_map map
                                            ON map.employee_id = pee.employee_id
                                           AND map.policy_id   = pee.policy_id
                                           AND map.deleted_at IS NULL

ORDER BY pee.employee_id, pee.policy_id, ni.sent_at DESC;
