-- Date: 10 Jul 2025

alter table organisation add column deleted_at timestamptz default null;
alter table organisation add column status_lid integer default 16101;

alter table department add column deleted_at timestamptz default null;
alter table department add column status_lid integer default 16101;

alter table designation add column deleted_at timestamptz default null;
alter table designation add column status_lid integer default 16101;

alter table org_branch add column deleted_at timestamptz default null;
alter table org_branch add column status_lid integer default 16101;

alter table org_vertical add column deleted_at timestamptz default null;
alter table org_vertical add column status_lid integer default 16101;

alter table lookup_data add column deleted_at timestamptz default null;
alter table lookup_data add column status integer default 1; -- 1 is active and 0 is inactive

INSERT INTO lookup_data(id, lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by, lookup_order)
VALUES 
(16101, 'MASTER_STATUS_ACTIVE', 'MASTER_STATUS', 'ACTIVE', 'Active', 'Active', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
(16102, 'MASTER_STATUS_INACTIVE', 'MASTER_STATUS', 'INACTIVE', 'Inactive', 'Inactive', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2);

---------------------------
-- Date: 15 Jul 2025
-- Adding Business Target Table
CREATE TABLE business_target (
 id SERIAL PRIMARY KEY,
 user_id INT NOT NULL,
 month DATE NOT NULL,
 entity_type VARCHAR(150) NOT NULL,
 kpi VARCHAR(150) NOT NULL,
 type_of_target VARCHAR(150) NOT NULL,
 value_of_target NUMERIC(19,2) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_target_month ON business_target(month);
CREATE INDEX idx_business_target_entity_type ON business_target(entity_type);

----------------------------
-- Date: 04 Aug 2025
-- Adding Announcement Table
CREATE TABLE announcement (
  id SERIAL PRIMARY KEY,
  organisation_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  created_by INT NOT NULL,
  updated_by INT NOT NULL,
  CONSTRAINT fk_announcement_organisation
    FOREIGN KEY (organisation_id)
    REFERENCES organisation(id)
);

-- Adding new columns to employee table
ALTER TABLE employee
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS date_of_joining DATE,
ADD COLUMN IF NOT EXISTS profile_url TEXT;

------------------------------
-- Date: 13 Aug 2025
-- Creating Org SBU Table
CREATE TABLE IF NOT EXISTS public.org_sbu (
  id SERIAL,
  organisation_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR NOT NULL,
  updated_by VARCHAR,
  deleted_at TIMESTAMPTZ,
  status_lid INTEGER DEFAULT 16101,

-- Constraints
  CONSTRAINT org_sbu_pkey PRIMARY KEY (id),
  CONSTRAINT fk_org_sbu_organisation_id FOREIGN KEY (organisation_id)
    REFERENCES public.organisation (id)
);

-- Adding SBU ID to Org Vertical
ALTER TABLE public.org_vertical
ADD COLUMN IF NOT EXISTS sbu_id INTEGER,
ADD CONSTRAINT fk_org_vertical_sbu FOREIGN KEY (sbu_id)
  REFERENCES public.org_sbu (id);

------------------------------
-- Date: 21 Aug 2025
-- Adding SBU ID to Employee
ALTER TABLE public.employee
ADD COLUMN IF NOT EXISTS sbu_id INTEGER,
ADD CONSTRAINT fk_employee_sbu FOREIGN KEY (sbu_id)
  REFERENCES public.org_sbu (id);

-- Adding SBU ID to Users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS sbu_id INTEGER,
ADD CONSTRAINT fk_users_sbu FOREIGN KEY (sbu_id)
  REFERENCES public.org_sbu (id);

------------------------------
-- Date: 09 Sep 2025
-- Adding Opportunity and Meeting IDs to File Uploads and Archived File Upload
ALTER TABLE public.file_uploads
ADD COLUMN IF NOT EXISTS opportunity_id INTEGER,
ADD COLUMN IF NOT EXISTS opportunity_activity_id INTEGER,
ADD COLUMN IF NOT EXISTS meeting_id INTEGER;

ALTER TABLE public.archived_file_upload
ADD COLUMN IF NOT EXISTS opportunity_id INTEGER,
ADD COLUMN IF NOT EXISTS opportunity_activity_id INTEGER,
ADD COLUMN IF NOT EXISTS meeting_id INTEGER;
------------------------------
-- Date: 17 Sep 2025

CREATE TABLE filter_preference (
  id SERIAL,
  entity VARCHAR(100) NOT NULL,
  user_id INT,
  filter_name VARCHAR(255),
  filter_type_lid INT NOT NULL,
  default_filter_lid INT NOT NULL,
  filter_json JSONB NOT NULL,
  table_setting_json JSONB NOT NULL,
  status_lid INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ,
  created_by INT NOT NULL DEFAULT 1,
  updated_by INT NOT NULL DEFAULT 1,
  CONSTRAINT pk_filter PRIMARY KEY (id)
);

INSERT INTO lookup_data (id,lookup_name, lookup_key, value_key, value, description, created_by, updated_by, lookup_order)
VALUES
    (20101, 'FILTER_TYPE', 'FILTER_TYPE_SYSTEM', 'SYSTEM', 'System', 'Filter Type System', 'Admin', 'Admin', 1),
    (20102, 'FILTER_TYPE', 'FILTER_TYPE_USER', 'USER', 'User', 'Filter Type User', 'Admin', 'Admin', 2),
    (20201,'FILTER_STATUS', 'FILTER_STATUS_ACTIVE', 'ACTIVE', 'Active', 'Active Status', 'Admin', 'Admin', 1),
    (20202, 'FILTER_STATUS', 'FILTER_STATUS_INACTIVE', 'INACTIVE', 'Inactive', 'Inactive Status', 'Admin', 'Admin', 2),
    (20301, 'IS_DEFAULT', 'IS_DEFAULT_YES', 'DEFAULT_YES', 'Yes', 'Default yes or true', 'Admin', 'Admin', 1),
    (20302, 'IS_DEFAULT', 'IS_DEFAULT_NO', 'DEFAULT_NO', 'No', 'Default no or false', 'Admin', 'Admin', 2);

----------------------------
-- Date: 03 Oct 2025
-- Adding Policy and Claim IDs to File Uploads and Archived File Upload
ALTER TABLE public.file_uploads
ADD COLUMN IF NOT EXISTS policy_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_activity_id INTEGER;


ALTER TABLE public.archived_file_upload
ADD COLUMN IF NOT EXISTS policy_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_activity_id INTEGER;

----------------------------
-- Date: 13 Oct 2025
ALTER TABLE public.opportunity
ADD COLUMN IF NOT EXISTS am_id INTEGER,
ADD COLUMN IF NOT EXISTS isg_id INTEGER;

ALTER TABLE public.policy
ADD COLUMN IF NOT EXISTS am_id INTEGER,
ADD COLUMN IF NOT EXISTS isg_id INTEGER;

CREATE TABLE policy_participant_map (
  id SERIAL PRIMARY KEY,
  policy_id INT NOT NULL,
  participant_id INT NOT NULL,
  participant_type VARCHAR(100),

  CONSTRAINT fk_policy FOREIGN KEY (policy_id) REFERENCES policy(id),
  CONSTRAINT fk_participant FOREIGN KEY (participant_id) REFERENCES users(id)
);

INSERT INTO public.lookup_data (
    lookup_key,
    lookup_name,
    value_key,
    value,
    description,
    created_by,
    updated_by,
    lookup_order,
    organisation_id
)
VALUES
    (
        'OPPORTUNITY_STATUS_BD_PLANNING',              -- update this if your lookup_key differs
        'OPPORTUNITY_STATUS',
        'BD_PLANNING',
        'BD Planning',
        'Business Development Planning stage',
        'system',
        'system',
        4,                            -- next order number after existing ones
        0
    ),
    (
        'OPPORTUNITY_STATUS_ISG_PLANNING',
        'OPPORTUNITY_STATUS',
        'ISG_PLANNING',
        'ISG Planning',
        'ISG Planning stage',
        'system',
        'system',
        5,
        0
    );


----------------------------
-- Date: 02 Feb 2026

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add latitude and longitude columns
ALTER TABLE mstr_hospital_address 
ADD COLUMN latitude NUMERIC(10,8),
ADD COLUMN longitude NUMERIC(11,8);

-- Create composite index for geospatial queries
CREATE INDEX idx_mstr_hospital_address_location 
ON mstr_hospital_address (latitude, longitude);

-- Optional: Create spatial index for PostGIS functions (more efficient for radius queries)
CREATE INDEX idx_hospital_address_geom 
ON mstr_hospital_address 
USING GIST (ST_Point(longitude, latitude));
