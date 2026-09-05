const {
  VITE_PORT_IWORK,
  VITE_ORG_API_URL,
  VITE_AUTH_API_URL,
  VITE_OPPORTUNITY_API_URL,
  VITE_KNOWLEDGE_API_URL,
  VITE_AI_API_URL,
  VITE_NOTIFICATION_API_URL,
  VITE_POLICY_API_URL,
  VITE_SCHEDULER_API_URL,
  VITE_DOCUMENT_SERVICE_API_URL,
  VITE_FF_IWORK_POLICY_LISTING_EXPERIMENTAL,
  VITE_FF_IWORK_POLICY_CONFIGURATOR_EXPERIMENTAL,
  VITE_FF_IWORK_POLICY_DASHBOARD_EXPERIMENTAL,
  VITE_FF_IWORK_NL2SQL_CHAT_BOT_EXPERIMENTAL,
  VITE_FF_IWORK_NL2SQL_CHAT_BOT_IS_ENABLE_USER_INPUT,
  VITE_VERSION,
  VITE_IBP_API_URL,
  VITE_EXTERNAL_INTEGRATION_API_URL,
  VITE_GENERIC_REPORT_PAGINATION,
  VITE_N2SQL_URL,
  VITE_FF_IWORK_PORTAL_CONFIGURATION_EXPERIMENTAL,
  VITE_FF_IWORK_SERVICE_EMAIL_CONFIGURATION,
  VITE_CONFIG_API_URL,
  VITE_FF_MULTI_AUTH,
  VITE_FF_COMPANY_LOGO,
  VITE_FF_PASSWORD_RULES,
  VITE_FF_IWORK_HIDE_MASTERS,
  VITE_NL2SQL_PREDEFINED_QUERIES,
  VITE_NL2SQL_PREDEFINED_QUERIES_DISPLAY_COUNT,
  VITE_FF_IWORK_NUDGE_CARD,
  VITE_FINANCIAL_START_YEAR,
  VITE_FF_COPY_PASTE_ALLOWED_ORGS,
  VITE_IWORK_SESSION_TIMEOUT_MINUTES,
  VITE_SWAGGER_GATEWAY_URL,
  VITE_STRAPI_API_URL,
  VITE_STRAPI_API_TOKEN,
  VITE_CAPTCHA_PROVIDER,
  VITE_CAPTCHA_SITE_KEY,
  VITE_ENABLE_CAPTCHA,
  VITE_FF_SECURITY_ALLOWED_ORGS,
  VITE_ENABLE_FILE_PASSWORD_PROTECTION,
  VITE_FF_IWORK_SINGLE_SESSION,
  VITE_FF_IWORK_MAPPING_CONFIGURATION,
  VITE_FROM_EMAIL,
  VITE_FF_IWORK_PREMIUM_CALCULATOR,
  VITE_FF_IWORK_MERGE_CD_ACCOUNTS,
  VITE_BULK_DOWNLOAD_SELECTION_LIMIT,
  VITE_FF_IWORK_DOCUMENT_DOWNLOAD,
  VITE_FF_IWORK_LOGIN_AUTOFILL,
  VITE_FF_LIFE_EVENT_DEPENDENT_MANAGEMENT,
  VITE_FF_CLAIM_INTIMATION_MANAGEMENT,
  VITE_FF_SHOW_SYNCED_HOSPITALS,
  VITE_FF_IWORK_POLICY_LOCATIONS_EXPERIMENTAL,
  VITE_FF_IWORK_ENROLMENT_PREMIUM_BASED,
  VITE_IBP_APP_URL,
  VITE_FF_IBP_CONSENT_MANAGEMENT,
  VITE_FF_IBP_PARENTAL_LOCK_IN,
  VITE_FF_HR_PORTAL_ENROLMENT_STATUS,
  VITE_EXTERNAL_API_CONFIGS,
  VITE_FF_IBP_SMART_ASSIST,
  VITE_REPORT_EXPORT_POLL_INTERVAL_MS,
  VITE_FF_IWORK_WELLNESS_CONFIGURATION,
  VITE_FF_IWORK_OFFERS_BENEFITS,
  VITE_FF_IWORK_MS_OAUTH_LOGIN,
  VITE_FF_IWORK_MEMBER_UPLOAD,
} = import.meta.env;
export const environment = {
  production: false,
  port: VITE_PORT_IWORK || "5001", // Provide default value
  swaggerGatewayUrl: VITE_SWAGGER_GATEWAY_URL || "https://api.dev.indiainsure.com/iirm",
  n2SqlUrl:
    VITE_N2SQL_URL || "https://api.dev.indiainsure.com/iirm/ai-utility-service",
  orgUrl:
    VITE_ORG_API_URL || "https://gatewayservice.divami.com/iirm/org-service",
  authUrl:
    VITE_AUTH_API_URL || "https://gatewayservice.divami.com/iirm/auth-service",
  opportunityUrl:
    VITE_OPPORTUNITY_API_URL ||
    "https://gatewayservice.divami.com/iirm/opportunity-service",
  knowledgeUrl:
    VITE_KNOWLEDGE_API_URL ||
    "https://gatewayservice.divami.com/iirm/knowledgeservice.divami.com",
  aiServiceUrl: VITE_AI_API_URL || "http://localhost:3000/iirm/ai-service",
  notificationUrl:
    VITE_NOTIFICATION_API_URL ||
    "https://gatewayservice.divami.com/iirm/notification-service",
  policyUrl:
    VITE_POLICY_API_URL ||
    "https://gatewayservice.divami.com/iirm/policy-service",
  schedulerUrl:
    VITE_SCHEDULER_API_URL ||
    "https://gatewayservice.divami.com/iirm/scheduler-service",

  documentServiceUrl:
    VITE_DOCUMENT_SERVICE_API_URL ||
    "https://gatewayservice.divami.com/iirm/document-service",

  ibpUrl:
    VITE_IBP_API_URL || "https://gatewayservice.divami.com/iirm/ibp-service",
  externalIntegrationUrl:
    VITE_EXTERNAL_INTEGRATION_API_URL ||
    "https://gatewayservice.divami.com/iirm/external-integration-service",
  ibpAppUrl:
    VITE_IBP_APP_URL || "https://iwh.dev.indiainsure.com",

  configUrl:
    VITE_CONFIG_API_URL ||
    "https://gatewayservice.divami.com/iirm/config-service",
  strapiUrl: VITE_STRAPI_API_URL || "http://localhost:4321",
  strapiApiToken: VITE_STRAPI_API_TOKEN || "",

  captchaProvider: VITE_CAPTCHA_PROVIDER || "cloudflare-turnstile",
  captchaSiteKey: VITE_CAPTCHA_SITE_KEY,
  featureFlag: {
    FF_IWORK_POLICY_LISTING:
      VITE_FF_IWORK_POLICY_LISTING_EXPERIMENTAL === "true",
    FF_IWORK_POLICY_CONFIGURATOR:
      VITE_FF_IWORK_POLICY_CONFIGURATOR_EXPERIMENTAL === "true",
    FF_IWORK_POLICY_DASHBOARD:
      VITE_FF_IWORK_POLICY_DASHBOARD_EXPERIMENTAL === "true",
    FF_IWORK_NL2SQL_CHAT_BOT:
      VITE_FF_IWORK_NL2SQL_CHAT_BOT_EXPERIMENTAL === "true",
    FF_IWORK_PORTAL_CONFIGURATION:
      VITE_FF_IWORK_PORTAL_CONFIGURATION_EXPERIMENTAL === "true",
    FF_IWORK_SERVICE_EMAIL_CONFIGURATION: 
      VITE_FF_IWORK_SERVICE_EMAIL_CONFIGURATION === "true",
    FF_IWORK_SINGLE_SESSION: VITE_FF_IWORK_SINGLE_SESSION === "true",
    // Multi-tenant feature flags - default to false if not set
    FF_MULTI_AUTH: !!(VITE_FF_MULTI_AUTH === "true"),
    FF_COMPANY_LOGO: !!(VITE_FF_COMPANY_LOGO === "true"),
    FF_PASSWORD_RULES: !!(VITE_FF_PASSWORD_RULES === "true"),
    FF_IWORK_HIDE_MASTER: VITE_FF_IWORK_HIDE_MASTERS === "true",
    FF_IWORK_NUDGE_CARD: VITE_FF_IWORK_NUDGE_CARD === "true",
    FF_MAPPING_CONFIGURATION: VITE_FF_IWORK_MAPPING_CONFIGURATION === "true",
    FF_MERGE_CD_ACCOUNTS: VITE_FF_IWORK_MERGE_CD_ACCOUNTS === "true",
    FF_PREMIUM_CALCULATOR: VITE_FF_IWORK_PREMIUM_CALCULATOR === "true",
    FF_IWORK_DOCUMENT_DOWNLOAD: VITE_FF_IWORK_DOCUMENT_DOWNLOAD === "true",
    FF_IWORK_LOGIN_AUTOFILL: VITE_FF_IWORK_LOGIN_AUTOFILL === "true",
    FF_LIFE_EVENT_DEPENDENT_MANAGEMENT: VITE_FF_LIFE_EVENT_DEPENDENT_MANAGEMENT === "true",
    FF_CLAIM_INTIMATION_MANAGEMENT: VITE_FF_CLAIM_INTIMATION_MANAGEMENT === "true",
    FF_SHOW_SYNCED_HOSPITALS: VITE_FF_SHOW_SYNCED_HOSPITALS !== "false",
    FF_IWORK_POLICY_LOCATIONS: VITE_FF_IWORK_POLICY_LOCATIONS_EXPERIMENTAL === "true",
    FF_IWORK_ENROLMENT_PREMIUM_BASED: VITE_FF_IWORK_ENROLMENT_PREMIUM_BASED === "true",
    FF_IBP_CONSENT_MANAGEMENT: VITE_FF_IBP_CONSENT_MANAGEMENT === "true",
    FF_IBP_PARENTAL_LOCK_IN: VITE_FF_IBP_PARENTAL_LOCK_IN === "true",
    FF_HR_PORTAL_ENROLMENT_STATUS: VITE_FF_HR_PORTAL_ENROLMENT_STATUS === "true",
    FF_EXTERNAL_API_CONFIGS: VITE_EXTERNAL_API_CONFIGS === "true",
    // Portal Configuration tab gates
    FF_IWORK_WELLNESS_CONFIGURATION:
      VITE_FF_IWORK_WELLNESS_CONFIGURATION === "true",
    FF_IWORK_OFFERS_BENEFITS: VITE_FF_IWORK_OFFERS_BENEFITS === "true",
    FF_IWORK_MS_OAUTH_LOGIN: VITE_FF_IWORK_MS_OAUTH_LOGIN === "true",
    FF_IWORK_MEMBER_UPLOAD: VITE_FF_IWORK_MEMBER_UPLOAD === "true",
  },

  nl2sqlFlag: {
    isEnableUserInput:
      VITE_FF_IWORK_NL2SQL_CHAT_BOT_IS_ENABLE_USER_INPUT === "true",
    predefinedQueriesDisplayCount: VITE_NL2SQL_PREDEFINED_QUERIES_DISPLAY_COUNT
      ? parseInt(VITE_NL2SQL_PREDEFINED_QUERIES_DISPLAY_COUNT, 10)
      : 10,
  },

  nl2sqlPredefinedQuestions: VITE_NL2SQL_PREDEFINED_QUERIES
    ? JSON.parse(VITE_NL2SQL_PREDEFINED_QUERIES)
    : [
        [
          "List all insurers by their name and display name",
          "Show the number of policies grouped by policy type",
          "What is the demographic distribution of employees by their age?",
          "Give me the list of companies available",
          "Show the total premium collected for each policy type",
          "What is the breakdown of company types we deal with?",
          "Show the top five policies by brokerage amount, including their client and insurer names",
          "List policies where the sum insured is more than 1000000",
          "Find policies issued after 2025-01-01",
          "Show policies with missing insurer policy number",
          "List the top 10 clients by total premium paid, including their policy count and average sum insured.",
          "Show policies with the lowest sum insured for each company.",
          "What is the sum of gross premium amounts for all policies issued in the last year?",
        ],
      ],

  version: VITE_VERSION || "1.0.3",
  genericReportPagination: VITE_GENERIC_REPORT_PAGINATION,
  financialStartYear: VITE_FINANCIAL_START_YEAR || 2024,
  fromEmail: VITE_FROM_EMAIL ,
  iworkSessionTimeoutMinutes: VITE_IWORK_SESSION_TIMEOUT_MINUTES
    ? Number(VITE_IWORK_SESSION_TIMEOUT_MINUTES)
    : null,
  copyPasteAllowedOrgs: VITE_FF_COPY_PASTE_ALLOWED_ORGS 
    ? JSON.parse(VITE_FF_COPY_PASTE_ALLOWED_ORGS) 
    : {},
  securityAllowedOrgs: VITE_FF_SECURITY_ALLOWED_ORGS
    ? JSON.parse(VITE_FF_SECURITY_ALLOWED_ORGS)
    : {},
  enableCaptcha: VITE_ENABLE_CAPTCHA === "true",
  enableFilePasswordProtection:
    VITE_ENABLE_FILE_PASSWORD_PROTECTION === "true",
  bulkDownloadSelectionLimit: VITE_BULK_DOWNLOAD_SELECTION_LIMIT
    ? Number(VITE_BULK_DOWNLOAD_SELECTION_LIMIT)
    : 20,
  reportExportPollIntervalMs: VITE_REPORT_EXPORT_POLL_INTERVAL_MS
    ? Number(VITE_REPORT_EXPORT_POLL_INTERVAL_MS)
    : 15000,
};

