-- Package Policy Cover Section Migration
-- 0. Schema changes to keep (no mock/default section inserts)

BEGIN;

CREATE TABLE IF NOT EXISTS public.mstr_cover_section (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  key VARCHAR(100) NOT NULL UNIQUE,
  display_sequence INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL DEFAULT 0,
  updated_by INT NOT NULL DEFAULT 0
);

ALTER TABLE public.mstr_cover_template
  ADD COLUMN IF NOT EXISTS section_id INT NULL;

ALTER TABLE public.opportunity_cover_map
  ADD COLUMN IF NOT EXISTS section_id INT NULL;

ALTER TABLE public.policy_cover_map
  ADD COLUMN IF NOT EXISTS section_id INT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_mstr_cover_template_section_id'
  ) THEN
    ALTER TABLE public.mstr_cover_template
      ADD CONSTRAINT fk_mstr_cover_template_section_id
      FOREIGN KEY (section_id) REFERENCES public.mstr_cover_section(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_opportunity_cover_map_section_id'
  ) THEN
    ALTER TABLE public.opportunity_cover_map
      ADD CONSTRAINT fk_opportunity_cover_map_section_id
      FOREIGN KEY (section_id) REFERENCES public.mstr_cover_section(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_policy_cover_map_section_id'
  ) THEN
    ALTER TABLE public.policy_cover_map
      ADD CONSTRAINT fk_policy_cover_map_section_id
      FOREIGN KEY (section_id) REFERENCES public.mstr_cover_section(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mstr_cover_template_section_id
  ON public.mstr_cover_template(section_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_cover_map_section_id
  ON public.opportunity_cover_map(section_id);

CREATE INDEX IF NOT EXISTS idx_policy_cover_map_section_id
  ON public.policy_cover_map(section_id);

COMMIT;

-- Package Policy Cover Section Migration
-- 1. Insert missing sections into mstr_cover_section
-- 2. Map section_id in mstr_cover_template
-- 3. Validate unmapped template rows
-- 4. Backfill old opportunity_cover_map rows
-- 5. Validate old opportunity rows after retrofit

-- =========================================================
-- 1. Insertions in sections for covers
-- =========================================================

INSERT INTO public.mstr_cover_section
(id, name, key, display_sequence, is_active, created_at, updated_at, created_by, updated_by)
SELECT
    nextval('mstr_cover_section_id_seq'),
    v.name,
    v.key,
    v.display_sequence,
    true,
    NOW(),
    NOW(),
    1,
    1
FROM (
    VALUES
    ('Bharat Sookshma (BSUS) / Bharat Laghu (BLUS)', 'BHARAT_SOOKSHMA_BHARAT_LAGHU', 1),
    ('Burglary', 'BURGLARY', 2),
    ('Machinery Breakdown', 'MACHINERY_BREAKDOWN', 3),
    ('Electronic Equipment', 'ELECTRONIC_EQUIPMENT', 4),
    ('Portable Electronic Equipment', 'PORTABLE_ELECTRONIC_EQUIPMENT', 5),
    ('Money Insurance', 'MONEY_INSURANCE', 6),
    ('Fidelity', 'FIDELITY', 7),
    ('Any Additional Section With Coverages', 'ADDITIONAL_SECTION_WITH_COVERAGES', 8)
) AS v(name, key, display_sequence)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.mstr_cover_section mcs
    WHERE mcs.key = v.key
);

-- =========================================================
-- 2. Update section_id in mstr_cover_template for Package Policy
-- =========================================================

BEGIN;

-- 2.0 Reset Package Policy mappings before applying deterministic section map
UPDATE public.mstr_cover_template
SET section_id = NULL,
    updated_at = NOW()
WHERE policy_type_id = (
  SELECT id
  FROM lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  LIMIT 1
);

-- Deterministic mapping across all Package Policy sections.
-- Handles duplicate cover names by mapping occurrences by section priority.
WITH section_priority(section_key, priority) AS (
  VALUES
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', 1),
    ('BURGLARY', 2),
    ('MACHINERY_BREAKDOWN', 3),
    ('ELECTRONIC_EQUIPMENT', 4),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 5),
    ('MONEY_INSURANCE', 6),
    ('FIDELITY', 7),
    ('ADDITIONAL_SECTION_WITH_COVERAGES', 8)
),
section_cover_map(section_key, cover_name) AS (
  VALUES
    -- Bharat Sookshma (BSUS) / Bharat Laghu (BLUS)
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '1.Fire, including due to its own fermentation, or natural  heating or spontaneous combustion;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '2.Explosion or Implosion;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '3.Lightning;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '4.Earthquake, volcanic eruption, or other convulsions of nature;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '5.Storm, Cyclone, Typhoon, Tempest, Hurricane, Tornado, Tsunami, Flood and Inundation;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '6.Subsidence of the land on which Your Premises stand, Landslide, Rockslide;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '7.Bush Fire, Forest Fire, Jungle Fire;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '8.Impact damage of any kind, i.e., damage caused by impact of, or collision caused by, any external physical object (e.g. vehicle, falling trees, aircraft, wall );'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '9.Missile testing operations;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '10.Riot, Strikes, Malicious Damages;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '11.Bursting or overflowing of water tanks apparatus and pipes;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '12.Leakage from automatic sprinkler installations;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '13.Theft within 7 days from the occurrence of, and proximately caused by, any of the above Insured Events'),

    -- Burglary
    ('BURGLARY', 'Theft Extension'),
    ('BURGLARY', 'Riot, Strike & Malicious Damage (RSMD)'),
    ('BURGLARY', 'First loss limit/Full Sum Insured'),
    ('BURGLARY', 'Goods held in care, custody, control of the insured'),
    ('BURGLARY', 'Damage to assets during the act or attempt there at the time of Burglary and/or theft'),
    ('BURGLARY', 'Waiver of FIR'),
    ('BURGLARY', 'Wavier for Final investigation report for settlement of claim'),

    -- Machinery Breakdown
    ('MACHINERY_BREAKDOWN', 'Escalation '),
    ('MACHINERY_BREAKDOWN', 'Express freight'),
    ('MACHINERY_BREAKDOWN', 'Air freight'),
    ('MACHINERY_BREAKDOWN', 'Owners surrounding property'),
    ('MACHINERY_BREAKDOWN', 'Third party liability'),
    ('MACHINERY_BREAKDOWN', 'Additional customs duty'),
    ('MACHINERY_BREAKDOWN', 'Cover for foundation, masonry, brickwork'),
    ('MACHINERY_BREAKDOWN', 'Consumables like transformer oil, etc.'),

    -- Electronic Equipment
    ('ELECTRONIC_EQUIPMENT', 'Burglary & Theft'),
    ('ELECTRONIC_EQUIPMENT', 'Electrical and Mechanical Breakdown'),
    ('ELECTRONIC_EQUIPMENT', 'Escalation '),
    ('ELECTRONIC_EQUIPMENT', 'Express freight'),
    ('ELECTRONIC_EQUIPMENT', 'Air freight'),
    ('ELECTRONIC_EQUIPMENT', 'Owners surrounding property'),
    ('ELECTRONIC_EQUIPMENT', 'Third party liability'),
    ('ELECTRONIC_EQUIPMENT', 'Additional custom duty'),
    ('ELECTRONIC_EQUIPMENT', 'Omission to Insure'),
    ('ELECTRONIC_EQUIPMENT', 'Waiver of under insurance'),
    ('ELECTRONIC_EQUIPMENT', 'Goods held in trust'),
    ('ELECTRONIC_EQUIPMENT', 'Reinstatment value clause'),

    -- Portable Electronic Equipment
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Burglary & Theft'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Reinstatement value clause'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'All accidental damage'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Electrical and Mechanical Breakdown'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Waiver of Police Intimation up to INR 25,000 & Waiver of FIR Up to INR 1 Lakh'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Reinstatement value clause'),

    -- Money Insurance
    ('MONEY_INSURANCE', 'Money Insurance'),
    ('MONEY_INSURANCE', 'Single Carrying Limit - In Transit'),
    ('MONEY_INSURANCE', 'Annual Carrying Limit'),
    ('MONEY_INSURANCE', 'Money in Safe'),
    ('MONEY_INSURANCE', 'Money in counter/till'),
    ('MONEY_INSURANCE', 'Theft & RSMD'),
    ('MONEY_INSURANCE', 'Infidelity of the cash carrying employee'),
    ('MONEY_INSURANCE', 'Assault cover for cash carrying employee /s'),
    ('MONEY_INSURANCE', 'loss or damage to employees personal property during the during any fortituos act'),
    ('MONEY_INSURANCE', 'Damage to assets during the act or attempt there at the time of Burglary and/or theft'),
    ('MONEY_INSURANCE', 'Damage to locker/ safe / almairah during the incident'),
    ('MONEY_INSURANCE', 'Cost of change of Keys'),

    -- Fidelity
    ('FIDELITY', 'Cover to include permanent employees / temporary / contractual/off-roll employees'),
    ('FIDELITY', 'Waiver of FIR'),
    ('FIDELITY', 'Wavier for Final investigation report for settlement of claim'),
    ('FIDELITY', 'Automatic reinstatement of sum insured'),
    ('FIDELITY', 'Un-named Basis / Floater Basis'),
    ('FIDELITY', 'Total no. of employees to be coveres'),
    ('FIDELITY', 'Limits of Cash/Goods Handled'),
    ('FIDELITY', 'Mode of travel to deliver the goods if any'),

    -- Any Additional Section With Coverages
    ('ADDITIONAL_SECTION_WITH_COVERAGES', 'Other Terms & Covers'),
    ('ADDITIONAL_SECTION_WITH_COVERAGES', 'Excess/Deductibles')
),
mapping_ranked AS (
  SELECT
    scm.section_key,
    LOWER(TRIM(scm.cover_name)) AS cover_name_norm,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(scm.cover_name))
      ORDER BY sp.priority, scm.section_key
    ) AS occurrence_no
  FROM section_cover_map scm
  JOIN section_priority sp
    ON sp.section_key = scm.section_key
),
template_ranked AS (
  SELECT
    mct.id,
    LOWER(TRIM(mct.cover_name)) AS cover_name_norm,
    ROW_NUMBER() OVER (
      PARTITION BY mct.policy_type_id, LOWER(TRIM(mct.cover_name))
      ORDER BY COALESCE(mct.display_sequence, 999999), mct.id
    ) AS occurrence_no
  FROM public.mstr_cover_template mct
  WHERE mct.policy_type_id = (
    SELECT id
    FROM lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
    LIMIT 1
  )
)
UPDATE public.mstr_cover_template mct
SET section_id = mcs.id,
    updated_at = NOW()
