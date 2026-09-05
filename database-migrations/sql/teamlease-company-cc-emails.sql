-- ============================================================
-- Seed domain-level CC emails (company_portal_configuration.cc_email_addresses)
-- for all TeamLease portal configs: every eligible notification email sent
-- for these companies will now also CC Teamleasebackup@indiainsure.com, in
-- addition to whatever additional_user_emails is already configured on the
-- template (that stays common across all companies and is unioned with this
-- at send time — see NotificationService.resolveCompanyCcEmails /
-- sendNotification in notification-service).
--
-- Column lives on company_portal_configuration (keyed by sub_domain), not on
-- company directly, since domain is the natural grouping already used to
-- resolve a company from its portal subdomain (e.g. "teamleasegodigit")
-- elsewhere in the codebase (resolveCompanyIdByDomain).
--
-- NOTE: review the matched rows with the SELECT below before running the
-- UPDATE — confirm this catches exactly the intended TeamLease portal
-- configs and no unrelated one whose sub_domain happens to contain
-- "teamlease".
-- ============================================================

-- Preview which portal configs will be affected:
-- SELECT cpc.id, cpc.sub_domain, cpc.company_id, c.company_name, cpc.cc_email_addresses
-- FROM company_portal_configuration cpc
-- JOIN company c ON c.id = cpc.company_id
-- WHERE cpc.sub_domain ILIKE '%teamlease%'
--   AND cpc.deleted_at IS NULL;

ALTER TABLE company_portal_configuration
ADD COLUMN cc_email_addresses TEXT[] DEFAULT ARRAY[]::TEXT[];


UPDATE company_portal_configuration
SET cc_email_addresses = ARRAY['teamleasebackup@indiainsure.com']
WHERE sub_domain ILIKE '%teamlease%'
  AND company_id IS NOT NULL
  AND deleted_at IS NULL;
