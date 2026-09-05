-- ═════════════════════════════════════════════════════════════════════════════
-- Policy Enrollment Period Status Summary — powers the "Enrollment Status"
-- HR Portal page with NO filters: every CURRENT or FUTURE enrollment period
-- for the company (periods whose enrollment_end_date has already passed are
-- excluded — see the period_scope CTE), and every policy under each period,
-- with Total/Enrolled/In Progress/Not Enrolled counts. The frontend groups
-- these flat rows by (periodStart, periodEnd) to render "period header ->
-- its policies" sections.
--
-- Params: ###companyId### (required — the only filter this report accepts).
--
-- Employee-to-period matching: document_processing_file.document_id is
-- joined to policy_enrollment_employee_policy_map.enrollment_addition_batch_id
-- — NOT document_processing_file.id directly (dpf.id only identifies the
-- period row itself / the "periodId" shown to the user, e.g. in the
-- policy_enrollment_periods dropdown report). This is the same corrected
-- join used in update_ibp_hr_employee_listing_per_choice.sql and
-- employee_login_activity_policy_enrollment_period_setup.sql.
--
-- Bucketing (matches policy_enrollment_status_summary_setup.sql):
--   enrolled     = EMPLOYEE_ENROLLMENT_STATUS_ENROLLED
--   inProgress   = EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS or _ENDORSEMENT_SENT
--   notEnrolled  = no policy_employee_enrollment row at all, or explicit
--                  EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED
-- These three buckets are mutually exclusive and sum exactly to "total".
--
-- Only ACTIVE, non-deleted employees are counted (pee.user_status_key =
-- 'USER_STATUS_ACTIVE' AND pee.deleted_at IS NULL), per explicit request.
-- ═════════════════════════════════════════════════════════════════════════════

-- Drop-and-recreate: this report is still under active iteration, so clear
-- out any previous version (by name, and by id=61 in case a prior run left
-- it under that id) before inserting fresh, rather than skip-if-exists.

DO $$
DECLARE
    v_old_report_id INTEGER;
BEGIN
    FOR v_old_report_id IN
        SELECT id FROM admin_reports WHERE name = 'policy_enrollment_period_status_summary'
    LOOP
        DELETE FROM admin_reports_results_mappings WHERE admin_report_id = v_old_report_id;
        DELETE FROM admin_reports_parameters WHERE admin_report_id = v_old_report_id;
        DELETE FROM admin_reports WHERE id = v_old_report_id;
        RAISE NOTICE 'Removed previous admin report id=% before recreating.', v_old_report_id;
    END LOOP;
END $$;

DO $$
DECLARE
    v_report_id INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM admin_reports WHERE name = 'policy_enrollment_period_status_summary') THEN
        RAISE NOTICE 'admin_reports "policy_enrollment_period_status_summary" already exists — skipping creation.';
        SELECT id INTO v_report_id FROM admin_reports WHERE name = 'policy_enrollment_period_status_summary';
    ELSE
        INSERT INTO admin_reports (
            name, label, end_point, query, created_by, updated_by, order_no
        ) VALUES (
            'policy_enrollment_period_status_summary',
            'Policy Enrollment Period Status Summary',
            'policy_enrollment_period_status_summary',
            $q$
WITH period_scope AS (
  SELECT DISTINCT
    dpf.id                       AS period_id,
    dpf.document_id              AS batch_document_id,
    dpf.enrollment_start_date,
    dpf.enrollment_end_date,
    e.policy_id,
    e.company_id
  FROM document_processing_file dpf
  INNER JOIN endorsement e ON e.id = dpf.endorsement_id
  WHERE e.company_id = ###companyId###
    AND dpf.enrollment_start_date IS NOT NULL
    AND dpf.enrollment_end_date IS NOT NULL
    -- Current + future only — a period whose end date has already passed is
    -- closed, so it's excluded (nothing left to enroll/remind for). Ongoing
    -- periods (started but not yet ended) are kept since end_date is today
    -- or later.
    AND dpf.enrollment_end_date >= CURRENT_DATE
),
period_employees AS (
  SELECT
    ps.period_id,
    ps.policy_id,
    pee.id                             AS employee_id,
    pe.employee_enrollment_status_key
  FROM period_scope ps
  INNER JOIN policy_enrollment_employee_policy_map pepm
    ON pepm.policy_id = ps.policy_id
   AND pepm.enrollment_addition_batch_id = ps.batch_document_id
   AND pepm.deleted_at IS NULL
  INNER JOIN policy_enrollment_employee pee
    ON pee.id = pepm.employee_id
   AND pee.deleted_at IS NULL
   AND pee.user_status_key = 'USER_STATUS_ACTIVE'
  LEFT JOIN policy_employee_enrollment pe
    ON pe.employee_id = pee.id
   AND pe.policy_id = ps.policy_id
   AND pe.deleted_at IS NULL
)
SELECT
  ps.period_id                                                                             AS "periodId",
  TO_CHAR(ps.enrollment_start_date, 'YYYY-MM-DD')                                          AS "periodStart",
  TO_CHAR(ps.enrollment_end_date, 'YYYY-MM-DD')                                             AS "periodEnd",
  p.id                                                                                      AS "policyId",
  p.policy_name                                                                             AS "policyName",
  p.insurer_policy_number                                                                   AS "policyNumber",
  COUNT(DISTINCT pe2.employee_id)                                                           AS "total",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE pe2.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
  )                                                                                          AS "enrolled",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE pe2.employee_enrollment_status_key IN (
      'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS', 'EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT'
    )
  )                                                                                          AS "inProgress",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE COALESCE(pe2.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED')
        = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'
  )                                                                                          AS "notEnrolled"
