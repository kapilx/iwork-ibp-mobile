-- =============================================================================
-- HR Portal Performance Fixes
-- Target: admin_reports SQL queries for the HR Portal dashboard & portfolio
-- Environments: run on each DB (anon, dev, qa, staging) separately
--
-- HOW TO RUN:
--   psql -h <host> -U <user> -d <dbname> -f hr-portal-performance-fixes.sql
--
-- IMPORTANT — do NOT use psql -1 (single transaction mode).
--   CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
--   Run this file with psql in the default autocommit mode.
--   For DBeaver/pgAdmin copy-paste: use hr-portal-performance-fixes-run.sql instead.
--
-- SAFE TO RE-RUN: Every statement has an idempotent guard (IF NOT EXISTS,
--   NOT LIKE pattern, or WHERE NOT EXISTS check). Running twice is harmless.
--
-- HARDCODED IDs: None. All admin_reports_parameters inserts use a subquery
--   to look up admin_report_id by name — safe across all environments.
--
-- SEE ALSO: HR-PORTAL-CHANGES.md — full before/after explanation of every fix.
-- =============================================================================


-- ── FIX 1: external_hr_company_locations — deduplicate by address text ────────
-- Problem : Returns one row per company_policy_configuration_location entry.
--           TEAMLEASE has 21,681 entries → 12s load time for a dropdown.
-- Fix     : DISTINCT ON (a.addr_1) — picks one address.id per unique address
--           text, reducing 21,681 rows to ~1,992 distinct location names.
-- Result  : Location dropdown loads in <1s instead of 12s.
-- =============================================================================
UPDATE admin_reports
SET
  query = 'SELECT DISTINCT ON (a.addr_1) a.id, a.addr_1
FROM company_policy_configuration_location cpcl
JOIN address a ON a.id = cpcl.address_id
WHERE cpcl.company_id = ###companyId###
  AND a.deleted_at IS NULL
ORDER BY a.addr_1 ASC, a.id ASC',
  updated_at = NOW()
WHERE name = 'external_hr_company_locations'
  AND query NOT LIKE '%DISTINCT ON (a.addr_1)%';


-- ── FIX 2: dashboard_policy_cards — fix location filter via address_id ────────
-- Problem : loc_employees CTE filtered pee.policy_config_location_id against
--           address.id values (from the dropdown), but policy_config_location_id
--           stores company_policy_configuration_location.id — different IDs.
--           Location filter was silently returning wrong results.
-- Fix     : Translate address.id → cpcl.id via company_policy_configuration_location.
-- =============================================================================
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    'pee.policy_config_location_id IN (SELECT loc_id FROM loc_id_set)',
    'pee.policy_config_location_id IN (
      SELECT cpcl_loc.id
      FROM company_policy_configuration_location cpcl_loc
      WHERE cpcl_loc.address_id IN (SELECT loc_id FROM loc_id_set)
    )'
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query LIKE '%pee.policy_config_location_id IN (SELECT loc_id FROM loc_id_set)%';


-- ── FIX 3: portfolio_company_policies — same location filter fix ──────────────
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    'pee.policy_config_location_id IN (SELECT loc_id FROM loc_id_set)',
    'pee.policy_config_location_id IN (
      SELECT cpcl_loc.id
      FROM company_policy_configuration_location cpcl_loc
      WHERE cpcl_loc.address_id IN (SELECT loc_id FROM loc_id_set)
    )'
  ),
  updated_at = NOW()
WHERE name = 'portfolio_company_policies'
  AND query LIKE '%pee.policy_config_location_id IN (SELECT loc_id FROM loc_id_set)%';


-- ── FIX 4: dashboard_enrollment_status — fix inline location filter ───────────
-- Problem : Uses pee.policy_config_location_id = ANY(...) with address IDs.
--           Same mismatch as above.
-- Fix     : Wrap with sub-select to translate address_id → cpcl.id.
-- =============================================================================
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    'OR pee.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, ''[\[\]\s]'', '''', ''g'')), ''''), '',''
        ) AS val WHERE val ~ ''^\d+$''
      )',
    'OR pee.policy_config_location_id IN (
        SELECT cpcl_loc.id
        FROM company_policy_configuration_location cpcl_loc
        WHERE cpcl_loc.address_id IN (
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, ''[\[\]\s]'', '''', ''g'')), ''''), '',''
          ) AS val WHERE val ~ ''^\d+$''
        )
      )'
  ),
  updated_at = NOW()
WHERE name = 'dashboard_enrollment_status'
  AND query LIKE '%pee.policy_config_location_id = ANY(%';


