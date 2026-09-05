-- Company System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'COMPANY' AS entity,
    u.id AS user_id,
    'SYSTEM_COMPANY' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
        'to', '',
        'city', '',
        'from', '',
        'type', '',
        'month', '',
        'sbuId', '',
        'period', '',
        'status', jsonb_build_object('label', 'Active', 'value', 'Active'),
        'viewBy', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
        'ownerId', jsonb_build_object('label', u.first_name, 'value', u.id),
        'branchId', '',
        'priority', '',
        'verticalId', '',
        'companyType', '',
        'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
        'organisationId', jsonb_build_object('label', o.name, 'value', o.id), 
		'industrySegment', ''
    ) AS filter_json,
    '[
        {"hide": false, "name": "displayName", "index": 0},
        {"hide": false, "name": "priority", "index": 1},
        {"hide": false, "name": "policyPremium", "index": 2},
        {"hide": false, "name": "roPremium", "index": 3},
        {"hide": false, "name": "soPremium", "index": 4},
        {"hide": false, "name": "leadCRM", "index": 5},
        {"hide": false, "name": "status", "index": 6},
        {"hide": true, "name": "currency", "index": 7},
        {"hide": true, "name": "sumInsured", "index": 8},
        {"hide": true, "name": "city", "index": 9},
        {"hide": true, "name": "companyType", "index": 10},
        {"hide": true, "name": "sentiment", "index": 11},
        {"hide": true, "name": "country", "index": 12},
        {"hide": true, "name": "companyName", "index": 13},
        {"hide": true, "name": "industrySegment", "index": 14}
    ]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Contact System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'CONTACT' AS entity,
    u.id AS user_id,
    'SYSTEM_CONTACT' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
        'to', '2026-03-31',
    'from', '2025-04-01',
    'month', '',
    'sbuId', '',
    'branch', '',
    'period', '',
    'status', jsonb_build_object('label', 'Active', 'value', 'Active'),
    'viewBy', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
    'ownerId', jsonb_build_object('label', u.first_name, 'value', u.id),
    'department', '',
    'verticalId', '',
    'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
    'organisationId', jsonb_build_object('label', o.name, 'value', o.id)
    ) AS filter_json,
    '[{"hide": false, "name": "companyName", "index": 0}, {"hide": false, "name": "contactName", "index": 1}, {"hide": false, "name": "phone", "index": 2}, {"hide": false, "name": "email", "index": 3}, {"hide": false, "name": "department", "index": 4}, {"hide": false, "name": "designation", "index": 5}, {"hide": false, "name": "owner", "index": 6}, {"hide": false, "name": "status", "index": 7}]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Sales Opportunity System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'SALES_OPPORTUNITY' AS entity,
    u.id AS user_id,
    'SYSTEM_SALES_OPPORTUNITY' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
    'to', '2025-12-18',
    'from', '2025-09-18',
    'month', '',
    'sbuId', '',
    'state', jsonb_build_object('label', 'Active', 'value', 'Active'),
    'period', jsonb_build_object('label', '3 Months', 'value', '3 Months'),
    'viewBy', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
    'ownerId',jsonb_build_object('label', u.first_name, 'value', u.id),
    'branchId', '',
    'verticalId', '',
    'companyName', '',
    'activityName', '',
    'financialYear', '',
    'organisationId', jsonb_build_object('label', o.name, 'value', o.id),
    'opportunityContact', '',
    'opportunityPriority', '',
    'opportunityPolicyType', '',
    'opportunityIndustrySegment', ''
    )AS filter_json,
    '[{"hide": false, "name": "companyName", "index": 0}, {"hide": false, "name": "priority", "index": 1}, {"hide": false, "name": "policyType", "index": 2}, {"hide": false, "name": "expectedCloseDate", "index": 3}, {"hide": false, "name": "activityName", "index": 4}, {"hide": false, "name": "premium", "index": 5}, {"hide": false, "name": "estimatedBrokerage", "index": 6}, {"hide": false, "name": "assignedTo", "index": 7}, {"hide": false, "name": "branch", "index": 8}, {"hide": true, "name": "stageName", "index": 9}, {"hide": true, "name": "opportunityCreationDate", "index": 10}, {"hide": true, "name": "state", "index": 11}, {"hide": true, "name": "industrySegment", "index": 12}, {"hide": true, "name": "sumInsured", "index": 13}]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Renewal Opportunity System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'RENEWAL_OPPORTUNITY' AS entity,
    u.id AS user_id,
    'SYSTEM_RENEWAL_OPPORTUNITY' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
    'to', '2025-12-18',
    'from', '2025-09-18',
    'month', '',
    'sbuId', '',
    'state', jsonb_build_object('label', 'Active', 'value', 'Active'),
    'period', jsonb_build_object('label', '3 Months', 'value', '3 Months'),
    'viewBy', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
    'ownerId',jsonb_build_object('label', u.first_name, 'value', u.id),
    'branchId', '',
    'verticalId', '',
    'companyName', '',
    'activityName', '',
    'financialYear', '',
    'organisationId', jsonb_build_object('label', o.name, 'value', o.id),
    'opportunityContact', '',
    'opportunityPriority', '',
    'opportunityPolicyType', '',
    'opportunityIndustrySegment', ''
    )AS filter_json,
    '[{"hide": false, "name": "companyName", "index": 0}, {"hide": false, "name": "priority", "index": 1}, {"hide": false, "name": "policyType", "index": 2}, {"hide": false, "name": "expectedCloseDate", "index": 3}, {"hide": false, "name": "premium", "index": 4}, {"hide": false, "name": "activityName", "index": 5}, {"hide": false, "name": "assignedTo", "index": 6}, {"hide": false, "name": "branch", "index": 7}, {"hide": false, "name": "policyId", "index": 8}, {"hide": true, "name": "estimatedBrokerage", "index": 9}, {"hide": true, "name": "stageName", "index": 10}, {"hide": true, "name": "opportunityCreationDate", "index": 11}, {"hide": true, "name": "state", "index": 12}, {"hide": true, "name": "industrySegment", "index": 13}, {"hide": true, "name": "sumInsured", "index": 14}]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Policy System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'POLICY' AS entity,
    u.id AS user_id,
    'SYSTEM_POLICY' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
    'to', '2026-03-31',
    'from', '2025-04-01',
    'month', '',
    'sbuId', '',
    'period', '',
    'viewBy', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
    'ownerId', jsonb_build_object('label', u.first_name, 'value', u.id),
    'branchId', '',
    'industry', '',
    'policyType', '',
    'verticalId', '',
    'companyName', '',
    'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
    'renewalPeriod', '',
    'organisationId', jsonb_build_object('label', o.name, 'value', o.id),
    'policyExpiryToDate', '',
    'policyExpiryFromDate', ''
    )AS filter_json,
    '[{"hide": false, "name": "companyName", "index": 0}, {"hide": false, "name": "policyType", "index": 1}, {"hide": false, "name": "insurerPolicyNumber", "index": 2}, {"hide": false, "name": "priority", "index": 3}, {"hide": false, "name": "premium", "index": 4}, {"hide": false, "name": "insurer", "index": 5}, {"hide": false, "name": "policyFrom", "index": 6}, {"hide": false, "name": "policyTo", "index": 7}, {"hide": false, "name": "policyStatus", "index": 8}, {"hide": true, "name": "sumInsured", "index": 9}, {"hide": true, "name": "bdOwner", "index": 10}, {"hide": true, "name": "accountManager", "index": 11}, {"hide": true, "name": "policyStep", "index": 12}, {"hide": true, "name": "currency", "index": 13}, {"hide": false, "name": "brokerageAmount", "index": 14}, {"hide": false, "name": "action", "index": 15}, {"hide": true, "name": "contacts", "index": 16}]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Dashboard System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'DASHBOARD' AS entity,
    u.id AS user_id,
    'SYSTEM_DASHBOARD' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
    'month', jsonb_build_object('label', 'All', 'value', 'ALL'),
    'owner', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
    'sbuId', '',
    'userId', jsonb_build_object('label', u.first_name, 'value', u.id),
    'quarter', jsonb_build_object('label', 'All', 'value', 'ALL'),
    'branchId', '',
    'verticalId', '',
    'departmentId', '',
    'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
    'organisationId',jsonb_build_object('label', o.name, 'value', o.id)
    ) AS filter_json,
    '[]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Biz done report System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'BIZ_DONE_REPORT' AS entity,
    u.id AS user_id,
    'SYSTEM_BIZ_DONE_REPORT' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
    'month', jsonb_build_object('label', 'All', 'value', 'ALL'),
    'owner', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
    'sbuId', '',
    'userId', jsonb_build_object('label', u.first_name, 'value', u.id),
    'quarter', jsonb_build_object('label', 'All', 'value', 'ALL'),
    'branchId', '',
    'verticalId', '',
    'departmentId', '',
    'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
    'organisationId', jsonb_build_object('label', o.name, 'value', o.id)
    ) AS filter_json,
    '[]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Claims System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'CLAIMS' AS entity,
    u.id AS user_id,
    'SYSTEM_CLAIMS' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
    'to', '2026-03-31',
    'from', '2025-04-01',
    'month', '',
    'sbuId', '',
    'period', '',
    'viewBy', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
    'ownerId', jsonb_build_object('label', u.first_name, 'value', u.id),
    'branchId', '',
    'tatRange', '',
    'verticalId', '',
    'claimStatus', '',
    'companyType', '',
    'priorityLid', '',
    'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
    'organisationId',jsonb_build_object('label', o.name, 'value', o.id),
    'industrySegment', '',
    'opportunityPolicyType', ''
    )AS filter_json,
    '[{"hide": false, "name": "companyName", "index": 0}, {"hide": false, "name": "claimNumber", "index": 1}, {"hide": false, "name": "policyType", "index": 2}, {"hide": false, "name": "companyPriority", "index": 3}, {"hide": false, "name": "claimDate", "index": 4}, {"hide": false, "name": "status", "index": 5}, {"hide": false, "name": "tatDays", "index": 6}, {"hide": false, "name": "claimAmount", "index": 7}]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Client portfolio System Filter for all active users
