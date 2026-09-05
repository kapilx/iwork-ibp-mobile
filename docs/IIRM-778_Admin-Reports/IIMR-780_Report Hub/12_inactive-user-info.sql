-- ============================================================================
-- Report: Inactive User Info
-- name (used in URL/endpoint): inactive-user-info    |    id: 12    |    order_no: (none -- sorts last)
-- end_point: inactive-user-info
-- created_at: 2025-08-04 08:41:30.823027    updated_at: 
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
-- 1. MAIN QUERY  (admin_reports.query, id = 12)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select user_name, manager_name, iirm_employee_id, organisation, vertical, department, branch, designation, roles, user_email, manager_email, login, uid, manager_uid from vr_active_user_info where manager_name = COALESCE(###ManagerName###,manager_name) and organisation = COALESCE(###Organisation###,organisation) and vertical = COALESCE(###Vertical###,vertical) and department = COALESCE(###Department###,department) and branch = COALESCE(###Branch###,branch) and designation = COALESCE(###Designation###,designation) order by user_name$Q$
--   WHERE id = 12;

select user_name, manager_name, iirm_employee_id, organisation, vertical, department, branch, designation, roles, user_email, manager_email, login, uid, manager_uid from vr_active_user_info where manager_name = COALESCE(###ManagerName###,manager_name) and organisation = COALESCE(###Organisation###,organisation) and vertical = COALESCE(###Vertical###,vertical) and department = COALESCE(###Department###,department) and branch = COALESCE(###Branch###,branch) and designation = COALESCE(###Designation###,designation) order by user_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 12)
-- ------------------------------------------------------------------
-- Filter: Manager Name
--   parameter_name : managerName
--   token in query : ###ManagerName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct manager_name as label from vr_inactive_user_info) a) as t order by sort_order, label
--
-- Filter: Organisation
--   parameter_name : organisation
--   token in query : ###Organisation###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct organisation as label from vr_inactive_user_info) a) as t order by sort_order, label
--
-- Filter: Vertical
--   parameter_name : vertical
--   token in query : ###Vertical###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct vertical as label from vr_inactive_user_info) a) as t order by sort_order, label
--
-- Filter: Department
--   parameter_name : department
--   token in query : ###Department###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct department as label from vr_inactive_user_info) a) as t order by sort_order, label
--
-- Filter: Branch
--   parameter_name : branch
--   token in query : ###Branch###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct branch as label from vr_inactive_user_info) a) as t order by sort_order, label
--
-- Filter: Designation
--   parameter_name : designation
--   token in query : ###Designation###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct designation as label from vr_inactive_user_info) a) as t order by sort_order, label
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 12)
-- ------------------------------------------------------------------
--   iirm_employee_id             -> IIRM Employee Id               (variable: iirmEmployeeId, type: string, align: default)
--   user_name                    -> User Name                      (variable: userName, type: string, align: default)
--   manager_name                 -> Manager Name                   (variable: managerName, type: string, align: default)
--   organisation                 -> Organisation                   (variable: organisation, type: string, align: default)
--   vertical                     -> Vertical                       (variable: vertical, type: string, align: default)
--   department                   -> Department                     (variable: department, type: string, align: default)
--   branch                       -> Branch                         (variable: branch, type: string, align: default)
--   designation                  -> Designation                    (variable: designation, type: string, align: default)
--   roles                        -> Roles                          (variable: roles, type: string, align: default)
--   user_email                   -> User Email                     (variable: userEmail, type: string, align: default)
--   manager_email                -> Manager Email                  (variable: managerEmail, type: string, align: default)
--   login                        -> Login                          (variable: login, type: string, align: default)
--   uid                          -> User ID                        (variable: uId, type: number, align: default)
--   manager_uid                  -> Manager ID                     (variable: managerUid, type: number, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_active_user_info
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_active_user_info AS
 SELECT (((usr.first_name)::text || ' '::text) || (usr.last_name)::text) AS user_name,
    usr.email_id AS user_email,
    (((mgr.first_name)::text || ' '::text) || (mgr.last_name)::text) AS manager_name,
    mgr.email_id AS manager_email,
    usr.iirm_emp_id AS iirm_employee_id,
    org.name AS organisation,
    orgb.name AS branch,
    orgv.name AS vertical,
    dept.name AS department,
    desg.name AS designation,
    string_agg((rl.name)::text, ', '::text) AS roles,
    usr.login_name AS login,
    usr.id AS uid,
    usr.reporting_user_id AS manager_uid
   FROM (((((((((users usr
     JOIN employee emp ON (((emp.user_id = usr.id) AND ((usr.user_status_key)::text = 'USER_STATUS_ACTIVE'::text))))
     JOIN employee mgr ON ((emp.reporting_manager_employee_id = mgr.id)))
     JOIN organisation org ON ((org.id = emp.organisation_id)))
     JOIN org_vertical orgv ON (((org.id = orgv.organisation_id) AND (emp.vertical_id = orgv.id))))
     JOIN org_department dept ON ((emp.department_id = dept.id)))
     JOIN org_designation desg ON ((emp.designation_id = desg.id)))
     JOIN org_branch orgb ON ((emp.branch_id = orgb.id)))
     JOIN user_role ur ON ((usr.id = ur.user_id)))
     JOIN roles rl ON ((ur.role_id = rl.id)))
  GROUP BY (((usr.first_name)::text || ' '::text) || (usr.last_name)::text), usr.email_id, (((mgr.first_name)::text || ' '::text) || (mgr.last_name)::text), mgr.email_id, org.name, orgv.name, dept.name, orgb.name, usr.login_name, desg.name, usr.id, usr.reporting_user_id
UNION
 SELECT (((usr.first_name)::text || ' '::text) || (usr.last_name)::text) AS user_name,
    usr.email_id AS user_email,
    (((mgr.first_name)::text || ' '::text) || (mgr.last_name)::text) AS manager_name,
    mgr.email_id AS manager_email,
    usr.iirm_emp_id AS iirm_employee_id,
    org.name AS organisation,
    orgb.name AS branch,
    orgv.name AS vertical,
    dept.name AS department,
    desg.name AS designation,
    string_agg((rl.name)::text, ', '::text) AS roles,
    usr.login_name AS login,
    usr.id AS uid,
    usr.reporting_user_id AS manager_uid
   FROM (((((((((users usr
     JOIN employee emp ON (((emp.user_id = usr.id) AND ((usr.user_status_key)::text = 'USER_STATUS_ACTIVE'::text) AND (usr.reporting_user_id IS NULL))))
     LEFT JOIN employee mgr ON ((emp.reporting_manager_employee_id = mgr.id)))
     JOIN organisation org ON ((org.id = emp.organisation_id)))
     JOIN org_vertical orgv ON (((org.id = orgv.organisation_id) AND (emp.vertical_id = orgv.id))))
     JOIN org_department dept ON ((emp.department_id = dept.id)))
     JOIN org_designation desg ON ((emp.designation_id = desg.id)))
     JOIN org_branch orgb ON ((emp.branch_id = orgb.id)))
     JOIN user_role ur ON ((usr.id = ur.user_id)))
     JOIN roles rl ON ((ur.role_id = rl.id)))
  GROUP BY (((usr.first_name)::text || ' '::text) || (usr.last_name)::text), usr.email_id, (((mgr.first_name)::text || ' '::text) || (mgr.last_name)::text), mgr.email_id, org.name, orgv.name, dept.name, orgb.name, usr.login_name, desg.name, usr.id, usr.reporting_user_id;

-- NOTE: "Inactive User Info" (report id 12) SHOULD read from vr_inactive_user_info
-- instead -- that view was never pulled from production (only inferred to exist
-- because this report's own filter dropdowns query it). To fetch it:
--   SELECT definition FROM pg_views WHERE viewname = 'vr_inactive_user_info';

-- ------------------------------------------------------------------
-- 5. KNOWN ISSUES
-- ------------------------------------------------------------------
-- 1. This report's main query still reads FROM vr_active_user_info -- identical to report 11 (Active User Info). Its own filter dropdowns (below) all correctly query vr_inactive_user_info, proving that view exists. FIX: change the FROM clause in section 1 below to vr_inactive_user_info and re-run the UPDATE.

