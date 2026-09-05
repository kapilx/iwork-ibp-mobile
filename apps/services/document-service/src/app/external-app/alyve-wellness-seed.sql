-- Alyve Health Wellness Portal SSO — DB seed
-- auth_type = SESSION:
--   Step 1: POST generate_tokens (no Bearer) → jsonData.access_token
--   Step 2: POST send_embedded_user_details_v2 (Bearer <access_token>) → jsonData.redirect_url
-- dynamicFields sent from frontend: mobile, name, gender, dob

INSERT INTO mstr_ext_application_ref (
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
    'alyve-wellness',
    'Alyve Health Wellness Portal SSO',
    'SESSION',
    'https://preprod.immunityhealth.me/api/embeddedlogin/generate_tokens',
    'POST',
    '{
        "grant_type": "client_credentials",
        "client_id": 51,
        "client_secret": "XZE5i34wMHJyvdCtIhrqSy72ofPtiBPgSw9I9FCO",
        "redirect_uri": "https://iirm.redirect.url"
    }'::jsonb,
    'jsonData.access_token',
    'https://preprod.immunityhealth.me/api/embeddedlogin/send_embedded_user_details_v2',
    'POST',
    '{
        "partner_id": "741",
        "client_id": 51,
        "platform_id": "1307",
        "customer_id": "1328",
        "mobile": "{{mobile}}",
        "name": "{{name}}",
        "gender": "{{gender}}",
        "dob": "{{dob}}"
    }'::jsonb,
    'jsonData.redirect_url',
    'wellness',
    true,
    '',
    '10m',
    1,
    1
);
