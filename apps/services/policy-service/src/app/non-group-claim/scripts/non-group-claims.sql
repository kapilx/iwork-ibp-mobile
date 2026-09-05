-- mstr_claim_stage table
CREATE TABLE mstr_claim_stage (
   id SERIAL PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   description TEXT,
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Master Claim Stages
INSERT INTO mstr_claim_stage (id, name, description, created_by, updated_by, created_at, updated_at) VALUES
(1, 'Claim Intimation', 'Initial claim reporting and FNOL submission', 1, 1, NOW(), NOW()),
(2, 'Survey and Documentation', 'Loss assessment and document collection', 1, 1, NOW(), NOW()),
(3, 'Assessment and Validation', 'Claim assessment and validation process', 1, 1, NOW(), NOW()),
(4, 'Settlement', 'Claim settlement and payment processing', 1, 1, NOW(), NOW());


-- mstr_claim_activity table
CREATE TABLE mstr_claim_activity (
   id SERIAL PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   description TEXT,
   activity_key VARCHAR(100),
   activity_table VARCHAR(255),
   activity_order INTEGER,
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Master Claim Activities
INSERT INTO mstr_claim_activity (id, name, description, activity_key, activity_table, activity_order, created_by, updated_by, created_at, updated_at) VALUES
(1, 'Claim Informed', 'Initial claim intimation', 'CLAIM_INFORMED', 'claim_informed', 1, 1, 1, NOW(), NOW()),
(2, 'First Notice of Loss', 'FNOL submission to insurer', 'FNOL_DETAILS', 'claim_fnol_details', 2, 1, 1, NOW(), NOW()),
(3, 'Loss Adjuster Details', 'Adjuster appointment', 'LOSS_ADJUSTER', 'claim_loss_adjuster_details', 3, 1, 1, NOW(), NOW()),
(4, 'Survey Completed', 'Loss survey completion', 'SURVEY_COMPLETED', 'claim_survey_completed', 4, 1, 1, NOW(), NOW()),
(5, 'Documents Collected', 'Document collection process', 'DOCUMENTS_COLLECTED', 'claim_documents_collected', 5, 1, 1, NOW(), NOW()),
(6, 'Joint Inspection Report', 'Joint inspection process', 'JOINT_INSPECTION', 'claim_joint_inspection_report', 6, 1, 1, NOW(), NOW()),
(7, 'Letter of Requirements', 'LOR issuance', 'LOR_DETAILS', 'claim_lor_details', 7, 1, 1, NOW(), NOW()),
(8, 'Track Document Submission', 'Document submission tracking', 'DOC_SUBMISSION_TRACKER', 'claim_document_submission_tracker', 8, 1, 1, NOW(), NOW()),
(9, 'Assessment Report', 'Claim assessment report', 'ASSESSMENT_REPORT', 'claim_assessment_report', 9, 1, 1, NOW(), NOW()),
(10, 'Validation of Report', 'Report validation process', 'VALIDATION_REPORT', 'claim_validation_report', 10, 1, 1, NOW(), NOW()),
(11, 'Claim Settlement', 'Settlement processing', 'SETTLEMENT', 'claim_settlement', 11, 1, 1, NOW(), NOW()),
(12, 'Discharge Voucher Generation', 'DV generation', 'DISCHARGE_VOUCHER', 'claim_discharge_voucher', 12, 1, 1, NOW(), NOW()),
(13, 'Customer Agreement', 'Customer agreement process', 'CUSTOMER_AGREEMENT', 'claim_customer_agreement', 13, 1, 1, NOW(), NOW()),
(14, 'Voucher to Insurer', 'Voucher submission to insurer', 'VOUCHER_TO_INSURER', 'claim_voucher_to_insurer', 14, 1, 1, NOW(), NOW()),
(15, 'Claim Payment', 'Final payment processing', 'CLAIM_PAYMENT', 'claim_payment', 15, 1, 1, NOW(), NOW());


-- mstr_claim_stage_activity_template table
CREATE TABLE mstr_claim_stage_activity_template (
   id SERIAL PRIMARY KEY,
   stage_id INTEGER NOT NULL,
   stage_name VARCHAR(255) NOT NULL,
   activity_id INTEGER NOT NULL,
   activity_name VARCHAR(255) NOT NULL,
   activity_key VARCHAR(100),
   activity_table VARCHAR(255),
   stage_activity_order INTEGER,
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Master Claim Stage Activity Template (Stage-Activity Mapping)
INSERT INTO mstr_claim_stage_activity_template (stage_id, stage_name, activity_id, activity_name, activity_key, activity_table, stage_activity_order, created_by, updated_by, created_at, updated_at) VALUES
-- Claim Intimation Stage (Stage 1)
(1, 'Claim Intimation', 1, 'Claim Informed', 'CLAIM_INFORMED', 'claim_informed', 1, 1, 1, NOW(), NOW()),
(1, 'Claim Intimation', 2, 'First Notice of Loss', 'FNOL_DETAILS', 'claim_fnol_details', 2, 1, 1, NOW(), NOW()),

-- Survey and Documentation Stage (Stage 2)
(2, 'Survey and Documentation', 3, 'Loss Adjuster Details', 'LOSS_ADJUSTER', 'claim_loss_adjuster_details', 3, 1, 1, NOW(), NOW()),
(2, 'Survey and Documentation', 4, 'Survey Completed', 'SURVEY_COMPLETED', 'claim_survey_completed', 4, 1, 1, NOW(), NOW()),
(2, 'Survey and Documentation', 5, 'Documents Collected', 'DOCUMENTS_COLLECTED', 'claim_documents_collected', 5, 1, 1, NOW(), NOW()),
(2, 'Survey and Documentation', 6, 'Joint Inspection Report', 'JOINT_INSPECTION', 'claim_joint_inspection_report', 6, 1, 1, NOW(), NOW()),
(2, 'Survey and Documentation', 7, 'Letter of Requirements', 'LOR_DETAILS', 'claim_lor_details', 7, 1, 1, NOW(), NOW()),

-- Assessment and Validation Stage (Stage 3)
(3, 'Assessment and Validation', 8, 'Track Document Submission', 'DOC_SUBMISSION_TRACKER', 'claim_document_submission_tracker', 8, 1, 1, NOW(), NOW()),
(3, 'Assessment and Validation', 9, 'Assessment Report', 'ASSESSMENT_REPORT', 'claim_assessment_report', 9, 1, 1, NOW(), NOW()),
(3, 'Assessment and Validation', 10, 'Validation of Report', 'VALIDATION_REPORT', 'claim_validation_report', 10, 1, 1, NOW(), NOW()),

-- Settlement Stage (Stage 4)
(4, 'Settlement', 11, 'Claim Settlement', 'SETTLEMENT', 'claim_settlement', 11, 1, 1, NOW(), NOW()),
(4, 'Settlement', 12, 'Discharge Voucher Generation', 'DISCHARGE_VOUCHER', 'claim_discharge_voucher', 12, 1, 1, NOW(), NOW()),
(4, 'Settlement', 13, 'Customer Agreement', 'CUSTOMER_AGREEMENT', 'claim_customer_agreement', 13, 1, 1, NOW(), NOW()),
(4, 'Settlement', 14, 'Voucher to Insurer', 'VOUCHER_TO_INSURER', 'claim_voucher_to_insurer', 14, 1, 1, NOW(), NOW()),
(4, 'Settlement', 15, 'Claim Payment', 'CLAIM_PAYMENT', 'claim_payment', 15, 1, 1, NOW(), NOW());

UPDATE mstr_claim_stage_activity_template
SET activity_key = LOWER(
   REGEXP_REPLACE(
       REGEXP_REPLACE(activity_name, '\s+', '_', 'g'),
       '[^a-zA-Z0-9_]',
       '',
       'g'
   )
);


-- non_group_claim table
CREATE TABLE non_group_claim (
   id SERIAL PRIMARY KEY,
   policy_id INTEGER NOT NULL,
   company_id INTEGER NOT NULL,
   opportunity_id INTEGER,
   claim_number VARCHAR(50) UNIQUE NOT NULL,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   deleted_at TIMESTAMPTZ NULL
);
-- Indexes for non_group_claim table
CREATE INDEX idx_non_group_claim_policy_id ON non_group_claim(policy_id);
CREATE INDEX idx_non_group_claim_company_id ON non_group_claim(company_id);
CREATE INDEX idx_non_group_claim_opportunity_id ON non_group_claim(opportunity_id);
CREATE INDEX idx_non_group_claim_claim_number ON non_group_claim(claim_number);


-- claim_activity_map table
CREATE TABLE claim_activity_map (
   id SERIAL PRIMARY KEY,
   policy_id INTEGER,
   claim_id INTEGER,
   activity_order INTEGER,
   activity_name VARCHAR(255),
   stage_name VARCHAR(255),
   activity_table VARCHAR(255),
   activity_key VARCHAR(100),
   status_key VARCHAR(255),
   claim_number VARCHAR(50) UNIQUE,
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   completed_at TIMESTAMPTZ NULL,
   deleted_at TIMESTAMPTZ NULL
);
-- Indexes for claim_activity_map table
CREATE INDEX idx_claim_activity_map_policy_id ON claim_activity_map(policy_id);
CREATE INDEX idx_claim_activity_map_claim_id ON claim_activity_map(claim_id);
CREATE INDEX idx_claim_activity_map_claim_number ON claim_activity_map(claim_number);
CREATE INDEX idx_claim_activity_map_activity_order ON claim_activity_map(activity_order);


-- claim_activity_document_map table
CREATE TABLE claim_activity_document_map (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   document_id INTEGER,
   document_label VARCHAR(255),
   received_date DATE,
   document_status_key VARCHAR(255),
   is_custom INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Indexes for claim_activity_document_map table
CREATE INDEX idx_claim_activity_document_map_activity_id ON claim_activity_document_map(claim_activity_id);


-- Adding policy_id, claim_id, and claim_activity_id to file_uploads and archived_file_upload tables
ALTER TABLE public.file_uploads
ADD COLUMN IF NOT EXISTS policy_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_activity_id INTEGER;

ALTER TABLE public.archived_file_upload
ADD COLUMN IF NOT EXISTS policy_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_activity_id INTEGER;

-- Stage 1: Claim Intimation activities tables
-- Claim Informed table
CREATE TABLE claim_informed (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   intimation_datetime TIMESTAMPTZ,
   intimated_by_key VARCHAR(255),
   intimation_channel_key VARCHAR(255),
   loss_location_id INTEGER,
   description_of_loss TEXT,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_informed_activity_id ON claim_informed(claim_activity_id);

-- First Notice of Loss (FNOL) Details table
CREATE TABLE claim_fnol_details (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   fnol_sent_date DATE,
   insurer_reference_no VARCHAR(255),
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_fnol_details_activity_id ON claim_fnol_details(claim_activity_id);

-- Stage 2: Survey and Documentation activities tables
-- Loss Adjuster Details table
CREATE TABLE claim_loss_adjuster_details (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   adjuster_appointment_date DATE,
   adjuster_name VARCHAR(255),
   adjuster_phone VARCHAR(20),
   adjuster_email VARCHAR(255),
   adjuster_appointment_ref_no VARCHAR(50),
   adjuster_assigned_by VARCHAR(255),
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_loss_adjuster_details_activity_id ON claim_loss_adjuster_details(claim_activity_id);

-- Survey Completed table
CREATE TABLE claim_survey_completed (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   survey_date DATE,
   surveyor_name VARCHAR(255),
   findings_summary TEXT,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_survey_completed_activity_id ON claim_survey_completed(claim_activity_id);

-- Documents Collected table
CREATE TABLE claim_documents_collected (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_documents_collected_activity_id ON claim_documents_collected(claim_activity_id);

-- Joint Inspection Report table
CREATE TABLE claim_joint_inspection_report (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   inspection_date DATE,
   inspected_by VARCHAR(100),
   client INTEGER,
   insurer INTEGER,
   adjuster INTEGER,
   surveyor INTEGER,
   inspection_findings TEXT,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_joint_inspection_report_activity_id ON claim_joint_inspection_report(claim_activity_id);

-- Letter of Requirements (LOR) Details table
CREATE TABLE claim_lor_details (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   lor_issued_date DATE,
   issued_by_key VARCHAR(255),
   required_documents TEXT,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_lor_details_activity_id ON claim_lor_details(claim_activity_id);

-- Stage 3: Assessment and Validation activities tables
-- Track Document Submission table
CREATE TABLE claim_document_submission_tracker (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   ref_claim_activity_id INTEGER,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_document_submission_tracker_activity_id ON claim_document_submission_tracker(claim_activity_id);

-- Assessment Report table
CREATE TABLE claim_assessment_report (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   report_date DATE,
   report_by_key VARCHAR(255),
   assessed_loss_amount NUMERIC(19,2),
   key_observations TEXT,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_assessment_report_activity_id ON claim_assessment_report(claim_activity_id);

-- Validation of Report table
CREATE TABLE claim_validation_report (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   validator_name VARCHAR(255),
   validation_status_key VARCHAR(255),
   validation_date TIMESTAMPTZ,
   remarks TEXT,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_validation_report_activity_id ON claim_validation_report(claim_activity_id);

-- Stage 4: Settlement activities tables
-- Claim Settlement table
CREATE TABLE claim_settlement (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   settlement_date DATE,
   settlement_amount NUMERIC(19,2),
   approved_by VARCHAR(255),
   mode_of_settlement_key VARCHAR(255),
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_settlement_activity_id ON claim_settlement(claim_activity_id);

-- Discharge Voucher table
CREATE TABLE claim_discharge_voucher (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   dv_number VARCHAR(100),
   dv_date DATE,
   dv_amount NUMERIC(19,2),
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_discharge_voucher_activity_id ON claim_discharge_voucher(claim_activity_id);

-- Customer Agreement table
CREATE TABLE claim_customer_agreement (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   agreement_date DATE,
   customer_confirmation_key VARCHAR(255),
   remarks TEXT,
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_customer_agreement_activity_id ON claim_customer_agreement(claim_activity_id);

-- Voucher to Insurer table
CREATE TABLE claim_voucher_to_insurer (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   sent_to_insurer_date DATE,
   acknowledgement_ref_no VARCHAR(255),
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_voucher_to_insurer_activity_id ON claim_voucher_to_insurer(claim_activity_id);

-- Claim Payment table
CREATE TABLE claim_payment (
   id SERIAL PRIMARY KEY,
   claim_activity_id INTEGER,
   payment_date DATE,
   payment_reference_no VARCHAR(255),
   paid_amount NUMERIC(19,2),
   mode_of_payment_key VARCHAR(255),
   status_key VARCHAR(255),
   created_by INTEGER,
   updated_by INTEGER,
   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claim_payment_activity_id ON claim_payment(claim_activity_id);


-- Lookups
-- Non-Group Claim Status
INSERT INTO lookup_data (
   id, lookup_key, lookup_name, value_key, value, description,
   created_at, updated_at, created_by, updated_by, lookup_order, status
)
VALUES
(21101, 'NON_GROUP_CLAIM_STATUS_CREATED', 'NON_GROUP_CLAIM_STATUS', 'CREATED', 'Created', 'Non-group claim created', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1, 1);

-- Non-Group Claim Activity Status
INSERT INTO lookup_data (
   id, lookup_key, lookup_name, value_key, value, description,
   created_at, updated_at, created_by, updated_by, lookup_order, status
)
VALUES
(21201, 'NON_GROUP_CLAIM_ACTIVITY_DRAFT', 'NON_GROUP_CLAIM_ACTIVITY_STATUS', 'DRAFT', 'Draft', 'Non-group claim activity draft', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1, 1),
(21202, 'NON_GROUP_CLAIM_ACTIVITY_IN_PROGRESS', 'NON_GROUP_CLAIM_ACTIVITY_STATUS', 'IN_PROGRESS', 'In Progress', 'Non-group claim activity in progress', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2, 1),
(21203, 'NON_GROUP_CLAIM_ACTIVITY_SUBMIT', 'NON_GROUP_CLAIM_ACTIVITY_STATUS', 'SUBMIT', 'Submitted', 'Non-group claim activity submitted', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3, 1);

-- Intimator (who intimated the claim)
INSERT INTO lookup_data (id, lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by, lookup_order, status)
VALUES
(21301, 'INTIMATOR_CLIENT', 'INTIMATOR', 'CLIENT', 'Client', 'Claim intimated by client', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1, 1),
(21302, 'INTIMATOR_CRM', 'INTIMATOR', 'CRM', 'CRM', 'Claim intimated by CRM team', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2, 1),
(21303, 'INTIMATOR_OTHER', 'INTIMATOR', 'OTHER', 'Other', 'Claim intimated by other party', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3, 0);

-- Intimation Channel (how the claim was intimated)
INSERT INTO lookup_data (id, lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by, lookup_order, status)
VALUES
(21401, 'INTIMATION_CHANNEL_EMAIL', 'INTIMATION_CHANNEL', 'EMAIL', 'Email', 'Claim intimated via email', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1, 1),
(21402, 'INTIMATION_CHANNEL_PHONE', 'INTIMATION_CHANNEL', 'PHONE', 'Phone', 'Claim intimated via phone call', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2, 1),
(21403, 'INTIMATION_CHANNEL_PORTAL', 'INTIMATION_CHANNEL', 'PORTAL', 'Portal', 'Claim intimated via web portal', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3, 1),
(21404, 'INTIMATION_CHANNEL_OTHER', 'INTIMATION_CHANNEL', 'OTHER', 'Other', 'Claim intimated via other means', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 4, 0);

-- LOR Issuer (who issued the Letter of Requirements)
INSERT INTO lookup_data (id, lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by, lookup_order, status)
VALUES
(21501, 'LOR_ISSUER_INSURER', 'LOR_ISSUER', 'INSURER', 'Insurer', 'LOR issued by insurer', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1, 1),
(21502, 'LOR_ISSUER_SURVEYOR', 'LOR_ISSUER', 'SURVEYOR', 'Surveyor', 'LOR issued by surveyor', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2, 1);

-- Claim Validation Status
INSERT INTO lookup_data (id, lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by, lookup_order, status)
VALUES
(21601, 'CLAIM_VALIDATION_STATUS_APPROVED', 'CLAIM_VALIDATION_STATUS', 'APPROVED', 'Approved', 'Claim validation approved', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1, 1),
(21602, 'CLAIM_VALIDATION_STATUS_REVISION_REQUIRED', 'CLAIM_VALIDATION_STATUS', 'REVISION_REQUIRED', 'Revision Required', 'Claim validation requires revision', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2, 1);

-- Claim Settlement Mode
INSERT INTO lookup_data (id, lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by, lookup_order, status)
VALUES
(21701, 'SETTLEMENT_MODE_CASHLESS', 'SETTLEMENT_MODE', 'CASHLESS', 'Cashless', 'Cashless settlement', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1, 1),
(21702, 'SETTLEMENT_MODE_REIMBURSEMENT', 'SETTLEMENT_MODE', 'REIMBURSEMENT', 'Reimbursement', 'Reimbursement settlement', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2, 1);

-- Claim Payment Mode
INSERT INTO lookup_data (id, lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by, lookup_order, status)
VALUES
(21801, 'CLAIM_PAYMENT_MODE_NEFT', 'CLAIM_PAYMENT_MODE', 'NEFT', 'NEFT', 'Payment via NEFT', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1, 1),
(21802, 'CLAIM_PAYMENT_MODE_RTGS', 'CLAIM_PAYMENT_MODE', 'RTGS', 'RTGS', 'Payment via RTGS', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2, 1),
(21803, 'CLAIM_PAYMENT_MODE_OTHERS', 'CLAIM_PAYMENT_MODE', 'OTHERS', 'Others', 'Payment via other methods', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3, 1);

-------------------------
-- Date: 08 Oct 2025

ALTER TABLE non_group_claim
ADD COLUMN IF NOT EXISTS claim_date DATE,
ADD COLUMN IF NOT EXISTS settled_date DATE,
ADD COLUMN IF NOT EXISTS claim_amount NUMERIC(19,2),
ADD COLUMN IF NOT EXISTS active_activity VARCHAR(255);

ALTER TABLE claim_joint_inspection_report
ALTER COLUMN inspected_by TYPE varchar(255);

-------------------------
-- Date: 09 Oct 2025

-- Rename table
ALTER TABLE public.policy_employee_claim
RENAME TO policy_claim;

-- Rename index
ALTER INDEX public.idx_policy_employee_claim_employee_policy
RENAME TO idx_policy_claim_employee_policy;

-- Rename primary key constraint
ALTER TABLE public.policy_claim
RENAME CONSTRAINT policy_employee_claim_pkey TO policy_claim_pkey;

-- Rename constraint if it exists, otherwise add new unique constraint
DO $$
BEGIN
    -- Check if the old constraint exists
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'policy_employee_claim_claim_number_key'
          AND conrelid = 'public.policy_claim'::regclass
    ) THEN
        ALTER TABLE public.policy_claim
        RENAME CONSTRAINT policy_employee_claim_claim_number_key TO policy_claim_claim_number_key;
    END IF;

    -- Add unique constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'policy_claim_claim_number_key'
          AND conrelid = 'public.policy_claim'::regclass
    ) THEN
        ALTER TABLE public.policy_claim
        ADD CONSTRAINT policy_claim_claim_number_key UNIQUE (claim_number);
    END IF;
END
$$;

-- Rename foreign key constraints
ALTER TABLE public.policy_claim
RENAME CONSTRAINT policy_employee_claim_dependent_id_fkey TO policy_claim_dependent_id_fkey;

ALTER TABLE public.policy_claim
RENAME CONSTRAINT policy_employee_claim_employee_id_fkey TO policy_claim_employee_id_fkey;

ALTER TABLE public.policy_claim
RENAME CONSTRAINT policy_employee_claim_policy_id_fkey TO policy_claim_policy_id_fkey;

ALTER TABLE public.policy_claim
RENAME CONSTRAINT policy_employee_claim_source_file_upload_id_fkey TO policy_claim_source_file_upload_id_fkey;

-- Rename table
ALTER TABLE public.policy_employee_claim_settlement
RENAME TO policy_claim_settlement;

-- Rename index
ALTER INDEX public.idx_policy_employee_claim_settlement_claim_id
RENAME TO idx_policy_claim_settlement_claim_id;

-- Rename primary key constraint
ALTER TABLE public.policy_claim_settlement
RENAME CONSTRAINT policy_employee_claim_settlement_pkey TO policy_claim_settlement_pkey;

-- Rename foreign key constraints
ALTER TABLE public.policy_claim_settlement
RENAME CONSTRAINT policy_employee_claim_settlement_claim_id_fkey TO policy_claim_settlement_claim_id_fkey;

ALTER TABLE public.policy_claim_settlement
RENAME CONSTRAINT policy_employee_claim_settlement_source_file_upload_id_fkey TO policy_claim_settlement_source_file_upload_id_fkey;

-- Update foreign key reference to renamed table (policy_claim)
ALTER TABLE public.policy_claim_settlement
DROP CONSTRAINT policy_claim_settlement_claim_id_fkey,
ADD CONSTRAINT policy_claim_settlement_claim_id_fkey
FOREIGN KEY (claim_id)
REFERENCES public.policy_claim (id)
ON UPDATE NO ACTION
ON DELETE NO ACTION;

--- added non group claim related columns to policy_claim table
ALTER TABLE policy_claim 
ADD COLUMN IF NOT EXISTS company_id INTEGER,
ADD COLUMN IF NOT EXISTS opportunity_id INTEGER,
ADD COLUMN IF NOT EXISTS claim_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS active_activity VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_by INT,
ADD COLUMN IF NOT EXISTS updated_by INT;

-- Add claim_activity_id column
ALTER TABLE policy_claim_settlement 
ADD COLUMN IF NOT EXISTS claim_activity_id INT,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS mode_of_settlement_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS status_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_by INT,
ADD COLUMN IF NOT EXISTS updated_by INT;


ALTER TABLE public.policy_claim
ALTER COLUMN employee_id DROP NOT NULL,
ALTER COLUMN employee_tpa_id DROP NOT NULL,
ALTER COLUMN source_file_upload_id DROP NOT NULL;

ALTER TABLE policy_claim_settlement
ALTER COLUMN source_file_upload_id DROP NOT NULL;

TRUNCATE TABLE public.claim_activity_map;
DROP TABLE IF EXISTS public.non_group_claim CASCADE;
DROP TABLE IF EXISTS public.claim_settlement CASCADE;

-- Step 1: Set all existing data to NULL
UPDATE claim_loss_adjuster_details
SET adjuster_assigned_by = NULL;

-- Step 2: Alter the column type to integer
ALTER TABLE claim_loss_adjuster_details
ALTER COLUMN adjuster_assigned_by TYPE integer USING adjuster_assigned_by::integer;

