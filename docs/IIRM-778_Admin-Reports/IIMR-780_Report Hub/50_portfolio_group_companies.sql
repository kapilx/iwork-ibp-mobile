-- ============================================================================
-- Report: Portfolio Group Companies
-- name (used in URL/endpoint): portfolio_group_companies    |    id: 50    |    order_no: 23
-- end_point: portfolio_group_companies
-- created_at: 2026-05-08 12:13:12.829517    updated_at: 2026-06-29 17:24:13.611964
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
-- 1. MAIN QUERY  (admin_reports.query, id = 50)
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
  gcm.group_company_id                               AS "groupId",
  COALESCE(gc.display_name, gc.company_name)         AS "groupName",
  grp_ind.value                                       AS "groupSector",
  'GROUP_MEMBER'                                      AS "companyRole",
  COALESCE(pc.policy_count,    0)::int               AS "policyCount",
  COALESCE(pc.active_count,    0)::int               AS "activePolicyCount",
  COALESCE(pc.inactive_count,  0)::int               AS "inactivePolicyCount",
  COALESCE(pc.lh_policy_count, 0)::int               AS "lhPolicyCount",
  NULL::int                                           AS "employeeCount",
  pc_grp.parent_policy_count                         AS "parentPolicyCount",
  pc_grp.parent_active_count                         AS "parentActivePolicyCount",
  pc_grp.parent_inactive_count                       AS "parentInactivePolicyCount",
  pc_grp.parent_lh_policy_count                      AS "parentLhPolicyCount",
  NULL::int                                           AS "parentEmployeeCount",
  grp_city.name                                       AS "parentCity",
  grp_state.name                                      AS "parentState",
  CASE WHEN parent_crm_u.first_name IS NOT NULL
       THEN parent_crm_u.first_name || ' ' || parent_crm_u.last_name END AS "parentRmName"
