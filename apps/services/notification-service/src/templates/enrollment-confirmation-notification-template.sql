BEGIN;

WITH resolved AS (
    SELECT
        (SELECT id
         FROM notification_event_type
         WHERE name = 'Enrollment_Confirmation_Email'
         LIMIT 1) AS event_type_id,

        (SELECT id
         FROM notification_channel_type
         WHERE channel_type_key = 'NOTIFICATION_CHANNEL_EMAIL'
         LIMIT 1) AS channel_type_id,

        (SELECT id
         FROM lookup_data
         WHERE lookup_key = 'NOTIFICATION_ON'
         LIMIT 1) AS status_lid,

        (SELECT id
         FROM lookup_data
         WHERE lookup_key = 'TEMPLATE_ACTIVE_STATUS_ACTIVE'
         LIMIT 1) AS active_status_lid,

        (SELECT id
         FROM lookup_data
         WHERE lookup_key = 'APPROVAL_STATUS_APPROVED'
         LIMIT 1) AS approval_status_lid
),

template AS (
    SELECT
        '{{#if isAutoSubmit}}Auto-Submitted: {{/if}}Enrolment Confirmed - IIRM Insurance Wellness Hub'::TEXT AS subject,

$template$
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enrolment Confirmation - IIRM</title>

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

    .dependent-heading {
      margin-top: 10px;
      font-weight: 700;
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
            <td class="content">
              <p class="hello">Hi {{employeeName}},</p>

              <h2 class="main-title">
                Enrolment Confirmed
              </h2>

              <p class="sub-text">
                Thank you for completing your enrolment.
                We are pleased to confirm that your insurance enrolment has been successfully submitted.
              </p>
            </td>
          </tr>

          <tr>
            <td class="section">

              <h3 class="section-title">
                Policy Details
              </h3>

              {{#if policyDetails.length}}

                {{#each policyDetails}}

                  <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td class="info-card-cell">

                        <p class="line">
                          <strong>Policy Name:</strong> {{policyName}}
                        </p>

                        <p class="line">
                          <strong>Policy Period:</strong>
                          {{policyStartDate}} to {{policyEndDate}}
                        </p>

                        <p class="line">
                          <strong>Total Lives:</strong> {{totalLives}}
                        </p>

                        <p class="line dependent-heading">
                          <strong>Dependent Details:</strong>
                        </p>

                        {{#if dependentDetails.length}}

                          {{#each dependentDetails}}

                            <p class="line">
                              Name: <strong>{{name}}</strong> |
                              Relation: {{relation}}
                            </p>

                          {{/each}}

                        {{else}}

                          <p class="line">No dependents</p>

                        {{/if}}

                        {{#if showCompanyContribution}}
                        <p class="line">
                          <strong>Premium:</strong> {{premium}}
                        </p>
                         {{/if}}

                        <p class="line">
                          <strong>Your Contribution (includes GST%):</strong> {{selfPaid}}
                        </p>

                        {{#if showCompanyContribution}}
                        <p class="line">
                          <strong>Company Contribution:</strong> {{companyPaid}}
                        </p>
                        {{/if}}

                        <p class="line">
                          <strong>Sum Insured:</strong> {{sumInsured}}
                        </p>

                      </td>
                    </tr>
                  </table>

                {{/each}}

              {{else}}

                <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="info-card-cell">
                      <p class="line">No policy details available.</p>
                    </td>
                  </tr>
                </table>

              {{/if}}

            </td>
          </tr>

          <tr>
            <td class="section">

              <h3 class="section-title">
                Enrolment Status
              </h3>

              <table class="info-card" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="info-card-cell">

                    <p class="line">
                      <strong>Status:</strong> Successfully Completed
                    </p>

                    <p class="line">
                      <strong>Enrolment Date:</strong> {{submissionDate}}
                    </p>

                    <p class="line">
                      <strong>Submission Count:</strong> #{{submissionCount}}
                    </p>

                    <p class="line">
                      <strong>Reference Number:</strong> {{referenceNumber}}
                    </p>

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

          <tr>
            <td class="closing-row">

              <p class="closing-text">
                We recommend keeping this email for your records.
                <br /><br />

                Thank you again for completing your enrolment on time.
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
</html>
$template$::TEXT AS body
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
WHERE NOT EXISTS (
    SELECT 1 FROM updated
);

COMMIT;