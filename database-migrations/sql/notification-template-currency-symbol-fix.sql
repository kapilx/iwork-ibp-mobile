-- ============================================================
-- Remove hardcoded rupee symbols ("₹" literal and "&#8377;" HTML
-- entity) from the two ibp notification templates that had them,
-- now that the backend formats these amounts itself with the
-- recipient's actual company/country currency symbol + grouping.
-- See apps/services/service-lib/src/lib/utils/currency-format.util.ts
-- and its usage in onboarding.service.ts (ibp-service) and the
-- formatCurrency/formatNumber Handlebars helpers (notification-service).
--
-- Scope: only the ibp-triggered templates were checked/fixed here
-- (Claim Intimation confirmation, Life Event Confirmation) — these
-- were the only two (out of the full set of notification templates)
-- found with a hardcoded rupee symbol.
-- ============================================================

-- ── Template id=53 — Claim Intimation confirmation (event_type_id=36) ──
-- Bare {{estimatedClaimAmount}} placeholder — backend now sends an
-- already-formatted string (e.g. "Rs 1,50,000"), so the hardcoded "₹"
-- prefix must be removed to avoid a doubled-up symbol.
UPDATE notification_channel_event_template_mapping
SET body = REPLACE(
  body,
  '<strong>Estimated Claim Amount:</strong> ₹{{estimatedClaimAmount}}',
  '<strong>Estimated Claim Amount:</strong> {{estimatedClaimAmount}}'
)
WHERE id = 53
  AND body LIKE '%₹{{estimatedClaimAmount}}%';

-- ── Template id=54 — Life Event Confirmation (event_type_id=37) ──
-- These 9 fields were rendered as "&#8377;{{formatNumber field}}" — a
-- hardcoded HTML entity for ₹ followed by the (now country-aware, but
-- symbol-less) formatNumber helper. Switch to the upgraded formatCurrency
-- helper, which now prepends the correct country symbol itself.
UPDATE notification_channel_event_template_mapping
SET body = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  body,
  '&#8377;{{formatNumber sumInsured}}', '{{formatCurrency sumInsured}}'),
  '&#8377;{{formatNumber premium}}', '{{formatCurrency premium}}'),
  '&#8377;{{formatNumber companyPaid}}', '{{formatCurrency companyPaid}}'),
  '&#8377;{{formatNumber selfPaid}}', '{{formatCurrency selfPaid}}'),
  '&#8377;{{formatNumber selfPaidBase}}', '{{formatCurrency selfPaidBase}}'),
  '&#8377;{{formatNumber gstAmount}}', '{{formatCurrency gstAmount}}'),
  '&#8377;{{formatNumber totalPremium}}', '{{formatCurrency totalPremium}}'),
  '&#8377;{{formatNumber totalCompanyPaid}}', '{{formatCurrency totalCompanyPaid}}'),
  '&#8377;{{formatNumber totalSelfPaid}}', '{{formatCurrency totalSelfPaid}}'
)
WHERE id = 54
  AND body LIKE '%&#8377;{{formatNumber%';

-- Verify: both should return 0 rows after running the UPDATEs above.
SELECT id, subject FROM notification_channel_event_template_mapping
WHERE id = 53 AND body LIKE '%₹{{estimatedClaimAmount}}%';

SELECT id, subject FROM notification_channel_event_template_mapping
WHERE id = 54 AND body LIKE '%&#8377;{{formatNumber%';
