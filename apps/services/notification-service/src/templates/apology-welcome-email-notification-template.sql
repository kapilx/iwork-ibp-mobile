BEGIN;

INSERT INTO notification_event_type (name, description)
VALUES (
  'Previous_Welcome_Email_Apology',
  'Apology email sent to an employee who may have incorrectly received an earlier welcome email.'
)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO notification_parameter (key, description)
VALUES
  ('employeeName', 'Employee display name'),
  ('iirmLogoUrl',  'IIRM email logo URL'),
  ('currentYear',  'Current calendar year')
ON CONFLICT (key) DO UPDATE
SET description = EXCLUDED.description;

WITH event AS (
  SELECT id FROM notification_event_type WHERE name = 'Previous_Welcome_Email_Apology'
),
parameters(parameter_key, required) AS (
  VALUES
    ('employeeName', true),
    ('iirmLogoUrl',  false),
    ('currentYear',  true)
)
INSERT INTO notification_event_parameter_mapping (
  event_type_id,
  parameter_definition_id,
  required
)
SELECT
  event.id,
  notification_parameter.id,
  parameters.required
FROM event
JOIN parameters ON true
JOIN notification_parameter ON notification_parameter.key = parameters.parameter_key
WHERE NOT EXISTS (
  SELECT 1
  FROM notification_event_parameter_mapping existing
  WHERE existing.event_type_id = event.id
    AND existing.parameter_definition_id = notification_parameter.id
);

WITH resolved AS (
  SELECT
    (SELECT id FROM notification_event_type WHERE name = 'Previous_Welcome_Email_Apology') AS event_type_id,
    (SELECT id FROM notification_channel_type WHERE channel_type_key = 'NOTIFICATION_CHANNEL_EMAIL') AS channel_type_id,
    (SELECT id FROM lookup_data WHERE lookup_key = 'NOTIFICATION_ON' LIMIT 1) AS status_lid,
    (SELECT id FROM lookup_data WHERE lookup_key = 'TEMPLATE_ACTIVE_STATUS_ACTIVE' LIMIT 1) AS active_status_lid,
    (SELECT id FROM lookup_data WHERE lookup_key = 'APPROVAL_STATUS_APPROVED' LIMIT 1) AS approval_status_lid
),
template AS (
  SELECT
    'We Apologize for the Previous Email - IIRM Insurance Wellness Hub'::text AS subject,
    $template$<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Notification</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #2f2f2f;
    }

    table {
      border-spacing: 0;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      display: block;
      max-width: 100%;
      height: auto;
    }

    .email-wrap {
      width: 100%;
      background: #ffffff;
    }

    .email-container {
      width: 600px;
      max-width: 600px;
      margin: auto;
      border: 1px solid #e3e8ef;
      border-radius: 8px;
      background: #ffffff;
    }

    .top-strip {
      background: #0f6fc2;
      height: 8px;
      border-radius: 8px 8px 0 0;
    }

    .header {
      padding: 24px;
      text-align: right;
    }

    .logo {
      width: 110px;
      margin-left: auto;
    }

    .content {
      padding: 0 30px 30px;
    }

    .hello {
      font-size: 18px;
      color: #222;
      margin-bottom: 20px;
    }

    .title {
      font-size: 26px;
      font-weight: bold;
      color: #d93025;
      margin-bottom: 20px;
      line-height: 1.4;
    }

    .card {
      background: #f8f9fb;
      border-left: 5px solid #fbbc04;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      padding: 28px;
    }

    .card p {
      margin: 0 0 18px;
      font-size: 15px;
      line-height: 1.8;
      color: #4b5563;
    }

    .highlight {
      font-weight: 600;
      color: #1f2937;
    }

    .note {
      background: #fff8e5;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 16px;
      margin-top: 20px;
      font-size: 14px;
      color: #92400e;
      line-height: 1.6;
    }

    .closing {
      margin-top: 28px;
      font-size: 14px;
      color: #374151;
      line-height: 1.8;
    }

    .footer {
      background: #152737;
      color: #c5d1dc;
      text-align: center;
      font-size: 12px;
      padding: 14px;
      border-radius: 0 0 8px 8px;
    }

    @media only screen and (max-width:620px) {
      .email-container {
        width: 100% !important;
      }

      .content,
      .header {
        padding-left: 18px !important;
        padding-right: 18px !important;
      }

      .card {
        padding: 20px !important;
      }
    }
  </style>
</head>

<body>

  <table class="email-wrap" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">

        <table class="email-container" cellpadding="0" cellspacing="0">

          <tr>
            <td class="top-strip"></td>
          </tr>

          <tr>
            <td class="header">
              <img src="{{iirmLogoUrl}}" class="logo" alt="IIRM Logo">
            </td>
          </tr>

          <tr>
            <td class="content">

              <p class="hello">
                Hello {{employeeName}},
              </p>

              <h2 class="title">
                We Apologize for the Previous Email
              </h2>

              <div class="card">

                <p>
                  We sincerely apologize for the welcome email that you may have received earlier.
                </p>

                <p>
                  Due to an <span class="highlight">unexpected technical issue</span>, the email was sent unintentionally.
                </p>

                <div class="note">
                  <strong>Please ignore the previously received welcome email.</strong><br><br>

                  No action is required from your end.<br><br>

                  If you did <strong>not</strong> receive the previous welcome email, please ignore this notification as well.
                </div>

                <p style="margin-top:24px;">
                  We sincerely regret any confusion or inconvenience this may have caused and appreciate your patience and understanding.
                </p>

                <p class="closing">
                  If you have any questions or require further assistance, please feel free to contact your HR team or the IIRM Support Team.
                </p>

                <p class="closing">
                  Warm regards,<br>
                  <strong>Team IIRM</strong>
                </p>

              </div>

            </td>
          </tr>

          <tr>
            <td class="footer">
              © {{currentYear}} IIRM. All Rights Reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>

</html>$template$::text AS body
),
updated AS (
  UPDATE notification_channel_event_template_mapping mapping
  SET
    subject = template.subject,
    body = template.body,
    status_lid = resolved.status_lid,
    active_status_lid = resolved.active_status_lid,
    approval_status_lid = resolved.approval_status_lid,
    updated_by = 1,
    updated_at = CURRENT_TIMESTAMP
  FROM resolved, template
  WHERE mapping.event_type_id = resolved.event_type_id
    AND mapping.channel_type_id = resolved.channel_type_id
  RETURNING mapping.id
)
INSERT INTO notification_channel_event_template_mapping (
  subject,
  body,
  event_type_id,
  channel_type_id,
  status_lid,
  active_status_lid,
  approval_status_lid,
  created_by,
  updated_by,
  created_at,
  updated_at
)
SELECT
  template.subject,
  template.body,
  resolved.event_type_id,
  resolved.channel_type_id,
  resolved.status_lid,
  resolved.active_status_lid,
  resolved.approval_status_lid,
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM resolved, template
WHERE NOT EXISTS (SELECT 1 FROM updated);

COMMIT;
