-- ═══════════════════════════════════════════════════════════════════════════════
-- FILE: tpa-dynamic-integration-framework.sql
-- PURPOSE: Multi-TPA dynamic integration framework
--
-- TABLE RELATIONSHIPS:
--   tpa.id
--     └── policy_tpa_map.tpa_id      (links policy → TPA)
--     └── mstr_tpa_claim_api_config.tpa_id  (NEW — links TPA → API configs)
--           └── mstr_ext_application_ref.id (existing — stores auth + URL + payload)
--
-- API TYPES (per TPA row):
--   FETCH_CLAIMS        → batch sync (currently uses appKey "tpa-claims")
--   FETCH_CLAIM_STATUS  → single claim refresh (currently "goodhealth-claim-status")
--   INTIMATE_CLAIM      → submit new claim (currently "isbs-broker-claim")
--
-- HOW IT WORKS AT RUNTIME:
--   1. policy.tpa_mappings → get tpa_id
--   2. SELECT ref_id FROM mstr_tpa_claim_api_config WHERE tpa_id=? AND api_type=?
--   3. SELECT label FROM mstr_ext_application_ref WHERE id=ref_id
--   4. POST document-service/external-app-sso/magic-url { appKey: label, dynamicFields }
--
-- RUN ORDER: Execute all sections in order. Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Extend mstr_ext_application_ref for new TPA auth types
--
-- New auth_type values this enables:
--   SESSION_BODY       — token from step1 injected into step2 request BODY (Paramount)
--   HEADER_CREDENTIALS — credentials always in HTTP headers, no token step (MediAssist)
--   BASIC_AUTH         — Basic Auth header + extra headers per call (Vidal)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS token_placement       VARCHAR(20) DEFAULT 'BEARER_HEADER',
  ADD COLUMN IF NOT EXISTS step2_header_template JSONB       NULL,
  ADD COLUMN IF NOT EXISTS token_body_key        VARCHAR(100) NULL;

COMMENT ON COLUMN public.mstr_ext_application_ref.token_placement IS
  'BEARER_HEADER (default) | BODY_FIELD (Paramount) | NONE (MediAssist/Vidal)';
COMMENT ON COLUMN public.mstr_ext_application_ref.step2_header_template IS
  'Static HTTP headers injected into step2 call. Supports {{placeholder}}. Used by HEADER_CREDENTIALS and BASIC_AUTH.';
COMMENT ON COLUMN public.mstr_ext_application_ref.token_body_key IS
  'Body field name to inject step1 token when token_placement=BODY_FIELD (e.g. "ACCESS_TOKEN" for Paramount).';


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Create mstr_tpa_claim_api_config
--
-- Links each TPA to its mstr_ext_application_ref entries (one per api_type).
-- Also stores field normalization (different TPAs return different key names).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mstr_tpa_claim_api_config (
  id                    SERIAL PRIMARY KEY,

  -- FK to tpa.id (the TPA master table linked from policy_tpa_map.tpa_id)
  tpa_id                INT          NOT NULL REFERENCES public.tpa(id),

  -- Which operation this row configures
  api_type              VARCHAR(50)  NOT NULL,  -- FETCH_CLAIMS | FETCH_CLAIM_STATUS | INTIMATE_CLAIM

  -- FK to the mstr_ext_application_ref row that holds auth config + API URL + payload template
  ref_id                INT          NOT NULL REFERENCES public.mstr_ext_application_ref(id),

  -- Maps our internal field names → placeholder keys in the payload template
  -- e.g. { "insurerPolicyNumber": "policyNo", "policyFrom": "policyStartDate" }
  -- Used to build dynamicFields at call time from the policy/claim objects
  dynamic_param_mapping JSONB        NOT NULL DEFAULT '{}',

  -- Normalizes TPA response keys → our UPPER_CASE standard (for storeExternalTpaClaims)
  -- e.g. MediAssist: { "tpA_CLAIM_NO": "TPA_CLAIM_NO", "status": "CLAIM_STATUS" }
  -- GoodHealth already returns UPPER_CASE so mapping is empty {}
  field_mapping         JSONB        NOT NULL DEFAULT '{}',

  -- Dot-path to the claims array inside the TPA response (null = root array)
  -- e.g. MediAssist: "claimsData", Paramount: "GetClaimMISDetailsResult", GH: null
  data_path             VARCHAR(200) NULL,

  -- Normalize TPA-specific status strings → our standard status keys
  status_mapping        JSONB        NOT NULL DEFAULT '{
    "Settled":    "settled",
    "settled":    "settled",
    "Approved":   "settled",
    "PAID":       "settled",
    "Rejected":   "rejected",
    "Cancelled":  "rejected",
    "DEFICIENT":  "rejected",
    "Pending":    "pending",
    "OUTSTANDING":"pending",
    "pending":    "pending"
  }',

  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  -- One row per (TPA × API type) — enforced
  CONSTRAINT uq_tpa_api_type UNIQUE (tpa_id, api_type)
);

