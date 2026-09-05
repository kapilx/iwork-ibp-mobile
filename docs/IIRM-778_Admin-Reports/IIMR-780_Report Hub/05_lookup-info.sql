-- ============================================================================
-- Report: Lookup Info
-- name (used in URL/endpoint): lookup-info    |    id: 5    |    order_no: (none -- sorts last)
-- end_point: lookup-info
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
-- 1. MAIN QUERY  (admin_reports.query, id = 5)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select lookup_name, lookup_value, lookup_description, display_order, lookup_value_key, unique_lookup_key, lookup_id from vr_lookup_info where lookup_name = COALESCE(###Name###,lookup_name) order by lookup_name, display_order$Q$
--   WHERE id = 5;

select lookup_name, lookup_value, lookup_description, display_order, lookup_value_key, unique_lookup_key, lookup_id from vr_lookup_info where lookup_name = COALESCE(###Name###,lookup_name) order by lookup_name, display_order

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 5)
-- ------------------------------------------------------------------
-- Filter: Name
--   parameter_name : lookupName
--   token in query : ###Name###
--   data_type      : string
--   input_field    : SelectBox
--   dropdown options are populated by this sub-query:
--   select label, value, sort_order from (select 'All' as label, '#99#' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct lookup_name as label from vr_lookup_info) a) as t order by sort_order, label
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 5)
-- ------------------------------------------------------------------
--   lookup_name                  -> Name                           (variable: lookupName, type: string, align: default)
--   lookup_value                 -> Value                          (variable: lookupValue, type: string, align: default)
--   display_order                -> Display Sequence               (variable: displayOrder, type: string, align: default)
--   lookup_value_key             -> Value Key                      (variable: lookupValueKey, type: string, align: default)
--   lookup_id                    -> ID                             (variable: lookupId, type: number, align: default)
--   lookup_description           -> Description                    (variable: lookupDescription, type: string, align: default)
--   unique_lookup_key            -> Unique Key                     (variable: uniqueLookupKey, type: string, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_lookup_info
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_lookup_info AS
 SELECT org.name AS organisation,
    ld.lookup_name,
    ld.value AS lookup_value,
    ldir.value AS irdai_category,
    ldii.value AS iirm_category,
        CASE ld.status
            WHEN 0 THEN 'Inactive'::text
            ELSE 'Active'::text
        END AS lookup_status,
    ldn.value AS respective_active_policy_type,
    ld.value_key AS lookup_value_key,
    ld.lookup_order AS display_order,
    ' - '::text AS reference,
    ld.description AS lookup_description,
    ld.id AS lookup_id,
    ld.lookup_key AS unique_lookup_key,
    ldn.id AS respective_active_policy_type_lid
   FROM (((((lookup_data ld
     JOIN organisation org ON ((org.id = ld.organisation_id)))
     LEFT JOIN policy_type_segregation pts ON ((pts.policy_type_lid = ld.id)))
     LEFT JOIN lookup_data ldn ON ((pts.assoc_active_policy_type_lid = ldn.id)))
     LEFT JOIN lookup_data ldir ON ((pts.irdai_policy_type_lid = ldir.id)))
     LEFT JOIN lookup_data ldii ON ((pts.iirm_policy_type_lid = ldii.id)))
  WHERE (1 = 1)
  ORDER BY org.name, ld.lookup_name, ld.value;

