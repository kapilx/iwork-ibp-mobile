-- Add 5 new columns to the Details-Policy Based sheet of the biz done report.
-- Safe to re-run: skips rows that already exist.

-- Step 1: Sync the sequence to the current max id so auto-increment does not collide.
SELECT setval(
    pg_get_serial_sequence('public.localization_report_fields', 'id'),
    COALESCE((SELECT MAX(id) FROM public.localization_report_fields), 0)
);

-- Step 2: Insert field definitions, skipping any field_key that already exists.
INSERT INTO public.localization_report_fields (field_key, data_type, required, active, entity_type, meta_data, description)
SELECT v.field_key, v.data_type, v.required, v.active, v.entity_type, v.meta_data::jsonb, v.description
FROM (VALUES
    ('parentCompanyName',           'string', false, true, 'COMPANY',  NULL, 'Parent company name from group_company_map'),
    ('leadCrm',                     'string', false, true, 'COMPANY',  NULL, 'Lead CRM user full name'),
    ('accountManager',              'string', false, true, 'COMPANY',  NULL, 'Account manager user full name'),
    ('policyOwnerReportingManager', 'string', false, true, 'EMPLOYEE', NULL, 'Reporting manager of the policy owner'),
    ('iworkUniqueId',               'string', false, true, 'POLICY',   NULL, 'Iwork unique ID from policy/endorsement table')
) AS v(field_key, data_type, required, active, entity_type, meta_data, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public.localization_report_fields lrf
    WHERE lrf.field_key = v.field_key
);

-- Step 3: Insert country map rows for country_id = 1 (India),
-- skipping any combination of country_id + activity_section + field_label that already exists.
INSERT INTO public.localization_report_fields_country_map (
    country_id,
    regulatory_key_id,
    report_section,
    activity_section,
    display_order,
    field_label,
    field_alias,
    field_value,
    status,
    meta_data
)
SELECT
    1,
    lrf.id,
    'bizdone',
    'policyDetails',
    v.display_order,
    v.field_label,
    v.field_label,
    v.field_label,
    'active',
    NULL
FROM (VALUES
    (46, 'parentCompanyName'),
    (47, 'leadCrm'),
    (48, 'accountManager'),
    (49, 'policyOwnerReportingManager'),
    (50, 'iworkUniqueId')
) AS v(display_order, field_label)
JOIN public.localization_report_fields lrf ON lrf.field_key = v.field_label
WHERE NOT EXISTS (
    SELECT 1 FROM public.localization_report_fields_country_map m
    WHERE m.country_id = 1
      AND m.activity_section = 'policyDetails'
      AND m.field_label = v.field_label
);
