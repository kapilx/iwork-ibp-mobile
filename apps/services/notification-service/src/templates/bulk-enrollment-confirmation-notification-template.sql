BEGIN;

INSERT INTO notification_event_type (name, description)
VALUES (
    'Bulk_Enrollment_Confirmation_Email',
    'Notifies the employee via email when enrollment is confirmed as part of a bulk (company-wide) confirmation send'
)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

WITH resolved AS (
    SELECT
        (SELECT id
         FROM notification_event_type
         WHERE name = 'Bulk_Enrollment_Confirmation_Email'
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
        'Welcome to Insurance Benefits Portal'::TEXT AS subject,

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

    .info-title { font-size:18px; font-weight:600; margin:0; color:#1f1f1f; }
    .info-text { font-size:14px; color:#4d5b6a; margin:0 0 10px; line-height:1.6; }
    .info-list, .info-ol { padding-left:20px; margin:0; font-size:14px; color:#334150; line-height:1.8; }

    .cta-row { padding: 10px 24px 28px; }
    .cta-btn {
      background-color: #0f6fc2;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 24px;
      font-size: 15px;
      display: inline-block;
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
                      Thank you for completing your enrolment.
                      We are pleased to confirm that your insurance enrolment has been successfully submitted.
                    </p>
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
              <table class="info-card" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="info-card-cell">
                    <h3 class="info-title">Employee Insurance Portal</h3>
                    <div style="width:200px;height:2px;line-height:2px;font-size:0;margin:10px 0 16px 0;"> </div>
                    <p class="info-text">
                      The Employee Insurance Portal is your central place to manage your insurance benefits.
                    </p>
                    <ul class="info-list">
                      <li>View your policy and coverage details</li>
                      <li>Check enrolled member information</li>
                      <li>Access documents and ID cards</li>
                      <li>Track claims and support</li>
                      <li>Intimate Claims</li>
                      <li>Check Network Hospitals</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="section">
              <table class="info-card" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="info-card-cell">
                    <h3 class="info-title">How to Access the Portal</h3>
                    <div style="width:200px;height:2px;line-height:2px;font-size:0;margin:10px 0 16px 0;"> </div>
                    <ol class="info-ol">
                      <li>Click the portal link below.</li>
                      <li>Click the Login button.</li>
                      <li>On the login screen, choose Email or Phone, based on the enabled option available to you.</li>
                      <li>Click on Create Password or Forgot Password.</li>
                      <li>If you choose Email, enter your registered email address (as provided by your organisation HR), and a password reset link will be sent to your email.</li>
                      <li>If you choose Phone, enter your registered mobile number. An OTP will be sent to your phone, and after successful verification, you will be redirected to the password reset screen.</li>
                      <li>Set your password and log in anytime.</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="cta-row">
              <a href="{{portalLink}}" target="_blank" class="cta-btn">Access the Portal</a>
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
                      For any changes in the enrolment, please email
                      <strong>hr@isbsindia.in</strong> on or before <strong>30 Jul 2026</strong>.
                      You will receive a response after the details and policy have been validated.
                      Please ensure that all information is verified before sharing the final update.
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
