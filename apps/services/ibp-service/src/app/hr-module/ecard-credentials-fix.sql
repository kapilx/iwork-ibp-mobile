-- Insert ecard row into mstr_ext_application_ref
-- Good Health TPA two-step flow: SESSION auth (credential login → session token → download e-card)
-- Step 1 payload uses static TPA credentials (not templates), so the frontend never sends them.
-- Step 2 payload uses {{placeholders}} resolved from dynamicFields sent by the frontend.
--
-- Run this only if the 'ecard' row does not yet exist in the table.

INSERT INTO public.mstr_ext_application_ref (
    id,
    label,
    description,
    verification_token_api_url,
    verification_token_api_method,
    verification_token_api_payload,
    magic_url_api_url,
    magic_url_api_method,
    magic_url_api_payload,
    container_category,
    is_active,
    iss,
    expires_in,
    created_at,
    updated_at,
    created_by,
    updated_by,
    auth_type,
    step1_response_token_key,
    step2_response_data_key
)
SELECT
    (SELECT COALESCE(MAX(id), 0) + 1 FROM public.mstr_ext_application_ref),
    'ecard',
    'Good Health TPA E-Card Integration',

    -- Step 1: Login — static credentials stored here, NOT sent from frontend
    'https://webace.goodhealthtpa.in:8081/mbt-prod/validateCredentials',
    'POST',
    '{
        "userName": "IIRMHO",
        "password": "IIRMHO",
        "encrptedKey": "W{dH:}4eX!@hT%cBSY)!-7$#L6HC2"
    }'::jsonb,

    -- Step 2: Download e-card — dynamic fields injected from frontend dynamicFields
    'https://webace.goodhealthtpa.in:8081/mbt-prod/download/GetFamilyMemberECard',
    'POST',
    '{
        "policyNumber": "{{policyNumber}}",
        "policyCommencementDate": "{{policyCommencementDate}}",
        "policyValideUpdate": "{{policyValideUpdate}}",
        "employeeNumber": "{{employeeNumber}}",
        "tpaId": "{{tpaId}}"
    }'::jsonb,

    'ecard',
    true,
    'ibp',
    '10m',
    NOW(),
    NOW(),
    1,
    1,
    'SESSION',
    'sessionToken',
    'ECARD_DOWNLOAD_URL'
WHERE NOT EXISTS (
    SELECT 1 FROM public.mstr_ext_application_ref WHERE label = 'ecard'
);
