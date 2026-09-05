-- Add dateOfBusiness column to the Details-Policy Based sheet of the BizDone report.
-- Placed after businessMonth (display_order 16); shifts dateOfIncome and everything after by 1.
-- Safe to re-run: skips rows that already exist.

BEGIN;

-- Step 1: Sync the sequence to avoid auto-increment collisions.
SELECT setval(
    pg_get_serial_sequence('public.localization_report_fields', 'id'),
    COALESCE((SELECT MAX(id) FROM public.localization_report_fields), 0)
);

-- Step 2: Insert master field definition for dateOfBusiness (skip if already exists).
INSERT INTO public.localization_report_fields (field_key, data_type, required, active, entity_type, meta_data, description)
SELECT v.field_key, v.data_type, v.required, v.active, v.entity_type, v.meta_data::jsonb, v.description
FROM (VALUES
    ('dateOfBusiness', 'string', false, true, 'POLICY', NULL, 'Date of business (policy.date_of_business / endorsement.date_of_business)')
) AS v(field_key, data_type, required, active, entity_type, meta_data, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public.localization_report_fields lrf
    WHERE lrf.field_key = v.field_key
);

-- Step 3: Insert country-map row for India (country_id = 1), skip if already exists.
INSERT INTO public.localization_report_fields_country_map (
    country_id, regulatory_key_id, report_section, activity_section,
    display_order, field_label, field_alias, field_value, status, meta_data
)
SELECT
    1, lrf.id, 'bizdone', 'policyDetails',
    17, 'dateOfBusiness', 'dateOfBusiness', 'dateOfBusiness', 'active', NULL
FROM public.localization_report_fields lrf
WHERE lrf.field_key = 'dateOfBusiness'
AND NOT EXISTS (
    SELECT 1 FROM public.localization_report_fields_country_map m
    WHERE m.report_section = 'bizdone'
      AND m.activity_section = 'policyDetails'
      AND m.country_id = 1
      AND m.field_value = 'dateOfBusiness'
);

-- Step 4: Shift display_order for all columns currently at order 17 or above
-- to make room for dateOfBusiness at order 17.
UPDATE public.localization_report_fields_country_map
SET display_order = display_order + 1
WHERE report_section = 'bizdone'
  AND activity_section = 'policyDetails'
  AND country_id = 1
  AND display_order >= 17
  AND field_value != 'dateOfBusiness';

COMMIT;
