-- =============================================================================
-- policy-cards-live-config-fix.sql
--
-- Adds a policy_configuration_status_lid = POLICY_CONFIGURATION_STATUS_LIVE
-- guard to the location-filter EXISTS subquery in dashboard_policy_cards.
--
-- WHY:
--   A policy can have multiple policy_configuration rows (e.g. one LIVE,
--   one PENDING_APPROVAL).  The EXISTS that checks selectedLocationIds must
--   only look at the LIVE record; otherwise a stale/pending row whose
--   selectedLocationIds does not include the requested location can make the
--   filter silently exclude valid policies (or include invalid ones).
--
-- CHANGE:
--   Before:
--     WHERE pcfg.policy_id = p.id
--       AND loc_id::INTEGER = ANY(...)
--
--   After:
--     WHERE pcfg.policy_id = p.id
--       AND pcfg.policy_configuration_status_lid = (
--             SELECT id FROM lookup_data
--             WHERE lookup_key = 'POLICY_CONFIGURATION_STATUS_LIVE' LIMIT 1
--           )
--       AND loc_id::INTEGER = ANY(...)
--
-- IDEMPOTENT: skips if condition is already present.
-- =============================================================================

BEGIN;

DO $FIX_LIVE_STATUS$
DECLARE
  v_id  INTEGER;
  v_q   TEXT;
  v_new TEXT;

  -- The exact fragment produced by policy-location-final-fix.sql (Pattern B).
  -- We target the two-line stretch that is unique to our location EXISTS block.
  v_old TEXT := $OLD$      WHERE pcfg.policy_id = p.id
        AND loc_id::INTEGER = ANY($OLD$;

  v_rep TEXT := $REP$      WHERE pcfg.policy_id = p.id
        AND pcfg.policy_configuration_status_lid = (
          SELECT id FROM lookup_data
          WHERE lookup_key = 'POLICY_CONFIGURATION_STATUS_LIVE'
          LIMIT 1
        )
        AND loc_id::INTEGER = ANY($REP$;

BEGIN
  SELECT id, query INTO v_id, v_q
  FROM admin_reports WHERE name = 'dashboard_policy_cards';

  IF v_id IS NULL THEN
    RAISE NOTICE 'dashboard_policy_cards — not found, skipping';
    RETURN;
  END IF;

  -- Idempotency check
  IF v_q LIKE '%pcfg.policy_configuration_status_lid%' THEN
    RAISE NOTICE 'dashboard_policy_cards — live status condition already present, skipping';
    RETURN;
  END IF;

  IF POSITION(v_old IN v_q) = 0 THEN
    -- Indentation may differ slightly — try regexp_replace as fallback
    v_new := regexp_replace(
      v_q,
      '(WHERE\s+pcfg\.policy_id\s*=\s*p\.id\s+)(AND\s+loc_id::INTEGER)',
      E'\\1AND pcfg.policy_configuration_status_lid = (\n          SELECT id FROM lookup_data WHERE lookup_key = \'POLICY_CONFIGURATION_STATUS_LIVE\' LIMIT 1\n        )\n        \\2',
      'g'
    );

    IF v_new = v_q THEN
      RAISE WARNING 'dashboard_policy_cards — could not locate the EXISTS WHERE clause. Run VERIFY below to inspect current filter state.';
      RETURN;
    END IF;

    UPDATE admin_reports
    SET query = v_new, updated_at = NOW()
    WHERE id = v_id;
    RAISE NOTICE 'dashboard_policy_cards — live status condition added (regexp fallback path)';
    RETURN;
  END IF;

  UPDATE admin_reports
  SET query = replace(v_q, v_old, v_rep), updated_at = NOW()
  WHERE id = v_id;
  RAISE NOTICE 'dashboard_policy_cards — live status condition added to location filter EXISTS';
END $FIX_LIVE_STATUS$;


-- =============================================================================
-- VERIFY
-- =============================================================================
SELECT
  name,
  CASE
    WHEN query LIKE '%pcfg.policy_configuration_status_lid%'
         AND query LIKE '%POLICY_CONFIGURATION_STATUS_LIVE%'
      THEN 'OK — live status guard present'
    WHEN query LIKE '%FROM policy_configuration pcfg%'
         AND query LIKE '%###locationIds###%'
      THEN 'MISSING — location filter exists but no live status guard'
    WHEN query LIKE '%###locationIds###%'
      THEN 'HAS FILTER — pattern unrecognized'
    ELSE 'NO LOCATION FILTER'
  END AS live_status_guard,
  CASE
    WHEN query LIKE '%FROM policy_configuration pcfg,%'
         AND query LIKE '%pcfg.policy_id = p.id%'
      THEN 'OK — Pattern B present'
    ELSE 'MISSING — Pattern B not found'
  END AS location_filter_status
FROM admin_reports
WHERE name = 'dashboard_policy_cards';

COMMIT;
