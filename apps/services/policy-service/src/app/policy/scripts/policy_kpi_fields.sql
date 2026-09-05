-- Add KPI tracking fields to policy table
ALTER TABLE policy ADD COLUMN IF NOT EXISTS is_policy_mined_lid INTEGER;
ALTER TABLE policy ADD COLUMN IF NOT EXISTS opportunity_type VARCHAR(2) DEFAULT 'SO';
ALTER TABLE policy ADD COLUMN IF NOT EXISTS brokerage_amount NUMERIC(12,2) DEFAULT 0;
