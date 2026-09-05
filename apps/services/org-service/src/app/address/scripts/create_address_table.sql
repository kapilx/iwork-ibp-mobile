-- Table to store address details
CREATE TABLE address (
    id SERIAL NOT NULL, -- Unique identifier for the address
    address_type_id INT, -- Type of address (e.g., home, office)
    addr_1 VARCHAR(255) NOT NULL, -- Primary address line 
    addr_2 VARCHAR(255), -- Secondary address line
    area VARCHAR(100), -- Area or locality
    country_id INT NOT NULL, -- Foreign key referencing the country table
    state_id INT NOT NULL, -- Foreign key referencing the state table
    city_id INT NOT NULL, -- Foreign key referencing the city table
    pincode VARCHAR(20), -- Postal code
    landmark VARCHAR(200), -- Nearby landmark
    phone_number VARCHAR(20), -- Primary phone number
    alternatePhoneNumber VARCHAR(20), -- Alternate phone number
    email VARCHAR(100), -- Email address
    support_number VARCHAR(20), -- Support contact number
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp when the record was created
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Timestamp when the record was last updated
    created_by INT NOT NULL, -- User who created the record
    updated_by INT NOT NULL, -- User who last updated the record
    CONSTRAINT pk_address_id PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_address_country FOREIGN KEY (country_id) REFERENCES country(id), -- Foreign key constraint for country
    CONSTRAINT fk_address_state FOREIGN KEY (state_id) REFERENCES state(id), -- Foreign key constraint for state
    CONSTRAINT fk_address_city FOREIGN KEY (city_id) REFERENCES city(id) -- Foreign key constraint for city
);
-- Indexes for faster lookups
CREATE INDEX idx_address_country_id ON address(country_id);
CREATE INDEX idx_address_state_id ON address(state_id);
CREATE INDEX idx_address_city_id ON address(city_id);
CREATE INDEX idx_address_pincode ON address(pincode);

-- Table to store the relationship between companies and their contacts
CREATE TABLE company_contact (
    id SERIAL NOT NULL, -- Unique identifier for the company-contact relationship
    contact_id INT NOT NULL, -- Foreign key referencing the contact table
    company_id INT NOT NULL, -- Foreign key referencing the company table
    CONSTRAINT pk_company_contact_id PRIMARY KEY (id) -- Primary key constraint
);
-- Indexes for faster lookups
CREATE INDEX idx_company_contact_contact_id ON company_contact(contact_id);
CREATE INDEX idx_company_contact_company_id ON company_contact(company_id);

-- Table to store the relationship between contacts and their addresses
CREATE TABLE contact_address (
    id SERIAL NOT NULL, -- Unique identifier for the contact-address relationship
    contact_id INT NOT NULL, -- Foreign key referencing the contact table
    address_id INT NOT NULL, -- Foreign key referencing the address table
    CONSTRAINT pk_contact_address_id PRIMARY KEY (id) -- Primary key constraint
);
-- Indexes for faster lookups
CREATE INDEX idx_contact_address_contact_id ON contact_address(contact_id);
CREATE INDEX idx_contact_address_address_id ON contact_address(address_id);


