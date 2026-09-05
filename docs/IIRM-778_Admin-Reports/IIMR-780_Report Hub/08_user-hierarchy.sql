-- ============================================================================
-- Report: User Hierarchy
-- name (used in URL/endpoint): user-hierarchy    |    id: 8    |    order_no: (none -- sorts last)
-- end_point: user-hierarchy
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
-- 1. MAIN QUERY  (admin_reports.query, id = 8)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select employee_from, hierarchy, employee_to, from_reference_status, to_reference_status, from_reference_id, to_reference_id from vr_user_hierarchy where hierarchy = COALESCE(###HIERARCHY###,hierarchy) and from_reference_status = COALESCE(###FromReferenceStatus### ,from_reference_status) and to_reference_status = COALESCE(###ToReferenceStatus###  ,to_reference_status) ORDER BY employee_from DESC$Q$
--   WHERE id = 8;

select employee_from, hierarchy, employee_to, from_reference_status, to_reference_status, from_reference_id, to_reference_id from vr_user_hierarchy where hierarchy = COALESCE(###HIERARCHY###,hierarchy) and from_reference_status = COALESCE(###FromReferenceStatus### ,from_reference_status) and to_reference_status = COALESCE(###ToReferenceStatus###  ,to_reference_status) ORDER BY employee_from DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 8)
-- ------------------------------------------------------------------
-- Filter: To Reference Status
--   parameter_name : to_reference_status
--   token in query : ###ToReferenceStatus###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select * from (select 'All' as label, '#99#' as value, 0 as sort_order union select distinct to_reference_status as label, to_reference_status as value,1 as sort_order from public.vr_user_hierarchy) as t order by sort_order, label
--
-- Filter: From Reference Status
--   parameter_name : from_reference_status
--   token in query : ###FromReferenceStatus###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select * from (select 'All' as label, '#99#' as value, 0 as sort_order union select distinct from_reference_status as label, from_reference_status as value, 1 as sort_order from public.vr_user_hierarchy) as t order by sort_order, label
--
-- Filter: Hierarchy
--   parameter_name : hierarchy
--   token in query : ###HIERARCHY###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options (static): {"data":[{"label":"All","value":"#99#"},{"label":"Reportees","value":"Reportees"},{"label":"Higher Ups","value":"Higher Ups"}]}
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 8)
-- ------------------------------------------------------------------
--   employee_from                -> Employee (Source)              (variable: employeeFrom, type: string, align: default)
--   hierarchy                    -> Hierarchy Type                 (variable: hierarchy, type: string, align: default)
--   employee_to                  -> Employee (Target)              (variable: employee_to, type: string, align: default)
--   from_reference_status        -> Status (Source Employee)       (variable: from_reference_status, type: string, align: default)
--   to_reference_status          -> Status (Target Employee)       (variable: to_reference_status, type: string, align: default)
--   from_reference_id            -> User ID (Source Employee)      (variable: from_reference_id, type: number, align: default)
--   to_reference_id              -> User ID (Target Employee)      (variable: to_reference_id, type: number, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_user_hierarchy
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_user_hierarchy AS
 SELECT ((((((usr.first_name)::text || ''::text) || (usr.last_name)::text) || ' ('::text) || (usr.email_id)::text) || ')'::text) AS employee_from,
    'Higher Ups'::text AS hierarchy,
    ((((((mgr.first_name)::text || ''::text) || (mgr.last_name)::text) || ' ('::text) || (mgr.email_id)::text) || ')'::text) AS employee_to,
    usr.id AS from_reference_id,
    mgr.id AS to_reference_id,
    usrsld.value AS from_reference_status,
    mgrsld.value AS to_reference_status
   FROM ((((employee_hierarchy eh
     JOIN users usr ON ((usr.id = eh.user_id)))
     JOIN users mgr ON ((mgr.id = eh.reporting_user_id)))
     JOIN lookup_data usrsld ON ((usrsld.id = usr.status_lid)))
     JOIN lookup_data mgrsld ON ((mgrsld.id = mgr.status_lid)))
UNION
 SELECT ((((((usr.first_name)::text || ''::text) || (usr.last_name)::text) || ' ('::text) || (usr.email_id)::text) || ')'::text) AS employee_from,
    'Reportees'::text AS hierarchy,
    ((((((mgr.first_name)::text || ''::text) || (mgr.last_name)::text) || ' ('::text) || (mgr.email_id)::text) || ')'::text) AS employee_to,
    usr.id AS from_reference_id,
    mgr.id AS to_reference_id,
    usrsld.value AS from_reference_status,
    mgrsld.value AS to_reference_status
   FROM ((((employee_hierarchy eh
     JOIN users usr ON ((usr.id = eh.reporting_user_id)))
     JOIN users mgr ON ((mgr.id = eh.user_id)))
     JOIN lookup_data usrsld ON ((usrsld.id = usr.status_lid)))
     JOIN lookup_data mgrsld ON ((mgrsld.id = mgr.status_lid)));
-- Reads the precomputed employee_hierarchy closure table -- one hop per row,
-- no multi-level chain. See vr_user_hierarchy_raw for the recursive version.

