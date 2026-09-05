--  Add foreign key constraint linking location_id to country(id)
ALTER TABLE
    opportunity_previous_mediator_details
ADD
    CONSTRAINT fk_opportunity_previous_mediator_details_location FOREIGN KEY (location_id) REFERENCES country (id) ON DELETE CASCADE;

--  Add foreign key constraint linking branch_id to city(id)
ALTER TABLE
    opportunity_previous_mediator_details
ADD
    CONSTRAINT fk_opportunity_previous_mediator_details_branch FOREIGN KEY (branch_id) REFERENCES city (id) ON DELETE CASCADE;

--  Insert lookup values for Opportunity Source Type
INSERT INTO
    lookup_data (
        lookup_name,
        lookup_key,
        value_key,
        value,
        description,
        created_by,
        updated_by,
        lookup_order
    )
VALUES
    (
        'OPPORTUNITY_SOURCE_TYPE',
        'OPPORTUNITY_SOURCE_TYPE_RESEARCH',
        'RESEARCH',
        'Research',
        'Opportunity Source Type Research',
        'Admin',
        'Admin',
        5
    ),
    (
        'OPPORTUNITY_SOURCE_TYPE',
        'OPPORTUNITY_SOURCE_TYPE_EMPLOYEE',
        'EMPLOYEE',
        'Employee',
        'Opportunity Source Type Employee',
        'Admin',
        'Admin',
        2
    ),
    (
        'OPPORTUNITY_SOURCE_TYPE',
        'OPPORTUNITY_SOURCE_TYPE_FRIEND',
        'FRIEND',
        'Friend',
        'Opportunity Source Type Friend',
        'Admin',
        'Admin',
        3
    ),
    (
        'OPPORTUNITY_SOURCE_TYPE',
        'OPPORTUNITY_SOURCE_TYPE_LINKEDIN',
        'LINKEDIN',
        'LinkedIn',
        'Opportunity Source Type LinkedIn',
        'Admin',
        'Admin',
        4
    ),
    (
        'OPPORTUNITY_SOURCE_TYPE',
        'OPPORTUNITY_SOURCE_TYPE_TRADESHOW',
        'TRADESHOW',
        'Tradeshow',
        'Opportunity Source Type Tradeshow',
        'Admin',
        'Admin',
        6
    ),
    (
        'OPPORTUNITY_SOURCE_TYPE',
        'OPPORTUNITY_SOURCE_TYPE_CXO',
        'CXO',
        'CXO',
        'Opportunity Source Type CXO',
        'Admin',
        'Admin',
        1
    ),
    (
        'OPPORTUNITY_SOURCE_TYPE',
        'OPPORTUNITY_SOURCE_TYPE_OTHER',
        'OTHER',
        'Other',
        'Opportunity Source Type Other',
        'Admin',
        'Admin',
        7
    );

--  Insert lookup values for Policy Mined options
INSERT INTO
    lookup_data (
        lookup_name,
        lookup_key,
        value_key,
        value,
        description,
        created_by,
        updated_by,
        lookup_order
    )
VALUES
    (
        'IS_POLICY_MINED',
        'IS_POLICY_MINED_YES',
        'YES',
        'Yes',
        'Is Policy Mined - Yes',
        'Admin',
        'Admin',
        1
    ),
    (
        'IS_POLICY_MINED',
        'IS_POLICY_MINED_NO',
        'NO',
        'No',
        'Is Policy Mined - No',
        'Admin',
        'Admin',
        2
    );

-- Insert lookup values for Opportunity Types
INSERT INTO
    lookup_data (
        lookup_name,
        lookup_key,
        value_key,
        value,
        description,
        created_by,
        updated_by,
        lookup_order
    )
VALUES
    (
        'OPPORTUNITY_TYPE',
        'OPPORTUNITY_TYPE_FRESH',
        'FRESH',
        'Fresh',
        'Opportunity Type - Fresh',
        'Admin',
        'Admin',
        1
    ),
    (
        'OPPORTUNITY_TYPE',
        'OPPORTUNITY_TYPE_RENEWAL',
        'RENEWAL',
        'Renewal',
        'Opportunity Type - Renewal',
        'Admin',
        'Admin',
        2
    );

-- Create table to store previous placement details for opportunities
CREATE TABLE opportunity_previous_placement_details (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER NOT NULL,
    challenges_and_mitigation TEXT,
    existing_competition TEXT,
    remarks TEXT,
    CONSTRAINT fk_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunity (id) ON DELETE CASCADE
);

