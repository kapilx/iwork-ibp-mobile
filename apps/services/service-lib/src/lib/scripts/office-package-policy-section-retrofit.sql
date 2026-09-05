-- Office Package Policy cover-section migration
-- Pattern: same as PACKAGE_POLICY mapping approach
-- Policy key: POLICY_TYPE_OFFICE_PACKAGE_POLICY (organisation_id = 1)

-- =========================================================
-- 0) Ensure section master rows exist
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
-- 1) Map section_id in mstr_cover_template
-- =========================================================

BEGIN;

-- 1.0 Reset OFFICE_PACKAGE_POLICY mappings before deterministic assignment
UPDATE public.mstr_cover_template
SET section_id = NULL,
    updated_at = NOW()
WHERE policy_type_id = (
  SELECT id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
);

-- 1.1 Deterministic mapping across all sections
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
    FROM public.lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
      AND organisation_id = 1
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

-- 1.2 Case-sensitive waiver override (same as package script)
WITH office_policy AS (
  SELECT id AS policy_type_id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
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
FROM office_policy op, ee_section ee
WHERE mct.policy_type_id = op.policy_type_id
  AND mct.cover_name = 'Waiver of under insurance';

WITH office_policy AS (
  SELECT id AS policy_type_id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
)
UPDATE public.mstr_cover_template mct
SET section_id = NULL,
    updated_at = NOW()
FROM office_policy op
WHERE mct.policy_type_id = op.policy_type_id
  AND mct.cover_name = 'Waiver of Under Insurance';

-- 1.3 Fallback: copy section_id from PACKAGE_POLICY by ref_cover_id + display_sequence
-- This keeps script resilient if office cover names diverge from the mapping list.
WITH ids AS (
  SELECT
    (SELECT id
     FROM public.lookup_data
     WHERE lookup_name = 'POLICY_TYPE'
       AND lookup_key = 'POLICY_TYPE_PACKAGE_POLICY'
     LIMIT 1) AS package_policy_id,
    (SELECT id
     FROM public.lookup_data
     WHERE lookup_name = 'POLICY_TYPE'
       AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
       AND organisation_id = 1
     LIMIT 1) AS office_policy_id
),
pkg AS (
  SELECT
    ref_cover_id,
    COALESCE(display_sequence, -1) AS ds,
    section_id
  FROM public.mstr_cover_template
  WHERE policy_type_id = (SELECT package_policy_id FROM ids)
    AND section_id IS NOT NULL
)
UPDATE public.mstr_cover_template o
SET section_id = p.section_id,
    updated_at = NOW()
FROM pkg p, ids i
WHERE o.policy_type_id = i.office_policy_id
  AND o.ref_cover_id = p.ref_cover_id
  AND COALESCE(o.display_sequence, -1) = p.ds
  AND o.section_id IS NULL;

COMMIT;

-- =========================================================
-- 2) Retrofit old OFFICE_PACKAGE_POLICY rows
-- =========================================================

BEGIN;

-- 2.1 Insert missing opportunity cover rows
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
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
)
AND ocm.id IS NULL;

-- 2.2 Sync opportunity_cover_map.section_id from template
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
    FROM public.lookup_data
    WHERE lookup_name = 'POLICY_TYPE'
      AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
      AND organisation_id = 1
    LIMIT 1
  );

-- 2.3 Sync policy_cover_map.section_id
WITH office_policy AS (
  SELECT id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
),
resolved AS (
  SELECT
    pcm.id AS pcm_id,
    COALESCE(ocm.section_id, mct_id.section_id, mct_ref.section_id) AS resolved_section_id
  FROM public.policy_cover_map pcm
  JOIN public.policy p
    ON p.id = pcm.policy_id
  JOIN office_policy op
    ON op.id = p.policy_type_lid
  LEFT JOIN public.opportunity_cover_map ocm
    ON ocm.id = pcm.cover_template_id
   AND ocm.policy_type_id = p.policy_type_lid
  LEFT JOIN public.mstr_cover_template mct_id
    ON mct_id.id = pcm.cover_template_id
   AND mct_id.policy_type_id = p.policy_type_lid
  LEFT JOIN public.mstr_cover_template mct_ref
    ON mct_ref.ref_cover_id = pcm.cover_template_id
   AND mct_ref.policy_type_id = p.policy_type_lid
)
UPDATE public.policy_cover_map pcm
SET section_id = r.resolved_section_id,
    updated_at = NOW()
FROM resolved r
WHERE pcm.id = r.pcm_id
  AND pcm.section_id IS DISTINCT FROM r.resolved_section_id;

COMMIT;

-- =========================================================
-- 3) Validation / inspection queries
-- =========================================================

-- 3.1 Office policy lookup row
SELECT *
FROM public.lookup_data
WHERE lookup_name = 'POLICY_TYPE'
  AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
  AND organisation_id = 1;

-- 3.2 Template-level section coverage
SELECT
  COUNT(*) AS total_templates,
  COUNT(*) FILTER (WHERE section_id IS NOT NULL) AS with_section,
  COUNT(*) FILTER (WHERE section_id IS NULL) AS without_section
FROM public.mstr_cover_template
WHERE policy_type_id = (
  SELECT id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
);

-- 3.3 Unmapped template rows (if any)
SELECT id, ref_cover_id, cover_name, display_sequence, section_id
FROM public.mstr_cover_template
WHERE policy_type_id = (
  SELECT id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
)
AND section_id IS NULL
ORDER BY COALESCE(display_sequence, 999999), id;

-- 3.4 Opportunity cover map section coverage
SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE section_id IS NOT NULL) AS with_section,
  COUNT(*) FILTER (WHERE section_id IS NULL) AS without_section
FROM public.opportunity_cover_map
WHERE policy_type_id = (
  SELECT id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
);

-- 3.5 Policy cover map section coverage for office policies
SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE pcm.section_id IS NOT NULL) AS with_section,
  COUNT(*) FILTER (WHERE pcm.section_id IS NULL) AS without_section
FROM public.policy_cover_map pcm
JOIN public.policy p
  ON p.id = pcm.policy_id
WHERE p.policy_type_lid = (
  SELECT id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
);

-- 3.6 Quick sample to inspect mapped section names
SELECT
  mct.id,
  mct.cover_name,
  mct.display_sequence,
  mct.section_id,
  mcs.name AS section_name,
  mcs.key AS section_key
FROM public.mstr_cover_template mct
LEFT JOIN public.mstr_cover_section mcs
  ON mcs.id = mct.section_id
WHERE mct.policy_type_id = (
  SELECT id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = 'POLICY_TYPE_OFFICE_PACKAGE_POLICY'
    AND organisation_id = 1
  LIMIT 1
)
ORDER BY COALESCE(mct.display_sequence, 999999), mct.id;
