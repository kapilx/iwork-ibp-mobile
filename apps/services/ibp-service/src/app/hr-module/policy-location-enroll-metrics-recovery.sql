-- =============================================================================
-- policy-location-enroll-metrics-recovery.sql
--
-- Recovers endorsement_employee_metrics from the partial-strip damage left
-- by policy-location-enroll-metrics-fix.sql.
--
-- WHAT WENT WRONG:
--   The previous script scanned backwards from 'pee.policy_location' to find
--   AND (. But LOWER(TRIM(pee.policy_location)) has TRIM( immediately before
--   pee.policy_location, so the scan stopped at TRIM('s '(' (depth=0) instead
--   of the outer AND ('s '('. It removed only "LOWER(TRIM(pee.policy_location"
--   leaving ") IN (SELECT...)" dangling — syntax error at AND.
--
-- THIS SCRIPT'S APPROACH:
--   Instead of scanning backwards from inside the block (where nested parens
--   cause confusion), we identify the filter range using two anchors:
--     filter_start = scan backwards from first ###locationIds### looking for
--                    the literal string '\n  AND (' — that's the filter's
--                    own opening line and is always a direct match.
--     filter_end   = the '\n' immediately before 'AND (###externalHrUserId###'
--                    (the filter was inserted just before this anchor, so
--                    everything between filter_start and filter_end is the
--                    broken filter to be removed).
--   Then re-insert the correct Pattern B filter.
-- =============================================================================

BEGIN;

DO $RECOVER_EM$
DECLARE
  v_id         INTEGER;
  v_q          TEXT;
  v_s          TEXT;

  v_filter TEXT := $F$
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_configuration pcfg_loc,
           jsonb_array_elements_text(COALESCE(pcfg_loc.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
      WHERE pcfg_loc.policy_id = p.id
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

  anchor_text  TEXT    := 'AND (###externalHrUserId### IS NULL';
  needle       TEXT    := E'\n  AND (';

  locids_pos   INTEGER;
  filter_start INTEGER;
  filter_end   INTEGER;
  anchor_pos   INTEGER;
  scan_pos     INTEGER;
BEGIN
  SELECT id, query INTO v_id, v_q
  FROM admin_reports WHERE name = 'endorsement_employee_metrics';

  IF v_id IS NULL THEN
    RAISE NOTICE 'endorsement_employee_metrics — not found, skipping'; RETURN;
  END IF;

  -- Already correct?
  IF v_q LIKE '%pcfg_loc.policy_id = p.id%' AND v_q LIKE '%###locationIds###%' THEN
    RAISE NOTICE 'endorsement_employee_metrics — Pattern B (pcfg_loc) already correct, skipping'; RETURN;
  END IF;

  IF v_q NOT LIKE '%###locationIds###%' THEN
    RAISE NOTICE 'endorsement_employee_metrics — no locationIds filter found, skipping'; RETURN;
  END IF;

  -- STEP 1: position of first ###locationIds###
  locids_pos := POSITION('###locationIds###' IN v_q);

  -- STEP 2: scan backwards from locids_pos for '\n  AND ('
  --         This is the newline that opens the filter block, guaranteed to
  --         appear between filter_start and ###locationIds### with no other
  --         '\n  AND (' in between (NULLIF/TRIM/REGEXP_REPLACE contain no AND).
  filter_start := 0;
  scan_pos := locids_pos;
  WHILE scan_pos >= 1 LOOP
    IF SUBSTRING(v_q FROM scan_pos FOR LENGTH(needle)) = needle THEN
      filter_start := scan_pos;
      EXIT;
    END IF;
    scan_pos := scan_pos - 1;
  END LOOP;

  IF filter_start = 0 THEN
    RAISE WARNING 'endorsement_employee_metrics — could not find filter start (\n  AND (), aborting'; RETURN;
  END IF;

  -- STEP 3: find the anchor, then walk backwards to its preceding '\n'
  anchor_pos := POSITION(anchor_text IN v_q);
  IF anchor_pos = 0 THEN
    RAISE WARNING 'endorsement_employee_metrics — externalHrUserId anchor not found, aborting'; RETURN;
  END IF;

  scan_pos   := anchor_pos - 1;
  filter_end := anchor_pos; -- fallback: no preceding \n
  WHILE scan_pos >= 1 LOOP
    IF SUBSTRING(v_q FROM scan_pos FOR 1) = E'\n' THEN
      filter_end := scan_pos;
      EXIT;
    END IF;
    scan_pos := scan_pos - 1;
  END LOOP;

  -- STEP 4: excise everything from filter_start up to (not including) filter_end
  --   LEFT(v_q, filter_start - 1)  = all text before '\n  AND (' of the filter
  --   SUBSTRING(v_q FROM filter_end) = '\n  AND (###externalHrUserId###...' onward
  v_s := LEFT(v_q, filter_start - 1) || SUBSTRING(v_q FROM filter_end);

  -- Sanity: ###locationIds### must be gone (it only lives inside the filter block)
  IF v_s LIKE '%###locationIds###%' THEN
    RAISE WARNING 'endorsement_employee_metrics — ###locationIds### still present after strip; range was wrong, aborting'; RETURN;
  END IF;

  -- STEP 5: re-insert the correct Pattern B filter before the anchor
  UPDATE admin_reports
  SET query      = replace(v_s, anchor_text, v_filter || E'\n  ' || anchor_text),
      updated_at = NOW()
  WHERE id = v_id;

  RAISE NOTICE 'endorsement_employee_metrics — Pattern B (pcfg_loc) filter applied successfully';
END $RECOVER_EM$;


-- =============================================================================
-- VERIFY
-- =============================================================================
SELECT
  name,
  CASE
    WHEN query LIKE '%pcfg_loc.policy_id = p.id%' AND query LIKE '%###locationIds###%'
      THEN 'OK — Pattern B (pcfg_loc alias)'
    WHEN query LIKE '%pee.policy_location%'        AND query LIKE '%###locationIds###%'
      THEN 'BROKEN — pee.policy_location present'
    WHEN query LIKE '%###locationIds###%'
      THEN 'HAS FILTER — unrecognized pattern'
    ELSE 'NO FILTER'
  END AS status
FROM admin_reports
WHERE name = 'endorsement_employee_metrics';

COMMIT;
