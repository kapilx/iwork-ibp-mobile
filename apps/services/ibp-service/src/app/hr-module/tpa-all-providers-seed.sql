-- ═══════════════════════════════════════════════════════════════════════════════
-- FILE: tpa-all-providers-seed.sql
-- PURPOSE: INSERT scripts for all TPA providers — run to test each integration
--
-- RUN ORDER:
--   1. tpa-dynamic-integration-framework.sql  (creates tables + GoodHealth rows)
--   2. THIS FILE
--
-- AUTH TYPES SUPPORTED (after document-service update):
--   DIRECT             ✅ existing  — credentials in payload body
--   SESSION            ✅ existing  — step1 GET/POST → Bearer header
--   JWT                ✅ existing  — generate JWT → Bearer
--   HEADER_CREDENTIALS ✅ NEW       — credentials in HTTP headers (MediAssist)
--   SESSION_BODY       ✅ NEW       — step1 → token injected in step2 body (Paramount)
--   BASIC_AUTH         ✅ NEW       — Basic Auth + extra headers (Vidal)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FHPL  (Family Health Plan Limited)
--
-- Auth:   GET /token?UserName=&Password=&grant_type=password  → access_token
--         Bearer token used in subsequent calls
-- Type:   SESSION  (already supported — step1 method=GET handled)
-- Claims: POST /api/GetTPA_ClaimsDetails  { UserName, Password, PolicyNumber, FromDate, ToDate }
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.mstr_ext_application_ref (
  id,
  label, description, auth_type,
  verification_token_api_url, verification_token_api_method,
  verification_token_api_payload,
  step1_response_token_key,
  magic_url_api_url, magic_url_api_method,
  magic_url_api_payload,
  step2_response_data_key, container_category, is_active,
  iss, expires_in, created_by, updated_by,
  token_placement
) VALUES (
  NEXTVAL('mstr_ext_application_ref_id_seq'),
  'fhpl-fetch-claims',
  'FHPL – GetTPA_ClaimsDetails (SESSION: GET token → Bearer header)',
  'SESSION',
  'https://bconnect-api.fhpl.net/token',
  'GET',
  '{
    "UserName":   "IndiaInsure",
    "Password":   "fhnt56in",
    "grant_type": "password"
  }'::jsonb,
  'access_token',
  'https://bconnect-api.fhpl.net/api/GetTPA_ClaimsDetails',
  'POST',
  '{
    "UserName":     "IndiaInsure",
    "Password":     "fhnt56in",
    "PolicyNumber": "{{policyNo}}",
    "FromDate":     "{{policyStartDate}}",
    "ToDate":       "{{policyEndDate}}"
  }'::jsonb,
  'data', 'claims', true, '', '1h', 1, 1,
  'BEARER_HEADER'
)
ON CONFLICT DO NOTHING;

-- FHPL → mstr_tpa_claim_api_config
INSERT INTO public.mstr_tpa_claim_api_config
  (tpa_id, api_type, ref_id, dynamic_param_mapping, field_mapping, data_path, status_mapping)
SELECT
  t.id, 'FETCH_CLAIMS', ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{}',
  NULL,
  '{"Settled":"settled","Approved":"settled","Paid":"settled","Rejected":"rejected","Cancelled":"rejected","Pending":"pending","Outstanding":"pending"}'
FROM public.tpa t
JOIN public.mstr_ext_application_ref ear
  ON ear.label = 'fhpl-fetch-claims' AND ear.is_active = true
WHERE LOWER(t.name) ILIKE '%fhpl%' OR LOWER(t.name) ILIKE '%family health plan%'
LIMIT 1
ON CONFLICT (tpa_id, api_type) DO UPDATE
  SET ref_id = EXCLUDED.ref_id, updated_at = NOW();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MediAssist
