-- Terrorism share percentage and amount per insurer row.
-- Terrorism brokerage used to be charged on the basic-premium share amount; it is now
-- charged on the terrorism premium, split by its own share percentage which may differ
-- from the premium share percentage.
-- Both columns mirror share_percentage / share_amount in type and precision.
-- Nullable: existing rows fall back to the premium share, preserving their current figures.

ALTER TABLE opportunity_final_negotiation_sharing_detail
  ADD COLUMN IF NOT EXISTS terrorism_share_percentage numeric(7, 4),
  ADD COLUMN IF NOT EXISTS terrorism_share_amount numeric(21, 4);

ALTER TABLE opportunity_placement_slip_sharing_detail
  ADD COLUMN IF NOT EXISTS terrorism_share_percentage numeric(7, 4),
  ADD COLUMN IF NOT EXISTS terrorism_share_amount numeric(21, 4);

ALTER TABLE opportunity_held_cover_note_insurer_map
  ADD COLUMN IF NOT EXISTS terrorism_share_percentage numeric(7, 4),
  ADD COLUMN IF NOT EXISTS terrorism_share_amount numeric(21, 4);

ALTER TABLE opportunity_policy_confirmation_insurer_map
  ADD COLUMN IF NOT EXISTS terrorism_share_percentage numeric(7, 4),
  ADD COLUMN IF NOT EXISTS terrorism_share_amount numeric(21, 4);

ALTER TABLE opportunity_policy_hard_copy_insurer_map
  ADD COLUMN IF NOT EXISTS terrorism_share_percentage numeric(7, 4),
  ADD COLUMN IF NOT EXISTS terrorism_share_amount numeric(21, 4);

ALTER TABLE policy_insurer_map
  ADD COLUMN IF NOT EXISTS terrorism_share_percentage numeric(7, 4),
  ADD COLUMN IF NOT EXISTS terrorism_share_amount numeric(21, 4);
