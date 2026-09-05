CREATE TABLE contact (
    id SERIAL NOT NULL,
    title_id INT,
    salutation_id INT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    display_name VARCHAR(100),
    company_id INT NOT NULL,
    company_location_id INT NOT NULL,
    company_branch_id INT,
    tag_id INT,
    contact_type_id INT NOT NULL,
    department INT,
    designation INT,
    department_id INT,
    designation_id INT,
    reporting_to_id INT,
    assistant_id INT,
    email_id VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    remarks VARCHAR(1000),
    status_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    CONSTRAINT pk_contact_id PRIMARY KEY (id),
    CONSTRAINT fk_contact_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
);
CREATE INDEX idx_contact_first_name ON contact(first_name);
CREATE INDEX idx_contact_last_name ON contact(last_name);
CREATE INDEX idx_contact_company_id ON contact(company_id);
CREATE INDEX idx_contact_email_id ON contact(email_id);

ALTER TABLE contact
DROP CONSTRAINT fk_contact_company;

ALTER TABLE contact
DROP COLUMN company_id,
DROP COLUMN email_id, 
DROP COLUMN phone;


ALTER TABLE contact_details 
ADD COLUMN im_address VARCHAR(255), 
ADD COLUMN type_of_business_id INT, 
ADD COLUMN network_value NUMERIC(15,2);

CREATE TABLE company_contact_map (
    id SERIAL NOT NULL,
    company_id INT NOT NULL,
    contact_id INT NOT NULL,    
    CONSTRAINT pk_company_contact_id PRIMARY KEY (id),
    CONSTRAINT fk_company_contact_map_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_company_contact_map_contact_id FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE CASCADE
);
CREATE INDEX idx_company_contact_contact_id ON company_contact_map(contact_id);
CREATE INDEX idx_company_contact_company_id ON company_contact_map(company_id);

CREATE TABLE contact_address (
    id SERIAL NOT NULL,
    contact_id INT NOT NULL,
    address_id INT NOT NULL,
    CONSTRAINT pk_contact_address_id PRIMARY KEY (id),
	CONSTRAINT fk_contact_address_address_id FOREIGN KEY (address_id) REFERENCES address(id),
	CONSTRAINT fk_contact_address_contact_id FOREIGN KEY (contact_id) REFERENCES contact(id)
);
CREATE INDEX idx_contact_address_contact_id ON contact_address(contact_id);
CREATE INDEX idx_contact_address_address_id ON contact_address(address_id);

-- Personal Details Table

-- Contact Details Table (Added contact_id)
CREATE TABLE contact_details (
    id SERIAL NOT NULL,
    contact_id INT NOT NULL,  -- Foreign Key to Contact Table
    
    -- Personal Information
    gender INT,
    date_of_birth DATE,
    website VARCHAR(255),
    favourite_food VARCHAR(100),
    favourite_restaurant VARCHAR(100),
    personal_history TEXT CHECK (LENGTH(personal_history) <= 500),
    major_achievements TEXT CHECK (LENGTH(major_achievements) <= 500),
    marital_status INT,
    date_of_wedding DATE,

    -- Spouse Information
    spouse_name VARCHAR(100),
    spouse_date_of_birth DATE,
    spouse_working_status INT,
    working_company VARCHAR(100),

    -- Child Information
    child_name VARCHAR(100),
    child_dob DATE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete timestamp
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_contact_details_id PRIMARY KEY (id),
    CONSTRAINT fk_contact_details_contact FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE CASCADE
);

-- Indexes for contact_details table
CREATE INDEX idx_contact_details_contact_id ON contact_details(contact_id);
CREATE INDEX idx_contact_details_gender ON contact_details(gender);
CREATE INDEX idx_contact_details_marital_status ON contact_details(marital_status);
CREATE INDEX idx_contact_details_spouse_working_status ON contact_details(spouse_working_status);
CREATE INDEX idx_contact_details_date_of_birth ON contact_details(date_of_birth);
CREATE INDEX idx_contact_details_spouse_date_of_birth ON contact_details(spouse_date_of_birth);
CREATE INDEX idx_contact_details_child_dob ON contact_details(child_dob);
CREATE INDEX idx_contact_details_deleted_at ON contact_details(deleted_at);


