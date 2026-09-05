-- ═══════════════════════════════════════════════════════════════════════════════
-- FILE: tpa-master-seed.sql
-- PURPOSE: Single idempotent file — ALL TPAs, ALL API types
--          Safe to run multiple times — uses WHERE NOT EXISTS for inserts,
--          ON CONFLICT DO UPDATE for config table.
--
-- COVERS:
--   GoodHealth  → FETCH_CLAIMS, FETCH_CLAIM_STATUS, INTIMATE_CLAIM, ECARD, HOSPITAL_NETWORK
--   FHPL        → FETCH_CLAIMS, ECARD, HOSPITAL_NETWORK
--   MediAssist  → FETCH_CLAIMS, ECARD, HOSPITAL_NETWORK
--   Paramount   → FETCH_CLAIMS, ECARD, HOSPITAL_NETWORK
--   Vidal       → FETCH_CLAIMS, ECARD, HOSPITAL_NETWORK
--
-- PREREQUISITES (run once before this file):
--   tpa-dynamic-integration-framework.sql  → creates mstr_tpa_claim_api_config table
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER: safe INSERT pattern
-- INSERT only if label does not already exist → no duplicates ever
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. GOODHEALTH — webserv (DIRECT, no auth step)
-- ══════════════════════════════════════════════════════════════════════════════

-- 1a. FETCH_CLAIMS
INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'tpa-claims','GoodHealth – GetClaims (DIRECT: credentials in payload)','DIRECT',
  '','',NULL,'',
  'https://webserv.goodhealthtpa.in/api/Intermediary/GetClaims','POST',
  '{"userName":"IIRMHO","password":"IIRMHO","policyNo":"{{policyNo}}","policyStartDate":"{{policyStartDate}}","policyEndDate":"{{policyEndDate}}"}'::jsonb,
  'data','claims',true,'','10m',1,1,'BEARER_HEADER'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='tpa-claims');

-- 1b. FETCH_CLAIM_STATUS
INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'goodhealth-claim-status','GoodHealth – GetSingleClaimDetails (DIRECT)','DIRECT',
  '','',NULL,'',
  'https://webserv.goodhealthtpa.in/api/Intermediary/GetSingleClaimDetails','POST',
  '{"userName":"IIRMHO","password":"IIRMHO","policyNo":"{{policyNo}}","policyStartDate":"{{policyStartDate}}","policyEndDate":"{{policyEndDate}}","claimId":"{{claimId}}"}'::jsonb,
  'data','claims',true,'','10m',1,1,'BEARER_HEADER'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='goodhealth-claim-status');

-- 1c. INTIMATE_CLAIM (via ISBS BrokerClaimCreation)
INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'isbs-broker-claim','ISBS BrokerClaimCreation – claim submission for GoodHealth policies','DIRECT',
  '','',NULL,'',
  'https://dev.isbsindia.in/WebServ/api/Intermediary/BrokerClaimCreation','POST',
  '{"brokerUsername":"IIRMHO","brokerPassword":"IIRMHO","brokerAPIKey":"2sNt9WUV/FnDsHxVPZRVU9Vc2F7erhqXDzz6ViN30ldYrpa1XFhVfymy3pZHVkjwAY6xJ9eg3GuDYOX8n+42RumUQrt1c+rXejEBvFDzMCo=","ptGhCardId":"{{ptGhCardId}}","policyNo":"{{policyNo}}","clmPatientName":"{{clmPatientName}}","ptMobileNo":"{{ptMobileNo}}","ptEmail":"{{ptEmail}}","ghHospitalId":"{{ghHospitalId}}","clmRequestedAmt":"{{clmRequestedAmt}}","clmHospFrom":"{{clmHospFrom}}","clmHospTo":"{{clmHospTo}}","clmHospName":"{{clmHospName}}","clmCity":"{{clmCity}}","clmState":"{{clmState}}","clmHospAddress":"{{clmHospAddress}}","clmPincode":"{{clmPincode}}","clmReasonAdmission":"{{clmReasonAdmission}}","clmNatureOfLossCode":"Illness","clmCommunicationRemarks":"{{clmCommunicationRemarks}}","clmSubtype":"{{clmSubtype}}","clmTypeOfAdmission":"Emergency","moduleId":"1"}'::jsonb,
  'data','claims',true,'','10m',1,1,'BEARER_HEADER'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='isbs-broker-claim');