-- Create table to store previous mediator details for opportunities
CREATE TABLE opportunity_previous_mediator_details (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    location_id INTEGER,
    branch_id INTEGER,
    mediator_type_id INTEGER NOT NULL,
    CONSTRAINT fk_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunity (id) ON DELETE CASCADE,
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES company (id) ON DELETE CASCADE
);

--  Create table to map contacts to opportunities with uniqueness constraint
CREATE TABLE opportunity_contact_map (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    CONSTRAINT fk_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunity (id) ON DELETE CASCADE,
    CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES contact (id) ON DELETE CASCADE,
    CONSTRAINT unique_opportunity_contact UNIQUE (opportunity_id, contact_id)
);

--  Add foreign key column for opportunity type in opportunity table
ALTER TABLE
    opportunity
ADD
    COLUMN opportunity_type_lid INTEGER,
ADD
    CONSTRAINT fk_opportunity_type_lid FOREIGN KEY (opportunity_type_lid) REFERENCES lookup_data (id);

--  Add foreign key column for is policy mined flag in opportunity table
ALTER TABLE
    opportunity
ADD
    COLUMN is_policy_mined_lid INTEGER,
ADD
    CONSTRAINT fk_is_policy_mined_lid FOREIGN KEY (is_policy_mined_lid) REFERENCES lookup_data (id);

--  Add foreign key column for source type in opportunity table
ALTER TABLE
    opportunity
ADD
    COLUMN source_type_lid INTEGER,
ADD
    CONSTRAINT fk_source_type_lid FOREIGN KEY (source_type_lid) REFERENCES lookup_data (id);

--  Add free text column for source in opportunity table
ALTER TABLE
    opportunity
ADD
    COLUMN source VARCHAR(255);

--  Add remarks column in opportunity_claim_experience table
ALTER TABLE
    opportunity_claim_experience
ADD
    COLUMN remarks TEXT;

------------- **** -------------------------
--  Add lookup values for Activity Submission Status
INSERT INTO
    lookup_data (
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
    )
VALUES
    (
        'ACTIVITY_STATUS_DRAFT',
        'ACTIVITY_SUBMISSION_STATUS',
        'DRAFT',
        'Save as Draft',
        'Activity is saved as draft',
        NOW(),
        NOW(),
        'Admin',
        'Admin',
        1
    ),
    (
        'ACTIVITY_STATUS_SUBMITTED',
        'ACTIVITY_SUBMISSION_STATUS',
        'SUBMITTED',
        'Submitted',
        'Activity has been submitted for review or approval',
        NOW(),
        NOW(),
        'Admin',
        'Admin',
        2
    ),
    (
        'ACTIVITY_STATUS_APPROVED',
        'ACTIVITY_SUBMISSION_STATUS',
        'APPROVED',
        'Approved',
        'Activity has been reviewed and approved',
        NOW(),
        NOW(),
        'Admin',
        'Admin',
        3
    );

DROP TABLE IF EXISTS public.kdm_meeting_document_map;

DROP TABLE IF EXISTS public.kdm_meeting;

CREATE TABLE IF NOT EXISTS public.opportunity_kdm_meeting (
    id SERIAL,
    meeting_id INTEGER NOT NULL,
    status_lid INTEGER,
    remarks TEXT,
    opportunity_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    -- Constraints
    CONSTRAINT pk_kdm_meeting PRIMARY KEY (id),
    CONSTRAINT fk_kdm_meeting_meeting FOREIGN KEY (meeting_id) REFERENCES public.meeting (id) ON
    UPDATE
        CASCADE ON DELETE CASCADE
);

-------- ****** -------------------------
-- Data validation
ALTER TABLE
    public.data_validation
ALTER COLUMN
    plan_date DROP NOT NULL;

ALTER TABLE
    public.data_validation
ALTER COLUMN
    opportunity_id DROP NOT NULL;

ALTER TABLE
    public.data_validation
ALTER COLUMN
    activity_id DROP NOT NULL;

ALTER TABLE
    public.data_validation DROP CONSTRAINT IF EXISTS fk_data_validation_activity;

ALTER TABLE
    public.data_validation DROP CONSTRAINT IF EXISTS fk_data_validation_opportunity;

ALTER TABLE
    public.data_validation RENAME TO public.opportunity_data_validation;

UPDATE
    public.mstr_activity
SET
    opportunity_table = 'opportunity_data_validation'
WHERE
    opportunity_table = 'data_validation'
    AND id = 17;

UPDATE
    public.mstr_stage_activity_template
SET
    opportunity_table = 'opportunity_data_validation'
WHERE
    activity_id = 17;

UPDATE
    public.opportunity_activity_map
SET
    opportunity_table = 'opportunity_data_validation'
