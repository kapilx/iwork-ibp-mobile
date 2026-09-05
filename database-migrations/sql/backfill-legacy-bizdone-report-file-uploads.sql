-- Legacy user_bizdone_report.file_url rows (created before processReportExportJob
-- started writing a file_uploads id — see report-export-job.util.ts) hold a raw,
-- already-expired pre-signed S3 URL instead of a file_uploads id. toReportDownloadUrl
-- already tolerates both shapes at read time, but this backfills a real file_uploads
-- row per legacy URL and repoints file_url at its new id, so every row ends up in the
-- same "numeric id" format.
--
-- Key extraction mirrors s3KeyFromUrl() in report-export-job.util.ts: strip
-- scheme+host+query, then strip a leading '<bucket>/' if the URL happens to be
-- path-style. These report keys are plain ASCII (see policy.service.ts, e.g.
-- `uploads/policy/reports/policy-list-${userId}-${Date.now()}.xlsx`), so unlike
-- the app code this does not decodeURIComponent() the path — if that's ever not
-- true for some row, this script leaves it untouched (file_key ends up empty and
-- is skipped) rather than writing a wrong key.
--
-- Safe to re-run: only rows still matching '^https?://' are touched, and once a
-- row is migrated its file_url is numeric and no longer matches.
--
-- Verified against a real stored URL (virtual-hosted style, bucket in host not
-- path, so the path-style fallback below is a no-op for these):
--   https://iirm-prod-filesystem.s3.ap-south-1.amazonaws.com/document-generation/policy/-1/2026/Aug/BizDone-Report_20260805070656.xlsx?X-Amz-Algorithm=...
--   -> document-generation/policy/-1/2026/Aug/BizDone-Report_20260805070656.xlsx
--
-- Snapshots the full table first (name carries the timestamp it was taken,
-- e.g. zz_bkp_user_bizdone_report_20260809_1159 — check NOTICE output, or
-- `SELECT tablename FROM pg_tables WHERE tablename LIKE 'zz_bkp_user_bizdone_report_%' ORDER BY tablename DESC`,
-- to find the exact name afterwards) so a bad run can be undone with:
--   UPDATE user_bizdone_report r
--   SET file_url = b.file_url
--   FROM zz_bkp_user_bizdone_report_<timestamp> b
--   WHERE r.id = b.id;

DO $$
DECLARE
  backup_table TEXT := 'zz_bkp_user_bizdone_report_' || to_char(now(), 'YYYYMMDD_HH24MI');
BEGIN
  EXECUTE format(
    'CREATE TABLE %I AS SELECT * FROM user_bizdone_report WHERE 1 = 1',
    backup_table
  );
  RAISE NOTICE 'Backed up user_bizdone_report to %', backup_table;
END $$;

DO $$
DECLARE
  bucket TEXT := 'iirm-prod-filesystem'; -- ENV.S3_AWS_BUCKET
  r RECORD;
  file_key TEXT;
  new_id INT;
BEGIN
  FOR r IN
    SELECT id, user_id, file_url
    FROM user_bizdone_report
    WHERE file_url ~* '^https?://'
  LOOP
    -- strip scheme + host, then the query string, leaving the raw path
    file_key := regexp_replace(r.file_url, '^https?://[^/]+/', '');
    file_key := split_part(file_key, '?', 1);

    -- path-style fallback: strip a leading '<bucket>/' if present
    IF bucket <> '' AND file_key LIKE bucket || '/%' THEN
      file_key := substring(file_key FROM length(bucket) + 2);
    END IF;

    IF file_key IS NULL OR file_key = '' THEN
      RAISE NOTICE 'Skipping user_bizdone_report.id=% — could not derive file_key from %', r.id, r.file_url;
      CONTINUE;
    END IF;

    INSERT INTO file_uploads (file_key, upload_type, document_type_lid, created_by, updated_by)
    VALUES (file_key, 'AWS', 0, r.user_id, r.user_id)
    RETURNING id INTO new_id;

    UPDATE user_bizdone_report
    SET file_url = new_id::text
    WHERE id = r.id;
  END LOOP;
END $$;
