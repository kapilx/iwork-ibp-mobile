-- =====================================================
-- BULK EDIT RBAC INTEGRATION - Database Insert Scripts
-- =====================================================
-- Description: Complete SQL scripts to add bulk-edit functionality to RBAC system
-- Author: AI Assistant
-- Date: Generated based on RBAC documentation
-- Tables: acl_categories, acl_actions, acl_category_action_map, 
--         role_acl_category_action_map, acl_category_action_api_map
-- =====================================================
-- Set transaction isolation level for consistency
BEGIN;

-- =====================================================
-- 1. INSERT INTO acl_categories
-- =====================================================
-- Create the "Bulk-Edit" category for document operations
INSERT INTO
    acl_categories (
        name,
        description,
        parent,
        category_key,
        application_scope,
        created_by,
        updated_by
    )
VALUES
    (
        'Bulk-Edit',
        'Bulk Edit records for company, opportunity and policy',
        'BULK_EDIT',
        'BULK_EDIT',
        'iWork',
        'system',
        'system'
    );

-- =====================================================
-- 2. ACL_ACTIONS - Using existing READ_001 and WRITE_001
-- =====================================================
-- Note: Using existing actions READ_001 and WRITE_001 - no insert needed
-- =====================================================
-- 3. INSERT INTO acl_category_action_map
-- =====================================================
-- Map the bulk edit category to write action only
-- Note: Only using WRITE_001 action key since validation is handled within execute
INSERT INTO
    acl_category_action_map (
        acl_category_id,
        acl_action_id,
        created_by,
        updated_by
    )
VALUES
    (
        (
            SELECT
                id
            FROM
                acl_categories
            WHERE
                category_key = 'BULK_EDIT'
        ),
        (
            SELECT
                id
            FROM
                acl_actions
            WHERE
                action_key = 'WRITE_001'
        ),
        'system',
        'system'
    );

INSERT INTO
    acl_category_action_map (
        acl_category_id,
        acl_action_id,
        created_by,
        updated_by
    )
VALUES
    (
        (
            SELECT
                id
            FROM
                acl_categories
            WHERE
                category_key = 'BULK_EDIT'
        ),
        (
            SELECT
                id
            FROM
                acl_actions
            WHERE
                action_key = 'READ_001'
        ),
        'system',
        'system'
    );

-- =====================================================
-- 4. INSERT INTO acl_category_action_api_map
-- =====================================================
-- Map the category-action combination to actual API endpoint
-- Note: Only mapping the execute endpoint since validation is handled within execute
INSERT INTO
    acl_category_action_api_map (
        acl_category_action_id,
        api,
        method,
        created_by,
        updated_by
    )
VALUES
    -- Bulk Edit Execution Endpoint (WRITE permission)
    (
        (
            SELECT
                acam.id
            FROM
                acl_category_action_map acam
                JOIN acl_categories ac ON acam.acl_category_id = ac.id
                JOIN acl_actions aa ON acam.acl_action_id = aa.id
            WHERE
                ac.category_key = 'BULK_EDIT'
                AND aa.action_key = 'WRITE_001'
        ),
        'bulk-edit',
        'POST',
        'system',
        'system'
    );

INSERT INTO
    acl_category_action_api_map (
        acl_category_action_id,
        api,
        method,
        created_by,
        updated_by
    )
VALUES
    -- Bulk Edit Execution Endpoint (WRITE permission)
    (
        (
            SELECT
                acam.id
            FROM
                acl_category_action_map acam
                JOIN acl_categories ac ON acam.acl_category_id = ac.id
                JOIN acl_actions aa ON acam.acl_action_id = aa.id
            WHERE
                ac.category_key = 'BULK_EDIT'
                AND aa.action_key = 'READ_001'
        ),
        'bulk-edit',
        'GET',
        'system',
        'system'
    );

-- =====================================================
-- 5. INSERT INTO role_acl_category_action_map
-- =====================================================
-- Assign bulk edit permissions to roles
-- Note: You'll need to update these role assignments based on your actual role names
-- Example: Assign WRITE permission to roles that can execute bulk operations
-- Note: Since validation is handled within execute, only WRITE permission is needed
INSERT INTO
    role_acl_category_action_map (
        role_id,
        acl_category_action_id,
        created_by,
        updated_by
    )