WHERE
    ref_activity_id = 17;

---------------------
-- Mandate form
UPDATE
    public.mstr_activity
SET
    opportunity_table = 'opportunity_mandate_details_entry'
WHERE
    opportunity_table = 'mandate_details_entry'
    AND id = 19;

UPDATE
    public.mstr_stage_activity_template
SET
    opportunity_table = 'opportunity_mandate_details_entry'
WHERE
    activity_id = 19;

UPDATE
    public.opportunity_activity_map
SET
    opportunity_table = 'opportunity_mandate_details_entry'
WHERE
    ref_activity_id = 19;

--------------------
ALTER TABLE
    public.opportunity_data_validation_document_map
ADD
    COLUMN IF NOT EXISTS document_type_lid INTEGER DEFAULT 237;

---------------------
ALTER TABLE
    public.opportunity_kdm_meeting
ADD
    COLUMN IF NOT EXISTS kdm_meeting_type_lid INTEGER NOT NULL,
ADD
    COLUMN IF NOT EXISTS select_meeting_id INTEGER,
ADD
    COLUMN IF NOT EXISTS mom TEXT;

----------------------
ALTER TABLE
    public.opportunity_hand_over_meet
ADD
    COLUMN IF NOT EXISTS hand_over_meeting_type_lid INTEGER NOT NULL,
ADD
    COLUMN IF NOT EXISTS select_meeting_id INTEGER,
ADD
    COLUMN IF NOT EXISTS mom TEXT;

----------------------
CREATE TABLE IF NOT EXISTS opportunity_lost (
    id SERIAL PRIMARY KEY,
    opportunity_id INT NOT NULL,
    activity_id INT NOT NULL,
    opportunity_activity_id INT NOT NULL,
    remarks TEXT,
    reason_for_loss_lid INT NOT NULL,
    status_lid INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL
);

UPDATE
    public.mstr_activity
SET
    opportunity_table = 'opportunity_lost'
WHERE
    id = 16;

UPDATE
    public.mstr_stage_activity_template
SET
    opportunity_table = 'opportunity_lost'
WHERE
    activity_id = 16;

UPDATE
    public.opportunity_activity_map
SET
    opportunity_table = 'opportunity_lost'
WHERE
    ref_activity_id = 16;

INSERT INTO
    lookup_data (
        lookup_key,
        lookup_name,
        value_key,
        value,
        description,
        created_at,
        updated_at,
        created_by,
        updated_by
    )
VALUES
    (
        'REASON_LOSS_HIGH_COST',
        'REASON_FOR_OPPORTUNITY_LOSS',
        'HIGH_COST',
        'High Cost',
        'Opportunity lost due to higher pricing',
        NOW(),
        NOW(),
        'Admin',
        'Admin'
    ),
    (
        'REASON_LOSS_COMPETITOR',
        'REASON_FOR_OPPORTUNITY_LOSS',
        'COMPETITOR_CHOSEN',
        'Competitor Chosen',
        'Opportunity lost to a competitor',
        NOW(),
        NOW(),
        'Admin',
        'Admin'
    ),
    (
        'REASON_LOSS_SCOPE',
        'REASON_FOR_OPPORTUNITY_LOSS',
        'SCOPE_MISMATCH',
        'Scope Mismatch',
        'Proposed solution did not meet client requirements',
        NOW(),
        NOW(),
        'Admin',
        'Admin'
    );

----------------------
ALTER TABLE
    public.opportunity_activity_map
ADD
    COLUMN IF NOT EXISTS owner_id INT;

---------------
ALTER TABLE
    opportunity_kdm_meeting
ADD
    COLUMN IF NOT EXISTS opportunity_activity_id INTEGER;

----------------
ALTER TABLE
    opportunity_mandate_details_entry
ADD
    COLUMN IF NOT EXISTS opportunity_activity_id INTEGER;

----------------
ALTER TABLE
    opportunity_data_validation
ADD
    COLUMN IF NOT EXISTS opportunity_activity_id INTEGER;

----------------
UPDATE
    lookup_data
SET
    lookup_key = 'OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS',
    value_key = 'WORK_IN_PROGRESS',
    value = 'Work In Progress',
    lookup_order = 2,
    description = 'Opportunity activity is currently being worked on'
WHERE
    lookup_key = 'OPPORTUNITY_STATUS_IN_PROGRESS'
    AND lookup_name = 'OPPORTUNITY_STATUS';

UPDATE
    lookup_data
SET
    lookup_key = 'OPPORTUNITY_ACTIVITY_STATUS_OPEN',
    value_key = 'OPEN',
    value = 'Open',
    lookup_order = 1,
    description = 'Opportunity activity is open and active'