FROM company c
INNER JOIN group_company_map gcm ON gcm.company_id = c.id
INNER JOIN company gc ON gc.id = gcm.group_company_id AND gc.deleted_at IS NULL
LEFT JOIN lookup_data ind     ON ind.id     = c.industry_segment_lid  AND ind.deleted_at     IS NULL
LEFT JOIN lookup_data grp_ind ON grp_ind.id = gc.industry_segment_lid AND grp_ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN users parent_crm_u ON parent_crm_u.id = gc.lead_crm
LEFT JOIN (
  SELECT DISTINCT ON (ca.company_id) ca.company_id, ca.address_id
  FROM company_address ca ORDER BY ca.company_id, ca.is_primary DESC NULLS LAST, ca.id ASC
) best_addr ON best_addr.company_id = c.id
LEFT JOIN address addr ON addr.id = best_addr.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT DISTINCT ON (ca2.company_id) ca2.company_id, ca2.address_id
  FROM company_address ca2 ORDER BY ca2.company_id, ca2.is_primary DESC NULLS LAST, ca2.id ASC
) best_addr_grp ON best_addr_grp.company_id = gc.id
LEFT JOIN address addr_grp ON addr_grp.id = best_addr_grp.address_id AND addr_grp.deleted_at IS NULL
LEFT JOIN city  grp_city  ON grp_city.id  = addr_grp.city_id
LEFT JOIN state grp_state ON grp_state.id = addr_grp.state_id
LEFT JOIN (
  SELECT p.company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE p.policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE p.policy_to <  CURRENT_DATE) AS inactive_count,
         COUNT(*) FILTER (
           WHERE p.policy_type_lid IN (
             SELECT pts_lh.policy_type_lid
             FROM policy_type_segregation pts_lh
             INNER JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
               AND lower(il.value) NOT LIKE '%non-life%'
           )
         ) AS lh_policy_count
  FROM policy p
  INNER JOIN group_company_map gcm_psc ON gcm_psc.company_id = p.company_id
  WHERE gcm_psc.group_company_id::text = ###hrCompanyId###
     OR gcm_psc.group_company_id IN (
       SELECT gcm_f.group_company_id FROM group_company_map gcm_f
       WHERE gcm_f.company_id::text = ###hrCompanyId###
     )
     OR p.company_id::text = ###hrCompanyId###
  GROUP BY p.company_id
) pc ON pc.company_id = c.id
LEFT JOIN (
  SELECT gcm_g.group_company_id,
         COUNT(p2.id)                                               AS parent_policy_count,
         COUNT(p2.id) FILTER (WHERE p2.policy_to >= CURRENT_DATE)  AS parent_active_count,
         COUNT(p2.id) FILTER (WHERE p2.policy_to <  CURRENT_DATE)  AS parent_inactive_count,
         COUNT(p2.id) FILTER (
           WHERE p2.policy_type_lid IN (
             SELECT pts2.policy_type_lid
             FROM policy_type_segregation pts2
             INNER JOIN lookup_data il2 ON il2.id = pts2.iirm_policy_type_lid AND il2.deleted_at IS NULL
             WHERE (lower(il2.value) LIKE '%life%' OR lower(il2.value) LIKE '%health%')
               AND lower(il2.value) NOT LIKE '%non-life%'
           )
         ) AS parent_lh_policy_count
  FROM group_company_map gcm_g
  JOIN company cm ON cm.id = gcm_g.company_id AND cm.deleted_at IS NULL
  JOIN policy p2 ON p2.company_id = cm.id
  WHERE gcm_g.group_company_id::text = ###hrCompanyId###
     OR gcm_g.group_company_id IN (
       SELECT gcm_f.group_company_id FROM group_company_map gcm_f
       WHERE gcm_f.company_id::text = ###hrCompanyId###
     )
  GROUP BY gcm_g.group_company_id
) pc_grp ON pc_grp.group_company_id = gcm.group_company_id
WHERE c.deleted_at IS NULL
  AND (
    COALESCE(pc.lh_policy_count, 0) > 0
    OR (###hrCompanyId### != '' AND COALESCE(pc.policy_count, 0) > 0)
    OR (###crmUserId### != '' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId### OR gc.lead_crm::text = ###crmUserId###)
  AND (###hrCompanyId### = '' OR gcm.group_company_id::text = ###hrCompanyId### OR c.id::text = ###hrCompanyId###)
  AND (###searchTerm### IS NULL OR COALESCE(c.display_name, c.company_name) ILIKE '%' || ###searchTerm### || '%'
                                OR COALESCE(gc.display_name, gc.company_name) ILIKE '%' || ###searchTerm### || '%')
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy pf ON pf.id = peepm_f.policy_id AND pf.company_id = c.id
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id IN (
          SELECT cpcl_loc.id
          FROM company_policy_configuration_location cpcl_loc
          WHERE cpcl_loc.address_id IN (
            SELECT val::INTEGER FROM regexp_split_to_table(
              NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
            ) AS val WHERE val ~ '^\d+$'
          )
        )
    )
  )
  AND (
    ###externalHrUserId### IS NULL
    OR c.id IN (
      SELECT DISTINCT company_id
      FROM external_hr_policy_map
      WHERE hr_management_id = ###externalHrUserId###::INTEGER
        AND company_id IS NOT NULL
    )
  )
ORDER BY "groupId", "companyName"$Q$
--   WHERE id = 50;

SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || ' ' || crm_u.last_name END AS "rmName",
  gcm.group_company_id                               AS "groupId",
  COALESCE(gc.display_name, gc.company_name)         AS "groupName",
  grp_ind.value                                       AS "groupSector",
  'GROUP_MEMBER'                                      AS "companyRole",
  COALESCE(pc.policy_count,    0)::int               AS "policyCount",
  COALESCE(pc.active_count,    0)::int               AS "activePolicyCount",
  COALESCE(pc.inactive_count,  0)::int               AS "inactivePolicyCount",
  COALESCE(pc.lh_policy_count, 0)::int               AS "lhPolicyCount",
  NULL::int                                           AS "employeeCount",
  pc_grp.parent_policy_count                         AS "parentPolicyCount",
  pc_grp.parent_active_count                         AS "parentActivePolicyCount",
  pc_grp.parent_inactive_count                       AS "parentInactivePolicyCount",
  pc_grp.parent_lh_policy_count                      AS "parentLhPolicyCount",
  NULL::int                                           AS "parentEmployeeCount",
  grp_city.name                                       AS "parentCity",
  grp_state.name                                      AS "parentState",
  CASE WHEN parent_crm_u.first_name IS NOT NULL
       THEN parent_crm_u.first_name || ' ' || parent_crm_u.last_name END AS "parentRmName"
FROM company c
INNER JOIN group_company_map gcm ON gcm.company_id = c.id
INNER JOIN company gc ON gc.id = gcm.group_company_id AND gc.deleted_at IS NULL
LEFT JOIN lookup_data ind     ON ind.id     = c.industry_segment_lid  AND ind.deleted_at     IS NULL
LEFT JOIN lookup_data grp_ind ON grp_ind.id = gc.industry_segment_lid AND grp_ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN users parent_crm_u ON parent_crm_u.id = gc.lead_crm
LEFT JOIN (
  SELECT DISTINCT ON (ca.company_id) ca.company_id, ca.address_id
  FROM company_address ca ORDER BY ca.company_id, ca.is_primary DESC NULLS LAST, ca.id ASC
) best_addr ON best_addr.company_id = c.id
LEFT JOIN address addr ON addr.id = best_addr.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT DISTINCT ON (ca2.company_id) ca2.company_id, ca2.address_id
  FROM company_address ca2 ORDER BY ca2.company_id, ca2.is_primary DESC NULLS LAST, ca2.id ASC
) best_addr_grp ON best_addr_grp.company_id = gc.id
LEFT JOIN address addr_grp ON addr_grp.id = best_addr_grp.address_id AND addr_grp.deleted_at IS NULL
LEFT JOIN city  grp_city  ON grp_city.id  = addr_grp.city_id
LEFT JOIN state grp_state ON grp_state.id = addr_grp.state_id
LEFT JOIN (
  SELECT p.company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE p.policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE p.policy_to <  CURRENT_DATE) AS inactive_count,
         COUNT(*) FILTER (
           WHERE p.policy_type_lid IN (
             SELECT pts_lh.policy_type_lid
             FROM policy_type_segregation pts_lh
             INNER JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
               AND lower(il.value) NOT LIKE '%non-life%'
           )
         ) AS lh_policy_count
  FROM policy p
  INNER JOIN group_company_map gcm_psc ON gcm_psc.company_id = p.company_id
  WHERE gcm_psc.group_company_id::text = ###hrCompanyId###
     OR gcm_psc.group_company_id IN (
       SELECT gcm_f.group_company_id FROM group_company_map gcm_f
       WHERE gcm_f.company_id::text = ###hrCompanyId###
     )
     OR p.company_id::text = ###hrCompanyId###
  GROUP BY p.company_id
) pc ON pc.company_id = c.id
LEFT JOIN (
  SELECT gcm_g.group_company_id,
         COUNT(p2.id)                                               AS parent_policy_count,
         COUNT(p2.id) FILTER (WHERE p2.policy_to >= CURRENT_DATE)  AS parent_active_count,
         COUNT(p2.id) FILTER (WHERE p2.policy_to <  CURRENT_DATE)  AS parent_inactive_count,
         COUNT(p2.id) FILTER (
           WHERE p2.policy_type_lid IN (
             SELECT pts2.policy_type_lid
             FROM policy_type_segregation pts2
             INNER JOIN lookup_data il2 ON il2.id = pts2.iirm_policy_type_lid AND il2.deleted_at IS NULL
             WHERE (lower(il2.value) LIKE '%life%' OR lower(il2.value) LIKE '%health%')
               AND lower(il2.value) NOT LIKE '%non-life%'
           )
         ) AS parent_lh_policy_count
  FROM group_company_map gcm_g
  JOIN company cm ON cm.id = gcm_g.company_id AND cm.deleted_at IS NULL
  JOIN policy p2 ON p2.company_id = cm.id
  WHERE gcm_g.group_company_id::text = ###hrCompanyId###
     OR gcm_g.group_company_id IN (
       SELECT gcm_f.group_company_id FROM group_company_map gcm_f
       WHERE gcm_f.company_id::text = ###hrCompanyId###
     )
  GROUP BY gcm_g.group_company_id
) pc_grp ON pc_grp.group_company_id = gcm.group_company_id
WHERE c.deleted_at IS NULL
  AND (
    COALESCE(pc.lh_policy_count, 0) > 0
    OR (###hrCompanyId### != '' AND COALESCE(pc.policy_count, 0) > 0)
    OR (###crmUserId### != '' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId### OR gc.lead_crm::text = ###crmUserId###)
  AND (###hrCompanyId### = '' OR gcm.group_company_id::text = ###hrCompanyId### OR c.id::text = ###hrCompanyId###)
  AND (###searchTerm### IS NULL OR COALESCE(c.display_name, c.company_name) ILIKE '%' || ###searchTerm### || '%'
                                OR COALESCE(gc.display_name, gc.company_name) ILIKE '%' || ###searchTerm### || '%')
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy pf ON pf.id = peepm_f.policy_id AND pf.company_id = c.id
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id IN (
          SELECT cpcl_loc.id
          FROM company_policy_configuration_location cpcl_loc
          WHERE cpcl_loc.address_id IN (
            SELECT val::INTEGER FROM regexp_split_to_table(
              NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
            ) AS val WHERE val ~ '^\d+$'
          )
        )
    )
  )
  AND (
    ###externalHrUserId### IS NULL
    OR c.id IN (
      SELECT DISTINCT company_id
      FROM external_hr_policy_map
      WHERE hr_management_id = ###externalHrUserId###::INTEGER
        AND company_id IS NOT NULL
    )
  )
ORDER BY "groupId", "companyName"

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 50)
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
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : integer
--   input_field    : (none -- likely unusable from the UI)
--   order_no       : 12
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 50)
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

