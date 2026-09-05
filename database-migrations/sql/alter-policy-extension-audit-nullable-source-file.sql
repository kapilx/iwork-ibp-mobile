-- Allow policy_extension_audit.source_file_upload_id to be NULL so that
-- form-based (non-file-upload) policy extensions can also create audit records.
ALTER TABLE policy_extension_audit
  ALTER COLUMN source_file_upload_id DROP NOT NULL;
