-- =============================================================================
-- enrollment-report-auto-enrolled-filter.sql
--
-- Adds two new enrollStatus filter values and an ENROLLED_BY export column
-- to ibp_hr_employee_listing (id=53):
--
--   AUTO_ENROLLED  → ENROLLED + is_auto_submitted = TRUE  (cron auto-submissions)
--   USER_ENROLLED  → ENROLLED + is_auto_submitted = FALSE (manual employee submissions)
--
-- Three changes inside the stored query:
--   1. enrollment CTE    — add pe.is_auto_submitted so it is available in WHERE + SELECT
--   2. enrollStatus WHERE — special-case AUTO_ENROLLED and USER_ENROLLED
--   3. final SELECT       — add "ENROLLED_BY" column (Auto Enrolled / User Enrolled)
--                           in the CSV/Excel export, just before the "EID" column
-- =============================================================================

BEGIN;

DO $AUTO_ENROLL$
DECLARE
  v_id    INTEGER;
  v_q     TEXT;
  v_old1  TEXT;
  v_new1  TEXT;
  v_old2  TEXT;
  v_new2  TEXT;
BEGIN
  SELECT id, query INTO v_id, v_q
  FROM admin_reports WHERE id = 53;

  IF v_id IS NULL THEN
    RAISE NOTICE 'admin_reports id=53 (ibp_hr_employee_listing) not found — skip';
    RETURN;
  END IF;

  -- Guard: already patched?
  IF v_q LIKE '%AUTO_ENROLLED%' THEN
    RAISE NOTICE 'ibp_hr_employee_listing: AUTO_ENROLLED filter already present — skip';
    RETURN;
  END IF;

  -- -----------------------------------------------------------------------
  -- Change 1: add is_auto_submitted to the enrollment CTE
  -- -----------------------------------------------------------------------
  v_old1 := $O1$    pe.employee_enrollment_status_key,
    pe.created_at                    AS enrollment_created_at$O1$;

  v_new1 := $N1$    pe.employee_enrollment_status_key,
    pe.is_auto_submitted,
    pe.created_at                    AS enrollment_created_at$N1$;

  IF v_q NOT LIKE '%' || v_old1 || '%' THEN
    RAISE EXCEPTION 'enrollment CTE anchor not found — aborting to avoid corrupting the query';
  END IF;

  v_q := REPLACE(v_q, v_old1, v_new1);

  -- -----------------------------------------------------------------------
  -- Change 2: extend the enrollStatus WHERE block
  -- -----------------------------------------------------------------------
  v_old2 := $O2$  AND (
    NULLIF(###enrollStatus###, '') IS NULL
    OR COALESCE(en.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') = ###enrollStatus###
  )$O2$;

  v_new2 := $N2$  AND (
    NULLIF(###enrollStatus###, '') IS NULL
    OR (
      ###enrollStatus### = 'AUTO_ENROLLED'
      AND en.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
      AND en.is_auto_submitted = TRUE
    )
    OR (
      ###enrollStatus### = 'USER_ENROLLED'
      AND en.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
      AND en.is_auto_submitted = FALSE
    )
    OR (
      ###enrollStatus### NOT IN ('AUTO_ENROLLED', 'USER_ENROLLED')
      AND COALESCE(en.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') = ###enrollStatus###
    )
  )$N2$;

  IF v_q NOT LIKE '%' || v_old2 || '%' THEN
    RAISE EXCEPTION 'enrollStatus WHERE anchor not found — aborting to avoid corrupting the query';
  END IF;

  v_q := REPLACE(v_q, v_old2, v_new2);

  -- -----------------------------------------------------------------------
  -- Change 3: add ENROLLED_BY column to the final SELECT (before "EID")
  -- Uses regexp_replace to handle variable trailing whitespace on the line
  -- -----------------------------------------------------------------------
  v_q := regexp_replace(
    v_q,
    E'AS "EID"\nFROM base_employees be',
    E'AS "AUTO_ENROLLED_FLAG",\n   CASE WHEN en.is_auto_submitted = TRUE THEN \'Auto Enrolled\' WHEN en.is_auto_submitted = FALSE AND en.employee_enrollment_status_key = \'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED\' THEN \'User Enrolled\' ELSE NULL END AS "ENROLLED_BY",\n   be.employee_id AS "EID"\nFROM base_employees be'
  );

  -- Fix: the regexp above replaces the alias only, so be.employee_id now has
  -- alias AUTO_ENROLLED_FLAG. Correct it so ENROLLED_BY holds the CASE result.
  v_q := regexp_replace(
    v_q,
    E'be\\.employee_id[ ]+AS "AUTO_ENROLLED_FLAG",\\n   CASE WHEN en\\.is_auto_submitted = TRUE THEN ''Auto Enrolled'' WHEN en\\.is_auto_submitted = FALSE AND en\\.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'' THEN ''User Enrolled'' ELSE NULL END AS "EID_dummy",\\n   be\\.employee_id AS "EID"',
    E'CASE WHEN en.is_auto_submitted = TRUE THEN ''Auto Enrolled'' WHEN en.is_auto_submitted = FALSE AND en.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'' THEN ''User Enrolled'' ELSE NULL END AS "ENROLLED_BY",\n   be.employee_id AS "EID"'
  );

  UPDATE admin_reports SET query = v_q, updated_at = NOW() WHERE id = 53;

  RAISE NOTICE 'ibp_hr_employee_listing (id=53): AUTO_ENROLLED / USER_ENROLLED filters + ENROLLED_BY export column added successfully';
END;
$AUTO_ENROLL$;

COMMIT;
