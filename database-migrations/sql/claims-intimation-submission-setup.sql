-- ============================================================
-- Claims Intimation & Submission — full production setup, run top to bottom.
-- Consolidates (now deleted): claims-two-step-flow-type.sql,
-- claim-submission-feature-type.sql, claim-single-step-generic-path.sql,
-- policy-claim-benefit-type.sql, fhpl-and-healthindia-real-configs.sql.
-- Section 9 (ISBS/GHPL) folds in isbs-claim-multi-step.sql, which is now
-- superseded by this file — kept on disk for dev-testing history only.
--
-- Prerequisite (must already be applied — not created by this file):
-- tpa-integration-combined-migration.sql — creates mstr_ext_application_ref,
-- tpa_external_feature_config, tpa_payload_field_mapping, and
-- mstr_ext_app_response_mapping themselves. This file only adds claims-specific
-- columns/rows on top of those tables.
--
-- All sections are safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING, or
-- DELETE-then-INSERT for the FHPL/Health India/ISBS rows, which have no natural
-- unique constraint to ON CONFLICT against).
--
-- All three TPAs' payloads (Sections 5 + 9) are now cross-checked field-by-field
-- against real, working Postman examples for every call (token/intimate/submit) —
-- including confirming that Health India's and ISBS's date fields must stay as our
-- native raw full-ISO-datetime string (no date: transform), while FHPL's must be
-- reformatted to bare YYYY-MM-DD — these are genuinely different per-TPA requirements,
-- not something to standardize across TPAs. FHPL's HospitalID/Type_of_Claim needing
-- bare JSON numbers (not quoted strings) is also now confirmed, including for
-- Type_of_Claim which needed a new chained map:...|number transform (payload-template
-- .util.ts) since it's both TPA-code-mapped AND must be a bare number.
--
-- Still genuinely unresolved (nothing here is guessed silently):
--   1. Health India's basic_auth_user/basic_auth_password (Section 5) are
--      hardcoded literal values — no AWS Secrets Manager entry exists yet.
--      Move to {{secret:env:HEALTHINDIA_SECRET:username/password}} once a real
--      secret is provisioned, before this reaches a shared/prod environment.
--   2. FHPL's step1_response_token_key is still a guess ("access_token") — the
--      /token call's real response body wasn't available to confirm this field
--      name, only the resulting Bearer token used downstream. Health India's is
--      confirmed: result.0.access_token.
--   3. FHPL submit's IssueID/Slno are hardcoded to the values in the real example
--      (1/1) — confirm these are always constant.
--   3b. FHPL's documentCategory still sends our own internal document type value
--      ({{documentType}}) — the one real example shows "IRR" for this field,
--      meaning FHPL wants ITS OWN category code, not ours. We don't have FHPL's
--      code list, so this is a known-likely-wrong value shipping as-is until we do.
--   4. hospitalCode: mstr_hospital.code is seed/placeholder data (HSP001...),
--      and mstr_hospital.external_hospital_id belongs to a different TPA's ID
--      scheme — neither holds real Health India hospital codes yet. A real
--      hospital-list import (from Health India's Postman collection, ~3,015
--      hospitals) is a separate follow-up task.
--   5. ISBS's clmNatureOfLossCode ("Illness") and clmTypeOfAdmission ("Emergency")
--      are still hardcoded constants from the one real example — unconfirmed
--      whether they're ever meant to vary per claim.
--
-- Sections 7-8 (added later) establish two reusable, admin-configurable patterns
-- for onboarding FUTURE TPAs without new code:
--   - Response mapping (Section 8): which raw response field is this TPA's claim
--     reference? Configure it via mstr_ext_app_response_mapping (iWork's Response
--     Mappings UI already supports this) instead of hardcoding a new field-name
--     guess in extractTpaClaimRef() every time.
--   - Payload fields (tpa_payload_field_mapping, pre-existing, not added by this
--     file): for each payload placeholder, is the value already in our DB (map it
--     to a policy/employee table+column, iWork's Default Field Mappings UI) or
--     does the claimant need to enter it (sourceType = USER_INPUT)? USER_INPUT
--     fields are now fetched by the claims form via GET /claims/extra-fields/
--     :policyId?apiType=INTIMATE_CLAIM|SUBMIT_CLAIM and rendered dynamically.
-- ============================================================


-- ── Section 1: two-step (intimate + submit) flow support ─────────────────
-- claim_form_type (SINGLE|MULTI) + submit_execution_mode (SINGLE_CALL|PER_DOCUMENT)
-- on tpa_external_feature_config, plus the INTIMATED claim status.
BEGIN;

ALTER TABLE public.tpa_external_feature_config
  ADD COLUMN IF NOT EXISTS claim_form_type VARCHAR(10),
  ADD COLUMN IF NOT EXISTS submit_execution_mode VARCHAR(20);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_tpa_ext_feat_cfg_claim_form_type'
  ) THEN
    ALTER TABLE public.tpa_external_feature_config
      ADD CONSTRAINT chk_tpa_ext_feat_cfg_claim_form_type
      CHECK (claim_form_type IS NULL OR claim_form_type IN ('SINGLE', 'MULTI'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_tpa_ext_feat_cfg_submit_exec_mode'
  ) THEN
    ALTER TABLE public.tpa_external_feature_config
      ADD CONSTRAINT chk_tpa_ext_feat_cfg_submit_exec_mode
      CHECK (submit_execution_mode IS NULL OR submit_execution_mode IN ('SINGLE_CALL', 'PER_DOCUMENT'));
  END IF;
END $$;

COMMENT ON COLUMN public.tpa_external_feature_config.claim_form_type IS
  'On the INTIMATE_CLAIM row for a TPA: SINGLE = one combined call (legacy behaviour), MULTI = separate intimate + submit calls (FHPL, Health India, ISBS — all three as of Section 9). NULL is treated as SINGLE.';
COMMENT ON COLUMN public.tpa_external_feature_config.submit_execution_mode IS
  'On the SUBMIT_CLAIM row for a MULTI TPA: SINGLE_CALL = one request carrying all fields + documents together (batched via a $forEach payload template); PER_DOCUMENT = one request per document, looped. FHPL/Health India/ISBS all use PER_DOCUMENT as of Section 5/9 for consistency (FHPL originally used SINGLE_CALL — see Section 5''s comment).';

-- Sits between claim creation and final TPA submission for MULTI-flow TPAs only.
-- SINGLE-flow TPAs (ISBS) go straight to PENDING as before — unaffected.
INSERT INTO public.policy_claim_status (status, iirm_status, created_by, updated_by)
VALUES ('INTIMATED', 'Intimated', 0, 0)
ON CONFLICT (status) DO NOTHING;

COMMIT;


-- ── Section 2: "Claim Submission" feature type ────────────────────────────
-- Dedicated top-level option in the Feature Type picker (alongside E-card,
-- Claims, Hospital Network, TPA Portal Login) for the push-side claim flow.
BEGIN;

INSERT INTO public.mstr_tpa_feature_type (key, label, description, icon, display_order)
VALUES
  ('CLAIM_SUBMISSION', 'Claim Submission', 'Intimate a new claim, and submit it (with bills/bank details) to the TPA', 'file-text', 5)
ON CONFLICT (key) DO NOTHING;

COMMIT;


-- ── Section 3: generic SINGLE-step path + legacy_handler ──────────────────
-- Until now, ANY row with claim_form_type != 'MULTI' was unconditionally routed
-- through callIsbsBrokerClaim() — hardcoded to ISBS's own field names. This
-- column distinguishes "keep using ISBS's bespoke integration" from "use the
-- generic single-step path" for any future non-MULTI TPA. Internal only, not
-- exposed in the admin UI.
BEGIN;

ALTER TABLE public.tpa_external_feature_config
  ADD COLUMN IF NOT EXISTS legacy_handler VARCHAR(50);

COMMENT ON COLUMN public.tpa_external_feature_config.legacy_handler IS
  'Internal only — set to ISBS_BROKER_CLAIM on ISBS''s INTIMATE_CLAIM row to keep using the hardcoded callIsbsBrokerClaim() integration. NULL (any other TPA) uses the generic single-step path instead.';

-- Mark ISBS/GHPL's existing INTIMATE_CLAIM row(s) so they keep working exactly as
-- before. (Fixed: tpa table's name column is `name`, not `tpa_name`.)
UPDATE public.tpa_external_feature_config cfg
SET legacy_handler = 'ISBS_BROKER_CLAIM'
FROM public.tpa t
WHERE cfg.tpa_id = t.id
  AND cfg.api_type = 'INTIMATE_CLAIM'
  AND (cfg.claim_form_type IS NULL OR cfg.claim_form_type = 'SINGLE')
  AND (t.name ILIKE '%isbs%' OR t.name ILIKE '%good health%' OR t.name ILIKE '%ghpl%'); -- TODO: confirm exact match

COMMIT;


-- ── Section 4: benefit_type on policy_claim ────────────────────────────────
-- benefitType (IPD/OPD) is collected at intimation for TPAs that need it
-- (Health India), but was only ever passed as a dynamicField — never saved.
-- Needed so a resubmission-style Submit Claim call (Health India's
-- GetClaimIntimationWithDMS, which repeats the full intimation payload) can
-- reconstruct the original value.
BEGIN;

ALTER TABLE public.policy_claim
  ADD COLUMN IF NOT EXISTS benefit_type VARCHAR(50);

COMMENT ON COLUMN public.policy_claim.benefit_type IS
  'IPD/OPD etc. — required by some TPAs at intimation (Health India); persisted so a resubmission-style Submit Claim call can reconstruct the original intimation payload.';

COMMIT;


-- ── Section 5: FHPL + Health India — real API configs ─────────────────────
-- Safe to re-run any number of times (deletes its own rows first, by label,
-- before recreating them) — mstr_ext_application_ref.label has no unique
-- constraint, so ON CONFLICT DO NOTHING can't be used here.
BEGIN;

DELETE FROM public.tpa_external_feature_config
WHERE app_ref_id IN (
  SELECT id FROM public.mstr_ext_application_ref WHERE label IN (
    'fhpl-claim-intimate', 'fhpl-claim-submit',
    'healthindia-claim-intimate', 'healthindia-claim-submit', 'healthindia-claim-submit-doc'
  )
);

DELETE FROM public.mstr_ext_application_ref WHERE label IN (
  'fhpl-claim-intimate', 'fhpl-claim-submit',
  'healthindia-claim-intimate', 'healthindia-claim-submit', 'healthindia-claim-submit-doc'
);

-- FHPL: shared Step 1 auth (OAuth2 "password" grant token endpoint). Owned by
-- the Intimate ref below; the Submit ref points auth_app_ref_id at it so both
-- calls share one cached token instead of logging in twice per claim.
-- payload_format = 'FORM' governs ONLY step 1's encoding — step 2 (the actual
-- claim call) encodes based on its own step2_content_type field (JSON default).
INSERT INTO public.mstr_ext_application_ref (
    label, description, auth_type, payload_format,
    verification_token_api_url, verification_token_api_method, verification_token_api_payload,
    step1_response_token_key,
    magic_url_api_url, magic_url_api_method, magic_url_api_payload,
    step2_header_template,
    container_category, is_active, expires_in
) VALUES (
    'fhpl-claim-intimate',
    'FHPL — Claim Intimation (MULTI-step, stage 1 of 2)',
    'SESSION',
    'FORM',
    'https://brk-api-uat-v1.fhpl.net/token',
    'POST',
    -- Confirmed from Postman: x-www-form-urlencoded body, OAuth2 "password" grant.
    -- Literal values (no AWS Secrets Manager entry exists yet) — same "TestApi@fhpl"
    -- identity confirmed again in the real ClaimSubmission example's "Userid" field.
    -- Move to {{secret:env:FHPL_SECRET:username/password}} before a shared/prod environment.
    '{
        "UserName": "TestApi@fhpl",
        "Password": "Fhpl@12345",
        "grant_type": "password"
    }'::jsonb,
    'access_token', -- TODO: unconfirmed, verify via Test API Connection
    'https://brk-api-uat-v1.fhpl.net/api/ClaimIntimation',
    'POST',
    '{
        "Member_UHID": "{{memberCardId}}",
        "Date_of_Admission": "{{dateOfAdmission|date:YYYY-MM-DD}}",
        "Policy_Number": "{{policyNumber}}",
        "Type_of_Claim": "{{claimType|map:CASHLESS:1,REIMBURSEMENT:2|number}}",
        "Diagnosis": "{{diagnosis}}",
        "Mobile_number": "{{patientMobile}}",
        "Email_id": "{{patientEmail}}",
        "Name_of_hospital": "{{hospitalName}}",
        "Hospital_address": "{{hospitalAddress}}",
        "HospitalID": "{{hospitalId|number}}"
    }'::jsonb,
    -- Date_of_Admission (YYYY-MM-DD), HospitalID (bare number), and Type_of_Claim (bare
    -- number, via the new chained map:...|number transform) all confirmed directly against
    -- a real ClaimIntimation Postman example.
    NULL,
    'claims', true, '50m'
);