-- ── FIX 5: Indexes to speed up portfolio_group_companies and portfolio_kpi_summary
-- Problem : Both queries take 10+ seconds on large companies.
--           These joins scan without indexes on key filter/join columns.
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_company_map_company_id
  ON group_company_map (company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_company_map_group_company_id
  ON group_company_map (group_company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policy_company_id
  ON policy (company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policy_type_lid
  ON policy (policy_type_lid);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policy_enrollment_emp_company_id
  ON policy_enrollment_employee (company_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cpcl_company_id
  ON company_policy_configuration_location (company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cpcl_address_id
  ON company_policy_configuration_location (address_id);

-- ── FIX 6: dashboard_policy_cards — scope 3 CTEs to company ─────────────────
-- Problem : policy_employee_counts, policy_dependent_counts, and
--           policy_enrollment_counts CTEs scan the entire DB (no company filter).
--           For TEAMLEASE, aggregates ALL companies' data before filtering.
--           Result: 24+ seconds for 10 policy cards.
-- Fix     : Add INNER JOIN to policy table with company_id filter in each CTE.
--           Only processes the ~79 policies for the requested company.
-- Expected: 24.6s → ~1-3s
-- =============================================================================

-- NOTE: The live dashboard_policy_cards SQL was updated by the ICR LY patch,
-- so the 3 CTEs have location-filter conditions. Correct REPLACE patterns below.

-- Fix 6a: policy_employee_counts — add company scope
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)$$,
$$  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy p_ec ON p_ec.id = peepm.policy_id AND p_ec.company_id = ###companyId###
  WHERE peepm.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)$$
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%p_ec.company_id%';

-- Fix 6b: policy_dependent_counts — add company scope
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$  FROM policy_enrollment_dependent ped
  JOIN policy_enrollment_employee pee
    ON pee.id = ped.employee_id AND pee.deleted_at IS NULL
  WHERE ped.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)$$,
$$  FROM policy_enrollment_dependent ped
  INNER JOIN policy p_dc ON p_dc.id = ped.policy_id AND p_dc.company_id = ###companyId###
  JOIN policy_enrollment_employee pee
    ON pee.id = ped.employee_id AND pee.deleted_at IS NULL
  WHERE ped.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)$$
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%p_dc.company_id%';

-- Fix 6c: policy_enrollment_counts — add company scope
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$  FROM policy_employee_enrollment pee_enr
  WHERE pee_enr.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)$$,
$$  FROM policy_employee_enrollment pee_enr
  INNER JOIN policy p_pen ON p_pen.id = pee_enr.policy_id AND p_pen.company_id = ###companyId###
  WHERE pee_enr.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)$$
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%p_pen.company_id%';


-- ── FIX 7: dashboard_enrollment_status — scope latest_login to company users ─
-- Problem : latest_login CTE runs: SELECT ... FROM user_activity_log GROUP BY user_id
--           This scans the ENTIRE user_activity_log table (millions of rows, all companies).
--           Result: 14.5 seconds for 1 row output.
-- Fix     : INNER JOIN to employee_scope (already scoped to this company) so
--           only the relevant users' activity is scanned.
-- Expected: 14.5s → ~1-2s
-- =============================================================================
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$latest_login AS (
  SELECT ual.user_id, MAX(ual.action_date) AS last_login_at
  FROM user_activity_log ual
  WHERE ual.activity_key = 'LOGGED_IN' AND ual.activity_category = 'AUTH' AND ual.deleted_at IS NULL
  GROUP BY ual.user_id
),$$,
$$latest_login AS (
  SELECT ual.user_id, MAX(ual.action_date) AS last_login_at
  FROM user_activity_log ual
  INNER JOIN (SELECT DISTINCT user_id FROM employee_scope WHERE user_id IS NOT NULL) es_u
    ON es_u.user_id = ual.user_id
  WHERE ual.activity_key = 'LOGGED_IN' AND ual.activity_category = 'AUTH' AND ual.deleted_at IS NULL
  GROUP BY ual.user_id
),$$
  ),
  updated_at = NOW()
WHERE name = 'dashboard_enrollment_status'
  AND query LIKE '%FROM user_activity_log ual%'
  AND query NOT LIKE '%es_u ON es_u.user_id%';


-- ── FIX 8: portfolio_group_companies — scope policy aggregations to company group
-- Problem : Two global-scan subqueries:
--   (a) pc: SELECT ... FROM policy p GROUP BY p.company_id  — ALL policies, ALL companies
--   (b) pc_grp: ... JOIN policy p2 ON p2.company_id = cm.id GROUP BY gcm_g.group_company_id
--       — also scans all group_company_map + all companies + all policies globally
--   (c) Both use correlated EXISTS per policy row for lh_policy_count — expensive
-- Fix     : Add WHERE clauses scoping to hrCompanyId's group only.
--           Replace correlated EXISTS with non-correlated IN subquery.
-- Expected: 7-12s → ~1-3s
-- =============================================================================

-- Fix 8a: pc subquery — scope policy scan to group companies only
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$  FROM policy p GROUP BY p.company_id$$,
$$  FROM policy p
  INNER JOIN group_company_map gcm_psc ON gcm_psc.company_id = p.company_id
  WHERE gcm_psc.group_company_id::text = ###hrCompanyId###
     OR gcm_psc.group_company_id IN (
       SELECT gcm_f.group_company_id FROM group_company_map gcm_f
       WHERE gcm_f.company_id::text = ###hrCompanyId###
     )
     OR p.company_id::text = ###hrCompanyId###
  GROUP BY p.company_id$$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_group_companies'
  AND query LIKE '%FROM policy p GROUP BY p.company_id%'
  AND query NOT LIKE '%gcm_psc%';

-- Fix 8b: pc_grp subquery — scope group policy scan to relevant group only
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$  JOIN policy p2 ON p2.company_id = cm.id
  GROUP BY gcm_g.group_company_id$$,
$$  JOIN policy p2 ON p2.company_id = cm.id
  WHERE gcm_g.group_company_id::text = ###hrCompanyId###
     OR gcm_g.group_company_id IN (
       SELECT gcm_f.group_company_id FROM group_company_map gcm_f
       WHERE gcm_f.company_id::text = ###hrCompanyId###
     )
  GROUP BY gcm_g.group_company_id$$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_group_companies'
  AND query LIKE '%JOIN policy p2 ON p2.company_id = cm.id%'
  AND query NOT LIKE '%gcm_g.group_company_id::text = ###hrCompanyId###%';