-- Professional Experience Table (Added contact_id)
CREATE TABLE professional_experience (
    id SERIAL NOT NULL,
    contact_id INT NOT NULL,  -- Foreign Key to Contact Table
    
    -- Experience Details
    from_date DATE,
    to_date DATE,
    company VARCHAR(100),
    designation VARCHAR(100),
    department VARCHAR(100),
    details TEXT CHECK (LENGTH(details) <= 500),
    remarks TEXT CHECK (LENGTH(remarks) <= 500),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete timestamp
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_professional_experience_id PRIMARY KEY (id),
    CONSTRAINT fk_professional_experience_contact FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE CASCADE
);

-- Indexes for professional_experience table
CREATE INDEX idx_professional_experience_contact_id ON professional_experience(contact_id);
CREATE INDEX idx_professional_experience_from_date ON professional_experience(from_date);
CREATE INDEX idx_professional_experience_to_date ON professional_experience(to_date);
CREATE INDEX idx_professional_experience_company ON professional_experience(company);
CREATE INDEX idx_professional_experience_designation ON professional_experience(designation);
CREATE INDEX idx_professional_experience_department ON professional_experience(department);
CREATE INDEX idx_professional_experience_deleted_at ON professional_experience(deleted_at);


-- Qualification Experience Table (Added contact_id)
CREATE TABLE qualification_experience (
    id SERIAL NOT NULL,
    contact_id INT NOT NULL,  -- Foreign Key to Contact Table
    
    -- Qualification Details
    name_of_qualification VARCHAR(100),
    year_of_qualification INT CHECK (year_of_qualification >= 1900 AND year_of_qualification <= EXTRACT(YEAR FROM CURRENT_DATE)),
    details TEXT CHECK (LENGTH(details) <= 500),
    remarks TEXT CHECK (LENGTH(remarks) <= 500),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete timestamp
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_qualification_experience_id PRIMARY KEY (id),
    CONSTRAINT fk_qualification_experience_contact FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE CASCADE
);

-- Indexes for qualification_experience table
CREATE INDEX idx_qualification_experience_contact_id ON qualification_experience(contact_id);
CREATE INDEX idx_qualification_experience_name ON qualification_experience(name_of_qualification);
CREATE INDEX idx_qualification_experience_year ON qualification_experience(year_of_qualification);
CREATE INDEX idx_qualification_experience_deleted_at ON qualification_experience(deleted_at);



CREATE TABLE IF NOT EXISTS public.contact_doc_map
(
    id SERIAL  NOT NULL,
    contact_id integer NOT NULL,
    doc_id integer NOT NULL,
    CONSTRAINT pk_contact_doc_map PRIMARY KEY (id),
    CONSTRAINT fk_contact FOREIGN KEY (contact_id)
        REFERENCES public.contact (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)


-- Create the contact_communication_details table

CREATE TABLE IF NOT EXISTS contact_communication_details (
    id SERIAL NOT NULL, -- Auto-incrementing primary key
    contact_id INT NOT NULL, -- Foreign key referencing the contact table
    communication_type VARCHAR(50) NOT NULL, -- Type of communication (e.g., email, phone)
    communication_details VARCHAR(255) NOT NULL, -- The actual communication details (e.g., email address, phone number)
    is_primary BOOLEAN DEFAULT FALSE NOT NULL, -- Indicates if this is the primary communication detail
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp of creation
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp of last update
    deleted_at TIMESTAMPTZ, -- Timestamp of deletion (soft delete)
    created_by INT NOT NULL, -- User who created the record
    updated_by INT NOT NULL, -- User who last updated the record
    CONSTRAINT pk_contact_communication_details_id PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_contact_communication_details_contact FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE CASCADE -- Foreign key constraint
);

-- Indexes for contact_communication_details table
CREATE INDEX idx_contact_communication_details_contact_id ON contact_communication_details(contact_id);
CREATE INDEX idx_contact_communication_details_type ON contact_communication_details(communication_type);
CREATE INDEX idx_contact_communication_details_deleted_at ON contact_communication_details(deleted_at);



CREATE TABLE child_details (
    id SERIAL NOT NULL,
    contact_details_id INT NOT NULL,  -- Foreign Key to Contact Table
 
    -- Child Information
    child_name VARCHAR(100),
    child_dob DATE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete timestamp
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_child_details_id PRIMARY KEY (id),
    CONSTRAINT fk_child_details_contact_details_id FOREIGN KEY (contact_details_id) REFERENCES contact_details(id) ON DELETE CASCADE
);
CREATE INDEX idx_child_details_contact_details_id ON child_details(contact_details_id);
CREATE INDEX idx_child_details_child_dob ON child_details(child_dob);
CREATE INDEX idx_child_details_deleted_at ON child_details(deleted_at);
