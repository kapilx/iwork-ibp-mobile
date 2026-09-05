-- ============================================================================
-- Report: User Permission Info
-- name (used in URL/endpoint): user-permission-info    |    id: 16    |    order_no: (none -- sorts last)
-- end_point: user-permission-info
-- created_at: 2025-11-27 11:00:25.457035    updated_at: 
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
-- 1. MAIN QUERY  (admin_reports.query, id = 16)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select user_name, user_email, permitted_function_name, permitted_action_name from fr_user_permission_info (###UserName###, ###UserEmail###, ###PermittedFunctionName###, ###PermittedActionName###)$Q$
--   WHERE id = 16;

select user_name, user_email, permitted_function_name, permitted_action_name from fr_user_permission_info (###UserName###, ###UserEmail###, ###PermittedFunctionName###, ###PermittedActionName###)

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 16)
-- ------------------------------------------------------------------
-- Filter: User Name
--   parameter_name : userName
--   token in query : ###UserName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct user_name as label from fr_user_permission_info(NULL, NULL, NULL, NULL)) a) as t order by sort_order, label
--
-- Filter: User Email
--   parameter_name : userEmail
--   token in query : ###UserEmail###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct user_email as label from fr_user_permission_info(NULL, NULL, NULL, NULL)) a) as t order by sort_order, label
--
-- Filter: Permitted Function Name
--   parameter_name : permittedFunctionName
--   token in query : ###PermittedFunctionName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct permitted_function_name as label from fr_user_permission_info(NULL, NULL, NULL, NULL)) a) as t order by sort_order, label
--
-- Filter: Permitted Action Name
--   parameter_name : permittedActionName
--   token in query : ###PermittedActionName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct permitted_action_name as label from fr_user_permission_info(NULL, NULL, NULL, NULL)) a) as t order by sort_order, label
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 16)
-- ------------------------------------------------------------------
--   user_name                    -> User Name                      (variable: userName, type: string, align: default)
--   user_email                   -> User Email                     (variable: userEmail, type: string, align: default)
--   permitted_function_name      -> Permitted Function Name        (variable: permittedFunctionName, type: string, align: default)
--   permitted_action_name        -> Permitted Action Name          (variable: permittedActionName, type: string, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING FUNCTION DEFINITION: fr_user_permission_info
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fr_user_permission_info(p_user_name character varying, p_user_email character varying, p_permitted_function_name character varying, p_permitted_action_name character varying)
 RETURNS TABLE(user_name text, user_email character varying, permitted_function_name character varying, permitted_action_name character varying, ref character varying, user_id integer, employee_id integer, action_id integer, function_id integer, role_ids text)
 LANGUAGE sql
AS $function$
select
    distinct
    TRIM(BOTH FROM (usr.first_name::text || ' '::text) || usr.last_name::text) AS user_name,
    usr.email_id as user_email,
    aclcat.name AS permitted_function_name,
    aclact.name AS permitted_action_name,
    ' -- ' as ref,
    usr.id as user_id,
    emp.id as employee_id,
    aclact.id as action_id,
    aclcat.id as function_id,
    string_agg(rl.id::text, ', '::text) AS role_ids
from
    acl_category_action_map aclcatactmap
        INNER JOIN acl_categories aclcat ON aclcatactmap.acl_category_id = aclcat.id
        INNER JOIN acl_actions aclact ON aclcatactmap.acl_action_id = aclact.id
        INNER JOIN role_acl_category_action_map rlaclmap ON rlaclmap.acl_category_action_id = aclcatactmap.id
        INNER JOIN roles rl ON rlaclmap.role_id = rl.id
        INNER JOIN user_role url ON rl.id = url.role_id
        INNER JOIN users usr ON url.user_id = usr.id and usr.user_type_key in ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')
        INNER JOIN employee emp ON emp.user_id = usr.id
where 1 = 1
    and TRIM(BOTH FROM (usr.first_name::text || ' '::text) || usr.last_name::text) ilike coalesce(p_user_name, TRIM(BOTH FROM (usr.first_name::text || ' '::text) || usr.last_name::text))
    and usr.email_id ilike coalesce(p_user_email, usr.email_id)
    and aclcat.name ilike coalesce(p_permitted_function_name, aclcat.name)
    and aclact.name ilike coalesce(p_permitted_action_name, aclact.name)
group by
    TRIM(BOTH FROM (usr.first_name::text || ' '::text) || usr.last_name::text),
    usr.email_id,
    aclcat.name,
    aclact.name,
    usr.id,
    emp.id,
    aclact.id,
    aclcat.id
order by usr.email_id, aclcat.name, aclact.id
$function$;
-- NOTE: unlike every sibling report in this cluster, all four filters here
-- use ILIKE (case-insensitive partial-text match) rather than exact-match
-- COALESCE -- confirm this is a deliberate usability choice.

