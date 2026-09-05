-- =============================================================================
-- claims-dashboard-location-filter.sql
--
-- Adds locationIds employee-level filtering to three claim aggregate reports:
--   dashboard_claims_monthly_trend
--   dashboard_top10_hospitals
--   dashboard_top10_diseases
--
-- FILTER PATTERN (Pattern A via subquery):
--   These reports do not join policy_enrollment_employee directly, so the
--   employee-location check is done as:
--     c.employee_id IN (
--       SELECT pee2.id FROM policy_enrollment_employee pee2
--       INNER JOIN address a ON LOWER(TRIM(a.addr_1)) = LOWER(TRIM(pee2.policy_location))
--       WHERE a.id = ANY(selected address IDs)
--     )
--   This gives the same result as Pattern A — "show claims from employees
--   whose policy_location matches the selected location addresses."
--
-- The filter is applied in BOTH current-year and previous-year CTEs so that
-- year-over-year comparisons remain consistent (same employee cohort, both years).
--
-- Also registers the locationIds parameter for all three reports.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Register locationIds parameter for all three reports
-- ---------------------------------------------------------------------------
DO $REG_PARAMS$
DECLARE
  rname TEXT;
  v_rid INTEGER;
BEGIN
  FOREACH rname IN ARRAY ARRAY[
    'dashboard_claims_monthly_trend',
    'dashboard_top10_hospitals',
    'dashboard_top10_diseases'
  ] LOOP
    SELECT id INTO v_rid FROM admin_reports WHERE name = rname;
    IF v_rid IS NULL THEN
      RAISE NOTICE '% — report not found, skipping param registration', rname;
      CONTINUE;
    END IF;

    INSERT INTO admin_reports_parameters
      (admin_report_id, parameter_name, query_parameter, created_at, updated_at)
    VALUES
      (v_rid, 'locationIds', '###locationIds###', NOW(), NOW())
    ON CONFLICT (admin_report_id, parameter_name)
    DO UPDATE SET query_parameter = '###locationIds###', updated_at = NOW();

    RAISE NOTICE '% — locationIds parameter registered', rname;
  END LOOP;
END $REG_PARAMS$;


-- ---------------------------------------------------------------------------
-- 2. dashboard_claims_monthly_trend — full rewrite with location filter
--    Filter applied in both monthly_cur and monthly_prev CTEs.
-- ---------------------------------------------------------------------------
UPDATE admin_reports
SET query = $Q$
WITH policy_window AS (
  SELECT id, company_id, policy_from, policy_to
  FROM policy
  WHERE id = ###policyId###
),
date_spine AS (
  SELECT generate_series(
    date_trunc('month', pw.policy_from),
    date_trunc('month', pw.policy_to),
    INTERVAL '1 month'
  ) AS month_start
  FROM policy_window pw
),
monthly_cur AS (
  SELECT
    date_trunc('month', c.claim_dt)                                                                         AS claim_month,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type, '')) = 'cashless'), 0)            AS cashless_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type, '')) = 'reimbursement'), 0)       AS reimbursement_amount,
    COUNT(c.id)             FILTER (WHERE LOWER(COALESCE(c.clm_type, '')) = 'cashless')                     AS cashless_count,
    COUNT(c.id)             FILTER (WHERE LOWER(COALESCE(c.clm_type, '')) = 'reimbursement')                AS reimbursement_count
  FROM policy_claim c
  INNER JOIN policy_window pw ON pw.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND c.claim_dt BETWEEN pw.policy_from AND pw.policy_to
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee2.id
        FROM policy_enrollment_employee pee2
        INNER JOIN address a ON LOWER(TRIM(a.addr_1)) = LOWER(TRIM(pee2.policy_location))
        WHERE a.id = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
        AND a.deleted_at IS NULL
        AND pee2.deleted_at IS NULL
      )
    )
  GROUP BY date_trunc('month', c.claim_dt)
),
monthly_prev AS (
  SELECT
    date_trunc('month', c.claim_dt) + INTERVAL '1 year'                                                     AS claim_month,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type, '')) = 'cashless'), 0)            AS cashless_amount_prev_year,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type, '')) = 'reimbursement'), 0)       AS reimbursement_amount_prev_year,
    COUNT(c.id)             FILTER (WHERE LOWER(COALESCE(c.clm_type, '')) = 'cashless')                     AS cashless_count_prev_year,
    COUNT(c.id)             FILTER (WHERE LOWER(COALESCE(c.clm_type, '')) = 'reimbursement')                AS reimbursement_count_prev_year
  FROM policy_claim c
  INNER JOIN policy_window pw ON pw.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND c.claim_dt BETWEEN (pw.policy_from - INTERVAL '1 year') AND (pw.policy_to - INTERVAL '1 year')
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee2.id
        FROM policy_enrollment_employee pee2
        INNER JOIN address a ON LOWER(TRIM(a.addr_1)) = LOWER(TRIM(pee2.policy_location))
        WHERE a.id = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
        AND a.deleted_at IS NULL
        AND pee2.deleted_at IS NULL
      )
    )
  GROUP BY date_trunc('month', c.claim_dt)
)
SELECT
  TO_CHAR(ds.month_start, 'Mon ''YY')           AS "month",
  ds.month_start                                 AS "monthStart",
  COALESCE(mc.cashless_amount, 0)               AS "cashlessAmount",
  COALESCE(mc.reimbursement_amount, 0)          AS "reimbursementAmount",
  COALESCE(mc.cashless_count, 0)                AS "cashlessCount",
  COALESCE(mc.reimbursement_count, 0)           AS "reimbursementCount",
  COALESCE(mp.cashless_amount_prev_year, 0)     AS "cashlessAmountPrevYear",
  COALESCE(mp.reimbursement_amount_prev_year, 0) AS "reimbursementAmountPrevYear",
  COALESCE(mp.cashless_count_prev_year, 0)      AS "cashlessCountPrevYear",
  COALESCE(mp.reimbursement_count_prev_year, 0) AS "reimbursementCountPrevYear"