INSERT INTO public.mstr_ext_application_ref (
    label, description, auth_type, auth_app_ref_id,
    magic_url_api_url, magic_url_api_method, magic_url_api_payload,
    container_category, is_active, expires_in
) VALUES (
    'fhpl-claim-submit',
    'FHPL — Claim Submission (MULTI-step, stage 2 of 2)',
    'SESSION',
    (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'fhpl-claim-intimate'),
    'https://brk-api-uat-v1.fhpl.net/api/ClaimSubmission',
    'POST',
    -- Cross-checked field-by-field against a real, working ClaimSubmission example:
    --  - Userid: literal "TestApi@fhpl" (same identity as the token call, not an env var
    --    that was never actually set anywhere — {{env:FHPL_USER_ID}} would have been sent
    --    to FHPL as the literal unresolved string).
    --  - DOA/DateofDischarge: confirmed bare "YYYY-MM-DD" with no time component —
    --    |date:YYYY-MM-DD (payload-template.util.ts's date: transform strips any time
    --    component first, since our dateOfAdmission is always a full ISO datetime).
    --  - ClaimedAmount: confirmed a bare JSON number (1234), not a quoted string — |number.
    --  - DocumentType: confirmed a bare JSON number (9).
    --  - Documents: confirmed to still be an array (NOT flattened), but with exactly ONE
    --    element per call — matches submit_execution_mode = PER_DOCUMENT (Section 6),
    --    one call per document, looped, same as Health India/ISBS. fileName isn't
    --    available in PER_DOCUMENT mode (only documentType/fileBase64 are — see
    --    submitClaim's PER_DOCUMENT branch), so documentName reuses {{documentType}}
    --    same as ISBS's docName does.
    --  - documentCategory: real example shows "IRR" for a document — we don't have FHPL's
    --    full category-code table (only this one example), so this still sends our OWN
    --    internal document type value ({{documentType}}, e.g. "FINAL_BILL"). UNRESOLVED —
    --    needs FHPL's real code list before trusting this field.
    '{
        "Userid": "TestApi@fhpl",
        "PolicyNo": "{{policyNumber}}",
        "UhidNo": "{{memberCardId}}",
        "ClaimID": "{{claimReferenceId}}",
        "IssueID": "1",
        "Slno": "1",
        "DOA": "{{dateOfAdmission|date:YYYY-MM-DD}}",
        "DateofDischarge": "{{dateOfDischarge|date:YYYY-MM-DD}}",
        "ClaimedAmount": "{{finalClaimedAmount|number}}",
        "DocumentType": 9,
        "PayeeName": "{{payeeName}}",
        "HospitalName": "{{hospitalName}}",
        "MobileNo": "{{patientMobile}}",
        "AccountType": "{{accountType}}",
        "BankAccountNo": "{{bankAccountNo}}",
        "Documents": [
            {
                "documentName": "{{documentType}}",
                "documentCategory": "{{documentType}}",
                "File": "{{fileBase64}}"
            }
        ]
    }'::jsonb,
    'claims', true, '50m'
);

