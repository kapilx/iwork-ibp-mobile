-- ================================================================
-- Opportunity activity ACL separation
-- ----------------------------------------------------------------
-- Maps the dedicated "opportunity/activity" subPath (produced by AclGuard for
-- activity-write routes such as PUT /opportunity/activity, broking slip, quote,
-- etc.) to the OPTY_ACTIVITY / WRITE_001 category-action, so performing
-- activities no longer requires the OPTY write/update privilege used for
-- creating/editing the opportunity itself.
--
-- Prerequisite: the OPTY_ACTIVITY category (category_key = 'OPTY_ACTIVITY') and
-- the WRITE_001 action already exist (they back the CREATE_OPTY_ACTIVITY
-- feature). If they do not, these inserts select nothing and are a no-op.
--
-- Deploy this TOGETHER with the AclGuard code change. Without it the new
-- subPath has no mapping and every activity write returns 401.
-- ================================================================

-- POST | PUT | DELETE  /opportunity/activity  ->  OPTY_ACTIVITY / WRITE_001
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
    'opportunity/activity',
    m.method,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON cam.acl_category_id = c.id
JOIN public.acl_actions    a ON cam.acl_action_id   = a.id
CROSS JOIN (VALUES ('POST'), ('PUT'), ('DELETE')) AS m(method)
WHERE c.category_key = 'OPTY_ACTIVITY'
  AND a.action_key   = 'WRITE_001'
  AND NOT EXISTS (
      SELECT 1
      FROM public.acl_category_action_api_map existing
      WHERE existing.api = 'opportunity/activity'
        AND existing.method = m.method
  );

-- ----------------------------------------------------------------
-- ROLLBACK
-- Removes the rows inserted above. The 'opportunity/activity' api value is
-- unique to this script, so this deletes only what was added and leaves
-- categories, actions, and role grants untouched.
--
-- Revert the AclGuard code change at the same time: with the redirect still
-- active and these rows gone, every activity-write route would 401.
-- ----------------------------------------------------------------
-- DELETE FROM public.acl_category_action_api_map
-- WHERE api = 'opportunity/activity'
--   AND method IN ('POST', 'PUT', 'DELETE');

-- ----------------------------------------------------------------
-- Role grants (run only if the BD/ISG roles do not already hold
-- OPTY_ACTIVITY / WRITE_001 via CREATE_OPTY_ACTIVITY).
-- Replace :roleId with each role that must perform activities.
-- ----------------------------------------------------------------
-- INSERT INTO public.role_acl_category_action_map (
--     role_id, acl_category_action_id, created_at, updated_at, created_by, updated_by
-- )
-- SELECT
--     :roleId, cam.id, NOW(), NOW(), 'SYSTEM', 'SYSTEM'
-- FROM public.acl_category_action_map cam
-- JOIN public.acl_categories c ON cam.acl_category_id = c.id
-- JOIN public.acl_actions    a ON cam.acl_action_id   = a.id
-- WHERE c.category_key = 'OPTY_ACTIVITY'
--   AND a.action_key   = 'WRITE_001'
--   AND NOT EXISTS (
--       SELECT 1 FROM public.role_acl_category_action_map r
--       WHERE r.role_id = :roleId AND r.acl_category_action_id = cam.id
--   );
