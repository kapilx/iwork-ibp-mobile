-- Grants the "Reconfiguration" privilege on the Policy Details screen:
-- PUT /policy/reconfigure/:policyId, which rewinds an ACTIVE policy back to
-- the configuration stage (config -> WIP, enrollment template doc mappings
-- dropped, policy -> MIG_GENERATED).
-- Destructive + irreversible, so granted to 'Super User' only (NOT the
-- read-only role). Idempotent: safe to re-run.

BEGIN;

------------------------------------------------------------
-- 1) New action: Reconfigure Policy
------------------------------------------------------------
INSERT INTO public.acl_actions (
    name, description, created_at, updated_at, created_by, updated_by, action_key
)
SELECT 'Reconfigure Policy', 'Send an active policy back for reconfiguration',
       NOW(), NOW(), 'system', 'system', 'RECONFIGURE_POLICY_001'
WHERE NOT EXISTS (
    SELECT 1 FROM public.acl_actions WHERE action_key = 'RECONFIGURE_POLICY_001'
);

------------------------------------------------------------
-- 2) Map it to the existing POLICIES category
------------------------------------------------------------
INSERT INTO public.acl_category_action_map (
    acl_category_id, acl_action_id, created_at, updated_at, created_by, updated_by
)
SELECT c.id, a.id, NOW(), NOW(), 'system', 'system'
FROM public.acl_categories c
JOIN public.acl_actions a ON a.action_key = 'RECONFIGURE_POLICY_001'
WHERE c.category_key = 'POLICIES'
  AND NOT EXISTS (
      SELECT 1 FROM public.acl_category_action_map cam
      WHERE cam.acl_category_id = c.id AND cam.acl_action_id = a.id
  );

------------------------------------------------------------
-- 3) Map PUT policy/reconfigure to that category-action
------------------------------------------------------------
INSERT INTO public.acl_category_action_api_map (
    acl_category_action_id, api, method, created_by, updated_by
)
SELECT cam.id, 'policy/reconfigure', 'PUT', 'system', 'system'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON c.id = cam.acl_category_id
JOIN public.acl_actions a ON a.id = cam.acl_action_id
WHERE c.category_key = 'POLICIES'
  AND a.action_key = 'RECONFIGURE_POLICY_001'
  AND NOT EXISTS (
      SELECT 1 FROM public.acl_category_action_api_map acaam
      WHERE acaam.acl_category_action_id = cam.id
        AND acaam.api = 'policy/reconfigure' AND acaam.method = 'PUT'
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
WHERE a.action_key = 'RECONFIGURE_POLICY_001';
