-- Add deleted_at column for soft deletion
ALTER TABLE public.opportunity_quote_entry
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create table for storing quote tax details
CREATE TABLE IF NOT EXISTS public.opportunity_quote_tax_map (
    id SERIAL PRIMARY KEY,
    opportunity_quote_entry_id INT REFERENCES opportunity_quote_entry(id) ON DELETE CASCADE,
    tax_lid INT,
    tax_value NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INT,
    updated_by INT
);

-- Remove tax columns from opportunity_quote_entry
ALTER TABLE public.opportunity_quote_entry
    DROP COLUMN IF EXISTS tax,
    DROP COLUMN IF EXISTS tax_value;

-- Update opportunity_quote table with remarks and status_lid
ALTER TABLE public.opportunity_quote
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS status_lid INT,
    ADD COLUMN IF NOT EXISTS broking_slip_id INT;

-- Create table to map documents to opportunity_quote
CREATE TABLE IF NOT EXISTS public.opportunity_quote_doc_map (
    id SERIAL PRIMARY KEY,
    opportunity_quote_id INT REFERENCES opportunity_quote(id) ON DELETE CASCADE,
    document_id INT,
    document_type_lid INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INT,
    updated_by INT
);
