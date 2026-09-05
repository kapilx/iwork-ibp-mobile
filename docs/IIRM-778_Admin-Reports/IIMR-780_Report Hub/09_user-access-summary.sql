-- ============================================================================
-- Report: User Access Summary
-- name (used in URL/endpoint): user-access-summary    |    id: 9    |    order_no: (none -- sorts last)
-- end_point: user-access-summary
-- created_at: 2025-08-02 09:30:56.475201    updated_at: 
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
-- 1. MAIN QUERY  (admin_reports.query, id = 9)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select create_by, operation, count(1) as attempts from vr_user_access where created_at::date BETWEEN ###START_DATE###::date and ###END_DATE###::date group by create_by, operation order by create_by;$Q$
--   WHERE id = 9;

select create_by, operation, count(1) as attempts from vr_user_access where created_at::date BETWEEN ###START_DATE###::date and ###END_DATE###::date group by create_by, operation order by create_by;

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 9)
-- ------------------------------------------------------------------
-- Filter: Start Date
--   parameter_name : startDate
--   token in query : ###START_DATE###
--   data_type      : date
--   input_field    : (none -- likely unusable from the UI)
--
-- Filter: End Date
--   parameter_name : endDate
--   token in query : ###END_DATE###
--   data_type      : date
--   input_field    : (none -- likely unusable from the UI)
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 9)
-- ------------------------------------------------------------------
--   operation                    -> Action                         (variable: operation, type: string, align: default)
--   attempts                     -> # of Attempts                  (variable: attempts, type: number, align: default)
--   create_by                    -> Performed By                   (variable: createdBy, type: string, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_user_access
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_user_access AS
 SELECT ahl.entity_type,
    ahl.action AS operation,
    ((((((usr.first_name)::text || ' '::text) || (usr.last_name)::text) || ' ('::text) || (usr.email_id)::text) || ')'::text) AS create_by,
    ahl.created_at
   FROM (audit_history_log ahl
     JOIN users usr ON ((usr.id = (ahl.user_id)::bigint)))
  WHERE ((ahl.action)::text = ANY (ARRAY[('LOGIN'::character varying)::text, ('PASSWORD-RESET'::character varying)::text]));
-- Only LOGIN and PASSWORD-RESET actions are ever in this view -- it is a
-- security/access log, not a general audit trail.