-- Health India: shared Step 1 auth (Basic Auth → JWT).
INSERT INTO public.mstr_ext_application_ref (
    label, description, auth_type,
    verification_token_api_url, verification_token_api_method, verification_token_api_payload,
    step1_response_token_key, basic_auth_user, basic_auth_password,
    magic_url_api_url, magic_url_api_method, magic_url_api_payload,
    container_category, is_active, expires_in
) VALUES (
    'healthindia-claim-intimate',
    'Health India — Claim Intimation (MULTI-step, stage 1 of 2)',
    'BASIC_AUTH',
    'https://software.healthindiatpa.com/HIITPABROKERAPI/JWT/GenerateJWTAuth',
    'POST',
    '{}'::jsonb,
    'result.0.access_token', -- confirmed via real response: {"result":[{"access_token":"..."}]}
    -- Literal values from Health India's Postman collection (Basic Auth tab) — no
    -- Secrets Manager entry exists for these yet, so hardcoded here for now to
    -- unblock local testing. Move to {{secret:env:HEALTHINDIA_SECRET:username/password}}
    -- once a real secret is provisioned, before this reaches a shared/prod environment.
    '/MU4gwfBYC71M1QnczasegH0vPM5IMbESO4iy4wbUrQ=',
    'KoVi+w2WGA+ET6fHN3kdBamHNsDKbA+kUtuF++4jWcg=',
    'https://software.healthindiatpa.com/HIITPABROKERAPI/Intimation/GetClaimIntimation',
    'POST',
    '{
        "policY_NUMBER": "{{policyNumber}}",
        "employeE_CODE": "{{employeeCode}}",
        "membeR_ID": "{{memberCardId}}",
        "claiM_TYPE": "{{claimType|map:CASHLESS:Cashless,REIMBURSEMENT:Reimbursement}}",
        "benefiT_TYPE": "{{benefitType}}",
        "claimeD_AMOUNT": "{{estimatedClaimAmount}}",
        "datE_OF_ADMISSION": "{{dateOfAdmission}}",
        "ailmenT_DESCRIPTION": "{{diagnosis}}",
        "hospitaL_CODE": "{{hospitalCode}}",
        "hospitaL_NAME": "{{hospitalName}}",
        "hospitaL_ADDRESS": "{{hospitalAddress}}",
        "hospitaL_NUMBER": "{{hospitalPhone}}"
    }'::jsonb,
    'claims', true, '50m'
);