FROM template_ranked tr
JOIN mapping_ranked mr
  ON mr.cover_name_norm = tr.cover_name_norm
 AND mr.occurrence_no = tr.occurrence_no
JOIN public.mstr_cover_section mcs
  ON mcs.key = mr.section_key
WHERE mct.id = tr.id
  AND mct.section_id IS DISTINCT FROM mcs.id;

-- Case-sensitive waiver override:
-- 1) "Waiver of under insurance" belongs to ELECTRONIC_EQUIPMENT
-- 2) "Waiver of Under Insurance" is intentionally unmapped (NULL)
WITH package_policy AS (
  SELECT id AS policy_type_id
  FROM lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  LIMIT 1
),
ee_section AS (
  SELECT id AS section_id
  FROM public.mstr_cover_section
  WHERE key = 'ELECTRONIC_EQUIPMENT'
  LIMIT 1
)
UPDATE public.mstr_cover_template mct
SET section_id = ee.section_id,
    updated_at = NOW()
FROM package_policy pp, ee_section ee
WHERE mct.policy_type_id = pp.policy_type_id
  AND mct.cover_name = 'Waiver of under insurance';

WITH package_policy AS (
  SELECT id AS policy_type_id
  FROM lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  LIMIT 1
)
UPDATE public.mstr_cover_template mct
SET section_id = NULL,
    updated_at = NOW()
