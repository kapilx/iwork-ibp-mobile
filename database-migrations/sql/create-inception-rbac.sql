------------------------------------------------------------
-- Inception download icon RBAC setup
-- category_key = 'INCEPTION'
-- Controls ALL download icons in the Inception flow:
--   - Send to Insurer document card
--   - Endorsement data download card (client confirmation step)
--   - Insurer acknowledgement document upload download icon
--   - Enrollment upload error file download
-- Requires: FF_IWORK_DOCUMENT_DOWNLOAD=true AND role Export toggle ON
------------------------------------------------------------

-- 1) Insert the Inception ACL category
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
    'Inception'                                        AS name,
    'Download access for Inception flow documents'     AS description,
    NOW()                                              AS created_at,
    NOW()                                              AS updated_at,
    'system'                                           AS created_by,
    'system'                                           AS updated_by,
    'IWORK'                                            AS parent,
    'INCEPTION'                                        AS category_key,
    'iWork'                                            AS application_scope
WHERE NOT EXISTS (
    SELECT 1 FROM public.acl_categories WHERE category_key = 'INCEPTION'
);

-- 2) Map EXPORT action to Inception category
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
WHERE c.category_key = 'INCEPTION'
  AND NOT EXISTS (
      SELECT 1 FROM public.acl_category_action_map cam
      WHERE cam.acl_category_id = c.id AND cam.acl_action_id = a.id
  );