-- Fix 8c: pc subquery — replace correlated EXISTS with non-correlated IN for lh_policy_count
-- NOTE: old_string matches "SELECT 1 FROM" on one line (confirmed from stored DB text).
--       The `) AS lh_policy_count` has no extra padding spaces.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$fix8c$           WHERE EXISTS (
             SELECT 1 FROM policy_type_segregation pts_lh
             JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE pts_lh.policy_type_lid = p.policy_type_lid
               AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
               AND lower(il.value) NOT LIKE '%non-life%'
           )
         ) AS lh_policy_count$fix8c$,
$fix8c_new$           WHERE p.policy_type_lid IN (
             SELECT pts_lh.policy_type_lid
             FROM policy_type_segregation pts_lh
             INNER JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
               AND lower(il.value) NOT LIKE '%non-life%'
           )
         ) AS lh_policy_count$fix8c_new$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_group_companies'
  AND query LIKE '%policy_type_segregation pts_lh%'
  AND query NOT LIKE '%p.policy_type_lid IN (%';

-- Fix 8d: pc_grp subquery — same EXISTS→IN fix for parent_lh_policy_count
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$fix8d$           WHERE EXISTS (
             SELECT 1 FROM policy_type_segregation pts2
             JOIN lookup_data il2 ON il2.id = pts2.iirm_policy_type_lid AND il2.deleted_at IS NULL
             WHERE pts2.policy_type_lid = p2.policy_type_lid
               AND (lower(il2.value) LIKE '%life%' OR lower(il2.value) LIKE '%health%')
               AND lower(il2.value) NOT LIKE '%non-life%'
           )
         ) AS parent_lh_policy_count$fix8d$,
$fix8d_new$           WHERE p2.policy_type_lid IN (
             SELECT pts2.policy_type_lid
             FROM policy_type_segregation pts2
             INNER JOIN lookup_data il2 ON il2.id = pts2.iirm_policy_type_lid AND il2.deleted_at IS NULL
             WHERE (lower(il2.value) LIKE '%life%' OR lower(il2.value) LIKE '%health%')
               AND lower(il2.value) NOT LIKE '%non-life%'
           )
         ) AS parent_lh_policy_count$fix8d_new$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_group_companies'
  AND query LIKE '%policy_type_segregation pts2%'
  AND query NOT LIKE '%p2.policy_type_lid IN (%';

-- Fix 8e: portfolio_group_companies — location filter ANY(address_ids) → cpcl_loc translate
-- Problem : portfolio_group_companies uses pee_f.policy_config_location_id = ANY(address_ids)
--           but policy_config_location_id stores cpcl.id, not address.id — wrong IDs.
--           Fix 3 (loc_id_set pattern) does NOT apply here — different query structure.
-- Fix     : Translate address_id → cpcl.id via company_policy_configuration_location.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$fix8e$        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )$fix8e$,
$fix8e_new$        AND pee_f.policy_config_location_id IN (
          SELECT cpcl_loc.id
          FROM company_policy_configuration_location cpcl_loc
          WHERE cpcl_loc.address_id IN (
            SELECT val::INTEGER FROM regexp_split_to_table(
              NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
            ) AS val WHERE val ~ '^\d+$'
          )
        )$fix8e_new$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_group_companies'
  AND query LIKE '%pee_f.policy_config_location_id = ANY(%'
  AND query NOT LIKE '%cpcl_loc%';


-- ── FIX 9: Additional indexes for the new JOINs ───────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_peepm_policy_id
  ON policy_enrollment_employee_policy_map (policy_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ped_policy_id
  ON policy_enrollment_dependent (policy_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pee_policy_id
  ON policy_employee_enrollment (policy_id)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ual_user_id_activity
  ON user_activity_log (user_id, activity_key, activity_category)
  WHERE deleted_at IS NULL;


-- ── FIX 10: portfolio_company_policies — replace correlated endorsement subquery
-- Problem : SELECT has COALESCE((SELECT SUM(e.net_premium) FROM endorsement e WHERE
--           e.policy_id = p.id ...), p.net_premium) — runs once per policy row.
--           TEAMLEASE has 79 policies → 79 individual DB queries per company card click.
--           Result: 2-4 seconds per call × 9 companies = slow parallel load.
-- Fix     : Add endorsement_premiums CTE (scoped to company_id) before policy_insurer,
--           replace correlated subquery with a LEFT JOIN + COALESCE.
-- Expected: 2-4s → <0.5s per call.
-- =============================================================================

-- Fix 10a: Insert endorsement_premiums CTE after total_policy_emp_counts
-- NOTE: stored SQL uses no-indent CTEs with ),\n on its own line before CTE name
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$  GROUP BY peepm.policy_id
),
policy_insurer AS ($$,
$$  GROUP BY peepm.policy_id
),
endorsement_premiums AS (
  SELECT e.policy_id, SUM(e.net_premium) AS total_endorsement_premium
  FROM endorsement e
  INNER JOIN policy p_ep ON p_ep.id = e.policy_id
  WHERE e.net_premium IS NOT NULL
    AND p_ep.company_id = ###companyId###
  GROUP BY e.policy_id
),
policy_insurer AS ($$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_company_policies'
  AND query NOT LIKE '%endorsement_premiums AS%';

-- Fix 10b: Replace correlated subquery with CTE reference in SELECT
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$COALESCE((SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id AND e.net_premium IS NOT NULL), p.net_premium)$$,
$$COALESCE(ep.total_endorsement_premium, p.net_premium)$$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_company_policies'
  AND query LIKE '%endorsement_premiums AS%'
  AND query LIKE '%(SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id%';

-- Fix 10c: Add LEFT JOIN for endorsement_premiums in FROM clause
-- NOTE: stored SQL has no leading spaces on LEFT JOIN lines
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$LEFT JOIN total_policy_emp_counts tpec ON tpec.policy_id = p.id
WHERE p.company_id$$,
$$LEFT JOIN total_policy_emp_counts tpec ON tpec.policy_id = p.id
LEFT JOIN endorsement_premiums ep ON ep.policy_id = p.id
WHERE p.company_id$$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_company_policies'
  AND query LIKE '%endorsement_premiums AS%'
  AND query NOT LIKE '%LEFT JOIN endorsement_premiums ep%';


-- ── FIX 11: portfolio_company_policies — scope policy_insurer/tpa CTEs + endorsement index
-- Problem : policy_insurer and policy_tpa CTEs scan ALL rows in policy_insurer_map /
--           policy_tpa_map (every company's policies) before joining to the 79 policies
--           for this company. Still 2-3.7s per call even after Fix 10.
--           Also no index on endorsement.policy_id — endorsement_premiums CTE full-scans.
-- Fix     : Add WHERE clause to both CTEs scoping to company's policies.
--           Add partial index on endorsement(policy_id) WHERE net_premium IS NOT NULL.
-- Expected: 2-3.7s → <0.5s per call.
-- =============================================================================

-- Fix 11a: scope policy_insurer to company's policies
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),$$,
$$  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  WHERE pim.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),$$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_company_policies'
  AND query NOT LIKE '%WHERE pim.policy_id IN%';