FROM package_policy pp
WHERE mct.policy_type_id = pp.policy_type_id
  AND mct.cover_name = 'Waiver of Under Insurance';

-- Safety check: if any cover name has different occurrence count between
-- mapping blueprint and template data, review before production rollout.
WITH section_cover_map(section_key, cover_name) AS (
  VALUES
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '1.Fire, including due to its own fermentation, or natural  heating or spontaneous combustion;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '2.Explosion or Implosion;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '3.Lightning;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '4.Earthquake, volcanic eruption, or other convulsions of nature;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '5.Storm, Cyclone, Typhoon, Tempest, Hurricane, Tornado, Tsunami, Flood and Inundation;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '6.Subsidence of the land on which Your Premises stand, Landslide, Rockslide;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '7.Bush Fire, Forest Fire, Jungle Fire;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '8.Impact damage of any kind, i.e., damage caused by impact of, or collision caused by, any external physical object (e.g. vehicle, falling trees, aircraft, wall );'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '9.Missile testing operations;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '10.Riot, Strikes, Malicious Damages;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '11.Bursting or overflowing of water tanks apparatus and pipes;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '12.Leakage from automatic sprinkler installations;'),
    ('BHARAT_SOOKSHMA_BHARAT_LAGHU', '13.Theft within 7 days from the occurrence of, and proximately caused by, any of the above Insured Events'),
    ('BURGLARY', 'Theft Extension'),
    ('BURGLARY', 'Riot, Strike & Malicious Damage (RSMD)'),
    ('BURGLARY', 'First loss limit/Full Sum Insured'),
    ('BURGLARY', 'Goods held in care, custody, control of the insured'),
    ('BURGLARY', 'Damage to assets during the act or attempt there at the time of Burglary and/or theft'),
    ('BURGLARY', 'Waiver of FIR'),
    ('BURGLARY', 'Wavier for Final investigation report for settlement of claim'),
    ('MACHINERY_BREAKDOWN', 'Escalation '),
    ('MACHINERY_BREAKDOWN', 'Express freight'),
    ('MACHINERY_BREAKDOWN', 'Air freight'),
    ('MACHINERY_BREAKDOWN', 'Owners surrounding property'),
    ('MACHINERY_BREAKDOWN', 'Third party liability'),
    ('MACHINERY_BREAKDOWN', 'Additional customs duty'),
    ('MACHINERY_BREAKDOWN', 'Cover for foundation, masonry, brickwork'),
    ('MACHINERY_BREAKDOWN', 'Consumables like transformer oil, etc.'),
    ('ELECTRONIC_EQUIPMENT', 'Burglary & Theft'),
    ('ELECTRONIC_EQUIPMENT', 'Electrical and Mechanical Breakdown'),
    ('ELECTRONIC_EQUIPMENT', 'Escalation '),
    ('ELECTRONIC_EQUIPMENT', 'Express freight'),
    ('ELECTRONIC_EQUIPMENT', 'Air freight'),
    ('ELECTRONIC_EQUIPMENT', 'Owners surrounding property'),
    ('ELECTRONIC_EQUIPMENT', 'Third party liability'),
    ('ELECTRONIC_EQUIPMENT', 'Additional custom duty'),
    ('ELECTRONIC_EQUIPMENT', 'Omission to Insure'),
    ('ELECTRONIC_EQUIPMENT', 'Waiver of under insurance'),
    ('ELECTRONIC_EQUIPMENT', 'Goods held in trust'),
    ('ELECTRONIC_EQUIPMENT', 'Reinstatment value clause'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Burglary & Theft'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Reinstatement value clause'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'All accidental damage'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Electrical and Mechanical Breakdown'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Waiver of Police Intimation up to INR 25,000 & Waiver of FIR Up to INR 1 Lakh'),
    ('PORTABLE_ELECTRONIC_EQUIPMENT', 'Reinstatement value clause'),
    ('MONEY_INSURANCE', 'Money Insurance'),
    ('MONEY_INSURANCE', 'Single Carrying Limit - In Transit'),
    ('MONEY_INSURANCE', 'Annual Carrying Limit'),
    ('MONEY_INSURANCE', 'Money in Safe'),
    ('MONEY_INSURANCE', 'Money in counter/till'),
    ('MONEY_INSURANCE', 'Theft & RSMD'),
    ('MONEY_INSURANCE', 'Infidelity of the cash carrying employee'),
    ('MONEY_INSURANCE', 'Assault cover for cash carrying employee /s'),
    ('MONEY_INSURANCE', 'loss or damage to employees personal property during the during any fortituos act'),
    ('MONEY_INSURANCE', 'Damage to assets during the act or attempt there at the time of Burglary and/or theft'),
    ('MONEY_INSURANCE', 'Damage to locker/ safe / almairah during the incident'),
    ('MONEY_INSURANCE', 'Cost of change of Keys'),
    ('FIDELITY', 'Cover to include permanent employees / temporary / contractual/off-roll employees'),
    ('FIDELITY', 'Waiver of FIR'),
    ('FIDELITY', 'Wavier for Final investigation report for settlement of claim'),
    ('FIDELITY', 'Automatic reinstatement of sum insured'),
    ('FIDELITY', 'Un-named Basis / Floater Basis'),
    ('FIDELITY', 'Total no. of employees to be coveres'),
    ('FIDELITY', 'Limits of Cash/Goods Handled'),
    ('FIDELITY', 'Mode of travel to deliver the goods if any'),
    ('ADDITIONAL_SECTION_WITH_COVERAGES', 'Other Terms & Covers'),
    ('ADDITIONAL_SECTION_WITH_COVERAGES', 'Excess/Deductibles')
),
map_counts AS (
  SELECT LOWER(TRIM(cover_name)) AS cover_name_norm, COUNT(*) AS map_cnt
  FROM section_cover_map
  GROUP BY LOWER(TRIM(cover_name))
),
tmpl_counts AS (
  SELECT LOWER(TRIM(cover_name)) AS cover_name_norm, COUNT(*) AS tmpl_cnt
  FROM public.mstr_cover_template
  WHERE policy_type_id = (
    SELECT id
    FROM lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
    LIMIT 1
  )
    AND LOWER(TRIM(cover_name)) IN (SELECT cover_name_norm FROM map_counts)
  GROUP BY LOWER(TRIM(cover_name))
)
SELECT
  COALESCE(m.cover_name_norm, t.cover_name_norm) AS cover_name_norm,
  COALESCE(m.map_cnt, 0) AS mapping_occurrences,
  COALESCE(t.tmpl_cnt, 0) AS template_occurrences
