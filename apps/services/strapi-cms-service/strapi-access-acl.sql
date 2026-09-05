-- ================================================================
-- Strapi Access Control List (ACL) Setup Script
-- Creates: STRAPI_ACCESS category with STRAPI_ADMIN and STRAPI_READ actions
-- ================================================================

-- Step 1: Insert the STRAPI_ACCESS category
INSERT INTO public.acl_categories (
    name,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by,
    parent,
    category_key,
    application_scope
)
SELECT
    'Strapi Access',
    'Access control for Strapi CMS administration',
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM',
    'STRAPI_ACCESS',
    'STRAPI_ACCESS',
    'iWork'
WHERE NOT EXISTS (
    SELECT 1
    FROM public.acl_categories
    WHERE category_key = 'STRAPI_ACCESS'
);

-- Step 2: Insert new actions for Strapi (STRAPI_ADMIN_001 and STRAPI_READ_001)
INSERT INTO public.acl_actions (
    name,
    action_key,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    'Strapi Admin',
    'STRAPI_ADMIN_001',
    'Full administrative access to Strapi CMS',
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
WHERE NOT EXISTS (
    SELECT 1
    FROM public.acl_actions
    WHERE action_key = 'STRAPI_ADMIN_001'
);

INSERT INTO public.acl_actions (
    name,
    action_key,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    'Strapi Read',
    'STRAPI_READ_001',
    'Read-only access to Strapi CMS',
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
WHERE NOT EXISTS (
    SELECT 1
    FROM public.acl_actions
    WHERE action_key = 'STRAPI_READ_001'
);

-- Step 3: Map actions to the STRAPI_ACCESS category
INSERT INTO public.acl_category_action_map (
    acl_category_id,
    acl_action_id,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    c.id,
    a.id,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_categories c
JOIN public.acl_actions a
    ON a.action_key IN ('STRAPI_ADMIN_001', 'STRAPI_READ_001')
WHERE c.category_key = 'STRAPI_ACCESS'
AND NOT EXISTS (
    SELECT 1
    FROM public.acl_category_action_map cam
    WHERE cam.acl_category_id = c.id
    AND cam.acl_action_id = a.id
);

-- Step 4: Assign to Super User role
INSERT INTO public.role_acl_category_action_map (
    role_id,
    acl_category_action_id,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    r.id,
    cam.id,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.roles r
JOIN public.acl_category_action_map cam ON 1 = 1
JOIN public.acl_categories c ON c.id = cam.acl_category_id
WHERE c.category_key = 'STRAPI_ACCESS'
AND r.name = 'Super User'
AND NOT EXISTS (
    SELECT 1
    FROM public.role_acl_category_action_map racam
    WHERE racam.role_id = r.id
    AND racam.acl_category_action_id = cam.id
);

-- Step 5: Create API mappings for Strapi access endpoints
-- Note: Maps multiple HTTP methods for admin access

-- STRAPI_ADMIN_001: Full access to all HTTP methods
INSERT INTO public.acl_category_action_api_map (
    acl_category_action_id,
    api,
    method,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    cam.id,
    'strapi-admin-access' AS api,
    methods.method,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON c.id = cam.acl_category_id
JOIN public.acl_actions a ON a.id = cam.acl_action_id
CROSS JOIN (
    SELECT 'GET' AS method
    UNION SELECT 'POST'
    UNION SELECT 'PUT'
    UNION SELECT 'PATCH'
    UNION SELECT 'DELETE'
) methods
WHERE c.category_key = 'STRAPI_ACCESS'
AND a.action_key = 'STRAPI_ADMIN_001'
AND NOT EXISTS (
    SELECT 1
    FROM public.acl_category_action_api_map api_map
    WHERE api_map.acl_category_action_id = cam.id
    AND api_map.method = methods.method
);

-- STRAPI_READ_001: Read-only access (GET only)
INSERT INTO public.acl_category_action_api_map (
    acl_category_action_id,
    api,
    method,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    cam.id,
    'strapi-admin-access' AS api,
    'GET' AS method,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON c.id = cam.acl_category_id
JOIN public.acl_actions a ON a.id = cam.acl_action_id
WHERE c.category_key = 'STRAPI_ACCESS'
AND a.action_key = 'STRAPI_READ_001'
AND NOT EXISTS (
    SELECT 1
    FROM public.acl_category_action_api_map api_map
    WHERE api_map.acl_category_action_id = cam.id
    AND api_map.method = 'GET'
);

-- Verification query
SELECT 
    'VERIFICATION' as status,
    c.name as category_name,
    c.category_key,
    a.name as action_name,
    a.action_key
FROM public.acl_categories c
JOIN public.acl_category_action_map cam ON cam.acl_category_id = c.id
JOIN public.acl_actions a ON a.id = cam.acl_action_id
WHERE c.category_key = 'STRAPI_ACCESS'
ORDER BY a.action_key;
