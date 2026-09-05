-- ============================================================================
-- Report: Branch Info
-- name (used in URL/endpoint): org-branch-info    |    id: 14    |    order_no: (none -- sorts last)
-- end_point: org-branch-info
-- created_at: 2025-08-04 09:18:05.213905    updated_at: 
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
-- 1. MAIN QUERY  (admin_reports.query, id = 14)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select organisation_name, branch_name from vr_org_branch where organisation_name = COALESCE(###OrganisationName###,organisation_name) order by organisation_name,branch_name$Q$
--   WHERE id = 14;

select organisation_name, branch_name from vr_org_branch where organisation_name = COALESCE(###OrganisationName###,organisation_name) order by organisation_name,branch_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 14)
-- ------------------------------------------------------------------
-- Filter: Organisation Name
--   parameter_name : organisation_name
--   token in query : ###OrganisationName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct organisation_name as label from vr_org_branch) a) as t order by sort_order, label
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 14)
-- ------------------------------------------------------------------
--   organisation_name            -> Organisation Name              (variable: organisationName, type: string, align: default)
--   vertical_name                -> Vertical Name                  (variable: verticalName, type: string, align: default)
--   department_name              -> Department Name                (variable: departmentName, type: string, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_org_branch
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_org_branch AS
 SELECT org.name AS organisation_name,
    brn.name AS branch_name,
    org.id AS organisation_id,
    brn.id AS branch_id
   FROM (org_branch brn
     JOIN organisation org ON (((org.id = brn.organisation_id) AND (brn.status_lid = 16101))));
-- status_lid = 16101 is the lookup_data id for "Active".

