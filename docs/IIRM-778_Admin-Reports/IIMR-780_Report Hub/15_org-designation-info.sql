-- ============================================================================
-- Report: Designation Info
-- name (used in URL/endpoint): org-designation-info    |    id: 15    |    order_no: (none -- sorts last)
-- end_point: org-designation-info
-- created_at: 2025-08-04 09:18:05.220316    updated_at: 
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
-- 1. MAIN QUERY  (admin_reports.query, id = 15)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select designation_name, grade_level from vr_org_designation order by grade_level$Q$
--   WHERE id = 15;

select designation_name, grade_level from vr_org_designation order by grade_level

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 15)
-- ------------------------------------------------------------------
-- (no filters -- this report runs unfiltered every time)

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 15)
-- ------------------------------------------------------------------
--   designation_name             -> Designation Name               (variable: designationName, type: string, align: default)
--   grade_level                  -> Grade Level                    (variable: grade_level, type: number, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_org_designation
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_org_designation AS
 SELECT org.name AS organisation_name,
    desg.name AS designation_name,
    desg.grade_level,
    org.id AS organisation_id,
    desg.id AS designation_id
   FROM (org_designation desg
     JOIN organisation org ON ((org.id = desg.organisation_id)))
  WHERE (desg.status_lid = 16101)
  ORDER BY org.name, desg.grade_level;
-- status_lid = 16101 is the lookup_data id for "Active".