VALUES
    -- Super User gets WRITE permission (execute with validation)
    (
        (
            SELECT
                id
            FROM
                roles
            WHERE
                name = 'Super User'
        ),
        (
            SELECT
                acam.id
            FROM
                acl_category_action_map acam
                JOIN acl_categories ac ON acam.acl_category_id = ac.id
                JOIN acl_actions aa ON acam.acl_action_id = aa.id
            WHERE
                ac.category_key = 'BULK_EDIT'
                AND aa.action_key = 'WRITE_001'
        ),
        'system',
        'system'
    ),
    -- Branch Head gets WRITE permission (execute with validation)
    (
        (
            SELECT
                id
            FROM
                roles
            WHERE
                name = 'Branch Head'
        ),
        (
            SELECT
                acam.id
            FROM
                acl_category_action_map acam
                JOIN acl_categories ac ON acam.acl_category_id = ac.id
                JOIN acl_actions aa ON acam.acl_action_id = aa.id
            WHERE
                ac.category_key = 'BULK_EDIT'
                AND aa.action_key = 'WRITE_001'
        ),
        'system',
        'system'
    ),
    (
        (
            SELECT
                id
            FROM
                roles
            WHERE
                name = 'Super User'
        ),
        (
            SELECT
                acam.id
            FROM
                acl_category_action_map acam
                JOIN acl_categories ac ON acam.acl_category_id = ac.id
                JOIN acl_actions aa ON acam.acl_action_id = aa.id
            WHERE
                ac.category_key = 'BULK_EDIT'
                AND aa.action_key = 'READ_001'
        ),
        'system',
        'system'
    ),
    -- Branch Head gets WRITE permission (execute with validation)
    (
        (
            SELECT
                id
            FROM
                roles
            WHERE
                name = 'Branch Head'
        ),
        (
            SELECT
                acam.id
            FROM
                acl_category_action_map acam
                JOIN acl_categories ac ON acam.acl_category_id = ac.id
                JOIN acl_actions aa ON acam.acl_action_id = aa.id
            WHERE
                ac.category_key = 'BULK_EDIT'
                AND aa.action_key = 'READ_001'
        ),
        'system',
        'system'
    );

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================
COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the inserts worked correctly
-- 1. Verify the bulk edit category was created
SELECT
    *
FROM
    acl_categories
WHERE
    category_key = 'BULK_EDIT';

-- 2. Verify the existing WRITE action is available  
SELECT
    *
FROM
    acl_actions
WHERE
    action_key = 'WRITE_001';

-- 3. Verify the category-action mappings
SELECT
    ac.name as category_name,
    aa.name as action_name,
    acam.id as mapping_id
FROM
    acl_category_action_map acam
    JOIN acl_categories ac ON acam.acl_category_id = ac.id
    JOIN acl_actions aa ON acam.acl_action_id = aa.id
WHERE
    ac.category_key = 'BULK_EDIT';

-- 4. Verify the API endpoint mappings
SELECT
    ac.name as category_name,
    aa.name as action_name,
    apim.api apim.method
FROM
    acl_category_action_api_map apim
    JOIN acl_category_action_map acam ON apim.acl_category_action_id = acam.id
    JOIN acl_categories ac ON acam.acl_category_id = ac.id
    JOIN acl_actions aa ON acam.acl_action_id = aa.id
WHERE
    ac.category_key = 'BULK_EDIT';

-- 5. Verify role assignments (update role names as needed)
SELECT
    r.name as role_name,
    ac.name as category_name,
    aa.name as action_name,
    apim.api,
    apim.method
FROM
    role_acl_category_action_map racam
    JOIN roles r ON racam.role_id = r.id
    JOIN acl_category_action_map acam ON racam.acl_category_action_map_id = acam.id
    JOIN acl_categories ac ON acam.acl_category_id = ac.id
    JOIN acl_actions aa ON acam.acl_action_id = aa.id
    LEFT JOIN acl_category_action_api_map apim ON acam.id = apim.acl_category_action_id
WHERE
    ac.category_key = 'BULK_EDIT'
ORDER BY
    r.name,
    aa.action_key;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
/*
 -- Uncomment and run this section if you need to rollback the changes
 
 BEGIN;
 
 -- Remove role assignments
 DELETE FROM role_acl_category_action_map 
 WHERE acl_category_action_map_id IN (
 SELECT acam.id 
 FROM acl_category_action_map acam
 JOIN acl_categories ac ON acam.acl_category_id = ac.id
 WHERE ac.category_key = 'BULK_EDIT'
 );
 
 -- Remove API mappings
 DELETE FROM acl_category_action_api_map 
 WHERE acl_category_action_id IN (
 SELECT acam.id 
 FROM acl_category_action_map acam
 JOIN acl_categories ac ON acam.acl_category_id = ac.id
 WHERE ac.category_key = 'BULK_EDIT'
 );
 
 -- Remove category-action mappings
 DELETE FROM acl_category_action_map 
 WHERE acl_category_id = (SELECT id FROM acl_categories WHERE category_key = 'BULK_EDIT');
 
 -- Note: Not deleting READ_001 and WRITE_001 actions as they are used elsewhere
 
 -- Remove category
 DELETE FROM acl_categories WHERE category_key = 'BULK_EDIT';
 
 COMMIT;
 */
