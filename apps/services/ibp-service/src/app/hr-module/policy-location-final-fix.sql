-- =============================================================================
-- policy-location-final-fix.sql
--
-- Strips every broken location filter (any variant — wrong alias, wrong column,
-- wrong scope) from all 10 affected HR reports and re-applies the correct one.
--
-- ROOT CAUSE SUMMARY:
--   The ###locationIds### filter was inserted at the externalHrUserId anchor,
--   which lives inside a CTE WHERE clause.  Inside that CTE only the CTE's own
--   FROM tables are in scope.  'pee' (policy_enrollment_employee) is NOT in
--   scope there, so Pattern A always fails.  Pattern B (EXISTS via
--   policy_configuration correlated to 'p.id') works because 'p' (policy) IS
--   the CTE's own table.
--
-- REPORTS AND CORRECT PATTERN:
--   Standard Pattern B (pcfg.policy_id = p.id):
--     dashboard_policy_cards, dashboard_enrollment_status,
--     portfolio_kpi_summary, endorsement_overview,
--     endorsement_employee_metrics, endorsement_list,
--     cd_account_details, cd_transactions, policy_claim_history
--
--   Special Pattern B (via caution_deposit_policy_mapping — no 'p' alias):
--     cd_kpi_summary
--
-- HOW IT WORKS:
--   1. _strip_loc_filter() walks the query character-by-character using
--      parenthesis depth counting to remove the AND (...) block precisely.
--   2. The correct filter is then re-inserted at the externalHrUserId anchor
--      (or before ORDER BY as a fallback).
--
-- IDEMPOTENT: skips reports that are already correct; safe to re-run.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: strip the existing location filter block using paren counting.
-- Finds the first occurrence of:
--   \n  AND (\n    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###
-- and removes the entire AND (...) block, including its closing ')'.
-- Returns the query unchanged if the marker is not found.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _strip_loc_filter(q TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  marker   TEXT    := E'\n  AND (\n    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###';
  spos     INTEGER;
  scan_pos INTEGER;
  depth    INTEGER := 0;
  c        TEXT;
BEGIN
  spos := POSITION(marker IN q);
  IF spos = 0 THEN RETURN q; END IF;

  -- Advance to the '(' that opens the AND ( block
  scan_pos := spos + LENGTH(E'\n  AND ');

  WHILE scan_pos <= LENGTH(q) LOOP
    c := SUBSTRING(q FROM scan_pos FOR 1);
    IF c = '(' THEN
      depth := depth + 1;
    ELSIF c = ')' THEN
      depth := depth - 1;
      IF depth = 0 THEN
        -- Remove from spos to scan_pos (inclusive)
        RETURN LEFT(q, spos - 1) || SUBSTRING(q FROM scan_pos + 1);
      END IF;
    END IF;
    scan_pos := scan_pos + 1;
  END LOOP;

  RETURN q;  -- safety fallback: could not find matching ')'
END;
$$;


-- =============================================================================
-- FIX GROUP 1: Standard Pattern B  (pcfg.policy_id = p.id)
--
-- Applies to all reports where 'p' (policy) is in scope at the anchor point.
-- This includes the endorsement/portfolio/claim reports where Pattern A was
-- previously used incorrectly ('pee' is not in scope inside their CTEs).
-- =============================================================================
DO $FIX_B$
DECLARE
  rname    TEXT;
  v_id     INTEGER;
  v_q      TEXT;
  v_s      TEXT;
  v_filter TEXT := $F$
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
  )$F$;
  v_anchor TEXT := 'AND (###externalHrUserId### IS NULL';
BEGIN
  FOREACH rname IN ARRAY ARRAY[
    'dashboard_policy_cards',
    'dashboard_enrollment_status',
    'portfolio_kpi_summary',
    'endorsement_overview',
    'endorsement_employee_metrics',
    'endorsement_list',
    'cd_account_details',
    'cd_transactions',
    'policy_claim_history'
  ] LOOP
    SELECT id, query INTO v_id, v_q FROM admin_reports WHERE name = rname;

    IF v_id IS NULL THEN
      RAISE NOTICE '% — report not found, skipping', rname;
      CONTINUE;
    END IF;

    IF v_q NOT LIKE '%###locationIds###%' THEN
      RAISE NOTICE '% — no locationIds filter present, skipping', rname;
      CONTINUE;
    END IF;

    -- Already correct: has the exact Pattern B we want
    IF v_q LIKE '%FROM policy_configuration pcfg,%'
       AND v_q LIKE '%pcfg.policy_id = p.id%' THEN
      RAISE NOTICE '% — Pattern B (p.id) already correct, skipping', rname;
      CONTINUE;
    END IF;

    -- Strip the broken filter
    v_s := _strip_loc_filter(v_q);

    IF v_s = v_q THEN
      RAISE WARNING '% — broken filter found but strip failed (marker mismatch). Check query manually.', rname;
      CONTINUE;
    END IF;

    -- Re-insert the correct filter
    IF v_s LIKE ('%' || v_anchor || '%') THEN
      UPDATE admin_reports
      SET query      = replace(v_s, v_anchor, v_filter || E'\n  ' || v_anchor),
          updated_at = NOW()
      WHERE id = v_id;
      RAISE NOTICE '% — Pattern B filter applied (externalHrUserId anchor)', rname;

    ELSIF v_s ~* 'ORDER\s+BY' THEN
      UPDATE admin_reports
      SET query      = regexp_replace(v_s, '(ORDER\s+BY)', v_filter || E'\n\\1', 'i'),
          updated_at = NOW()
      WHERE id = v_id;
      RAISE NOTICE '% — Pattern B filter applied (before ORDER BY)', rname;

    ELSE
      UPDATE admin_reports
      SET query      = rtrim(rtrim(v_s, ';')) || v_filter,
          updated_at = NOW()
      WHERE id = v_id;
      RAISE NOTICE '% — Pattern B filter applied (appended at end)', rname;
    END IF;

  END LOOP;
END $FIX_B$;


-- =============================================================================
-- FIX GROUP 2: cd_kpi_summary — Pattern B via caution_deposit_policy_mapping
--
-- This report has no direct 'p' alias.  It uses 'cd' (caution_deposit) as its
-- main entity, so we correlate through caution_deposit_policy_mapping instead.
-- =============================================================================
DO $FIX_CD$
DECLARE
  v_id     INTEGER;
  v_q      TEXT;
  v_s      TEXT;
  v_filter TEXT := $F$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM caution_deposit_policy_mapping cdpm2
      JOIN policy_configuration pcfg ON pcfg.policy_id = cdpm2.policy_id
      CROSS JOIN jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
      WHERE cdpm2.caution_deposit_id = cd.id
        AND loc_id::INTEGER = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
    )
  )$F$;
  v_anchor TEXT := 'AND (###externalHrUserId### IS NULL';
