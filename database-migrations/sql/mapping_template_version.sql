--SQL script to create the mapping_template_version table

CREATE TABLE mapping_template_version (
    id SERIAL PRIMARY KEY,

    company_id INTEGER NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    file_direction VARCHAR(20) NOT NULL,      -- INBOUND / OUTBOUND

    template_version_no INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT false,

    change_note TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER NOT NULL,

    UNIQUE (company_id, entity_name, file_direction, template_version_no)
);
