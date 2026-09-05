--update Industrial All Risk covers

BEGIN;

-- 1) Insert missing reusable sections for India IAR
INSERT INTO public.mstr_cover_section
(id, name, key, display_sequence, is_active, created_at, updated_at, created_by, updated_by)
SELECT
  nextval('mstr_cover_section_id_seq'),
  v.name,
  v.key,
  (SELECT COALESCE(MAX(display_sequence), 0) FROM public.mstr_cover_section) + ROW_NUMBER() OVER (),
  TRUE, NOW(), NOW(), 1, 1
FROM (
  VALUES
    ('SUM INSURED PARTICULARS', 'IAR_SUM_INSURED_PARTICULARS'),
    ('Additional Coverages and Clauses', 'IAR_ADDITIONAL_COVERAGES_AND_CLAUSES'),
    ('Additional Coverages and Clauses of Business Interruption', 'IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES')
) AS v(name, key)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.mstr_cover_section mcs
  WHERE mcs.key = v.key
);

-- 2) Map mstr_cover_template.section_id for India IAR covers from the sheet
DO $$
DECLARE
  v_policy_lookup_key TEXT := 'POLICY_TYPE_INDUSTRIAL_ALL_RISK';
  v_policy_type_id INT;
BEGIN
  SELECT id
  INTO v_policy_type_id
  FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE'
    AND lookup_key = v_policy_lookup_key
  LIMIT 1;

  IF v_policy_type_id IS NULL THEN
    RAISE EXCEPTION 'India IAR policy type not found for lookup_key=%', v_policy_lookup_key;
  END IF;

  WITH section_cover_map(section_key, cover_name) AS (
    VALUES
      ('IAR_SUM_INSURED_PARTICULARS', 'SUM INSURED PARTICULARS'),
      ('IAR_SUM_INSURED_PARTICULARS', 'Material Damage other than Machinery Breakdown - Fire & Allied Perils: Sum Insured'),
      ('IAR_SUM_INSURED_PARTICULARS', 'Machinery Breakdown ( MBD) Section: Sum Insured'),
      ('IAR_SUM_INSURED_PARTICULARS', 'Others (Burglary/Electronic Equipments/Boiler Explosion): Sum Insured'),
      ('IAR_SUM_INSURED_PARTICULARS', 'Sum Insured Break-Up of Fire & Allied Perils'),
      ('IAR_SUM_INSURED_PARTICULARS', 'Business Interruption: Fire Loss of Profit - Sum Insured'),
      ('IAR_SUM_INSURED_PARTICULARS', 'Business Interruption: Machinery Loss of Profit - Sum Insured'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'STFI'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Earthquake (Fire and Shock), Volcanic eruption + Tsunami'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Architect Survey & Engineering fees upto 3% of claim amount'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Debris Removal (including foreign debris & dewatering expenses) in excess of 1% of the claim amount'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Impact Damage due to Insured‟s own Rail/Road Vehicles, Fork lifts, Cranes, Stackers and the like and articles dropped therefrom'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Ommission to Insure additions , alterations or extension @ 5%'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Escalation'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Leakage and Overflowing'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'New location cover'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Claim preparation Costs'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Roads Pavements and Street Furniture'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Temporary Removal of Stocks'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Temporary Removal of Property (P&M)'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Expediting Expenses incl Express & Air freight'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Immediate Repair Works'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Damage to Landscaping'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Claims Preparation cost AOA AOY Limit'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Duty/Additional Customs duty'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Fire Extinguishing / Fighting Expenses Clause/Fire Brigade Charges'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Loss minimisation expenses'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Professional Fees  for Technicians, Accountants and Legal Services'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Leak Search & Finding Cost/Exploratory Cost/Trace & Access'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Sprinkler upgrading costs'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Protection & Preservation of Property'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Capital Additions'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Rent for Alternative accomodation IP: 12 Months'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Catalyst and Consumable (Including Lining and Tefractory) Intrest in Process'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Delibrate Damage'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Cover for any unavoidable of Involuntary Improvement / Betterment as per waiver of Imrovement / betterment cost for replacement of specifically identified machinery including cost of adaptation/ Involuntary betterment clause/Technological Advancements Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'OEM Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Hire Purchage or Lease Agreements/ Property under Consignment, Care, custody and Control'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Inadvertent/unintentional & Error & Ommision'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Cost of Re writing records clause / Plans, Valuable Paper Documents & Computer Systems Records/Data, Programs Or Software'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Property Not on the Insured Premises/ Offiste Premises'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Spontaneous Combustion with and without fire'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'De-Contamination and cost of clean up Expense'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Cleaning up and other Costs Clause / Dewatering System'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Temporary Repairs Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Duty Liability'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Startup / Shutdown Expenses'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Burglary & House Breaking, Theft & Larcenry'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Waiver of Under Insurance (Upto 15%)'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Intentional Damage'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Property outside/away from the premises'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Non Invalidation'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Territorial Limits'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Vehilce Load Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Acquired Companies Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Crane Charges'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Additional Insured Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Additional Testing & Certification Charges'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'New undeclared Location Coverge / Property not on the insured premises/offsite premises'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Aggravation Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Brands and Trademarks clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Mobile Plant & Equipment'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Tenant clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Loss Payee Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Non-Vitiation Clause / Multiple Insured Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Obsolete parts/equipement/machinery Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Employee personal effects Clause / Property of employees and visitors'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Work of Art'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Omission to insure additions, alterations or extensions / Inadvertent Omission'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Coverage for Leased Building and Equipments'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Appraisement Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Keys and Locks'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Testing and Commissioning Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Automatic Hold Cover (Properties In New Locations) cover upto 30 days / Unspecified Locations'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Dissimilar Property'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Expiration'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Delay in Repair'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Pair & set clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Free Automatic Reinstatement of Sum Insured Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Cover against  deterioration of stocks due to power  failure following damage to premises of Public  Power  Station and  Terminal ends of  electric service feeders'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'All SFSP Perils'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Green clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Forest fire'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Subterranean Fire'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Spontaneous Combustion'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Abandonment of Property'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Destruction of Salvage'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Inadvertent Property Missions'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Errors and Omissions'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Contamination and comingling of stocks'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Molten Material Spillage Cover (Material Damage)'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Deliberate Damage/:Undamaged Parts Clause/Destruction of Sound Property'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Disposal of Salvage'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Waiver of contribution clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Cover for Loss or Damage due to Strike, riot ad Civil Commotion (SRCC)'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Payment of on-account clause upto 75% of admissible claim amount'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Exclusion of Loss of Stabilising Fluid'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Destruction of Insured Property'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Coverage for Basement risk'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Free Issue Materials'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Obsolete equipment Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Cutting Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Novation clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Primary Insurance Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Coinsurance Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Bankruptcy And Insolvency'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Extended Expiration'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Unoccupancy Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Primary & Non Contributory cover clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Designation Of Property Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Local Authority Clause/Public Authorities / Civil Authority Clause/Municipal authority clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Goods Held in Trust Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', '72 Hours Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Reinstatement Value Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Market Value Clause (For Stock)'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Agreed Bank Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Undamaged Foundation'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Contracts Work/ Capital Work in Progress / Minor Works / Property in course of construction or Erection'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Unpacking Expense Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Sue and Labour Cost'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Controlled of Damaged Property & Goods'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Assets held in trust Clause / at Job Worker / at Third Party Premises'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Contract price'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Accidental discharge of gas'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Undamaged stock and loss on resale'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Goods and stock going through fire & heating process'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Waiver of Subrogation'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'No Control Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Deferred payments'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Vehicle Load Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Master Key Coverage'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Land And Water Contaminant Cleanup, Removal And Disposal'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Leakage of fire fighting equipment clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Margin clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Accidental Damage'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Leakage & Contamination Cover'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Control Of Damaged Goods Clause'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Spoilage Cover of Stocks'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Spoilage Cover of Plant & Machinery'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Catalyst And Consumables (including lining and refractory) interest in process'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Smoke Damage'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Outbuilding Cover'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Insured Property Stored At Other Locations'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Cost Of Clearing Drains'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Dewatering expenses'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Cover For Lubricating Oil, Oil In Transformers,Machine Foundations And Refrigerant'),
      ('IAR_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Nominated loss adjuster''s clause'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Failure of Public utilities (electricity, water & gas) - 17% of BI (FLEXA & AOG)'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Denial of Access /Prevention of Acess (4 week IP/5 kms Radious - Domestic)'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Interdependency Clause'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Additional Increased Cost of Working'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Auditor & Solicitors Fees'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Premises of Named customers & suppliers for a maximum limit of 10% of the limit of indemnity (Business Interruption Sum Insured/ Loss Limit). Coverage to be restricted to FLEXA perils for Overseas customer/suppliers, whereas coverage to be restricted to FLEXA and AOG perils for Domestic customer/suppliers.'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Premises of Un-named customers & suppliers located in India, for a maximum limit of 10% of the limit of indemnity (Business Interruption Sum Insured/ Loss Limit) and coverage restricted to FLEXA perils only, no cover for unnamed suppliers/customers located overseas.'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'All standing charges'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Spoilage Risk Consequential Loss Cover'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Departmental Clause'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Specification Basis - Alternative Basis clause'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Accumulation stocks clause'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'New Business Clause'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Indemnity Period'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Return of premium clause'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Accountant''s clause'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Other terms & conditions'),
      ('IAR_BI_ADDITIONAL_COVERAGES_AND_CLAUSES', 'Deductibles / Excess')
  ),
  resolved AS (
    SELECT
      mct.id AS template_id,
      mcs.id AS section_id
    FROM public.mstr_cover_template mct
    JOIN section_cover_map scm
      ON LOWER(
           BTRIM(
             REGEXP_REPLACE(
               REPLACE(mct.cover_name, CHR(160), ' '),
               '\s+',
               ' ',
               'g'
             )
           )
         ) = LOWER(
           BTRIM(
             REGEXP_REPLACE(
               REPLACE(scm.cover_name, CHR(160), ' '),
               '\s+',
               ' ',
               'g'
             )
           )
         )
    JOIN public.mstr_cover_section mcs
      ON mcs.key = scm.section_key
    WHERE mct.policy_type_id = v_policy_type_id
  )
  UPDATE public.mstr_cover_template mct
  SET section_id = r.section_id,
      updated_at = NOW()
  FROM resolved r
  WHERE mct.id = r.template_id
    AND mct.section_id IS DISTINCT FROM r.section_id;

  -- 3) Retrofit old rows using shared helper functions when available
  IF to_regprocedure('public.fn_backfill_opportunity_cover_map_section_id(integer)') IS NOT NULL THEN
    PERFORM public.fn_backfill_opportunity_cover_map_section_id(v_policy_type_id);
  ELSE
    UPDATE public.opportunity_cover_map ocm
    SET section_id = mct.section_id,
        updated_at = NOW()
    FROM public.mstr_cover_template mct
    WHERE ocm.policy_type_id = v_policy_type_id
      AND mct.policy_type_id = v_policy_type_id
      AND ocm.cover_id = mct.ref_cover_id
      AND COALESCE(ocm.display_sequence, -1) = COALESCE(mct.display_sequence, -1)
      AND mct.section_id IS NOT NULL
      AND ocm.section_id IS DISTINCT FROM mct.section_id;
  END IF;

  IF to_regprocedure('public.fn_backfill_policy_cover_map_section_id(integer)') IS NOT NULL THEN
    PERFORM public.fn_backfill_policy_cover_map_section_id(v_policy_type_id);
  ELSE
    UPDATE public.policy_cover_map pcm
    SET section_id = mct.section_id,
        updated_at = NOW()
    FROM public.policy p,
         public.mstr_cover_template mct
    WHERE p.id = pcm.policy_id
      AND p.policy_type_lid = v_policy_type_id
      AND mct.policy_type_id = p.policy_type_lid
      AND (mct.id = pcm.cover_template_id OR mct.ref_cover_id = pcm.cover_template_id)
      AND mct.section_id IS NOT NULL
      AND pcm.section_id IS DISTINCT FROM mct.section_id;
  END IF;
END $$;

-- 4) Validations
SELECT
  COUNT(*) AS template_rows_with_section
FROM public.mstr_cover_template mct
WHERE mct.policy_type_id = (
  SELECT id FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE' AND lookup_key = 'POLICY_TYPE_INDUSTRIAL_ALL_RISK' LIMIT 1
)
  AND mct.section_id IS NOT NULL;

SELECT
  COUNT(*) AS opportunity_rows_without_section
FROM public.opportunity_cover_map ocm
WHERE ocm.policy_type_id = (
  SELECT id FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE' AND lookup_key = 'POLICY_TYPE_INDUSTRIAL_ALL_RISK' LIMIT 1
)
  AND ocm.section_id IS NULL;

SELECT
  COUNT(*) AS policy_rows_without_section
FROM public.policy_cover_map pcm
JOIN public.policy p ON p.id = pcm.policy_id
WHERE p.policy_type_lid = (
  SELECT id FROM public.lookup_data
  WHERE lookup_name = 'POLICY_TYPE' AND lookup_key = 'POLICY_TYPE_INDUSTRIAL_ALL_RISK' LIMIT 1
)
  AND pcm.section_id IS NULL;

COMMIT;
