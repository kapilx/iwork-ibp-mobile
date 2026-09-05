-- =============================================================================
-- portfolio-company-location-filter.sql
--
-- Adds ###locationIds### (Pattern C – company_policy_configuration_location) to:
--   • portfolio_group_companies      (id 50)
--   • portfolio_individual_companies (id 51)
--
-- Pattern C:
-- When locationIds is supplied, only companies whose company_id appears in
-- company_policy_configuration_location for the given address ID are returned.
-- Simple indexed lookup — no jsonb expansion.
-- When locationIds is empty/NULL the filter is a no-op.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. portfolio_group_companies (id = 50)
-- ---------------------------------------------------------------------------
UPDATE admin_reports
SET query = $Q$
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
  SELECT DISTINCT ON (ca.company_id)
    ca.company_id,
    ca.address_id
  FROM company_address ca
  ORDER BY ca.company_id, ca.is_primary DESC NULLS LAST, ca.id ASC
) best_addr ON best_addr.company_id = c.id
LEFT JOIN address addr ON addr.id = best_addr.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT DISTINCT ON (ca2.company_id)
    ca2.company_id,
    ca2.address_id
  FROM company_address ca2
  ORDER BY ca2.company_id, ca2.is_primary DESC NULLS LAST, ca2.id ASC
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
           WHERE EXISTS (
             SELECT 1
             FROM policy_type_segregation pts_lh
             JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE pts_lh.policy_type_lid = p.policy_type_lid
               AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
               AND lower(il.value) NOT LIKE '%non-life%'
           )
         )                                                   AS lh_policy_count
  FROM policy p GROUP BY p.company_id
) pc ON pc.company_id = c.id
LEFT JOIN (
  SELECT gcm_g.group_company_id,
         COUNT(p2.id)                                               AS parent_policy_count,
         COUNT(p2.id) FILTER (WHERE p2.policy_to >= CURRENT_DATE)  AS parent_active_count,
         COUNT(p2.id) FILTER (WHERE p2.policy_to <  CURRENT_DATE)  AS parent_inactive_count,
         COUNT(p2.id) FILTER (
           WHERE EXISTS (
             SELECT 1
             FROM policy_type_segregation pts2
             JOIN lookup_data il2 ON il2.id = pts2.iirm_policy_type_lid AND il2.deleted_at IS NULL
             WHERE pts2.policy_type_lid = p2.policy_type_lid
               AND (lower(il2.value) LIKE '%life%' OR lower(il2.value) LIKE '%health%')
               AND lower(il2.value) NOT LIKE '%non-life%'
           )
         )                                                           AS parent_lh_policy_count
  FROM group_company_map gcm_g
  JOIN company cm ON cm.id = gcm_g.company_id AND cm.deleted_at IS NULL
  JOIN policy p2 ON p2.company_id = cm.id
  GROUP BY gcm_g.group_company_id
) pc_grp ON pc_grp.group_company_id = gcm.group_company_id
WHERE c.deleted_at IS NULL
  AND (
    COALESCE(pc.lh_policy_count, 0) > 0
    OR (###hrCompanyId### != '' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId###)
  AND (
    ###hrCompanyId### = ''
    OR gcm.group_company_id::text = ###hrCompanyId###
    OR gcm.group_company_id IN (
      SELECT gcm2.group_company_id
      FROM group_company_map gcm2
      WHERE gcm2.company_id::text = ###hrCompanyId###
    )
    OR c.id::text = ###hrCompanyId###
  )
  AND (###searchTerm### IS NULL
       OR COALESCE(c.display_name, c.company_name) ILIKE '%' || ###searchTerm### || '%'
       OR COALESCE(gc.display_name, gc.company_name) ILIKE '%' || ###searchTerm### || '%')
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR c.id IN (
      SELECT cpcl.company_id
      FROM company_policy_configuration_location cpcl
      WHERE cpcl.address_id = ANY(
        SELECT val::INTEGER
        FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
          ','
        ) AS val
        WHERE val ~ '^\d+$'
      )
      AND cpcl.deleted_at IS NULL
    )
  )
ORDER BY "groupId", "companyName"
$Q$,
updated_at = NOW()
WHERE name = 'portfolio_group_companies';

-- ---------------------------------------------------------------------------
-- 2. portfolio_individual_companies (id = 51)
-- ---------------------------------------------------------------------------
UPDATE admin_reports
SET query = $Q$
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
  SELECT DISTINCT ON (ca.company_id)
    ca.company_id,
    ca.address_id
  FROM company_address ca
  ORDER BY ca.company_id, ca.is_primary DESC NULLS LAST, ca.id ASC
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
             SELECT 1
             FROM policy_type_segregation pts_lh
             JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE pts_lh.policy_type_lid = p.policy_type_lid
               AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
               AND lower(il.value) NOT LIKE '%non-life%'
           )
         )                                                   AS lh_policy_count
  FROM policy p GROUP BY p.company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL
  AND gcm_p.group_company_id IS NULL
  AND gcm_m.company_id IS NULL
  AND (
    COALESCE(pc.lh_policy_count, 0) > 0
    OR (###hrCompanyId### != '' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId###)
  AND (###hrCompanyId### = '' OR c.id::text = ###hrCompanyId###)
  AND (###searchTerm### IS NULL
       OR COALESCE(c.display_name, c.company_name) ILIKE '%' || ###searchTerm### || '%')
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR c.id IN (
      SELECT cpcl.company_id
      FROM company_policy_configuration_location cpcl
      WHERE cpcl.address_id = ANY(
        SELECT val::INTEGER
        FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
          ','
        ) AS val
        WHERE val ~ '^\d+$'
      )
      AND cpcl.deleted_at IS NULL
    )
  )
ORDER BY "companyName"
$Q$,
updated_at = NOW()
WHERE name = 'portfolio_individual_companies';

-- ---------------------------------------------------------------------------
-- 3. Register locationIds parameter (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO admin_reports_parameters
  (admin_report_id, parameter_name, query_parameter, created_at, updated_at, created_by, updated_by)
SELECT
  r.id,
  'locationIds',
  '###locationIds###',
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM'
FROM admin_reports r
WHERE r.name IN ('portfolio_group_companies', 'portfolio_individual_companies')
  AND NOT EXISTS (
    SELECT 1 FROM admin_reports_parameters p
    WHERE p.admin_report_id = r.id AND p.parameter_name = 'locationIds'
  );

-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
SELECT
  name,
  CASE
    WHEN query LIKE '%company_policy_configuration_location%' AND query LIKE '%###locationIds###%'
      THEN 'OK — Pattern C location filter present'
    ELSE 'MISSING location filter'
  END AS status
FROM admin_reports
WHERE name IN ('portfolio_group_companies', 'portfolio_individual_companies')
ORDER BY name;

COMMIT;
