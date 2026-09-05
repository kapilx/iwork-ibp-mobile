-- Step 1: Add category-action mapping
INSERT INTO acl_category_action_map (acl_category_id, acl_action_id, created_by, updated_by)
VALUES (
    (SELECT id FROM acl_categories WHERE category_key = 'ADMIN_REPORTS'),
    (SELECT id FROM acl_actions WHERE action_key = 'EXPORT_001'),
    'system', 'system'
);

-- Step 2: Add API mapping
INSERT INTO acl_category_action_api_map (acl_category_action_id, api, method, created_by, updated_by)
VALUES (
    (SELECT id FROM acl_category_action_map 
     WHERE acl_category_id = (SELECT id FROM acl_categories WHERE category_key = 'ADMIN_REPORTS')
     AND acl_action_id = (SELECT id FROM acl_actions WHERE action_key = 'EXPORT_001')),
    'reports/utilisation/download', 'GET', 'system', 'system'
);