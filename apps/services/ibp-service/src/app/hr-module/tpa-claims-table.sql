-- TPA Claims Data table — stores fetched claim records from GoodHealth TPA
-- data_type: 'MIS' = summary list from GetClaimMISDetails
--           'INDIVIDUAL' = full detail from GetIndividualClaimDetail

CREATE TABLE IF NOT EXISTS public.tpa_claim_data (
    id              SERIAL PRIMARY KEY,
    policy_number   VARCHAR(100)  NOT NULL,
    tpa_claim_no    VARCHAR(100),
    employee_tpa_id VARCHAR(100),
    data_type       VARCHAR(20)   NOT NULL DEFAULT 'MIS',
    claim_data      JSONB         NOT NULL,
    fetched_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- Idempotent migration: add employee_tpa_id to pre-existing tables
ALTER TABLE public.tpa_claim_data ADD COLUMN IF NOT EXISTS employee_tpa_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_tpa_claim_data_policy      ON public.tpa_claim_data (policy_number);
CREATE INDEX IF NOT EXISTS idx_tpa_claim_data_claim_no    ON public.tpa_claim_data (tpa_claim_no);
CREATE INDEX IF NOT EXISTS idx_tpa_claim_data_emp_tpa_id  ON public.tpa_claim_data (employee_tpa_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- mstr_ext_application_ref entries for claims (SESSION auth, same login step)
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Claims MIS (summary list for a policy)
INSERT INTO public.mstr_ext_application_ref (
    id, label, description,
    verification_token_api_url, verification_token_api_method, verification_token_api_payload,
    magic_url_api_url, magic_url_api_method, magic_url_api_payload,
    container_category, is_active, iss, expires_in,
    created_at, updated_at, created_by, updated_by,
    auth_type, step1_response_token_key, step2_response_data_key
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM public.mstr_ext_application_ref),
    'claims',
    'GoodHealth TPA — Get Claims MIS Details for a policy',
    'https://webace.goodhealthtpa.in:8081/mbt-prod/validateCredentials', 'POST',
    '{"userName":"IIRMHO","password":"IIRMHO","encrptedKey":"W{dH:}4eX!@hT%cBSY)!-7$#L6HC2"}'::jsonb,
    'https://webace.goodhealthtpa.in:8081/mbt-prod/GetClaimMISDetails', 'POST',
    '{"policyNumber":"{{policyNumber}}","policyCommencementDate":"{{policyCommencementDate}}","policyValidUpdate":"{{policyValidUpdate}}"}'::jsonb,
    'claims', true, 'ibp', '10m', NOW(), NOW(), 1, 1,
    'SESSION', 'sessionToken', 'body'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label = 'claims');

-- 2. Individual claim detail
INSERT INTO public.mstr_ext_application_ref (
    id, label, description,
    verification_token_api_url, verification_token_api_method, verification_token_api_payload,
    magic_url_api_url, magic_url_api_method, magic_url_api_payload,
    container_category, is_active, iss, expires_in,
    created_at, updated_at, created_by, updated_by,
    auth_type, step1_response_token_key, step2_response_data_key
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM public.mstr_ext_application_ref),
    'individual-claim',
    'GoodHealth TPA — Get Individual Claim Detail',
    'https://webace.goodhealthtpa.in:8081/mbt-prod/validateCredentials', 'POST',
    '{"userName":"IIRMHO","password":"IIRMHO","encrptedKey":"W{dH:}4eX!@hT%cBSY)!-7$#L6HC2"}'::jsonb,
    'https://webace.goodhealthtpa.in:8081/mbt-prod/GetIndividualClaimDetail', 'POST',
    '{"policyNumber":"{{policyNumber}}","policyCommencementDate":"{{policyCommencementDate}}","policyValidUpdate":"{{policyValidUpdate}}","tpaCLaimNumber":"{{tpaClaimNumber}}","tpaClaimExtension":"{{tpaClaimExtension}}","claim_Registered":"{{claimRegistered}}"}'::jsonb,
    'individual-claim', true, 'ibp', '10m', NOW(), NOW(), 1, 1,
    'SESSION', 'sessionToken', 'body'
WHERE NOT EXISTS (SELECT 1 FROM public.mstr_ext_application_ref WHERE label = 'individual-claim');