COMMIT;

-- Submission = GetClaimDocumentSubmission — confirmed via a real Postman example
-- (replaces the earlier GetClaimIntimationWithDMS guess, which repeated the full
-- intimation payload; this one is much simpler — just the claim reference + docs).
-- CCN/CCN_EXT come from tpaClaimNo (saved at intimation as "ref:ext", split back out
-- in submitClaim into claimReferenceId/claimReferenceExt).
-- For now: ONE document per call (submit_execution_mode = PER_DOCUMENT below, looped
-- in submitClaim) — pdF_BYTES is a single-element array holding just that one file's
-- base64 (matches the real example exactly: one string in the array, not several).
-- Not using the $forEach/"documents" construct here since we're deliberately not
-- batching multiple files into one call right now.
-- documenT_TYPE: the one real example shows "CD" as a fixed value, not varying per
-- document — treated as a constant here (same treatment as FHPL's DocumentType=9),
-- unconfirmed whether it's ever meant to differ per document type.
INSERT INTO public.mstr_ext_application_ref (
    label, description, auth_type, auth_app_ref_id,
    magic_url_api_url, magic_url_api_method, magic_url_api_payload,
    container_category, is_active, expires_in
) VALUES (
    'healthindia-claim-submit',
    'Health India — Claim Submission via GetClaimDocumentSubmission (MULTI-step, stage 2 of 2)',
    'BASIC_AUTH',
    (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'healthindia-claim-intimate'),
    'https://software.healthindiatpa.com/HIITPABROKERAPI/Document/GetClaimDocumentSubmission',
    'POST',
    '{
        "CCN": "{{claimReferenceId}}",
        "CCN_EXT": "{{claimReferenceExt}}",
        "documenT_TYPE": "CD",
        "pdF_BYTES": ["{{fileBase64}}"]
    }'::jsonb,
    'claims', true, '50m'
);

