-- -----------------------------------------------------------------------------
-- Script: policy_type_segregation.sql
-- Purpose:
--   * Create a segregation table that maps each policy type to the corresponding
--     IRDAI and IIRM policy type identifiers.
--   * Seed master lookup entries for IRDAI and IIRM policy types.
--   * Populate the segregation table by assigning every POLICY_TYPE lookup entry
--     to one of the seeded IRDAI and IIRM policy types.
-- -----------------------------------------------------------------------------

-- 1. Create the segregation table ------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_type_segregation (
  id SERIAL PRIMARY KEY,
  policy_type_lid INT NOT NULL,
  irdai_policy_type_lid INT NULL,
  iirm_policy_type_lid INT NULL,
  CONSTRAINT fk_policy_type_segregation_policy_type
    FOREIGN KEY (policy_type_lid) REFERENCES lookup_data(id),
  CONSTRAINT fk_policy_type_segregation_irdai
    FOREIGN KEY (irdai_policy_type_lid) REFERENCES lookup_data(id),
  CONSTRAINT fk_policy_type_segregation_iirm
    FOREIGN KEY (iirm_policy_type_lid) REFERENCES lookup_data(id),
  CONSTRAINT uq_policy_type_segregation_policy_type UNIQUE (policy_type_lid)
);

-- 2. Seed IRDAI policy type lookup values ---------------------------------------
INSERT INTO lookup_data (
  lookup_key,
  lookup_name,
  value_key,
  value,
  description,
  created_at,
  updated_at,
  created_by,
  updated_by,
  lookup_order
)
SELECT
  src.lookup_key,
  src.lookup_name,
  src.value_key,
  src.value,
  src.description,
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM',
  src.lookup_order
FROM (
  VALUES
    ('IRDAI_POLICY_TYPE_HEALTH', 'IRDAI_POLICY_TYPE', 'HEALTH', 'Health Insurance', 'IRDAI policy type for health lines', 1),
    ('IRDAI_POLICY_TYPE_LIFE', 'IRDAI_POLICY_TYPE', 'LIFE', 'Life Insurance', 'IRDAI policy type for life lines', 2),
    ('IRDAI_POLICY_TYPE_MOTOR', 'IRDAI_POLICY_TYPE', 'MOTOR', 'Motor Insurance', 'IRDAI policy type for motor lines', 3)
) AS src(lookup_key, lookup_name, value_key, value, description, lookup_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM lookup_data ld
  WHERE ld.lookup_key = src.lookup_key
);

-- 3. Seed IIRM policy type lookup values ----------------------------------------
INSERT INTO lookup_data (
  lookup_key,
  lookup_name,
  value_key,
  value,
  description,
  created_at,
  updated_at,
  created_by,
  updated_by,
  lookup_order
)
SELECT
  src.lookup_key,
  src.lookup_name,
  src.value_key,
  src.value,
  src.description,
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM',
  src.lookup_order
FROM (
  VALUES
    ('IIRM_POLICY_TYPE_CORPORATE', 'IIRM_POLICY_TYPE', 'CORPORATE', 'Corporate Segment', 'IIRM policy type for corporate business', 1),
    ('IIRM_POLICY_TYPE_RETAIL', 'IIRM_POLICY_TYPE', 'RETAIL', 'Retail Segment', 'IIRM policy type for retail business', 2),
    ('IIRM_POLICY_TYPE_SPECIALTY', 'IIRM_POLICY_TYPE', 'SPECIALTY', 'Specialty Segment', 'IIRM policy type for specialty business', 3)
) AS src(lookup_key, lookup_name, value_key, value, description, lookup_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM lookup_data ld
  WHERE ld.lookup_key = src.lookup_key
);

-- 4. Populate segregation table with existing policy types ----------------------
WITH irdai_ids AS (
  SELECT
    MAX(CASE WHEN lookup_key = 'IRDAI_POLICY_TYPE_HEALTH' THEN id END) AS health_id,
    MAX(CASE WHEN lookup_key = 'IRDAI_POLICY_TYPE_LIFE' THEN id END) AS life_id,
    MAX(CASE WHEN lookup_key = 'IRDAI_POLICY_TYPE_MOTOR' THEN id END) AS motor_id
  FROM lookup_data
),
iirm_ids AS (
  SELECT
    MAX(CASE WHEN lookup_key = 'IIRM_POLICY_TYPE_CORPORATE' THEN id END) AS corporate_id,
    MAX(CASE WHEN lookup_key = 'IIRM_POLICY_TYPE_RETAIL' THEN id END) AS retail_id,
    MAX(CASE WHEN lookup_key = 'IIRM_POLICY_TYPE_SPECIALTY' THEN id END) AS specialty_id
  FROM lookup_data
),
policy_types AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY id) AS row_number
  FROM lookup_data
  WHERE (lookup_name = 'POLICY_TYPE' OR lookup_key = 'POLICY_TYPE')
    AND deleted_at IS NULL
)
INSERT INTO policy_type_segregation (
  policy_type_lid,
  irdai_policy_type_lid,
  iirm_policy_type_lid
)
SELECT
  pt.id,
  CASE ((pt.row_number - 1) % 3)
    WHEN 0 THEN irdai.health_id
    WHEN 1 THEN irdai.life_id
    ELSE irdai.motor_id
  END AS irdai_policy_type_lid,
  CASE ((pt.row_number - 1) % 3)
    WHEN 0 THEN iirm.corporate_id
    WHEN 1 THEN iirm.retail_id
    ELSE iirm.specialty_id
  END AS iirm_policy_type_lid