--
-- Auth:   NO token step — credentials always in HTTP headers (Username, Password)
-- Type:   HEADER_CREDENTIALS  (NEW — implemented in document-service)
-- Claims: POST /ClaimAPIServiceV2/ClaimService/ClaimDetail
--         Headers: Username, Password
--         Body:    { PolicyNo, startDate, endDate }
-- Response wrapped in "claimsData" key
-- Field names: mixed-case (tpA_CLAIM_NO, claiM_REGISTERED_DATE, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.mstr_ext_application_ref (
  id,
  label, description, auth_type,
  verification_token_api_url, verification_token_api_method,
  verification_token_api_payload, step1_response_token_key,
  magic_url_api_url, magic_url_api_method,
  magic_url_api_payload,
  step2_response_data_key, container_category, is_active,
  iss, expires_in, created_by, updated_by,
  token_placement, step2_header_template
) VALUES (
  NEXTVAL('mstr_ext_application_ref_id_seq'),
  'mediassist-fetch-claims',
  'MediAssist – ClaimDetail (HEADER_CREDENTIALS: credentials in HTTP headers)',
  'HEADER_CREDENTIALS',
  '', '', NULL, '',
  'https://integration.medibuddy.in/ClaimAPIServiceV2/ClaimService/ClaimDetail',
  'POST',
  '{
    "PolicyNo":  "{{policyNo}}",
    "startDate": "{{policyStartDate}}",
    "endDate":   "{{policyEndDate}}"
  }'::jsonb,
  'claimsData', 'claims', true, '', '10m', 1, 1,
  'NONE',
  '{
    "Username": "indiainsure",
    "Password": "IndiaIns23t810mZoP9xV0"
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- MediAssist → mstr_tpa_claim_api_config
INSERT INTO public.mstr_tpa_claim_api_config
  (tpa_id, api_type, ref_id, dynamic_param_mapping, field_mapping, data_path, status_mapping)
SELECT
  t.id, 'FETCH_CLAIMS', ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{
    "tpA_CLAIM_NO":           "TPA_CLAIM_NO",
    "tpA_HEALTH_ID":          "TPA_ID",
    "claiM_REGISTERED_DATE":  "CLAIM_REGISTERED_DATE",
    "datE_OF_ADMISSION":      "DATE_OF_ADMISSION",
    "datE_OF_DISCHARGE":      "DATE_OF_DISCHARGE",
    "status":                 "CLAIM_STATUS",
    "paiD_AMOUNT":            "PAID_AMOUNT",
    "claiM_APPROVED_AMOUNT":  "APPROVED_AMOUNT",
    "hospitaL_NAME":          "HOSPITAL_NAME",
    "hospitaL_CITY":          "HOSPITAL_CITY",
    "hospitaL_STATE":         "HOSPITAL_STATE",
    "employeE_NAME":          "EMPLOYEE_NAME",
    "employeE_NO":            "EMPLOYEE_NO",
    "suM_INSURED":            "SUM_INSURED",
    "balancE_SI":             "BALANCE_SUM_INSURED",
    "typE_OF_CLAIM":          "CLAIM_TYPE",
    "beneficiarY_NAME":       "PATIENT_NAME",
    "relation":               "PATIENT_RELATION",
    "datE_OF_BIRTH":          "PATIENT_DOB",
    "prE_AUTH_AMOUNT":        "PRE_AUTH_AMOUNT",
    "prE_AUTH_REQUEST_DATE":  "PRE_AUTH_REQUEST_DATE",
    "datE_OF_SETTLEMENT":     "DATE_OF_SETTLEMENT",
    "settledamt":             "CHEQUE_AMOUNT",
    "hospitaL_ADDRESS":       "HOSPITAL_ADDRESS",
    "hosP_PINCODE":           "HOSPITAL_PINCODE",
    "insurancE_CLAIM_NO":     "INSURANCE_CLAIM_NO",
    "policY_NUMBER":          "POLICY_NO"
  }',
  'claimsData',
  '{"OUTSTANDING":"pending","UNDER PROCESS":"pending","PAID":"settled","DEFICIENT":"pending","REJECTED":"rejected"}'
FROM public.tpa t
JOIN public.mstr_ext_application_ref ear
  ON ear.label = 'mediassist-fetch-claims' AND ear.is_active = true
WHERE LOWER(t.name) ILIKE '%mediassist%' OR LOWER(t.name) ILIKE '%medi assist%'
LIMIT 1
ON CONFLICT (tpa_id, api_type) DO UPDATE
  SET ref_id = EXCLUDED.ref_id,
      field_mapping = EXCLUDED.field_mapping,
      data_path = EXCLUDED.data_path,
      updated_at = NOW();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Paramount
--
-- Auth:   POST /ValidateCredentials { USERNAME, PASSWORD } → ACCESS_TOKEN
--         Token injected into step2 REQUEST BODY (not header)
-- Type:   SESSION_BODY  (NEW — implemented in document-service)
-- Claims: POST /GetClaimMISDetails { ACCESS_TOKEN, GROUP_CODE, POLICY_NUMBER, ... }
-- Response wrapped in "GetClaimMISDetailsResult" key
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.mstr_ext_application_ref (
  id,
  label, description, auth_type,
  verification_token_api_url, verification_token_api_method,
  verification_token_api_payload, step1_response_token_key,
  magic_url_api_url, magic_url_api_method,
  magic_url_api_payload,
  step2_response_data_key, container_category, is_active,
  iss, expires_in, created_by, updated_by,
  token_placement, token_body_key
) VALUES (
  NEXTVAL('mstr_ext_application_ref_id_seq'),
  'paramount-fetch-claims',
  'Paramount – GetClaimMISDetails (SESSION_BODY: ACCESS_TOKEN injected into request body)',
  'SESSION_BODY',
  'https://webintegrations.paramounttpa.com/iEnroll_API/Service1.svc/ValidateCredentials',
  'POST',
  '{
    "USERNAME": "INDIA_INSURE_USER",
    "PASSWORD": "INDIA@para2023"
  }'::jsonb,
  'ValidateCredentialsResult[0].ACCESS_TOKEN',
  'https://webintegrations.paramounttpa.com/iEnroll_API/Service1.svc/GetClaimMISDetails',
  'POST',
  '{
    "GROUP_CODE":               "{{groupCode}}",
    "POLICY_NUMBER":            "{{policyNo}}",
    "POLICY_COMMENCEMENT_DATE": "{{policyStartDate}}",
    "POLICY_VALID_UPDATE":      "{{policyEndDate}}"
  }'::jsonb,
  'GetClaimMISDetailsResult', 'claims', true, '', '1h', 1, 1,
  'NONE',
  'ACCESS_TOKEN'
)
ON CONFLICT DO NOTHING;