WHERE
    lookup_key = 'OPPORTUNITY_STATUS_COMPLETED'
    AND lookup_name = 'OPPORTUNITY_STATUS';

UPDATE
    lookup_data
SET
    lookup_key = 'OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED',
    value_key = 'SUBMITTED',
    value = 'Submitted',
    lookup_order = 3,
    description = 'Opportunity activity has been submitted'
WHERE
    lookup_key = 'OPPORTUNITY_STATUS_SUBMITTED'
    AND lookup_name = 'OPPORTUNITY_STATUS';

UPDATE
    lookup_data
SET
    lookup_key = 'OPPORTUNITY_ACTIVITY_STATUS_CLOSED',
    value_key = 'CLOSED',
    value = 'Closed',
    lookup_order = 4,
    description = 'Opportunity activity has been closed'
WHERE
    lookup_key = 'OPPORTUNITY_STATUS_CLOSED'
    AND lookup_name = 'OPPORTUNITY_STATUS';

UPDATE
    lookup_data
SET
    lookup_name = 'OPPORTUNITY_ACTIVITY_STATUS'
WHERE
    lookup_key IN (
        'OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS',
        'OPPORTUNITY_ACTIVITY_STATUS_OPEN',
        'OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED',
        'OPPORTUNITY_ACTIVITY_STATUS_CLOSED'
    );

DELETE FROM
    lookup_data
WHERE
    lookup_key IN (
        'ACTIVITY_STATUS_DRAFT',
        'ACTIVITY_STATUS_SUBMITTED',
        'ACTIVITY_STATUS_APPROVED'
    );

-----------------
-- Remove status column from opportunity_activity_map table
ALTER TABLE
    opportunity_activity_map DROP COLUMN status;

------------------
-- Remove reason_for_loss_lid NOT NULL constraint from opportunity_lost table
ALTER TABLE
    opportunity_lost
ALTER COLUMN
    reason_for_loss_lid DROP NOT NULL;

------------------
ALTER TABLE
    opportunity_lost
ALTER COLUMN
    status_lid DROP NOT NULL,
ALTER COLUMN
    opportunity_activity_id DROP NOT NULL,
ALTER COLUMN
    activity_id DROP NOT NULL;

-- Delete records where opportunity_table = 'opportunity_lost'
DELETE FROM
    public.mstr_activity
WHERE
    opportunity_table = 'opportunity_lost';

DELETE FROM
    public.mstr_stage_activity_template
WHERE
    opportunity_table = 'opportunity_lost';

DELETE FROM
    public.opportunity_activity_map
WHERE
    opportunity_table = 'opportunity_lost';

------------------
--activity reorder
UPDATE
    mstr_activity
SET
    activity_order = CASE
        opportunity_table
        WHEN 'opportunity_data_validation' THEN 1
        WHEN 'opportunity_kdm_meeting' THEN 2
        WHEN 'opportunity_mandate_details_entry' THEN 3
        WHEN 'opportunity_rfp_cover_detail' THEN 4
        WHEN 'opportunity_rfp_details_entry' THEN 5
        WHEN 'opportunity_broking_slip_version_details' THEN 6
        WHEN 'opportunity_quote_entry' THEN 7
        WHEN 'opportunity_quote_comparison_report' THEN 8
        WHEN 'opportunity_final_negotiation' THEN 9
        WHEN 'opportunity_placement_slip_generation' THEN 10
        WHEN 'opportunity_premium_calculation' THEN 11
        WHEN 'opportunity_held_cover_note' THEN 12
        WHEN 'opportunity_policy_hard_copy' THEN 13
        WHEN 'opportunity_policy_docket' THEN 14
        WHEN 'opportunity_hand_over_meet' THEN 15
        WHEN 'opportunity_policy_confirmation' THEN 16
        ELSE activity_order
    END
WHERE
    opportunity_table IN (
        'opportunity_data_validation',
        'opportunity_kdm_meeting',
        'opportunity_mandate_details_entry',
        'opportunity_rfp_cover_detail',
        'opportunity_rfp_details_entry',
        'opportunity_broking_slip_version_details',
        'opportunity_quote_entry',
        'opportunity_quote_comparison_report',
        'opportunity_final_negotiation',
        'opportunity_placement_slip_generation',
        'opportunity_premium_calculation',
        'opportunity_held_cover_note',
        'opportunity_policy_hard_copy',
        'opportunity_policy_confirmation',
        'opportunity_policy_docket',
        'opportunity_hand_over_meet'
    );

UPDATE
    mstr_stage_activity_template
