-- ============================================================================
-- Report: IBP HR Employee Listing Count
-- name (used in URL/endpoint): ibp_hr_employee_listing_count    |    id: 66    |    order_no: 9999
-- end_point: ibp_hr_employee_listing_count
-- created_at: 2026-07-15 04:43:11.872222    updated_at: 2026-07-15 04:43:11.872222
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
-- 1. MAIN QUERY  (admin_reports.query, id = 66)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH base_employees AS (
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
)$Q$
--   WHERE id = 66;

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

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 66)
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
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 66)
-- ------------------------------------------------------------------
-- (no result mappings configured -- every column falls back to its raw query alias)