COMMIT;


-- ── Section 6: Feature config bindings ─────────────────────────────────────
-- FHPL's actual tpa.name is "Family Health Plan Ltd." (id=11 in this DB) — it
-- does NOT contain the substring "fhpl", so an ILIKE '%fhpl%' match returns
-- zero rows silently (no error, just nothing inserted). Confirmed by querying
-- the tpa table directly. Matching on "family health" instead.
-- These ON CONFLICT clauses ARE safe — uq_tpa_ext_feat_cfg_api_type is a real
-- partial unique index on (tpa_id, api_type), unlike mstr_ext_application_ref.label.
BEGIN;

INSERT INTO public.tpa_external_feature_config
  (tpa_id, feature_type_id, app_ref_id, label, button_label, api_type, claim_form_type, is_active)
SELECT t.id, (SELECT id FROM public.mstr_tpa_feature_type WHERE key = 'CLAIM_SUBMISSION'),
  (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'fhpl-claim-intimate'),
  'FHPL Claim Intimation', 'Intimate Claim', 'INTIMATE_CLAIM', 'MULTI', true
FROM public.tpa t WHERE t.name ILIKE '%family health%'
ON CONFLICT (tpa_id, api_type) WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL DO UPDATE
  SET app_ref_id = EXCLUDED.app_ref_id, claim_form_type = EXCLUDED.claim_form_type, is_active = true;

INSERT INTO public.tpa_external_feature_config
  (tpa_id, feature_type_id, app_ref_id, label, button_label, api_type, submit_execution_mode, is_active)
SELECT t.id, (SELECT id FROM public.mstr_tpa_feature_type WHERE key = 'CLAIM_SUBMISSION'),
  (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'fhpl-claim-submit'),
  'FHPL Claim Submission', 'Submit Claim', 'SUBMIT_CLAIM', 'PER_DOCUMENT', true
FROM public.tpa t WHERE t.name ILIKE '%family health%'
ON CONFLICT (tpa_id, api_type) WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL DO UPDATE
  SET app_ref_id = EXCLUDED.app_ref_id, submit_execution_mode = EXCLUDED.submit_execution_mode, is_active = true;

INSERT INTO public.tpa_external_feature_config
  (tpa_id, feature_type_id, app_ref_id, label, button_label, api_type, claim_form_type, is_active)
SELECT t.id, (SELECT id FROM public.mstr_tpa_feature_type WHERE key = 'CLAIM_SUBMISSION'),
  (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'healthindia-claim-intimate'),
  'Health India Claim Intimation', 'Intimate Claim', 'INTIMATE_CLAIM', 'MULTI', true
FROM public.tpa t WHERE t.name ILIKE '%health india%'
ON CONFLICT (tpa_id, api_type) WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL DO UPDATE
  SET app_ref_id = EXCLUDED.app_ref_id, claim_form_type = EXCLUDED.claim_form_type, is_active = true;

