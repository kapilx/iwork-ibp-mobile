-- ============================================================
-- Replace hardcoded "GST" display text with the dynamic {{taxLabel}}
-- placeholder in the two ibp email templates that spell it out
-- literally (e.g. "VAT" for Sri Lanka instead of always "GST").
--
-- The backend now resolves and passes taxLabel into these
-- notifications' parameters — see
-- apps/services/service-lib/src/lib/utils/currency-format.util.ts
-- (getTaxLabel) and its usage in onboarding.service.ts's
-- sendEnrollmentConfirmationNotification and
-- sendLifeEventConfirmationNotification. localization_country.tax_label
-- was already added and backfilled ('GST' for India, 'VAT' for Sri
-- Lanka) by an earlier migration
-- (localization-country-tax-label.sql) — countries left NULL there
-- fall back to "GST" via getTaxLabel's default, matching current
-- behaviour.
--
-- Scope: only the ibp-triggered templates were checked (Enrolment
-- Confirmed, Life Event Confirmation) — these were the only two
-- (out of the full set of notification templates) found with
-- hardcoded "GST" display text.
-- ============================================================

-- ── Template id=52 — Enrolment Confirmed (event_type_id=27) ──
UPDATE notification_channel_event_template_mapping
SET body = REPLACE(
  body,
  'Your Contribution (includes GST%):',
  'Your Contribution (includes {{taxLabel}}%):'
)
WHERE id = 52
  AND body LIKE '%Your Contribution (includes GST%):%';

-- ── Template id=54 — Life Event Confirmation (event_type_id=37) ──
-- Two literal "GST" occurrences: the per-policy "Base X + GST Y" note,
-- and the aggregate "incl. 18% GST" footnote.
UPDATE notification_channel_event_template_mapping
SET body = REPLACE(
  REPLACE(body, ' + GST ', ' + {{taxLabel}} '),
  '18% GST',
  '18% {{taxLabel}}'
)
WHERE id = 54
  AND (body LIKE '% + GST %' OR body LIKE '%18% GST%');

-- Verify: all three should return 0 rows after running the UPDATEs above.
SELECT id, subject FROM notification_channel_event_template_mapping
WHERE id = 52 AND body LIKE '%includes GST%):%';

SELECT id, subject FROM notification_channel_event_template_mapping
WHERE id = 54 AND body LIKE '% + GST %';

SELECT id, subject FROM notification_channel_event_template_mapping
WHERE id = 54 AND body LIKE '%18% GST%';
