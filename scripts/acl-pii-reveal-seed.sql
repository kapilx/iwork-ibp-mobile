-- ─────────────────────────────────────────────────────────────────────────────
-- ACL seed: PII Reveal permission
--
-- Creates:
--   1. acl_categories row  (category_key = 'PII_REVEAL', scope = 'config-service')
--   2. acl_category_action_map row  (PII_REVEAL × READ_001)
--   3. acl_category_action_api_map row  (api = 'reveal', method = 'POST')
--
-- After running this script, go to /roles in the admin UI and assign the
-- "PII_REVEAL / Read" permission to the desired roles.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Insert the category (idempotent via ON CONFLICT DO NOTHING)
INSERT INTO acl_categories
  (name, description, parent, category_key, application_scope, created_by, updated_by)
VALUES
  (
    'PII Reveal',
    'Permission to reveal masked PII fields (phone, email, DOB, etc.)',
    'Admin',
    'PII_REVEAL',
    'config-service',
    'system',
    'system'
  )
ON CONFLICT (name) DO NOTHING;

-- 2. Insert category × action mapping (READ_001 = read/reveal action)
INSERT INTO acl_category_action_map
  (acl_category_id, acl_action_id, created_by, updated_by)
SELECT
  c.id,
  a.id,
  'system',
  'system'
FROM
  acl_categories c,
  acl_actions    a
WHERE
  c.category_key = 'PII_REVEAL'
  AND a.action_key  = 'READ_001'
  AND NOT EXISTS (
    SELECT 1
    FROM   acl_category_action_map m
    WHERE  m.acl_category_id = c.id
      AND  m.acl_action_id   = a.id
  );

-- 3. Insert the API mapping: POST /reveal
INSERT INTO acl_category_action_api_map
  (acl_category_action_id, api, method, created_by, updated_by)
SELECT
  cam.id,
  'reveal',
  'POST',
  'system',
  'system'
FROM
  acl_category_action_map cam
  JOIN acl_categories c ON c.id  = cam.acl_category_id
  JOIN acl_actions    a ON a.id  = cam.acl_action_id
WHERE
  c.category_key = 'PII_REVEAL'
  AND a.action_key  = 'READ_001'
  AND NOT EXISTS (
    SELECT 1
    FROM   acl_category_action_api_map existing
    WHERE  existing.acl_category_action_id = cam.id
      AND  existing.api    = 'reveal'
      AND  existing.method = 'POST'
  );

COMMIT;

-- Verify
SELECT
  c.name           AS category,
  c.category_key,
  c.application_scope,
  a.action_key,
  api_map.api,
  api_map.method
FROM acl_categories c
JOIN acl_category_action_map     cam     ON cam.acl_category_id = c.id
JOIN acl_actions                 a       ON a.id               = cam.acl_action_id
JOIN acl_category_action_api_map api_map ON api_map.acl_category_action_id = cam.id
WHERE c.category_key = 'PII_REVEAL';