INSERT INTO public.tpa_external_feature_config
  (tpa_id, feature_type_id, app_ref_id, label, button_label, api_type, submit_execution_mode, is_active)
SELECT t.id, (SELECT id FROM public.mstr_tpa_feature_type WHERE key = 'CLAIM_SUBMISSION'),
  (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'healthindia-claim-submit'),
  'Health India Claim Submission', 'Submit Claim', 'SUBMIT_CLAIM', 'PER_DOCUMENT', true
FROM public.tpa t WHERE t.name ILIKE '%health india%'
ON CONFLICT (tpa_id, api_type) WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL DO UPDATE
  SET app_ref_id = EXCLUDED.app_ref_id, submit_execution_mode = EXCLUDED.submit_execution_mode, is_active = true;

COMMIT;


-- ── Section 7: extra_fields on policy_claim ────────────────────────────────
-- Persists TPA-specific USER_INPUT fields collected at intimation (see Section 8's
-- comment for the full pattern) so a resubmission-style Submit Claim call can
-- reconstruct them, the same way canonical fields already are.
BEGIN;

ALTER TABLE public.policy_claim
  ADD COLUMN IF NOT EXISTS extra_fields JSONB;

COMMENT ON COLUMN public.policy_claim.extra_fields IS
  'TPA-specific fields collected via the admin-configured USER_INPUT payload field mapping (tpa_payload_field_mapping) at intimation — not part of the canonical field set, so not derivable from other columns. Reconstructed at submission for TPAs whose submit call repeats the intimation payload.';

COMMIT;


-- ── Section 8: response mappings — replaces hardcoded field-name guessing ──
-- Until now, extractTpaClaimRef() (company-employee.service.ts) guessed each TPA's
-- claim-reference field name in code (IntimationID for FHPL, result.0.ccn for Health
-- India, ...) — meaning every new TPA needed a code change. mstr_ext_app_response_mapping
-- already supports exactly this as an admin-configurable STANDARD_KEY mapping (iWork →
-- TpaAppRefForm → Response Mappings section) — it just wasn't populated for these two.
-- Once configured here, raw.TPA_CLAIM_REF is populated automatically by
-- applyStep2Mappings() before extractTpaClaimRef's hardcoded fallback chain ever runs
-- (that fallback chain stays in code as a safety net for TPAs not yet configured this
-- way, not removed). For a NEW TPA going forward: no code change needed, just add rows
-- here (or via the iWork UI) mapping the TPA's actual response field to TPA_CLAIM_REF.
BEGIN;

DELETE FROM public.mstr_ext_app_response_mapping
WHERE app_ref_id IN (
  SELECT id FROM public.mstr_ext_application_ref
  WHERE label IN ('fhpl-claim-intimate', 'healthindia-claim-intimate')
) AND output_key IN ('TPA_CLAIM_REF', 'TPA_CLAIM_REF_EXT');

-- FHPL: confirmed real response {"Message":"Intimation created Successfully","IntimationID":"1189449"}
INSERT INTO public.mstr_ext_app_response_mapping (app_ref_id, step, response_key, target_type, output_key, display_order)
SELECT id, 2, 'IntimationID', 'STANDARD_KEY', 'TPA_CLAIM_REF', 0
FROM public.mstr_ext_application_ref WHERE label = 'fhpl-claim-intimate';

-- Health India: confirmed real response {"result":[{"ccn":"...","ccN_EXT":"0","message":"SUCCESS"}]}
INSERT INTO public.mstr_ext_app_response_mapping (app_ref_id, step, response_key, target_type, output_key, display_order)
SELECT id, 2, 'result.0.ccn', 'STANDARD_KEY', 'TPA_CLAIM_REF', 0
FROM public.mstr_ext_application_ref WHERE label = 'healthindia-claim-intimate';

INSERT INTO public.mstr_ext_app_response_mapping (app_ref_id, step, response_key, target_type, output_key, display_order)
SELECT id, 2, 'result.0.ccN_EXT', 'STANDARD_KEY', 'TPA_CLAIM_REF_EXT', 1
FROM public.mstr_ext_application_ref WHERE label = 'healthindia-claim-intimate';

COMMIT;