CREATE INDEX IF NOT EXISTS idx_tpa_claim_api_config_lookup
  ON public.mstr_tpa_claim_api_config (tpa_id, api_type)
  WHERE is_active = true;

COMMENT ON TABLE public.mstr_tpa_claim_api_config IS
  'Links each TPA to its 3 API configs (FETCH_CLAIMS, FETCH_CLAIM_STATUS, INTIMATE_CLAIM). Adding a new TPA = INSERT rows here + mstr_ext_application_ref only. No code changes needed.';


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Seed GoodHealth TPA rows
--
-- Connects GoodHealth (tpa.id where name ILIKE '%good%health%') to existing
-- mstr_ext_application_ref entries already inserted by previous seed scripts.
--
-- Prerequisites (must exist before running this section):
--   mstr_ext_application_ref.label = 'tpa-claims'              (existing)
--   mstr_ext_application_ref.label = 'goodhealth-claim-status' (goodhealth-claim-status-seed.sql)
--   mstr_ext_application_ref.label = 'isbs-broker-claim'       (isbs-broker-claim-seed.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. FETCH_CLAIMS — batch sync (appKey: tpa-claims)
INSERT INTO public.mstr_tpa_claim_api_config
  (tpa_id, api_type, ref_id, dynamic_param_mapping, field_mapping, data_path, status_mapping)
SELECT
  t.id,
  'FETCH_CLAIMS',
  ear.id,
  '{
    "policyNumber":    "insurerPolicyNumber",
    "policyStartDate": "policyFrom",
    "policyEndDate":   "policyTo"
  }',
  '{}',
  NULL,
  '{
    "Settled":"settled","Approved":"settled","PAID":"settled",
    "Rejected":"rejected","Cancelled":"rejected",
    "Pending":"pending","OUTSTANDING":"pending"
  }'
FROM public.tpa t
JOIN public.mstr_ext_application_ref ear ON ear.label = 'tpa-claims' AND ear.is_active = true
WHERE LOWER(t.name) ILIKE '%good%health%'
LIMIT 1
ON CONFLICT (tpa_id, api_type) DO UPDATE
  SET ref_id = EXCLUDED.ref_id,
      dynamic_param_mapping = EXCLUDED.dynamic_param_mapping,
      updated_at = NOW();

-- 3b. FETCH_CLAIM_STATUS — single claim live refresh (appKey: goodhealth-claim-status)
INSERT INTO public.mstr_tpa_claim_api_config
  (tpa_id, api_type, ref_id, dynamic_param_mapping, field_mapping, data_path, status_mapping)
SELECT
  t.id,
  'FETCH_CLAIM_STATUS',
  ear.id,
  '{
    "policyNo":        "insurerPolicyNumber",
    "policyStartDate": "policyStartDate",
    "policyEndDate":   "policyEndDate",
    "claimId":         "tpaClaimNo"
  }',
  '{}',
  NULL,
  '{
    "Settled":"settled","Approved":"settled","PAID":"settled",
    "Rejected":"rejected","Cancelled":"rejected",
    "Pending":"pending","OUTSTANDING":"pending"
  }'
FROM public.tpa t
JOIN public.mstr_ext_application_ref ear ON ear.label = 'goodhealth-claim-status' AND ear.is_active = true
WHERE LOWER(t.name) ILIKE '%good%health%'
LIMIT 1
ON CONFLICT (tpa_id, api_type) DO UPDATE
  SET ref_id = EXCLUDED.ref_id,
      dynamic_param_mapping = EXCLUDED.dynamic_param_mapping,
      updated_at = NOW();

-- 3c. INTIMATE_CLAIM — submit new claim to ISBS (appKey: isbs-broker-claim)
INSERT INTO public.mstr_tpa_claim_api_config
  (tpa_id, api_type, ref_id, dynamic_param_mapping, field_mapping, data_path, status_mapping)
SELECT
  t.id,
  'INTIMATE_CLAIM',
  ear.id,
  '{
    "ptGhCardId":    "patientTpaId",
    "policyNo":      "insurerPolicyNumber",
    "clmPatientName":"patientName",
    "ptMobileNo":    "employeePhone",
    "ptEmail":       "employeeEmail"
  }',
  '{}',
  NULL,
  '{}'
