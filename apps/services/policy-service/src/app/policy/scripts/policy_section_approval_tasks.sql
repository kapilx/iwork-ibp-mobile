ALTER TABLE task
    ALTER COLUMN activity_id DROP NOT NULL;

ALTER TABLE task
    ADD COLUMN IF NOT EXISTS policy_id INT NULL;

ALTER TABLE task
    ADD COLUMN IF NOT EXISTS task_origin VARCHAR(100) NULL;

ALTER TABLE task
    ADD COLUMN IF NOT EXISTS task_label VARCHAR(150) NULL;

UPDATE task
SET task_origin = 'POLICY_SECTION_APPROVAL',
    task_label = CASE task_name
        WHEN 'Policy details - Approval' THEN 'POLICY_APPROVAL_POLICY_DETAILS'
        WHEN 'Policy covers - Approval' THEN 'POLICY_APPROVAL_POLICY_COVERS'
        WHEN 'Caution deposit - Approval' THEN 'POLICY_APPROVAL_POLICY_CD'
        ELSE task_label
    END
WHERE task_name IN (
    'Policy details - Approval',
    'Policy covers - Approval',
    'Caution deposit - Approval'
);