-- ── Section 9: ISBS/GHPL ("Good Healthplan Ltd.", real MULTI flow) ────────
-- Folds in isbs-claim-multi-step.sql. Auth: DIRECT — brokerUsername/
-- brokerPassword/brokerAPIKey are embedded directly in every request body (no
-- separate token exchange), unlike FHPL (OAuth2) or Health India (Basic Auth →
-- JWT). Literal credential values below (no Secrets Manager entry yet) — same
-- treatment as FHPL/Health India's hardcoded credentials above.
--
-- clmHospFrom/clmHospTo: RESOLVED — confirmed via a real working BrokerClaimCreation
-- example that ISBS wants the raw full ISO datetime (e.g. "2026-01-17T18:30:00.000Z"),
-- same as our native dateOfAdmission/dateOfDischarge shape, no date: transform at all.
-- Every earlier attempt (DD/MM/YYYY, then YYYY-MM-DD) was based on guessing from the
-- "String was not recognized as a valid DateTime" error alone — turns out the actual
-- problem was reformatting it in the first place, not the format chosen.
BEGIN;

DELETE FROM public.tpa_external_feature_config
WHERE app_ref_id IN (
  SELECT id FROM public.mstr_ext_application_ref WHERE label IN ('isbs-claim-intimate', 'isbs-claim-submit')
);

DELETE FROM public.mstr_ext_application_ref WHERE label IN ('isbs-claim-intimate', 'isbs-claim-submit');

INSERT INTO public.mstr_ext_application_ref (
    label, description, auth_type,
    magic_url_api_url, magic_url_api_method, magic_url_api_payload,
    container_category, is_active, expires_in
) VALUES (
    'isbs-claim-intimate',
    'ISBS/GHPL — Claim Intimation via BrokerClaimCreation (MULTI-step, stage 1 of 2)',
    'DIRECT',
    'https://dev.isbsindia.in/WebServ/api/Intermediary/BrokerClaimCreation',
    'POST',
    '{
        "brokerUsername": "IIRMHO",
        "brokerPassword": "IIRMHO",
        "brokerAPIKey": "2sNt9WUV/FnDsHxVPZRVU9Vc2F7erhqXDzz6ViN30ldYrpa1XFhVfymy3pZHVkjwAY6xJ9eg3GuDYOX8n+42RumUQrt1c+rXejEBvFDzMCo=",
        "ptGhCardId": "{{memberCardId}}",
        "policyNo": "{{policyNumber}}",
        "clmPatientName": "{{patientName}}",
        "ptMobileNo": "{{patientMobile}}",
        "ptEmail": "{{patientEmail}}",
        "ghHospitalId": "{{hospitalCode|number}}",
        "clmRequestedAmt": "{{estimatedClaimAmount|number}}",
        "clmHospFrom": "{{dateOfAdmission}}",
        "clmHospTo": "{{dateOfDischarge}}",
        "clmHospName": "{{hospitalName}}",
        "clmCity": "{{hospitalCity}}",
        "clmState": "{{hospitalState}}",
        "clmHospAddress": "{{hospitalAddress}}",
        "clmPincode": "{{hospitalPincode}}",
        "clmReasonAdmission": "{{diagnosis}}",
        "clmNatureOfLossCode": "Illness",
        "clmCommunicationRemarks": "{{diagnosis}}",
        "clmSubtype": "{{claimType|map:CASHLESS:IP-1,REIMBURSEMENT:IP-2}}",
        "clmTypeOfAdmission": "Emergency",
        "moduleId": "1"
    }'::jsonb,
    'claims', true, '50m'
);

INSERT INTO public.mstr_ext_application_ref (
    label, description, auth_type,
    magic_url_api_url, magic_url_api_method, magic_url_api_payload,
    container_category, is_active, expires_in
) VALUES (
    'isbs-claim-submit',
    'ISBS/GHPL — Claim Document Submission via BrokerClaimDocupload (MULTI-step, stage 2 of 2, one call per document)',
    'DIRECT',
    'https://dev.isbsindia.in/WebServ/api/Intermediary/BrokerClaimDocupload',
    'POST',
    -- Field name casing is exactly as ISBS gave it — "brokerUserName" here (capital U)
    -- vs intimation's "brokerUsername" (lowercase u), and moduleId as a bare number here
    -- vs a string on the intimation side. Both are real inconsistencies in ISBS's own
    -- API, not typos on our side — preserved verbatim.
    '{
        "brokerUserName": "IIRMHO",
        "brokerPassword": "IIRMHO",
        "brokerAPIKey": "2sNt9WUV/FnDsHxVPZRVU9Vc2F7erhqXDzz6ViN30ldYrpa1XFhVfymy3pZHVkjwAY6xJ9eg3GuDYOX8n+42RumUQrt1c+rXejEBvFDzMCo=",
        "base64String": "{{fileBase64}}",
        "ccno": "{{claimReferenceId}}",
        "docCatagory": "{{documentType}}",
        "docName": "{{documentType}}",
        "docType": "pdf",
        "moduleId": 1
    }'::jsonb,
    'claims', true, '50m'
);