SET
    stage_activity_order = CASE
        opportunity_table
        WHEN 'opportunity_data_validation' THEN 1
        WHEN 'opportunity_kdm_meeting' THEN 2
        WHEN 'opportunity_mandate_details_entry' THEN 3
        WHEN 'opportunity_rfp_cover_detail' THEN 4
        WHEN 'opportunity_rfp_details_entry' THEN 5
        WHEN 'opportunity_broking_slip_version_details' THEN 6
        WHEN 'opportunity_quote_entry' THEN 7
        WHEN 'opportunity_quote_comparison_report' THEN 8
        WHEN 'opportunity_final_negotiation' THEN 9
        WHEN 'opportunity_placement_slip_generation' THEN 10
        WHEN 'opportunity_premium_calculation' THEN 11
        WHEN 'opportunity_held_cover_note' THEN 12
        WHEN 'opportunity_policy_hard_copy' THEN 13
        WHEN 'opportunity_policy_docket' THEN 14
        WHEN 'opportunity_hand_over_meet' THEN 15
        WHEN 'opportunity_policy_confirmation' THEN 16
        ELSE stage_activity_order
    END
WHERE
    opportunity_table IN (
        'opportunity_data_validation',
        'opportunity_kdm_meeting',
        'opportunity_mandate_details_entry',
        'opportunity_rfp_cover_detail',
        'opportunity_rfp_details_entry',
        'opportunity_broking_slip_version_details',
        'opportunity_quote_entry',
        'opportunity_quote_comparison_report',
        'opportunity_final_negotiation',
        'opportunity_placement_slip_generation',
        'opportunity_premium_calculation',
        'opportunity_held_cover_note',
        'opportunity_policy_hard_copy',
        'opportunity_policy_confirmation',
        'opportunity_policy_docket',
        'opportunity_hand_over_meet'
    );

-- Step 1: Get the stage ID for 'Policy Issuance'
WITH stage_cte AS (
    SELECT
        id
    FROM
        public.mstr_stage
    WHERE
        name = 'Policy Issuance'
) -- Step 2: Update mstr_stage_activity_template
UPDATE
    mstr_stage_activity_template
SET
    stage_id = (
        SELECT
            id
        FROM
            stage_cte
    )
WHERE
    opportunity_table = 'opportunity_policy_confirmation';

-- Step 3: Update opportunity_activity_map
UPDATE
    opportunity_activity_map
SET
    ref_stage_id = (
        SELECT
            id
        FROM
            stage_cte
    )
WHERE
    opportunity_table = 'opportunity_policy_confirmation';

-- Step 4: Delete the old stage 'Policy Issuance'
DELETE FROM
    public.mstr_stage
WHERE
    name = 'Opportunity Lost';

ALTER TABLE
    opportunity_activity_map
ADD
    COLUMN activity_order integer;

UPDATE
    opportunity_activity_map
SET
    activity_order = CASE
        opportunity_table
        WHEN 'opportunity_data_validation' THEN 1
        WHEN 'opportunity_kdm_meeting' THEN 2
        WHEN 'opportunity_mandate_details_entry' THEN 3
        WHEN 'opportunity_rfp_cover_detail' THEN 4
        WHEN 'opportunity_rfp_details_entry' THEN 5
        WHEN 'opportunity_broking_slip_version_details' THEN 6
        WHEN 'opportunity_quote_entry' THEN 7
        WHEN 'opportunity_quote_comparison_report' THEN 8
        WHEN 'opportunity_final_negotiation' THEN 9
        WHEN 'opportunity_placement_slip_generation' THEN 10
        WHEN 'opportunity_premium_calculation' THEN 11
        WHEN 'opportunity_held_cover_note' THEN 12
        WHEN 'opportunity_policy_hard_copy' THEN 13
        WHEN 'opportunity_policy_docket' THEN 14
        WHEN 'opportunity_hand_over_meet' THEN 15
        WHEN 'opportunity_policy_confirmation' THEN 16
        ELSE activity_order
    END
WHERE
    opportunity_table IN (
        'opportunity_data_validation',
        'opportunity_kdm_meeting',
        'opportunity_mandate_details_entry',
        'opportunity_rfp_cover_detail',
        'opportunity_rfp_details_entry',
        'opportunity_broking_slip_version_details',
        'opportunity_quote_entry',
        'opportunity_quote_comparison_report',
        'opportunity_final_negotiation',
        'opportunity_placement_slip_generation',
        'opportunity_premium_calculation',
        'opportunity_held_cover_note',
        'opportunity_policy_hard_copy',
        'opportunity_policy_confirmation',
        'opportunity_policy_docket',
        'opportunity_hand_over_meet'
    );