-- Paramount → mstr_tpa_claim_api_config
INSERT INTO public.mstr_tpa_claim_api_config
  (tpa_id, api_type, ref_id, dynamic_param_mapping, field_mapping, data_path, status_mapping)
SELECT
  t.id, 'FETCH_CLAIMS', ear.id,
  '{
    "policyNo":        "insurerPolicyNumber",
    "policyStartDate": "policyFrom",
    "policyEndDate":   "policyTo",
    "groupCode":       "externalTpaPolicyId"
  }',
  '{}',
  'GetClaimMISDetailsResult',
  '{"Settled":"settled","Approved":"settled","Rejected":"rejected","Cancelled":"rejected","Pending":"pending"}'
FROM public.tpa t
JOIN public.mstr_ext_application_ref ear
  ON ear.label = 'paramount-fetch-claims' AND ear.is_active = true
WHERE LOWER(t.name) ILIKE '%paramount%'
LIMIT 1
ON CONFLICT (tpa_id, api_type) DO UPDATE
  SET ref_id = EXCLUDED.ref_id, data_path = EXCLUDED.data_path, updated_at = NOW();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Vidal Health TPA
--
-- Auth:   No token step — Basic Auth + credentials as HTTP headers every call
--         Policy number and dates also go in headers (not body)
-- Type:   BASIC_AUTH  (NEW — implemented in document-service)
-- Claims: POST /rest/vidalbrokerservices/claimpreauthservice
--         All params in headers: Authorization(Basic), username, password, policyNo, startdate, enddate
-- Response: [{ Result: [...], Message: "..." }]  → data_path = [0].Result
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.mstr_ext_application_ref (
  id,
  label, description, auth_type,
  verification_token_api_url, verification_token_api_method,
  verification_token_api_payload, step1_response_token_key,
  magic_url_api_url, magic_url_api_method,
  magic_url_api_payload,
  step2_response_data_key, container_category, is_active,
  iss, expires_in, created_by, updated_by,
  token_placement, step2_header_template
) VALUES (
  NEXTVAL('mstr_ext_application_ref_id_seq'),
  'vidal-fetch-claims',
  'Vidal Health – claimpreauthservice (BASIC_AUTH: all credentials + policy in HTTP headers)',
  'BASIC_AUTH',
  '', '', NULL, '',
  'https://tips.vidalhealthtpa.com/rest/vidalbrokerservices/claimpreauthservice',
  'POST',
  '{}'::jsonb,
  '[0].Result', 'claims', true, '', '10m', 1, 1,
  'NONE',
  '{
    "Authorization": "Basic dmlkYWxicm9rZXJwcm9kbG9naW46dmlkYWxwcm9kQDEyMw==",
    "username":      "IN_prod78",
    "password":      "I~n!@p^r6#o7d",
    "policyNo":      "{{policyNo}}",
    "startdate":     "{{policyStartDate}}",
    "enddate":       "{{policyEndDate}}"
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Vidal → mstr_tpa_claim_api_config
INSERT INTO public.mstr_tpa_claim_api_config
  (tpa_id, api_type, ref_id, dynamic_param_mapping, field_mapping, data_path, status_mapping)
SELECT
  t.id, 'FETCH_CLAIMS', ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{}',
  '[0].Result',
  '{"Settled":"settled","Approved":"settled","Rejected":"rejected","Cancelled":"rejected","Pending":"pending","Outstanding":"pending"}'
FROM public.tpa t
JOIN public.mstr_ext_application_ref ear
  ON ear.label = 'vidal-fetch-claims' AND ear.is_active = true
WHERE LOWER(t.name) ILIKE '%vidal%'
LIMIT 1
ON CONFLICT (tpa_id, api_type) DO UPDATE
  SET ref_id = EXCLUDED.ref_id, data_path = EXCLUDED.data_path, updated_at = NOW();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Verification — show complete config after running
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  t.name                AS tpa_name,
  cfg.api_type,
  ear.label             AS app_key,
  ear.auth_type,
  ear.magic_url_api_url AS endpoint,
  cfg.data_path,
  CASE
    WHEN ear.step2_header_template IS NOT NULL THEN 'custom headers'
    WHEN ear.token_body_key        IS NOT NULL THEN 'token in body: ' || ear.token_body_key
    ELSE COALESCE(ear.token_placement, 'BEARER_HEADER')
  END                   AS auth_detail
FROM public.mstr_tpa_claim_api_config cfg
JOIN public.tpa                       t   ON t.id   = cfg.tpa_id
JOIN public.mstr_ext_application_ref  ear ON ear.id = cfg.ref_id
ORDER BY t.name, cfg.api_type;