-- 1d. ECARD — GoodHealth MBT (SESSION)
INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'goodhealth-ecard','GoodHealth MBT – GetFamilyECard (SESSION → Bearer)','SESSION',
  'https://webace.goodhealthtpa.in:8081/mbt-prod/validateCredentials','POST',
  '{"userName":"IIRMHO","password":"IIRMHO","encrptedKey":"W{dH:}4eX!@hT%cBSY)!-7$#L6HC2"}'::jsonb,
  'sessionToken',
  'https://webace.goodhealthtpa.in:8081/mbt-prod/download/GetFamilyECard','POST',
  '{"policyNumber":"{{policyNo}}","policyCommencementDate":"{{policyStartDate}}","policyValidUpdate":"{{policyEndDate}}","employeeNumber":"{{employeeNumber}}"}'::jsonb,
  'ECARD_DOWNLOAD_URL','claims',true,'','30m',1,1,'BEARER_HEADER'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='goodhealth-ecard');

-- 1e. HOSPITAL_NETWORK — GoodHealth MBT (SESSION)
INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'goodhealth-hospital-network','GoodHealth MBT – GetProviderNetwork (SESSION → Bearer)','SESSION',
  'https://webace.goodhealthtpa.in:8081/mbt-prod/validateCredentials','POST',
  '{"userName":"IIRMHO","password":"IIRMHO","encrptedKey":"W{dH:}4eX!@hT%cBSY)!-7$#L6HC2"}'::jsonb,
  'sessionToken',
  'https://webace.goodhealthtpa.in:8081/mbt-prod/GetProviderNetwork','POST',
  '{"policyNumber":"{{policyNo}}","policyCommencementDate":"{{policyStartDate}}","policyValideUpdate":"{{policyEndDate}}"}'::jsonb,
  'hospitalsResponse','claims',true,'','30m',1,1,'BEARER_HEADER'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='goodhealth-hospital-network');


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. FHPL — GET token → Bearer header
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'fhpl-fetch-claims','FHPL – GetTPA_ClaimsDetails (SESSION: GET token → Bearer)','SESSION',
  'https://bconnect-api.fhpl.net/token','GET',
  '{"UserName":"IndiaInsure","Password":"fhnt56in","grant_type":"password"}'::jsonb,
  'access_token',
  'https://bconnect-api.fhpl.net/api/GetTPA_ClaimsDetails','POST',
  '{"UserName":"IndiaInsure","Password":"fhnt56in","PolicyNumber":"{{policyNo}}","FromDate":"{{policyStartDate}}","ToDate":"{{policyEndDate}}"}'::jsonb,
  'data','claims',true,'','1h',1,1,'BEARER_HEADER'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='fhpl-fetch-claims');

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'fhpl-ecard','FHPL – GetEcard (SESSION: GET token → Bearer)','SESSION',
  'https://bconnect-api.fhpl.net/token','GET',
  '{"UserName":"IndiaInsure","Password":"fhnt56in","grant_type":"password"}'::jsonb,
  'access_token',
  'https://bconnect-api.fhpl.net/api/GetEcard','POST',
  '{"UserName":"IndiaInsure","Password":"fhnt56in","EmployeeID":"{{employeeNumber}}","PolicyNumber":"{{policyNo}}"}'::jsonb,
  'data','claims',true,'','1h',1,1,'BEARER_HEADER'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='fhpl-ecard');

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'fhpl-hospital-network','FHPL – GetNetworkHospitalDetails (SESSION: GET token → Bearer)','SESSION',
  'https://bconnect-api.fhpl.net/token','GET',
  '{"UserName":"IndiaInsure","Password":"fhnt56in","grant_type":"password"}'::jsonb,
  'access_token',
  'https://bconnect-api.fhpl.net/api/GetNetworkHospitalDetails','POST',
  '{"UserName":"IndiaInsure","Password":"fhnt56in","InsuranceCode":"{{insuranceCode}}","StartIndex":0,"EndIndex":100}'::jsonb,
  'data','claims',true,'','1h',1,1,'BEARER_HEADER'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='fhpl-hospital-network');


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. MEDIASSIST — credentials always in HTTP headers (HEADER_CREDENTIALS)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,step2_header_template)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'mediassist-fetch-claims','MediAssist – ClaimDetail (HEADER_CREDENTIALS)','HEADER_CREDENTIALS',
  '','',NULL,'',
  'https://integration.medibuddy.in/ClaimAPIServiceV2/ClaimService/ClaimDetail','POST',
  '{"PolicyNo":"{{policyNo}}","startDate":"{{policyStartDate}}","endDate":"{{policyEndDate}}"}'::jsonb,
  'claimsData','claims',true,'','10m',1,1,
  'NONE','{"Username":"indiainsure","Password":"IndiaIns23t810mZoP9xV0"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='mediassist-fetch-claims');

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,step2_header_template)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'mediassist-ecard','MediAssist – EcardUrl (HEADER_CREDENTIALS)','HEADER_CREDENTIALS',
  '','',NULL,'',
  'https://integration.medibuddy.in/ClaimAPIServiceV2/ClaimService/EcardUrl','POST',
  '{"employeeId":"{{employeeNumber}}","PolicyNo":"{{policyNo}}"}'::jsonb,
  'ecardUrl','claims',true,'','10m',1,1,
  'NONE','{"Username":"indiainsure","Password":"IndiaIns23t810mZoP9xV0"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='mediassist-ecard');

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,step2_header_template)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'mediassist-hospital-network','MediAssist – NetworkHospital (HEADER_CREDENTIALS)','HEADER_CREDENTIALS',
  '','',NULL,'',
  'https://integration.medibuddy.in/ClaimAPIServiceV2/ClaimService/NetworkHospital','POST',
  '{"policyNumber":"{{policyNo}}"}'::jsonb,
  'providerData','claims',true,'','10m',1,1,
  'NONE','{"Username":"indiainsure","Password":"IndiaIns23t810mZoP9xV0"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='mediassist-hospital-network');


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. PARAMOUNT — step1 returns ACCESS_TOKEN, injected into step2 body (SESSION_BODY)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,token_body_key)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'paramount-fetch-claims','Paramount – GetClaimMISDetails (SESSION_BODY: token in request body)','SESSION_BODY',
  'https://webintegrations.paramounttpa.com/iEnroll_API/Service1.svc/ValidateCredentials','POST',
  '{"USERNAME":"INDIA_INSURE_USER","PASSWORD":"INDIA@para2023"}'::jsonb,
  'ValidateCredentialsResult[0].ACCESS_TOKEN',
  'https://webintegrations.paramounttpa.com/iEnroll_API/Service1.svc/GetClaimMISDetails','POST',
  '{"GROUP_CODE":"{{groupCode}}","POLICY_NUMBER":"{{policyNo}}","POLICY_COMMENCEMENT_DATE":"{{policyStartDate}}","POLICY_VALID_UPDATE":"{{policyEndDate}}"}'::jsonb,
  'GetClaimMISDetailsResult','claims',true,'','1h',1,1,'NONE','ACCESS_TOKEN'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='paramount-fetch-claims');

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,token_body_key)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'paramount-ecard','Paramount – GetFamilyECard (SESSION_BODY: token in request body)','SESSION_BODY',
  'https://webintegrations.paramounttpa.com/iEnroll_API/Service1.svc/ValidateCredentials','POST',
  '{"USERNAME":"INDIA_INSURE_USER","PASSWORD":"INDIA@para2023"}'::jsonb,
  'ValidateCredentialsResult[0].ACCESS_TOKEN',
  'https://webintegrations.paramounttpa.com/iEnroll_API/Service1.svc/GetFamilyECard','POST',
  '{"GROUP_CODE":"{{groupCode}}","POLICY_NUMBER":"{{policyNo}}","POLICY_COMMENCEMENT_DATE":"{{policyStartDate}}","POLICY_VALID_UPDATE":"{{policyEndDate}}","EMPLOYEE_NUMBER":"{{employeeNumber}}"}'::jsonb,
  'GetFamilyECardResult','claims',true,'','1h',1,1,'NONE','ACCESS_TOKEN'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='paramount-ecard');

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,token_body_key)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'paramount-hospital-network','Paramount – GetProviderNetwork (SESSION_BODY: token in request body)','SESSION_BODY',
  'https://webintegrations.paramounttpa.com/iEnroll_API/Service1.svc/ValidateCredentials','POST',
  '{"USERNAME":"INDIA_INSURE_USER","PASSWORD":"INDIA@para2023"}'::jsonb,
  'ValidateCredentialsResult[0].ACCESS_TOKEN',
  'https://webintegrations.paramounttpa.com/iEnroll_API/Service1.svc/GetProviderNetwork','POST',
  '{"GROUP_CODE":"{{groupCode}}","POLICY_NUMBER":"{{policyNo}}","POLICY_COMMENCEMENT_DATE":"{{policyStartDate}}","POLICY_VALID_UPDATE":"{{policyEndDate}}"}'::jsonb,
  'GetProviderNetworkResult','claims',true,'','1h',1,1,'NONE','ACCESS_TOKEN'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='paramount-hospital-network');


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. VIDAL — Basic Auth + all params in HTTP headers (BASIC_AUTH)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,step2_header_template)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'vidal-fetch-claims','Vidal Health – claimpreauthservice (BASIC_AUTH: all in HTTP headers)','BASIC_AUTH',
  '','',NULL,'',
  'https://tips.vidalhealthtpa.com/rest/vidalbrokerservices/claimpreauthservice','POST',
  '{}'::jsonb,
  '[0].Result','claims',true,'','10m',1,1,'NONE',
  '{"Authorization":"Basic dmlkYWxicm9rZXJwcm9kbG9naW46dmlkYWxwcm9kQDEyMw==","username":"IN_prod78","password":"I~n!@p^r6#o7d","policyNo":"{{policyNo}}","startdate":"{{policyStartDate}}","enddate":"{{policyEndDate}}"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='vidal-fetch-claims');

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,step2_header_template)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'vidal-ecard','Vidal Health – ecardservice (BASIC_AUTH: credentials + params in headers)','BASIC_AUTH',
  '','',NULL,'',
  'https://tips.vidalhealthtpa.com/rest/vidalbrokerservices/ecardservice','POST',
  '{}'::jsonb,
  '[0].Result[0].ECardDownloadLink','claims',true,'','10m',1,1,'NONE',
  '{"Authorization":"Basic dmlkYWxicm9rZXJwcm9kbG9naW46dmlkYWxwcm9kQDEyMw==","username":"IN_prod78","password":"I~n!@p^r6#o7d","policyNo":"{{policyNo}}","enrollmentNo":"{{employeeNumber}}"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='vidal-ecard');

