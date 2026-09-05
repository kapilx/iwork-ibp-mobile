-- GoodHealth TPA – GetSingleClaimDetails
-- auth_type = DIRECT: credentials embedded in payload, no auth step.
-- Dynamic fields resolved at call time from our claim + policy data.

INSERT INTO public.mstr_ext_application_ref (
    id,
    label,
    description,
    auth_type,
    verification_token_api_url,
    verification_token_api_method,
    verification_token_api_payload,
    step1_response_token_key,
    magic_url_api_url,
    magic_url_api_method,
    magic_url_api_payload,
    step2_response_data_key,
    container_category,
    is_active,
    iss,
    expires_in,
    created_by,
    updated_by
) VALUES (
    NEXTVAL('mstr_ext_application_ref_id_seq'),
    'goodhealth-claim-status',
    'GoodHealth TPA – GetSingleClaimDetails: fetch live status for a specific claim',
    'DIRECT',
    '',
    '',
    NULL,
    '',
    'https://webserv.goodhealthtpa.in/api/Intermediary/GetSingleClaimDetails',
    'POST',
    '{
        "userName":        "IIRMHO",
        "password":        "IIRMHO",
        "policyNo":        "{{policyNo}}",
        "policyStartDate": "{{policyStartDate}}",
        "policyEndDate":   "{{policyEndDate}}",
        "claimId":         "{{claimId}}"
    }'::jsonb,
    'data',
    'claims',
    true,
    '',
    '10m',
    1,
    1
);
