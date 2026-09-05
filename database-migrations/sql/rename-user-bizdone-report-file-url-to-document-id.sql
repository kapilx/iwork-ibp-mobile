-- user_bizdone_report.file_url started out holding a raw S3 URL, then a
-- FileUpload id stored as text (see report-export-job.util.ts). Every row is
-- now guaranteed to hold a numeric FileUpload id, so give the column a type
-- that says so and a name that matches what it actually stores.
--
-- MUST run after backfill-legacy-bizdone-report-file-uploads.sql — that
-- script converts every remaining raw https:// URL into a FileUpload id
-- first (and takes the zz_bkp_user_bizdone_report_* backup covering both
-- scripts). The ALTER COLUMN ... TYPE INTEGER below fails if any row still
-- holds a URL.

ALTER TABLE user_bizdone_report
  RENAME COLUMN file_url TO document_id;

ALTER TABLE user_bizdone_report
  ALTER COLUMN document_id TYPE INTEGER USING document_id::integer;
