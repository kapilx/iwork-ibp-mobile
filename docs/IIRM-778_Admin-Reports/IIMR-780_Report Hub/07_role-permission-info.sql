-- ============================================================================
-- Report: Role Permission Info
-- name (used in URL/endpoint): role-permission-info    |    id: 7    |    order_no: (none -- sorts last)
-- end_point: role-permission-info
-- created_at: 2025-07-23 19:50:39.386826    updated_at: 2025-07-23 19:50:39.386826
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
-- 1. MAIN QUERY  (admin_reports.query, id = 7)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select function_name, action_name, permitted_role_name from vr_role_permission_info 
where function_name = COALESCE(###FunctionName###,function_name) and action_name = COALESCE(###ActionName### ,action_name) and permitted_role_name = COALESCE(###PermittedRoleName###  ,permitted_role_name) order by function_name, action_name, permitted_role_name$Q$
--   WHERE id = 7;

select function_name, action_name, permitted_role_name from vr_role_permission_info 
where function_name = COALESCE(###FunctionName###,function_name) and action_name = COALESCE(###ActionName### ,action_name) and permitted_role_name = COALESCE(###PermittedRoleName###  ,permitted_role_name) order by function_name, action_name, permitted_role_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 7)
-- ------------------------------------------------------------------
-- Filter: Function Name
--   parameter_name : functionName
--   token in query : ###FunctionName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select * from (select 'All' as label, '#99#' as value, 0 as sort_order union select distinct function_name as label, function_name as value, 1 as sort_order from public.vr_role_permission_info) as t order by sort_order, label
--
-- Filter: Action Name
--   parameter_name : actionName
--   token in query : ###ActionName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select * from (select 'All' as label, '#99#' as value, 0 as sort_order union select distinct action_name as label, action_name as value, 1 as sort_order from public.vr_role_permission_info) as t order by sort_order, label
--
-- Filter: Permitted Role Name
--   parameter_name : permittedRoleName
--   token in query : ###PermittedRoleName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select * from (select 'All' as label, '#99#' as value, 0 as sort_order union select distinct permitted_role_name as label, permitted_role_name as value, 1 as sort_order from public.vr_role_permission_info) as t order by sort_order, label
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 7)
-- ------------------------------------------------------------------
--   function_name                -> Function Name                  (variable: functionName, type: string, align: default)
--   action_name                  -> Action Name                    (variable: actionName, type: string, align: default)
--   permitted_role_name          -> Permitted Role Name            (variable: permittedRoleName, type: string, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_role_permission_info
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_role_permission_info AS
 SELECT aclcat.name AS function_name,
    aclact.name AS action_name,
    rl.name AS permitted_role_name,
    ' -- '::text AS reference,
    rlaclmap.id AS rolefunctionaction_mapping_id,
    aclcatactmap.id AS functionaction_mapping_id,
    aclcat.id AS function_id,
    aclact.id AS action_id,
    rl.id AS role_id
   FROM ((((acl_category_action_map aclcatactmap
     JOIN acl_categories aclcat ON ((aclcatactmap.acl_category_id = aclcat.id)))
     JOIN acl_actions aclact ON ((aclcatactmap.acl_action_id = aclact.id)))
     JOIN role_acl_category_action_map rlaclmap ON ((rlaclmap.acl_category_action_id = aclcatactmap.id)))
     JOIN roles rl ON ((rlaclmap.role_id = rl.id)));