FROM map_counts m
FULL OUTER JOIN tmpl_counts t
  ON t.cover_name_norm = m.cover_name_norm
WHERE COALESCE(m.map_cnt, 0) <> COALESCE(t.tmpl_cnt, 0)
ORDER BY 1;

-- Validate unmapped template rows for Package Policy
SELECT id, ref_cover_id, cover_name, display_sequence, section_id
FROM public.mstr_cover_template
WHERE policy_type_id = (
    SELECT id
    FROM lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
)
AND section_id IS NULL
ORDER BY display_sequence, id;

COMMIT;

-- =========================================================
-- 2.5 Production Safety Checklist (Run before Step 3 in PROD/UAT)
-- =========================================================

-- 2.5.1 Verify all FK dependencies referencing opportunity_cover_map(id)
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'opportunity_cover_map'
  AND ccu.column_name = 'id'
ORDER BY tc.table_name, kcu.column_name;

-- 2.5.2 Take point-in-time backup tables for PACKAGE_POLICY slice.
-- Creates three backup tables with timestamp suffix:
--   bkp_mct_package_policy_<ts>
--   bkp_ocm_package_policy_<ts>
--   bkp_obsvcmd_package_policy_<ts>
DO $$
DECLARE
  v_policy_type_id INT;
  v_suffix TEXT := to_char(clock_timestamp(), 'YYYYMMDD_HH24MISS');
  v_bkp_mct TEXT := format('bkp_mct_package_policy_%s', v_suffix);
  v_bkp_ocm TEXT := format('bkp_ocm_package_policy_%s', v_suffix);
  v_bkp_obsvcmd TEXT := format('bkp_obsvcmd_package_policy_%s', v_suffix);