INSERT INTO filter_preference(
    entity, 
    user_id, 
    filter_name, 
    filter_type_lid, 
    default_filter_lid,
    status_lid, 
    filter_json, 
    table_setting_json,
	created_by,
	updated_by
)
SELECT
    'CLIENT_PORTFOLIO' AS entity,
    u.id AS user_id,
    'SYSTEM_CLIENT_PORTFOLIO' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
    'to', '2026-03-31',
    'from', '2025-04-01',
    'month', '',
    'sbuId', '',
    'period', jsonb_build_object('label', '3 Months', 'value', '3 Months'),
    'status', jsonb_build_object('label', 'Active', 'value', 'Active'),
    'viewBy', '',
    'ownerId', jsonb_build_object('label', u.first_name, 'value', u.id),
    'branchId', '',
    'priority', '',
    'verticalId', '',
    'companyType', '',
    'serviceScore', '',
    'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
    'organisationId', jsonb_build_object('label', o.name, 'value', o.id)
    )AS filter_json,
    '[{"hide": false, "name": "companyName", "index": 0}, {"hide": false, "name": "policyPremium", "index": 1}, {"hide": false, "name": "roPremium", "index": 2}, {"hide": false, "name": "soPremium", "index": 3}, {"hide": false, "name": "priority", "index": 4}, {"hide": false, "name": "claimAmount", "index": 5}, {"hide": false, "name": "ServiceScore", "index": 6}, {"hide": false, "name": "actions", "index": 7}]'::jsonb AS table_setting_json,
	u.id AS created_by,
	u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Endorsement System Filter for all active users
