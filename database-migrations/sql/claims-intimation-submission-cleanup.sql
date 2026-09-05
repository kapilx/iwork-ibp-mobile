-- ============================================================
-- Cleanup — deletes everything claims-intimation-submission-setup.sql's Sections
-- 5/6/8/9 create (TPA app-refs for FHPL/Health India/ISBS, their feature-config
-- bindings, response mappings, payload field mappings, feature type, INTIMATED
-- status), so you can re-run that script fresh and confirm it works from a clean
-- slate. Safe to run any number of times (every DELETE is a no-op if already gone).
--
-- Single consolidated delete companion — replaces the now-deleted one-off
-- fhpl-healthindia-claim-delete-for-ui-retest.sql / isbs-claim-delete-for-ui-retest.sql
-- (those covered the same TPAs individually for one round of manual UI re-testing;
-- this file does the same thing for all three together, and is meant to stay).
--
-- Does NOT drop schema (columns/constraints added by Sections 1/3/4/7) — those are
-- additive (IF NOT EXISTS) and re-running the setup script again is always safe without
-- tearing them down first. Only data this cleanup removes.
-- ============================================================

BEGIN;

-- Payload field mappings tied to these feature configs (also ON DELETE CASCADE from
-- the feature-config delete below, but explicit here for a clear before/after count).
DELETE FROM public.tpa_payload_field_mapping
WHERE feature_config_id IN (
  SELECT tefc.id FROM public.tpa_external_feature_config tefc
  JOIN public.mstr_ext_application_ref ear ON ear.id = tefc.app_ref_id
  WHERE ear.label IN (
    'fhpl-claim-intimate', 'fhpl-claim-submit',
    'healthindia-claim-intimate', 'healthindia-claim-submit', 'healthindia-claim-submit-doc',
    'isbs-claim-intimate', 'isbs-claim-submit'
  )
);

-- Feature-config bindings next (FK is ON DELETE RESTRICT against mstr_ext_application_ref).
DELETE FROM public.tpa_external_feature_config
WHERE app_ref_id IN (
  SELECT id FROM public.mstr_ext_application_ref WHERE label IN (
    'fhpl-claim-intimate', 'fhpl-claim-submit',
    'healthindia-claim-intimate', 'healthindia-claim-submit', 'healthindia-claim-submit-doc',
    'isbs-claim-intimate', 'isbs-claim-submit'
  )
);

-- App-refs — deleting these cascades (ON DELETE CASCADE) to also remove any
-- mstr_ext_app_response_mapping rows tied to them (Sections 8/9's TPA_CLAIM_REF mappings).
DELETE FROM public.mstr_ext_application_ref WHERE label IN (
  'fhpl-claim-intimate', 'fhpl-claim-submit',
  'healthindia-claim-intimate', 'healthindia-claim-submit', 'healthindia-claim-submit-doc',
  'isbs-claim-intimate', 'isbs-claim-submit'
);

-- NOT deleting policy_claim_status 'INTIMATED' here — real test claims (e.g. 78697,
-- 78698) already reference it via policy_claim_audit, so it can't be removed without
-- also deleting that audit history. Harmless to leave: the setup script's ON CONFLICT
-- DO NOTHING handles it fine on re-run regardless.

DELETE FROM public.mstr_tpa_feature_type WHERE key = 'CLAIM_SUBMISSION';

COMMIT;
