CREATE TABLE IF NOT EXISTS public.user_bizdone_report (
  id              SERIAL PRIMARY KEY,
  user_id         INT          NOT NULL,
  -- soft ref to users — orphan jobs must not block user deletes
  report_type     VARCHAR(30)  NOT NULL DEFAULT 'BIZDONE'
                    CHECK (report_type IN ('BIZDONE')),
  status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  filters_applied JSONB,
  -- the exact filter set the user applied; the worker replays it to regenerate
  file_url        TEXT,
  -- S3 URL of the generated workbook, populated on COMPLETED
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Worker picks the oldest PENDING job; partial index keeps the claim query fast
CREATE INDEX IF NOT EXISTS idx_user_bizdone_report_pending
  ON public.user_bizdone_report (created_at)
  WHERE status = 'PENDING';

-- Crash-recovery query: find PROCESSING jobs older than the stuck threshold
CREATE INDEX IF NOT EXISTS idx_user_bizdone_report_processing_started
  ON public.user_bizdone_report (started_at)
  WHERE status = 'PROCESSING';

-- "My exports" listing / status polling scoped to the requester
CREATE INDEX IF NOT EXISTS idx_user_bizdone_report_user
  ON public.user_bizdone_report (user_id, created_at);

COMMENT ON TABLE public.user_bizdone_report IS
  'Async job queue for BizDone report exports. Enqueue inserts PENDING, the '
  'policy-service cron worker generates the workbook to S3 and marks '
  'COMPLETED/FAILED, client polls by id for file_url. Decouples generation from '
  'the HTTP request to avoid 504s on large reports.';