INSERT INTO filter_preference(
    id,
    entity,
    user_id,
    filter_name,
    filter_type_lid,
    default_filter_lid,
    status_lid,
    filter_json,
    table_setting_json,
    created_by,
    updated_by,
    created_at,
    updated_at
) 
SELECT 
    NEXTVAL('filter_preference_id_seq') AS id,
    'ENDORSEMENT' AS entity,
    u.id AS user_id,
    'SYSTEM_ENDORSEMENT' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    Jsonb_build_object(
        'to', '',
        'from', '', 
        'month', '', 
        'sbuId', '',
        'period', '',
        'viewBy', Jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
        'ownerId', Jsonb_build_object('label', u."first_name" || ' ' || u."last_name", 'value', u.id),
        'branchId', '',
        'verticalId', '',
        'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
        'organisationId', jsonb_build_object('label', o.name, 'value', o.id), 
        'companyName', '',
        'companyPriority', '', 
        'policyType', '', 
        'tatRange', '', 
        'status', ''
    ) AS filter_json,
    '[{"hide": false, "name": "companyName", "index": 0}, 
	{"hide": false, "name": "endorsementId", "index": 1}, 
	{"hide": false, "name": "companyPriority", "index": 2}, 
	{"hide": false, "name": "policyNumber", "index": 3}, 
	{"hide": false, "name": "policyType", "index": 4}, 
	{"hide": false, "name": "endorsementDate", "index": 5}, 
	{"hide": false, "name": "TATDate", "index": 6}, 
	{"hide": false, "name": "status", "index": 7}]':: jsonb  AS table_setting_json,
    u.id AS created_by,
    u.id AS updated_by,
	NOW() AS created_at,
    NOW() AS updated_at
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;
-- Manage Quotes (combined SO + RO) System Filter for all active users.
-- Mirrors the SALES_OPPORTUNITY/RENEWAL_OPPORTUNITY system defaults so the
-- combined screen opens with Owner = the user, View by = Manager + Team, the
-- user's organisation and the current financial year. (financialYear is auto-
-- bumped to the current FY by normalizeSmartSearchValues on the frontend.)
INSERT INTO filter_preference(
    entity,
    user_id,
    filter_name,
    filter_type_lid,
    default_filter_lid,
    status_lid,
    filter_json,
    table_setting_json,
    created_by,
    updated_by
)
SELECT
    'MANAGE_QUOTES' AS entity,
    u.id AS user_id,
    'SYSTEM_MANAGE_QUOTES' AS filter_name,
    20101 AS filter_type_lid,
    20301 AS default_filter_lid,
    20201 AS status_lid,
    jsonb_build_object(
    'to', '',
    'from', '',
    'month', '',
    'sbuId', '',
    'state', jsonb_build_object('label', 'Active', 'value', 'Active'),
    'period', '',
    'viewBy', jsonb_build_object('label', 'Manager + Team', 'value', 'team'),
    'ownerId', jsonb_build_object('label', u.first_name, 'value', u.id),
    'branchId', '',
    'optyType', '',
    'verticalId', '',
    'companyName', '',
    'activityName', '',
    'financialYear', jsonb_build_object('label', '2025-2026', 'value', '2025'),
    'organisationId', jsonb_build_object('label', o.name, 'value', o.id),
    'opportunityContact', '',
    'opportunityPriority', '',
    'opportunityPolicyType', '',
    'opportunityIndustrySegment', ''
    ) AS filter_json,
    '[{"hide": false, "name": "opportunityId", "index": 0}, {"hide": false, "name": "activityName", "index": 1}, {"hide": false, "name": "expectedCloseDate", "index": 2}, {"hide": false, "name": "companyName", "index": 3}, {"hide": false, "name": "priority", "index": 4}, {"hide": false, "name": "policyType", "index": 5}, {"hide": false, "name": "premium", "index": 6}, {"hide": false, "name": "assignedTo", "index": 7}, {"hide": false, "name": "branch", "index": 8}, {"hide": false, "name": "policyId", "index": 9}, {"hide": true, "name": "estimatedBrokerage", "index": 10}, {"hide": true, "name": "stageName", "index": 11}, {"hide": true, "name": "opportunityCreationDate", "index": 12}, {"hide": true, "name": "state", "index": 13}, {"hide": true, "name": "industrySegment", "index": 14}, {"hide": true, "name": "sumInsured", "index": 15}, {"hide": true, "name": "opportunityType", "index": 16}]'::jsonb AS table_setting_json,
    u.id AS created_by,
    u.id AS updated_by
FROM users u
JOIN organisation o ON u.organisation_id = o.id
WHERE u.user_status_key = 'USER_STATUS_ACTIVE' and u.id > 0;

-- Client Portfolio: align existing rows to the policy-driven columns
-- (Policy/RO/SO premium with Service score & Actions last). Needed because the
-- INSERT above only seeds fresh environments; existing rows keep the old order.
UPDATE filter_preference
SET table_setting_json = '[{"hide": false, "name": "companyName", "index": 0}, {"hide": false, "name": "policyPremium", "index": 1}, {"hide": false, "name": "roPremium", "index": 2}, {"hide": false, "name": "soPremium", "index": 3}, {"hide": false, "name": "priority", "index": 4}, {"hide": false, "name": "claimAmount", "index": 5}, {"hide": false, "name": "ServiceScore", "index": 6}, {"hide": false, "name": "actions", "index": 7}]'::jsonb,
    updated_at = NOW()
WHERE entity = 'CLIENT_PORTFOLIO';