-------------------
--Opportunity previous mediator details
-- 1. Drop the existing foreign key constraint on company_id
ALTER TABLE
    public.opportunity_previous_mediator_details DROP CONSTRAINT IF EXISTS fk_company;

-- 2. Add new foreign key constraint for location_id referencing city(id)
ALTER TABLE
    public.opportunity_previous_mediator_details
ADD
    CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES public.city(id) ON
UPDATE
    NO ACTION ON DELETE
SET
    NULL;

-- 3. Add new foreign key constraint for branch_id referencing address(id)
ALTER TABLE
    public.opportunity_previous_mediator_details
ADD
    CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES public.address(id) ON
UPDATE
    NO ACTION ON DELETE
SET
    NULL;

-- 4. Change mediator_type_id from integer to varchar and rename the column
ALTER TABLE
    public.opportunity_previous_mediator_details RENAME COLUMN mediator_type_id TO mediator_type;

ALTER TABLE
    public.opportunity_previous_mediator_details
ALTER COLUMN
    mediator_type TYPE varchar;

-- 5. Optionally add a CHECK constraint to allow only specific values
ALTER TABLE
    public.opportunity_previous_mediator_details
ADD
    CONSTRAINT chk_mediator_type CHECK (mediator_type IN ('TPA', 'BROKER', 'INSURER'));

-- 6. Add UNIQUE constraint on (company_id, opportunity_id, mediator_type)
ALTER TABLE
    public.opportunity_previous_mediator_details
ADD
    CONSTRAINT uq_company_opportunity_mediator_type UNIQUE (company_id, opportunity_id, mediator_type);

---------------
-- Opportunity Placement Slip Generation
ALTER TABLE
    opportunity_placement_slip_generation
ALTER COLUMN
    max_age_of_dependents DROP NOT NULL;

------------------
-- Opportunity
UPDATE
    opportunity
SET
    premium_paid = 0
WHERE
    premium_paid IS NULL;

ALTER TABLE
    opportunity
ALTER COLUMN
    premium_paid
SET
    NOT NULL;

-------------------
-- Opportunity mstr_activity, mstr_stage_activity_template lead_days
ALTER TABLE
    mstr_activity DROP COLUMN IF EXISTS lead_days;

ALTER TABLE
    mstr_stage_activity_template
ADD
    COLUMN IF NOT EXISTS lead_days INTEGER;

UPDATE
    mstr_stage_activity_template
SET
    lead_days = 5
WHERE
    lead_days IS NULL;

-------------------
ALTER TABLE
    opportunity_mandate_details_entry
ALTER COLUMN
    compensation_payable TYPE numeric(15, 2) USING compensation_payable:: numeric(15, 2);

---------------
-- Opportunity
ALTER TABLE
    opportunity RENAME COLUMN so_expire_date TO expiry_date;

-------------
ALTER TABLE
    opportunity_placement_slip_generation
ADD
    COLUMN brokerage_amount NUMERIC NOT NULL DEFAULT 0;

-- Update existing records to calculate brokerage_amount from total_premium * brokerage_percentage
UPDATE
    opportunity_placement_slip_generation
SET
    brokerage_amount = CASE
        WHEN total_premium IS NOT NULL
        AND brokerage_percentage IS NOT NULL THEN (total_premium * brokerage_percentage / 100)
        ELSE 0
    END;

------------------------
-- Add the ref_opportunity_id column to the opportunity table
ALTER TABLE
    opportunity
ADD
    COLUMN ref_opportunity_id INT NULL;

-- Add foreign key constraint for self-referencing relationship
ALTER TABLE
    opportunity
ADD
    CONSTRAINT fk_opportunity_ref_opportunity FOREIGN KEY (ref_opportunity_id) REFERENCES opportunity(id) ON DELETE
SET
    NULL;

--------------------------
-- Policy Hard Copy
ALTER TABLE
    opportunity_policy_hard_copy
ADD
    COLUMN brokerage_amount NUMERIC;

UPDATE
    opportunity_policy_hard_copy
SET
    brokerage_percentage = NULL
WHERE
    brokerage_percentage = ''
    OR brokerage_percentage IS NULL
    OR TRIM(brokerage_percentage) = '';

ALTER TABLE
    opportunity_policy_hard_copy
ALTER COLUMN
    brokerage_percentage TYPE numeric USING CASE
        WHEN brokerage_percentage IS NULL
        OR TRIM(brokerage_percentage) = '' THEN NULL
        ELSE brokerage_percentage:: numeric
    END;

----------------
ALTER TABLE
    opportunity_quote_entry
ADD
    COLUMN insurer_location_id INTEGER;

