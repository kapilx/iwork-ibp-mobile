-- E-card configs where the family and individual card come from two separate APIs
-- (e.g. Health India) need a way to link the family config to its individual counterpart.
-- Set on the FAMILY config, pointing at the INDIVIDUAL config's id.
-- NULL for TPAs where one API serves both via a param (Good Health) or only a family
-- card exists (FHPL) -- those need no link.
ALTER TABLE mstr_ext_application_ref
ADD COLUMN IF NOT EXISTS individual_ecard_app_ref_id INTEGER NULL REFERENCES mstr_ext_application_ref(id);

COMMENT ON COLUMN mstr_ext_application_ref.individual_ecard_app_ref_id IS
  'For e-card configs where the family and individual card come from two separate APIs (e.g. Health India) -- points from the family config to the individual config. NULL for TPAs where one API serves both (Good Health, param-driven) or only a family card exists (FHPL).';

-- For e-card TPAs whose single API returns ALL covered members in one array response
-- (e.g. Vidal Health -- {"data":[{relationship,ecardUrl},...]}) instead of one card per call.
-- ecard_array_response_key: dot-notation path to that array within the raw response, e.g. "data".
-- ecard_relation_match_field: field name within each array element holding that member's relation,
--   e.g. "relationship" -- matched case-insensitively against the requested member's relation to
--   pick the right element before applying the usual STANDARD_KEY mapping.
-- Both NULL for TPAs returning one card per call (Good Health, FHPL, Health India).
ALTER TABLE mstr_ext_application_ref
ADD COLUMN IF NOT EXISTS ecard_array_response_key VARCHAR(200) NULL,
ADD COLUMN IF NOT EXISTS ecard_relation_match_field VARCHAR(200) NULL;

-- Explicit e-card architecture selector, so iWork only shows the config fields relevant to
-- whichever pattern a TPA actually uses, instead of always showing every optional e-card field.
-- FAMILY_ONLY        -- one API, always returns the family card (e.g. FHPL)
-- PARAM_DRIVEN        -- one API, the tpaId param picks family vs individual (e.g. Good Health)
-- ARRAY_ALL_MEMBERS   -- one API, one call, returns every covered member's card at once (e.g. Vidal Health)
-- SEPARATE_APIS       -- two distinct API endpoints, one per family/individual (e.g. Health India)
ALTER TABLE mstr_ext_application_ref
ADD COLUMN IF NOT EXISTS ecard_response_mode VARCHAR(30) NULL;
