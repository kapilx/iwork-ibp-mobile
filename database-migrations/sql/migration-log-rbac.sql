-- Grants Admin Module access to the new "Migration Log" screen (lists the
-- generic migration_log table via GET /policy/company-policy-migration-log
-- — route path unchanged even though the underlying table was renamed).
-- Read-only feature, so — matching the ADMIN_REPORTS/ADMIN_ROLES/
-- ADMIN_RELEASE_NOTES precedent — granted to both 'Super User' and
-- 'Super User Read Only'. Idempotent: safe to re-run.

BEGIN;

------------------------------------------------------------
-- 1) Create a new ACL category for Migration Log
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
    'Migration Log'          AS name,
    'Migration Log'          AS description,
    NOW()                    AS created_at,
    NOW()                    AS updated_at,
    'system'                 AS created_by,
    'system'                 AS updated_by,
    'MIGRATION_LOG'          AS parent,
    'MIGRATION_LOG'          AS category_key,
    'iWork'                  AS application_scope
WHERE NOT EXISTS (
    SELECT 1
    FROM public.acl_categories
    WHERE category_key = 'MIGRATION_LOG'
);

------------------------------------------------------------
-- 2) Map the Read action to the Migration Log category
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
    'system',
    'system'
FROM public.acl_categories c
JOIN public.acl_actions a
  ON a.action_key = 'READ_001'
WHERE c.category_key = 'MIGRATION_LOG'
  AND NOT EXISTS (
      SELECT 1
      FROM public.acl_category_action_map cam
      WHERE cam.acl_category_id = c.id
        AND cam.acl_action_id   = a.id
  );

------------------------------------------------------------
-- 3) Map the GET /policy/company-policy-migration-log API to that
--    category-action
------------------------------------------------------------
INSERT INTO public.acl_category_action_api_map (
    acl_category_action_id,
    api,
    method,
    created_by,
    updated_by
)
SELECT
    cam.id AS acl_category_action_id,
    'policy/company-policy-migration-log' AS api,
    'GET' AS method,
    'system',
    'system'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON c.id = cam.acl_category_id
JOIN public.acl_actions a ON a.id = cam.acl_action_id
WHERE c.category_key = 'MIGRATION_LOG'
  AND a.action_key = 'READ_001'
  AND NOT EXISTS (
      SELECT 1
      FROM public.acl_category_action_api_map acaam
      WHERE acaam.acl_category_action_id = cam.id
        AND acaam.api = 'policy/company-policy-migration-log'
        AND acaam.method = 'GET'
  );

------------------------------------------------------------
-- 4) Grant Migration Log READ to 'Super User' and
--    'Super User Read Only' (view-only feature)
------------------------------------------------------------
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
    'system',
    'system'
FROM public.roles r
JOIN public.acl_category_action_map cam ON 1 = 1
JOIN public.acl_categories c ON c.id = cam.acl_category_id
WHERE c.category_key = 'MIGRATION_LOG'
  AND r.name IN ('Super User', 'Super User Read Only')
  AND NOT EXISTS (
      SELECT 1
      FROM public.role_acl_category_action_map racam
      WHERE racam.role_id = r.id
        AND racam.acl_category_action_id = cam.id
  );

COMMIT;

-- Manual verification after running:
SELECT r.name AS role_name, c.category_key, a.action_key, acaam.api, acaam.method
FROM public.role_acl_category_action_map racam
JOIN public.roles r ON r.id = racam.role_id
JOIN public.acl_category_action_map cam ON cam.id = racam.acl_category_action_id
JOIN public.acl_categories c ON c.id = cam.acl_category_id
JOIN public.acl_actions a ON a.id = cam.acl_action_id
JOIN public.acl_category_action_api_map acaam ON acaam.acl_category_action_id = cam.id
WHERE c.category_key = 'MIGRATION_LOG';