-- Fix 11b: scope policy_tpa to company's policies
UPDATE admin_reports
SET
  query = REPLACE(
    query,
$$  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  ORDER BY ptm.policy_id, ptm.id
)
SELECT$$,
$$  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  WHERE ptm.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)
  ORDER BY ptm.policy_id, ptm.id
)
SELECT$$
  ),
  updated_at = NOW()
WHERE name = 'portfolio_company_policies'
  AND query NOT LIKE '%WHERE ptm.policy_id IN%';

-- Fix 11c: index for endorsement_premiums CTE scan
-- NOTE: CONCURRENTLY cannot run in a transaction block — run standalone
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_endorsement_policy_id
  ON endorsement (policy_id)
  WHERE net_premium IS NOT NULL;

-- Fix 11d: policy_insurer_map had no policy_id index — full table scan on every call
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policy_insurer_map_policy_id
  ON policy_insurer_map (policy_id);

-- Fix 11e: policy_tpa_map had no policy_id index — full table scan on every call
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policy_tpa_map_policy_id
  ON policy_tpa_map (policy_id);



-- ── FIX 12: dashboard_policy_cards — scope CTEs + add endorsement/login CTEs ──
-- Problem : policy_insurer + policy_tpa scan entire tables (all companies).
--           6 correlated endorsement subqueries run once per policy row.
--           4 correlated user_activity_log NOT EXISTS run once per policy row.
--           index missing on policy_claim.policy_id
-- Fix 12a : Scope policy_insurer CTE to company policies
-- Fix 12b : Scope policy_tpa CTE to company policies
-- Fix 12c : Insert endorsement_premiums + company_logged_in_users + policy_login_status CTEs
-- Fix 12d : Replace all 6 correlated endorsement subqueries with ep.total_endorsement_premium
-- Fix 12e : Replace 4 correlated user_activity_log subqueries with pls CTE refs
-- Fix 12f : Add LEFT JOINs for endorsement_premiums and policy_login_status
-- Fix 12g : Create index on policy_claim.policy_id
-- Frontend: dashboard_enrollment_status uses limit=0 (avoids double COUNT query)
-- =============================================================================

-- Fix 12a: Scope policy_insurer
UPDATE admin_reports SET query = REPLACE(query,
$a$  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_tpa AS ($a$,
$a$  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  WHERE pim.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_tpa AS ($a$
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%WHERE pim.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)%';

-- Fix 12b: Scope policy_tpa
UPDATE admin_reports SET query = REPLACE(query,
$a$  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  ORDER BY ptm.policy_id, ptm.id
),
policy_cd_running_balance AS ($a$,
$a$  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  WHERE ptm.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)
  ORDER BY ptm.policy_id, ptm.id
),
policy_cd_running_balance AS ($a$
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%WHERE ptm.policy_id IN (SELECT id FROM policy WHERE company_id = ###companyId###)%';

-- Fix 12c: Insert endorsement_premiums + login CTEs before SELECT
UPDATE admin_reports SET query = REPLACE(query,
$a$GROUP BY peepm.policy_id
)
SELECT
  p.id$a$,
$a$GROUP BY peepm.policy_id
),
endorsement_premiums AS (
  SELECT e.policy_id, SUM(e.net_premium) AS total_endorsement_premium
  FROM endorsement e
  INNER JOIN policy p_ep ON p_ep.id = e.policy_id
  WHERE e.net_premium IS NOT NULL
    AND p_ep.company_id = ###companyId###
  GROUP BY e.policy_id
),
company_logged_in_users AS (
  SELECT DISTINCT ual.user_id
  FROM user_activity_log ual
  WHERE ual.activity_key      = 'LOGGED_IN'
    AND ual.activity_category = 'AUTH'
    AND ual.deleted_at IS NULL
    AND ual.user_id IN (
      SELECT pee2.id
      FROM policy_enrollment_employee_policy_map peepm2
      INNER JOIN policy_enrollment_employee pee2 ON pee2.id = peepm2.employee_id AND pee2.deleted_at IS NULL
      INNER JOIN policy p2 ON p2.id = peepm2.policy_id AND p2.company_id = ###companyId###
      WHERE peepm2.deleted_at IS NULL
    )
),
policy_login_status AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id) FILTER (WHERE clu.user_id IS NOT NULL) AS logged_in_count,
    COUNT(DISTINCT peepm.employee_id) FILTER (WHERE clu.user_id IS NULL)     AS not_logged_in_count
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy_enrollment_employee pee ON pee.id = peepm.employee_id AND pee.deleted_at IS NULL
  INNER JOIN policy p_ls ON p_ls.id = peepm.policy_id AND p_ls.company_id = ###companyId###
  LEFT JOIN company_logged_in_users clu ON clu.user_id = pee.id
  WHERE peepm.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)
      OR peepm.employee_id IN (SELECT employee_id FROM loc_employees)
    )
  GROUP BY peepm.policy_id
)
SELECT
  p.id$a$
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%endorsement_premiums AS%';

