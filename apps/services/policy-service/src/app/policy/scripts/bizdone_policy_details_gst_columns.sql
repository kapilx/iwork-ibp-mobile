-- Add "Gst Percentage" and "Gst" columns to the Details-Policy Based sheet of the
-- biz done report, positioned immediately to the LEFT of the existing "Service Tax" column.
--
-- Applies to every country that already has a "Service Tax" row for policyDetails.
-- Safe to re-run: master field defs, the order shift, and the country-map rows are all guarded.
--
-- Backing SQL aliases (see service-lib policy-report.ts streamPolicyReport, policyDetails case):
--   field_value 'gstPercentageValue' -> policy.gst_percentage / endorsement.gst_percentage
--   field_value 'gstValue'           -> policy.gst (endorsements have no gst column -> NULL)

-- Run as one atomic unit so a failure in any step cannot leave a half-applied
-- (e.g. shifted-but-not-inserted) state.
BEGIN;

-- Step 1: Sync the sequence to the current max id so auto-increment does not collide.
SELECT setval(
    pg_get_serial_sequence('public.localization_report_fields', 'id'),
    COALESCE((SELECT MAX(id) FROM public.localization_report_fields), 0)
);

-- Step 2: Insert master field definitions, skipping any field_key that already exists.
INSERT INTO public.localization_report_fields (field_key, data_type, required, active, entity_type, meta_data, description)
SELECT v.field_key, v.data_type, v.required, v.active, v.entity_type, v.meta_data::jsonb, v.description
FROM (VALUES
    ('gstPercentageValue', 'number', false, true, 'POLICY', NULL, 'GST percentage (policy.gst_percentage) for biz done policy details'),
    ('gstValue',           'number', false, true, 'POLICY', NULL, 'GST value (policy.gst) for biz done policy details')
) AS v(field_key, data_type, required, active, entity_type, meta_data, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public.localization_report_fields lrf
    WHERE lrf.field_key = v.field_key
);

-- Step 3: For every country that has a "Service Tax" policyDetails row and does NOT yet have
-- the new columns, shift that row (and everything to its right) two positions to make room.
UPDATE public.localization_report_fields_country_map m
SET display_order = m.display_order + 2
WHERE m.report_section = 'bizdone'
  AND m.activity_section = 'policyDetails'
  AND m.display_order >= (
      SELECT a.display_order
      FROM public.localization_report_fields_country_map a
      WHERE a.report_section = 'bizdone'
        AND a.activity_section = 'policyDetails'
        AND a.country_id = m.country_id
        AND regexp_replace(a.field_label, '[^a-zA-Z]', '', 'g') ILIKE 'servicetax'
      ORDER BY a.display_order ASC
      LIMIT 1
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.localization_report_fields_country_map e
      WHERE e.report_section = 'bizdone'
        AND e.activity_section = 'policyDetails'
        AND e.country_id = m.country_id
        AND e.field_value = 'gstPercentageValue'
  );

-- Step 4: Insert the two new country-map rows into the gap just opened to the left of
-- "Service Tax". After the shift, "Service Tax" sits at (its order), so:
--   "Gst Percentage" -> service_tax_order - 2
--   "Gst"            -> service_tax_order - 1
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
    svc.country_id,
    lrf.id,
    'bizdone',
    'policyDetails',
    svc.display_order - ncol.pos_offset,
    ncol.field_label,
    ncol.field_value,
    ncol.field_value,
    'active',
    NULL
FROM (
    SELECT country_id, MIN(display_order) AS display_order
    FROM public.localization_report_fields_country_map
    WHERE report_section = 'bizdone'
      AND activity_section = 'policyDetails'
      AND regexp_replace(field_label, '[^a-zA-Z]', '', 'g') ILIKE 'servicetax'
    GROUP BY country_id
) svc
-- field_label is stored camelCase; the excel renders it via formatHeader
-- ('gstPercentage' -> "Gst Percentage", 'gst' -> "Gst").
CROSS JOIN (VALUES
    ('gstPercentage', 'gstPercentageValue', 2),
    ('gst',           'gstValue',           1)
) AS ncol(field_label, field_value, pos_offset)
JOIN public.localization_report_fields lrf ON lrf.field_key = ncol.field_value
WHERE NOT EXISTS (
    SELECT 1 FROM public.localization_report_fields_country_map m
    WHERE m.report_section = 'bizdone'
      AND m.activity_section = 'policyDetails'
      AND m.country_id = svc.country_id
      AND m.field_value = ncol.field_value
);

COMMIT;
