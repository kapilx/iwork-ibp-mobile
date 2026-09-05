-- Dual Approval Framework (DA-102)
-- New tables: approval_request, approval_decision, company_approval_config
-- See docs/Dual-Approval-Framework/TRD.md for the full design.

CREATE TABLE approval_request (
    id SERIAL,
    origin VARCHAR(100) NOT NULL,
    company_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    section VARCHAR(100),
    required_approvals INT NOT NULL DEFAULT 1,
    approval_mode_lid INT,
    approver1_user_id INT NOT NULL,
    approver2_strategy_lid INT,
    status_lid INT NOT NULL,
    submitted_by INT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_approval_request PRIMARY KEY (id),
    CONSTRAINT fk_approval_request_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_approval_request_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id),
    CONSTRAINT fk_approval_request_approver1 FOREIGN KEY (approver1_user_id) REFERENCES users(id),
    CONSTRAINT fk_approval_request_approval_mode FOREIGN KEY (approval_mode_lid) REFERENCES lookup_data(id),
    CONSTRAINT fk_approval_request_approver2_strategy FOREIGN KEY (approver2_strategy_lid) REFERENCES lookup_data(id),
    CONSTRAINT fk_approval_request_status FOREIGN KEY (status_lid) REFERENCES lookup_data(id)
);

CREATE INDEX idx_approval_request_entity ON approval_request(entity_type, entity_id);
CREATE INDEX idx_approval_request_company ON approval_request(company_id);

---------------***-------------------

