-- Good Health TPA: Get Network Hospital Information (SESSION flow)
-- Step 1: Login via validateCredentials → returns sessionToken
-- Step 2: GetHospitalInfo with pagination, sessionToken sent as Bearer header

DELETE FROM public.mstr_ext_application_ref WHERE label = 'hospital-info';

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
    'hospital-info',
    'Good Health TPA - Login then Get Network Hospital Information',
    'SESSION',
    'https://webace.goodhealthtpa.in:8081/mbt-prod/validateCredentials',
    'POST',
    '{
        "userName": "IIRMHO",
        "password": "IIRMHO",
        "encrptedKey": "W{dH:}4eX!@hT%cBSY)!-7$#L6HC2"
    }'::jsonb,
    'https://webserv.goodhealthtpa.in/api/Intermediary/GetHospitalInfo',
    'POST',
    '{
        "UserName": "IIRMHO",
        "Password": "IIRMHO",
        "StartIndex": "{{startIndex}}",
        "EndIndex": "{{endIndex}}"
    }'::jsonb,
    'hospital',
    true,
    'ibp',
    '10m',
    'sessionToken',
    1,
    1
);
