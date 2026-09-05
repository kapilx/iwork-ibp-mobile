-- Initial onboarding mail — Support Contacts section.
--
-- Event type: Initial_Onboarding_Email
-- This template already shipped its own Support Contacts card, built from the
-- template's own CSS classes and with no Primary/Secondary labels. This file
-- swaps that card for the same inline-styled one the life event confirmation
-- mail renders, in place, so it stays above the portal CTA.
-- Safe to re-run: a body that already carries the new card is left untouched.

BEGIN;

UPDATE notification_channel_event_template_mapping AS m
-- 2. Drop the closing help line, which the card above now covers. This sits
--    outside the guard below: a body patched before this line existed still
--    carries it, and removing an absent line is a no-op.
SET body = regexp_replace(
      CASE WHEN m.body LIKE '%Primary Contact%' THEN m.body ELSE
      -- 1. The pattern ends on the template's only {{/if}}, so the greedy `.*` cannot
      --    run past the block into the CTA row that follows. (Postgres makes the whole
      --    RE greedy when the first quantifier is greedy, so `.*?` would not be safe.)
      regexp_replace(m.body,
        '<tr>\s*<td class="section">\s*<table class="info-card"[^>]*>\s*<tr>\s*<td class="info-card-cell">\s*<h3 class="info-title">Support Contacts</h3>.*\{\{/if\}\}\s*</td>\s*</tr>\s*</table>\s*</td>\s*</tr>',
        $block$<tr>
  <td class="section">
{{#if primaryEscalationEmail}}
<h3 style="margin:0 0 10px;font-size:16px;line-height:1.4;font-weight:bold;color:#0f6fc2;font-family:Arial,Helvetica,sans-serif;">Support Contacts</h3>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;background:#f8f8f8;border:1px solid #d9dde3;border-left:5px solid #1a73e8;border-radius:10px;margin:0 0 14px;">
  <tr><td style="padding:18px 22px;font-size:14px;line-height:1.65;color:#3d4b59;font-family:Arial,Helvetica,sans-serif;">
    For any queries related to enrolment, coverage, or claims, please contact your HR team or TPA coordinator.
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
{{/if}}
  </td>
</tr>$block$)
      END,
      '\s*<p class="closing-text">If you need help, contact your HR or the IIRM support team\.</p>', ''),
    updated_by = 1, updated_at = CURRENT_TIMESTAMP
FROM notification_event_type AS e
WHERE m.event_type_id = e.id AND e.name = 'Initial_Onboarding_Email';

-- Map the parameters onto this event type. All six are optional: the section
-- hides itself when they are absent.
INSERT INTO notification_event_parameter_mapping (
  event_type_id,
  parameter_definition_id,
  required
)
SELECT event_type.id, parameter.id, false
FROM notification_event_type AS event_type
CROSS JOIN notification_parameter AS parameter
WHERE event_type.name = 'Initial_Onboarding_Email'
  AND parameter.key IN (
    'primaryEscalationName',
    'primaryEscalationEmail',
    'primaryEscalationPhone',
    'secondaryEscalationName',
    'secondaryEscalationEmail',
    'secondaryEscalationPhone'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM notification_event_parameter_mapping AS existing
    WHERE existing.event_type_id = event_type.id
      AND existing.parameter_definition_id = parameter.id
  );

COMMIT;
