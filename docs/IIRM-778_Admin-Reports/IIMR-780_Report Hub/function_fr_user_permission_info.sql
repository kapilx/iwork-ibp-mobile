--SELECT pg_get_functiondef('fr_user_permission_info'::regproc);
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
$function$
