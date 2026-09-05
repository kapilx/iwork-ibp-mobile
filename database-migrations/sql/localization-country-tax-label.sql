-- ============================================================
-- Add a country-specific tax label (e.g. "GST" for India, "VAT"
-- for Sri Lanka) so the frontend can stop hardcoding "GST" for
-- every country's contribution/premium breakdown screens.
-- ============================================================
ALTER TABLE localization_country
  ADD COLUMN IF NOT EXISTS tax_label VARCHAR(20);

-- Backfill known countries. Any country left NULL falls back to
-- "GST" in the frontend, matching current behaviour.
UPDATE localization_country SET tax_label = 'GST' WHERE LOWER(name) = 'india';
UPDATE localization_country SET tax_label = 'VAT' WHERE LOWER(name) = 'sri lanka';
