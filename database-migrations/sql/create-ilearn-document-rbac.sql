------------------------------------------------------------
-- ILearn download icon RBAC setup
-- category_key = 'ILEARN_DOCUMENT'
-- Controls download icon on the ILearn page
-- Requires: FF_IWORK_DOCUMENT_DOWNLOAD=true AND role Export toggle ON
------------------------------------------------------------

-- 1) Insert the ILearn ACL category
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
    'ILearn'                              AS name,
    'Download access for ILearn page'     AS description,
    NOW()                                 AS created_at,
    NOW()                                 AS updated_at,
    'system'                              AS created_by,
    'system'                              AS updated_by,
    'IWORK'                               AS parent,
    'ILEARN_DOCUMENT'                     AS category_key,
    'iWork'                               AS application_scope
WHERE NOT EXISTS (
    SELECT 1 FROM public.acl_categories WHERE category_key = 'ILEARN_DOCUMENT'
);

-- 2) Map EXPORT action to ILearn category
INSERT INTO public.acl_category_action_map (
    acl_category_id,
    acl_action_id,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    c.id, a.id, NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM public.acl_categories c
JOIN public.acl_actions a ON a.action_key = 'EXPORT_001'
WHERE c.category_key = 'ILEARN_DOCUMENT'
  AND NOT EXISTS (
      SELECT 1 FROM public.acl_category_action_map cam
      WHERE cam.acl_category_id = c.id AND cam.acl_action_id = a.id
  );
