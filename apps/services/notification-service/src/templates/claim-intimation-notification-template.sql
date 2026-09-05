BEGIN;

INSERT INTO notification_event_type (name, description)
VALUES (
  'Claim_Intimation_Confirmation_Email',
  'Email sent to an employee after a claim intimation is submitted successfully.'
)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO notification_parameter (key, description)
VALUES
  ('employeeName',          'Employee display name'),
  ('companyName',           'Company display name'),
  ('policyName',            'Policy name'),
  ('claimNumber',           'Generated claim number'),
  ('claimType',             'Claim type: CASHLESS or REIMBURSEMENT'),
  ('isCashless',            'Boolean: true if claim type is CASHLESS'),
  ('isAccidentClaim',       'Boolean: true if policy type is GPA (accident)'),
  ('patientName',           'Name of the patient (employee or dependent)'),
  ('patientRelation',       'Relation of patient: SELF or dependent relation'),
  ('diagnosis',             'Diagnosis description or accident details'),
  ('estimatedClaimAmount',  'Estimated claim amount'),
  ('dateOfAdmission',       'Date of admission or date of accident'),
  ('proposedDischargeDate', 'Proposed discharge date (GMC only)'),
  ('placeOfAccident',       'Place of accident (GPA only)'),
  ('hospitalName',          'Hospital name (GMC only)'),
  ('hospitalLocation',      'Hospital location address (GMC only)'),
  ('submissionDate',        'Date of claim intimation submission'),
  ('iirmLogoUrl',           'IIRM email logo URL'),
  ('currentYear',           'Current calendar year')
ON CONFLICT (key) DO UPDATE
SET description = EXCLUDED.description;

WITH event AS (
  SELECT id FROM notification_event_type WHERE name = 'Claim_Intimation_Confirmation_Email'
),
parameters(parameter_key, required) AS (
  VALUES
    ('employeeName',          true),
    ('companyName',           false),
    ('policyName',            true),
    ('claimNumber',           true),
    ('claimType',             false),
    ('isCashless',            false),
    ('isAccidentClaim',       false),
    ('patientName',           true),
    ('patientRelation',       true),
    ('diagnosis',             true),
    ('estimatedClaimAmount',  true),
    ('dateOfAdmission',       false),
    ('proposedDischargeDate', false),
    ('placeOfAccident',       false),
    ('hospitalName',          false),
    ('hospitalLocation',      false),
    ('submissionDate',        true),
    ('iirmLogoUrl',           false),
    ('currentYear',           true)
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
    (SELECT id FROM notification_event_type WHERE name = 'Claim_Intimation_Confirmation_Email') AS event_type_id,
    (SELECT id FROM notification_channel_type WHERE channel_type_key = 'NOTIFICATION_CHANNEL_EMAIL') AS channel_type_id,
    (SELECT id FROM lookup_data WHERE lookup_key = 'NOTIFICATION_ON' LIMIT 1) AS status_lid,
    (SELECT id FROM lookup_data WHERE lookup_key = 'TEMPLATE_ACTIVE_STATUS_ACTIVE' LIMIT 1) AS active_status_lid,
    (SELECT id FROM lookup_data WHERE lookup_key = 'APPROVAL_STATUS_APPROVED' LIMIT 1) AS approval_status_lid
),
template AS (
  SELECT
    'Claim Intimation confirmation - IIRM Insurance Wellness Hub'::text AS subject,
    $template$<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claim Intimation Confirmation - IIRM</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #2f2f2f;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table {
      border-spacing: 0;
      border-collapse: separate;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
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
      line-height: 8px;
      font-size: 0;
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

    .content {
      padding: 0 24px;
      background-color: #ffffff;
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

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      line-height: 1.2;
      font-weight: 700;
      letter-spacing: 0;
      color: #ffffff;
    }

    .badge-cashless {
      background-color: #1f9d55;
    }

    .badge-reimbursement {
      background-color: #e67e22;
    }

    .badge-gpa {
      background-color: #8e44ad;
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
  </style>
</head>
<body>
  <table class="email-wrap" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="top-strip">&nbsp;</td>
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
            <td class="content">
              <p class="hello">Hi {{employeeName}},</p>
              <h2 class="main-title">Claim Intimation Confirmation</h2>
              <p class="sub-text">
                Your claim intimation for <strong>{{policyName}}</strong> has been confirmed successfully intimated. The details of your claim are highlighted below.
              </p>
            </td>
          </tr>

          <tr>
            <td class="section">
              <h3 class="section-title">Claim Details</h3>
              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">

                    {{#if claimType}}
                      {{#if isCashless}}
                        <p class="line"><span class="badge badge-cashless">CASHLESS</span></p>
                      {{else}}
                        <p class="line"><span class="badge badge-reimbursement">REIMBURSEMENT</span></p>
                      {{/if}}
                    {{/if}}

                    {{#if isAccidentClaim}}
                      <p class="line"><span class="badge badge-gpa">ACCIDENT</span></p>
                    {{/if}}

                    <p class="line"><strong>Claim Number:</strong> {{claimNumber}}</p>
                    <p class="line"><strong>Policy:</strong> {{policyName}}</p>
                    <p class="line"><strong>Patient:</strong> {{patientName}} ({{patientRelation}})</p>

                    {{#if isAccidentClaim}}
                      <p class="line"><strong>Accident Details:</strong> {{diagnosis}}</p>
                      <p class="line"><strong>Date of Accident:</strong> {{dateOfAdmission}}</p>
                      {{#if placeOfAccident}}
                        <p class="line"><strong>Place of Accident:</strong> {{placeOfAccident}}</p>
                      {{/if}}
                    {{else}}
                      <p class="line"><strong>Diagnosis:</strong> {{diagnosis}}</p>
                      <p class="line"><strong>Date of Admission:</strong> {{dateOfAdmission}}</p>
                      {{#if proposedDischargeDate}}
                        <p class="line"><strong>Proposed Discharge Date:</strong> {{proposedDischargeDate}}</p>
                      {{/if}}
                    {{/if}}

                    <p class="line"><strong>Estimated Claim Amount:</strong> ₹{{estimatedClaimAmount}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{#unless isAccidentClaim}}
          <tr>
            <td class="section">
              <h3 class="section-title">Hospital Details</h3>
              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">
                    <p class="line"><strong>Hospital Name:</strong> {{hospitalName}}</p>
                    {{#if hospitalLocation}}
                      <p class="line"><strong>Location:</strong> {{hospitalLocation}}</p>
                    {{/if}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {{/unless}}

          <tr>
            <td class="section">
              <h3 class="section-title">Submission Details</h3>
              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">
                    <p class="line"><strong>Status:</strong> Successfully Submitted</p>
                    <p class="line"><strong>Claim Number:</strong> {{claimNumber}}</p>
                    <p class="line"><strong>Submission Date:</strong> {{submissionDate}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="section">
              <h3 class="section-title">Support</h3>
              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">
                    <p class="line">
                      For any queries related to your claim, coverage, or status updates, please contact your HR team or TPA coordinator.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="closing-row">
              <p class="closing-text">
                We recommend keeping this email for your records.<br />
                Thank you for using IIRM Insurance Wellness Hub.<br /><br />
                Warm regards,<br />
                <strong>Team IIRM</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td class="footer">
              &copy; Copyright {{currentYear}} IIRM. All Rights Reserved
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
