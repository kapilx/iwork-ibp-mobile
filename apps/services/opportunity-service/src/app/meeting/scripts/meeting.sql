CREATE TABLE meeting (
    id SERIAL,  -- Auto-incrementing primary key
    activity_id INT NOT NULL,
    opportunity_id INT NOT NULL,
    meeting_type_lid INT NOT NULL,
    company_id INT NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    location VARCHAR(255),
    min_of_meeting TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_meeting PRIMARY KEY (id),
    CONSTRAINT fk_meeting_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_meeting_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunity(id)
);

-- Indexes
CREATE INDEX idx_meeting_activity_id ON meeting(activity_id);
CREATE INDEX idx_meeting_opty_id ON meeting(opportunity_id);
CREATE INDEX idx_meeting_company_id ON meeting(company_id);
CREATE INDEX idx_meeting_date ON meeting(meeting_date);
CREATE INDEX idx_meeting_start_time ON meeting(start_time);
CREATE INDEX idx_meeting_end_time ON meeting(end_time);


CREATE TABLE meeting_participant_map (
    id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
    meeting_id INT NOT NULL, -- Foreign key referencing the meeting
    participant_id INT NOT NULL, -- Foreign key referencing the participant
    participant_role_id INT NOT NULL, -- Foreign key referencing the role
    participant_role VARCHAR(255) NOT NULL, -- Role description for the participant
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record update

    -- Constraints
    CONSTRAINT fk_meeting FOREIGN KEY (meeting_id) REFERENCES meeting(id) ON DELETE CASCADE,
    CONSTRAINT fk_role FOREIGN KEY (participant_role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- MEETING_TYPE lookup data
INSERT INTO lookup_data (
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
  ('MEETING_TYPE_INTRO', 'MEETING_TYPE', 'INTRO_CALL', 'Introductory Call', 'Initial discussion with the client or lead', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_TYPE_FOLLOW_UP', 'MEETING_TYPE', 'FOLLOW_UP', 'Follow-up Meeting', 'Meeting to continue or review previous discussions', NOW(), NOW(), 'Admin', 'Admin');

-------------------------------*****-------------------------------
-- Deleting existing MEETING_TYPE lookup data to avoid duplicates
DELETE FROM lookup_data
WHERE lookup_name = 'MEETING_TYPE';

// MEETING_TYPE lookup data
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
)
VALUES
  ('MEETING_TYPE_INTERNAL', 'MEETING_TYPE', 'INTERNAL_MEETING', 'Internal Meeting', 'Meeting among internal team members', NOW(), NOW(), 'Admin', 'Admin', 1),
  ('MEETING_TYPE_CLIENT', 'MEETING_TYPE', 'CLIENT_MEETING', 'Client Meeting', 'Meeting with the clients', NOW(), NOW(), 'Admin', 'Admin', 2),
  ('MEETING_TYPE_INSURER', 'MEETING_TYPE', 'INSURER_MEETING', 'Insurer Meeting', 'Meeting with insurer representatives', NOW(), NOW(), 'Admin', 'Admin', 3),
  ('MEETING_TYPE_TPA', 'MEETING_TYPE', 'TPA_MEETING', 'TPA Meeting', 'Meeting with Third Party Administrator', NOW(), NOW(), 'Admin', 'Admin', 4);


// MEETING_SUB_TYPE lookup data
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
)
VALUES
  ('MEETING_SUBTYPE_KDM', 'MEETING_SUB_TYPE', 'KDM_MEETING', 'KDM Meeting', 'Meeting with Key Decision Maker', NOW(), NOW(), 'Admin', 'Admin', 1),
  ('MEETING_SUBTYPE_FINAL_NEGOTIATION', 'MEETING_SUB_TYPE', 'FINAL_NEGOTIATION_MEET', 'Final Negotiation Meet', 'Final stage discussion to negotiate terms', NOW(), NOW(), 'Admin', 'Admin', 2),
  ('MEETING_SUBTYPE_HANDOVER', 'MEETING_SUB_TYPE', 'HANDOVER_MEET', 'Hand Over Meet', 'Meeting for project/product handover or transition', NOW(), NOW(), 'Admin', 'Admin', 3);


ALTER TABLE public.meeting
ALTER COLUMN activity_id DROP NOT NULL;

ALTER TABLE public.meeting
ALTER COLUMN opportunity_id DROP NOT NULL;

ALTER TABLE public.meeting
ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE public.meeting
ADD COLUMN contact_id integer,

ALTER TABLE public.meeting
ADD CONSTRAINT fk_meeting_contact
FOREIGN KEY (contact_id)
REFERENCES public.contact (id)
ON UPDATE NO ACTION
ON DELETE NO ACTION;

ALTER TABLE public.meeting
ADD CONSTRAINT fk_meeting_activity
FOREIGN KEY (activity_id)
REFERENCES public.opportunity_activity_map (id)
ON UPDATE NO ACTION
ON DELETE NO ACTION;

ALTER TABLE public.meeting
ADD COLUMN meeting_purpose varchar(255);

ALTER TABLE public.meeting
ADD COLUMN meeting_agenda TEXT;

ALTER TABLE public.meeting
ADD COLUMN meeting_sub_type_lid integer;

ALTER TABLE meeting_participant_map
DROP CONSTRAINT fk_role;

ALTER TABLE meeting_participant_map
DROP COLUMN participant_role_id,
DROP COLUMN participant_role;

ALTER TABLE meeting_participant_map
ADD COLUMN participant_record_type VARCHAR(25)
CHECK (participant_record_type IN (
  'TPA_CONTACT',
  'INSURER_CONTACT',
  'BROKER_CONTACT',
  'COMPANY_CONTACT',
  'EMPLOYEE'
));


CREATE TABLE public.meeting_document_map (
  id SERIAL,
  meeting_id INT NOT NULL,
  document_id INT NOT NULL,
  -- Constraints
  CONSTRAINT pk_meeting_document_map PRIMARY KEY (id),
  CONSTRAINT fk_meeting_document_map_meeting
      FOREIGN KEY (meeting_id)
      REFERENCES public.meeting (id)
      ON DELETE CASCADE,
  CONSTRAINT fk_meeting_document_map_document
      FOREIGN KEY (document_id)
      REFERENCES public.file_uploads (id)
      ON DELETE CASCADE
);
--------------*****-----------------
ALTER TABLE meeting
DROP COLUMN IF EXISTS meeting_sub_type_lid,
DROP COLUMN IF EXISTS contact_id,
DROP COLUMN IF EXISTS min_of_meeting;

ALTER TABLE meeting
RENAME COLUMN description TO duration;

ALTER TABLE meeting
ALTER COLUMN duration TYPE integer USING duration::integer;

ALTER TABLE meeting
RENAME COLUMN meeting_purpose TO meeting_subject;

ALTER TABLE meeting
ADD COLUMN meeting_status_lid INT NOT NULL;

ALTER TABLE meeting_participant_map
ADD COLUMN participant_company_id INT NOT NULL;

ALTER TABLE meeting
RENAME COLUMN location TO location_type_lid;

ALTER TABLE meeting
ALTER COLUMN location_type_lid TYPE integer USING location_type_lid::integer;

ALTER TABLE meeting_document_map
ADD COLUMN document_type_lid INT NOT NULL;

-- Deleting existing MEETING_TYPE lookup data to avoid duplicates
DELETE FROM lookup_data
WHERE lookup_name = 'MEETING_TYPE';

INSERT INTO lookup_data (
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
  ('MEETING_TYPE_INTERNAL', 'MEETING_TYPE', 'INTERNAL_MEETING', 'Internal Meeting', 'Meeting among internal team members', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_TYPE_KDM', 'MEETING_TYPE', 'KDM_MEETING', 'KDM Meeting', 'Meeting with Key Decision Maker', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_TYPE_FINAL_NEGOTIATION', 'MEETING_TYPE', 'FINAL_NEGOTIATION_MEET', 'Final Negotiation Meet', 'Final stage discussion to negotiate terms', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_TYPE_HANDOVER', 'MEETING_TYPE', 'HANDOVER_MEET', 'Hand Over Meet', 'Meeting for project/product handover or transition', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_TYPE_INSURER', 'MEETING_TYPE', 'INSURER_MEETING', 'Insurer Meeting', 'Meeting with insurer representatives', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_TYPE_TPA', 'MEETING_TYPE', 'TPA_MEETING', 'TPA Meeting', 'Meeting with Third Party Administrator', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_TYPE_OTHER', 'MEETING_TYPE', 'OTHER_MEETING', 'Other Meeting', 'Meeting with others', NOW(), NOW(), 'Admin', 'Admin');

INSERT INTO lookup_data (
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
  ('MEETING_STATUS_SCHEDULED', 'MEETING_STATUS', 'SCHEDULED', 'Scheduled', 'The meeting is scheduled but not yet held', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_STATUS_COMPLETED', 'MEETING_STATUS', 'COMPLETED', 'Completed', 'The meeting has been completed', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_STATUS_CANCELLED', 'MEETING_STATUS', 'CANCELLED', 'Cancelled', 'The meeting has been cancelled', NOW(), NOW(), 'Admin', 'Admin');

INSERT INTO lookup_data (
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
  ('MEETING_LOCATION_CLIENT', 'MEETING_LOCATION', 'CLIENT_LOCATION', 'Client Location', 'Meeting held at the client location', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_LOCATION_IIRM', 'MEETING_LOCATION', 'IIRM_LOCATION', 'IIRM Location', 'Meeting held at the IIRM premises', NOW(), NOW(), 'Admin', 'Admin'),
  ('MEETING_LOCATION_PARTNER', 'MEETING_LOCATION', 'PARTNER_LOCATION', 'Partner Location', 'Meeting held at a partner location', NOW(), NOW(), 'Admin', 'Admin');

------------
ALTER TABLE meeting
  ALTER COLUMN start_time TYPE timetz USING start_time::timetz,
  ALTER COLUMN end_time TYPE timetz USING end_time::timetz;

------------
-- MEETING_OUTCOME lookup data (454-458)
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
)
VALUES
  ('MEETING_OUTCOME_TIMELINE', 'MEETING_OUTCOME', 'PROJECT_TIMELINE_DISCUSSION', 'Successfully discussed project timeline', 'Meeting covered project timeline details', NOW(), NOW(), 'Admin', 'Admin',1),
  ('MEETING_OUTCOME_INTEREST', 'MEETING_OUTCOME', 'INTEREST_ADDITIONAL_SERVICES', 'Client showed interest in additional services', 'Client expressed interest in services beyond the current scope', NOW(), NOW(), 'Admin', 'Admin',2),
  ('MEETING_OUTCOME_PRICING', 'MEETING_OUTCOME', 'FOLLOW_UP_PRICING', 'Need follow-up on pricing details', 'Client requires further discussion on pricing', NOW(), NOW(), 'Admin', 'Admin',3),
  ('MEETING_OUTCOME_TECH', 'MEETING_OUTCOME', 'TECHNICAL_REQUIREMENTS_CLARIFIED', 'Technical requirements clarified', 'Technical aspects and requirements were clarified during the meeting', NOW(), NOW(), 'Admin', 'Admin',4),
  ('MEETING_OUTCOME_FOLLOWUP', 'MEETING_OUTCOME', 'FOLLOWUP_MEETING_SCHEDULED', 'Scheduled follow-up meeting', 'A follow-up meeting was scheduled with the client', NOW(), NOW(), 'Admin', 'Admin',5);

------ MEETING_CHALLENGE lookup data (459-463)
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
)
VALUES
  ('MEETING_CHALLENGE_TECHNICAL', 'MEETING_CHALLENGE', 'TECHNICAL_DIFFICULTIES', 'Technical difficulties', 'Issues related to technology or system interruptions during the meeting', NOW(), NOW(), 'Admin', 'Admin',1),
  ('MEETING_CHALLENGE_TIME', 'MEETING_CHALLENGE', 'TIME_CONSTRAINT', 'Time constraint', 'Limited time affected the meeting effectiveness', NOW(), NOW(), 'Admin', 'Admin',2),
  ('MEETING_CHALLENGE_BUDGET', 'MEETING_CHALLENGE', 'BUDGET_CONSTRAINT', 'Budget constraint', 'Budget limitations impacted the discussion', NOW(), NOW(), 'Admin', 'Admin',3),
  ('MEETING_CHALLENGE_RESOURCE', 'MEETING_CHALLENGE', 'RESOURCE_AVAILABILITY', 'Resource availability', 'Lack of key personnel or tools during the meeting', NOW(), NOW(), 'Admin', 'Admin',4),
  ('MEETING_CHALLENGE_SCOPE', 'MEETING_CHALLENGE', 'SCOPE_UNCERTAINTY', 'Scope uncertainty', 'Meeting lacked clarity on project scope or objectives', NOW(), NOW(), 'Admin', 'Admin',5);


---- MEETING_NEXT_STEP lookup data (464-468)
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
)
VALUES
  ('MEETING_NEXT_STEP_PROPOSAL', 'MEETING_NEXT_STEP', 'SEND_PROPOSAL_DOCUMENT', 'Send proposal document', 'Share the proposal document with the client for review', NOW(), NOW(), 'Admin', 'Admin',1),
  ('MEETING_NEXT_STEP_COST', 'MEETING_NEXT_STEP', 'PREPARE_COST_ESTIMATION', 'Prepare cost estimation', 'Provide estimated costs for the discussed solution', NOW(), NOW(), 'Admin', 'Admin',2),
  ('MEETING_NEXT_STEP_CASE', 'MEETING_NEXT_STEP', 'SHARE_CASE_STUDIES', 'Share case studies', 'Send relevant case studies to demonstrate capabilities', NOW(), NOW(), 'Admin', 'Admin',3),
  ('MEETING_NEXT_STEP_TIMELINE', 'MEETING_NEXT_STEP', 'CREATE_PROJECT_TIMELINE', 'Create project timeline', 'Draft and share a tentative project timeline', NOW(), NOW(), 'Admin', 'Admin',4),
  ('MEETING_NEXT_STEP_TECH_MEETING', 'MEETING_NEXT_STEP', 'SCHEDULE_TECHNICAL_TEAM_MEETING', 'Schedule technical team meeting', 'Arrange a follow-up meeting involving the technical team', NOW(), NOW(), 'Admin', 'Admin',5);

--------
-- Mapping table for Meeting outcomes
CREATE TABLE public.meeting_outcomes_map (
  id SERIAL,
  meeting_id INT NOT NULL,
  outcome_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_meeting_outcomes_map PRIMARY KEY (id),
  CONSTRAINT fk_meeting_outcomes_map_meeting
    FOREIGN KEY (meeting_id)
    REFERENCES public.meeting (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_meeting_outcomes_map_outcome
    FOREIGN KEY (outcome_id)
    REFERENCES public.lookup_data (id)
    ON DELETE CASCADE
);

CREATE INDEX idx_meeting_outcomes_map_meeting_id ON meeting_outcomes_map(meeting_id);
CREATE INDEX idx_meeting_outcomes_map_outcome_id ON meeting_outcomes_map(outcome_id);

-- Mapping table for Meeting Challenges
CREATE TABLE public.meeting_challenges_map (
  id SERIAL,
  meeting_id INT NOT NULL,
  challenge_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_meeting_challenges_map PRIMARY KEY (id),
  CONSTRAINT fk_meeting_challenges_map_meeting
    FOREIGN KEY (meeting_id)
    REFERENCES public.meeting (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_meeting_challenges_map_challenge
    FOREIGN KEY (challenge_id)
    REFERENCES public.lookup_data (id)
    ON DELETE CASCADE
);

CREATE INDEX idx_meeting_challenges_map_meeting_id ON meeting_challenges_map(meeting_id);
CREATE INDEX idx_meeting_challenges_map_challenge_id ON meeting_challenges_map(challenge_id);

-- Mapping table for Meeting Next Steps
CREATE TABLE public.meeting_next_steps_map (
  id SERIAL,
  meeting_id INT NOT NULL,
  next_step_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_meeting_next_steps_map PRIMARY KEY (id),
  CONSTRAINT fk_meeting_next_steps_map_meeting
    FOREIGN KEY (meeting_id)
    REFERENCES public.meeting (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_meeting_next_steps_map_next_step
    FOREIGN KEY (next_step_id)
    REFERENCES public.lookup_data (id)
    ON DELETE CASCADE
);

CREATE INDEX idx_meeting_next_steps_map_meeting_id ON meeting_next_steps_map(meeting_id);
CREATE INDEX idx_meeting_next_steps_map_next_step_id ON meeting_next_steps_map(next_step_id);

ALTER TABLE meeting
ADD COLUMN meeting_rating INT,
ADD COLUMN feedback_submitted VARCHAR(255);

---------------
ALTER TABLE meeting_document_map
ALTER COLUMN document_type_lid DROP NOT NULL;

ALTER TABLE meeting
ADD COLUMN remarks TEXT;