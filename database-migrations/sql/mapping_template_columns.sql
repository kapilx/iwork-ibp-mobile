--SQL script to create the mapping_template_columns table
CREATE TABLE mapping_template_columns (
    id SERIAL PRIMARY KEY,

    mapping_template_version_id INTEGER NOT NULL
        REFERENCES mapping_template_version(id),

    source_column_id INTEGER NOT NULL,        -- Excel column index (1-based)
    source_column_name VARCHAR(150) NOT NULL, -- Client Excel header

    target_table_name VARCHAR(100) NOT NULL,
    target_column_name VARCHAR(100) NOT NULL,

    transformation_config JSONB NOT NULL,     -- source + target transformation config

    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER NOT NULL,

    UNIQUE (mapping_template_version_id, target_table_name, target_column_name)
);