BEGIN
  SELECT id
  INTO v_policy_type_id
  FROM lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  LIMIT 1;

  IF v_policy_type_id IS NULL THEN
    RAISE EXCEPTION 'PACKAGE_POLICY id not found in lookup_data';
  END IF;

  EXECUTE format(
    'CREATE TABLE %I AS
     SELECT *
     FROM public.mstr_cover_template
     WHERE policy_type_id = %s',
    v_bkp_mct,
    v_policy_type_id
  );

  EXECUTE format(
    'CREATE TABLE %I AS
     SELECT *
     FROM public.opportunity_cover_map
     WHERE policy_type_id = %s',
    v_bkp_ocm,
    v_policy_type_id
  );

  EXECUTE format(
    'CREATE TABLE %I AS
     SELECT d.*
     FROM public.opportunity_broking_slip_version_cover_map_details d
     JOIN public.opportunity_cover_map ocm
       ON ocm.id = d.cover_map_id
     WHERE ocm.policy_type_id = %s',
    v_bkp_obsvcmd,
    v_policy_type_id
  );

  RAISE NOTICE 'Created backup table: %', v_bkp_mct;
  RAISE NOTICE 'Created backup table: %', v_bkp_ocm;
  RAISE NOTICE 'Created backup table: %', v_bkp_obsvcmd;
END $$;

-- =========================================================
-- 3. Retrofit PACKAGE POLICY old opportunities
--    3.0 Preview opportunities targeted for retrofit
--    3.1 Remove duplicate opportunity cover rows
--    3.2 Insert missing opportunity cover rows
--    3.3 Sync section_id from template
-- =========================================================

-- 3.0 Preview Package Policy opportunities that will be affected by retrofit
-- missing_cover_rows: template rows absent in opportunity_cover_map
-- null_section_rows: existing opportunity_cover_map rows with section_id NULL
WITH package_policy AS (
  SELECT id
  FROM lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  LIMIT 1
),
missing_cover_counts AS (
  SELECT
    o.id AS opportunity_id,
    COUNT(*) AS missing_cover_rows
  FROM public.opportunity o
  JOIN package_policy pp
    ON pp.id = o.policy_type_lid
  JOIN public.mstr_cover_template mct
    ON mct.policy_type_id = o.policy_type_lid
  LEFT JOIN public.opportunity_cover_map ocm
    ON ocm.opportunity_id = o.id
   AND ocm.cover_id = mct.ref_cover_id
   AND COALESCE(ocm.display_sequence, -1) = COALESCE(mct.display_sequence, -1)
  WHERE ocm.id IS NULL
  GROUP BY o.id
),
null_section_counts AS (
  SELECT
    ocm.opportunity_id,
    COUNT(*) AS null_section_rows
  FROM public.opportunity_cover_map ocm
  JOIN package_policy pp
    ON pp.id = ocm.policy_type_id
  WHERE ocm.section_id IS NULL
  GROUP BY ocm.opportunity_id
)
SELECT
  COALESCE(mcc.opportunity_id, nsc.opportunity_id) AS opportunity_id,
  COALESCE(mcc.missing_cover_rows, 0) AS missing_cover_rows,
  COALESCE(nsc.null_section_rows, 0) AS null_section_rows
FROM missing_cover_counts mcc
FULL OUTER JOIN null_section_counts nsc
  ON nsc.opportunity_id = mcc.opportunity_id
ORDER BY opportunity_id;

BEGIN;

-- 3.1 Remove duplicate Package Policy rows (keep smallest id)
--     Re-point child references before delete to avoid FK violations.
WITH package_policy AS (
  SELECT id
  FROM lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  LIMIT 1
),
duplicate_rows AS (
  SELECT
    ocm.id,
    FIRST_VALUE(ocm.id) OVER (
      PARTITION BY ocm.opportunity_id, ocm.cover_id, COALESCE(ocm.display_sequence, -1)
      ORDER BY ocm.id
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY ocm.opportunity_id, ocm.cover_id, COALESCE(ocm.display_sequence, -1)
      ORDER BY ocm.id
    ) AS rn
  FROM public.opportunity_cover_map ocm
  JOIN package_policy pp
    ON pp.id = ocm.policy_type_id
)
UPDATE public.opportunity_broking_slip_version_cover_map_details d
SET cover_map_id = dr.keep_id
FROM duplicate_rows dr
WHERE d.cover_map_id = dr.id
  AND dr.rn > 1;

WITH package_policy AS (
  SELECT id
  FROM lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  LIMIT 1
),
duplicate_rows AS (
  SELECT
    ocm.id,
    ROW_NUMBER() OVER (
      PARTITION BY ocm.opportunity_id, ocm.cover_id, COALESCE(ocm.display_sequence, -1)
      ORDER BY ocm.id
    ) AS rn
  FROM public.opportunity_cover_map ocm
  JOIN package_policy pp
    ON pp.id = ocm.policy_type_id
)
DELETE FROM public.opportunity_cover_map ocm
USING duplicate_rows d
WHERE ocm.id = d.id
  AND d.rn > 1;