export const isCopyPasteAllowedForOrg = (): boolean => {
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const orgKey = user?.organisationKey;
    return environment.copyPasteAllowedOrgs[orgKey] === true;
  } catch {
    return false;
  }
};

export const isSecurityRestrictionEnabledForOrg = (): boolean => {
  try {
    const storedUser = sessionStorage.getItem('user');
    // Safety check: On refresh in deployed environment, storage might return 'null' or 'undefined' briefly
    if (!storedUser || storedUser === 'null' || storedUser === 'undefined' || storedUser === '{}') {
      return true; // Restriction is ENABLED (true) by default for security
    }
    const user = JSON.parse(storedUser);
    const orgKey = user?.organisationKey;
    
    if (!orgKey) return true; // Restriction is ENABLED (true) by default

    // If the organization is explicitly allowed (true) in the config, then restriction is DISABLED (false).
    // We use explicit comparison with true to avoid issues with truthy/falsy values or missing keys.
    const isAllowed = environment.securityAllowedOrgs && environment.securityAllowedOrgs[orgKey] === true;
    console.log(`[Security] Checking Org: ${orgKey}, Allowed: ${isAllowed}, Restricted: ${!isAllowed}`);
    return !isAllowed;
  } catch (error) {
    console.error("Security Restriction Check Failed:", error);
    return true; // Fail-safe to RESTRICTED (true) on any parsing error
  }
};