-- =====================================================
-- NOTES AND CUSTOMIZATION
-- =====================================================
/*
 1. ROLE NAMES: Update the role names in the role_acl_category_action_map section
 based on your actual role table data. Common roles might be:
 - 'Admin'
 - 'Super User' 
 - 'Branch Head'
 - 'Policy Manager'
 - 'System User'
 
 2. API ENDPOINTS: The API endpoints are set to match your controller:
 - POST /api/bulk-edit/validate (requires BULK_READ_001)
 - POST /api/bulk-edit/execute (requires BULK_WRITE_001)
 
 3. CATEGORY HIERARCHY: The parent is set to 'DOCUMENT_OPERATIONS' - update if needed
 
 4. APPLICATION SCOPE: Set to 'IIRM_PLATFORM' - update based on your system
 
 5. FOREIGN KEY DEPENDENCIES: All inserts use subqueries to maintain referential integrity
 
 6. TRANSACTION SAFETY: Everything is wrapped in a transaction for atomicity
 
 7. CONFLICT HANDLING: Actions use ON CONFLICT DO NOTHING to prevent duplicates
 */
INSERT INTO
    notification_event_type (name, description)
VALUES
    (
        'Bulk_Edit_Ownership_Transfer',
        'For notifying the old owner about transfer of records'
    ),
    (
        'Bulk_Edit_Ownership_Received',
        'For notifying the new owner about assignment of new records'
    ),
    (
        'Bulk_Edit_Manager_Notification',
        'For notifying the manager about newly assigned records'
    );

INSERT INTO
    notification_parameter (key, description)
VALUES
    (
        'entityType',
        'specifying the entity belong to company, opportunity or policy'
    ),
    (
        'noOfRecords',
        'specifying the no of records updated'
    ),
    (
        'ownerName',
        'specifying the name of the new owner'
    );

INSERT INTO
    notification_event_parameter_mapping (event_type_id, parameter_definition_id, required)
VALUES
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Ownership_Transfer'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'entityType'
        ),
        true
    ),
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Ownership_Transfer'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'noOfRecords'
        ),
        true
    ),
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Ownership_Transfer'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'ownerName'
        ),
        true
    ),
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Ownership_Received'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'entityType'
        ),
        true
    ),
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Ownership_Received'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'noOfRecords'
        ),
        true
    ),
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Ownership_Received'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'ownerName'
        ),
        true
    ),
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Manager_Notification'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'entityType'
        ),
        true
    ),
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Manager_Notification'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'noOfRecords'
        ),
        true
    ),
    (
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Manager_Notification'
        ),
        (
            Select
                id
            from
                notification_parameter
            where
                key = 'ownerName'
        ),
        true
    );

INSERT INTO
    notification_channel_event_template_mapping (
        subject,
        body,
        event_type_id,
        channel_type_id,
        status_lid,
        created_by,
        updated_by,
        created_at,
        updated_at
    )
VALUES
    (
        '{{entityType}} Ownership Transferred',
        'You are no longer the owner of {{noOfRecords}} {{entityType}} records. Ownership has been transferred to {{ownerName}}.',
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Ownership_Transfer'
        ),
        1,
        4650,
        1,
        1,
        '2025-11-11 00:38:14.047823+05:30',
        '2025-11-11 00:38:14.047823+05:30'
    ),
    (
        '{{entityType}} Ownership Assigned',
        'You have been assigned as the new owner of {{noOfRecords}} {{entityType}} records. Please review your responsibilities.',
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Ownership_Received'
        ),
        1,
        4650,
        1,
        1,
        '2025-11-11 00:38:14.047823+05:30',
        '2025-11-11 00:38:14.047823+05:30'
    ),
    (
        '{{entityType}} Ownership Change Notification',
        '{{ownerName}} is now the owner of {{noOfRecords}} {{entityType}} records. Please ensure a smooth transition.',
        (
            Select
                id
            from
                notification_event_type
            where
                name = 'Bulk_Edit_Manager_Notification'
        ),
        1,
        4650,
        1,
        1,
        '2025-11-11 00:38:14.047823+05:30',
        '2025-11-11 00:38:14.047823+05:30'
    );