-- 3.2 Insert missing covers for all Package Policy opportunities
INSERT INTO public.opportunity_cover_map (
  opportunity_id,
  policy_type_id,
  cover_id,
  mandate_type,
  approval_required,
  cover_name,
  cover_description,
  display_sequence,
  display_category,
  cover_type,
  input_type,
  input_lov,
  covers_meta,
  section_id,
  created_at,
  updated_at
)
SELECT
  o.id,
  mct.policy_type_id,
  mct.ref_cover_id,
  COALESCE(mct.mandatory, 'Yes'),
  'No',
  mct.cover_name,
  mct.cover_description,
  mct.display_sequence,
  mct.display_category,
  mct.cover_type,
  mct.input_type,
  mct.input_lov,
  mct.covers_meta,
  mct.section_id,
  NOW(),
  NOW()
FROM public.opportunity o
JOIN public.mstr_cover_template mct
  ON mct.policy_type_id = o.policy_type_lid
LEFT JOIN public.opportunity_cover_map ocm
  ON ocm.opportunity_id = o.id
 AND ocm.cover_id = mct.ref_cover_id
 AND COALESCE(ocm.display_sequence, -1) = COALESCE(mct.display_sequence, -1)
WHERE o.policy_type_lid = (
    SELECT id
    FROM lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
    LIMIT 1
)
AND ocm.id IS NULL;

-- 3.3 Sync section_id for existing Package Policy cover rows
UPDATE public.opportunity_cover_map ocm
SET section_id = mct.section_id,
    updated_at = NOW()
FROM public.mstr_cover_template mct
WHERE ocm.cover_id = mct.ref_cover_id
  AND ocm.policy_type_id = mct.policy_type_id
  AND COALESCE(ocm.display_sequence, -1) = COALESCE(mct.display_sequence, -1)
  AND ocm.section_id IS DISTINCT FROM mct.section_id
  AND ocm.policy_type_id = (
      SELECT id
      FROM lookup_data
      WHERE lookup_name = 'POLICY_TYPE'
        AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  );

SELECT COUNT(*) AS remaining_null_section_rows
FROM public.opportunity_cover_map
WHERE policy_type_id = (
    SELECT id
    FROM lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
)
AND section_id IS NULL;

-- 3.3.1 Sync section_id for existing policy_cover_map rows
-- Uses cover_template_id -> mstr_cover_template.id and policy type guard.
UPDATE public.policy_cover_map pcm
SET section_id = mct.section_id,
    updated_at = NOW()
FROM public.policy p,
     public.mstr_cover_template mct
WHERE p.id = pcm.policy_id
  AND mct.id = pcm.cover_template_id
  AND p.policy_type_lid = mct.policy_type_id
  AND pcm.section_id IS DISTINCT FROM mct.section_id;

SELECT COUNT(*) AS policy_cover_remaining_null_section_rows
FROM public.policy_cover_map pcm
JOIN public.policy p
  ON p.id = pcm.policy_id
WHERE p.policy_type_lid = (
    SELECT id
    FROM lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
    LIMIT 1
)
AND pcm.section_id IS NULL;

COMMIT;

-- 3.4 Protect against future duplicate inserts for Package Policy
DO $$
DECLARE
  v_policy_type_id INT;
BEGIN
  SELECT id
  INTO v_policy_type_id
  FROM lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
  LIMIT 1;

  IF v_policy_type_id IS NULL THEN
    RAISE EXCEPTION 'PACKAGE_POLICY id not found in lookup_data';
  END IF;

  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS ux_ocm_pkg_opp_policy_cover_seq
     ON public.opportunity_cover_map (
       opportunity_id,
       policy_type_id,
       cover_id,
       COALESCE(display_sequence, -1)
     )
     WHERE policy_type_id = %s',
    v_policy_type_id
  );
END $$;

-- =========================================================
-- 4. Validate old opportunity rows after retrofit
-- =========================================================

SELECT
    ocm.id,
    ocm.opportunity_id,
    ocm.cover_id,
    ocm.cover_name,
    ocm.section_id,
    mcs.name AS section_name
FROM public.opportunity_cover_map ocm
LEFT JOIN public.mstr_cover_section mcs
  ON ocm.section_id = mcs.id
WHERE ocm.policy_type_id = (
    SELECT id
    FROM lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
)
ORDER BY ocm.opportunity_id, ocm.id;

-- =========================================================
-- 5. Kenya policy set cover section migration (23-Feb-2026 sheet)
-- Note:
-- 1. No CREATE TABLE / ALTER TABLE statements here; schema already exists.
-- 2. Policies without section heading rows in the sheet are intentionally skipped.
--    - Employers Liability
--    - Aviation hull & liability
-- 3. Base / top-level covers before the first section heading are intentionally left with NULL section_id.
-- =========================================================

