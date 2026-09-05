-- Adds an HR comment column to raise_ticket, populated whenever HR changes a ticket's status.
ALTER TABLE raise_ticket ADD COLUMN IF NOT EXISTS comment TEXT;
