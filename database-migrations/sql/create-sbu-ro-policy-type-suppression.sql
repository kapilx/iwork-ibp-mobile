-- Creates denylist table for suppressing specific policy types per SBU during RO generation
CREATE TABLE sbu_ro_policy_type_suppression (
  id               SERIAL PRIMARY KEY,
  sbu_id           INT NOT NULL REFERENCES org_sbu(id),
  policy_type_lid  INT NOT NULL REFERENCES look_up(id),
  created_by       INT NOT NULL,
  updated_by       INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sbu_id, policy_type_lid)
);
