-- Adds is_ro_generation_enabled flag to org_sbu to control per-SBU RO creation
ALTER TABLE org_sbu
  ADD COLUMN is_ro_generation_enabled BOOLEAN NOT NULL DEFAULT FALSE;
