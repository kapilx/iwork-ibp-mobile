ALTER TABLE policy 
    RENAME COLUMN commission_terrorism_percentage to terrorism_brokerage_percentage;

ALTER TABLE policy 
    RENAME COLUMN gross_premium_amount TO gross_premium;

ALTER TABLE policy 
    RENAME COLUMN net_premium_amount TO net_premium;

ALTER TABLE policy 
    RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE policy 
    RENAME COLUMN service_tax TO gst_percentage;

ALTER TABLE policy 
    RENAME COLUMN brokerage_percentage TO basic_brokerage_percentage;

ALTER TABLE policy
    ADD COLUMN total_brokerage_amount NUMERIC(19, 2);

ALTER TABLE endorsement 
    RENAME COLUMN gross_premium_amount TO gross_premium;

ALTER TABLE endorsement 
    RENAME COLUMN net_premium_amount TO net_premium;

ALTER TABLE endorsement 
    RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE endorsement 
    RENAME COLUMN service_tax TO gst_percentage;

ALTER TABLE endorsement 
    RENAME COLUMN brokerage_percentage TO basic_brokerage_percentage;

ALTER TABLE policy_asset_endorsement 
    RENAME COLUMN gross_premium_amount TO gross_premium;

ALTER TABLE policy_asset_endorsement 
    RENAME COLUMN net_premium_amount TO net_premium;

ALTER TABLE policy_asset_endorsement 
    RENAME COLUMN service_tax_amount TO gst_amount;

ALTER TABLE policy_asset_endorsement 
    RENAME COLUMN brokerage_amount TO basic_brokerage_amount;

ALTER TABLE policy_asset_endorsement 
    RENAME COLUMN brokerage_percentage TO basic_brokerage_percentage;

ALTER TABLE policy_insurer_map
    ADD COLUMN IF NOT EXISTS terrorism_brokerage_percentage NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS terrorism_brokerage_amount NUMERIC(19,2),
    ADD COLUMN IF NOT EXISTS total_brokerage_amount NUMERIC(19,2);

ALTER TABLE endorsement 
    RENAME COLUMN commission_terrorism_percentage to terrorism_brokerage_percentage;

ALTER TABLE policy_asset_endorsement 
    RENAME COLUMN commission_terrorism_percentage to terrorism_brokerage_percentage;

ALTER TABLE endorsement 
    RENAME COLUMN brokerage_amount TO basic_brokerage_amount;
