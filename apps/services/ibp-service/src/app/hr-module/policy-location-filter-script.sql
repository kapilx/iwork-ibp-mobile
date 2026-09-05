-- =============================================================================
-- policy-location-filter-script.sql
-- Adds locationIds filtering to all HR dashboard reports.
--
-- HOW IT WORKS:
--   Each report receives ###locationIds### as a comma-separated string of
--   address.id values (e.g. "326865,326866").  When empty string '' is passed
--   (or the parameter is NULL), ALL locations are shown (no restriction).
--
-- TWO FILTER PATTERNS USED:
--   Pattern A (employee-level): filters via policy_enrollment_employee.policy_location
--                               matching address.addr_1 of the selected IDs.
--   Pattern B (policy-level):   filters via policy_configuration JSONB
--                               selectedLocationIds containing the selected IDs.
--
-- Run AFTER external-hr-report-filters.sql.
-- Safe to re-run (all patches are idempotent via query REPLACE checks).
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: Register the constraint for uq_admin_reports_parameters_report_param
--         (same as in external-hr-report-filters.sql — safe to re-run)
-- =============================================================================
DO $CONSTRAINT$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_admin_reports_parameters_report_param'
  ) THEN
    ALTER TABLE admin_reports_parameters
      ADD CONSTRAINT uq_admin_reports_parameters_report_param
      UNIQUE (admin_report_id, parameter_name);
  END IF;
END $CONSTRAINT$;


-- =============================================================================
-- HELPER: Upsert a locationIds parameter for a given report name
-- =============================================================================
CREATE OR REPLACE FUNCTION _upsert_location_param(p_report_name TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_report_id INTEGER;
BEGIN
  SELECT id INTO v_report_id FROM admin_reports WHERE name = p_report_name;
  IF v_report_id IS NULL THEN
    RAISE NOTICE 'Report % not found — skipping locationIds param registration', p_report_name;
    RETURN;
  END IF;

  INSERT INTO admin_reports_parameters
    (admin_report_id, parameter_name, query_parameter, created_at, updated_at)
  VALUES
    (v_report_id, 'locationIds', '###locationIds###', NOW(), NOW())
  ON CONFLICT (admin_report_id, parameter_name)
  DO UPDATE SET query_parameter = '###locationIds###', updated_at = NOW();

  RAISE NOTICE 'locationIds param registered for %', p_report_name;
END;
$$;

-- Register for all 9 target reports
SELECT _upsert_location_param('dashboard_enrollment_status');
SELECT _upsert_location_param('portfolio_kpi_summary');
SELECT _upsert_location_param('endorsement_overview');
SELECT _upsert_location_param('endorsement_employee_metrics');
SELECT _upsert_location_param('endorsement_list');
SELECT _upsert_location_param('cd_kpi_summary');
SELECT _upsert_location_param('cd_account_details');
SELECT _upsert_location_param('cd_transactions');
SELECT _upsert_location_param('policy_claim_history');
SELECT _upsert_location_param('dashboard_policy_cards');

DROP FUNCTION IF EXISTS _upsert_location_param(TEXT);


-- =============================================================================
-- LOCATION FILTER MACRO DEFINITIONS
-- =============================================================================

-- Pattern A: Employee-level — matches policy_enrollment_employee.policy_location
--   against address.addr_1 for the given address IDs.
-- Safe for: NULL, '', '[]', '[1,2,3]', '1,2,3' inputs.
--
--   AND (
--     NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
--     OR LOWER(TRIM(<policy_location_col>)) IN (
--       SELECT LOWER(TRIM(a.addr_1))
--       FROM address a
--       WHERE a.id = ANY(
--         SELECT val::INTEGER
--         FROM regexp_split_to_table(
--           NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
--           ','
--         ) AS val
--         WHERE val ~ '^\d+$'
--       )
--       AND a.deleted_at IS NULL
--     )
--   )
--
-- Pattern B: Policy-level — matches policy_configuration.policyConfiguration
--   JSONB field selectedLocationIds against selected address IDs.
-- Safe for: NULL, '', '[]', '[1,2,3]', '1,2,3' inputs.
--
--   AND (
--     NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
--     OR EXISTS (
--       SELECT 1
--       FROM policy_configuration pcfg,
--            jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
--       WHERE pcfg.policy_id = p.id
--         AND loc_id::INTEGER = ANY(
--         SELECT val::INTEGER
--         FROM regexp_split_to_table(
--           NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
--           ','
--         ) AS val
--         WHERE val ~ '^\d+$'
--       )
--     )
--   )


-- =============================================================================
-- STEP 2: dashboard_enrollment_status  (Pattern B — policy-level)
--
-- NOTE: Uses Pattern B (not Pattern A) because the externalHrUserId anchor
-- sits inside the policy_scope CTE WHERE clause.  Only 'p' (policy) is in
-- scope there — 'pee' (policy_enrollment_employee) is NOT available.
-- Pattern B correlates policy_configuration to 'p.id', which works.
-- =============================================================================
DO $LOC_ENROLLMENT$
DECLARE
  report_id INTEGER;
  current_query TEXT;
  location_snippet TEXT;
  target_marker TEXT;
BEGIN
  SELECT id, query INTO report_id, current_query
  FROM admin_reports WHERE name = 'dashboard_enrollment_status';
  IF report_id IS NULL THEN
    RAISE NOTICE 'dashboard_enrollment_status not found — skip location patch';
    RETURN;
  END IF;

  location_snippet := $SNAP$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_configuration pcfg,
           jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
      WHERE pcfg.policy_id = p.id
        AND loc_id::INTEGER = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
    )
  )$SNAP$;

  IF current_query LIKE '%###locationIds###%' THEN
    RAISE NOTICE 'dashboard_enrollment_status: location filter already present — skip';
    RETURN;
  END IF;

  -- Insert before the externalHrUserId anchor inside policy_scope CTE.
  -- Both are inside policy_scope WHERE where 'p' is in scope.
  target_marker := 'AND (###externalHrUserId### IS NULL';
  IF current_query NOT LIKE ('%' || target_marker || '%') THEN
    UPDATE admin_reports
    SET query = rtrim(rtrim(current_query, ';')) || location_snippet
    WHERE id = report_id;
  ELSE
    UPDATE admin_reports
    SET query = replace(
      current_query,
      target_marker,
      location_snippet || E'\n  ' || target_marker
    )
    WHERE id = report_id;
  END IF;

  RAISE NOTICE 'dashboard_enrollment_status: locationIds filter applied (Pattern B — policy-level, pcfg alias).';
