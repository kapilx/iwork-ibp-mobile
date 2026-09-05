-- Creates claim_form_extraction table to store OCR-extracted claim document data
CREATE TABLE IF NOT EXISTS claim_form_extraction (
  id            SERIAL PRIMARY KEY,
  policy_id     INT          NULL,
  employee_id   INT          NULL,
  file_name     TEXT         NULL,
  claim_data    JSONB        NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NULL,
  created_by    INT          NULL,
  updated_by    INT          NULL
);
