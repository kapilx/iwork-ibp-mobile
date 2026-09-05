-- Table: region
CREATE TABLE region (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Table: country
CREATE TABLE country (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    iso_code VARCHAR(10),
    region_id INT NOT NULL REFERENCES region(id)
);

-- Table: state
CREATE TABLE state (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_code VARCHAR(10),
    country_id INT NOT NULL REFERENCES country(id)
);

-- Table: city
CREATE TABLE city (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL REFERENCES state(id)
);

-- Table: address
CREATE TABLE address (
    id SERIAL PRIMARY KEY,
    address_type VARCHAR(100),
    addr_1 VARCHAR(200) NOT NULL,
    addr_2 VARCHAR(200),
    area VARCHAR(100),
    country_id INT NOT NULL REFERENCES country(id),
    state_id INT NOT NULL REFERENCES state(id),
    city_id INT NOT NULL REFERENCES city(id),
    pincode VARCHAR(20),
    landmark VARCHAR(200),
    phone_number VARCHAR(20),
    alternate_phone_number VARCHAR(20),
    email VARCHAR(100),
    support_number VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NOT NULL
);

-- Table: company_contact
CREATE TABLE company_contact (
    id SERIAL PRIMARY KEY,
    contact_id INT NOT NULL,
    company_id INT NOT NULL
);

-- Table: contact_address
CREATE TABLE contact_address (
    id SERIAL NOT NULL,
    contact_id INT NOT NULL,
    address_id INT NOT NULL,
    CONSTRAINT pk_contact_address_id PRIMARY KEY (id),
	CONSTRAINT fk_contact_address_address_id FOREIGN KEY (address_id) REFERENCES address(id),
	CONSTRAINT fk_contact_address_contact_id FOREIGN KEY (contact_id) REFERENCES contact(id)
);

-- Updated with constructors in entities
-- No changes to SQL scripts as constructors are for TypeScript entities only.
