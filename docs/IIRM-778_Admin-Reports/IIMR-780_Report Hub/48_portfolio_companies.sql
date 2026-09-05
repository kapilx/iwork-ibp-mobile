-- ============================================================================
-- Report: Portfolio Companies
-- name (used in URL/endpoint): portfolio_companies    |    id: 48    |    order_no: 21
-- end_point: portfolio_companies
-- created_at: 2026-05-08 12:12:43.528698    updated_at: 2026-05-08 12:12:43.528698
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
-- 1. MAIN QUERY  (admin_reports.query, id = 48)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  COALESCE(c.no_of_employees, 0)::int                AS "employeeCount",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || ' ' || crm_u.last_name END AS "rmName",
  gcm.group_company_id                               AS "groupId",
  COALESCE(gc.display_name, gc.company_name)         AS "groupName",
  grp_ind.value                                       AS "groupSector",
  'GROUP_MEMBER'                                      AS "companyRole",
  COALESCE(pc.policy_count,   0)::int                AS "policyCount",
  COALESCE(pc.active_count,   0)::int                AS "activePolicyCount",
  COALESCE(pc.inactive_count, 0)::int                AS "inactivePolicyCount"
FROM company c
INNER JOIN group_company_map gcm ON gcm.company_id = c.id
INNER JOIN company gc ON gc.id = gcm.group_company_id AND gc.deleted_at IS NULL
LEFT JOIN lookup_data ind     ON ind.id     = c.industry_segment_lid  AND ind.deleted_at     IS NULL
LEFT JOIN lookup_data grp_ind ON grp_ind.id = gc.industry_segment_lid AND grp_ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN LATERAL (
  SELECT ca.address_id
  FROM company_address ca
  WHERE ca.company_id = c.id
  ORDER BY ca.is_primary DESC NULLS LAST, ca.id ASC
  LIMIT 1
) first_ca ON TRUE
LEFT JOIN address addr ON addr.id = first_ca.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE policy_to <  CURRENT_DATE) AS inactive_count
  FROM policy GROUP BY company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL

UNION ALL

SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  COALESCE(c.no_of_employees, 0)::int                AS "employeeCount",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || ' ' || crm_u.last_name END AS "rmName",
  NULL::int                                           AS "groupId",
  NULL::text                                          AS "groupName",
  NULL::text                                          AS "groupSector",
  'INDIVIDUAL'                                        AS "companyRole",
  COALESCE(pc.policy_count,   0)::int                AS "policyCount",
  COALESCE(pc.active_count,   0)::int                AS "activePolicyCount",
  COALESCE(pc.inactive_count, 0)::int                AS "inactivePolicyCount"
FROM company c
LEFT JOIN lookup_data ind ON ind.id = c.industry_segment_lid AND ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN LATERAL (
  SELECT ca.address_id
  FROM company_address ca
  WHERE ca.company_id = c.id
  ORDER BY ca.is_primary DESC NULLS LAST, ca.id ASC
  LIMIT 1
) first_ca ON TRUE
LEFT JOIN address addr ON addr.id = first_ca.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE policy_to <  CURRENT_DATE) AS inactive_count
  FROM policy GROUP BY company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL
  AND c.id NOT IN (SELECT DISTINCT group_company_id FROM group_company_map)
  AND c.id NOT IN (SELECT DISTINCT company_id        FROM group_company_map)

ORDER BY "groupId" NULLS LAST, "companyName"$Q$
--   WHERE id = 48;

SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  COALESCE(c.no_of_employees, 0)::int                AS "employeeCount",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || ' ' || crm_u.last_name END AS "rmName",
  gcm.group_company_id                               AS "groupId",
  COALESCE(gc.display_name, gc.company_name)         AS "groupName",
  grp_ind.value                                       AS "groupSector",
  'GROUP_MEMBER'                                      AS "companyRole",
  COALESCE(pc.policy_count,   0)::int                AS "policyCount",
  COALESCE(pc.active_count,   0)::int                AS "activePolicyCount",
  COALESCE(pc.inactive_count, 0)::int                AS "inactivePolicyCount"
FROM company c
INNER JOIN group_company_map gcm ON gcm.company_id = c.id
INNER JOIN company gc ON gc.id = gcm.group_company_id AND gc.deleted_at IS NULL
LEFT JOIN lookup_data ind     ON ind.id     = c.industry_segment_lid  AND ind.deleted_at     IS NULL
LEFT JOIN lookup_data grp_ind ON grp_ind.id = gc.industry_segment_lid AND grp_ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN LATERAL (
  SELECT ca.address_id
  FROM company_address ca
  WHERE ca.company_id = c.id
  ORDER BY ca.is_primary DESC NULLS LAST, ca.id ASC
  LIMIT 1
) first_ca ON TRUE
LEFT JOIN address addr ON addr.id = first_ca.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE policy_to <  CURRENT_DATE) AS inactive_count
  FROM policy GROUP BY company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL

UNION ALL

SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  COALESCE(c.no_of_employees, 0)::int                AS "employeeCount",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || ' ' || crm_u.last_name END AS "rmName",
  NULL::int                                           AS "groupId",
  NULL::text                                          AS "groupName",
  NULL::text                                          AS "groupSector",
  'INDIVIDUAL'                                        AS "companyRole",
  COALESCE(pc.policy_count,   0)::int                AS "policyCount",
  COALESCE(pc.active_count,   0)::int                AS "activePolicyCount",
  COALESCE(pc.inactive_count, 0)::int                AS "inactivePolicyCount"
FROM company c
LEFT JOIN lookup_data ind ON ind.id = c.industry_segment_lid AND ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN LATERAL (
  SELECT ca.address_id
  FROM company_address ca
  WHERE ca.company_id = c.id
  ORDER BY ca.is_primary DESC NULLS LAST, ca.id ASC
  LIMIT 1
) first_ca ON TRUE
LEFT JOIN address addr ON addr.id = first_ca.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE policy_to <  CURRENT_DATE) AS inactive_count
  FROM policy GROUP BY company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL
  AND c.id NOT IN (SELECT DISTINCT group_company_id FROM group_company_map)
  AND c.id NOT IN (SELECT DISTINCT company_id        FROM group_company_map)

ORDER BY "groupId" NULLS LAST, "companyName"

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 48)
-- ------------------------------------------------------------------
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 48)
-- ------------------------------------------------------------------
--   companyId                    -> Company ID                     (variable: companyId, type: number, align: right)
--   companyName                  -> Company                        (variable: companyName, type: string, align: left)
--   industry                     -> Industry                       (variable: industry, type: string, align: left)
--   city                         -> City                           (variable: city, type: string, align: left)
--   state                        -> State                          (variable: state, type: string, align: left)
--   employeeCount                -> Employees                      (variable: employeeCount, type: number, align: right)
--   rmName                       -> RM                             (variable: rmName, type: string, align: left)
--   groupId                      -> Group ID                       (variable: groupId, type: number, align: right)
--   groupName                    -> Group                          (variable: groupName, type: string, align: left)
--   groupSector                  -> Sector                         (variable: groupSector, type: string, align: left)
--   companyRole                  -> Role                           (variable: companyRole, type: string, align: left)
--   policyCount                  -> Policies                       (variable: policyCount, type: number, align: right)
--   activePolicyCount            -> Active Policies                (variable: activePolicyCount, type: number, align: right)
--   inactivePolicyCount          -> Inactive Policies              (variable: inactivePolicyCount, type: number, align: right)