INSERT INTO public.mstr_ext_application_ref
  (id,label,description,auth_type,verification_token_api_url,verification_token_api_method,
   verification_token_api_payload,step1_response_token_key,magic_url_api_url,magic_url_api_method,
   magic_url_api_payload,step2_response_data_key,container_category,is_active,iss,expires_in,
   created_by,updated_by,token_placement,step2_header_template)
SELECT NEXTVAL('mstr_ext_application_ref_id_seq'),
  'vidal-hospital-network','Vidal Health – hospitalnetwork (BASIC_AUTH: credentials + policy in headers)','BASIC_AUTH',
  '','',NULL,'',
  'https://tips.vidalhealthtpa.com/rest/vidalbrokerservices/hospitalnetwork','POST',
  '{}'::jsonb,
  'Result','claims',true,'','10m',1,1,'NONE',
  '{"Authorization":"Basic dmlkYWxicm9rZXJwcm9kbG9naW46dmlkYWxwcm9kQDEyMw==","username":"IN_prod78","password":"I~n!@p^r6#o7d","Policynumber":"{{policyNo}}","startdate":"{{policyStartDate}}","enddate":"{{policyEndDate}}"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label='vidal-hospital-network');


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. mstr_tpa_claim_api_config — link every TPA to its API refs
--    ON CONFLICT DO UPDATE = safe to re-run
-- ══════════════════════════════════════════════════════════════════════════════