-- 5.1 Insert missing reusable sections
-- Insert new sections with auto display_sequence

INSERT INTO public.mstr_cover_section
(id, name, key, display_sequence, is_active, created_at, updated_at, created_by, updated_by)
SELECT
    nextval('mstr_cover_section_id_seq'),
    v.name,
    v.key,
    (SELECT COALESCE(MAX(display_sequence),0) FROM public.mstr_cover_section) + ROW_NUMBER() OVER (),
    true,
    NOW(),
    NOW(),
    1,
    1
FROM (
    VALUES
    ('Special Conditions/Clauses', 'SPECIAL_CONDITIONS_CLAUSES'),
    ('Main Exclusions', 'MAIN_EXCLUSIONS'),
    ('Extensions', 'EXTENSIONS'),
    ('Endorsements', 'ENDORSEMENTS')
) AS v(name, key)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.mstr_cover_section mcs
    WHERE mcs.key = v.key
);

-- 5.2 Update section_id in mstr_cover_template for Machinery Breakdown consequential loss
BEGIN;

-- Machinery Breakdown consequential loss - Special Conditions/Clauses
UPDATE public.mstr_cover_template mct
SET section_id = mcs.id
FROM public.mstr_cover_section mcs
WHERE mcs.key = 'SPECIAL_CONDITIONS_CLAUSES'
  AND mct.policy_type_id IN (
    SELECT id
    FROM public.lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_MACHINERY_BREAKDOWN_CONSEQUENTIAL_LOSS'
  )
  AND mct.cover_name IN (
    'Accountants clause',
    'Alternative trading clause',
    'Automatic reinstatement of loss',
    'Additional cost of reinstatement of records',
    'Accumulated stocks',
    'Alternative basis of settlement',
    'Cancellation (30 days) clause',
    'Customers and suppliers extension',
    'Denial of access clause',
    'Departmental clause',
    'Failure of public utilities',
    'Fines and damages',
    'Payment on account',
    'Rebate of premium',
    'Salvage sales clause',
    'Upwards adjustment - 33.3%',
    'Uninsured standing charges',
    'Waiver of material damage proviso'
  );

-- Machinery Breakdown consequential loss - Main Exclusions
UPDATE public.mstr_cover_template mct
SET section_id = mcs.id
FROM public.mstr_cover_section mcs
WHERE mcs.key = 'MAIN_EXCLUSIONS'
  AND mct.policy_type_id IN (
    SELECT id
    FROM public.lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_MACHINERY_BREAKDOWN_CONSEQUENTIAL_LOSS'
  )
  AND mct.cover_name IN (
    'Loss of revenue resulting from damage by',
    'War, invasion and the like',
    'Radioactive contamination',
    'Fire and associated perils',
    'Wear, tear or depreciation',
    'Wilful act or gross negligence',
    'Faults or defects existing at the time of effecting or renewing the policy and known to the insured',
    'Theft or burglary or attempt thereat',
    'Loss of or damage to exchangeable tools',
    'Cost of alterations, additions, improvements or overhauls',
    'Loss or damage for which the supplier, contractor or repairer is responsible'
  );

-- Stock floater - Special Conditions/Clauses
UPDATE public.mstr_cover_template mct
SET section_id = mcs.id
FROM public.mstr_cover_section mcs
WHERE mcs.key = 'SPECIAL_CONDITIONS_CLAUSES'
  AND mct.policy_type_id IN (
    SELECT id
    FROM public.lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_STOCK_FLOATER'
  )
  AND mct.cover_name IN (
    'Automatic reinstatement of loss',
    'Excluding mechanical or electrical breakdown',
    'Excluding radioactive contamination, war, terrorism and kindred risks',
    'Excluding theft by employees',
    'Excluding theft from unattended vehicles',
    'Excluding wear, tear and effects of deterioration',
    'Including goods held in trust',
    'Including riot, strike and civil commotion',
    'Including damage to buildings in course of theft',
    'Including hold-up or threat of assault',
    'Unattended vehicle security or Locked boot clause',
    'Reinstatement of value (other than for stocks)',
    'Stock Declarations clause',
    'Including loading and unloading',
    'Recovery from carriers clause'
  );

-- Plate glass - Extensions
UPDATE public.mstr_cover_template mct
SET section_id = mcs.id
FROM public.mstr_cover_section mcs
WHERE mcs.key = 'EXTENSIONS'
  AND mct.policy_type_id IN (
    SELECT id
    FROM public.lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_PLATE_GLASS'
  )
  AND mct.cover_name IN (
    'Automatic reinstatement of loss',
    'Riot and strike and civil commotion',
    'Extension of cover for temporary boarding',
    'Including Frames and Fittings',
    'Automatic Additions & Deletions Clause',
    'Removal and Replacement of Fixtures & Fittings',
    '30 days cancellation notice'
  );