FROM period_employees pe2
INNER JOIN period_scope ps ON ps.period_id = pe2.period_id AND ps.policy_id = pe2.policy_id
LEFT JOIN policy p ON p.id = pe2.policy_id
GROUP BY ps.period_id, ps.enrollment_start_date, ps.enrollment_end_date, p.id, p.policy_name, p.insurer_policy_number
ORDER BY ps.enrollment_start_date DESC, p.policy_name
            $q$,
            'SYSTEM', 'SYSTEM', 33
        ) RETURNING id INTO v_report_id;

        INSERT INTO admin_reports_parameters (
            admin_report_id, parameter_name, label, query_parameter, data_type, input_field_type, option_type, option, created_by, updated_by, order_no
        ) VALUES
            (v_report_id, 'companyId', 'Company', '###companyId###', 'number', 'hidden', 'none', '{}'::jsonb, 'SYSTEM', 'SYSTEM', 1);

        INSERT INTO admin_reports_results_mappings (
            admin_report_id, query_parameter_name, variable_name, label, data_type, alignment, created_by, updated_by
        ) VALUES
            (v_report_id, 'periodId',     'periodId',     'Period ID',      'number', 'right', 'SYSTEM', 'SYSTEM'),
            (v_report_id, 'periodStart',  'periodStart',  'Period Start',   'date',   'left',  'SYSTEM', 'SYSTEM'),
            (v_report_id, 'periodEnd',    'periodEnd',    'Period End',     'date',   'left',  'SYSTEM', 'SYSTEM'),
            (v_report_id, 'policyId',     'policyId',     'Policy ID',      'number', 'right', 'SYSTEM', 'SYSTEM'),
            (v_report_id, 'policyName',   'policyName',   'Policy Name',    'string', 'left',  'SYSTEM', 'SYSTEM'),
            (v_report_id, 'policyNumber', 'policyNumber', 'Policy Number',  'string', 'left',  'SYSTEM', 'SYSTEM'),
            (v_report_id, 'total',        'total',        'Total',          'number', 'right', 'SYSTEM', 'SYSTEM'),
            (v_report_id, 'enrolled',     'enrolled',     'Enrolled',       'number', 'right', 'SYSTEM', 'SYSTEM'),
            (v_report_id, 'inProgress',   'inProgress',   'In Progress',    'number', 'right', 'SYSTEM', 'SYSTEM'),
            (v_report_id, 'notEnrolled',  'notEnrolled',  'Not Enrolled',   'number', 'right', 'SYSTEM', 'SYSTEM');

        RAISE NOTICE 'Inserted admin report "policy_enrollment_period_status_summary" with id=%', v_report_id;
    END IF;
END $$;

-- Verify
SELECT id, name, label, order_no FROM admin_reports WHERE name = 'policy_enrollment_period_status_summary';
SELECT admin_report_id, parameter_name, label, order_no FROM admin_reports_parameters
WHERE admin_report_id = (SELECT id FROM admin_reports WHERE name = 'policy_enrollment_period_status_summary')
ORDER BY order_no;
