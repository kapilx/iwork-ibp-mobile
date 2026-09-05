-- ============================================================
-- Update employee date_of_birth from CSV
-- CSV columns: employee_id (company_employee_id), date_of_birth
-- Date format in CSV: YYYY-MM-DD  (e.g. 1990-01-01)
-- Target company_id: 160696
-- ============================================================

BEGIN;

-- 1. Create temp table
CREATE TEMP TABLE csv_employee_dob_import (
    employee_id    TEXT,
    date_of_birth  TEXT
);

-- 2. Load CSV (update path before running)
\COPY csv_employee_dob_import (employee_id, date_of_birth)
  FROM '/tmp/employee_dob.csv'
  WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Trim whitespace
UPDATE csv_employee_dob_import
SET employee_id   = TRIM(employee_id),
    date_of_birth = TRIM(date_of_birth);

-- 3. Preview rows that won't match (sanity check — run and review before committing)
SELECT i.employee_id, i.date_of_birth, 'NO MATCH in DB' AS status
FROM csv_employee_dob_import i
WHERE NOT EXISTS (
    SELECT 1 FROM policy_enrollment_employee pee
    WHERE pee.company_employee_id = i.employee_id
      AND pee.company_id = 160696
      AND pee.deleted_at IS NULL
);

-- 4. Preview rows with invalid date format
SELECT employee_id, date_of_birth, 'INVALID DATE FORMAT' AS status
FROM csv_employee_dob_import
WHERE date_of_birth !~ '^\d{4}-\d{2}-\d{2}$';

-- 5. Do the update
UPDATE policy_enrollment_employee pee
SET date_of_birth = i.date_of_birth::date
FROM csv_employee_dob_import i
WHERE pee.company_employee_id = i.employee_id
  AND pee.company_id = 160696
  AND pee.deleted_at IS NULL
  AND i.date_of_birth ~ '^\d{4}-\d{2}-\d{2}$';

-- 6. Show count of updated rows
SELECT COUNT(*) AS updated_count
FROM policy_enrollment_employee pee
JOIN csv_employee_dob_import i
  ON pee.company_employee_id = i.employee_id
 AND pee.company_id = 160696
 AND pee.deleted_at IS NULL;

COMMIT;