-- Directors and officers liability - Extensions
UPDATE public.mstr_cover_template mct
SET section_id = mcs.id
FROM public.mstr_cover_section mcs
WHERE mcs.key = 'EXTENSIONS'
  AND mct.policy_type_id IN (
    SELECT id
    FROM public.lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_DIRECTORS_AND_OFFICERS_LIABILITY'
  )
  AND mct.cover_name IN (
    'Extended discovery period – 60 days',
    'Lifetime Run-Off cover for retired insureds',
    'Emergency costs',
    'Investigation costs',
    'Corporate Manslaughter',
    'Extradition Proceedings',
    'Public Relations expenses',
    'Assets & Liberty Costs',
    'Automatic cover for new subsidiaries (up to 25% of gross assets of Insured)',
    'Worldwide excluding USA',
    'Corporate (Entity) Liability cover',
    'Company pollution defence cost',
    'Breach of contract',
    'Company Crisis - Public relations expenses'
  );

-- Directors and officers liability - Endorsements
UPDATE public.mstr_cover_template mct
SET section_id = mcs.id
FROM public.mstr_cover_section mcs
WHERE mcs.key = 'ENDORSEMENTS'
  AND mct.policy_type_id IN (
    SELECT id
    FROM public.lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_DIRECTORS_AND_OFFICERS_LIABILITY'
  )
  AND mct.cover_name IN (
    'Economic Sanctions',
    'Fraudulent or Dishonest Acts exclusion',
    'Known claims or pending litigations exclusion',
    'Bodily injury / Property Damage exclusion (but covers defence costs)'
  );

-- Validate unmapped template rows for the Kenya policy set
SELECT
    ld.lookup_key,
    mct.id,
    mct.ref_cover_id,
    mct.cover_name,
    mct.display_sequence,
    mct.section_id
FROM public.mstr_cover_template mct
JOIN public.lookup_data ld
  ON ld.id = mct.policy_type_id
WHERE ld.lookup_name = 'POLICY_TYPE'
  AND ld.lookup_key IN (
    'POLICY_TYPE_MACHINERY_BREAKDOWN_CONSEQUENTIAL_LOSS',
    'POLICY_TYPE_STOCK_FLOATER',
    'POLICY_TYPE_PLATE_GLASS',
    'POLICY_TYPE_DIRECTORS_AND_OFFICERS_LIABILITY'
  )
  AND mct.section_id IS NULL
ORDER BY ld.lookup_key, mct.display_sequence, mct.id;

COMMIT;

-- 5.3 Update old opportunities for the Kenya policy set
BEGIN;

UPDATE public.opportunity_cover_map ocm
SET section_id = mct.section_id
FROM public.mstr_cover_template mct
WHERE ocm.cover_id = mct.ref_cover_id
  AND ocm.policy_type_id = mct.policy_type_id
  AND ocm.section_id IS NULL
  AND mct.section_id IS NOT NULL
  AND ocm.policy_type_id IN (
      SELECT id
      FROM public.lookup_data
      WHERE lookup_name = 'POLICY_TYPE'
        AND lookup_key IN (
          'POLICY_TYPE_MACHINERY_BREAKDOWN_CONSEQUENTIAL_LOSS',
          'POLICY_TYPE_STOCK_FLOATER',
          'POLICY_TYPE_PLATE_GLASS',
          'POLICY_TYPE_DIRECTORS_AND_OFFICERS_LIABILITY'
        )
  );

SELECT
    ld.lookup_key,
    COUNT(*) AS remaining_null_section_rows
FROM public.opportunity_cover_map ocm
JOIN public.lookup_data ld
  ON ld.id = ocm.policy_type_id
WHERE ld.lookup_name = 'POLICY_TYPE'
  AND ld.lookup_key IN (
    'POLICY_TYPE_MACHINERY_BREAKDOWN_CONSEQUENTIAL_LOSS',
    'POLICY_TYPE_STOCK_FLOATER',
    'POLICY_TYPE_PLATE_GLASS',
    'POLICY_TYPE_DIRECTORS_AND_OFFICERS_LIABILITY'
  )
  AND ocm.section_id IS NULL
GROUP BY ld.lookup_key
ORDER BY ld.lookup_key;

COMMIT;

-- 5.4 Validate old opportunity rows after retrofit for the Kenya policy set
SELECT
    ld.lookup_key,
    ocm.id,
    ocm.opportunity_id,
    ocm.cover_id,
    ocm.cover_name,
    ocm.section_id,
    mcs.name AS section_name
FROM public.opportunity_cover_map ocm
JOIN public.lookup_data ld
  ON ld.id = ocm.policy_type_id
LEFT JOIN public.mstr_cover_section mcs
  ON ocm.section_id = mcs.id
WHERE ld.lookup_name = 'POLICY_TYPE'
  AND ld.lookup_key IN (
    'POLICY_TYPE_MACHINERY_BREAKDOWN_CONSEQUENTIAL_LOSS',
    'POLICY_TYPE_STOCK_FLOATER',
    'POLICY_TYPE_PLATE_GLASS',
    'POLICY_TYPE_DIRECTORS_AND_OFFICERS_LIABILITY'
  )
ORDER BY ld.lookup_key, ocm.opportunity_id, ocm.id;
