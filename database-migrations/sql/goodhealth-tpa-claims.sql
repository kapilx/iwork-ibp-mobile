-- Good Health TPA: Get Claims Data (DIRECT flow)
-- Single POST to GetClaims with credentials in body — no separate login step,
-- no Bearer header sent. Same pattern as GetEcard.

DELETE FROM public.mstr_ext_application_ref WHERE label = 'tpa-claims';

INSERT INTO public.mstr_ext_application_ref (
    id,
    label,
    description,
    auth_type,
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
    step1_response_token_key,
    created_by,
    updated_by
) VALUES (
    (SELECT COALESCE(MAX(id), 0) + 1 FROM public.mstr_ext_application_ref),
    'tpa-claims',
    'Good Health TPA - Get Claims by Policy and Date Range (direct, no session)',
    'DIRECT',
    'https://webserv.goodhealthtpa.in/api/Intermediary/GetClaims',
    'POST',
    '{}'::jsonb,
    'https://webserv.goodhealthtpa.in/api/Intermediary/GetClaims',
    'POST',
    '{
        "userName": "IIRMHO",
        "password": "IIRMHO",
        "policyNo": "{{policyNo}}",
        "policyStartDate": "{{policyStartDate}}",
        "policyEndDate": "{{policyEndDate}}"
    }'::jsonb,
    'claims',
    true,
    'ibp',
    '10m',
    'sessionToken',
    1,
    1
);
