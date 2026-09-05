BEGIN;

CREATE TABLE zz_enrollment_confirmation_20260804_2349 AS
SELECT m.id, e.name AS event_type_name, m.subject, m.body, CURRENT_TIMESTAMP AS backed_up_at
FROM notification_channel_event_template_mapping m
JOIN notification_event_type e ON e.id = m.event_type_id
WHERE e.name = 'Enrollment_Confirmation_Email';

CREATE TABLE zz_welcome_bulk_enrollment_20260804_2349 AS
SELECT m.id, e.name AS event_type_name, m.subject, m.body, CURRENT_TIMESTAMP AS backed_up_at
FROM notification_channel_event_template_mapping m
JOIN notification_event_type e ON e.id = m.event_type_id
WHERE e.name = 'Bulk_Enrollment_Confirmation_Email';

CREATE TABLE zz_life_event_confirmation_20260804_2349 AS
SELECT m.id, e.name AS event_type_name, m.subject, m.body, CURRENT_TIMESTAMP AS backed_up_at
FROM notification_channel_event_template_mapping m
JOIN notification_event_type e ON e.id = m.event_type_id
WHERE e.name = 'Life_Event_Confirmation_Email';

CREATE TABLE zz_added_dependents_20260804_2349 AS
SELECT m.id, e.name AS event_type_name, m.subject, m.body, CURRENT_TIMESTAMP AS backed_up_at
FROM notification_channel_event_template_mapping m
JOIN notification_event_type e ON e.id = m.event_type_id
WHERE e.name = 'Added_Dependents_Email';

CREATE TABLE zz_support_ticket_raised_20260804_2349 AS
SELECT m.id, e.name AS event_type_name, m.subject, m.body, CURRENT_TIMESTAMP AS backed_up_at
FROM notification_channel_event_template_mapping m
JOIN notification_event_type e ON e.id = m.event_type_id
WHERE e.name = 'Support_Ticket_Raised_Email';

CREATE TABLE zz_otp_login_20260804_2349 AS
SELECT m.id, e.name AS event_type_name, m.subject, m.body, CURRENT_TIMESTAMP AS backed_up_at
FROM notification_channel_event_template_mapping m
JOIN notification_event_type e ON e.id = m.event_type_id
WHERE e.name = 'Email_OTP_Login';

COMMIT;
