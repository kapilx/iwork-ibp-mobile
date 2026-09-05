-- =============================================================================
-- policy-location-enroll-metrics-fix.sql
--
-- Targeted fix for endorsement_employee_metrics only.
--
-- WHY THIS SEPARATE SCRIPT:
--   policy-location-final-fix.sql skipped this report because the report's
--   base query already joins policy_configuration with alias 'pcfg' and
--   condition 'pcfg.policy_id = p.id'.  The "already correct" check in the
--   main fix script matched those existing lines and falsely concluded that
--   Pattern B was already applied — while the broken Pattern A filter
--   (pee.policy_location) was still present.
--
-- THIS SCRIPT:
--   Uses 'pee.policy_location' as the definitive broken-state indicator.
--   Strips the broken AND (...) block by scanning backwards from
--   pee.policy_location to find the opening '(' of 'AND (' then forward
--   to find the matching closing ')'.
--   Re-inserts the correct Pattern B EXISTS (pcfg alias is scoped inside
--   the EXISTS subquery so it does not conflict with the outer pcfg join).
-- =============================================================================

BEGIN;

DO $FIX_EM$
DECLARE
  v_id             INTEGER;
  v_q              TEXT;
  v_s              TEXT;

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

  v_anchor         TEXT    := 'AND (###externalHrUserId### IS NULL';

  -- Positions used for backwards-scan strip
  pee_pos          INTEGER;
  scan_pos         INTEGER;
  and_open_pos     INTEGER;
  nl_before_pos    INTEGER;
  close_paren_pos  INTEGER;
  depth            INTEGER;
  c                TEXT;
BEGIN
  SELECT id, query INTO v_id, v_q
  FROM admin_reports WHERE name = 'endorsement_employee_metrics';

  IF v_id IS NULL THEN
    RAISE NOTICE 'endorsement_employee_metrics — not found, skipping';
    RETURN;
  END IF;

  -- Definitive broken-state check: pee.policy_location still present
  IF v_q NOT LIKE '%pee.policy_location%' THEN
    RAISE NOTICE 'endorsement_employee_metrics — pee.policy_location not present, already fixed';
    RETURN;
  END IF;

  -- STEP 1: Locate pee.policy_location
  pee_pos := POSITION('pee.policy_location' IN v_q);

  -- STEP 2: Walk backwards from pee_pos to find the outermost unmatched '('
  --         That is the opening '(' of the 'AND (' filter block.
  scan_pos     := pee_pos - 1;
  depth        := 0;
  and_open_pos := 0;

  WHILE scan_pos >= 1 LOOP
    c := SUBSTRING(v_q FROM scan_pos FOR 1);
    IF c = ')' THEN
      depth := depth + 1;
    ELSIF c = '(' THEN
      IF depth = 0 THEN
        and_open_pos := scan_pos;
        EXIT;
      ELSE
        depth := depth - 1;
      END IF;
    END IF;
    scan_pos := scan_pos - 1;
  END LOOP;

  IF and_open_pos = 0 THEN
    RAISE WARNING 'endorsement_employee_metrics — could not find opening ( for AND block; skipping';
    RETURN;
  END IF;

  -- STEP 3: Walk backwards from the '(' to find the newline that starts the line.
  --         We remove from that newline onward so the indentation is clean.
  scan_pos      := and_open_pos - 1;
  nl_before_pos := 1;

  WHILE scan_pos >= 1 LOOP
    c := SUBSTRING(v_q FROM scan_pos FOR 1);
    IF c = E'\n' THEN
      nl_before_pos := scan_pos;
      EXIT;
    END IF;
    scan_pos := scan_pos - 1;
  END LOOP;

  -- STEP 4: Walk forward from and_open_pos to find the matching closing ')'
  scan_pos        := and_open_pos;
  depth           := 0;
  close_paren_pos := 0;

  WHILE scan_pos <= LENGTH(v_q) LOOP
    c := SUBSTRING(v_q FROM scan_pos FOR 1);
    IF c = '(' THEN
      depth := depth + 1;
    ELSIF c = ')' THEN
      depth := depth - 1;
      IF depth = 0 THEN
        close_paren_pos := scan_pos;
        EXIT;
      END IF;
    END IF;
    scan_pos := scan_pos + 1;
  END LOOP;

  IF close_paren_pos = 0 THEN
    RAISE WARNING 'endorsement_employee_metrics — could not find closing ) for AND block; skipping';
    RETURN;
  END IF;

  -- STEP 5: Remove the broken AND (...) block
  v_s := LEFT(v_q, nl_before_pos - 1) || SUBSTRING(v_q FROM close_paren_pos + 1);

  -- STEP 6: Re-insert the correct Pattern B filter
  IF v_s LIKE ('%' || v_anchor || '%') THEN
    UPDATE admin_reports
    SET query      = replace(v_s, v_anchor, v_filter || E'\n  ' || v_anchor),
        updated_at = NOW()
    WHERE id = v_id;
    RAISE NOTICE 'endorsement_employee_metrics — Pattern B filter applied (externalHrUserId anchor)';

  ELSIF v_s ~* 'ORDER\s+BY' THEN
    UPDATE admin_reports
    SET query      = regexp_replace(v_s, '(ORDER\s+BY)', v_filter || E'\n\\1', 'i'),
        updated_at = NOW()
    WHERE id = v_id;
    RAISE NOTICE 'endorsement_employee_metrics — Pattern B filter applied (before ORDER BY)';

  ELSE
    UPDATE admin_reports
    SET query      = rtrim(rtrim(v_s, ';')) || v_filter,
        updated_at = NOW()
    WHERE id = v_id;
    RAISE NOTICE 'endorsement_employee_metrics — Pattern B filter applied (appended at end)';
  END IF;
END $FIX_EM$;


-- Verify
SELECT
  name,
  CASE
    WHEN query LIKE '%pcfg_loc.policy_id = p.id%' AND query LIKE '%###locationIds###%'
      THEN 'OK — Pattern B (pcfg_loc alias, p.id)'
    WHEN query LIKE '%pee.policy_location%' AND query LIKE '%###locationIds###%'
      THEN 'BROKEN — pee.policy_location still present'
    WHEN query LIKE '%###locationIds###%'
      THEN 'HAS FILTER — pattern unrecognized'
    ELSE 'NO FILTER'
  END AS status
FROM admin_reports
WHERE name = 'endorsement_employee_metrics';

COMMIT;
