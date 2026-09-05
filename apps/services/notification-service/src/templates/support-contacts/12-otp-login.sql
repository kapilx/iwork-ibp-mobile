BEGIN;

UPDATE notification_channel_event_template_mapping AS m
SET body = replace(
      regexp_replace(
      replace(
      replace(
      CASE WHEN m.body LIKE '%Primary Contact%' THEN m.body ELSE regexp_replace(regexp_replace(regexp_replace(m.body, '\{\{#if primaryEscalationEmail\}\}.*?</td>\s*</tr>\s*</table>\s*\{\{/if\}\}', ''), '<td style="padding:0 24px 8px;">.*?<td class="footer"', '<td class="footer"'),
        '(<(?:p|div|td)[^>]*>\s*Warm regards)',
        $block${{#if primaryEscalationEmail}}
<h3 style="margin:0 0 10px;font-size:16px;line-height:1.4;font-weight:bold;color:#0f6fc2;font-family:Arial,Helvetica,sans-serif;">Support Contacts</h3>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;background:#f8f8f8;border:1px solid #d9dde3;border-left:5px solid #1a73e8;border-radius:10px;margin:0 0 14px;">
  <tr><td style="padding:18px 22px;font-size:14px;line-height:1.65;color:#3d4b59;font-family:Arial,Helvetica,sans-serif;">
    If you face any issues while logging in, please contact your HR team or TPA coordinator.
  </td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;background:#f8f8f8;border:1px solid #d9dde3;border-left:5px solid #1a73e8;border-radius:10px;margin:0 0 14px;">
  <tr><td style="padding:18px 22px;font-family:Arial,Helvetica,sans-serif;">
    <div style="font-size:12px;font-weight:bold;color:#0f6fc2;padding-bottom:5px;">Primary Contact</div>
    <div style="font-size:14px;line-height:1.65;color:#3d4b59;">
      <strong style="color:#1a202c;">{{primaryEscalationName}}</strong><br />
      Email: {{primaryEscalationEmail}}<br />Phone: {{primaryEscalationPhone}}
    </div>
    {{#if secondaryEscalationEmail}}
    <div style="border-top:1px solid #e3e8ef;margin:14px 0 0;padding-top:14px;">
      <div style="font-size:12px;font-weight:bold;color:#0f6fc2;padding-bottom:5px;">Secondary Contact</div>
      <div style="font-size:14px;line-height:1.65;color:#3d4b59;">
        <strong style="color:#1a202c;">{{secondaryEscalationName}}</strong><br />
        Email: {{secondaryEscalationEmail}}<br />Phone: {{secondaryEscalationPhone}}
      </div>
    </div>
    {{/if}}
  </td></tr>
</table>
{{/if}}$block$ || '\1') END,
      'font-size:11px;font-weight:bold;color:#0f6fc2;letter-spacing:0.6px;text-transform:uppercase;padding-bottom:5px;', 'font-size:12px;font-weight:bold;color:#0f6fc2;padding-bottom:5px;'),
      'For any queries related to enrolment, coverage, or claims, please contact your HR team or TPA coordinator.', 'If you face any issues while logging in, please contact your HR team or TPA coordinator.'),
      '<(p|div)[^>]*>[^<]*If you face any issues while logging in,[^<]*</(?:p|div)>', ''),
      'please reach out to your HR team or the support desk for assistance.', 'please contact your HR team or TPA coordinator.'),
    updated_by = 1, updated_at = CURRENT_TIMESTAMP
FROM notification_event_type AS e
WHERE m.event_type_id = e.id AND e.name = 'Email_OTP_Login';

COMMIT;
