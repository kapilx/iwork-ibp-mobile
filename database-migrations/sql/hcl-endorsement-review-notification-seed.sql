-- ─────────────────────────────────────────────────────────────────────────────
-- HCL Employee Interface Sync — "Endorsement ready for review" notification
-- seed (see docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md
-- §15).
--
-- Seeds the notification-service tables the new
-- Endorsement_Upload_Ready_For_Review event needs to actually send (event
-- type → parameter definitions → event/parameter mapping → channel/event
-- template mapping for in-app + email).
--
-- Without these rows, notifyEndorsementReadyForReview's calls to
-- POST /notifications fail with "Event type not found" (and, if that were
-- fixed without the rest of this script, an "active template mapping not
-- found" error) — logged and swallowed there (best-effort, never blocks the
-- employee-upload pipeline), so the practical symptom without this script is
-- simply: no notification ever arrives, silently.
--
-- Recipients: the company's CRM (Company.lead_crm, falling back to
-- account_manager) and the RiskWatch admin who submitted the endorsement
-- (Endorsement.created_by) — resolved in code
-- (company-employee-upload.util.ts's notifyEndorsementReadyForReview), not
-- here; this script only wires up the event/template plumbing.
--
-- Email body matches the same branded layout used by this codebase's other
-- HTML notification emails (top color strip, logo header, hero heading, an
-- info-card content section, footer) — see e.g. the Enrolment Confirmation /
-- Feedback Submitted templates. In-app body stays short plain text, matching
-- how every other event's in-app channel is seeded (e.g. MIR's seed).
--
-- Idempotent: safe to re-run (re-running after editing the body text below
-- will NOT update an already-seeded row — see the note above section 4).
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── 1. notification_event_type ────────────────────────────────────────────
INSERT INTO notification_event_type (name, description) VALUES
  ('Endorsement_Upload_Ready_For_Review',
   'A policy_employee_data upload batch tied to an Endorsement finished (COMPLETED or FAILED) — notifies the company''s Lead CRM and the RiskWatch admin who submitted it that the endorsement is ready for review in iWork.')
ON CONFLICT (name) DO NOTHING;

-- ─── 2. notification_parameter ──────────────────────────────────────────────
-- 'companyName' already exists in every environment we've checked (reused by
-- MIR's seed); 'iirmLogoUrl'/'currentYear' likewise already exist (reused by
-- every other branded HTML email — e.g. Feedback_Submitted_Email); the rest
-- are new to this event.
INSERT INTO notification_parameter ("key", description) VALUES
  ('companyName',   'Client company name'),
  ('recipientName', 'CRM contact''s first + last name (falls back to "there" if not on file) — greets the CRM specifically; the same rendered email also reaches the submitting HR admin as a second recipient'),
  ('endorsementId', 'Endorsement ID (Endorsement.id)'),
  ('policyId',      'Policy ID (Policy.id)'),
  ('iworkUrl',      'Deep link to the endorsement in iWork (/{policyId}/create-endorsement/{endorsementId})'),
  ('successCount',  'Rows that succeeded in this upload batch'),
  ('errorCount',    'Rows that were rejected in this upload batch'),
  ('status',        'COMPLETED or FAILED — the upload batch''s raw outcome'),
  ('statusLabel',   'Human-readable status — "Completed" or "Failed"'),
  ('statusColor',   'Status badge text color (hex), precomputed in code from status'),
  ('statusBg',      'Status badge background color (hex), precomputed in code from status'),
  ('iirmLogoUrl',   'IIRM logo image URL for the email header'),
  ('currentYear',   'Current year, for the email footer copyright line')
ON CONFLICT ("key") DO NOTHING;

-- ─── 3. notification_event_parameter_mapping ───────────────────────────────
INSERT INTO notification_event_parameter_mapping (event_type_id, parameter_definition_id, required)
SELECT e.id, p.id, (p."key" IN ('endorsementId', 'policyId', 'iworkUrl', 'status'))
FROM notification_event_type e
JOIN notification_parameter p ON p."key" IN (
  'companyName', 'recipientName', 'endorsementId', 'policyId', 'iworkUrl', 'successCount', 'errorCount',
  'status', 'statusLabel', 'statusColor', 'statusBg', 'iirmLogoUrl', 'currentYear'
)
WHERE e.name = 'Endorsement_Upload_Ready_For_Review'
AND NOT EXISTS (
  SELECT 1 FROM notification_event_parameter_mapping m
  WHERE m.event_type_id = e.id AND m.parameter_definition_id = p.id
);

