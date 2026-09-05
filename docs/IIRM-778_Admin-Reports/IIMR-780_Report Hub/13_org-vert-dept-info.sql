-- ============================================================================
-- Report: Vertical Department Info
-- name (used in URL/endpoint): org-vert-dept-info    |    id: 13    |    order_no: (none -- sorts last)
-- end_point: org-vert-dept-info
-- created_at: 2025-08-04 09:20:15.309411    updated_at: 
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
-- 1. MAIN QUERY  (admin_reports.query, id = 13)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select organisation_name, vertical_name, department_name from vr_org_vertical_department where organisation_name = COALESCE(###OrganisationName###,organisation_name) and vertical_name = COALESCE(###VerticalName###,vertical_name) order by organisation_name, vertical_name, department_name$Q$
--   WHERE id = 13;

select organisation_name, vertical_name, department_name from vr_org_vertical_department where organisation_name = COALESCE(###OrganisationName###,organisation_name) and vertical_name = COALESCE(###VerticalName###,vertical_name) order by organisation_name, vertical_name, department_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 13)
-- ------------------------------------------------------------------
-- Filter: Organisation Name
--   parameter_name : organisation_name
--   token in query : ###OrganisationName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct organisation_name as label from vr_org_vertical_department) a) as t order by sort_order, label
--
-- Filter: Vertical Name
--   parameter_name : vertical_name
--   token in query : ###VerticalName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct vertical_name as label from vr_org_vertical_department) a) as t order by sort_order, label
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 13)
-- ------------------------------------------------------------------
--   organisation_name            -> Organisation Name              (variable: organisationName, type: string, align: default)
--   vertical_name                -> Vertical Name                  (variable: verticalName, type: string, align: default)
--   department_name              -> Department Name                (variable: departmentName, type: string, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_org_vertical_department
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_org_vertical_department AS
 SELECT org.name AS organisation_name,
    sbu.name AS sbu_name,
    ver.name AS vertical_name,
    dept.name AS department_name,
    org.id AS organisation_id,
    sbu.id AS sbu_id,
    ver.id AS vertical_id,
    dept.id AS department_id
   FROM (((organisation org
     JOIN org_sbu sbu ON (((sbu.organisation_id = org.id) AND (sbu.status_lid = 16101))))
     JOIN org_vertical ver ON (((org.id = ver.organisation_id) AND (sbu.id = ver.sbu_id) AND (ver.status_lid = 16101))))
     JOIN org_department dept ON (((ver.id = dept.vertical_id) AND (dept.status_lid = 16101))))
  ORDER BY org.name, sbu.name, ver.name, dept.name;
-- NOTE: this view computes sbu_name too, but the "Vertical Department Info"
-- report's own SELECT list never pulls it -- confirm whether that's intentional.

