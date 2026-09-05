-- ================================================================
-- Business Targets ACL Setup
-- ----------------------------------------------------------------
-- Creates the BUSINESS_TARGET category with READ_001 (view) and
-- WRITE_001 (manage) actions and maps the Business Targets endpoints
-- (produced by AclGuard.getSubPath now that "business-target",
-- "business-target-report-list" and "business-target-report" are in the
-- `subPaths` constant) to those privileges:
--
--   GET    policy/business-target-report-list   -> BUSINESS_TARGET / READ_001
--   GET    policy/business-target-report/*       -> BUSINESS_TARGET / READ_001  (export/exports/status/download)
--   POST   policy/business-target                -> BUSINESS_TARGET / WRITE_001 (upsert)
--   DELETE policy/business-target                -> BUSINESS_TARGET / WRITE_001
--
-- Frontend RBAC aligns to the same keys: scope 'iWork', category
-- 'BUSINESS_TARGET', actions READ_001 (VIEW_BUSINESS_TARGET) /
-- WRITE_001 (MANAGE_BUSINESS_TARGET) — see ui-lib rbac/permissionMap.ts.
--
-- Deploy TOGETHER with the subPaths code change. Without these rows the
-- new subPaths have no mapping and every Business Targets call returns 401.
-- READ_001 / WRITE_001 are generic actions that already exist; the inserts
-- below are guarded and become no-ops if so.
-- ================================================================

-- Step 1: category
INSERT INTO public.acl_categories (
    name, description, created_at, updated_at, created_by, updated_by,
    parent, category_key, application_scope
)
SELECT
    'Business Targets',
    'Manage and view business targets (admin)',
    NOW(), NOW(), 'SYSTEM', 'SYSTEM',
    'BUSINESS_TARGET', 'BUSINESS_TARGET', 'iWork'
WHERE NOT EXISTS (
    SELECT 1 FROM public.acl_categories WHERE category_key = 'BUSINESS_TARGET'
);

-- Step 2: actions (generic; guarded no-op if already present)
INSERT INTO public.acl_actions (name, action_key, description, created_at, updated_at, created_by, updated_by)
SELECT 'Read', 'READ_001', 'View access', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM public.acl_actions WHERE action_key = 'READ_001');

INSERT INTO public.acl_actions (name, action_key, description, created_at, updated_at, created_by, updated_by)
SELECT 'Write', 'WRITE_001', 'Manage access', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM public.acl_actions WHERE action_key = 'WRITE_001');

INSERT INTO public.acl_actions (name, action_key, description, created_at, updated_at, created_by, updated_by)
SELECT 'Export', 'EXPORT_001', 'Export access', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM public.acl_actions WHERE action_key = 'EXPORT_001');

-- Step 3: map the three actions to the category
INSERT INTO public.acl_category_action_map (
    acl_category_id, acl_action_id, created_at, updated_at, created_by, updated_by
)
SELECT c.id, a.id, NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM public.acl_categories c
JOIN public.acl_actions a ON a.action_key IN ('READ_001', 'WRITE_001', 'EXPORT_001')
WHERE c.category_key = 'BUSINESS_TARGET'
  AND NOT EXISTS (
      SELECT 1 FROM public.acl_category_action_map cam
      WHERE cam.acl_category_id = c.id AND cam.acl_action_id = a.id
  );

-- Step 4: map endpoints (subPath, method) -> category-action

-- VIEW (READ_001): the report list GET
INSERT INTO public.acl_category_action_api_map (
    acl_category_action_id, api, method, created_at, updated_at, created_by, updated_by
)
SELECT cam.id, 'policy/business-target-report-list', 'GET', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON cam.acl_category_id = c.id
JOIN public.acl_actions    a ON cam.acl_action_id   = a.id
WHERE c.category_key = 'BUSINESS_TARGET' AND a.action_key = 'READ_001'
  AND NOT EXISTS (
      SELECT 1 FROM public.acl_category_action_api_map e
      WHERE e.api = 'policy/business-target-report-list' AND e.method = 'GET'
  );

-- EXPORT (EXPORT_001): the Download button's async export endpoints
-- (/export, /exports, /export/:jobId, /export/:jobId/download) — all GET, all
-- resolve to the 'policy/business-target-report' subPath. A distinct privilege
-- from READ so viewing the report and exporting it can be granted separately.
INSERT INTO public.acl_category_action_api_map (
    acl_category_action_id, api, method, created_at, updated_at, created_by, updated_by
)
SELECT cam.id, 'policy/business-target-report', 'GET', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON cam.acl_category_id = c.id
JOIN public.acl_actions    a ON cam.acl_action_id   = a.id
WHERE c.category_key = 'BUSINESS_TARGET' AND a.action_key = 'EXPORT_001'
  AND NOT EXISTS (
      SELECT 1 FROM public.acl_category_action_api_map e
      WHERE e.api = 'policy/business-target-report' AND e.method = 'GET'
  );

-- MANAGE (WRITE_001): upsert (POST) + delete (DELETE) on the write subPath
INSERT INTO public.acl_category_action_api_map (
    acl_category_action_id, api, method, created_at, updated_at, created_by, updated_by
)
SELECT cam.id, 'policy/business-target', m.method, NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON cam.acl_category_id = c.id
JOIN public.acl_actions    a ON cam.acl_action_id   = a.id
CROSS JOIN (VALUES ('POST'), ('DELETE')) AS m(method)
WHERE c.category_key = 'BUSINESS_TARGET' AND a.action_key = 'WRITE_001'
  AND NOT EXISTS (
      SELECT 1 FROM public.acl_category_action_api_map e
      WHERE e.api = 'policy/business-target' AND e.method = m.method
  );

-- ----------------------------------------------------------------
-- Step 5: GRANT to the admin role(s). Replace :roleId with each role that
-- should view / export / manage targets. Trim the IN(...) list per role:
-- READ_001 = view report, EXPORT_001 = download, WRITE_001 = add/edit/delete.
-- Without a grant the endpoints 401 even for admins.
-- ----------------------------------------------------------------
-- INSERT INTO public.role_acl_category_action_map (
--     role_id, acl_category_action_id, created_at, updated_at, created_by, updated_by
-- )
-- SELECT :roleId, cam.id, NOW(), NOW(), 'SYSTEM', 'SYSTEM'
-- FROM public.acl_category_action_map cam
-- JOIN public.acl_categories c ON cam.acl_category_id = c.id
-- JOIN public.acl_actions    a ON cam.acl_action_id   = a.id
-- WHERE c.category_key = 'BUSINESS_TARGET'
--   AND a.action_key IN ('READ_001', 'EXPORT_001', 'WRITE_001')
--   AND NOT EXISTS (
--       SELECT 1 FROM public.role_acl_category_action_map r
--       WHERE r.role_id = :roleId AND r.acl_category_action_id = cam.id
--   );

-- ----------------------------------------------------------------
-- ROLLBACK (removes only what this script added)
-- ----------------------------------------------------------------
-- DELETE FROM public.acl_category_action_api_map
--  WHERE api IN ('policy/business-target', 'policy/business-target-report-list', 'policy/business-target-report');