-- ── GoodHealth ──────────────────────────────────────────────────────────────
INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'FETCH_CLAIMS',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{}',NULL,'{"Settled":"settled","Approved":"settled","PAID":"settled","Rejected":"rejected","Cancelled":"rejected","Pending":"pending","OUTSTANDING":"pending"}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='tpa-claims' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%good%health%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'FETCH_CLAIM_STATUS',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyStartDate","policyEndDate":"policyEndDate","claimId":"tpaClaimNo"}',
  '{}',NULL,'{"Settled":"settled","Approved":"settled","Rejected":"rejected","Cancelled":"rejected","Pending":"pending"}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='goodhealth-claim-status' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%good%health%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'INTIMATE_CLAIM',ear.id,
  '{"ptGhCardId":"patientTpaId","policyNo":"insurerPolicyNumber","clmPatientName":"patientName","ptMobileNo":"employeePhone","ptEmail":"employeeEmail"}',
  '{}',NULL,'{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='isbs-broker-claim' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%good%health%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'ECARD',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo","employeeNumber":"companyEmployeeId"}',
  '{}',NULL,'{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='goodhealth-ecard' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%good%health%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'HOSPITAL_NETWORK',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{}','hospitalsResponse','{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='goodhealth-hospital-network' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%good%health%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