FROM date_spine ds
LEFT JOIN monthly_cur  mc ON DATE(mc.claim_month) = DATE(ds.month_start)
LEFT JOIN monthly_prev mp ON DATE(mp.claim_month) = DATE(ds.month_start)
ORDER BY ds.month_start
$Q$,
updated_at = NOW()
WHERE name = 'dashboard_claims_monthly_trend';


-- ---------------------------------------------------------------------------
-- 3. dashboard_top10_hospitals — full rewrite with location filter
--    Filter applied in both cur_year_base and prev_year_ranked CTEs.
-- ---------------------------------------------------------------------------
UPDATE admin_reports
SET query = $Q$
WITH policy_window AS (
  SELECT id, policy_from, policy_to FROM policy WHERE id = ###policyId###
),
cur_year_base AS (
  SELECT
    COALESCE(h.id::text, 'ext-' || MD5(COALESCE(c.clm_hospital::text, 'unknown'))) AS hospital_key,
    COALESCE(h.name, c.clm_hospital::text, 'Unknown')                               AS hospital_name,
    COALESCE(a.city_name, '—')                                                      AS city,
    COUNT(c.id)                      AS total_claims,
    COALESCE(SUM(c.claim_amount), 0) AS total_amount
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  LEFT JOIN mstr_hospital h          ON h.id = c.hospital_id   AND h.deleted_at IS NULL
  LEFT JOIN mstr_hospital_address a  ON a.id = h.address_id    AND a.deleted_at IS NULL
  WHERE c.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee2.id
        FROM policy_enrollment_employee pee2
        INNER JOIN address addr ON LOWER(TRIM(addr.addr_1)) = LOWER(TRIM(pee2.policy_location))
        WHERE addr.id = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
        AND addr.deleted_at IS NULL
        AND pee2.deleted_at IS NULL
      )
    )
  GROUP BY
    COALESCE(h.id::text, 'ext-' || MD5(COALESCE(c.clm_hospital::text, 'unknown'))),
    COALESCE(h.name, c.clm_hospital::text, 'Unknown'),
    COALESCE(a.city_name, '—')
),
cur_year AS (
  SELECT hospital_key, hospital_name, city, total_claims, total_amount,
         RANK() OVER (ORDER BY total_amount DESC) AS cur_rank
  FROM cur_year_base
),
prev_year_ranked AS (
  SELECT
    COALESCE(c.hospital_id::text, 'ext-' || MD5(COALESCE(c.clm_hospital::text, 'unknown'))) AS hospital_key,
    COALESCE(SUM(c.claim_amount), 0)                                                          AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount), 0) DESC)                             AS prev_rank
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee2.id
        FROM policy_enrollment_employee pee2
        INNER JOIN address addr ON LOWER(TRIM(addr.addr_1)) = LOWER(TRIM(pee2.policy_location))
        WHERE addr.id = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
        AND addr.deleted_at IS NULL
        AND pee2.deleted_at IS NULL
      )
    )
  GROUP BY COALESCE(c.hospital_id::text, 'ext-' || MD5(COALESCE(c.clm_hospital::text, 'unknown')))
)
SELECT
  cy.hospital_key                                                                                           AS "hospitalId",
  cy.hospital_name                                                                                          AS "hospitalName",
  cy.city                                                                                                   AS "city",
  cy.total_claims                                                                                           AS "totalClaims",
  cy.total_amount                                                                                           AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                                          AS "totalAmountPrevYear",
  py.prev_rank                                                                                              AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END                            AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py, 0)) * 100.0 / NULLIF(py.total_amount_py, 0), 1)  AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.hospital_key = cy.hospital_key
