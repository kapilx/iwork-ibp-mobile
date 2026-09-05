-- =============================================================================
-- ENROLLMENT REPORT FILTER CHAIN MIGRATION
-- Executes all DB changes needed for the Period → Policy → Status filter chain
-- on the IBP HR Enrollment Report.
--
-- Run order (all in this file, top-to-bottom):
--   1. Update ibp_hr_employee_listing query + rename parameters to plural
--   2. Create policy_enrollment_periods_by_company report
--   3. Create policy_list_for_enrollment_period report
--   4. Update ibp_hr_employee_listing_count + copy corrected parameters
--   5. Create performance index (standalone — outside transaction)
--
-- Safe to re-run: all blocks use UPDATE…IF NOT EXISTS patterns.
-- NOTE: CREATE INDEX CONCURRENTLY at the end cannot run inside a transaction.
-- =============================================================================


-- =============================================================================
-- BLOCK 1: Update ibp_hr_employee_listing query + fix parameter names
-- Changes:
--   • policyId  (###policyId###)        → policyIds  (###policyIds###)   multi-select CSV
--   • enrollmentPeriodId (###enrollmentPeriodId###) → enrollmentPeriodIds (###enrollmentPeriodIds###) multi-select CSV
--   • Adds filtered_employees CTE for fast enrollment-status filtering
--   • Saves a dated backup of the old query before replacing
-- =============================================================================
DO $$
DECLARE
  v_report_id  INTEGER;
  v_query      TEXT := $q$
WITH filtered_employees AS MATERIALIZED (
  -- Identify matching employee IDs cheaply before expanding choices/dependents.
  -- Starts from policy_employee_enrollment using the status index (idx_pee_status_employee)
  -- then joins back to get the company filter — 44ms vs 6s for the forward scan approach.
  -- For no filter (enrollStatus='') falls back to all employees in the company.

  -- Branch 1: specific enrollment status — use status index (fast path)
  SELECT DISTINCT pe.employee_id
  FROM policy_employee_enrollment pe
  INNER JOIN policy_enrollment_employee pee
    ON pee.id = pe.employee_id AND pee.company_id = ###companyId### AND pee.deleted_at IS NULL
  INNER JOIN policy_enrollment_employee_policy_map pepm
    ON pepm.employee_id = pe.employee_id AND pepm.policy_id = pe.policy_id AND pepm.deleted_at IS NULL
    AND (NULLIF(###policyIds###, '') IS NULL OR pepm.policy_id::text = ANY(string_to_array(###policyIds###, ',')))
  LEFT JOIN document_processing_file dpf ON dpf.document_id = pepm.enrollment_addition_batch_id
  WHERE pe.deleted_at IS NULL
    AND (
      NULLIF(###enrollmentPeriodIds###, '') IS NULL
      OR EXISTS (SELECT 1 FROM document_processing_file ref WHERE ref.id = ANY(string_to_array(###enrollmentPeriodIds###, ',')::int[]) AND ref.enrollment_start_date = dpf.enrollment_start_date AND ref.enrollment_end_date = dpf.enrollment_end_date)
    )
    AND NULLIF(###enrollStatus###, '') IS NOT NULL
    AND ###enrollStatus### != 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'
    AND (
      (###enrollStatus### = 'AUTO_ENROLLED'  AND pe.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED' AND pe.is_auto_submitted = TRUE)
      OR (###enrollStatus### = 'USER_ENROLLED' AND pe.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED' AND pe.is_auto_submitted = FALSE)
      OR (###enrollStatus### NOT IN ('AUTO_ENROLLED','USER_ENROLLED') AND pe.employee_enrollment_status_key = ###enrollStatus###)
    )

  UNION

  -- Branch 2: no filter OR NOT_STARTED — fall back to all company employees
  -- NOT_STARTED = employees who have no enrollment record at all
  SELECT DISTINCT pee.id AS employee_id
  FROM policy_enrollment_employee pee
  INNER JOIN policy_enrollment_employee_policy_map pepm
    ON pepm.employee_id = pee.id AND pepm.deleted_at IS NULL
    AND (NULLIF(###policyIds###, '') IS NULL OR pepm.policy_id::text = ANY(string_to_array(###policyIds###, ',')))
  LEFT JOIN document_processing_file dpf ON dpf.document_id = pepm.enrollment_addition_batch_id
  LEFT JOIN policy_employee_enrollment pe
    ON pe.employee_id = pee.id AND pe.policy_id = pepm.policy_id AND pe.deleted_at IS NULL
  WHERE pee.company_id = ###companyId###
    AND pee.deleted_at IS NULL
    AND (
      NULLIF(###enrollmentPeriodIds###, '') IS NULL
      OR EXISTS (SELECT 1 FROM document_processing_file ref WHERE ref.id = ANY(string_to_array(###enrollmentPeriodIds###, ',')::int[]) AND ref.enrollment_start_date = dpf.enrollment_start_date AND ref.enrollment_end_date = dpf.enrollment_end_date)
    )
    AND (
      NULLIF(###enrollStatus###, '') IS NULL
      OR (###enrollStatus### = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED' AND pe.employee_id IS NULL)
    )
),
base_employees AS (
  SELECT
    pee.id                          AS employee_id,
    pee.company_id                  AS company_id,
    pee.company_employee_id         AS company_employee_id,
    pee.employee_name               AS employee_name,
    pee.date_of_birth               AS date_of_birth,
    pee.gender                      AS gender,
    pee.phone_number                AS phone_number,
    pee.email                       AS email,
    pee.user_status_key             AS user_status_key,
    pee.created_at                  AS portal_entry_date
  FROM policy_enrollment_employee pee
  INNER JOIN filtered_employees fe ON fe.employee_id = pee.id
  WHERE pee.deleted_at IS NULL
),
employee_policies AS MATERIALIZED (
  SELECT DISTINCT
    pepm.employee_id,
    pepm.policy_id,
    pepm.effective_date             AS date_of_joining
  FROM policy_enrollment_employee_policy_map pepm
  INNER JOIN base_employees be ON be.employee_id = pepm.employee_id
  LEFT JOIN document_processing_file dpf ON dpf.document_id = pepm.enrollment_addition_batch_id
  WHERE pepm.deleted_at IS NULL
    AND (NULLIF(###policyIds###, '') IS NULL OR pepm.policy_id::text = ANY(string_to_array(###policyIds###, ',')))
    AND (
      NULLIF(###enrollmentPeriodIds###, '') IS NULL
      OR EXISTS (SELECT 1 FROM document_processing_file ref WHERE ref.id = ANY(string_to_array(###enrollmentPeriodIds###, ',')::int[]) AND ref.enrollment_start_date = dpf.enrollment_start_date AND ref.enrollment_end_date = dpf.enrollment_end_date)
    )
),
enrollment AS MATERIALIZED (
  SELECT
    pe.id                            AS enrollment_id,
    pe.employee_id,
    pe.policy_id,
    pe.employee_enrollment_status_key,
    pe.is_auto_submitted,
    pe.created_at                    AS enrollment_created_at
  FROM policy_employee_enrollment pe
  INNER JOIN employee_policies ep ON ep.employee_id = pe.employee_id AND ep.policy_id = pe.policy_id
  WHERE pe.deleted_at IS NULL
),
choices AS MATERIALIZED (
  SELECT
    pec.id                           AS choice_id,
    pec.employee_enrollment_id,
    en.employee_id,
    en.policy_id,
    pec.policy_component_action_label,
    pec.sum_insured                  AS choice_sum_insured,
    pec.company_pay,
    pec.employee_pay
  FROM policy_employee_enrollment_choice pec
  INNER JOIN enrollment en ON en.enrollment_id = pec.employee_enrollment_id
),
choice_people AS MATERIALIZED (
  SELECT
    ch.choice_id,
    'Employee'                        AS relationship,
    be.employee_name                  AS covered_person_name,
    be.date_of_birth                  AS covered_person_dob,
    be.gender                         AS covered_person_gender,
    ch.choice_sum_insured,
    ch.company_pay,
    ch.employee_pay,
    0                                  AS sort_order
  FROM choices ch
  INNER JOIN base_employees be ON be.employee_id = ch.employee_id

  UNION ALL

  SELECT
    ch.choice_id,
    ped.relation                      AS relationship,
    ped.name                          AS covered_person_name,
    ped.date_of_birth                 AS covered_person_dob,
    ped.gender                        AS covered_person_gender,
    0                                  AS choice_sum_insured,
    0                                  AS company_pay,
    0                                  AS employee_pay,
    1                                  AS sort_order
  FROM choices ch
  INNER JOIN policy_employee_enrollment_choice_dependent pecd
    ON pecd.employee_enrollment_choice_id = ch.choice_id
   AND pecd.deleted_at IS NULL
  INNER JOIN policy_enrollment_dependent ped
    ON ped.id = pecd.dependent_id
   AND ped.deleted_at IS NULL

  UNION ALL

  SELECT
    ch.choice_id,
    ped.relation                      AS relationship,
    ped.name                          AS covered_person_name,
    ped.date_of_birth                 AS covered_person_dob,
    ped.gender                        AS covered_person_gender,
    0                                  AS choice_sum_insured,
    0                                  AS company_pay,
    0                                  AS employee_pay,
    1                                  AS sort_order
  FROM choices ch
  INNER JOIN policy_enrollment_dependent ped
    ON ped.employee_id = ch.employee_id
   AND (ped.policy_id = ch.policy_id OR ped.policy_id IS NULL)
   AND ped.deleted_at IS NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_employee_enrollment_choice_dependent pecd2
    WHERE pecd2.employee_enrollment_choice_id = ch.choice_id
      AND pecd2.deleted_at IS NULL
  )
),
choice_dependent_summary AS (
  SELECT
    choice_id,
    STRING_AGG(
      DISTINCT covered_person_name || ' (' || relationship || ')',
      ', ' ORDER BY covered_person_name || ' (' || relationship || ')'
    ) AS dependent_details
  FROM choice_people
  WHERE sort_order = 1
  GROUP BY choice_id
),
submission AS (
  SELECT DISTINCT ON (es.employee_id, ep2.policy_id)
    es.employee_id,
    ep2.policy_id,
    es.reference_number,
    es.submitted_at
  FROM employee_enrollment_submission es
  CROSS JOIN LATERAL jsonb_array_elements_text(es.policy_ids) AS pid_text
  INNER JOIN employee_policies ep2
    ON pid_text ~ '^\d+$'
   AND ep2.policy_id = pid_text::int
   AND ep2.employee_id = es.employee_id
  ORDER BY es.employee_id, ep2.policy_id, es.submitted_at DESC
)
SELECT
  TO_CHAR(NOW(), 'DD-MM-YYYY')                                                AS "REPORT_DATE",
  c.display_name                                                              AS "ENTITY",
  p.insurer_policy_number                                                    AS "POLICY_NUMBER",
  p.id                                                                       AS "IIRM_POLICY_ID",
  p.policy_name                                                               AS "POLICY_NAME",
  be.company_employee_id                                                     AS "EIN",
  COALESCE(cp.covered_person_name, be.employee_name)                         AS "INSUREDNAME",
  TO_CHAR(COALESCE(cp.covered_person_dob, be.date_of_birth), 'DD-MM-YYYY')   AS "DOB",
  COALESCE(cp.covered_person_gender, be.gender)                              AS "GENDER",
  COALESCE(cp.relationship, 'Employee')                                      AS "RELATION",
  be.phone_number                                                            AS "EMPMOBILE",
  be.email                                                                   AS "EMPEMAIL",
  TO_CHAR(ep.date_of_joining, 'DD-MM-YYYY')                                  AS "DOJ",
  ch.policy_component_action_label                                          AS "PLANOPTED",
  COALESCE(cp.choice_sum_insured, 0)                                        AS "BASESI",
  COALESCE(cp.company_pay, 0) + COALESCE(cp.employee_pay, 0)                AS "TOTAL_AMOUNT",
  cds.dependent_details                                                     AS "DEPENDENT_DETAILS",
  TO_CHAR(p.policy_from, 'DD-MM-YYYY')                                      AS "POLICYFROM",
  TO_CHAR(p.policy_to, 'DD-MM-YYYY')                                        AS "POLICYTO",
  TO_CHAR(be.portal_entry_date, 'DD-MM-YYYY')                               AS "INDIAINSURE_PORTAL_ENTRY_DATE",
  TO_CHAR(sub.submitted_at, 'DD-MM-YYYY HH24:MI')                           AS "INDIAINSURE_PORTAL_SUBMIT_DATE",
  CASE WHEN be.user_status_key = 'USER_STATUS_ACTIVE' THEN 'Active' ELSE 'Inactive' END AS "STATUS",
  TO_CHAR(en.enrollment_created_at, 'DD-MM-YYYY')                           AS "ENTEREDON",
  NULL                                                                      AS "CORRECTION_REMARKS",
  TO_CHAR(NOW(), 'DD-MM-YYYY HH12-MI-SS AM')                                AS "REPORT_LAST_RUN_DATE",
  CASE COALESCE(en.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED')
    WHEN 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'          THEN 'Enrolled'
    WHEN 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS'       THEN 'In Progress'
    WHEN 'EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT'  THEN 'Endorsement Sent'
    ELSE 'Not Started'
  END                                                                        AS "ENROLLMENT_COMPLETE",
  be.employee_id                                                            AS "AUTO_ENROLLED_FLAG",
  CASE
    WHEN en.is_auto_submitted = TRUE THEN 'Auto Enrolled'
    WHEN en.is_auto_submitted = FALSE AND en.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED' THEN 'User Enrolled'
    ELSE NULL
  END                                                                        AS "ENROLLED_BY",
  be.employee_id                                                            AS "EID"
FROM base_employees be
INNER JOIN employee_policies ep  ON ep.employee_id = be.employee_id
INNER JOIN policy p              ON p.id = ep.policy_id
LEFT JOIN company c              ON c.id = be.company_id
LEFT JOIN enrollment en          ON en.employee_id = ep.employee_id AND en.policy_id = ep.policy_id
LEFT JOIN choices ch             ON ch.employee_enrollment_id = en.enrollment_id
LEFT JOIN choice_people cp       ON cp.choice_id = ch.choice_id
LEFT JOIN choice_dependent_summary cds ON cds.choice_id = ch.choice_id
LEFT JOIN submission sub         ON sub.employee_id = be.employee_id AND sub.policy_id = ep.policy_id
WHERE (
  NULLIF(###policyIds###, '') IS NULL
  OR p.id::text = ANY(string_to_array(###policyIds###, ','))
)
  AND (
    NULLIF(###enrollStatus###, '') IS NULL
    OR (
      ###enrollStatus### = 'AUTO_ENROLLED'
      AND en.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
      AND en.is_auto_submitted = TRUE
    )
    OR (
      ###enrollStatus### = 'USER_ENROLLED'
      AND en.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
      AND en.is_auto_submitted = FALSE
    )
    OR (
      ###enrollStatus### NOT IN ('AUTO_ENROLLED', 'USER_ENROLLED')
      AND COALESCE(en.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') = ###enrollStatus###
    )
  )
ORDER BY be.employee_name, p.insurer_policy_number, ch.choice_id, cp.sort_order, cp.covered_person_name
  $q$;
BEGIN
  SELECT id INTO v_report_id FROM admin_reports WHERE name = 'ibp_hr_employee_listing' AND deleted_at IS NULL;

  IF v_report_id IS NULL THEN
    RAISE NOTICE 'admin_reports row "ibp_hr_employee_listing" not found — skipping block 1';
    RETURN;
  END IF;

  -- Backup current query before replacing
  INSERT INTO admin_reports (name, label, end_point, query, order_no, created_by, updated_by)
  SELECT
    'ibp_hr_employee_listing_bkp_' || TO_CHAR(NOW(), 'YYYYMMDD'),
    'IBP HR Employee Listing Backup ' || TO_CHAR(NOW(), 'YYYY-MM-DD'),
    'ibp_hr_employee_listing_bkp',
    query, 9998, 'SYSTEM', 'SYSTEM'
  FROM admin_reports
  WHERE name = 'ibp_hr_employee_listing';

  UPDATE admin_reports
  SET query = v_query, updated_by = 'SYSTEM', updated_at = NOW()
  WHERE id = v_report_id;

  -- Rename parameters from singular to plural (multi-select CSV values)
  UPDATE admin_reports_parameters
  SET parameter_name = 'policyIds', query_parameter = '###policyIds###', updated_at = NOW()
  WHERE admin_report_id = v_report_id AND parameter_name = 'policyId' AND deleted_at IS NULL;

  UPDATE admin_reports_parameters
  SET parameter_name = 'enrollmentPeriodIds', query_parameter = '###enrollmentPeriodIds###', updated_at = NOW()
  WHERE admin_report_id = v_report_id AND parameter_name = 'enrollmentPeriodId' AND deleted_at IS NULL;

  RAISE NOTICE 'Block 1 done — ibp_hr_employee_listing query updated, parameters renamed to plural';
END;
$$;


-- =============================================================================
-- BLOCK 2: Create policy_enrollment_periods_by_company report
-- Returns distinct enrollment periods (date windows) for a company.
-- Used as the FIRST dropdown in the enrollment report filter chain.
-- =============================================================================
DO $$
DECLARE
  v_report_id INTEGER;
  v_query     TEXT := $q$
SELECT DISTINCT ON (dpf.enrollment_start_date, dpf.enrollment_end_date)
  dpf.id                                                                      AS "periodId",
  TO_CHAR(dpf.enrollment_start_date, 'DD Mon YYYY') || ' – ' ||
    TO_CHAR(dpf.enrollment_end_date, 'DD Mon YYYY')                          AS "label",
  dpf.enrollment_start_date                                                  AS "enrollmentStartDate",
  dpf.enrollment_end_date                                                    AS "enrollmentEndDate"
FROM document_processing_file dpf
INNER JOIN policy_enrollment_employee_policy_map pepm
  ON pepm.enrollment_addition_batch_id = dpf.document_id
  AND pepm.deleted_at IS NULL
INNER JOIN policy_enrollment_employee pee
  ON pee.id = pepm.employee_id
  AND pee.company_id = ###companyId###
  AND pee.deleted_at IS NULL
WHERE dpf.enrollment_start_date IS NOT NULL
  AND dpf.enrollment_end_date IS NOT NULL
ORDER BY dpf.enrollment_start_date DESC, dpf.enrollment_end_date DESC, dpf.id ASC
  $q$;
BEGIN
  UPDATE admin_reports
  SET query = v_query, updated_by = 'SYSTEM', updated_at = NOW()
  WHERE name = 'policy_enrollment_periods_by_company'
  RETURNING id INTO v_report_id;

  IF v_report_id IS NULL THEN
    INSERT INTO admin_reports (name, label, end_point, query, order_no, created_by, updated_by)
    VALUES ('policy_enrollment_periods_by_company', 'Policy Enrollment Periods By Company',
            'policy_enrollment_periods_by_company', v_query, 9990, 'SYSTEM', 'SYSTEM')
    RETURNING id INTO v_report_id;
  END IF;

  DELETE FROM admin_reports_parameters WHERE admin_report_id = v_report_id;

  INSERT INTO admin_reports_parameters
    (admin_report_id, parameter_name, query_parameter, label, data_type, input_field_type, option_type, option, order_no, created_by, updated_by)
  VALUES
    (v_report_id, 'companyId', '###companyId###', 'Company ID', 'integer', 'input', 'none', '{}', 1, 'SYSTEM', 'SYSTEM');

  RAISE NOTICE 'Block 2 done — policy_enrollment_periods_by_company created/updated with id=%', v_report_id;
END;
$$;


-- =============================================================================
-- BLOCK 3: Create policy_list_for_enrollment_period report
-- Returns policies available for a company, filtered by selected enrollment
-- period(s) using date-range matching so all policies in the same window appear.
-- Used as the SECOND dropdown in the enrollment report filter chain.
-- =============================================================================
DO $$
DECLARE
  v_report_id INTEGER;
  v_query     TEXT := $q$
SELECT DISTINCT
  p.id                                                    AS "policyId",
  p.policy_name                                           AS "policyName",
  p.insurer_policy_number                                 AS "policyNumber",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                  AS "policyFrom",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                  AS "policyTo"
FROM policy p
INNER JOIN policy_enrollment_employee_policy_map pepm
  ON pepm.policy_id = p.id
  AND pepm.deleted_at IS NULL
INNER JOIN policy_enrollment_employee pee
  ON pee.id = pepm.employee_id
  AND pee.company_id = ###companyId###
  AND pee.deleted_at IS NULL
LEFT JOIN document_processing_file dpf
  ON dpf.document_id = pepm.enrollment_addition_batch_id
WHERE (
    NULLIF(###enrollmentPeriodIds###, '') IS NULL
    OR EXISTS (
      SELECT 1 FROM document_processing_file ref
      WHERE ref.id = ANY(string_to_array(###enrollmentPeriodIds###, ',')::int[])
        AND ref.enrollment_start_date = dpf.enrollment_start_date
        AND ref.enrollment_end_date   = dpf.enrollment_end_date
    )
  )
ORDER BY p.policy_name
  $q$;
BEGIN
  UPDATE admin_reports
  SET query = v_query, updated_by = 'SYSTEM', updated_at = NOW()
  WHERE name = 'policy_list_for_enrollment_period'
  RETURNING id INTO v_report_id;

  IF v_report_id IS NULL THEN
    INSERT INTO admin_reports (name, label, end_point, query, order_no, created_by, updated_by)
    VALUES ('policy_list_for_enrollment_period', 'Policy List For Enrollment Period',
            'policy_list_for_enrollment_period', v_query, 9991, 'SYSTEM', 'SYSTEM')
    RETURNING id INTO v_report_id;
  END IF;

  DELETE FROM admin_reports_parameters WHERE admin_report_id = v_report_id;

  INSERT INTO admin_reports_parameters
    (admin_report_id, parameter_name, query_parameter, label, data_type, input_field_type, option_type, option, order_no, created_by, updated_by)
  VALUES
    (v_report_id, 'companyId',           '###companyId###',           'Company ID',           'integer', 'input', 'none', '{}', 1, 'SYSTEM', 'SYSTEM'),
    (v_report_id, 'enrollmentPeriodIds', '###enrollmentPeriodIds###', 'Enrollment Period IDs', 'varchar', 'input', 'none', '{}', 2, 'SYSTEM', 'SYSTEM');

  RAISE NOTICE 'Block 3 done — policy_list_for_enrollment_period created/updated with id=%', v_report_id;
END;
$$;


-- =============================================================================
-- BLOCK 4: Update ibp_hr_employee_listing_count report
-- Must run AFTER Block 1 so it copies the correctly renamed parameters.
-- =============================================================================
DO $$
DECLARE
  v_main_id   INTEGER;
  v_count_id  INTEGER;
  v_query     TEXT := $q$
WITH base_employees AS (
  SELECT
    pee.id   AS employee_id,
    pee.company_id
  FROM policy_enrollment_employee pee
  WHERE pee.company_id = ###companyId###
    AND pee.deleted_at IS NULL
),
employee_policies AS MATERIALIZED (
  SELECT DISTINCT
    pepm.employee_id,
    pepm.policy_id
  FROM policy_enrollment_employee_policy_map pepm
  INNER JOIN base_employees be ON be.employee_id = pepm.employee_id
  LEFT JOIN document_processing_file dpf ON dpf.document_id = pepm.enrollment_addition_batch_id
  WHERE pepm.deleted_at IS NULL
    AND (NULLIF(###policyIds###, '') IS NULL OR pepm.policy_id::text = ANY(string_to_array(###policyIds###, ',')))
    AND (
      NULLIF(###enrollmentPeriodIds###, '') IS NULL
      OR EXISTS (SELECT 1 FROM document_processing_file ref WHERE ref.id = ANY(string_to_array(###enrollmentPeriodIds###, ',')::int[]) AND ref.enrollment_start_date = dpf.enrollment_start_date AND ref.enrollment_end_date = dpf.enrollment_end_date)
    )
),
enrollment AS MATERIALIZED (
  SELECT
    pe.id                              AS enrollment_id,
    pe.employee_id,
    pe.policy_id,
    pe.employee_enrollment_status_key,
    pe.is_auto_submitted
  FROM policy_employee_enrollment pe
  INNER JOIN employee_policies ep ON ep.employee_id = pe.employee_id AND ep.policy_id = pe.policy_id
  WHERE pe.deleted_at IS NULL
),
choices AS MATERIALIZED (
  SELECT
    pec.id                  AS choice_id,
    pec.employee_enrollment_id,
    en.employee_id,
    en.policy_id
  FROM policy_employee_enrollment_choice pec
  INNER JOIN enrollment en ON en.enrollment_id = pec.employee_enrollment_id
),
choice_people AS (
  SELECT ch.choice_id FROM choices ch
  INNER JOIN base_employees be ON be.employee_id = ch.employee_id

  UNION ALL

  SELECT ch.choice_id FROM choices ch
  INNER JOIN policy_employee_enrollment_choice_dependent pecd
    ON pecd.employee_enrollment_choice_id = ch.choice_id AND pecd.deleted_at IS NULL
  INNER JOIN policy_enrollment_dependent ped
    ON ped.id = pecd.dependent_id AND ped.deleted_at IS NULL

  UNION ALL

  SELECT ch.choice_id FROM choices ch
  INNER JOIN policy_enrollment_dependent ped
    ON ped.employee_id = ch.employee_id
    AND (ped.policy_id = ch.policy_id OR ped.policy_id IS NULL)
    AND ped.deleted_at IS NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM policy_employee_enrollment_choice_dependent pecd2
    WHERE pecd2.employee_enrollment_choice_id = ch.choice_id AND pecd2.deleted_at IS NULL
  )
)
SELECT COUNT(*) AS count
FROM base_employees be
INNER JOIN employee_policies ep  ON ep.employee_id = be.employee_id
LEFT JOIN enrollment en          ON en.employee_id = ep.employee_id AND en.policy_id = ep.policy_id
LEFT JOIN choices ch             ON ch.employee_enrollment_id = en.enrollment_id
LEFT JOIN choice_people cp       ON cp.choice_id = ch.choice_id
WHERE (
  NULLIF(###enrollStatus###, '') IS NULL
  OR (
    ###enrollStatus### = 'AUTO_ENROLLED'
    AND en.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    AND en.is_auto_submitted = TRUE
  )
  OR (
    ###enrollStatus### = 'USER_ENROLLED'
    AND en.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    AND en.is_auto_submitted = FALSE
  )
  OR (
    ###enrollStatus### NOT IN ('AUTO_ENROLLED', 'USER_ENROLLED')
    AND COALESCE(en.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') = ###enrollStatus###
  )
)
  $q$;
BEGIN
  SELECT id INTO v_main_id FROM admin_reports WHERE name = 'ibp_hr_employee_listing' AND deleted_at IS NULL;

  IF v_main_id IS NULL THEN
    RAISE NOTICE 'admin_reports row "ibp_hr_employee_listing" not found — skipping block 4';
    RETURN;
  END IF;

  UPDATE admin_reports
  SET query = v_query, updated_by = 'SYSTEM', updated_at = NOW()
  WHERE name = 'ibp_hr_employee_listing_count'
  RETURNING id INTO v_count_id;

  IF v_count_id IS NULL THEN
    INSERT INTO admin_reports (name, label, end_point, query, order_no, created_by, updated_by)
    VALUES ('ibp_hr_employee_listing_count', 'IBP HR Employee Listing Count',
            'ibp_hr_employee_listing_count', v_query, 9999, 'SYSTEM', 'SYSTEM')
    RETURNING id INTO v_count_id;
  END IF;

  -- Copy parameters from the main report (already renamed to plural in Block 1)
  DELETE FROM admin_reports_parameters WHERE admin_report_id = v_count_id;

  INSERT INTO admin_reports_parameters
    (admin_report_id, parameter_name, query_parameter, label, data_type, input_field_type, option_type, option, order_no, created_by, updated_by)
  SELECT v_count_id, parameter_name, query_parameter, label, data_type, input_field_type, option_type, option, order_no, 'SYSTEM', 'SYSTEM'
  FROM admin_reports_parameters
  WHERE admin_report_id = v_main_id AND deleted_at IS NULL;

  RAISE NOTICE 'Block 4 done — ibp_hr_employee_listing_count updated with id=%', v_count_id;
END;
$$;


-- =============================================================================
-- BLOCK 5: Performance index for enrollment status filtering
-- MUST run outside a transaction (CONCURRENTLY restriction).
-- Safe to run multiple times (IF NOT EXISTS).
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pee_status_employee
  ON policy_employee_enrollment (employee_enrollment_status_key, employee_id, policy_id)
  WHERE deleted_at IS NULL;