-- ── FHPL ────────────────────────────────────────────────────────────────────
INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'FETCH_CLAIMS',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{}',NULL,'{"Settled":"settled","Paid":"settled","Rejected":"rejected","Pending":"pending","Outstanding":"pending"}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='fhpl-fetch-claims' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%fhpl%' OR LOWER(t.name) ILIKE '%family health plan%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'ECARD',ear.id,
  '{"policyNo":"insurerPolicyNumber","employeeNumber":"companyEmployeeId"}',
  '{}',NULL,'{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='fhpl-ecard' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%fhpl%' OR LOWER(t.name) ILIKE '%family health plan%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'HOSPITAL_NETWORK',ear.id,
  '{"policyNo":"insurerPolicyNumber","insuranceCode":"insurerPolicyNumber"}',
  '{}',NULL,'{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='fhpl-hospital-network' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%fhpl%' OR LOWER(t.name) ILIKE '%family health plan%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

-- ── MediAssist ───────────────────────────────────────────────────────────────
INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'FETCH_CLAIMS',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{"tpA_CLAIM_NO":"TPA_CLAIM_NO","tpA_HEALTH_ID":"TPA_ID","claiM_REGISTERED_DATE":"CLAIM_REGISTERED_DATE","datE_OF_ADMISSION":"DATE_OF_ADMISSION","datE_OF_DISCHARGE":"DATE_OF_DISCHARGE","status":"CLAIM_STATUS","paiD_AMOUNT":"PAID_AMOUNT","claiM_APPROVED_AMOUNT":"APPROVED_AMOUNT","hospitaL_NAME":"HOSPITAL_NAME","hospitaL_CITY":"HOSPITAL_CITY","hospitaL_STATE":"HOSPITAL_STATE","employeE_NAME":"EMPLOYEE_NAME","employeE_NO":"EMPLOYEE_NO","suM_INSURED":"SUM_INSURED","balancE_SI":"BALANCE_SUM_INSURED","typE_OF_CLAIM":"CLAIM_TYPE","beneficiarY_NAME":"PATIENT_NAME","relation":"PATIENT_RELATION","datE_OF_SETTLEMENT":"DATE_OF_SETTLEMENT","settledamt":"CHEQUE_AMOUNT","hospitaL_ADDRESS":"HOSPITAL_ADDRESS","hosP_PINCODE":"HOSPITAL_PINCODE","insurancE_CLAIM_NO":"INSURANCE_CLAIM_NO","policY_NUMBER":"POLICY_NO"}',
  'claimsData','{"OUTSTANDING":"pending","UNDER PROCESS":"pending","PAID":"settled","DEFICIENT":"pending","REJECTED":"rejected"}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='mediassist-fetch-claims' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%mediassist%' OR LOWER(t.name) ILIKE '%medi assist%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,field_mapping=EXCLUDED.field_mapping,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'ECARD',ear.id,
  '{"policyNo":"insurerPolicyNumber","employeeNumber":"companyEmployeeId"}',
  '{}',NULL,'{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='mediassist-ecard' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%mediassist%' OR LOWER(t.name) ILIKE '%medi assist%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'HOSPITAL_NETWORK',ear.id,
  '{"policyNo":"insurerPolicyNumber"}',
  '{"hosidnO1":"HOSPITAL_ID","hospitaL_NAME":"HOSPITAL_NAME","citY_NAME":"HOSPITAL_CITY","statE_NAME":"HOSPITAL_STATE","piN_CODE":"HOSPITAL_PINCODE","phonE_NO":"PHONE_NO","addresS1":"HOSPITAL_ADDRESS","leveL_OF_CARE":"LEVEL_OF_CARE","rohinI_CODE":"ROHINI_CODE"}',
  'providerData','{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='mediassist-hospital-network' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%mediassist%' OR LOWER(t.name) ILIKE '%medi assist%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

