-- ============================================================================
-- Report: Portfolio Individual Companies
-- name (used in URL/endpoint): portfolio_individual_companies    |    id: 51    |    order_no: 24
-- end_point: portfolio_individual_companies
-- created_at: 2026-05-08 12:13:33.885964    updated_at: 2026-05-29 09:01:34.590637
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
-- 1. MAIN QUERY  (admin_reports.query, id = 51)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || ' ' || crm_u.last_name END AS "rmName",
  NULL::int                                           AS "groupId",
  NULL::text                                          AS "groupName",
  NULL::text                                          AS "groupSector",
  'INDIVIDUAL'                                        AS "companyRole",
  COALESCE(pc.policy_count,    0)::int               AS "policyCount",
  COALESCE(pc.active_count,    0)::int               AS "activePolicyCount",
  COALESCE(pc.inactive_count,  0)::int               AS "inactivePolicyCount",
  COALESCE(pc.lh_policy_count, 0)::int               AS "lhPolicyCount",
  NULL::int                                           AS "employeeCount"
FROM company c
LEFT JOIN group_company_map gcm_p ON gcm_p.group_company_id = c.id
LEFT JOIN group_company_map gcm_m ON gcm_m.company_id = c.id
LEFT JOIN lookup_data ind ON ind.id = c.industry_segment_lid AND ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN (
  SELECT DISTINCT ON (ca.company_id) ca.company_id, ca.address_id
  FROM company_address ca ORDER BY ca.company_id, ca.is_primary DESC NULLS LAST, ca.id ASC
) best_addr ON best_addr.company_id = c.id
LEFT JOIN address addr ON addr.id = best_addr.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT p.company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE p.policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE p.policy_to <  CURRENT_DATE) AS inactive_count,
         COUNT(*) FILTER (
           WHERE EXISTS (
             SELECT 1 FROM policy_type_segregation pts_lh
             JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE pts_lh.policy_type_lid = p.policy_type_lid
               AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
               AND lower(il.value) NOT LIKE '%non-life%'
           )
         ) AS lh_policy_count
  FROM policy p GROUP BY p.company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL
  AND gcm_p.group_company_id IS NULL
  AND gcm_m.company_id IS NULL
  AND (
    COALESCE(pc.lh_policy_count, 0) > 0
    OR (###hrCompanyId### != '' AND COALESCE(pc.policy_count, 0) > 0)
    OR (###crmUserId### != '' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId###)
  AND (###hrCompanyId### = '' OR c.id::text = ###hrCompanyId###)
  AND (###searchTerm### IS NULL OR COALESCE(c.display_name, c.company_name) ILIKE '%' || ###searchTerm### || '%')
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy pf ON pf.id = peepm_f.policy_id AND pf.company_id = c.id
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
    )
  )
ORDER BY "companyName"$Q$
--   WHERE id = 51;

SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || ' ' || crm_u.last_name END AS "rmName",
  NULL::int                                           AS "groupId",
  NULL::text                                          AS "groupName",
  NULL::text                                          AS "groupSector",
  'INDIVIDUAL'                                        AS "companyRole",
  COALESCE(pc.policy_count,    0)::int               AS "policyCount",
  COALESCE(pc.active_count,    0)::int               AS "activePolicyCount",
  COALESCE(pc.inactive_count,  0)::int               AS "inactivePolicyCount",
  COALESCE(pc.lh_policy_count, 0)::int               AS "lhPolicyCount",
  NULL::int                                           AS "employeeCount"
FROM company c
LEFT JOIN group_company_map gcm_p ON gcm_p.group_company_id = c.id
LEFT JOIN group_company_map gcm_m ON gcm_m.company_id = c.id
LEFT JOIN lookup_data ind ON ind.id = c.industry_segment_lid AND ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN (
  SELECT DISTINCT ON (ca.company_id) ca.company_id, ca.address_id
  FROM company_address ca ORDER BY ca.company_id, ca.is_primary DESC NULLS LAST, ca.id ASC
) best_addr ON best_addr.company_id = c.id
LEFT JOIN address addr ON addr.id = best_addr.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT p.company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE p.policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE p.policy_to <  CURRENT_DATE) AS inactive_count,
         COUNT(*) FILTER (
           WHERE EXISTS (
             SELECT 1 FROM policy_type_segregation pts_lh
             JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE pts_lh.policy_type_lid = p.policy_type_lid
               AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
               AND lower(il.value) NOT LIKE '%non-life%'
           )
         ) AS lh_policy_count
  FROM policy p GROUP BY p.company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL
  AND gcm_p.group_company_id IS NULL
  AND gcm_m.company_id IS NULL
  AND (
    COALESCE(pc.lh_policy_count, 0) > 0
    OR (###hrCompanyId### != '' AND COALESCE(pc.policy_count, 0) > 0)
    OR (###crmUserId### != '' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId###)
  AND (###hrCompanyId### = '' OR c.id::text = ###hrCompanyId###)
  AND (###searchTerm### IS NULL OR COALESCE(c.display_name, c.company_name) ILIKE '%' || ###searchTerm### || '%')
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy pf ON pf.id = peepm_f.policy_id AND pf.company_id = c.id
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
    )
  )
ORDER BY "companyName"

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 51)
-- ------------------------------------------------------------------
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : locationIds
--   token in query : ###locationIds###
--   data_type      : (none)
--   input_field    : (none -- likely unusable from the UI)
--   >>> STUB parameter row -- no type/label configured, this filter cannot be used from the generic screen.
--
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Search
--   parameter_name : searchTerm
--   token in query : ###searchTerm###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: CRM User ID
--   parameter_name : crmUserId
--   token in query : ###crmUserId###
--   data_type      : string
--   input_field    : input
--   order_no       : 10
--
-- Filter: HR Company ID
--   parameter_name : hrCompanyId
--   token in query : ###hrCompanyId###
--   data_type      : string
--   input_field    : input
--   order_no       : 11
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 51)
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