ALTER TABLE
    opportunity_final_negotiation
ADD
    COLUMN quote_insurer_location_id INTEGER;

--------------
-- Deviations
ALTER TABLE
    opportunity_held_cover_note
ADD
    COLUMN brokerage_percentage NUMERIC(5, 2),
ADD
    COLUMN brokerage_amount NUMERIC(19, 2);

ALTER TABLE
    opportunity_policy_confirmation
ADD
    COLUMN brokerage_percentage NUMERIC(5, 2),
ADD
    COLUMN brokerage_amount NUMERIC(19, 2);

--------------
ALTER TABLE
    opportunity_placement_slip_generation
ALTER COLUMN
    lead_insurer_id DROP NOT NULL;

ALTER TABLE
    opportunity_placement_slip_generation
ALTER COLUMN
    is_lead_insurer_pay_commission DROP NOT NULL;

UPDATE
    opportunity_placement_slip_generation
SET
    other = NULL
WHERE
    TRIM(other) = '';

ALTER TABLE
    opportunity_placement_slip_generation
ALTER COLUMN
    other TYPE NUMERIC(19, 2) USING TRIM(other):: NUMERIC(19, 2);

ALTER TABLE
    opportunity_placement_slip_insurer_map
ADD
    COLUMN is_lead_insurer INTEGER;

---------------
CREATE TABLE opportunity_held_cover_note_cover_detail (
    id SERIAL,
    held_cover_note_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    cover_template_id INTEGER NOT NULL,
    cover_name VARCHAR NOT NULL,
    cover_response VARCHAR,
    covers_meta JSONB,
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraints
    CONSTRAINT pk_opportunity_held_cover_note_cover_detail PRIMARY KEY (id),
    CONSTRAINT fk_held_cover_note FOREIGN KEY (held_cover_note_id) REFERENCES opportunity_held_cover_note(id)
);

CREATE TABLE opportunity_policy_hard_copy_cover_detail (
    id SERIAL,
    policy_hard_copy_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    cover_template_id INTEGER NOT NULL,
    cover_name VARCHAR NOT NULL,
    cover_response VARCHAR,
    covers_meta JSONB,
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraints
    CONSTRAINT pk_opportunity_policy_hard_copy_cover_detail PRIMARY KEY (id),
    CONSTRAINT fk_policy_hard_copy FOREIGN KEY (policy_hard_copy_id) REFERENCES opportunity_policy_hard_copy(id)
);

--------------------
-- DATE: 10-NOV-2025
ALTER TABLE
    opportunity_broking_slip_version_details
ADD
    COLUMN IF NOT EXISTS basic_premium numeric(19, 2),
ADD
    COLUMN IF NOT EXISTS brokerage_amount numeric(19, 2);

ALTER TABLE
    opportunity_final_negotiation_sharing_detail
ADD
    COLUMN IF NOT EXISTS share_amount numeric(19, 2),
ADD
    COLUMN IF NOT EXISTS insurer_location_id integer,
ADD
    COLUMN IF NOT EXISTS insurer_branch_id integer,
ADD
    COLUMN IF NOT EXISTS insurer_contact_id integer,
ADD
    COLUMN IF NOT EXISTS is_lead_insurer integer;

ALTER TABLE
    policy_insurer_map
ADD
    COLUMN IF NOT EXISTS brokerage_percentage numeric(5, 2),
ADD
    COLUMN IF NOT EXISTS brokerage_amount numeric(19, 2),
ADD
    COLUMN IF NOT EXISTS insurer_location_id integer,
ADD
    COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS opportunity_held_cover_note_insurer_map (
    id SERIAL,
    held_cover_note_id INTEGER NOT NULL,
    insurer_id INTEGER NOT NULL,
    insurer_location_id INTEGER NOT NULL,
    insurer_branch_id INTEGER NOT NULL,
    insurer_contact_id INTEGER NOT NULL,
    is_lead_insurer INTEGER,
    share_percentage NUMERIC(5, 2) NOT NULL,
    share_amount NUMERIC(19, 2) NOT NULL,
    brokerage_percentage NUMERIC(5, 2) NOT NULL,
    brokerage_amount NUMERIC(19, 2) NOT NULL,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    -- Constraints
    CONSTRAINT pk_opportunity_held_cover_note_insurer_map PRIMARY KEY (id),
    CONSTRAINT fk_held_cover_note FOREIGN KEY (held_cover_note_id) REFERENCES opportunity_held_cover_note(id),
    CONSTRAINT fk_held_cover_note_insurer FOREIGN KEY (insurer_id) REFERENCES insurer(id)
);

