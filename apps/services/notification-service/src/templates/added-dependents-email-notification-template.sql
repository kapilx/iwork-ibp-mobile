BEGIN;

-- Defensive: the TypeORM entities declare these columns unique, but this
-- environment runs with synchronize: false and no prior migration ever
-- added the constraints, so ON CONFLICT below has no target to match.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_notification_event_type_name'
  ) THEN
    ALTER TABLE notification_event_type ADD CONSTRAINT uq_notification_event_type_name UNIQUE (name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_notification_parameter_key'
  ) THEN
    ALTER TABLE notification_parameter ADD CONSTRAINT uq_notification_parameter_key UNIQUE (key);
  END IF;
END $$;

INSERT INTO notification_event_type (name, description)
VALUES (
  'Added_Dependents_Email',
  'Email sent to an employee after dependent details are saved during profile/enrollment, ahead of the enrollment window opening.'
)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO notification_parameter (key, description)
VALUES
  ('employeeName', 'Employee display name'),
  ('dependentDetails', 'Dependents saved by the employee'),
  ('submissionDate', 'Date the dependent details were saved'),
  ('enrollmentStartDate', 'Enrollment window start date, if known'),
  ('enrollmentEndDate', 'Enrollment window end date, if known'),
  ('referenceNumber', 'Submission reference number, if available'),
  ('portalLink', 'Employee portal URL'),
  ('iirmLogoUrl', 'IIRM email logo URL'),
  ('currentYear', 'Current calendar year')
ON CONFLICT (key) DO UPDATE
SET description = EXCLUDED.description;

WITH event AS (
  SELECT id FROM notification_event_type WHERE name = 'Added_Dependents_Email'
),
parameters(parameter_key, required) AS (
  VALUES
    ('employeeName', true),
    ('dependentDetails', false),
    ('submissionDate', true),
    ('enrollmentStartDate', false),
    ('enrollmentEndDate', false),
    ('referenceNumber', false),
    ('portalLink', false),
    ('iirmLogoUrl', false),
    ('currentYear', true)
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
    (SELECT id FROM notification_event_type WHERE name = 'Added_Dependents_Email') AS event_type_id,
    (SELECT id FROM notification_channel_type WHERE channel_type_key = 'NOTIFICATION_CHANNEL_EMAIL') AS channel_type_id,
    (SELECT id FROM lookup_data WHERE lookup_key = 'NOTIFICATION_ON' LIMIT 1) AS status_lid,
    (SELECT id FROM lookup_data WHERE lookup_key = 'TEMPLATE_ACTIVE_STATUS_ACTIVE' LIMIT 1) AS active_status_lid,
    (SELECT id FROM lookup_data WHERE lookup_key = 'APPROVAL_STATUS_APPROVED' LIMIT 1) AS approval_status_lid
),
template AS (
  SELECT
    'Enrolment Confirmed - IIRM Insurance Wellness Hub'::text AS subject,
    $template$<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enrolment Confirmed - IIRM</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #2f2f2f;
    }

    table {
      border-spacing: 0;
      border-collapse: separate;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
      max-width: 100%;
      height: auto;
    }

    .email-wrap {
      width: 100%;
      background-color: #ffffff;
      padding: 20px 0;
    }

    .email-container {
      width: 600px;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e3e8ef;
      border-radius: 8px;
      overflow: hidden;
    }

    .top-strip {
      background-color: #0f6fc2;
      height: 8px;
    }

    .header-row {
      padding: 20px 24px 8px 24px;
      background-color: #ffffff;
    }

    .header-right {
      text-align: right;
      vertical-align: middle;
    }

    .iirm-logo {
      width: 110px;
      max-width: 110px;
      margin-left: auto;
    }

    .hero-row {
      padding: 0 24px;
      background-color: #ffffff;
    }

    .hero-text-cell {
      vertical-align: middle;
      padding-right: 16px;
    }

    .hero-image-cell {
      vertical-align: middle;
      text-align: right;
      width: 170px;
    }

    .illustration {
      width: 180px;
      max-width: 180px;
      margin-left: auto;
    }

    .hello {
      margin: 0 0 14px 0;
      font-size: 18px;
      line-height: 1.4;
      color: #222222;
    }

    .main-title {
      margin: 0;
      font-size: 24px;
      line-height: 1.3;
      font-weight: 700;
      color: #1f1f1f;
    }

    .sub-text {
      margin: 12px 0 0 0;
      font-size: 14px;
      line-height: 1.7;
      color: #4d5b6a;
    }

    .section {
      padding: 18px 24px 0 24px;
      background-color: #ffffff;
    }

    .section-title {
      margin: 0 0 10px 0;
      font-size: 16px;
      line-height: 1.4;
      font-weight: 700;
      color: #0f6fc2;
    }

    .info-card {
      width: 100%;
      background-color: #f8f8f8;
      border: 1px solid #d9dde3;
      border-left: 5px solid #1a73e8;
      border-radius: 8px;
      margin-bottom: 14px;
    }

    .info-card-cell {
      padding: 20px 22px;
    }

    .line {
      margin: 6px 0;
      font-size: 14px;
      line-height: 1.65;
      color: #3d4b59;
    }

    .dependent-heading {
      margin-top: 10px;
      font-weight: 700;
    }

    .dependent-row {
      border-top: 1px dashed #d9dde3;
      padding-top: 8px;
      margin-top: 8px;
    }

    .dependent-row:first-of-type {
      border-top: none;
      padding-top: 0;
      margin-top: 0;
    }

    .cta-row {
      background-color: #ffffff;
      padding: 4px 24px 22px;
      text-align: left;
    }

    .cta-btn {
      background-color: #0f6fc2;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 24px;
      font-size: 15px;
      display: inline-block;
      font-weight: 600;
      line-height: 1;
    }

    .closing-row {
      padding: 0 24px 12px 24px;
      background-color: #ffffff;
    }

    .closing-text {
      margin: 0;
      font-size: 14px;
      line-height: 1.7;
      color: #3d4b59;
    }

    .footer {
      background-color: #152737;
      color: #c5d1dc;
      text-align: center;
      font-size: 12px;
      line-height: 1.4;
      padding: 12px 18px;
    }

    /* Stack the hero image under the text on narrow screens */
    @media only screen and (max-width: 480px) {
      .hero-row table,
      .hero-row tbody,
      .hero-row tr,
      .hero-row td {
        display: block;
        width: 100% !important;
        text-align: left !important;
      }
      .hero-image-cell {
        padding-top: 12px;
      }
      .illustration {
        margin-left: 0;
      }
    }
  </style>