FROM policy_types pt
CROSS JOIN irdai_ids irdai
CROSS JOIN iirm_ids iirm
ON CONFLICT (policy_type_lid) DO UPDATE
SET
  irdai_policy_type_lid = EXCLUDED.irdai_policy_type_lid,
  iirm_policy_type_lid = EXCLUDED.iirm_policy_type_lid;

-- 5. Verification queries ------------------------------------------------------
-- The following helper queries can be used to validate that the data produced
-- by the dashboard matches the segregation that was just created. Replace the
-- placeholder :user_ids with the comma-separated list of user identifiers that
-- should be included in the validation scope. Provide the financial year start
-- (for example, 2025 for FY 2025-26) via the :financial_year placeholder to
-- mirror the filtering applied by the API. Leaving :financial_year empty will
-- run the queries without a financial year boundary.

-- 5.a Legacy distribution (grouped by POLICY_TYPE_LID) -------------------------
WITH params AS (
  SELECT NULLIF(:financial_year, '')::INT AS financial_year
),
bounds AS (
  SELECT
    financial_year,
    CASE
      WHEN financial_year IS NULL THEN NULL
      ELSE make_date(financial_year, 4, 1)
    END AS policy_to_start,
    CASE
      WHEN financial_year IS NULL THEN NULL
      ELSE make_date(financial_year + 1, 3, 31)
    END AS policy_to_end
  FROM params
)
SELECT
  p."policy_type_lid" AS "policyTypeLid",
  ld."value" AS "policyType",
  COALESCE(SUM(p."net_premium_amount"), 0) AS "premiumAmount",
  COALESCE(SUM(p."brokerage_amount"), 0) AS "brokerageAmount",
  COUNT(p."id") AS "policyCount"
FROM policy p
LEFT JOIN lookup_data ld
  ON ld."id" = p."policy_type_lid"
CROSS JOIN bounds fy
WHERE p."created_by" IN (:user_ids)
  AND p."policy_to" >= CURRENT_DATE
  AND (fy.policy_to_start IS NULL OR p."policy_to" >= fy.policy_to_start)
  AND (fy.policy_to_end IS NULL OR p."policy_to" <= fy.policy_to_end)
GROUP BY p."policy_type_lid", ld."value"
ORDER BY "premiumAmount" DESC;

-- 5.b IIRM distribution (grouped by IIRM_POLICY_TYPE_LID) ----------------------
WITH params AS (
  SELECT NULLIF(:financial_year, '')::INT AS financial_year
),
bounds AS (
  SELECT
    financial_year,
    CASE
      WHEN financial_year IS NULL THEN NULL
      ELSE make_date(financial_year, 4, 1)
    END AS policy_to_start,
    CASE
      WHEN financial_year IS NULL THEN NULL
      ELSE make_date(financial_year + 1, 3, 31)
    END AS policy_to_end
  FROM params
)
SELECT
  pts."iirm_policy_type_lid" AS "iirmPolicyTypeLid",
  iirm."value" AS "iirmPolicyType",
  COALESCE(SUM(p."net_premium_amount"), 0) AS "premiumAmount",
  COALESCE(SUM(p."brokerage_amount"), 0) AS "brokerageAmount",
  COUNT(p."id") AS "policyCount"
FROM policy p
LEFT JOIN policy_type_segregation pts
  ON p."policy_type_lid" = pts."policy_type_lid"
LEFT JOIN lookup_data iirm
  ON pts."iirm_policy_type_lid" = iirm."id"
CROSS JOIN bounds fy
WHERE p."created_by" IN (:user_ids)
  AND p."policy_to" >= CURRENT_DATE
  AND (fy.policy_to_start IS NULL OR p."policy_to" >= fy.policy_to_start)
  AND (fy.policy_to_end IS NULL OR p."policy_to" <= fy.policy_to_end)
GROUP BY pts."iirm_policy_type_lid", iirm."value"
ORDER BY "premiumAmount" DESC;

-- 5.c Policy expiry timeline buckets (matches dashboard buckets) ---------------
WITH params AS (
  SELECT NULLIF(:financial_year, '')::INT AS financial_year
),
bounds AS (
  SELECT
    financial_year,
    CASE
      WHEN financial_year IS NULL THEN NULL
      ELSE make_date(financial_year, 4, 1)
    END AS policy_to_start,
    CASE
      WHEN financial_year IS NULL THEN NULL
      ELSE make_date(financial_year + 1, 3, 31)
    END AS policy_to_end
  FROM params
)
SELECT
  CASE
    WHEN p."policy_to" <= CURRENT_DATE + INTERVAL '30 days' THEN 'Next 30 Days'
    WHEN p."policy_to" <= CURRENT_DATE + INTERVAL '60 days' THEN 'Next 60 Days'
    WHEN p."policy_to" <= CURRENT_DATE + INTERVAL '90 days' THEN 'Next 90 Days'
    ELSE 'Beyond 90 Days'
  END AS bucket,
  COUNT(p."id") AS "policyCount"
FROM policy p
CROSS JOIN bounds fy
WHERE p."created_by" IN (:user_ids)
  AND p."policy_to" >= CURRENT_DATE
  AND (fy.policy_to_start IS NULL OR p."policy_to" >= fy.policy_to_start)
  AND (fy.policy_to_end IS NULL OR p."policy_to" <= fy.policy_to_end)
GROUP BY bucket
ORDER BY bucket;