CREATE TABLE approval_decision (
    id SERIAL,
    approval_request_id INT NOT NULL,
    approver_slot_lid INT NOT NULL,
    approver_id INT NOT NULL,
    decision_lid INT NOT NULL,
    comments TEXT,
    decided_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT pk_approval_decision PRIMARY KEY (id),
    CONSTRAINT fk_approval_decision_request
        FOREIGN KEY (approval_request_id)
        REFERENCES approval_request (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_approval_decision_approver FOREIGN KEY (approver_id) REFERENCES users(id),
    CONSTRAINT fk_approval_decision_slot FOREIGN KEY (approver_slot_lid) REFERENCES lookup_data(id),
    CONSTRAINT fk_approval_decision_decision FOREIGN KEY (decision_lid) REFERENCES lookup_data(id),
    CONSTRAINT uq_approval_decision_request_slot UNIQUE (approval_request_id, approver_slot_lid)
);

---------------***-------------------

CREATE TABLE company_approval_config (
    id SERIAL,
    company_id INT NOT NULL,
    approval_area VARCHAR(100) NOT NULL,
    dual_approval_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    approval_mode_lid INT,
    approver2_strategy_lid INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_company_approval_config PRIMARY KEY (id),
    CONSTRAINT fk_company_approval_config_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_company_approval_config_mode FOREIGN KEY (approval_mode_lid) REFERENCES lookup_data(id),
    CONSTRAINT fk_company_approval_config_strategy FOREIGN KEY (approver2_strategy_lid) REFERENCES lookup_data(id),
    CONSTRAINT uq_company_approval_config_company_area UNIQUE (company_id, approval_area)
);

---------------***-------------------
-- lookup_data seeding for the 5 Lid-backed enum groups. Each concept gets
-- its own lookup_name group (matching this codebase's existing convention,
-- e.g. POLICY_SECTION_APPROVAL_STATUS vs. APPROVAL_STATUS staying separate
-- even though both have APPROVED/REJECTED values).

INSERT INTO lookup_data (
  lookup_key,
  lookup_name,
  value_key,
  value,
  description,
  created_at,
  updated_at,
  created_by,
  updated_by,
  lookup_order
) VALUES
  ('APPROVAL_REQUEST_STATUS_PENDING', 'APPROVAL_REQUEST_STATUS', 'PENDING', 'Pending', 'Dual approval request awaiting one or more decisions', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('APPROVAL_REQUEST_STATUS_APPROVED', 'APPROVAL_REQUEST_STATUS', 'APPROVED', 'Approved', 'Dual approval request fully approved', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2),
  ('APPROVAL_REQUEST_STATUS_REJECTED', 'APPROVAL_REQUEST_STATUS', 'REJECTED', 'Rejected', 'Dual approval request rejected by an approver', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3),

  ('APPROVAL_DECISION_APPROVED', 'APPROVAL_DECISION', 'APPROVED', 'Approved', 'Individual approver decision: approved', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('APPROVAL_DECISION_REJECTED', 'APPROVAL_DECISION', 'REJECTED', 'Rejected', 'Individual approver decision: rejected', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2),

  ('APPROVAL_MODE_PARALLEL', 'APPROVAL_MODE', 'PARALLEL', 'Parallel', 'Both approvers review at the same time', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('APPROVAL_MODE_SEQUENTIAL', 'APPROVAL_MODE', 'SEQUENTIAL', 'Sequential', 'Approver 2 only sees the request after Approver 1 approves', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2),

  ('APPROVER_SLOT_APPROVER_1', 'APPROVER_SLOT', 'APPROVER_1', 'Approver 1', 'The existing reporting-manager approver', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('APPROVER_SLOT_APPROVER_2', 'APPROVER_SLOT', 'APPROVER_2', 'Approver 2', 'The new, second approver', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2),

  ('APPROVER_2_STRATEGY_LEAD_CRM', 'APPROVER_2_STRATEGY', 'LEAD_CRM', 'Lead CRM', 'Resolve Approver 2 as the company''s designated Lead CRM', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('APPROVER_2_STRATEGY_SKIP_LEVEL_MANAGER', 'APPROVER_2_STRATEGY', 'SKIP_LEVEL_MANAGER', 'Skip-Level Manager', 'Resolve Approver 2 as the submitter''s manager''s manager', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2)
ON CONFLICT (lookup_key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW(),
  updated_by = EXCLUDED.updated_by,
  lookup_order = EXCLUDED.lookup_order;

---------------***-------------------
-- DA-105: link an existing task row to the ApprovalRequest slot it was
-- created for. Nullable — every task outside this framework leaves both
-- columns null, unaffected.

ALTER TABLE task
  ADD COLUMN approval_request_id INT,
  ADD COLUMN approver_slot_lid INT;

ALTER TABLE task
  ADD CONSTRAINT fk_task_approval_request
    FOREIGN KEY (approval_request_id) REFERENCES approval_request (id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_task_approver_slot
    FOREIGN KEY (approver_slot_lid) REFERENCES lookup_data (id);

CREATE INDEX idx_task_approval_request ON task(approval_request_id);




BEGIN;

CREATE TABLE IF NOT EXISTS org_approval_config (
    id SERIAL,
    organisation_id INT NOT NULL,
    approval_area VARCHAR(100) NOT NULL,
    dual_approval_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    approval_mode_lid INT,
    approver2_strategy_lid INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    CONSTRAINT pk_org_approval_config PRIMARY KEY (id),
    CONSTRAINT fk_org_approval_config_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisation (id),
    CONSTRAINT fk_org_approval_config_approval_mode
        FOREIGN KEY (approval_mode_lid) REFERENCES lookup_data (id),
    CONSTRAINT fk_org_approval_config_approver2_strategy
        FOREIGN KEY (approver2_strategy_lid) REFERENCES lookup_data (id)
);

-- Matches @Index(["organisationId", "approvalArea"], { unique: true }).
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_approval_config_org_area
    ON org_approval_config (organisation_id, approval_area);

COMMIT;

BEGIN;

INSERT INTO public.acl_actions (name, action_key, description, created_at, updated_at, created_by, updated_by)
SELECT 'Configure Org Dual Approval', 'CONFIGURE_ORG_DUAL_APPROVAL_001', 'View/configure an organisation''s per-activity dual-approval defaults (Admin Settings > Approval Settings)', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM public.acl_actions WHERE action_key = 'CONFIGURE_ORG_DUAL_APPROVAL_001');

INSERT INTO public.acl_category_action_map (acl_category_id, acl_action_id, created_at, updated_at, created_by, updated_by)
SELECT c.id, a.id, NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM public.acl_categories c
JOIN public.acl_actions a ON a.action_key = 'CONFIGURE_ORG_DUAL_APPROVAL_001'
WHERE c.category_key = 'DUAL_APPROVAL_CONFIG'
AND NOT EXISTS (
  SELECT 1 FROM public.acl_category_action_map cam
  WHERE cam.acl_category_id = c.id AND cam.acl_action_id = a.id
);

COMMIT;

BEGIN;

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
    'organisation' AS api,
    methods.method,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c ON c.id = cam.acl_category_id
JOIN public.acl_actions a ON a.id = cam.acl_action_id
CROSS JOIN (
    SELECT 'GET' AS method
    UNION SELECT 'PUT'
) methods
WHERE c.category_key = 'DUAL_APPROVAL_CONFIG'
AND a.action_key = 'CONFIGURE_ORG_DUAL_APPROVAL_001'
AND NOT EXISTS (
    SELECT 1
    FROM public.acl_category_action_api_map api_map
    WHERE api_map.acl_category_action_id = cam.id
    AND api_map.api = 'organisation'
    AND api_map.method = methods.method
);

COMMIT;