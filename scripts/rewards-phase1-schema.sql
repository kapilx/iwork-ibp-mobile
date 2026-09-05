-- ─────────────────────────────────────────────────────────────────────────────
-- Rewards — Phase 1 schema + ACL seed   (IIRM-10616)
--
-- Creates:
--   1. reward                  one row per reward record (soft-delete = Inactive)
--   2. reward_business_month   child, one row per selected business month
--   3. reward_doc_map          links a reward to file_uploads rows (docs)
--   4. ACL: category INSURER_REWARDS + READ/WRITE/UPDATE/DELETE on api 'reward'
--
-- After running, assign the "Insurer Rewards" permissions to roles via /roles.
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. reward
CREATE TABLE IF NOT EXISTS reward (
  id                  SERIAL PRIMARY KEY,
  reward_category_lid INT           NOT NULL REFERENCES lookup_data(id),
  reward_type_lid     INT           NOT NULL REFERENCES lookup_data(id),
  insurer_id          INT           NOT NULL REFERENCES insurer(id),
  organisation_id     INT,
  date_of_income      DATE          NOT NULL,
  reward_amount       NUMERIC(15,2) NOT NULL,
  remarks             VARCHAR(500),
  created_by          INT           NOT NULL,
  updated_by          INT,
  created_at          TIMESTAMP     NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP     NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMP
);
-- Org-scoping column added after initial release (idempotent).
ALTER TABLE reward ADD COLUMN IF NOT EXISTS organisation_id INT;
CREATE INDEX IF NOT EXISTS idx_reward_insurer_id     ON reward(insurer_id);
CREATE INDEX IF NOT EXISTS idx_reward_date_of_income ON reward(date_of_income);
CREATE INDEX IF NOT EXISTS idx_reward_organisation_id ON reward(organisation_id);

-- 2. reward_business_month (business_month stored as first-of-month date)
CREATE TABLE IF NOT EXISTS reward_business_month (
  id             SERIAL PRIMARY KEY,
  reward_id      INT  NOT NULL REFERENCES reward(id) ON DELETE CASCADE,
  business_month DATE NOT NULL,
  start_date     DATE,
  end_date       DATE
);

-- 3. reward_doc_map (file bytes live in file_uploads, company_type = 'REWARD')
CREATE TABLE IF NOT EXISTS reward_doc_map (
  id        SERIAL PRIMARY KEY,
  reward_id INT NOT NULL REFERENCES reward(id)       ON DELETE CASCADE,
  doc_id    INT NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reward_doc_map_reward_id ON reward_doc_map(reward_id);

-- 3b. Lookup rows for Reward Category + Reward Type.
--     lookup_data is read by lookup_key only (org-agnostic); organisation_id is
--     copied from an existing row to match the global-lookup convention.
INSERT INTO lookup_data
  (lookup_key, lookup_name, value_key, value, description, lookup_order,
   organisation_id, status, created_by, updated_by)
SELECT v.lookup_key, v.lookup_name, v.value_key, v.value, v.description, v.lookup_order,
       (SELECT organisation_id FROM lookup_data ORDER BY id LIMIT 1), 1, 'system', 'system'
FROM (VALUES
  ('REWARD_CATEGORY_GENERIC',  'REWARD_CATEGORY', 'GENERIC',    'Generic',    'Generic reward (Phase 1)',        1),
  ('REWARD_CATEGORY_SPECIFIC', 'REWARD_CATEGORY', 'SPECIFIC',   'Specific',   'Specific reward (future phase)',  2),
  ('REWARD_TYPE_FIXED',        'REWARD_TYPE',     'FIXED',      'Fixed',      'Fixed amount (Phase 1)',          1),
  ('REWARD_TYPE_PERCENTAGE',   'REWARD_TYPE',     'PERCENTAGE', 'Percentage', 'Percentage of base (future)',     2)
) AS v(lookup_key, lookup_name, value_key, value, description, lookup_order)
WHERE NOT EXISTS (
  SELECT 1 FROM lookup_data ld WHERE ld.lookup_key = v.lookup_key
);

-- 4a. ACL category
INSERT INTO acl_categories
  (name, description, parent, category_key, application_scope, created_by, updated_by)
VALUES
  ('Insurer Rewards', 'Insurer reward records (Generic, Phase 1)', 'Admin',
   'INSURER_REWARDS', 'iWork', 'system', 'system')
ON CONFLICT (name) DO NOTHING;

-- 4b. category x action mappings (READ=view, WRITE=create, UPDATE=edit, DELETE, EXPORT)
INSERT INTO acl_category_action_map (acl_category_id, acl_action_id, created_by, updated_by)
SELECT c.id, a.id, 'system', 'system'
FROM   acl_categories c, acl_actions a
WHERE  c.category_key = 'INSURER_REWARDS'
  AND  a.action_key IN ('READ_001', 'WRITE_001', 'UPDATE_001', 'DELETE_001', 'EXPORT_001')
  AND  NOT EXISTS (
    SELECT 1 FROM acl_category_action_map m
    WHERE m.acl_category_id = c.id AND m.acl_action_id = a.id
  );

-- 4c. api mappings: subPath 'reward' x method per action (GET also covers export)
INSERT INTO acl_category_action_api_map (acl_category_action_id, api, method, created_by, updated_by)
SELECT cam.id, 'reward', v.method, 'system', 'system'
FROM   acl_category_action_map cam
  JOIN acl_categories c ON c.id = cam.acl_category_id
  JOIN acl_actions    a ON a.id = cam.acl_action_id
  JOIN (VALUES
    ('READ_001',   'GET'),
    ('WRITE_001',  'POST'),
    ('UPDATE_001', 'PUT'),
    ('DELETE_001', 'DELETE')
  ) AS v(action_key, method) ON v.action_key = a.action_key
WHERE c.category_key = 'INSURER_REWARDS'
  AND NOT EXISTS (
    SELECT 1 FROM acl_category_action_api_map e
    WHERE e.acl_category_action_id = cam.id AND e.api = 'reward' AND e.method = v.method
  );

COMMIT;
