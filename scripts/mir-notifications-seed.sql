-- ─────────────────────────────────────────────────────────────────────────────
-- MIR — Monthly Information Report · Notification seed (IIRM-758_MIR, BR-MIR-019)
--
-- Seeds the notification-service tables the 5 MIR_Report_* events need to
-- actually send (event type → parameter definitions → event/parameter
-- mapping → channel/event template mapping for in-app + email).
--
-- Without these rows, MirReportService.sendMirNotification's calls to
-- POST /notifications fail with "Event type not found" (and, if that were
-- fixed without the rest of this script, "Active template mapping not found").
--
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── 1. notification_event_type ────────────────────────────────────────────
INSERT INTO notification_event_type (name, description) VALUES
  ('MIR_Report_Submitted',   'MIR submitted for approval — notifies the company''s Lead CRM'),
  ('MIR_Report_Approved',    'MIR approved by Lead CRM — notifies the Associate CRM'),
  ('MIR_Report_Rejected',    'MIR rejected by Lead CRM — notifies the Associate CRM with the rejection comment'),
  ('MIR_Report_Published',   'MIR published to the client — notifies the company''s HR Manager(s)'),
  ('MIR_Report_Acknowledged','MIR acknowledged by HR — notifies the Associate CRM and Lead CRM')
ON CONFLICT (name) DO NOTHING;

-- ─── 2. notification_parameter ──────────────────────────────────────────────
-- 'companyName' already exists in every environment we've checked; the rest
-- are new to MIR.
INSERT INTO notification_parameter ("key", description) VALUES
  ('reportUrl',   'Deep link to the MIR report in iWork'),
  ('companyName', 'Client company name'),
  ('period',      'MIR report period, MM-YYYY'),
  ('comment',     'Lead CRM''s rejection comment (only populated for MIR_Report_Rejected)')
ON CONFLICT ("key") DO NOTHING;

-- ─── 3. notification_event_parameter_mapping ───────────────────────────────
-- Every MIR event gets reportUrl/companyName/period; only Rejected also gets comment.
INSERT INTO notification_event_parameter_mapping (event_type_id, parameter_definition_id, required)
SELECT e.id, p.id, (p."key" != 'comment')
FROM notification_event_type e
JOIN notification_parameter p ON p."key" IN ('reportUrl', 'companyName', 'period')
WHERE e.name IN (
  'MIR_Report_Submitted', 'MIR_Report_Approved', 'MIR_Report_Rejected',
  'MIR_Report_Published', 'MIR_Report_Acknowledged'
)
AND NOT EXISTS (
  SELECT 1 FROM notification_event_parameter_mapping m
  WHERE m.event_type_id = e.id AND m.parameter_definition_id = p.id
);

INSERT INTO notification_event_parameter_mapping (event_type_id, parameter_definition_id, required)
SELECT e.id, p.id, true
FROM notification_event_type e
JOIN notification_parameter p ON p."key" = 'comment'
WHERE e.name = 'MIR_Report_Rejected'
AND NOT EXISTS (
  SELECT 1 FROM notification_event_parameter_mapping m
  WHERE m.event_type_id = e.id AND m.parameter_definition_id = p.id
);

-- ─── 4. notification_channel_event_template_mapping ────────────────────────
-- One row per (event × channel). status_lid = NOTIFICATION_ON (4650, "on"
-- switch — required by findTemplateMapping regardless of strict-status mode).
-- active_status_lid/approval_status_lid set to Active/Approved so this also
-- works correctly if NOTIFICATION_TEMPLATE_STRICT_STATUS is ever turned on.
INSERT INTO notification_channel_event_template_mapping
  (event_type_id, channel_type_id, subject, body, status_lid, active_status_lid, approval_status_lid, created_by, updated_by)
SELECT e.id, c.id, t.subject, t.body,
       (SELECT id FROM lookup_data WHERE lookup_key = 'NOTIFICATION_ON'),
       (SELECT id FROM lookup_data WHERE lookup_key = 'TEMPLATE_ACTIVE_STATUS_ACTIVE'),
       (SELECT id FROM lookup_data WHERE lookup_key = 'APPROVAL_STATUS_APPROVED'),
       1, 1
FROM notification_event_type e
JOIN notification_channel_type c ON c.channel_type_key IN ('NOTIFICATION_CHANNEL_IN_APP', 'NOTIFICATION_CHANNEL_EMAIL')
JOIN (VALUES
  ('MIR_Report_Submitted',
   'MIR submitted for approval — {{companyName}}',
   'The MIR for {{companyName}} ({{period}}) has been submitted and is awaiting your approval. View it: {{reportUrl}}'),
  ('MIR_Report_Approved',
   'MIR approved — {{companyName}}',
   'Your MIR for {{companyName}} ({{period}}) has been approved. View it: {{reportUrl}}'),
  ('MIR_Report_Rejected',
   'MIR rejected — {{companyName}}',
   'Your MIR for {{companyName}} ({{period}}) was rejected with the following comment: "{{comment}}". Edit and resubmit: {{reportUrl}}'),
  ('MIR_Report_Published',
   'MIR published — {{companyName}}',
   'The MIR for {{companyName}} ({{period}}) is now published and visible under IBP-HR / Risk Watch. View it: {{reportUrl}}'),
  ('MIR_Report_Acknowledged',
   'MIR acknowledged — {{companyName}}',
   'HR has acknowledged the MIR for {{companyName}} ({{period}}), closing the monthly loop. View it: {{reportUrl}}')
) AS t(event_name, subject, body) ON t.event_name = e.name
WHERE e.name IN (
  'MIR_Report_Submitted', 'MIR_Report_Approved', 'MIR_Report_Rejected',
  'MIR_Report_Published', 'MIR_Report_Acknowledged'
)
AND NOT EXISTS (
  SELECT 1 FROM notification_channel_event_template_mapping m
  WHERE m.event_type_id = e.id AND m.channel_type_id = c.id
);

COMMIT;