-- Fix 12d: Replace all 6 correlated endorsement subqueries
UPDATE admin_reports SET query = REPLACE(query,
  '(SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id AND e.net_premium IS NOT NULL)',
  'ep.total_endorsement_premium'
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query LIKE '%(SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id AND e.net_premium IS NOT NULL)%';

-- Fix 12e-1: Replace notEnrolledCount correlated subquery
UPDATE admin_reports SET query = REPLACE(query,
$a$  (
    SELECT COUNT(DISTINCT pee_nl.id)
    FROM policy_enrollment_employee_policy_map peepm_nl
    JOIN policy_enrollment_employee pee_nl
      ON pee_nl.id = peepm_nl.employee_id AND pee_nl.deleted_at IS NULL
    WHERE peepm_nl.policy_id  = p.id
      AND peepm_nl.deleted_at IS NULL
      AND (
        (SELECT is_all FROM loc_filter)
        OR peepm_nl.employee_id IN (SELECT employee_id FROM loc_employees)
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_activity_log ual
        WHERE ual.user_id           = pee_nl.id
          AND ual.activity_key      = 'LOGGED_IN'
          AND ual.activity_category = 'AUTH'
          AND ual.deleted_at IS NULL
      )
  )                                                                                                   AS "notEnrolledCount"$a$,
$a$  COALESCE(pls.not_logged_in_count, 0) AS "notEnrolledCount"$a$
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards';

-- Fix 12e-2: Replace notEnrolledPercent correlated subquery
UPDATE admin_reports SET query = REPLACE(query,
$a$  ROUND(
    (SELECT COUNT(DISTINCT pee_np.id)
     FROM policy_enrollment_employee_policy_map peepm_np
     JOIN policy_enrollment_employee pee_np
       ON pee_np.id = peepm_np.employee_id AND pee_np.deleted_at IS NULL
     WHERE peepm_np.policy_id  = p.id
       AND peepm_np.deleted_at IS NULL
       AND (
         (SELECT is_all FROM loc_filter)
         OR peepm_np.employee_id IN (SELECT employee_id FROM loc_employees)
       )
       AND NOT EXISTS (
         SELECT 1 FROM user_activity_log ual2
         WHERE ual2.user_id           = pee_np.id
           AND ual2.activity_key      = 'LOGGED_IN'
           AND ual2.activity_category = 'AUTH'
           AND ual2.deleted_at IS NULL
       )
    ) * 100.0 / NULLIF(pec.employee_count, 0), 1)                                                   AS "notEnrolledPercent"$a$,
$a$  ROUND(COALESCE(pls.not_logged_in_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1) AS "notEnrolledPercent"$a$
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards';

-- Fix 12e-3: Replace notLoggedInCount correlated subquery
UPDATE admin_reports SET query = REPLACE(query,
$a$  (
    SELECT COUNT(DISTINCT pee_nli.id)
    FROM policy_enrollment_employee_policy_map peepm_nli
    JOIN policy_enrollment_employee pee_nli
      ON pee_nli.id = peepm_nli.employee_id AND pee_nli.deleted_at IS NULL
    WHERE peepm_nli.policy_id  = p.id
      AND peepm_nli.deleted_at IS NULL
      AND (
        (SELECT is_all FROM loc_filter)
        OR peepm_nli.employee_id IN (SELECT employee_id FROM loc_employees)
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_activity_log ual_nli
        WHERE ual_nli.user_id           = pee_nli.id
          AND ual_nli.activity_key      = 'LOGGED_IN'
          AND ual_nli.activity_category = 'AUTH'
          AND ual_nli.deleted_at IS NULL
      )
  )                                                                                                   AS "notLoggedInCount"$a$,
$a$  COALESCE(pls.not_logged_in_count, 0) AS "notLoggedInCount"$a$
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards';

-- Fix 12e-4: Replace loggedInCount correlated subquery
UPDATE admin_reports SET query = REPLACE(query,
$a$  (
    SELECT COUNT(DISTINCT pee_li.id)
    FROM policy_enrollment_employee_policy_map peepm_li
    JOIN policy_enrollment_employee pee_li
      ON pee_li.id = peepm_li.employee_id AND pee_li.deleted_at IS NULL
    WHERE peepm_li.policy_id  = p.id
      AND peepm_li.deleted_at IS NULL
      AND (
        (SELECT is_all FROM loc_filter)
        OR peepm_li.employee_id IN (SELECT employee_id FROM loc_employees)
      )
      AND EXISTS (
        SELECT 1 FROM user_activity_log ual_li
        WHERE ual_li.user_id           = pee_li.id
          AND ual_li.activity_key      = 'LOGGED_IN'
          AND ual_li.activity_category = 'AUTH'
          AND ual_li.deleted_at IS NULL
      )
  )                                                                                                   AS "loggedInCount"$a$,
$a$  COALESCE(pls.logged_in_count, 0) AS "loggedInCount"$a$
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards';

-- Fix 12f: Add LEFT JOINs for new CTEs
UPDATE admin_reports SET query = REPLACE(query,
$a$LEFT JOIN loc_premium_ratios lpr       ON lpr.policy_id = p.id
WHERE p.company_id = ###companyId###$a$,
$a$LEFT JOIN loc_premium_ratios lpr       ON lpr.policy_id = p.id
LEFT JOIN endorsement_premiums ep        ON ep.policy_id = p.id
LEFT JOIN policy_login_status pls        ON pls.policy_id = p.id
WHERE p.company_id = ###companyId###$a$
), updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%LEFT JOIN endorsement_premiums ep%';

-- Fix 12g: Index on policy_claim.policy_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policy_claim_policy_id ON policy_claim (policy_id) WHERE deleted_at IS NULL;

-- Fix 13: Partial index on user_activity_log for LOGGED_IN auth queries
-- NOTE: idx_ual_user_id_activity (user_id, activity_key, activity_category) WHERE deleted_at IS NULL already exists
-- and covers this pattern. The separate idx_ual_auth_login_user below is a narrower partial index for the same queries.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ual_auth_login_user
ON user_activity_log(user_id)
WHERE activity_key = 'LOGGED_IN' AND activity_category = 'AUTH' AND deleted_at IS NULL;

-- Fix 14a: Composite index on policy_employee_enrollment for latest_enrollment DISTINCT ON (employee_id)
-- dashboard_enrollment_status latest_enrollment CTE does: ORDER BY employee_id, updated_at DESC, id DESC
-- With 992K rows and no composite index, this forces a full sort of all company's enrollment records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pee_policy_employee_updated
ON policy_employee_enrollment(policy_id, employee_id, updated_at DESC, id DESC)
WHERE deleted_at IS NULL;

-- Fix 14b: Index on policy_enrollment_dependent(policy_id) for policy_dependent_counts CTE
-- 883K rows, full table scan without this — joins via policy_id to filter to company's policies
-- NOTE: name idx_ped_policy_id is taken by policy_extension_documents — use distinct name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policy_enrollment_dep_policy_id
ON policy_enrollment_dependent(policy_id)
WHERE deleted_at IS NULL;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT name, updated_at,
  CASE
    WHEN name = 'dashboard_policy_cards'
      AND query LIKE '%p_ec.company_id%'
      AND query LIKE '%p_dc.company_id%'
      AND query LIKE '%p_pen.company_id%'      THEN 'all 3 CTEs scoped ✓'
    WHEN name = 'dashboard_enrollment_status'
      AND query LIKE '%es_u%'                  THEN 'login-scoped ✓'
    WHEN name = 'portfolio_group_companies'
      AND query LIKE '%gcm_psc%'               THEN 'group-scoped ✓'
    WHEN name = 'external_hr_company_locations'
      AND query LIKE '%DISTINCT ON (a.addr_1)%' THEN 'deduplicated ✓'
    WHEN name = 'portfolio_company_policies'
      AND query LIKE '%endorsement_premiums AS%'
      AND query LIKE '%cpcl_loc%'              THEN 'endorsement-CTE + location-fix ✓'
    ELSE 'NOT APPLIED ✗'
  END AS fix_status
FROM admin_reports
WHERE name IN (
  'external_hr_company_locations',
  'dashboard_policy_cards',
  'portfolio_company_policies',
  'dashboard_enrollment_status',
  'portfolio_group_companies'
)
ORDER BY name;


-- =============================================================================
-- FIX 15: dashboard_policy_cards — add policyId filter (single-policy scenario)
-- Problem : policyId is sent from UI when navigating from a policy card, but the
--           SQL has no ###policyId### placeholder — ALL company policies returned.
-- Fix 15a : Add AND (###policyId### = '' OR p.id::text = ###policyId###) to WHERE.
-- Fix 15b : Register policyId in admin_reports_parameters for report id=22.
-- =============================================================================

-- Fix 15a: add policyId = p.id filter to final SELECT WHERE clause
-- The SQL already had ###policyId### for the status-bypass logic (###policyId### != '')
-- but was missing the actual row filter (p.id::text = ###policyId###).
-- Result: sending policyId='749679' returned ALL policies because '749679' != '' is always TRUE.
UPDATE admin_reports
SET
  query = REPLACE(query,
    E'WHERE p.company_id = ###companyId###\n  AND (\n    -- When a specific policyId is provided, bypass status filter (show it regardless of active/inactive)\n    ###policyId### != \'\'',
    E'WHERE p.company_id = ###companyId###\n  AND (###policyId### = \'\' OR p.id::text = ###policyId###)\n  AND (\n    -- When a specific policyId is provided, bypass status filter (show it regardless of active/inactive)\n    ###policyId### != \'\''
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%(###policyId### = ''''%';

-- Fix 15b: register policyId parameter (idempotent — skip if already exists)
-- NOTE: Uses subquery for admin_report_id to avoid hardcoding env-specific numeric IDs.
--       (id=22 in anon/prod but may differ in dev/qa/staging)
INSERT INTO admin_reports_parameters
  (admin_report_id, parameter_name, label, data_type, query_parameter, input_field_type, option_type, option, order_no, created_at, updated_at, created_by, updated_by)
SELECT
  ar.id, 'policyId', 'Policy ID', 'string', '###policyId###', 'input', 'none', '{}', 99, NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM admin_reports ar
WHERE ar.name = 'dashboard_policy_cards'
  AND NOT EXISTS (
    SELECT 1 FROM admin_reports_parameters arp
    WHERE arp.admin_report_id = ar.id AND arp.parameter_name = 'policyId'
  );

-- Verify
SELECT
  name,
  CASE
    WHEN query LIKE '%###policyId###%' THEN 'policyId filter ✓'
    ELSE 'policyId filter MISSING ✗'
  END AS fix15_status
FROM admin_reports
WHERE name = 'dashboard_policy_cards';


-- =============================================================================
-- NAVIGATION SCENARIOS — TWO PATHS TO THE HR DASHBOARD
-- =============================================================================
-- Understanding these two scenarios is essential for all performance fixes below.
--
-- SCENARIO A — COMPANY CARD BUTTON (portfolio → dashboard, no policyId)
--   UI path  : HR Portal Portfolio → clicks "View Dashboard" button on a company card
--   Params   : companyId=190550, policyId="" (empty), locationIds="" (empty)
--   Expected : Show ALL policies for that company (paginated, page=1&limit=10)
--   APIs     : dashboard_policy_cards?page=1&limit=10
--              dashboard_enrollment_status?page=1&limit=0
--
-- SCENARIO B — POLICY CARD BUTTON (portfolio → dashboard, with policyId)
--   UI path  : HR Portal Portfolio → clicks a specific policy card tile
--   Params   : companyId=190550, policyId=749406 (specific policy), locationIds=""
--   Expected : Show ONLY that one policy (limit=0 — no pagination needed for 1 result)
--   APIs     : dashboard_policy_cards?page=1&limit=0   ← limit=0 skips COUNT, returns 1 row
--              dashboard_enrollment_status?page=1&limit=0
--
-- PROBLEM BEFORE THESE FIXES (Scenario A, TEAMLEASE company_id=190550):
--   dashboard_policy_cards     → 6–7 seconds   (should be <1s)
--   dashboard_enrollment_status → 4–5 seconds  (should be <1s)
--
-- ROOT CAUSE:
--   1. dashboard_enrollment_status — policy_scope CTE scanned 848K peepm rows to find
--      22 policy IDs. Then employee_scope scanned 848K peepm rows AGAIN to find 151799
--      employees. Total: 2 full table scans of a 848K-row table = ~3s wasted.
--   2. dashboard_policy_cards — company_logged_in_users CTE contained a subquery that
--      scanned peepm (848K) → pee (673K) → policy (79) just to get company employee IDs.
--      But pee.company_id = X can do this in one indexed lookup.
-- =============================================================================


-- ── FIX 16a: dashboard_enrollment_status — rewrite policy_scope ───────────────
-- Problem : policy_scope CTE started from peepm (848K rows) to find 22 policy IDs.
--           Scan plan: peepm (848K rows, seq scan) → hash join policy (79 rows) = 2.3s
-- Fix     : Start from policy table directly. idx_policy_company_id returns 79 rows
--           in <1ms. Location filter moved to employee_scope (where it belongs).
-- Expected: policy_scope: 2300ms → <5ms
-- =============================================================================
UPDATE admin_reports
SET query = REPLACE(query,
$old16a$WITH policy_scope AS (
  SELECT DISTINCT peepm.policy_id
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy_enrollment_employee pee
    ON pee.id = peepm.employee_id AND pee.deleted_at IS NULL
  INNER JOIN policy p ON p.id = peepm.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND peepm.deleted_at IS NULL
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee.policy_config_location_id IN (
        SELECT cpcl_loc.id
        FROM company_policy_configuration_location cpcl_loc
        WHERE cpcl_loc.address_id IN (
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
      )
    )
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
    AND (###externalHrUserId### IS NULL
         OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
),$old16a$,
$new16a$WITH policy_scope AS (
  SELECT p.id AS policy_id
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
    AND (###externalHrUserId### IS NULL
         OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
),$new16a$),
  updated_at = NOW()
WHERE name = 'dashboard_enrollment_status'
  AND query LIKE '%SELECT DISTINCT peepm.policy_id%'
  AND query NOT LIKE '%SELECT p.id AS policy_id%';


-- ── FIX 16b: dashboard_enrollment_status — rewrite employee_scope ─────────────
-- Problem : employee_scope scanned peepm (848K rows) AGAIN + pee (673K rows) to get
--           151799 distinct company employees. HashAggregate spilled to disk = 6.9s.
-- Fix     : Start from policy_enrollment_employee.company_id index (151799 rows via
--           idx_policy_enrollment_emp_company_id). EXISTS check via unique index on
--           peepm(employee_id, policy_id) confirms enrollment without full table scan.
--           No DISTINCT needed (pee.id is PK, already unique).
-- Expected: employee_scope: 6900ms → ~200–400ms
-- =============================================================================
UPDATE admin_reports
SET query = REPLACE(query,
$old16b$employee_scope AS (
  SELECT DISTINCT peepm.employee_id, pee.user_id
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy_scope ps ON ps.policy_id = peepm.policy_id
  INNER JOIN policy_enrollment_employee pee ON pee.id = peepm.employee_id AND pee.deleted_at IS NULL
  WHERE peepm.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee.policy_config_location_id IN (
        SELECT cpcl_loc.id
        FROM company_policy_configuration_location cpcl_loc
        WHERE cpcl_loc.address_id IN (
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
      )
    )
),$old16b$,
$new16b$employee_scope AS (
  SELECT pee.id AS employee_id, pee.user_id
  FROM policy_enrollment_employee pee
  WHERE pee.company_id = ###companyId###
    AND pee.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM policy_enrollment_employee_policy_map peepm
      WHERE peepm.employee_id = pee.id
        AND peepm.deleted_at IS NULL
        AND peepm.policy_id IN (SELECT ps.policy_id FROM policy_scope ps)
    )
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee.policy_config_location_id IN (
        SELECT cpcl_loc.id
        FROM company_policy_configuration_location cpcl_loc
        WHERE cpcl_loc.address_id IN (
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
      )
    )
),$new16b$),
  updated_at = NOW()
WHERE name = 'dashboard_enrollment_status'
  AND query LIKE '%SELECT DISTINCT peepm.employee_id, pee.user_id%'
  AND query NOT LIKE '%peepm.employee_id = pee.id%';


-- ── FIX 16c: index for latest_enrollment DISTINCT ON sort ─────────────────────
-- Problem : latest_enrollment does DISTINCT ON (employee_id) ORDER BY employee_id,
--           updated_at DESC, id DESC. Sorts 277K rows — spills 17944kB to disk.
-- Fix     : Index on (employee_id, updated_at DESC, id DESC) allows index-only scan
--           for DISTINCT ON. PostgreSQL reads the index in order, takes first row per
--           employee_id without sorting.
-- NOTE    : If DB disk is full this will still fail. Free disk space first.
-- Expected: latest_enrollment sort: ~1100ms → <50ms
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pee_enrollment_employee_updated
ON policy_employee_enrollment(employee_id, updated_at DESC, id DESC)
WHERE deleted_at IS NULL;


-- ── FIX 17: dashboard_policy_cards — remove redundant peepm scan in company_logged_in_users
-- Problem : company_logged_in_users CTE had an inner subquery:
--             SELECT pee2.id
--             FROM policy_enrollment_employee_policy_map peepm2  ← 848K rows, seq scan
--             INNER JOIN policy_enrollment_employee pee2 ON ...
--             INNER JOIN policy p2 ON ... AND p2.company_id = ###companyId###
--           This was a 3rd full peepm scan just to get company employee IDs.
-- Fix     : Replace with direct pee.company_id lookup (idx_policy_enrollment_emp_company_id).
-- Expected: Saves ~300–500ms (one peepm seq scan eliminated).
-- =============================================================================
UPDATE admin_reports
SET query = REPLACE(query,
$old17$      SELECT pee2.id
      FROM policy_enrollment_employee_policy_map peepm2
      INNER JOIN policy_enrollment_employee pee2 ON pee2.id = peepm2.employee_id AND pee2.deleted_at IS NULL
      INNER JOIN policy p2 ON p2.id = peepm2.policy_id AND p2.company_id = ###companyId###
      WHERE peepm2.deleted_at IS NULL$old17$,
$new17$      SELECT pee2.id
      FROM policy_enrollment_employee pee2
      WHERE pee2.company_id = ###companyId### AND pee2.deleted_at IS NULL$new17$),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query LIKE '%peepm2.deleted_at IS NULL%'
  AND query NOT LIKE '%pee2.company_id = ###companyId###%';


-- ── FIX 17d: VERIFY all new fixes ────────────────────────────────────────────
SELECT
  name,
  CASE
    WHEN name = 'dashboard_enrollment_status'
      AND query LIKE '%SELECT p.id AS policy_id%'  THEN 'Fix16a policy_scope ✓'
    WHEN name = 'dashboard_enrollment_status'
      AND query NOT LIKE '%SELECT p.id AS policy_id%' THEN 'Fix16a MISSING ✗'
    ELSE 'n/a'
  END AS fix16a,
  CASE
    WHEN name = 'dashboard_enrollment_status'
      AND query LIKE '%peepm.employee_id = pee.id%' THEN 'Fix16b employee_scope ✓'
    WHEN name = 'dashboard_enrollment_status'
      AND query NOT LIKE '%peepm.employee_id = pee.id%' THEN 'Fix16b MISSING ✗'
    ELSE 'n/a'
  END AS fix16b,
  CASE
    WHEN name = 'dashboard_policy_cards'
      AND query LIKE '%pee2.company_id = ###companyId###%' THEN 'Fix17 company_logged_in_users ✓'
    WHEN name = 'dashboard_policy_cards'
      AND query NOT LIKE '%pee2.company_id = ###companyId###%' THEN 'Fix17 MISSING ✗'
    ELSE 'n/a'
  END AS fix17
FROM admin_reports
WHERE name IN ('dashboard_enrollment_status', 'dashboard_policy_cards')
ORDER BY name;
