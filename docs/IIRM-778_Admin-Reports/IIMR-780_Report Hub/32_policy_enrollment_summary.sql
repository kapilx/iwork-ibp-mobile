-- ============================================================================
-- Report: Policy Enrollment Summary
-- name (used in URL/endpoint): policy_enrollment_summary    |    id: 32    |    order_no: 31
-- end_point: policy_enrollment_summary
-- created_at: 2026-05-08 12:06:29.443626    updated_at: 2026-05-08 12:06:29.443626
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
-- 1. MAIN QUERY  (admin_reports.query, id = 32)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH emp_scope AS (
  SELECT COUNT(DISTINCT peepm.employee_id) AS total_employees
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.policy_id = ###policyId### AND peepm.deleted_at IS NULL
),
enroll_status AS (
  SELECT
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key='EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key='EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key='EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee
  WHERE pee.policy_id = ###policyId### AND pee.deleted_at IS NULL
),
dep_scope AS (
  SELECT COUNT(ped.id) AS total_dependents
  FROM policy_enrollment_dependent ped
  WHERE ped.policy_id = ###policyId### AND ped.deleted_at IS NULL
)
SELECT
  es.total_employees                                                                       AS "totalEmployees",
  COALESCE(ds.total_dependents, 0)                                                        AS "totalDependents",
  COALESCE(en.enrolled_count, 0)                                                          AS "enrolledCount",
  COALESCE(en.in_progress_count, 0)                                                       AS "inProgressCount",
  COALESCE(en.not_started_count, 0)                                                       AS "notStartedCount",
  GREATEST(es.total_employees - COALESCE(en.enrolled_count,0), 0)                        AS "notEnrolledCount",
  ROUND(COALESCE(en.enrolled_count,    0)*100.0/NULLIF(es.total_employees,0),1)           AS "enrolledPercent",
  ROUND(COALESCE(en.in_progress_count, 0)*100.0/NULLIF(es.total_employees,0),1)          AS "inProgressPercent",
  ROUND(COALESCE(en.not_started_count, 0)*100.0/NULLIF(es.total_employees,0),1)          AS "notStartedPercent"
FROM emp_scope es
CROSS JOIN enroll_status en
CROSS JOIN dep_scope ds$Q$
--   WHERE id = 32;

WITH emp_scope AS (
  SELECT COUNT(DISTINCT peepm.employee_id) AS total_employees
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.policy_id = ###policyId### AND peepm.deleted_at IS NULL
),
enroll_status AS (
  SELECT
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key='EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key='EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key='EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee
  WHERE pee.policy_id = ###policyId### AND pee.deleted_at IS NULL
),
dep_scope AS (
  SELECT COUNT(ped.id) AS total_dependents
  FROM policy_enrollment_dependent ped
  WHERE ped.policy_id = ###policyId### AND ped.deleted_at IS NULL
)
SELECT
  es.total_employees                                                                       AS "totalEmployees",
  COALESCE(ds.total_dependents, 0)                                                        AS "totalDependents",
  COALESCE(en.enrolled_count, 0)                                                          AS "enrolledCount",
  COALESCE(en.in_progress_count, 0)                                                       AS "inProgressCount",
  COALESCE(en.not_started_count, 0)                                                       AS "notStartedCount",
  GREATEST(es.total_employees - COALESCE(en.enrolled_count,0), 0)                        AS "notEnrolledCount",
  ROUND(COALESCE(en.enrolled_count,    0)*100.0/NULLIF(es.total_employees,0),1)           AS "enrolledPercent",
  ROUND(COALESCE(en.in_progress_count, 0)*100.0/NULLIF(es.total_employees,0),1)          AS "inProgressPercent",
  ROUND(COALESCE(en.not_started_count, 0)*100.0/NULLIF(es.total_employees,0),1)          AS "notStartedPercent"
FROM emp_scope es
CROSS JOIN enroll_status en
CROSS JOIN dep_scope ds

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 32)
-- ------------------------------------------------------------------
-- Filter: Policy ID
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 2
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 32)
-- ------------------------------------------------------------------
--   totalEmployees               -> Total Employees                (variable: totalEmployees, type: number, align: right)
--   totalDependents              -> Total Dependents               (variable: totalDependents, type: number, align: right)
--   enrolledCount                -> Enrolled                       (variable: enrolledCount, type: number, align: right)
--   inProgressCount              -> In Progress                    (variable: inProgressCount, type: number, align: right)
--   notStartedCount              -> Not Started                    (variable: notStartedCount, type: number, align: right)
--   notEnrolledCount             -> Not Enrolled                   (variable: notEnrolledCount, type: number, align: right)
--   enrolledPercent              -> Enrolled (%)                   (variable: enrolledPercent, type: number, align: right)
--   inProgressPercent            -> In Progress (%)                (variable: inProgressPercent, type: number, align: right)
--   notStartedPercent            -> Not Started (%)                (variable: notStartedPercent, type: number, align: right)