-- ── Paramount ────────────────────────────────────────────────────────────────
INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'FETCH_CLAIMS',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo","groupCode":"externalTpaPolicyId"}',
  '{}','GetClaimMISDetailsResult','{"Settled":"settled","Rejected":"rejected","Pending":"pending"}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='paramount-fetch-claims' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%paramount%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'ECARD',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo","groupCode":"externalTpaPolicyId","employeeNumber":"companyEmployeeId"}',
  '{}','GetFamilyECardResult','{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='paramount-ecard' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%paramount%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'HOSPITAL_NETWORK',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo","groupCode":"externalTpaPolicyId"}',
  '{}','GetProviderNetworkResult','{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='paramount-hospital-network' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%paramount%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

-- ── Vidal ────────────────────────────────────────────────────────────────────
INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'FETCH_CLAIMS',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{}','[0].Result','{"Settled":"settled","Rejected":"rejected","Pending":"pending","Outstanding":"pending"}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='vidal-fetch-claims' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%vidal%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'ECARD',ear.id,
  '{"policyNo":"insurerPolicyNumber","employeeNumber":"employeeTpaId"}',
  '{}',NULL,'{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='vidal-ecard' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%vidal%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();

INSERT INTO public.mstr_tpa_claim_api_config (tpa_id,api_type,ref_id,dynamic_param_mapping,field_mapping,data_path,status_mapping)
SELECT t.id,'HOSPITAL_NETWORK',ear.id,
  '{"policyNo":"insurerPolicyNumber","policyStartDate":"policyFrom","policyEndDate":"policyTo"}',
  '{"HOSPITALID":"HOSPITAL_ID","HOSPITALNAME":"HOSPITAL_NAME","CITYNAME":"HOSPITAL_CITY","STATENAME":"HOSPITAL_STATE","PINCODE":"HOSPITAL_PINCODE","PHONENUMBER":"PHONE_NO","ADDRESSLINE1":"HOSPITAL_ADDRESS","LEVELOFCARE":"LEVEL_OF_CARE","ROHINIID":"ROHINI_CODE"}',
  'Result','{}'
FROM public.tpa t JOIN public.mstr_ext_application_ref ear ON ear.label='vidal-hospital-network' AND ear.is_active=true
WHERE LOWER(t.name) ILIKE '%vidal%' LIMIT 1
ON CONFLICT (tpa_id,api_type) DO UPDATE SET ref_id=EXCLUDED.ref_id,updated_at=NOW();


-- ══════════════════════════════════════════════════════════════════════════════
-- VERIFY — run to confirm everything looks correct
-- ══════════════════════════════════════════════════════════════════════════════
SELECT
  t.name        AS tpa_name,
  cfg.api_type,
  ear.label     AS app_key,
  ear.auth_type,
  CASE WHEN ear.step2_header_template IS NOT NULL THEN 'custom-headers'
       WHEN ear.token_body_key IS NOT NULL THEN 'token-in-body'
       ELSE 'bearer-header' END AS auth_detail
FROM public.mstr_tpa_claim_api_config cfg
JOIN public.tpa t   ON t.id   = cfg.tpa_id
JOIN public.mstr_ext_application_ref ear ON ear.id = cfg.ref_id
ORDER BY t.name, cfg.api_type;
