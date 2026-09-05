-- ============================================================
-- Replace the hardcoded CC recipient on the Support_Ticket_Raised_Email
-- template with the ###companyCrmId### placeholder, which is resolved at
-- send time in notification.service.ts (sendNotification -> resolveCompanyCrmLeadEmail)
-- to the raising employee's company's CRM lead (company.lead_crm -> users.id).
-- ============================================================

UPDATE notification_channel_event_template_mapping m
SET additional_user_emails = '{"0": "###companyCrmId###"}'::jsonb
FROM notification_event_type e,
     notification_channel_type c
WHERE m.event_type_id = e.id
  AND m.channel_type_id = c.id
  AND e.name = 'Support_Ticket_Raised_Email'
  AND c.channel_type_key = 'NOTIFICATION_CHANNEL_EMAIL';
