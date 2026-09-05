-- =============================================================================
-- enrollment-report-location-filter.sql
--
-- Adds ###locationIds### (Pattern A – policy_enrollment_employee.policy_location)
-- to ibp_hr_employee_listing (id = 53).
--
-- The base_employees CTE filters on pee.company_id.  We add a location guard
-- after the search filter:  when locationIds is supplied only employees whose
-- policy_location matches one of the selected address addr_1 values are returned.
-- =============================================================================

BEGIN;

DO $LOC_ENROLL$
DECLARE
  v_id    INTEGER;
  v_q     TEXT;
  v_old   TEXT;
  v_new   TEXT;
BEGIN
  SELECT id, query INTO v_id, v_q
  FROM admin_reports WHERE name = 'ibp_hr_employee_listing';

  IF v_id IS NULL THEN
    RAISE NOTICE 'ibp_hr_employee_listing not found — skip';
    RETURN;
  END IF;

  IF v_q LIKE '%###locationIds###%' THEN
    RAISE NOTICE 'ibp_hr_employee_listing: locationIds filter already present — skip';
    RETURN;
  END IF;

  -- Anchor: the closing paren of the search block (last condition in base_employees WHERE)
  v_old := $OLD$    OR pee.company_employee_id ILIKE '%' || ###search### || '%'
    )
),$OLD$;

  v_new := $NEW$    OR pee.company_employee_id ILIKE '%' || ###search### || '%'
    )
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
  )
),$NEW$;

  IF POSITION(v_old IN v_q) = 0 THEN
    RAISE WARNING 'ibp_hr_employee_listing: anchor not found — check query manually';
    RETURN;
  END IF;

  UPDATE admin_reports
  SET query = replace(v_q, v_old, v_new), updated_at = NOW()
  WHERE id = v_id;

  RAISE NOTICE 'ibp_hr_employee_listing: locationIds filter applied (Pattern A).';
END $LOC_ENROLL$;

-- Register locationIds parameter (idempotent)
INSERT INTO admin_reports_parameters
  (admin_report_id, parameter_name, query_parameter, created_at, updated_at, created_by, updated_by)
SELECT
  r.id, 'locationIds', '###locationIds###', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM admin_reports r
WHERE r.name = 'ibp_hr_employee_listing'
  AND NOT EXISTS (
    SELECT 1 FROM admin_reports_parameters p
    WHERE p.admin_report_id = r.id AND p.parameter_name = 'locationIds'
  );

-- VERIFY
SELECT
  name,
  CASE
    WHEN query LIKE '%###locationIds###%' AND query LIKE '%policy_location%'
      THEN 'OK — Pattern A location filter present'
    ELSE 'MISSING'
  END AS status
FROM admin_reports
WHERE name = 'ibp_hr_employee_listing';

COMMIT;
