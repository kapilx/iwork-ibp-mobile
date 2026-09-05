-- ============================================================================
-- Report: Policy Enrollment Period Status Summary
-- name (used in URL/endpoint): policy_enrollment_period_status_summary    |    id: 62    |    order_no: 33
-- end_point: policy_enrollment_period_status_summary
-- created_at: 2026-07-13 12:33:36.282489    updated_at: 2026-07-13 12:33:36.282489
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
-- 1. MAIN QUERY  (admin_reports.query, id = 62)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH period_scope AS (
  -- One row per (enrollment_start_date, enrollment_end_date, policy) — merges
  -- every document_processing_file batch that shares the same policy and the
  -- same dates, since re-uploads/multiple batches for one policy's window are
  -- the same enrollment period, not separate ones.
  SELECT
    MIN(dpf.id)                          AS period_id,
    ARRAY_AGG(DISTINCT dpf.id)            AS period_ids,
    ARRAY_AGG(DISTINCT dpf.document_id)   AS batch_document_ids,
    dpf.enrollment_start_date,
    dpf.enrollment_end_date,
    e.policy_id,
    e.company_id
  FROM document_processing_file dpf
  INNER JOIN endorsement e ON e.id = dpf.endorsement_id
  WHERE e.company_id = ###companyId###
    AND dpf.enrollment_start_date IS NOT NULL
    AND dpf.enrollment_end_date IS NOT NULL
    -- Currently-running drives only: must have already started (start_date
    -- <= today) AND not yet closed (end_date >= today). A period whose end
    -- date has already passed is excluded (nothing left to enroll/remind
    -- for), and a period that hasn't started yet is excluded too — this
    -- report is "what's active right now", not "what's upcoming".
    AND dpf.enrollment_start_date <= CURRENT_DATE
    AND dpf.enrollment_end_date >= CURRENT_DATE
  GROUP BY dpf.enrollment_start_date, dpf.enrollment_end_date, e.policy_id, e.company_id
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
   AND pepm.enrollment_addition_batch_id = ANY(ps.batch_document_ids)
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
  ps.period_ids                                                                             AS "periodIds",
  TO_CHAR(ps.enrollment_start_date, 'YYYY-MM-DD')                                          AS "periodStart",
  TO_CHAR(ps.enrollment_end_date, 'YYYY-MM-DD')                                             AS "periodEnd",
  p.id                                                                                      AS "policyId",
  p.policy_name                                                                             AS "policyName",
  p.insurer_policy_number                                                                   AS "policyNumber",
  COUNT(DISTINCT pe2.employee_id)::int                                                      AS "total",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE pe2.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
  )::int                                                                                     AS "enrolled",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE pe2.employee_enrollment_status_key IN (
      'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS', 'EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT'
    )
  )::int                                                                                     AS "inProgress",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE COALESCE(pe2.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED')
        = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'
  )::int                                                                                     AS "notEnrolled"
FROM period_employees pe2
INNER JOIN period_scope ps ON ps.period_id = pe2.period_id AND ps.policy_id = pe2.policy_id
LEFT JOIN policy p ON p.id = pe2.policy_id
GROUP BY ps.period_id, ps.period_ids, ps.enrollment_start_date, ps.enrollment_end_date, p.id, p.policy_name, p.insurer_policy_number
ORDER BY ps.enrollment_start_date ASC, p.policy_name$Q$
--   WHERE id = 62;

WITH period_scope AS (
  -- One row per (enrollment_start_date, enrollment_end_date, policy) — merges
  -- every document_processing_file batch that shares the same policy and the
  -- same dates, since re-uploads/multiple batches for one policy's window are
  -- the same enrollment period, not separate ones.
  SELECT
    MIN(dpf.id)                          AS period_id,
    ARRAY_AGG(DISTINCT dpf.id)            AS period_ids,
    ARRAY_AGG(DISTINCT dpf.document_id)   AS batch_document_ids,
    dpf.enrollment_start_date,
    dpf.enrollment_end_date,
    e.policy_id,
    e.company_id
  FROM document_processing_file dpf
  INNER JOIN endorsement e ON e.id = dpf.endorsement_id
  WHERE e.company_id = ###companyId###
    AND dpf.enrollment_start_date IS NOT NULL
    AND dpf.enrollment_end_date IS NOT NULL
    -- Currently-running drives only: must have already started (start_date
    -- <= today) AND not yet closed (end_date >= today). A period whose end
    -- date has already passed is excluded (nothing left to enroll/remind
    -- for), and a period that hasn't started yet is excluded too — this
    -- report is "what's active right now", not "what's upcoming".
    AND dpf.enrollment_start_date <= CURRENT_DATE
    AND dpf.enrollment_end_date >= CURRENT_DATE
  GROUP BY dpf.enrollment_start_date, dpf.enrollment_end_date, e.policy_id, e.company_id
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
   AND pepm.enrollment_addition_batch_id = ANY(ps.batch_document_ids)
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
  ps.period_ids                                                                             AS "periodIds",
  TO_CHAR(ps.enrollment_start_date, 'YYYY-MM-DD')                                          AS "periodStart",
  TO_CHAR(ps.enrollment_end_date, 'YYYY-MM-DD')                                             AS "periodEnd",
  p.id                                                                                      AS "policyId",
  p.policy_name                                                                             AS "policyName",
  p.insurer_policy_number                                                                   AS "policyNumber",
  COUNT(DISTINCT pe2.employee_id)::int                                                      AS "total",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE pe2.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
  )::int                                                                                     AS "enrolled",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE pe2.employee_enrollment_status_key IN (
      'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS', 'EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT'
    )
  )::int                                                                                     AS "inProgress",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE COALESCE(pe2.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED')
        = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'
  )::int                                                                                     AS "notEnrolled"
FROM period_employees pe2
INNER JOIN period_scope ps ON ps.period_id = pe2.period_id AND ps.policy_id = pe2.policy_id
LEFT JOIN policy p ON p.id = pe2.policy_id
GROUP BY ps.period_id, ps.period_ids, ps.enrollment_start_date, ps.enrollment_end_date, p.id, p.policy_name, p.insurer_policy_number
ORDER BY ps.enrollment_start_date ASC, p.policy_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 62)
-- ------------------------------------------------------------------
-- Filter: Company
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : hidden
--   >>> HIDDEN field -- the generic /report screen cannot render an input for this.
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 62)
-- ------------------------------------------------------------------
--   periodId                     -> Period ID                      (variable: periodId, type: number, align: right)
--   periodStart                  -> Period Start                   (variable: periodStart, type: date, align: left)
--   periodEnd                    -> Period End                     (variable: periodEnd, type: date, align: left)
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   policyName                   -> Policy Name                    (variable: policyName, type: string, align: left)
--   policyNumber                 -> Policy Number                  (variable: policyNumber, type: string, align: left)
--   total                        -> Total                          (variable: total, type: number, align: right)
--   enrolled                     -> Enrolled                       (variable: enrolled, type: number, align: right)
--   inProgress                   -> In Progress                    (variable: inProgress, type: number, align: right)
--   notEnrolled                  -> Not Enrolled                   (variable: notEnrolled, type: number, align: right)

-- ------------------------------------------------------------------
-- 5. KNOWN ISSUES
-- ------------------------------------------------------------------
-- 1. companyId -- this report's only filter -- is configured input_field_type = 'hidden' in admin_reports_parameters (section 2). Same problem as report 60/59: unreachable from the generic screen.