END $LOC_ENROLLMENT$;


-- =============================================================================
-- STEP 3: portfolio_kpi_summary  (Pattern A — employee-level)
-- =============================================================================
DO $LOC_KPI$
DECLARE
  report_id INTEGER;
  current_query TEXT;
  location_snippet TEXT;
  target_marker TEXT;
BEGIN
  SELECT id, query INTO report_id, current_query
  FROM admin_reports WHERE name = 'portfolio_kpi_summary';
  IF report_id IS NULL THEN RAISE NOTICE 'portfolio_kpi_summary not found — skip'; RETURN; END IF;

  IF current_query LIKE '%###locationIds###%' THEN
    RAISE NOTICE 'portfolio_kpi_summary: location filter already present — skip'; RETURN;
  END IF;

  location_snippet := $SNAP$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR LOWER(TRIM(pee.policy_location)) IN (
      SELECT LOWER(TRIM(a.addr_1))
      FROM address a
      WHERE a.id = ANY(
        SELECT val::INTEGER
        FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
          ','
        ) AS val
        WHERE val ~ '^\d+$'
      )
      AND a.deleted_at IS NULL
    )
  )$SNAP$;

  target_marker := 'AND (###externalHrUserId### IS NULL';
  IF current_query NOT LIKE ('%' || target_marker || '%') THEN
    UPDATE admin_reports SET query = rtrim(rtrim(current_query, ';')) || location_snippet WHERE id = report_id;
  ELSE
    UPDATE admin_reports
    SET query = replace(current_query, target_marker, location_snippet || E'\n  ' || target_marker)
    WHERE id = report_id;
  END IF;

  RAISE NOTICE 'portfolio_kpi_summary: locationIds filter applied (Pattern A).';
END $LOC_KPI$;


-- =============================================================================
-- STEP 4: policy_claim_history  (Pattern A — employee-level)
-- =============================================================================
DO $LOC_CLAIMS$
DECLARE
  report_id INTEGER;
  current_query TEXT;
  location_snippet TEXT;
  target_marker TEXT;
BEGIN
  SELECT id, query INTO report_id, current_query
  FROM admin_reports WHERE name = 'policy_claim_history';
  IF report_id IS NULL THEN RAISE NOTICE 'policy_claim_history not found — skip'; RETURN; END IF;

  IF current_query LIKE '%###locationIds###%' THEN
    RAISE NOTICE 'policy_claim_history: location filter already present — skip'; RETURN;
  END IF;

  -- Claims join to policy_enrollment_employee via employee_id
  -- The pee alias or pee.policy_location may vary — use a generic address-based approach
  location_snippet := $SNAP$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR LOWER(TRIM(pee.policy_location)) IN (
      SELECT LOWER(TRIM(a.addr_1))
      FROM address a
      WHERE a.id = ANY(
        SELECT val::INTEGER
        FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
          ','
        ) AS val
        WHERE val ~ '^\d+$'
      )
      AND a.deleted_at IS NULL
    )
  )$SNAP$;

  target_marker := 'AND (###externalHrUserId### IS NULL';
  IF current_query NOT LIKE ('%' || target_marker || '%') THEN
    UPDATE admin_reports SET query = rtrim(rtrim(current_query, ';')) || location_snippet WHERE id = report_id;
  ELSE
    UPDATE admin_reports
    SET query = replace(current_query, target_marker, location_snippet || E'\n  ' || target_marker)
    WHERE id = report_id;
  END IF;

  RAISE NOTICE 'policy_claim_history: locationIds filter applied (Pattern A).';
