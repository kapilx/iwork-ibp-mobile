-- Per-cover "show until activity" cutoff. Stores an activity_key; a cover is
-- visible up to and including that activity and hidden afterwards. NULL = no
-- cutoff (visible in every activity). Set on the template in the master
-- "Map Cover to Policy Type" step and snapshotted onto the opportunity cover.
ALTER TABLE mstr_cover_template
  ADD COLUMN IF NOT EXISTS visible_until_activity_key VARCHAR(100);

ALTER TABLE opportunity_cover_map
  ADD COLUMN IF NOT EXISTS visible_until_activity_key VARCHAR(100);
