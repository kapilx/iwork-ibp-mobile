-- Add RCON tracking fields to policy table
ALTER TABLE policy
  ADD COLUMN IF NOT EXISTS rcon_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS rcon_brokerage NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rcon_outcome VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pending_brokerage NUMERIC(12,2) DEFAULT 0;
