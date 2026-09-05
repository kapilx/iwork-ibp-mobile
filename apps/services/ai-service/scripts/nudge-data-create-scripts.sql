-- ai_user_feedback table, executed in dev db
CREATE TABLE ai_user_feedback
(
    id SERIAL PRIMARY KEY,
    is_valid_response integer DEFAULT 1,
    message_id integer NOT NULL REFERENCES ai_conversation_message(id) ON DELETE CASCADE,
    comment text DEFAULT NULL,
    additional_info jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    created_by integer,
    updated_by integer
);

-- ai_prompt_favourite table to store user favourite prompts, executed in dev db

CREATE TABLE ai_prompt_favourite (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    is_favourite INTEGER DEFAULT 1,
    comment TEXT NULL,
    additional_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE NULL,
    created_by INTEGER NULL,
    CONSTRAINT fk_prompt_favourite_message
        FOREIGN KEY (message_id)
        REFERENCES ai_conversation_message(id)
        ON DELETE CASCADE
);


-- Executed in pre-prod on 2025-12-26


CREATE TABLE mstr_nudge (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    nudge_template TEXT,
    prompt TEXT,
    endpoint_url TEXT,
    method VARCHAR(20),
    is_enable BOOLEAN DEFAULT TRUE,
    org_id INT NOT NULL,
    key VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT DEFAULT 1,
    updated_by INT,

    CONSTRAINT fk_mstr_nugget_org
        FOREIGN KEY (org_id)
        REFERENCES organisation(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


CREATE TABLE mstr_nudge_action (
    id SERIAL PRIMARY KEY,
    nudge_id INT REFERENCES mstr_nudge(id),
    action_url TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    additional_details TEXT,
    is_enable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT DEFAULT 1,
    updated_by INT
);


CREATE TABLE mstr_nudge_parameters (
    id SERIAL PRIMARY KEY,
    nudge_id INT REFERENCES mstr_nudge(id),
    parameter VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_enable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT DEFAULT 1,
    updated_by INT
);


CREATE TABLE mstr_nudge_scope (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT DEFAULT 1,
    updated_by INT
);



CREATE TABLE mstr_nudge_scope_role_mapping (
    id SERIAL PRIMARY KEY,
    nudge_id INT REFERENCES mstr_nudge(id),
    scope_id INT REFERENCES mstr_nudge_scope(id),
    role_id INT NOT NULL,
    is_enable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT DEFAULT 1,
    updated_by INT
);

--alter script for mstr_nudge table to add new column icon_key and background_color
ALTER TABLE mstr_nudge
ADD COLUMN icon_key VARCHAR(255),
ADD COLUMN background_color VARCHAR(50);