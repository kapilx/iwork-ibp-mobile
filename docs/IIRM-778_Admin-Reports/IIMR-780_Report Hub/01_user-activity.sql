-- ============================================================================
-- Report: User Activity
-- name (used in URL/endpoint): user-activity    |    id: 1    |    order_no: (none -- sorts last)
-- end_point: user-activity
-- created_at: 2025-07-23 18:49:49.345316    updated_at: 2025-07-23 18:49:49.345316
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
-- 1. MAIN QUERY  (admin_reports.query, id = 1)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$select entity_type, entity_name, operation, created_by, created_at, status from vr_user_activity where created_at::date BETWEEN ###START_DATE###::date and ###END_DATE###::date order by created_at desc;$Q$
--   WHERE id = 1;

select entity_type, entity_name, operation, created_by, created_at, status from vr_user_activity where created_at::date BETWEEN ###START_DATE###::date and ###END_DATE###::date order by created_at desc;

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 1)
-- ------------------------------------------------------------------
-- Filter: Start Date
--   parameter_name : startDate
--   token in query : ###START_DATE###
--   data_type      : date
--   input_field    : (none -- likely unusable from the UI)
--
-- Filter: End Date
--   parameter_name : endDate
--   token in query : ###END_DATE###
--   data_type      : date
--   input_field    : (none -- likely unusable from the UI)
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 1)
-- ------------------------------------------------------------------
--   entity_type                  -> Entity Type                    (variable: entityType, type: string, align: default)
--   entity_name                  -> Entity Name                    (variable: entityName, type: string, align: default)
--   operation                    -> Action                         (variable: operation, type: string, align: default)
--   status                       -> Entity Status                  (variable: status, type: string, align: default)
--   created_at                   -> Time of Action                 (variable: eventTime, type: date, align: default)
--   created_by                   -> Performed By                   (variable: entityStatus, type: string, align: default)

-- ------------------------------------------------------------------
-- 4. UNDERLYING VIEW DEFINITION: vr_user_activity
-- ------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vr_user_activity AS
 SELECT 'Company'::text AS entity_type,
    entity.company_name AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    ld.value AS status,
    entity.created_at
   FROM ((company entity
     JOIN users ON ((entity.created_by = users.id)))
     JOIN lookup_data ld ON ((ld.id = entity.status_lid)))
UNION
 SELECT 'Contact'::text AS entity_type,
    concat(entity.first_name, ' ', entity.last_name) AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    ld.value AS status,
    entity.created_at
   FROM ((contact entity
     JOIN users ON ((entity.created_by = users.id)))
     JOIN lookup_data ld ON ((ld.id = entity.status_lid)))
UNION
 SELECT 'Insurer'::text AS entity_type,
    entity.name AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    ld.value AS status,
    entity.created_at
   FROM ((insurer entity
     JOIN users ON ((entity.created_by = users.id)))
     JOIN lookup_data ld ON ((ld.id = entity.status_lid)))
UNION
 SELECT 'Broker'::text AS entity_type,
    entity.broker_name AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    ld.value AS status,
    entity.created_at
   FROM ((broker entity
     JOIN users ON ((entity.created_by = users.id)))
     JOIN lookup_data ld ON ((ld.id = entity.status_lid)))
UNION
 SELECT 'TPA'::text AS entity_type,
    entity.name AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    ld.value AS status,
    entity.created_at
   FROM ((tpa entity
     JOIN users ON ((entity.created_by = users.id)))
     JOIN lookup_data ld ON ((ld.id = entity.status_lid)))
UNION
 SELECT otld.value AS entity_type,
    cmp.company_name AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    sld.value AS status,
    entity.created_at
   FROM ((((opportunity entity
     JOIN users ON ((entity.created_by = users.id)))
     JOIN company cmp ON ((cmp.id = entity.company_id)))
     JOIN lookup_data otld ON ((otld.id = entity.opportunity_type_lid)))
     JOIN lookup_data sld ON ((sld.id = entity.status_lid)))
UNION
 SELECT 'Meeting'::text AS entity_type,
    entity.meeting_subject AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    ld.value AS status,
    entity.created_at
   FROM ((meeting entity
     JOIN users ON ((entity.created_by = users.id)))
     JOIN lookup_data ld ON ((ld.id = entity.meeting_status_lid)))
UNION
 SELECT 'Task'::text AS entity_type,
    entity.task_name AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    ld.value AS status,
    entity.created_at
   FROM ((task entity
     JOIN users ON ((entity.created_by = users.id)))
     JOIN lookup_data ld ON ((ld.id = entity.task_status_lid)))
UNION
 SELECT 'Note'::text AS entity_type,
    substr(entity.description, 1, 20) AS entity_name,
    'Creation'::text AS operation,
    concat(users.first_name, ' ', users.last_name) AS created_by,
    'Active'::text AS status,
    entity.created_at
   FROM (note entity
     JOIN users ON ((entity.created_by = users.id)));
-- Every branch of this UNION hardcodes 'Creation' as the operation -- this
-- view can only ever report creation events, never updates or deletions,
-- despite "operation" reading like a general, filterable field.

