-- ================================================================
-- Opportunity excel-download ACL
-- ----------------------------------------------------------------
-- POST /opportunity/excel-generation-url is a download/export, not an opty
-- write. AclGuard.getSubPath now routes it to the "opportunity/export" subPath
-- (EXPORT_MODULE_KEYS.opportunity) so it is authorized by OPTY / EXPORT_001
-- instead of inheriting the generic "opportunity" POST (OPTY write/update used
-- for creating an opportunity).
--
-- The existing listing export already maps (GET, 'opportunity/export') -> OPTY /
-- EXPORT_001. This adds the matching POST row for the excel-generation endpoint.
--
-- Deploy this TOGETHER with the AclGuard code change. Without it the redirected
-- subPath has no POST mapping and the excel download returns 401.
-- ================================================================

-- POST  /opportunity/excel-generation-url  ->  OPTY / EXPORT_001
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
    'opportunity/export',
    'POST',
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON cam.acl_category_id = c.id
JOIN public.acl_actions    a ON cam.acl_action_id   = a.id
WHERE c.category_key = 'OPTY'
  AND a.action_key   = 'EXPORT_001'
  AND NOT EXISTS (
      SELECT 1
      FROM public.acl_category_action_api_map existing
      WHERE existing.api = 'opportunity/export'
        AND existing.method = 'POST'
  );

-- ----------------------------------------------------------------
-- ROLLBACK
-- Removes ONLY the POST row added above. The GET 'opportunity/export' mapping
-- for the listing export is left untouched.
--
-- Revert the AclGuard code change at the same time: with the redirect still
-- active and this row gone, the excel download would 401.
-- ----------------------------------------------------------------
-- DELETE FROM public.acl_category_action_api_map
-- WHERE api = 'opportunity/export'
--   AND method = 'POST';