</head>

<body>
  <table class="email-wrap" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">

        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0">

          <tr>
            <td class="top-strip"></td>
          </tr>

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
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="hero-text-cell">
                    <p class="hello">Hi {{employeeName}},</p>

                    <h2 class="main-title">
                      Enrolment Confirmed
                    </h2>

                    <p class="sub-text">
                      Thank you for completing your enrolment. We are pleased to confirm that your insurance enrolment has been successfully submitted.  </p>
                  </td>
                  <td class="hero-image-cell">
                    <img src="{{illustrationLogoUrl}}" alt="Illustration" class="illustration" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="section">

              <h3 class="section-title">
                Member Details
              </h3>

              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">

                    <p class="line">
                      <strong>Employee Name:</strong> {{employeeName}}
                    </p>

                    <p class="line dependent-heading">
                      Dependent Details:
                    </p>

                    {{#if dependentDetails.length}}

                      {{#each dependentDetails}}

                        <div class="dependent-row">
                          <p class="line">
                            Name: <strong>{{name}}</strong> |
                            Relation: {{relation}}
                          </p>
                        </div>

                      {{/each}}

                    {{else}}

                      <p class="line">No dependents added</p>

                    {{/if}}

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td class="section">

              <h3 class="section-title">
                Submission Details
              </h3>

              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">

                    <p class="line">
                      <strong>Status:</strong> Enrolment confirmed.
                    </p>

                    <p class="line">
                      <strong>Saved On:</strong> {{submissionDate}}
                    </p>

                    {{#if enrollmentStartDate}}
                    <p class="line">
                      <strong>Enrollment Window:</strong> {{enrollmentStartDate}} to {{enrollmentEndDate}}
                    </p>
                    {{else}}
                      {{#if enrollmentEndDate}}
                      <p class="line">
                        <strong>Enrollment Window Closes:</strong> {{enrollmentEndDate}}
                      </p>
                      {{/if}}
                    {{/if}}

                    {{#if referenceNumber}}
                    <p class="line">
                      <strong>Reference Number:</strong> {{referenceNumber}}
                    </p>
                    {{/if}}

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td class="section">

              <h3 class="section-title">
                Support
              </h3>

              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">

                    <p class="line">
                      For any queries related to enrolment, coverage,
                      or claims, please contact your HR team or TPA coordinator.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          {{#if portalLink}}
          <tr>
            <td class="cta-row">
              <a href="{{safeUrl portalLink}}" class="cta-btn" target="_blank" rel="noopener noreferrer">Go to Portal</a>
            </td>
          </tr>
          {{/if}}

          <tr>
            <td class="closing-row">

              <p class="closing-text">
                We recommend keeping this email for your records.
                <br /><br />

                Thank you for keeping your dependent details up to date. We'll notify you
                once your organization's enrollment window opens.
                <br /><br />

                Warm regards,
                <br />

                <strong>Team IIRM</strong>
              </p>

            </td>
          </tr>

          <tr>
            <td class="footer">
              &copy; Copyright {{currentYear}} IIRM.
              All Rights Reserved
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
