CREATE TABLE note (
    id SERIAL,  -- Auto-incrementing primary key
    company_id INT,
    opportunity_id INT,
    activity_id INT,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,

    -- Constraints
    CONSTRAINT pk_note PRIMARY KEY (id),
    CONSTRAINT fk_note_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_note_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunity(id),
    CONSTRAINT fk_note_activity FOREIGN KEY (activity_id) REFERENCES opportunity_activity_map(id)
);

CREATE TABLE public.note_document_map (
    id SERIAL,
    note_id INT NOT NULL,
    document_id INT NOT NULL,
    -- Constraints
    CONSTRAINT pk_note_document_map PRIMARY KEY (id),
    CONSTRAINT fk_note_document_map_note
        FOREIGN KEY (note_id)
        REFERENCES public.note (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_note_document_map_document
        FOREIGN KEY (document_id)
        REFERENCES public.file_uploads (id)
        ON DELETE CASCADE
);

---------------***-------------------
ALTER TABLE public.note
ADD COLUMN title VARCHAR(100) NOT NULL DEFAULT 'Untitled';

ALTER TABLE public.note
ALTER COLUMN description DROP NOT NULL;