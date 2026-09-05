-- Added dependents mail — Support Contacts section.
--
-- Event type: Added_Dependents_Email
-- Swaps the old plain "Support" section for the same card the life event
-- confirmation mail renders, in place, so the card stays above the portal CTA.
-- Safe to re-run: a body that already carries the card is left untouched.

BEGIN;

UPDATE notification_channel_event_template_mapping AS m
SET body = CASE WHEN m.body LIKE '%Primary Contact%' THEN m.body ELSE
      -- Replace the whole old Support <tr> with the new card. The pattern ends on
      -- the support sentence, which occurs exactly once, so the greedy `.*` cannot
      -- run past the block into the {{#if portalLink}} CTA row that follows it.
      -- (Postgres makes the whole RE greedy when the first quantifier is greedy,
      -- so a bare `.*?` here would not be safe.)
      regexp_replace(m.body,
        '<tr>\s*<td class="section">\s*<h3 class="section-title">\s*Support\s*</h3>.*or claims, please contact your HR team or TPA coordinator\.\s*</p>\s*</td>\s*</tr>\s*</table>\s*</td>\s*</tr>',
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
    updated_by = 1, updated_at = CURRENT_TIMESTAMP
FROM notification_event_type AS e
WHERE m.event_type_id = e.id AND e.name = 'Added_Dependents_Email';

COMMIT;
