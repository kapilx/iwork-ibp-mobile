CREATE TABLE company (
    id SERIAL, -- Auto-incrementing primary key
    company_name VARCHAR(255) NOT NULL, -- Name of the company
    display_name VARCHAR(255) NOT NULL, -- Display name of the company
    company_type_lid INT NOT NULL, -- Foreign key to company type
    company_tag_lid INT NOT NULL, -- Foreign key to company tag
    currency_id INT NOT NULL, -- Foreign key to currency
    industry_segment_id INT NOT NULL, -- Foreign key to industry segment
    group_company_lid INT NOT NULL, -- Foreign key to group company
    no_of_employees INT NOT NULL, -- Number of employees
    website VARCHAR(255), -- Website URL
    date_of_incorporation DATE NOT NULL, -- Date of incorporation
    pan_card_number VARCHAR(50), -- PAN card number
    registration_no VARCHAR(50), -- Registration number
    existing_broker_id INT, -- Foreign key to existing broker
    paid_up_capital NUMERIC(15, 2), -- Paid-up capital
    tan_number VARCHAR(50), -- TAN number
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record updates
    deleted_at TIMESTAMPTZ, -- Soft delete timestamp
    created_by VARCHAR(255), -- User who created the record
    updated_by VARCHAR(255), -- User who last updated the record

    -- Constraints
    CONSTRAINT pk_company PRIMARY KEY (id) -- Primary key constraint

);

-- Indexes for faster queries
CREATE INDEX idx_display_name ON company (display_name);
CREATE INDEX idx_deleted_at ON company (deleted_at);
CREATE INDEX idx_created_at ON company (created_at);