BEGIN
  SELECT id, query INTO v_id, v_q FROM admin_reports WHERE name = 'cd_kpi_summary';

  IF v_id IS NULL THEN
    RAISE NOTICE 'cd_kpi_summary — report not found, skipping'; RETURN;
  END IF;

  IF v_q NOT LIKE '%###locationIds###%' THEN
    RAISE NOTICE 'cd_kpi_summary — no locationIds filter present, skipping'; RETURN;
  END IF;

  IF v_q LIKE '%cdpm2.caution_deposit_id = cd.id%' THEN
    RAISE NOTICE 'cd_kpi_summary — Pattern B (cdpm2) already correct, skipping'; RETURN;
  END IF;

  v_s := _strip_loc_filter(v_q);

  IF v_s = v_q THEN
    RAISE WARNING 'cd_kpi_summary — broken filter found but strip failed (marker mismatch). Check query manually.';
    RETURN;
  END IF;

  IF v_s LIKE ('%' || v_anchor || '%') THEN
    UPDATE admin_reports
    SET query      = replace(v_s, v_anchor, v_filter || E'\n  ' || v_anchor),
        updated_at = NOW()
    WHERE id = v_id;
    RAISE NOTICE 'cd_kpi_summary — Pattern B (cdpm2) filter applied (externalHrUserId anchor)';

  ELSE
    UPDATE admin_reports
    SET query      = rtrim(rtrim(v_s, ';')) || v_filter,
        updated_at = NOW()
    WHERE id = v_id;
    RAISE NOTICE 'cd_kpi_summary — Pattern B (cdpm2) filter applied (appended at end)';
  END IF;
END $FIX_CD$;


DROP FUNCTION IF EXISTS _strip_loc_filter(TEXT);


-- =============================================================================
-- VERIFY: confirm correct filter state for all 10 reports
-- =============================================================================
SELECT
  name,
  CASE
    WHEN query LIKE '%FROM policy_configuration pcfg,%'
         AND query LIKE '%pcfg.policy_id = p.id%'
         AND query LIKE '%###locationIds###%'
      THEN 'OK — Pattern B (pcfg.policy_id = p.id)'

    WHEN query LIKE '%cdpm2.caution_deposit_id = cd.id%'
         AND query LIKE '%###locationIds###%'
      THEN 'OK — Pattern B (via caution_deposit_policy_mapping)'

    WHEN query LIKE '%pee.policy_location%'
         AND query LIKE '%###locationIds###%'
      THEN 'BROKEN — Pattern A pee.policy_location (not in CTE scope)'

    WHEN query LIKE '%###locationIds###%'
      THEN 'BROKEN or UNRECOGNIZED — has locationIds but wrong/unknown pattern'

    ELSE 'NO FILTER — locationIds not applied'
  END AS location_filter_status
FROM admin_reports
WHERE name IN (
  'dashboard_policy_cards',
  'dashboard_enrollment_status',
  'portfolio_kpi_summary',
  'endorsement_overview',
  'endorsement_employee_metrics',
  'endorsement_list',
  'cd_kpi_summary',
  'cd_account_details',
  'cd_transactions',
  'policy_claim_history'
)
ORDER BY name;

COMMIT;
