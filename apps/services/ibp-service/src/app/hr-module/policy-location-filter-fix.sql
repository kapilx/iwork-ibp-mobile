-- =============================================================================
-- policy-location-filter-fix.sql
--
-- Fixes broken location filters previously applied by policy-location-filter-script.sql:
--
-- Problem 1: dashboard_policy_cards
--   The filter used alias 'pc' for policy_configuration, but 'pc' is already
--   the alias for the 'policy_claims_cur' CTE.
--   Error: "column pc.policyConfiguration does not exist"
--
-- Problem 2: dashboard_enrollment_status
--   The filter used 'pee.policy_location' inside the policy_scope CTE WHERE
--   clause, but 'pee' is not in scope there (only 'p' is).
--   Error: "missing FROM-clause entry for table pee"
--
-- Fix: Both reports use Pattern B with a fresh alias 'pcfg' for
--      policy_configuration, correlated to 'p' via WHERE pcfg.policy_id = p.id.
--
-- Safe to re-run (idempotent — only updates when the broken text is present).
-- =============================================================================

BEGIN;

-- =============================================================================
-- FIX 1: dashboard_policy_cards  — replace broken pc."policyConfiguration"
-- =============================================================================
DO $FIX_CARDS$
DECLARE
  v_id    INTEGER;
  v_orig  TEXT;
  v_fixed TEXT;
  v_old   TEXT;
  v_new   TEXT;
BEGIN
  SELECT id, query INTO v_id, v_orig FROM admin_reports WHERE name = 'dashboard_policy_cards';
  IF v_id IS NULL THEN
    RAISE NOTICE 'dashboard_policy_cards not found — skip';
    RETURN;
  END IF;

  -- Broken snippet inserted by policy-location-filter-script.sql
  v_old := $OLD$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(
        COALESCE(pc."policyConfiguration"->'selectedLocationIds', '[]'::jsonb)
      ) loc_id
      WHERE loc_id::INTEGER = ANY(
        SELECT val::INTEGER
        FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
          ','
        ) AS val
        WHERE val ~ '^\d+$'
      )
    )
  )$OLD$;

  -- Correct snippet: policy_configuration joined as pcfg, correlated to p.id
  v_new := $NEW$
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
  )$NEW$;

  IF POSITION(v_old IN v_orig) = 0 THEN
    RAISE NOTICE 'dashboard_policy_cards: broken filter not found (already fixed or not yet applied) — skip';
    RETURN;
  END IF;

  v_fixed := replace(v_orig, v_old, v_new);

  UPDATE admin_reports SET query = v_fixed, updated_at = NOW() WHERE id = v_id;
  RAISE NOTICE 'dashboard_policy_cards: location filter fixed (pcfg alias, p.id correlation).';
END $FIX_CARDS$;


-- =============================================================================
-- FIX 2: dashboard_enrollment_status  — replace broken pee.policy_location
-- =============================================================================
DO $FIX_ENROLL$
DECLARE
  v_id    INTEGER;
  v_orig  TEXT;
  v_fixed TEXT;
  v_old   TEXT;
  v_new   TEXT;
BEGIN
  SELECT id, query INTO v_id, v_orig FROM admin_reports WHERE name = 'dashboard_enrollment_status';
  IF v_id IS NULL THEN
    RAISE NOTICE 'dashboard_enrollment_status not found — skip';
    RETURN;
  END IF;

  -- Broken snippet: Pattern A used pee.policy_location inside policy_scope CTE
  -- where only 'p' (policy) is in scope — pee is not available there.
  v_old := $OLD$
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
  )$OLD$;

  -- Correct snippet: Pattern B — policy_configuration EXISTS, p.id is in scope
  -- inside policy_scope CTE (that CTE filters on policy p).
  v_new := $NEW$
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
  )$NEW$;

  IF POSITION(v_old IN v_orig) = 0 THEN
    RAISE NOTICE 'dashboard_enrollment_status: broken filter not found (already fixed or not yet applied) — skip';
    RETURN;
  END IF;

  v_fixed := replace(v_orig, v_old, v_new);

  UPDATE admin_reports SET query = v_fixed, updated_at = NOW() WHERE id = v_id;
  RAISE NOTICE 'dashboard_enrollment_status: location filter fixed (pcfg alias, p.id correlation).';
END $FIX_ENROLL$;


-- =============================================================================
-- VERIFY: show current location filter state for both reports
-- =============================================================================
SELECT
  name,
  CASE
    WHEN query LIKE '%policy_configuration pcfg%' AND query LIKE '%###locationIds###%'
      THEN 'OK — correct (pcfg alias, p.id correlated)'
    WHEN query LIKE '%pc."policyConfiguration"%' AND query LIKE '%###locationIds###%'
      THEN 'BROKEN — pc alias conflict (still needs fix)'
    WHEN query LIKE '%pee.policy_location%' AND query LIKE '%###locationIds###%'
      THEN 'BROKEN — pee not in scope (still needs fix)'
    WHEN query LIKE '%###locationIds###%'
      THEN 'UNKNOWN — has locationIds but unrecognised pattern'
    ELSE 'NO FILTER — locationIds not applied yet'
  END AS location_filter_status
FROM admin_reports
WHERE name IN ('dashboard_policy_cards', 'dashboard_enrollment_status')
ORDER BY name;

COMMIT;
