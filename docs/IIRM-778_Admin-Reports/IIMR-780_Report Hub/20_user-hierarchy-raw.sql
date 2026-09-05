-- ============================================================================
-- Report: User Hierarchy Raw
-- name (used in URL/endpoint): user-hierarchy-raw    |    id: 20    |    order_no: (none -- sorts last)
-- end_point: user-hierarchy-raw
-- created_at: 2025-08-26 12:21:11.012933    updated_at: 
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
-- 1. MAIN QUERY  (admin_reports.query, id = 20)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select employee_id, employee_name, manager_id, manager_name, skip_level, relationship, hierarchy, hierarchy_path, visual_hierarchy from vr_user_hierarchy_raw where employee_name = COALESCE(###EmployeeName###,employee_name) and manager_name = COALESCE(###ManagerName###,manager_name) and hierarchy = COALESCE(###Hierarchy###,hierarchy) order by employee_name$Q$
--   WHERE id = 20;

select employee_id, employee_name, manager_id, manager_name, skip_level, relationship, hierarchy, hierarchy_path, visual_hierarchy from vr_user_hierarchy_raw where employee_name = COALESCE(###EmployeeName###,employee_name) and manager_name = COALESCE(###ManagerName###,manager_name) and hierarchy = COALESCE(###Hierarchy###,hierarchy) order by employee_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 20)
-- ------------------------------------------------------------------
-- Filter: employeeName
--   parameter_name : employeeName
--   token in query : ###EmployeeName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct manager_name as label from vr_user_hierarchy_raw) a) as t order by sort_order, label
--
-- Filter: Manager Name
--   parameter_name : managerName
--   token in query : ###ManagerName###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct employee_name as label from vr_user_hierarchy_raw) a) as t order by sort_order, label
--
-- Filter: Hierarchy
--   parameter_name : hierarchy
--   token in query : ###Hierarchy###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct hierarchy as label from vr_user_hierarchy_raw) a) as t order by sort_order, label
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 20)
-- ------------------------------------------------------------------
--   employee_id                  -> Employee Id                    (variable: employeeId, type: number, align: default)
--   employee_name                -> Employee Name                  (variable: employeeName, type: string, align: default)
--   manager_id                   -> Manager ID                     (variable: managerId, type: number, align: default)
--   manager_name                 -> Manager Name                   (variable: managerName, type: string, align: default)
--   skip_level                   -> Skip Level                     (variable: skipLevel, type: number, align: default)
--   relationship                 -> Relationship                   (variable: relationship, type: string, align: default)
--   hierarchy                    -> Hierarchy                      (variable: hierarchy, type: string, align: default)
--   hierarchy_path               -> Hierarchy Path                 (variable: hierarchyPath, type: string, align: default)
--   visual_hierarchy             -> Visual Hierarchy               (variable: visualHierarchy, type: string, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_user_hierarchy_raw
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_user_hierarchy_raw AS
 WITH RECURSIVE hierarchy_up AS (
         SELECT users.id,
            users.id AS original_user_id,
            users.first_name,
            users.reporting_user_id,
            0 AS level,
            (users.first_name)::text AS path,
            'Self'::text AS direction,
            users.organisation_id,
            users.organisation_id AS mgr_organisation_id
           FROM users
          WHERE ((users.user_type_key)::text = ANY (ARRAY[('USER_TYPE_IIRM_EMPLOYEE'::character varying)::text, ('USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE'::character varying)::text]))
        UNION ALL
         SELECT u.id,
            h.original_user_id,
            u.first_name,
            u.reporting_user_id,
            (h.level + 1),
            (((u.first_name)::text || ' -> '::text) || h.path),
            'Manager'::text AS direction,
            h.organisation_id,
            u.organisation_id AS mgr_organisation_id
           FROM (users u
             JOIN hierarchy_up h ON (((h.reporting_user_id = u.id) AND ((u.user_type_key)::text = ANY (ARRAY[('USER_TYPE_IIRM_EMPLOYEE'::character varying)::text, ('USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE'::character varying)::text])))))
        ), hierarchy_down AS (
         SELECT users.id,
            users.id AS original_user_id,
            users.first_name,
            users.reporting_user_id,
            0 AS level,
            (users.first_name)::text AS path,
            'Reportee'::text AS direction,
            users.organisation_id,
            users.organisation_id AS mgr_organisation_id
           FROM users
          WHERE ((users.user_type_key)::text = ANY (ARRAY[('USER_TYPE_IIRM_EMPLOYEE'::character varying)::text, ('USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE'::character varying)::text]))
        UNION ALL
         SELECT u.id,
            h.original_user_id,
            u.first_name,
            u.reporting_user_id,
            (h.level - 1),
            ((h.path || ' -> '::text) || (u.first_name)::text),
            'Reportee'::text AS direction,
            h.organisation_id,
            u.organisation_id AS mgr_organisation_id
           FROM (users u
             JOIN hierarchy_down h ON (((u.reporting_user_id = h.id) AND ((u.user_type_key)::text = ANY (ARRAY[('USER_TYPE_IIRM_EMPLOYEE'::character varying)::text, ('USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE'::character varying)::text])))))
        )
 SELECT organisation_id AS manager_organisation_id,
    original_user_id AS manager_id,
    ( SELECT TRIM(BOTH FROM (((users.first_name)::text || ' '::text) || (users.last_name)::text)) AS btrim
           FROM users
          WHERE (users.id = combined.original_user_id)) AS manager_name,
    mgr_organisation_id AS employee_organisation_id,
    ( SELECT TRIM(BOTH FROM (((users.first_name)::text || ' '::text) || (users.last_name)::text)) AS btrim
           FROM users
          WHERE (users.id = combined.id)) AS employee_id,
    first_name AS employee_name,
    level AS skip_level,
        CASE
            WHEN (level > 0) THEN (('Manager (Level '::text || level) || ')'::text)
            WHEN (level = 0) THEN 'Self'::text
            ELSE (('Reportee (Level '::text || abs(level)) || ')'::text)
        END AS relationship,
    direction AS hierarchy,
    path AS hierarchy_path,
        CASE
            WHEN (level > 0) THEN (repeat('â '::text, level) || (first_name)::text)
            WHEN (level = 0) THEN ('â '::text || (first_name)::text)
            ELSE (repeat('â '::text, abs(level)) || (first_name)::text)
        END AS visual_hierarchy
   FROM ( SELECT hierarchy_up.id,
            hierarchy_up.original_user_id,
            hierarchy_up.first_name,
            hierarchy_up.reporting_user_id,
            hierarchy_up.level,
            hierarchy_up.path,
            hierarchy_up.direction,
            hierarchy_up.organisation_id,
            hierarchy_up.mgr_organisation_id
           FROM hierarchy_up
          WHERE (hierarchy_up.level >= 0)
        UNION ALL
         SELECT hierarchy_down.id,
            hierarchy_down.original_user_id,
            hierarchy_down.first_name,
            hierarchy_down.reporting_user_id,
            hierarchy_down.level,
            hierarchy_down.path,
            hierarchy_down.direction,
            hierarchy_down.organisation_id,
            hierarchy_down.mgr_organisation_id
           FROM hierarchy_down
          WHERE (hierarchy_down.level < 0)) combined
  ORDER BY original_user_id,
        CASE direction
            WHEN 'Manager'::text THEN 1
            WHEN 'Self'::text THEN 2
            WHEN 'Reportee'::text THEN 3
            ELSE NULL::integer
        END, level DESC, ( SELECT TRIM(BOTH FROM (((users.first_name)::text || ' '::text) || (users.last_name)::text)) AS btrim
           FROM users
          WHERE (users.id = combined.original_user_id));
-- NOTE: repeat('â ', level) -- the â character is a confirmed encoding
-- bug. It was almost certainly a box-drawing or arrow character at authoring
-- time (e.g. an indent glyph for the tree display) and is now permanently
-- mis-encoded in this stored view definition.