ORDER BY cy.total_amount DESC
$Q$,
updated_at = NOW()
WHERE name = 'dashboard_top10_hospitals';


-- ---------------------------------------------------------------------------
-- 4. dashboard_top10_diseases — full rewrite with location filter
--    Filter applied in both cur_year_base and prev_year_ranked CTEs.
-- ---------------------------------------------------------------------------
UPDATE admin_reports
SET query = $Q$
WITH policy_window AS (
  SELECT id, policy_from, policy_to FROM policy WHERE id = ###policyId###
),
cur_year_base AS (
  SELECT
    INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text), ''), 'Unclassified'))) AS disease_category,
    COUNT(c.id)                      AS total_claims,
    COALESCE(SUM(c.claim_amount), 0) AS total_amount
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee2.id
        FROM policy_enrollment_employee pee2
        INNER JOIN address a ON LOWER(TRIM(a.addr_1)) = LOWER(TRIM(pee2.policy_location))
        WHERE a.id = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
        AND a.deleted_at IS NULL
        AND pee2.deleted_at IS NULL
      )
    )
  GROUP BY INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text), ''), 'Unclassified')))
),
cur_year AS (
  SELECT disease_category, total_claims, total_amount,
         RANK() OVER (ORDER BY total_amount DESC) AS cur_rank
  FROM cur_year_base
),
prev_year_ranked AS (
  SELECT
    INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text), ''), 'Unclassified'))) AS disease_category,
    COALESCE(SUM(c.claim_amount), 0)                                                      AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount), 0) DESC)                         AS prev_rank
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee2.id
        FROM policy_enrollment_employee pee2
        INNER JOIN address a ON LOWER(TRIM(a.addr_1)) = LOWER(TRIM(pee2.policy_location))
        WHERE a.id = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
        AND a.deleted_at IS NULL
        AND pee2.deleted_at IS NULL
      )
    )
  GROUP BY INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text), ''), 'Unclassified')))
)
SELECT
  cy.disease_category                                                                                        AS "diseaseCategory",
  cy.total_claims                                                                                            AS "totalClaims",
  cy.total_amount                                                                                            AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                                           AS "totalAmountPrevYear",
  py.prev_rank                                                                                               AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END                             AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py, 0)) * 100.0 / NULLIF(py.total_amount_py, 0), 1)   AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.disease_category = cy.disease_category
ORDER BY cy.total_amount DESC
$Q$,
updated_at = NOW()
WHERE name = 'dashboard_top10_diseases';


-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
SELECT
  name,
  CASE
    WHEN query LIKE '%pee2.policy_location%' AND query LIKE '%###locationIds###%'
      THEN 'OK — Pattern A via employee_id subquery'
    WHEN query LIKE '%###locationIds###%'
      THEN 'HAS FILTER — different pattern'
    ELSE 'NO FILTER'
  END AS location_filter,
  EXISTS (
    SELECT 1 FROM admin_reports_parameters arp
    WHERE arp.admin_report_id = ar.id AND arp.parameter_name = 'locationIds'
  ) AS locationids_param_registered
FROM admin_reports ar
WHERE name IN (
  'dashboard_claims_monthly_trend',
  'dashboard_top10_hospitals',
  'dashboard_top10_diseases'
)
ORDER BY name;

COMMIT;