CREATE TABLE IF NOT EXISTS opportunity_policy_hard_copy_insurer_map (
    id SERIAL,
    policy_hard_copy_id INTEGER NOT NULL,
    insurer_id INTEGER NOT NULL,
    insurer_location_id INTEGER NOT NULL,
    insurer_branch_id INTEGER NOT NULL,
    insurer_contact_id INTEGER NOT NULL,
    is_lead_insurer INTEGER,
    share_percentage NUMERIC(5, 2) NOT NULL,
    share_amount NUMERIC(19, 2) NOT NULL,
    brokerage_percentage NUMERIC(5, 2) NOT NULL,
    brokerage_amount NUMERIC(19, 2) NOT NULL,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    -- Constraints
    CONSTRAINT pk_opportunity_policy_hard_copy_insurer_map PRIMARY KEY (id),
    CONSTRAINT fk_policy_hard_copy FOREIGN KEY (policy_hard_copy_id) REFERENCES opportunity_policy_hard_copy(id),
    CONSTRAINT fk_policy_hard_copy_insurer FOREIGN KEY (insurer_id) REFERENCES insurer(id)
);

CREATE TABLE IF NOT EXISTS opportunity_policy_confirmation_insurer_map (
    id SERIAL,
    policy_confirmation_id INTEGER NOT NULL,
    insurer_id INTEGER NOT NULL,
    insurer_location_id INTEGER NOT NULL,
    insurer_branch_id INTEGER NOT NULL,
    insurer_contact_id INTEGER NOT NULL,
    is_lead_insurer INTEGER,
    share_percentage NUMERIC(5, 2) NOT NULL,
    share_amount NUMERIC(19, 2) NOT NULL,
    brokerage_percentage NUMERIC(5, 2) NOT NULL,
    brokerage_amount NUMERIC(19, 2) NOT NULL,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    -- Constraints
    CONSTRAINT pk_opportunity_policy_confirmation_insurer_map PRIMARY KEY (id),
    CONSTRAINT fk_policy_confirmation FOREIGN KEY (policy_confirmation_id) REFERENCES opportunity_policy_confirmation(id),
    CONSTRAINT fk_policy_confirmation_insurer FOREIGN KEY (insurer_id) REFERENCES insurer(id)
);

ALTER TABLE
    opportunity_held_cover_note
ADD
    COLUMN IF NOT EXISTS lead_insurer_id integer,
ADD
    COLUMN IF NOT EXISTS is_lead_insurer_pay_commission integer,
ADD
    COLUMN IF NOT EXISTS policy_placed_type_lid integer;

ALTER TABLE
    opportunity_policy_hard_copy
ADD
    COLUMN IF NOT EXISTS lead_insurer_id integer,
ADD
    COLUMN IF NOT EXISTS is_lead_insurer_pay_commission integer,
ADD
    COLUMN IF NOT EXISTS policy_placed_type_lid integer;

ALTER TABLE
    opportunity_policy_confirmation
ADD
    COLUMN IF NOT EXISTS lead_insurer_id integer,
ADD
    COLUMN IF NOT EXISTS is_lead_insurer_pay_commission integer,
ADD
    COLUMN IF NOT EXISTS policy_placed_type_lid integer;

ALTER TABLE
    opportunity_placement_slip_sharing_detail
ALTER COLUMN
    brokerage_percentage DROP NOT NULL,
ALTER COLUMN
    brokerage_amount DROP NOT NULL;

---------------
-- Date: 21-Nov-2025
ALTER TABLE
    policy
ADD
    COLUMN IF NOT EXISTS service_level_lid INTEGER;

CREATE TABLE IF NOT EXISTS policy_risk_location_map(
    id SERIAL,
    policy_id INTEGER NOT NULL,
    address_id INTEGER NOT NULL,
    -- Constraints
    CONSTRAINT PK_policy_risk_location_map PRIMARY KEY (id),
    CONSTRAINT fk_policy FOREIGN KEY (policy_id) REFERENCES policy (id),
    CONSTRAINT fk_address FOREIGN KEY (address_id) REFERENCES address (id)
);

UPDATE
    policy p
SET
    service_level_lid = o.service_level_lid
FROM
    opportunity o
WHERE
    p.opportunity_id = o.id;

INSERT INTO
    policy_risk_location_map (policy_id, address_id)
SELECT
    p.id AS policy_id,
    orlm.address_id
FROM
    opportunity_risk_location_map orlm
    JOIN policy p ON p.opportunity_id = orlm.opportunity_id
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            policy_risk_location_map prlm
        WHERE
            prlm.policy_id = p.id
            AND prlm.address_id = orlm.address_id
    );