-- ============================================================================
-- Report: IBP HR Employee Listing
-- name (used in URL/endpoint): ibp_hr_employee_listing    |    id: 53    |    order_no: 7
-- end_point: ibp_hr_employee_listing
-- created_at: 2026-05-12 12:21:56.188796    updated_at: 2026-07-23 06:58:05.996124
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
-- 1. MAIN QUERY  (admin_reports.query, id = 53)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH filtered_employees AS MATERIALIZED (
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
  TO_CHAR(sub.submitted_at AT TIME ZONE 'Asia/Kolkata', 'DD-MM-YYYY HH24:MI')                           AS "INDIAINSURE_PORTAL_SUBMIT_DATE",
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
ORDER BY be.employee_name, p.insurer_policy_number, ch.choice_id, cp.sort_order, cp.covered_person_name$Q$
--   WHERE id = 53;

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
  TO_CHAR(sub.submitted_at AT TIME ZONE 'Asia/Kolkata', 'DD-MM-YYYY HH24:MI')                           AS "INDIAINSURE_PORTAL_SUBMIT_DATE",
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

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 53)
-- ------------------------------------------------------------------
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Policy
--   parameter_name : policyIds
--   token in query : ###policyIds###
--   data_type      : number
--   input_field    : hidden
--   >>> HIDDEN field -- the generic /report screen cannot render an input for this.
--   order_no       : 2
--
-- Filter: Enrollment Status
--   parameter_name : enrollStatus
--   token in query : ###enrollStatus###
--   data_type      : string
--   input_field    : input
--   order_no       : 4
--
-- Filter: Enrollment Period
--   parameter_name : enrollmentPeriodIds
--   token in query : ###enrollmentPeriodIds###
--   data_type      : number
--   input_field    : hidden
--   >>> HIDDEN field -- the generic /report screen cannot render an input for this.
--   order_no       : 4
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 53)
-- ------------------------------------------------------------------
--   employeeId                   -> Employee ID                    (variable: employeeId, type: number, align: right)
--   companyEmployeeId            -> Company Employee ID            (variable: companyEmployeeId, type: string, align: left)
--   employeeName                 -> Employee Name                  (variable: employeeName, type: string, align: left)
--   fullName                     -> Full Name                      (variable: fullName, type: string, align: left)
--   email                        -> Email                          (variable: email, type: string, align: left)
--   gender                       -> Gender                         (variable: gender, type: string, align: left)
--   dateOfBirth                  -> Date Of Birth                  (variable: dateOfBirth, type: date, align: left)
--   mobile                       -> Mobile                         (variable: mobile, type: string, align: left)
--   enrollStatus                 -> Enroll Status                  (variable: enrollStatus, type: string, align: left)
--   sumInsured                   -> Sum Insured                    (variable: sumInsured, type: number, align: right)
--   dependentsCount              -> Dependents Count               (variable: dependentsCount, type: number, align: right)
--   ecardKey                     -> E-Card Key                     (variable: ecardKey, type: string, align: left)
--   lastLoginAt                  -> Last Login At                  (variable: lastLoginAt, type: date, align: left)
--   locationCode                 -> Location Code                  (variable: locationCode, type: string, align: left)
--   locationAddress              -> Location Address               (variable: locationAddress, type: string, align: left)

-- ------------------------------------------------------------------
-- 5. KNOWN ISSUES
-- ------------------------------------------------------------------
-- 1. admin_reports_results_mappings (section 3) describes columns (employeeId, fullName, sumInsured, dependentsCount, ecardKey, lastLoginAt, locationCode, ...) that do not match any column the live query below actually returns (REPORT_DATE, POLICY_NUMBER, EIN, INSUREDNAME, PLANOPTED, ENROLLMENT_COMPLETE, ENROLLED_BY, ... ~28 ALL-CAPS export-style columns). The query was clearly rewritten after the mapping rows were set up and the mappings were never brought back in sync. Every column would show its raw ALL-CAPS alias as the header instead of a friendly label.
-- 2. companyId (section 2) IS a plain 'input' field (not hidden), so this report IS reachable from the generic /report screen if the mapping issue above is fixed.

