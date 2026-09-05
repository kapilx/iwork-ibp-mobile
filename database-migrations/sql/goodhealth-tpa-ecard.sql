-- Good Health TPA: E-Card via TPA ID (DIRECT flow)
-- Single POST to GetEcard with credentials in body — no separate login step,
-- no Bearer header sent. Matches the direct API behaviour.

DELETE FROM public.mstr_ext_application_ref WHERE label IN ('ecard', 'ecard-tpaid');

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
    'ecard-tpaid',
    'Good Health TPA - Get E-Card by TPA ID (direct, no session)',
    'DIRECT',
    'https://webserv.goodhealthtpa.in/api/Intermediary/GetEcard',
    'POST',
    '{}'::jsonb,
    'https://webserv.goodhealthtpa.in/api/Intermediary/GetEcard',
    'POST',
    '{
        "UserName": "IIRMHO",
        "Password": "IIRMHO",
        "PolicyNo": "",
        "EmployeeNo": "",
        "TPAId": "{{tpaId}}"
    }'::jsonb,
    'ecard',
    true,
    'ibp',
    '10m',
    'sessionToken',
    1,
    1
);
