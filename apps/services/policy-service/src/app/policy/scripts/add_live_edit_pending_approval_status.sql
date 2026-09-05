-- SQL script to add LIVE_EDIT_PENDING_APPROVAL status to lookup table for policy configuration statuses
-- This allows creating edit versions of live policy configurations
-- Check if the status already exists to avoid duplicates
DO $ $ BEGIN -- Insert the new lookup entry if it doesn't exist
IF NOT EXISTS (
    SELECT
        1
    FROM
        lookup_data
    WHERE
        lookup_key = 'POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL'
) THEN
INSERT INTO
    lookup_data (
        lookup_name,
        lookup_key,
        value_key,
        value,
        description,
        lookup_order,
        organisation_id,
        status,
        created_by,
        updated_by,
        created_at,
        updated_at
    )
VALUES
    (
        'POLICY_CONFIGURATION_STATUS',
        'POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL',
        'LIVE_EDIT_PENDING_APPROVAL',
        'Live Edit Pending Approval',
        'Status for policy configuration when an edit version of a live configuration is pending approval',
        100,
        1,
        1,
        'SYSTEM',
        'SYSTEM',
        NOW(),
        NOW()
    );

RAISE NOTICE 'Successfully added POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL to lookup_data table';

ELSE RAISE NOTICE 'POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL already exists in lookup_data table';

END IF;

END $ $;