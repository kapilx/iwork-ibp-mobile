-- ============================================================================
-- Report: Policy Enrollment Periods
-- name (used in URL/endpoint): policy_enrollment_periods    |    id: 59    |    order_no: 30
-- end_point: policy_enrollment_periods
-- created_at: 2026-07-02 15:04:22.700103    updated_at: 2026-07-02 15:04:22.700103
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
-- 1. MAIN QUERY  (admin_reports.query, id = 59)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
    dpf.id                                            AS "periodId",
    e.is_inception                                    AS "isInception",
    e.endorsement_type                                AS "endorsementType",
    e.os_ticket_number                                AS "osTicketNumber",
    TO_CHAR(dpf.enrollment_start_date, 'DD-MM-YYYY')  AS "enrollmentStartDate",
    TO_CHAR(dpf.enrollment_end_date, 'DD-MM-YYYY')    AS "enrollmentEndDate",
    (
      CASE WHEN e.is_inception THEN 'Inception' ELSE COALESCE(e.endorsement_type, 'Endorsement') END
      || ' — ' || TO_CHAR(dpf.enrollment_start_date, 'DD Mon YYYY')
      || ' to ' || TO_CHAR(dpf.enrollment_end_date, 'DD Mon YYYY')
      || COALESCE(' (' || e.os_ticket_number || ')', '')
    )                                                  AS "label"
FROM document_processing_file dpf
INNER JOIN endorsement e ON e.id = dpf.endorsement_id
WHERE e.policy_id = ###policyId###
ORDER BY dpf.enrollment_start_date DESC NULLS LAST, dpf.created_at DESC$Q$
--   WHERE id = 59;

SELECT
    dpf.id                                            AS "periodId",
    e.is_inception                                    AS "isInception",
    e.endorsement_type                                AS "endorsementType",
    e.os_ticket_number                                AS "osTicketNumber",
    TO_CHAR(dpf.enrollment_start_date, 'DD-MM-YYYY')  AS "enrollmentStartDate",
    TO_CHAR(dpf.enrollment_end_date, 'DD-MM-YYYY')    AS "enrollmentEndDate",
    (
      CASE WHEN e.is_inception THEN 'Inception' ELSE COALESCE(e.endorsement_type, 'Endorsement') END
      || ' — ' || TO_CHAR(dpf.enrollment_start_date, 'DD Mon YYYY')
      || ' to ' || TO_CHAR(dpf.enrollment_end_date, 'DD Mon YYYY')
      || COALESCE(' (' || e.os_ticket_number || ')', '')
    )                                                  AS "label"
FROM document_processing_file dpf
INNER JOIN endorsement e ON e.id = dpf.endorsement_id
WHERE e.policy_id = ###policyId###
ORDER BY dpf.enrollment_start_date DESC NULLS LAST, dpf.created_at DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 59)
-- ------------------------------------------------------------------
-- Filter: Policy
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : number
--   input_field    : hidden
--   >>> HIDDEN field -- the generic /report screen cannot render an input for this.
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 59)
-- ------------------------------------------------------------------
--   periodId                     -> Period ID                      (variable: periodId, type: number, align: right)
--   isInception                  -> Is Inception                   (variable: isInception, type: boolean, align: left)
--   endorsementType              -> Endorsement Type               (variable: endorsementType, type: string, align: left)
--   osTicketNumber               -> OS Ticket Number               (variable: osTicketNumber, type: string, align: left)
--   enrollmentStartDate          -> Enrollment Start Date          (variable: enrollmentStartDate, type: date, align: left)
--   enrollmentEndDate            -> Enrollment End Date            (variable: enrollmentEndDate, type: date, align: left)
--   label                        -> Label                          (variable: label, type: string, align: left)

-- ------------------------------------------------------------------
-- 5. KNOWN ISSUES
-- ------------------------------------------------------------------
-- 1. policyId -- this report's only filter -- is configured input_field_type = 'hidden' in admin_reports_parameters (section 2). Same problem as report 60: unreachable from the generic screen.