COMMIT;

BEGIN;

INSERT INTO public.tpa_external_feature_config
  (tpa_id, feature_type_id, app_ref_id, label, button_label, api_type, claim_form_type, is_active)
SELECT t.id, (SELECT id FROM public.mstr_tpa_feature_type WHERE key = 'CLAIM_SUBMISSION'),
  (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'isbs-claim-intimate'),
  'ISBS Claim Intimation', 'Intimate Claim', 'INTIMATE_CLAIM', 'MULTI', true
FROM public.tpa t WHERE (t.name ILIKE '%isbs%' OR t.name ILIKE '%good health%' OR t.name ILIKE '%ghpl%')
ON CONFLICT (tpa_id, api_type) WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL DO UPDATE
  SET app_ref_id = EXCLUDED.app_ref_id, claim_form_type = EXCLUDED.claim_form_type, is_active = true;

INSERT INTO public.tpa_external_feature_config
  (tpa_id, feature_type_id, app_ref_id, label, button_label, api_type, submit_execution_mode, is_active)
SELECT t.id, (SELECT id FROM public.mstr_tpa_feature_type WHERE key = 'CLAIM_SUBMISSION'),
  (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'isbs-claim-submit'),
  'ISBS Claim Submission', 'Submit Claim', 'SUBMIT_CLAIM', 'PER_DOCUMENT', true
FROM public.tpa t WHERE (t.name ILIKE '%isbs%' OR t.name ILIKE '%good health%' OR t.name ILIKE '%ghpl%')
ON CONFLICT (tpa_id, api_type) WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL DO UPDATE
  SET app_ref_id = EXCLUDED.app_ref_id, submit_execution_mode = EXCLUDED.submit_execution_mode, is_active = true;

COMMIT;

BEGIN;

DELETE FROM public.mstr_ext_app_response_mapping
WHERE app_ref_id IN (SELECT id FROM public.mstr_ext_application_ref WHERE label = 'isbs-claim-intimate')
  AND output_key = 'TPA_CLAIM_REF';

-- 'ccn' inferred from the existing legacy callIsbsBrokerClaim() code (isbsData.ccn),
-- which already successfully parses a real BrokerClaimCreation response.
INSERT INTO public.mstr_ext_app_response_mapping (app_ref_id, step, response_key, target_type, output_key, display_order)
SELECT id, 2, 'ccn', 'STANDARD_KEY', 'TPA_CLAIM_REF', 0
FROM public.mstr_ext_application_ref WHERE label = 'isbs-claim-intimate';

COMMIT;


-- ── Rollback (run manually if needed) ────────────────────────
-- DELETE FROM public.tpa_external_feature_config WHERE app_ref_id IN (
--   SELECT id FROM public.mstr_ext_application_ref WHERE label IN
--   ('fhpl-claim-intimate','fhpl-claim-submit','healthindia-claim-intimate','healthindia-claim-submit',
--    'isbs-claim-intimate','isbs-claim-submit'));
-- DELETE FROM public.mstr_ext_application_ref WHERE label IN
--   ('fhpl-claim-intimate','fhpl-claim-submit','healthindia-claim-intimate','healthindia-claim-submit',
--    'isbs-claim-intimate','isbs-claim-submit');
-- DELETE FROM public.policy_claim_status WHERE status = 'INTIMATED';
-- DELETE FROM public.mstr_tpa_feature_type WHERE key = 'CLAIM_SUBMISSION';
-- ALTER TABLE public.tpa_external_feature_config DROP CONSTRAINT IF EXISTS chk_tpa_ext_feat_cfg_submit_exec_mode;
-- ALTER TABLE public.tpa_external_feature_config DROP CONSTRAINT IF EXISTS chk_tpa_ext_feat_cfg_claim_form_type;
-- ALTER TABLE public.tpa_external_feature_config DROP COLUMN IF EXISTS submit_execution_mode;
-- ALTER TABLE public.tpa_external_feature_config DROP COLUMN IF EXISTS claim_form_type;
-- ALTER TABLE public.tpa_external_feature_config DROP COLUMN IF EXISTS legacy_handler;
-- ALTER TABLE public.policy_claim DROP COLUMN IF EXISTS benefit_type;
-- ALTER TABLE public.policy_claim DROP COLUMN IF EXISTS extra_fields;
-- DELETE FROM public.mstr_ext_app_response_mapping WHERE app_ref_id IN (
--   SELECT id FROM public.mstr_ext_application_ref WHERE label IN
--   ('fhpl-claim-intimate','healthindia-claim-intimate','isbs-claim-intimate'))
--   AND output_key IN ('TPA_CLAIM_REF','TPA_CLAIM_REF_EXT');