CREATE TABLE company_detail (
    id SERIAL, -- Auto-incrementing primary key
    company_id INT NOT NULL, -- Foreign key referencing the company table
    company_history TEXT, -- History of the company (optional)
    major_products TEXT, -- Major products of the company (optional)
    key_customers TEXT, -- Key customers of the company (optional)
    strategy_for_the_account TEXT, -- Strategy for the account (optional)
    why_this_account TEXT, -- Reason for targeting this account (optional)
    competition_of_the_account TEXT, -- Competition for the account (optional)
    documents_uploaded TEXT, -- Documents uploaded (optional)
    business_processes TEXT, -- Business processes of the company (optional)
    account_strategy TEXT, -- Strategy for the account (optional)
    targeting_reason TEXT, -- Reason for targeting this account (optional)
    competitor TEXT, -- Competition for the account (optional)
    remarks TEXT, -- Competition for the account (optional)
    weakness TEXT, -- Weaknesses of the company (optional)
    action_plan TEXT, -- Action plan for the company (optional)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record updates
    deleted_at TIMESTAMPTZ, -- Soft delete timestamp
    created_by VARCHAR(255), -- User who created the record
    updated_by VARCHAR(255), -- User who last updated the record

    -- Constraints
    CONSTRAINT pk_company_detail PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES company (id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX idx_company_id ON company_detail (company_id);


CREATE TABLE company_address (
    id SERIAL, -- Auto-incrementing primary key
    company_id INT NOT NULL, -- Foreign key referencing the company table
    address_id INT NOT NULL, -- Foreign key referencing the address table
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record updates
    deleted_at TIMESTAMPTZ, -- Soft delete timestamp

    -- Constraints
    CONSTRAINT pk_company_address PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES company (id) ON DELETE CASCADE,
    CONSTRAINT fk_address FOREIGN KEY (address_id) REFERENCES address (id) ON DELETE CASCADE
);


CREATE TABLE company_address (
    id SERIAL, -- Auto-incrementing primary key
    company_id INT NOT NULL, -- Foreign key referencing the company table
    address_id INT NOT NULL, -- Foreign key referencing the address table
    is_primary BOOLEAN DEFAULT FALSE, -- Indicates if the address is the primary address for the company
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP , -- Timestamp for record updates
    deleted_at TIMESTAMPTZ, -- Soft delete timestamp

    -- Constraints
    CONSTRAINT pk_company_address PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES company (id) ON DELETE CASCADE,
    CONSTRAINT fk_address FOREIGN KEY (address_id) REFERENCES address (id) ON DELETE CASCADE
);

-- Indexes for faster queries




-- Add parent_company_id column to the company table
ALTER TABLE company
ADD COLUMN parent_company_id INT NULL;

-- Add status_lid column to the company table
ALTER TABLE company
ADD COLUMN status_lid INT NULL;

-- Add approver_id column to the company table
ALTER TABLE company
ADD COLUMN approver_id INT NULL;

-- Make pan_card_number unique
ALTER TABLE company
ADD CONSTRAINT unique_pan_card_number UNIQUE (pan_card_number);

-- Make tan_number unique
ALTER TABLE company
ADD CONSTRAINT unique_tan_number UNIQUE (tan_number);

-- Add foreign key constraint for parent_company_id
ALTER TABLE company
ADD COLUMN priority_lid INT NULL;



-- Add potential_opportunity column
ALTER TABLE company_detail
ADD COLUMN potential_opportunity TEXT NULL;

-- Add industry_intelligence column
ALTER TABLE company_detail
ADD COLUMN industry_intelligence TEXT NULL;

-- Add service_plan column
ALTER TABLE company_detail
ADD COLUMN service_plan TEXT NULL;

-- Add acquisition_history column
ALTER TABLE company_detail
ADD COLUMN acquisition_history TEXT NULL;

-- Add biz_profile column
ALTER TABLE company_detail
ADD COLUMN biz_profile TEXT NULL;

-- Add service_performance column
ALTER TABLE company_detail
ADD COLUMN service_performance TEXT NULL;


CREATE TABLE company_gst_detail (
    id SERIAL, -- Auto-incrementing primary key
    state_id INT NOT NULL, -- State ID
    gst_number VARCHAR(15) UNIQUE NOT NULL, -- GST number (unique)
    gst_category_lid INT NOT NULL, -- GST category
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record updates

    -- Constraints
    CONSTRAINT pk_company_gst_detail PRIMARY KEY (id) -- Primary key constraint
);


-- Add parent_company_id column to the company table
ALTER TABLE company
ADD COLUMN parent_company_id INT NULL;

-- Add status_lid column to the company table
ALTER TABLE company
ADD COLUMN status_lid INT NULL;

-- Add approver_id column to the company table
ALTER TABLE company
ADD COLUMN approver_id INT NULL;

-- Make pan_card_number unique
ALTER TABLE company
ADD CONSTRAINT unique_pan_card_number UNIQUE (pan_card_number);

-- Make tan_number unique
ALTER TABLE company
ADD CONSTRAINT unique_tan_number UNIQUE (tan_number);

-- Add foreign key constraint for parent_company_id
ALTER TABLE company
ADD COLUMN priority_lid INT NULL;



-- Add potential_opportunity column
ALTER TABLE company_detail
ADD COLUMN potential_opportunity TEXT NULL;

-- Add industry_intelligence column
ALTER TABLE company_detail
ADD COLUMN industry_intelligence TEXT NULL;

-- Add service_plan column
ALTER TABLE company_detail
ADD COLUMN service_plan TEXT NULL;

-- Add acquisition_history column
ALTER TABLE company_detail
ADD COLUMN acquisition_history TEXT NULL;

-- Add biz_profile column
ALTER TABLE company_detail
ADD COLUMN biz_profile TEXT NULL;

-- Add service_performance column
ALTER TABLE company_detail
ADD COLUMN service_performance TEXT NULL;


CREATE TABLE company_gst_detail (
    id SERIAL, -- Auto-incrementing primary key
    state_id INT NOT NULL, -- State ID
    gst_number VARCHAR(15) UNIQUE NOT NULL, -- GST number (unique)
    gst_category_lid INT NOT NULL, -- GST category
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record updates

    -- Constraints
    CONSTRAINT pk_company_gst_detail PRIMARY KEY (id) -- Primary key constraint
);

UPDATE company
SET pan_card_number = NULL;

-- Rename the table
ALTER TABLE company_gst_detail RENAME TO state_gst_detail;

-- Add the company_id column
ALTER TABLE state_gst_detail ADD COLUMN company_id INT NOT NULL;

-- Add the deleted_at column for soft deletes
ALTER TABLE state_gst_detail ADD COLUMN deleted_at TIMESTAMPTZ NULL;

-- Add the foreign key constraint
ALTER TABLE state_gst_detail
ADD CONSTRAINT fk_state_gst_detail_company
FOREIGN KEY (company_id)
REFERENCES company(id);

-- Ensure the gst_number column remains unique
ALTER TABLE state_gst_detail
ADD CONSTRAINT unique_gst_number UNIQUE (gst_number);


-- Add remarks and source columns to the company table
ALTER TABLE company ADD COLUMN remarks TEXT NULL;
ALTER TABLE company ADD COLUMN source VARCHAR(100) NULL;

-- Remove the remarks column from the company_detail table
ALTER TABLE company_detail DROP COLUMN remarks;

-- SQL script to create the company_doc_map table
CREATE TABLE company_doc_map (
    id SERIAL, -- Auto-incrementing column
    company_id INT NOT NULL, -- Foreign key referencing the company table
    doc_id INT NOT NULL, -- Foreign key referencing the document table
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record update
    deleted_at TIMESTAMPTZ NULL, -- Soft delete column

    -- Constraints
    CONSTRAINT pk_company_doc_map PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
);

-- SQL script to create the group_company_map table
CREATE TABLE group_company_map (
    id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
    company_id INT NOT NULL, -- Foreign key referencing the company table
    group_company_id INT NOT NULL, -- Foreign key referencing the company table
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record update
    deleted_at TIMESTAMPTZ NULL, -- Soft delete column

    -- Foreign key constraints
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_company FOREIGN KEY (group_company_id) REFERENCES company(id) ON DELETE CASCADE
);


------------------------
-- Remove NOT NULL constraint from display_name
ALTER TABLE company
ALTER COLUMN display_name DROP NOT NULL;

-- Remove NOT NULL constraint from group_company_lid
ALTER TABLE company
ALTER COLUMN group_company_lid DROP NOT NULL;

-- Remove NOT NULL constraint from priority_lid
ALTER TABLE company
ALTER COLUMN priority_lid DROP NOT NULL;

-- Remove NOT NULL constraint from company_type_lid
ALTER TABLE company
ALTER COLUMN company_type_lid DROP NOT NULL;

-- Remove NOT NULL constraint from industry_segment_lid
ALTER TABLE company
ALTER COLUMN industry_segment_lid DROP NOT NULL;