-- ─── 4. notification_channel_event_template_mapping ────────────────────────
-- One row per (event × channel), each with its own subject/body — email gets
-- the full branded HTML layout, in-app stays short plain text (matching the
-- MIR seed's convention). status_lid = NOTIFICATION_ON (required by
-- findTemplateMapping regardless of strict-status mode). active_status_lid/
-- approval_status_lid set to Active/Approved so this also works correctly if
-- NOTIFICATION_TEMPLATE_STRICT_STATUS is ever turned on. No company_id/
-- config_id set — this is the default (global) template; a company can still
-- override it later via the existing company-level template customization
-- (notification_channel_event_template_mapping.company_id).
--
-- NOTE: this INSERT is idempotent via "NOT EXISTS" per (event, channel) — if
-- you need to change the body/subject text after this has already run once
-- in an environment, that has to be a separate UPDATE, not a re-run of this
-- script.
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
  ('Endorsement_Upload_Ready_For_Review', 'NOTIFICATION_CHANNEL_IN_APP',
   'Endorsement #{{endorsementId}} ready for review — {{companyName}}',
   'An employee-data upload for {{companyName}} finished ({{statusLabel}}) — {{successCount}} succeeded, {{errorCount}} rejected. Endorsement {{endorsementId}} on Policy {{policyId}} needs review. {{iworkUrl}}'),
  ('Endorsement_Upload_Ready_For_Review', 'NOTIFICATION_CHANNEL_EMAIL',
   'Endorsement #{{endorsementId}} ready for review — {{companyName}}',
$HTML$<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Endorsement Ready For Review - IIRM</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #2f2f2f;
    }
    table { border-spacing: 0; border-collapse: separate; }
    img { border: 0; outline: none; text-decoration: none; display: block; max-width: 100%; height: auto; }
    .email-wrap { width: 100%; background-color: #ffffff; padding: 20px 0; }
    .email-container {
      width: 600px; max-width: 600px; margin: 0 auto; background-color: #ffffff;
      border: 1px solid #e3e8ef; border-radius: 8px; overflow: hidden;
    }
    .top-strip { background-color: #0f6fc2; height: 8px; }
    .header-row { padding: 20px 24px 8px 24px; background-color: #ffffff; }
    .header-right { text-align: right; vertical-align: middle; }
    .iirm-logo { width: 110px; max-width: 110px; margin-left: auto; }
    .hero-row { padding: 0 24px; background-color: #ffffff; }
    .hello { margin: 0 0 14px 0; font-size: 18px; line-height: 1.4; color: #222222; }
    .main-title { margin: 0; font-size: 24px; line-height: 1.3; font-weight: 700; color: #1f1f1f; }
    .sub-text { margin: 12px 0 0 0; font-size: 14px; line-height: 1.7; color: #4d5b6a; }
    .section { padding: 18px 24px 0 24px; background-color: #ffffff; }
    .section-title { margin: 0 0 10px 0; font-size: 16px; line-height: 1.4; font-weight: 700; color: #0f6fc2; }
    .info-card {
      width: 100%; background-color: #f8f8f8; border: 1px solid #d9dde3;
      border-left: 5px solid #1a73e8; border-radius: 8px; margin-bottom: 14px;
    }
    .info-card-cell { padding: 20px 22px; }
    .line { margin: 6px 0; font-size: 14px; line-height: 1.65; color: #3d4b59; }
    .status-badge {
      display: inline-block; padding: 4px 12px; border-radius: 999px;
      font-size: 13px; font-weight: 700;
    }
    .cta-row { padding: 4px 24px 4px 24px; background-color: #ffffff; }
    .cta-button {
      display: inline-block; background-color: #0f6fc2; color: #ffffff !important;
      font-size: 14px; font-weight: 700; text-decoration: none;
      padding: 12px 24px; border-radius: 6px;
    }
    .closing-row { padding: 8px 24px 12px 24px; background-color: #ffffff; }
    .closing-text { margin: 0; font-size: 14px; line-height: 1.7; color: #3d4b59; }
    .footer {
      background-color: #152737; color: #c5d1dc; text-align: center;
      font-size: 12px; line-height: 1.4; padding: 12px 18px;
    }
  </style>
</head>
<body>
  <table class="email-wrap" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0">

          <tr><td class="top-strip"></td></tr>

          <tr>
            <td class="header-row">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="header-right">
                    <img src="{{iirmLogoUrl}}" alt="IIRM Logo" class="iirm-logo" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="hero-row">
              <p class="hello">Hi {{recipientName}},</p>
              <h2 class="main-title">Endorsement Ready For Review</h2>
              <p class="sub-text">
                An employee-data upload for <strong>{{companyName}}</strong> has finished
                processing and this endorsement is waiting for your review before it moves
                forward in iWork.
              </p>
            </td>
          </tr>

          <tr>
            <td class="section">
              <h3 class="section-title">Batch Summary</h3>
              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">
                    <p class="line">
                      <strong>Status:</strong>
                      <span class="status-badge" style="color:{{statusColor}};background-color:{{statusBg}};">{{statusLabel}}</span>
                    </p>
                    <p class="line"><strong>Company:</strong> {{companyName}}</p>
                    <p class="line"><strong>Policy ID:</strong> {{policyId}}</p>
                    <p class="line"><strong>Endorsement ID:</strong> {{endorsementId}}</p>
                    <p class="line"><strong>Records Succeeded:</strong> {{successCount}}</p>
                    <p class="line"><strong>Records Rejected:</strong> {{errorCount}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="cta-row">
              <a href="{{iworkUrl}}" class="cta-button">Review Endorsement in iWork</a>
            </td>
          </tr>

          <tr>
            <td class="closing-row">
              <p class="closing-text">
                If there were rejected records, open the endorsement's Endorsement Request
                step to download the error report before proceeding.
                <br /><br />
                Warm regards,<br />
                <strong>Team IIRM</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td class="footer">&copy; Copyright {{currentYear}} IIRM. All Rights Reserved</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$HTML$)
) AS t(event_name, channel_key, subject, body) ON t.event_name = e.name AND t.channel_key = c.channel_type_key
WHERE e.name = 'Endorsement_Upload_Ready_For_Review'
AND NOT EXISTS (
  SELECT 1 FROM notification_channel_event_template_mapping m
  WHERE m.event_type_id = e.id AND m.channel_type_id = c.id
);

-- ─── 5. UPDATE — for environments where this event was already seeded ─────
-- If you already ran an earlier version of this script (plain-text body),
-- section 4's INSERT above is a no-op for you (NOT EXISTS already fails) —
-- these UPDATEs apply the current subject/body regardless of whether the row
-- pre-existed. Safe to re-run any number of times.
UPDATE notification_channel_event_template_mapping m
SET subject = t.subject, body = t.body
FROM notification_event_type e, notification_channel_type c,
  (VALUES
    ('NOTIFICATION_CHANNEL_IN_APP',
     'Endorsement #{{endorsementId}} ready for review — {{companyName}}',
     'An employee-data upload for {{companyName}} finished ({{statusLabel}}) — {{successCount}} succeeded, {{errorCount}} rejected. Endorsement {{endorsementId}} on Policy {{policyId}} needs review. {{iworkUrl}}')
  ) AS t(channel_key, subject, body)
WHERE e.name = 'Endorsement_Upload_Ready_For_Review'
  AND c.channel_type_key = t.channel_key
  AND m.event_type_id = e.id AND m.channel_type_id = c.id;

UPDATE notification_channel_event_template_mapping m
SET subject = t.subject, body = t.body
FROM notification_event_type e, notification_channel_type c,
  (VALUES
    ('NOTIFICATION_CHANNEL_EMAIL',
     'Endorsement #{{endorsementId}} ready for review — {{companyName}}',
$HTML$<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Endorsement Ready For Review - IIRM</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #2f2f2f;
    }
    table { border-spacing: 0; border-collapse: separate; }
    img { border: 0; outline: none; text-decoration: none; display: block; max-width: 100%; height: auto; }
    .email-wrap { width: 100%; background-color: #ffffff; padding: 20px 0; }
    .email-container {
      width: 600px; max-width: 600px; margin: 0 auto; background-color: #ffffff;
      border: 1px solid #e3e8ef; border-radius: 8px; overflow: hidden;
    }
    .top-strip { background-color: #0f6fc2; height: 8px; }
    .header-row { padding: 20px 24px 8px 24px; background-color: #ffffff; }
    .header-right { text-align: right; vertical-align: middle; }
    .iirm-logo { width: 110px; max-width: 110px; margin-left: auto; }
    .hero-row { padding: 0 24px; background-color: #ffffff; }
    .hello { margin: 0 0 14px 0; font-size: 18px; line-height: 1.4; color: #222222; }
    .main-title { margin: 0; font-size: 24px; line-height: 1.3; font-weight: 700; color: #1f1f1f; }
    .sub-text { margin: 12px 0 0 0; font-size: 14px; line-height: 1.7; color: #4d5b6a; }
    .section { padding: 18px 24px 0 24px; background-color: #ffffff; }
    .section-title { margin: 0 0 10px 0; font-size: 16px; line-height: 1.4; font-weight: 700; color: #0f6fc2; }
    .info-card {
      width: 100%; background-color: #f8f8f8; border: 1px solid #d9dde3;
      border-left: 5px solid #1a73e8; border-radius: 8px; margin-bottom: 14px;
    }
    .info-card-cell { padding: 20px 22px; }
    .line { margin: 6px 0; font-size: 14px; line-height: 1.65; color: #3d4b59; }
    .status-badge {
      display: inline-block; padding: 4px 12px; border-radius: 999px;
      font-size: 13px; font-weight: 700;
    }
    .cta-row { padding: 4px 24px 4px 24px; background-color: #ffffff; }
    .cta-button {
      display: inline-block; background-color: #0f6fc2; color: #ffffff !important;
      font-size: 14px; font-weight: 700; text-decoration: none;
      padding: 12px 24px; border-radius: 6px;
    }
    .closing-row { padding: 8px 24px 12px 24px; background-color: #ffffff; }
    .closing-text { margin: 0; font-size: 14px; line-height: 1.7; color: #3d4b59; }
    .footer {
      background-color: #152737; color: #c5d1dc; text-align: center;
      font-size: 12px; line-height: 1.4; padding: 12px 18px;
    }
  </style>
</head>
<body>
  <table class="email-wrap" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0">

          <tr><td class="top-strip"></td></tr>

          <tr>
            <td class="header-row">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="header-right">
                    <img src="{{iirmLogoUrl}}" alt="IIRM Logo" class="iirm-logo" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="hero-row">
              <p class="hello">Hi {{recipientName}},</p>
              <h2 class="main-title">Endorsement Ready For Review</h2>
              <p class="sub-text">
                An employee-data upload for <strong>{{companyName}}</strong> has finished
                processing and this endorsement is waiting for your review before it moves
                forward in iWork.
              </p>
            </td>
          </tr>

          <tr>
            <td class="section">
              <h3 class="section-title">Batch Summary</h3>
              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">
                    <p class="line">
                      <strong>Status:</strong>
                      <span class="status-badge" style="color:{{statusColor}};background-color:{{statusBg}};">{{statusLabel}}</span>
                    </p>
                    <p class="line"><strong>Company:</strong> {{companyName}}</p>
                    <p class="line"><strong>Policy ID:</strong> {{policyId}}</p>
                    <p class="line"><strong>Endorsement ID:</strong> {{endorsementId}}</p>
                    <p class="line"><strong>Records Succeeded:</strong> {{successCount}}</p>
                    <p class="line"><strong>Records Rejected:</strong> {{errorCount}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="cta-row">
              <a href="{{iworkUrl}}" class="cta-button">Review Endorsement in iWork</a>
            </td>
          </tr>

          <tr>
            <td class="closing-row">
              <p class="closing-text">
                If there were rejected records, open the endorsement's Endorsement Request
                step to download the error report before proceeding.
                <br /><br />
                Warm regards,<br />
                <strong>Team IIRM</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td class="footer">&copy; Copyright {{currentYear}} IIRM. All Rights Reserved</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$HTML$)
  ) AS t(channel_key, subject, body)
WHERE e.name = 'Endorsement_Upload_Ready_For_Review'
  AND c.channel_type_key = t.channel_key
  AND m.event_type_id = e.id AND m.channel_type_id = c.id;

COMMIT;