END $LOC_CLAIMS$;


-- =============================================================================
-- STEP 5: endorsement_overview, endorsement_employee_metrics, endorsement_list
--         (Pattern A — employee-level)
-- =============================================================================
DO $LOC_ENDORSEMENTS$
DECLARE
  rname TEXT;
  report_id INTEGER;
  current_query TEXT;
  location_snippet TEXT;
  target_marker TEXT;
BEGIN
  location_snippet := $SNAP$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR LOWER(TRIM(pee.policy_location)) IN (
      SELECT LOWER(TRIM(a.addr_1))
      FROM address a
      WHERE a.id = ANY(
        SELECT val::INTEGER
        FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
          ','
        ) AS val
        WHERE val ~ '^\d+$'
      )
      AND a.deleted_at IS NULL
    )
  )$SNAP$;
  target_marker := 'AND (###externalHrUserId### IS NULL';

  FOREACH rname IN ARRAY ARRAY['endorsement_overview','endorsement_employee_metrics','endorsement_list']
  LOOP
    SELECT id, query INTO report_id, current_query FROM admin_reports WHERE name = rname;
    IF report_id IS NULL THEN RAISE NOTICE '% not found — skip', rname; CONTINUE; END IF;
    IF current_query LIKE '%###locationIds###%' THEN
      RAISE NOTICE '%: location filter already present — skip', rname; CONTINUE;
    END IF;

    IF current_query NOT LIKE ('%' || target_marker || '%') THEN
      UPDATE admin_reports SET query = rtrim(rtrim(current_query, ';')) || location_snippet WHERE id = report_id;
    ELSE
      UPDATE admin_reports
      SET query = replace(current_query, target_marker, location_snippet || E'\n  ' || target_marker)
      WHERE id = report_id;
    END IF;
    RAISE NOTICE '%: locationIds filter applied (Pattern A).', rname;
  END LOOP;
END $LOC_ENDORSEMENTS$;


-- =============================================================================
-- STEP 6: cd_kpi_summary, cd_account_details, cd_transactions
--         (Pattern B — policy-level, via policy_configuration JSONB)
-- =============================================================================
DO $LOC_CD$
DECLARE
  rname TEXT;
  report_id INTEGER;
  current_query TEXT;
  location_snippet TEXT;
  target_marker TEXT;
BEGIN
  -- Pattern B: filter by whether the policy's selectedLocationIds contains
  -- any of the requested address IDs.
  -- Assumes the report has an alias 'pc' for policy_configuration
  -- OR uses a subquery. Adjust alias if needed per report.
  location_snippet := $SNAP$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_configuration pcfg,
           jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
      WHERE pcfg.policy_id = p.id
        AND loc_id::INTEGER = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
    )
  )$SNAP$;
  target_marker := 'AND (###externalHrUserId### IS NULL';

  FOREACH rname IN ARRAY ARRAY['cd_kpi_summary','cd_account_details','cd_transactions']
  LOOP
    SELECT id, query INTO report_id, current_query FROM admin_reports WHERE name = rname;
    IF report_id IS NULL THEN RAISE NOTICE '% not found — skip', rname; CONTINUE; END IF;
    IF current_query LIKE '%###locationIds###%' THEN
      RAISE NOTICE '%: location filter already present — skip', rname; CONTINUE;
    END IF;

    IF current_query NOT LIKE ('%' || target_marker || '%') THEN
      UPDATE admin_reports SET query = rtrim(rtrim(current_query, ';')) || location_snippet WHERE id = report_id;
    ELSE
      UPDATE admin_reports
      SET query = replace(current_query, target_marker, location_snippet || E'\n  ' || target_marker)
      WHERE id = report_id;
    END IF;
    RAISE NOTICE '%: locationIds filter applied (Pattern B — policy JSONB).', rname;
  END LOOP;
END $LOC_CD$;


-- =============================================================================
-- STEP 7: dashboard_policy_cards  (Pattern B — policy-level)
-- =============================================================================
DO $LOC_POLICY_CARDS$
DECLARE
  report_id INTEGER;
  current_query TEXT;
  location_snippet TEXT;
  target_marker TEXT;