FROM public.tpa t
JOIN public.mstr_ext_application_ref ear ON ear.label = 'isbs-broker-claim' AND ear.is_active = true
WHERE LOWER(t.name) ILIKE '%good%health%'
LIMIT 1
ON CONFLICT (tpa_id, api_type) DO UPDATE
  SET ref_id = EXCLUDED.ref_id,
      dynamic_param_mapping = EXCLUDED.dynamic_param_mapping,
      updated_at = NOW();


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Template for onboarding a NEW TPA (comment block — not executed)
--
-- To add MediAssist (or any other TPA), run these 2 steps:
--
-- STEP A: Insert auth + endpoint config into mstr_ext_application_ref
-- INSERT INTO public.mstr_ext_application_ref (
--   id, label, description, auth_type,
--   verification_token_api_url, verification_token_api_method, verification_token_api_payload,
--   step1_response_token_key,
--   magic_url_api_url, magic_url_api_method, magic_url_api_payload,
--   step2_response_data_key, container_category, is_active,
--   iss, expires_in, created_by, updated_by,
--   token_placement, step2_header_template  ← new columns
-- ) VALUES (
--   NEXTVAL('mstr_ext_application_ref_id_seq'),
--   'mediassist-claims',
--   'MediAssist Claim Details API',
--   'HEADER_CREDENTIALS',          ← new auth type (no token step)
--   '', '', NULL, '',               ← step1 unused
--   'https://integration.medibuddy.in/ClaimAPIServiceV2/ClaimService/ClaimDetail',
--   'POST',
--   '{"PolicyNo":"{{policyNumber}}","startDate":"{{policyStartDate}}","endDate":"{{policyEndDate}}"}',
--   'data', 'claims', true, '', '10m', 1, 1,
--   'NONE',
--   '{"Username":"indiainsure","Password":"IndiaIns23t810mZoP9xV0"}'  ← credentials in headers
-- );
--
-- STEP B: Link to TPA in mstr_tpa_claim_api_config
-- INSERT INTO public.mstr_tpa_claim_api_config
--   (tpa_id, api_type, ref_id, dynamic_param_mapping, field_mapping, data_path, status_mapping)
-- SELECT
--   t.id,
--   'FETCH_CLAIMS',
--   ear.id,
--   '{"policyNumber":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
--   '{"tpA_CLAIM_NO":"TPA_CLAIM_NO","claiM_REGISTERED_DATE":"CLAIM_REGISTERED_DATE",
--     "status":"CLAIM_STATUS","paiD_AMOUNT":"PAID_AMOUNT","hospitaL_NAME":"HOSPITAL_NAME",
--     "datE_OF_ADMISSION":"DATE_OF_ADMISSION","datE_OF_DISCHARGE":"DATE_OF_DISCHARGE",
--     "tpA_HEALTH_ID":"TPA_ID","employeE_NAME":"EMPLOYEE_NAME","suM_INSURED":"SUM_INSURED"}',
--   'claimsData',  ← MediAssist wraps array in this key
--   '{"OUTSTANDING":"pending","UNDER PROCESS":"pending","PAID":"settled","Cashless":"settled"}'
-- FROM public.tpa t
-- JOIN public.mstr_ext_application_ref ear ON ear.label = 'mediassist-claims' AND ear.is_active = true
-- WHERE LOWER(t.name) ILIKE '%mediassist%' OR LOWER(t.name) ILIKE '%medi assist%'
-- LIMIT 1
-- ON CONFLICT (tpa_id, api_type) DO NOTHING;
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Verification queries
-- ─────────────────────────────────────────────────────────────────────────────

-- Show the full config map
SELECT
  t.name                  AS tpa_name,
  cfg.api_type,
  ear.label               AS app_key,
  ear.auth_type,
  ear.magic_url_api_url   AS endpoint,
  cfg.data_path,
  cfg.is_active
FROM public.mstr_tpa_claim_api_config cfg
JOIN public.tpa                       t   ON t.id   = cfg.tpa_id
JOIN public.mstr_ext_application_ref  ear ON ear.id = cfg.ref_id
ORDER BY t.name, cfg.api_type;

-- Check that the new columns exist on mstr_ext_application_ref
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'mstr_ext_application_ref'
  AND column_name IN ('token_placement', 'step2_header_template', 'token_body_key')
ORDER BY column_name;
