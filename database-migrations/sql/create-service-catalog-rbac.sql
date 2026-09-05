-- 1) Create a new ACL category for Service Catalog
------------------------------------------------------------
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
    'Service Catalog'        AS name,
    'Service Catalog'        AS description,
    NOW()                    AS created_at,
    NOW()                    AS updated_at,
    'system'                 AS created_by,
    'system'                 AS updated_by,
    'SERVICE_CATALOG'        AS parent,
    'SERVICE_CATALOG'        AS category_key,
    'iWork'                  AS application_scope
WHERE NOT EXISTS (
    SELECT 1
    FROM public.acl_categories
    WHERE category_key = 'SERVICE_CATALOG'
);

------------------------------------------------------------
-- 2) Map existing actions to the Service Catalog category
--    (READ_001 ONLY)
------------------------------------------------------------
INSERT INTO public.acl_category_action_map (
    acl_category_id,
    acl_action_id,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    c.id AS acl_category_id,
    a.id AS acl_action_id,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_categories c
JOIN public.acl_actions a
  ON a.action_key IN (
        'READ_001'
     )
WHERE c.category_key = 'SERVICE_CATALOG'
  AND NOT EXISTS (
      SELECT 1
      FROM public.acl_category_action_map cam
      WHERE cam.acl_category_id = c.id
        AND cam.acl_action_id   = a.id
  );

------------------------------------------------------------
-- 3) Grant Service Catalog permissions to Super User ONLY
-----------------------------------------------------------
INSERT INTO public.role_acl_category_action_map (
    role_id,
    acl_category_action_id,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    r.id AS role_id,
    cam.id AS acl_category_action_id,
    NOW(),
    NOW(),
    1,
    1
FROM public.roles r
JOIN public.acl_category_action_map cam
  ON 1 = 1
JOIN public.acl_categories c
  ON c.id = cam.acl_category_id
WHERE c.category_key = 'SERVICE_CATALOG'
  AND r.name = 'Super User'
  AND NOT EXISTS (
      SELECT 1
      FROM public.role_acl_category_action_map racam
      WHERE racam.role_id = r.id
        AND racam.acl_category_action_id = cam.id
  );

COMMIT;