BEGIN
  SELECT id, query INTO report_id, current_query
  FROM admin_reports WHERE name = 'dashboard_policy_cards';
  IF report_id IS NULL THEN RAISE NOTICE 'dashboard_policy_cards not found — skip'; RETURN; END IF;

  IF current_query LIKE '%###locationIds###%' THEN
    RAISE NOTICE 'dashboard_policy_cards: location filter already present — skip'; RETURN;
  END IF;

  location_snippet := $SNAP$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_configuration pcfg,
           jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
      WHERE pcfg.policy_id = p.id
        AND loc_id::INTEGER = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
    )
  )$SNAP$;

  -- dashboard_policy_cards may not have externalHrUserId yet;
  -- find a stable WHERE anchor (companyId filter is always present)
  target_marker := 'AND (###externalHrUserId### IS NULL';
  IF current_query NOT LIKE ('%' || target_marker || '%') THEN
    -- Append before ORDER BY or end
    IF current_query ~* 'ORDER\s+BY' THEN
      UPDATE admin_reports
      SET query = regexp_replace(
        current_query,
        '(ORDER\s+BY)',
        location_snippet || E'\n\\1',
        'i'
      )
      WHERE id = report_id;
    ELSE
      UPDATE admin_reports SET query = rtrim(rtrim(current_query, ';')) || location_snippet WHERE id = report_id;
    END IF;
  ELSE
    UPDATE admin_reports
    SET query = replace(current_query, target_marker, location_snippet || E'\n  ' || target_marker)
    WHERE id = report_id;
  END IF;

  RAISE NOTICE 'dashboard_policy_cards: locationIds filter applied (Pattern B — policy JSONB).';
END $LOC_POLICY_CARDS$;


-- =============================================================================
-- STEP 8: Register external_hr_company_locations report if missing
--         (Admin Report 55 — fetches addr_1 for a company's locations)
-- =============================================================================
DO $LOC_REPORT$
DECLARE
  exists_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO exists_count FROM admin_reports WHERE name = 'external_hr_company_locations';
  IF exists_count > 0 THEN
    RAISE NOTICE 'external_hr_company_locations already exists — skip';
    RETURN;
  END IF;

  INSERT INTO admin_reports (name, query, created_at, updated_at)
  VALUES (
    'external_hr_company_locations',
    $SQL$
      SELECT DISTINCT a.id, a.addr_1
      FROM company_policy_configuration_location cpcl
      JOIN address a ON a.id = cpcl.address_id
      WHERE cpcl.company_id = ###companyId###::INTEGER
        AND cpcl.deleted_at IS NULL
        AND a.deleted_at IS NULL
      ORDER BY a.addr_1 ASC
    $SQL$,
    NOW(), NOW()
  );

  -- Register the companyId parameter for this report
  INSERT INTO admin_reports_parameters (admin_report_id, parameter_name, query_parameter, created_at, updated_at)
  SELECT id, 'companyId', '###companyId###', NOW(), NOW()
  FROM admin_reports WHERE name = 'external_hr_company_locations'
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'external_hr_company_locations report created.';
END $LOC_REPORT$;


-- =============================================================================
-- VERIFICATION: Show current locationIds param registrations
-- =============================================================================
SELECT
  ar.name AS report_name,
  arp.parameter_name,
  arp.query_parameter
FROM admin_reports ar
JOIN admin_reports_parameters arp ON arp.admin_report_id = ar.id
WHERE arp.parameter_name = 'locationIds'
ORDER BY ar.name;

COMMIT;

-- =============================================================================
-- FRONTEND CHANGES REQUIRED (not in this script):
-- =============================================================================
-- 1. apps/ui/ibp/src/app/pages/HRPortal/index.tsx
--    a. Remove REGION_OPTIONS hardcoded array
--    b. Add state: selectedLocationIds: number[]
--    c. Fetch locations via:
--         POST generateHRReports/external_hr_company_locations
--         Body: { companyId: String(companyId) }
--         Display: addr_1 in dropdown
--    d. Pass selectedLocationIds.join(',') as 'locationIds' to ALL useHRReport calls
--
-- 2. apps/ui/ibp/src/app/pages/HRPortalPortfolio/index.tsx
--    a. Same location fetch
--    b. Pass locationIds to portfolio_kpi_summary, portfolio_company_policies
--
-- 3. apps/ui/ibp/src/app/pages/HRPortalPolicySummary/index.tsx
--    a. Pass locationIds to policy_claim_history, cd_kpi_summary, cd_account_details
--    b. Pass locationIds to endorsement_overview, endorsement_employee_metrics
