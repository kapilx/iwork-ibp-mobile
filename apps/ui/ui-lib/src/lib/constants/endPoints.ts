import { environment } from "@ui/ui-lib/environment";
//Below are URL endpoints for API calls

type PolicyFeatureDocumentQueryParams = {
  search?: string;
  category?: string;
  documentType?: string;
  sortOrder?: "latest" | "oldest";
};

const ibpEndPoints = {
  enrollmentProcess:
    environment.ibpUrl + "/company-employee/policy/process-enrollment",
  // ibp service
  employeeDetails: `${environment.ibpUrl}/company-employee/company-employee-details`,
  updateEmployeeDetails: (employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/company-employee-details/${employeeId}`,
  employeePolicies: (employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/employees/${employeeId}/policies`,
  relationConstraints: (
    policyId: string | number,
    employeeId: string | number
  ) =>
    `${environment.ibpUrl}/company-employee/policy/${policyId}/employee/${employeeId}/relations-constraints-dependents`,
  portalConfigurationByCompany: (companyId: string | number) =>
    `${environment.ibpUrl}/company-employee/company/${companyId}/portal-configuration`,
  groupCompanies: (companyId: string | number) =>
    `${environment.ibpUrl}/company-employee/company/${companyId}/group-companies`,
  companyAdditionalDocuments: (companyId: string | number) =>
    `${environment.ibpUrl}/company-employee/company/${companyId}/additional-documents`,
  dependents: (policyId: string | number, employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/policy/${policyId}/employees/${employeeId}/dependents`,
  policyBucket: (employeeId: string | number, policyId: string | number) => {
    return `${environment.ibpUrl}/company-employee/company-employee-policy-components/${employeeId}/${policyId}`;
  },
  policyConfiguration: `${environment.ibpUrl}/company-employee/policy/enrollment`,

  policyConfigurationByDependents: `${environment.ibpUrl}/company-employee/company-employee-policy-components`,
  updatePassword: `${environment.ibpUrl}/company-employee/company-employee-password-update`,
  updateUserPassword: `${environment.ibpUrl}/company-employee/update-user-password`,
  eCards: (employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/employee/${employeeId}/e-card`,
  eCardSignedUrl: `${environment.ibpUrl}/company-employee/employee/e-card/signed-url`,
  eCardExternalUrl: `${environment.documentServiceUrl}/external-app-sso/magic-url`,
  policyTpaAppKey: (policyId: string | number, apiType: string, isDependent?: boolean) =>
    `${environment.ibpUrl}/company-employee/policy/${policyId}/tpa-app-key?apiType=${encodeURIComponent(apiType)}${isDependent ? "&isDependent=true" : ""}`,
  tpaClaimsSync: (policyNumber: string, policyStartDate: string, policyEndDate: string, employeeId?: number | string) =>
    `${environment.ibpUrl}/hr-module/tpa-claims/sync?policyNumber=${encodeURIComponent(policyNumber)}&policyStartDate=${encodeURIComponent(policyStartDate)}&policyEndDate=${encodeURIComponent(policyEndDate)}${employeeId ? `&employeeId=${employeeId}` : ""}`,
  tpaClaimIndividualStore: `${environment.ibpUrl}/hr-module/tpa-claims/individual`,
  tpaClaimIndividualGet: (claimNo: string) => `${environment.ibpUrl}/hr-module/tpa-claims/${encodeURIComponent(claimNo)}`,
  zohoStatus: (companyId: string | number) =>
    `${environment.ibpUrl}/hr-module/zoho/status?companyId=${companyId}`,
  zohoAuthUrl: (companyId: string | number, frontendOrigin: string) =>
    `${environment.ibpUrl}/hr-module/zoho/auth-url?companyId=${companyId}&frontendOrigin=${encodeURIComponent(frontendOrigin)}`,
  zohoSync: (companyId: string | number) =>
    `${environment.ibpUrl}/hr-module/zoho/sync?companyId=${companyId}`,
  zohoDisconnect: (companyId: string | number) =>
    `${environment.ibpUrl}/hr-module/zoho/disconnect?companyId=${companyId}`,
  zohoPortalUrl: (companyId: string | number) =>
    `${environment.ibpUrl}/hr-module/zoho/portal-url?companyId=${companyId}`,
  // Served by external-integration-service, not ibp-service — see
  // docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md.
  hclIntakeForCompany: (
    companyId: string | number,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    return `${environment.externalIntegrationUrl}/integrations/hcl/company/${companyId}/intake?${params.toString()}`;
  },
  hclIntakeMarkProcessing: `${environment.externalIntegrationUrl}/integrations/hcl/intake/mark-processing`,
  ibpAuth: environment.ibpUrl + "/company-employee/login",
  ibpPasswordReadiness: environment.ibpUrl + "/company-employee/login/password-readiness",
  ibpRefreshToken: environment.ibpUrl + "/company-employee/refresh-token",
  ibpCrmSession: environment.ibpUrl + "/company-employee/crm-session",
  ibpSendResetMailByEmail: (
    email: string,
    domain?: string,
    methodCode?: string
  ) =>
    environment.orgUrl +
    `/employee/ibp-password-reset-mail/${email}?source=ibp${
      domain ? `&domain=${domain}` : ""
    }${methodCode ? `&method=${encodeURIComponent(methodCode)}` : ""}`,
  ibpResetPassword: environment.orgUrl + "/employee/ibp-password-reset",
  employeeEnrollmentProcess:
    environment.ibpUrl + "/company-employee/policy/employee-upload/process",
  getHospitalNetworks: (_policyId?: string | number) =>
    `${environment.ibpUrl}/company-employee/policy/hospitals/search`,
  getHospitalNetworksGeospatial: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policy/hospitals/search/${policyId}`,
  hospitalNetworkUpload: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policy/${policyId}/hospitals/upload`,
  hospitalNetworkExport: (policyId: string | number) =>
    `${environment.ibpUrl}/company-employee/policies/${policyId}/hospitals/export`,
  hospitalNetworkLocations: (_policyId?: string | number) =>
    `${environment.ibpUrl}/company-employee/policy/locations`,
  hospitalNetworkCities: (_policyId?: string | number, _state?: string) =>
    `${environment.ibpUrl}/company-employee/policy/locations`,
  createPolicyHospital: (policyId: string | number) =>
    `${environment.ibpUrl}/company-employee/policy/${policyId}/hospitals`,
  getHospitalNetworkTemplate: `${environment.policyUrl}/portal-configuration/hospitals/template`,
  getActivityLogs: `${environment.ibpUrl}/company-employee/user-activity-log`,
  uploadClaims: `${environment.ibpUrl}/company-employee/intimate-claim`,
  claimIntimationConfirmation: `${environment.ibpUrl}/onboarding/claim-intimation-confirmation`,
  submitClaim: (claimId: string | number, employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/claims/${claimId}/submit?employeeId=${employeeId}`,
  claimFlowMode: (policyId: string | number) =>
    `${environment.ibpUrl}/company-employee/claims/flow-mode/${policyId}`,
  intimatedClaims: (employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/claims/intimated/${employeeId}`,
  claimExtraFields: (policyId: string | number, apiType: "INTIMATE_CLAIM" | "SUBMIT_CLAIM") =>
    `${environment.ibpUrl}/company-employee/claims/extra-fields/${policyId}?apiType=${apiType}`,
  supportTicketConfirmation: `${environment.ibpUrl}/onboarding/support-ticket-confirmation`,

  //faqs
  faqsList: `${environment.ibpUrl}/company-employee/faq`,

  //Download api
  ibpFileUpload: `${environment.ibpUrl}/company-employee/file-upload/upload`,
  ibpFileUploadDownloadById: (fileId: number) =>
    `${environment.ibpUrl}/company-employee/file-upload/${fileId}/download`,
  ibpFileUploadBulkDownload: `${environment.ibpUrl}/company-employee/file-upload/bulk-download`,

  ibpPublicFileUploadDownloadById: (fileId: number) =>
    `${environment.configUrl}/auth-config/file-upload/${fileId}/download`,
  // ibpFileUpload: environment.ibpUrl + `/company-employee/file-upload/upload`,

  //policy feature (my doc)
  policyFeatureDocumentsByEmployee: (employeeId: string | number, params?: PolicyFeatureDocumentQueryParams) => {
    const searchParams = new URLSearchParams({
      employeeId: String(employeeId),
    });

    if (params?.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }

    if (params?.category && params.category !== "all") {
      searchParams.set("category", params.category);
    }

    if (params?.documentType && params.documentType !== "all") {
      searchParams.set("documentType", params.documentType);
    }

    if (params?.sortOrder && params.sortOrder !== "latest") {
      searchParams.set("sortOrder", params.sortOrder);
    }

    return `${environment.ibpUrl}/company-employee/policy/feature-document?${searchParams.toString()}`;
  },
  policyFeatureDocument: (policyId: string | number) =>
    environment.ibpUrl +
    `/company-employee/policy/${policyId}/feature-document`,

  //claims corner
  employeeClaimsOverview: (employeeId: number) =>
    environment.ibpUrl +
    `/company-employee/employee/${employeeId}/policy/claims-overview`,
  employeeTpaPortalSso: (employeeId: number) =>
    `${environment.ibpUrl}/company-employee/employee/${employeeId}/tpa-portal-sso`,
  employeeTpaFeatures: (employeeId: number) =>
    `${environment.ibpUrl}/company-employee/employee/${employeeId}/tpa-features`,
  alyveWellnessUrl: `${environment.documentServiceUrl}/external-app-sso/magic-url`,
  employeePersonalDocuments: (employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/employee/${employeeId}/personal-documents`,

  //contact matrix
  employeeContactMatrix: (employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/employee/${employeeId}/contact-matrix`,

  //auth phone otp endpoints
  varifyPasswordResetOtp: `${environment.authUrl}/auth/phone-otp/verify-password-reset-otp`,
  sendPasswordResetOtp: `${environment.authUrl}/auth/phone-otp/send-password-reset-otp`,
  sendPhoneOtp: `${environment.authUrl}/auth/phone-otp/send-phone`,
  verifyPhoneOtp: `${environment.authUrl}/auth/phone-otp/verify-phone`,

  //enrollment progress tracking
  enrollmentProgress: (
    employeeId: string | number,
    enrollmentBatchKey?: string
  ) =>
    `${environment.ibpUrl}/company-employee/enrollment-progress/${employeeId}${
      enrollmentBatchKey ? `?enrollmentBatchKey=${enrollmentBatchKey}` : ""
    }`,
  updateEnrollmentProgress: (employeeId: string | number) =>
    `${environment.ibpUrl}/company-employee/enrollment-progress/${employeeId}`,
  initializeEnrollmentProgress: `${environment.ibpUrl}/company-employee/enrollment-progress/initialize`,
  extendEnrollmentPeriod: `${environment.ibpUrl}/company-employee/enrollment-periods/extend`,
  sendEmailOtp: `${environment.authUrl}/auth/email-otp/send`,
  verifyEmailOtp: `${environment.authUrl}/auth/email-otp/verify`,
  enrollmentConfirmation: `${environment.ibpUrl}/onboarding/enrollment-confirmation`,
  triggerBulkEnrollmentConfirmation: `${environment.ibpUrl}/onboarding/bulk-enrollment-confirmation`,
  triggerTestEmployeeEnrollmentConfirmation: `${environment.ibpUrl}/onboarding/enrollment-confirmation/test-employee`,
  previewBulkEnrollmentConfirmation: (
    companyId: string | number,
    subDomain?: string,
    page = 1,
    limit = 25,
  ) =>
    `${environment.ibpUrl}/onboarding/bulk-enrollment-confirmation/preview?companyId=${companyId}&page=${page}&limit=${limit}${
      subDomain ? `&subDomain=${encodeURIComponent(subDomain)}` : ""
    }`,
  confirmationMailJobStatus: (companyId: string | number, subDomain?: string) =>
    `${environment.ibpUrl}/onboarding/bulk-enrollment-confirmation/status?companyId=${companyId}${
      subDomain ? `&subDomain=${encodeURIComponent(subDomain)}` : ""
    }`,
  enrollmentReminder: `${environment.ibpUrl}/onboarding/enrollment-reminder`,
  hrPendingEnrollmentEmployees: (policyId: number) => environment.ibpUrl + `/hr-module/policy/${policyId}/pending-enrollment-employees`,
  lifeEventConfirmation: `${environment.ibpUrl}/onboarding/life-event-confirmation`,
  addedDependentsConfirmation: `${environment.ibpUrl}/onboarding/added-dependents-confirmation`,
  triggerCompanyInitialOnboardingNotifications: `${environment.configUrl}/config-company/onboarding-mail-trigger`,
  triggerTestEmployeeOnboardingMail: `${environment.ibpUrl}/onboarding/initial-notification/test-employee`,
  previewCompanyInitialOnboardingNotifications: (
    companyId: string | number,
    subDomain?: string,
    page = 1,
    limit = 25,
  ) =>
    `${environment.ibpUrl}/onboarding/initial-notification/company/preview?companyId=${companyId}&page=${page}&limit=${limit}${
      subDomain ? `&subDomain=${encodeURIComponent(subDomain)}` : ""
    }`,
  onboardingMailJobStatus: (companyId: string | number, subDomain?: string) =>
    `${environment.ibpUrl}/onboarding/initial-notification/company/status?companyId=${companyId}${
      subDomain ? `&subDomain=${encodeURIComponent(subDomain)}` : ""
    }`,
  createRaiseTicket: (employeeId: string | number) => `${environment.ibpUrl}/company-employee/${employeeId}/tickets`,
  createRaiseTicketPublic: `${environment.ibpUrl}/company-employee/tickets`,
  getRaiseTickets: (employeeId: string | number) => `${environment.ibpUrl}/company-employee/${employeeId}/tickets?page=1&limit=50`,
  getCompanyTicketsByDomain: (domain: string) => `${environment.ibpUrl}/company-employee/tickets/public?domain=${encodeURIComponent(domain)}&page=1&limit=50`,
  updateTicketStatus: (ticketId: string | number) => `${environment.ibpUrl}/company-employee/tickets/${ticketId}/status`,
  supportTicketStatusChanged: `${environment.ibpUrl}/onboarding/support-ticket-status-changed`,
  acceptTerms: `${environment.ibpUrl}/onboarding/terms-conditions/accept`,
  withdrawTerms: `${environment.ibpUrl}/onboarding/terms-conditions/withdraw`,
  getTermsAndConditions: `${environment.ibpUrl}/onboarding/terms-conditions/active`,
  getUserTcStatus: (userId: number) => `${environment.ibpUrl}/onboarding/terms-conditions/user-status?userId=${userId}`,
};

const configServiceEndPoints = {
  // Company configuration endpoints
  companyPortalConfigById: (companyId: number | string) =>
    `${environment.configUrl}/config-company/portal/${companyId}`,
  updateCompanyPortalConfig: `${environment.configUrl}/config-company/portal`,
  companyPortalSubmission: `${environment.configUrl}/config-company/submission`,
  companyPortalApproval: `${environment.configUrl}/config-company/approval`,
  companyAuthConfigBySubdomain: (subdomain: string) =>
    `${environment.configUrl}/auth-config/company?subdomain=${subdomain}`,
  companyAuthConfigById: (companyId: number) =>
    `${environment.configUrl}/auth-config/company/${companyId}`,
  authenticationMethods: `${environment.configUrl}/config-company/methods`,
  allCompanyConfigs: `${environment.configUrl}/config-company/list/all`,
  domainConfiguredCompanyIds: `${environment.configUrl}/config-company/domain-company-ids`,
  companyConfigBySubdomain: (subdomain: string) =>
    `${environment.configUrl}/config/company?subdomain=${subdomain}`,
  companyConfigById: (id: number) =>
    `${environment.configUrl}/config/company/${id}`,
  companyLogoById: (companyId: number) =>
    `${environment.configUrl}/company-colors/logo/${companyId}`,
  companyPolicyFeatureDocument: `${environment.configUrl}/config-company/policy-feature-document`,
  companyPolicyFeatureDocumentByCompanyId: (companyId: number | string) =>
    `${environment.configUrl}/config-company/policy-feature-document/${companyId}`,
  companyOnboardingMailModeByCompanyId: (companyId: number | string) =>
    `${environment.configUrl}/config-company/onboarding-mail-mode/${companyId}`,
  updateCompanyOnboardingMailMode: `${environment.configUrl}/config-company/onboarding-mail-mode`,
  companyReminderConfigByCompanyId: (companyId: number | string) =>
    `${environment.orgUrl}/company/reminder-config/${companyId}`,
  updateCompanyReminderConfig: (companyId: number | string) =>
    `${environment.orgUrl}/company/reminder-config/${companyId}`,
  domainConfigScope: (configId: number) =>
    `${environment.configUrl}/config-company/scope/${configId}`,
  domainConfigScopeTaken: (companyId: number, excludeConfigId: number) =>
    `${environment.configUrl}/config-company/scope/company/${companyId}/taken?excludeConfigId=${excludeConfigId}`,
  companyPortalConfigList: (companyId: number | string) =>
    `${environment.configUrl}/config-company/portal/list/${companyId}`,
  companyPortalConfigByConfigId: (configId: number) =>
    `${environment.configUrl}/config-company/portal/config/${configId}`,
  createCompanyPortalConfig: `${environment.configUrl}/config-company/portal`,
  deleteCompanyPortalConfig: (configId: number) =>
    `${environment.configUrl}/config-company/portal/${configId}`,
  // Offers & Benefits travels inside the portal configuration payload
  // (offersAndBenefits / offersAndBenefitsEnabled) — no dedicated endpoints.
  // Password policy rules for company (org-service)
  getCompanyPasswordRules: (companyId: number) =>
    `${environment.configUrl}/password-rules/company/${companyId}`,

  // File password configuration (org-service)
  filePasswordConfig: `${environment.orgUrl}/file-password-config`,

  //relation
  getRelationDetails: (id: number) =>
    `${environment.ibpUrl}/company-employee/employee/${id}/relations-constraints-dependents`,
  updateEnrollmentData: `${environment.ibpUrl}/company-employee/policy/combined-enrollment`,
  upsertProfileDependents: `${environment.ibpUrl}/company-employee/profile/dependents`,
  resetEnrollment: `${environment.ibpUrl}/company-employee/enrollment/reset`,
  latestEnrollmentSubmissionMeta: (employeeId: string | number, companyId: string | number) =>
    `${environment.ibpUrl}/company-employee/enrollment-submission/latest?employeeId=${employeeId}&companyId=${companyId}`,
};

const commonEndPoints = {
  refreshToken: environment.authUrl + "/refresh-token",

  //lookup
  lookUpByName: (lookupName: string, sortOrder?: "ASC" | "DESC") =>
    environment.orgUrl +
    `/look-up/value?name=${lookupName}` +
    (sortOrder ? `&sortOrder=${sortOrder}` : ""),
  // Lookup scoped to a specific organisation (overrides the JWT org).
  lookUpByNameForOrg: (lookupName: string, organisationId: number) =>
    environment.orgUrl +
    `/look-up/value?name=${lookupName}&organisationId=${organisationId}`,
  lookUpByKey: (lookupKey: string) =>
    environment.orgUrl + `/look-up/key?key=${lookupKey}`,
  lookUpById: (lookupId: number) => environment.orgUrl + `/look-up/${lookupId}`,
  lookUpValuesByName: environment.orgUrl + `/look-up/lookup-values-by-name`, // Added endpoint for lookup values by name
};

const nl2sqlChatbotEndPoints = {
  nl2sqlQuery: environment.n2SqlUrl + "/nl2sql",
  // nl2sqlHealth: environment.nl2sqlChatbot.baseUrl + "/health",
  nl2sqlChatRequests: (userId: string | number) =>
    environment.n2SqlUrl + `/nl-2-sql/conversation/${userId}`,
  nl2sqlChatResponse: (requestId: string | number) =>
    environment.n2SqlUrl + `/nl-2-sql/response/${requestId}`,
  nl2sqlFeedback: environment.aiServiceUrl + "/user-feedback",
  addFavouritePrompt: () => `${environment.aiServiceUrl}/prompt/add-favourite`,
  removeFavouritePrompt: () =>
    `${environment.aiServiceUrl}/prompt/remove-favourite`,
};

const iworkEndPoints = {
  crmRedirectToken: environment.authUrl + "/crm-redirect-token",
  hrUsersList: environment.ibpUrl + "/hr-module/hr-users",
  hrUserDetail: (id: number) => environment.ibpUrl + `/hr-module/hr-users/${id}`,
  //login
  auth: environment.authUrl + "/login",
  logout: environment.authUrl + "/logout",
  msAuthUrl: environment.authUrl + "/auth/microsoft/auth-url",
  permissions: environment.authUrl + "/access-control-list/permissions",
  validateResetToken: (token: string) =>
    environment.orgUrl + `/employee/password-reset/validate?token=${token}`,
  resetPassword: environment.orgUrl + "/employee/password-reset",
  sendResetMail: (id: number) =>
    environment.orgUrl + `/employee/${id}/password-reset-mail`,
  sendResetMailByEmail: (email: string) =>
    environment.orgUrl + `/employee/password-reset-mail/${email}`,

  //masters
  masterDataByDependentKey: (masterName: string, key: string, value: string) =>
    environment.orgUrl +
    `/master/${masterName}?searchBy=${key}&searchId=${value}`,
  usersList:
    environment.orgUrl +
    "/master/user?sortBy=firstName&sortOrder=ASC&page=1&limit=1000", //used to display users list in forms
  usersListInEmployee: environment.orgUrl + "/master/user", //TODO

  // Org/Vertical/Dept/Branch master
  verticalsBySbu: (sbuId: number) =>
    environment.orgUrl +
    `/master/org_vertical?searchBy=sbuId&searchId=${sbuId}&page=1&limit=200`,
  verticalsByOrg: (organisationId: number) =>
    environment.orgUrl +
    `/master/org_vertical?searchBy=organisationId&searchId=${organisationId}&page=1&limit=200`,
  departmentsByVertical: (verticalId: number) =>
    environment.orgUrl +
    `/master/org_department?searchBy=verticalId&searchId=${verticalId}&page=1&limit=200`,
  branchesByOrg: (organisationId: number) =>
    environment.orgUrl +
    `/master/org_branch?searchBy=organisationId&searchId=${organisationId}&page=1&limit=200`,
  sbuByOrg: (organisationId: number) =>
    environment.orgUrl +
    `/master/org_sbu?searchBy=organisationId&searchId=${organisationId}&page=1&limit=200`,
  designationsByOrg: (organisationId: number) =>
    environment.orgUrl +
    `/master/org_designation?searchBy=organisationId&searchId=${organisationId}&page=1&limit=200`,

  masterOrganisation:
    environment.orgUrl +
    `/master/organisation?sortBy=id&sortOrder=ASC&page=1&limit=200`,

  //contact
  contactList: (companyContactId: number) =>
    environment.orgUrl +
    `/contact/contactList?contactRecordTypeLid=${companyContactId}`, //used to display contacts list in forms

  //companies
  allCompanies: environment.orgUrl + "/company",

  // Client portfolio: companies derived from active policies (policies-first)
  portfolioCompanies: environment.policyUrl + "/policy/portfolio/companies",

  // Dashboard "Service Score" scatter plot widget — accepts ?companyId=&financialYear=
  serviceScoreChart: environment.policyUrl + "/policy/service-score",

  parentCompaniesList: environment.orgUrl + "/company/group-company",

  // PII reveal — returns plaintext value for a masked field, logs audit trail
  // Served exclusively by config-service (not duplicated across all services)
  revealField: environment.configUrl + "/reveal",

  //employees
  allEmployees: environment.orgUrl + "/employee",
  employeeById: (employeeId: number) =>
    environment.orgUrl + `/employee/${employeeId}`,
  myProfile: environment.orgUrl + "/employee/my-profile",
  employeeHirarcy: () => environment.orgUrl + `/employee/hierarchy`,
  totalEmployeeHierarchy: () =>
    environment.orgUrl + `/employee/all-users-hierarchy`,
  employeeListOfValuesById: (employeeId: number) =>
    environment.orgUrl + `/employee/list-of-values?employeeId=${employeeId}`,
  employeeHeirarcy: environment.orgUrl + `/employee/hierarchy`,
  employeeLocationList: environment.orgUrl + "/master/city",
  employeeRoleList: environment.orgUrl + "/master/role?page=1&limit=100",
  employeeRebuildHierarchy: environment.orgUrl + "/employee/rebuild-hierarchy",
  employeeReportingChain: environment.orgUrl + "/employee/reporting-chain",
  employeeDeactivatePreview: (id: number) =>
    environment.orgUrl + `/employee/${id}/deactivate-preview`,
  employeeDeactivationRecords: (id: number, type?: string) =>
    environment.orgUrl + `/employee/${id}/deactivation-records` + (type ? `?type=${type}` : ""),
  employeeAutoDeactivate: (id: number) =>
    environment.orgUrl + `/employee/${id}/auto-deactivate`,
  employeeManualDeactivate: (id: number) =>
    environment.orgUrl + `/employee/${id}/manual-deactivate`,
  employeeActivate: (id: number) =>
    environment.orgUrl + `/employee/${id}/activate`,

  //roles management
  roles: environment.orgUrl + "/master/role",
  roleById: (roleId: number) =>
    environment.orgUrl + `/master/role/${roleId}?page=1&limit=100`,

  //access control list
  aclMetadata: environment.authUrl + "/access-control-list",
  roleAcl: (roleId: number) =>
    environment.authUrl + `/access-control-list?role=${roleId}`,
  updateRoleAcl: (roleId: number) =>
    environment.authUrl + `/access-control-list/role/${roleId}`,

  //countries
  cityList: environment.orgUrl + "/master/city?page=1&limit=100",

  //insureres
  insurerDetailsById: (companyId: number) =>
    environment.orgUrl + `/insurers/details/${companyId}`,
  insurerLocationsById: (companyId: number) =>
    environment.orgUrl + `/insurers/${companyId}/locations`,

  //tpa
  tpaDetailsById: (companyId: number) =>
    environment.orgUrl + `/tpa/details/${companyId}`,

  //broker

  brokerByID: (brokerId: number) => environment.orgUrl + `/brokers/${brokerId}`,
  allBrokers: environment.orgUrl + "/brokers",
  getBrokerDetails: (tpaId: number) => environment.orgUrl + `/brokers/${tpaId}`,
  brokerDetailsById: (companyId: number) =>
    environment.orgUrl + `/brokers/details/${companyId}`,
  brokersList: environment.orgUrl + "/brokers/brokerList",

  // policies
  allPolicies: environment.policyUrl + "/policy/policies",
  getMigrationLogs: environment.policyUrl + "/policy/company-policy-migration-log",
  policyConfiguration: environment.policyUrl + "/policy/configuration",
  policyConfigurationById: (configId: number | string) =>
    environment.policyUrl + `/policy/configuration/${configId}`,
  policyConfigurationApproval: (configId: number | string) =>
    environment.policyUrl + `/policy/configuration/${configId}/approval`,
  policyConfigurationExportLiveOptions: (companyId: number,policyTypeLid:number) =>
    environment.policyUrl + `/policy/configuration/company/${companyId}/policy-type/${policyTypeLid}/export/live`,
  policyConfigurationExport: (policyId: number | string) =>
    environment.policyUrl + `/policy/configuration/${policyId}/export`,
  policyAssetData: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/assets`,
  policySubAssetData: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/sub-assets`,
  cdAccountsMerge: `${environment.policyUrl}/policy/caution-deposit/merge`,

  //gst
  stateGstListById: (countryId: number) =>
    environment.orgUrl + `/address/state/${countryId}`,
  //Opportunities
  allOpurtunities: environment.opportunityUrl + "/opportunity",
  // Org-hierarchy drilldown aggregate (My RO Enhanced): child nodes at a level
  // with Total ROs / premium / brokerage. Caller appends the query string.
  opportunityScopeSummary:
    environment.opportunityUrl + "/opportunity/scope-summary",
  // Paginated company-grain aggregate (SO/RO Enhanced Companies table):
  // one row per company with Total SOs/ROs + brokerage, scope-summary
  // semantics. Caller appends the query string.
  opportunityCompanySummary:
    environment.opportunityUrl + "/opportunity/company-summary",
  oppurtunityById: (oppurtunityId: number) =>
    environment.opportunityUrl + `/opportunity/${oppurtunityId}`,
  // Client portfolio drill-down: a company's RO/SO opportunities (?type=RO|SO).
  opportunitiesByCompany: (companyId: number) =>
    environment.opportunityUrl + `/opportunity/company/${companyId}`,

  //claims
  claimsByPolicyId: (policyId: number) =>
    environment.policyUrl + `/claim/policy/${policyId}`,
  getAllClaimsBatch: environment.policyUrl + "/claim/claim-upload-batches",
  claimsUpload: environment.policyUrl + "/claim/claims-upload",
  nonGroupClaimActivityMeta:
    environment.policyUrl + "/non-group-claim/activity-meta",
  nonGroupClaimActivityMetaById: (claimActivityId: number) =>
    environment.policyUrl + `/non-group-claim/activity-meta/${claimActivityId}`,
  //Renewal Opportunities
  // allRenewalOpportunities: environment.opportunityUrl + "/opportunity?type=RO",

  updateOpportunityActivity: (opportunityActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/activity-meta/${opportunityActivityId}`,

  extendOpportunity: (opportunityId: number) =>
    environment.opportunityUrl + `/opportunity/extend-expiry/${opportunityId}`,

  addQuoteFromFinalNegotiation: (opportunityActivityId: number) =>
    `${environment.opportunityUrl}/opportunity/add-final-negotiation-quote/${opportunityActivityId}`,

  //opty planning
  updateActivity: environment.opportunityUrl + `/opportunity/activity`,

  //Data Validation
  dataValidationByOppurtunityId: (oppurtunityId: number) =>
    environment.opportunityUrl +
    `/opportunity/data-validation/${oppurtunityId}`,
  opportunityManagement:
    environment.opportunityUrl + "/opportunity/activity-meta",
  rfpDataByActivityId: (opportunityActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/activities/rfpData/${opportunityActivityId}`,
  coversMetaByOpportunityId: (opportunityId: number, activityId: number) =>
    environment.opportunityUrl +
    `/opportunity/activities/coversMeta/${opportunityId}?activityId=${activityId}`,
  activityMetaByOpportunityId: (opportunityId: number, activityId: number) =>
    environment.opportunityUrl +
    `/opportunity/activity-meta/${opportunityId}/${activityId}`,
  //Tasks , notes and Meetings
  getTaskById: (taskId: number) =>
    environment.opportunityUrl + `/task/${taskId}`,
  getTaskDetailsByOptyActivityId: (oppActivityId: number) =>
    environment.opportunityUrl + `/opportunity/tasks/${oppActivityId}`,
  getMeetingDetailsByOptyActivityId: (oppActivityId: number) =>
    environment.opportunityUrl +
    `/meeting/opportunity-activity/${oppActivityId}`,
  getNotes: environment.opportunityUrl + "/note?page=1&limit=1000",
  createMeetings: environment.opportunityUrl + "/meeting",
  createTasks: environment.opportunityUrl + "/task",
  createDeviationTask:
    environment.opportunityUrl + "/opportunity/deviation-task",
  createNotes: environment.opportunityUrl + "/note",
  updateMeeting: (meetingId: number) =>
    environment.opportunityUrl + `/meeting/${meetingId}/complete`,
  getMeetingByOpportunityId: (
    opportunityId: number,
    page = 1,
    limit = 100,
    filterByOpportunity = false
  ) =>
    `${environment.opportunityUrl}/meeting?page=${page}&limit=${limit}&opportunityId=${opportunityId}&filterByOpportunity=${filterByOpportunity}`,
  getTaskByOpportunityId: (
    opportunityId: number,
    page = 1,
    limit = 100,
    filterByOpportunity = false
  ) =>
    `${environment.opportunityUrl}/task?page=${page}&limit=${limit}&opportunityId=${opportunityId}&filterByOpportunity=${filterByOpportunity}`,
  getNotesByOpportunityId: (opportunityId: number, page = 1, limit = 100) =>
    `${environment.opportunityUrl}/note?page=${page}&limit=${limit}&opportunityId=${opportunityId}`,
  // knowledge central
  knowledgeCatalog: (start = 0, limit = 8) =>
    `${environment.knowledgeUrl}/knowledge/catalog?start=${start}&limit=${limit}`,
  knowledgeByCategory: (categoryId: number, page = 1, limit = 8) =>
    `${environment.knowledgeUrl}/knowledge?categoryId=${categoryId}&page=${page}&limit=${limit}`,
  knowledgeIncrementAccess: (documentId: number) =>
    `${environment.knowledgeUrl}/knowledge/${documentId}/access`,
  knowledgeDownload: (documentId: number) =>
    `${environment.knowledgeUrl}/knowledge/${documentId}/download`,
  knowledgeUploadFile: `${environment.knowledgeUrl}/knowledge/file`,
  knowledgeUploadUrl: `${environment.knowledgeUrl}/knowledge/url`,
  knowledgeReplaceFile: (documentId: number) =>
    `${environment.knowledgeUrl}/knowledge/file/${documentId}`,
  knowledgeReplaceUrl: (documentId: number) =>
    `${environment.knowledgeUrl}/knowledge/${documentId}/url`,
  knowledgeUpdateMeta: (documentId: number) =>
    `${environment.knowledgeUrl}/knowledge/${documentId}`,
  knowledgeDelete: (documentId: number) =>
    `${environment.knowledgeUrl}/knowledge/${documentId}`,
  //Activities
  activityMeta: environment.opportunityUrl + "/opportunity/activity-meta",
  opportunityActivitiesByopportunityActivityId: (
    opportunityActivityId: number
  ) =>
    environment.opportunityUrl +
    `/opportunity/activity-data/${opportunityActivityId}`,
  opportunityCoversPrefill: (opportunityActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/covers-prefill/${opportunityActivityId}`,

  fetchOpportunityPreviousMandate: (opportunityActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/fetch-existing-mandate/${opportunityActivityId}`,
  activityList: environment.opportunityUrl + "/opportunity/activity-details",
  renewalActivityList:
    environment.opportunityUrl + "/opportunity/activity-details?type=RO",

  // Meetings
  meetingById: (meetingId: number) =>
    environment.opportunityUrl + `/meeting/${meetingId}`,

  // renewal

  opportunityStateDetails:
    environment.opportunityUrl + `/opportunity/stage-details`,

  // ai-smartadds and covers
  businessCard: environment.aiServiceUrl + "/business-card/upload",
  claimFormExtractGpt: environment.aiServiceUrl + "/claim-form/extract-gpt",
  claimFormExtractTextract: environment.aiServiceUrl + "/claim-form/extract-textract",
  claimFormSaveExtraction: environment.ibpUrl + "/company-employee/claim-form/save-extraction",
  pdfAnalyzer: environment.aiServiceUrl + "/pdf-analyser/upload/?company=true",
  companySearch: environment.aiServiceUrl + "/research/company",
  industryIntelligence:
    environment.aiServiceUrl + "/research/company/industry-intelligence",
  coversAi: environment.aiServiceUrl + "/pdf-analyser/cover",
  extractPolicyConfiguration: environment.aiServiceUrl + "/pdf-analyser/policy-configurator",
  extractPolicyDetails: (opportunityActivityId: number) =>
    `${environment.aiServiceUrl}/pdf-analyser/policy-details?opportunityActivityId=${opportunityActivityId}`,
  placementSlipData:
    environment.documentServiceUrl + "/document/placement-slip/data",
  placementSlipPdf:
    environment.documentServiceUrl + "/document/pdf/placement-slip",
  nudgesData: (scopeId: number) =>
    `${environment.aiServiceUrl}/nudge-data?scope_id=${scopeId}`,
  nudgeParameterData: () =>
    `${environment.aiServiceUrl}/nudge-data/get-nudge-parameter-data`,

  // notifications
  sendNotification: `${environment.notificationUrl}/notifications`,

  getNotifications: (status: string, page = 1, limit = 10) =>
    `${environment.notificationUrl}/notifications?status=${status}&page=${page}&limit=${limit}`,
  getNotificationsAfter: (notificationId: number, status: string) =>
    `${environment.notificationUrl}/notifications?notificationId=${notificationId}&status=${status}`,

  checkLatestNotification: (status: string, notificationId: number) =>
    `${environment.notificationUrl}/notifications/check-latest-notification?notificationId=${notificationId}&status=${status}`,
  updateNotificationReadStatus: () =>
    `${environment.notificationUrl}/notifications/update-status`,
  getNotificationInfoById: (id: number | string) =>
    `${environment.ibpUrl}/company-employee/notification-info/${id}`,

  getopportunityVersionById: (oppId: number, versionId: number) =>
    environment.opportunityUrl +
    `/opportunity/activities/broking-slip/${oppId}/${versionId}`,

  getBrokingSlipByOppId: (oppActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/activities/broking-slip/${oppActivityId}`,
  updateVersion: (versionId: number) =>
    environment.opportunityUrl +
    `/opportunity/activities/broking-slip/version/${versionId}`,
  updateBrokingSlip: (oppActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/activities/broking-slip/${oppActivityId}`,

  // templates management
  templates: `${environment.notificationUrl}/templates`,
  templateById: (id: number | string) =>
    `${environment.notificationUrl}/templates/${id}`,
  templateEventTypes: `${environment.notificationUrl}/templates/event-types`,
  templateVariablesByEventType: (id: number | string) =>
    `${environment.notificationUrl}/templates/event-types/${id}/variables`,
  templateWorkflow: (id: number | string) =>
    `${environment.notificationUrl}/templates/${id}/workflow`,
  templateWorkflowHistory: (id: number | string) =>
    `${environment.notificationUrl}/templates/${id}/workflow/history`,
  templatePreview: `${environment.notificationUrl}/templates/preview`,
  validateTemplateVariables: `${environment.notificationUrl}/templates/variables/validate-for-event-type`,
  checkEventConflict: `${environment.notificationUrl}/templates/check-event-conflict`,

  // "Customise" drill-down on Template Management (/template-management) —
  // company/config-scoped overrides of the templates above.
  templatesEffective: (configId: number | string, channelType = "email") =>
    `${environment.notificationUrl}/templates/effective?configId=${configId}&channelType=${channelType}`,
  templateOverride: (defaultTemplateId: number | string) =>
    `${environment.notificationUrl}/templates/${defaultTemplateId}/override`,
  templateOverrideDelete: (defaultTemplateId: number | string, configId: number | string) =>
    `${environment.notificationUrl}/templates/${defaultTemplateId}/override?configId=${configId}`,
  templateStatus: (defaultTemplateId: number | string) =>
    `${environment.notificationUrl}/templates/${defaultTemplateId}/status`,
  templateChangeLog: (
    defaultTemplateId: number | string,
    configId?: number | string,
    companyId?: number | string
  ) =>
    `${environment.notificationUrl}/templates/${defaultTemplateId}/change-log${
      configId !== undefined
        ? `?configId=${configId}`
        : companyId !== undefined
        ? `?companyId=${companyId}`
        : ""
    }`,
  templateOverridesSummary: (defaultTemplateId: number | string) =>
    `${environment.notificationUrl}/templates/${defaultTemplateId}/overrides`,

  // Company-wide overrides — iwork/internal-CRM event types with no domain
  // concept, mirrors the config-scoped endpoints above.
  templatesEffectiveForCompany: (companyId: number | string, channelType = "email") =>
    `${environment.notificationUrl}/templates/company-effective?companyId=${companyId}&channelType=${channelType}`,
  templateCompanyOverride: (defaultTemplateId: number | string) =>
    `${environment.notificationUrl}/templates/${defaultTemplateId}/company-override`,
  templateCompanyOverrideDelete: (defaultTemplateId: number | string, companyId: number | string) =>
    `${environment.notificationUrl}/templates/${defaultTemplateId}/company-override?companyId=${companyId}`,
  templateCompanyOverridesSummary: (defaultTemplateId: number | string) =>
    `${environment.notificationUrl}/templates/${defaultTemplateId}/company-overrides`,

  //quote management
  updateQuote: (quoteId: number) =>
    environment.opportunityUrl + `/opportunity/quote/${quoteId}`,
  updateQuoteByActivityId: (oppActivityId: number) =>
    environment.opportunityUrl + `/opportunity/quote/activity/${oppActivityId}`,

  // policy confirmation
  policyConfirmation: (opportunityActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/policy-confirmation-account-details/${opportunityActivityId}`,
  getQuoteComparisonReport:
    environment.opportunityUrl + "/opportunity/report-generation",

  // Getting Versions Details
  getVersionDetails: (opportunityActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/qcr_versions/${opportunityActivityId}`,
  finalizedQuoteById: (quoteId: number) =>
    environment.opportunityUrl + `/opportunity/finalised-quote/${quoteId}`,

  stageOwner: environment.opportunityUrl + "/opportunity/assign-stage-owner",
  getStageOwner: (opportunityId: number) =>
    environment.opportunityUrl + `/opportunity/${opportunityId}/stage-owners`,

  // policy-listing
  policyList: (companyId: number) =>
    environment.policyUrl + `/policy/company/${companyId}`,
  policyTypesByCompany: (companyId: number) =>
    environment.policyUrl + `/policy/company/${companyId}/policy-types`,
  // policy details
  getBasicDetailsByPolicyId: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}?section=policyDetails`,
  getPolicyFinancialInfo: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}?section=financialInfo`,
  getPolicyPremiumReceipts: (policyId: number, search?: string, sort?: string) =>
    environment.policyUrl + `/policy/${policyId}?section=premiumReceipts${search ? `&search=${encodeURIComponent(search)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`,
  getPolicyCommissionStatements: (policyId: number, search?: string, sort?: string) =>
    environment.policyUrl + `/policy/${policyId}?section=commissionStatements${search ? `&search=${encodeURIComponent(search)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`,
  getPolicyInvoices: (policyId: number, search?: string, sort?: string) =>
    environment.policyUrl + `/policy/${policyId}?section=invoices${search ? `&search=${encodeURIComponent(search)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`,
  getPolicyCollections: (policyId: number, search?: string, sort?: string) =>
    environment.policyUrl + `/policy/${policyId}?section=collections${search ? `&search=${encodeURIComponent(search)}` : ""}${sort ? `&sort=${encodeURIComponent(sort)}` : ""}`,
  getContactsByPolicyId: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}?section=contactDetails`,
  getContactByPolicyId: (policyId: number, contactDetails?: string) =>
    environment.policyUrl +
    `/policy/${policyId}/contacts${
      contactDetails ? `?contactDetails=${contactDetails}` : ""
    }`,
  updateContactByPolicyId: (policyId: number, contactId: number) =>
    environment.policyUrl + `/policy/${policyId}/contacts/${contactId}`,
  createContactForPolicy: (policyId: number, contactDetails?: string) =>
    environment.policyUrl +
    `/policy/${policyId}/contacts${
      contactDetails ? `?contactDetails=${contactDetails}` : ""
    }`,
  saveContactsForPolicy: (policyId: number, contactDetails: string) =>
    environment.policyUrl +
    `/policy/${policyId}/contacts?contactDetails=${contactDetails}`,
  getCoversMetaByPolicyId: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}?section=coversMeta`,
  getCoversDataByPolicyId: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}?section=coversData`,
  getCdDetailsByPolicyId: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/caution-deposit/transactions`,
  getInstallmentDetailsByPolicyId: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}`,
  createPolicyInstallment: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/installments`,
  updatePolicyInstallment: (policyId: number, installmentId: number) =>
    environment.policyUrl + `/policy/${policyId}/installments/${installmentId}`,
  policyListBycontactId: (contactId: number) =>
    environment.policyUrl + `/policy/contact/${contactId}`,
  activatePolicy: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/activate`,
  reconfigurePolicy: (policyId: number) =>
    environment.policyUrl + `/policy/reconfigure/${policyId}`,
  endorsementNotificationEmails: (policyId: number) =>
    environment.policyUrl +
    `/policy/${policyId}/endorsement-notification-email`,

  //service score
  serviceScore:
    environment.policyUrl + `/service-tat/monthly-summary?year=2025`,
  serviceScoreByMonth: environment.policyUrl + `/service-tat/monthly-details`,
  serviceScoreSummaryDetails: (companyId: number, financialYear?: number) =>
    environment.policyUrl +
    `/service-tat/summary-details?companyId=${companyId}` +
    (financialYear ? `&financialYear=${financialYear}` : ""),

  //localization
  activityApproval: (opportunityActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/${opportunityActivityId}/activity-approval`,

  // opportunity-lost
  opportunityLost: environment.opportunityUrl + "/opportunity/opportunity-lost",
  oppurtunityLostById: (oppurtunityId: number) =>
    environment.opportunityUrl + `/opportunity/${oppurtunityId}?page=lost`,

  // email-report
  emailReportDownload:
    environment.opportunityUrl + `/opportunity/excel-generation-url`,
  generateReport: environment.schedulerUrl + `/report/generate/`,
  generateHRReports: environment.ibpUrl + `/hr-module/generate/`,
  hrEmployeeProfile: environment.ibpUrl + `/hr-module/employee-profile`,
  hrEmployeeVip: (employeeId: number) => environment.ibpUrl + `/hr-module/employee/${employeeId}/vip`,
  hrEmployeeBlock: (employeeId: number) => environment.ibpUrl + `/hr-module/employee/${employeeId}/block`,
  sendWelcomeEmail: environment.ibpUrl + `/onboarding/initial-notification`,
  sendReminderEmail: environment.ibpUrl + `/onboarding/enrollment-reminder`,
  hrUpdateEnrollmentWindow: (employeeId: number) => environment.ibpUrl + `/hr-module/employee/${employeeId}/enrollment-window`,
  downloadHRReports: environment.ibpUrl + `/hr-module/download/`,
  countHRReport: (reportKey: string) => environment.ibpUrl + `/hr-module/report/${reportKey}/count`,
  hrGlobalSearch: (companyId: number, q: string, hrManagementId?: number | null) =>
    environment.ibpUrl + `/hr-module/global-search?companyId=${companyId}&q=${encodeURIComponent(q)}${hrManagementId ? `&hrManagementId=${hrManagementId}` : ''}`,
  externalHrCreate: environment.ibpUrl + `/hr-module/external-hr`,
  externalHrUpdate: (userId: number) => environment.ibpUrl + `/hr-module/external-hr/${userId}`,
  hrEnrollmentUploadSummaryByEndorsement: (policyId: number, endorsementId: number) =>
    environment.ibpUrl + `/hr-module/policy/${policyId}/endorsement/${endorsementId}/enrollment-upload-summary`,
  hrEndorsementStats: (policyId: number, endorsementId: number, locationIds?: string) =>
    environment.ibpUrl + `/hr-module/policy/${policyId}/endorsement/${endorsementId}/stats` +
    (locationIds && locationIds.trim() && locationIds.trim() !== '[]' ? `?locationIds=${encodeURIComponent(locationIds)}` : ''),
  downloadReport: environment.schedulerUrl + `/report/download/`,
  reportList: environment.schedulerUrl + `/report/reports_list`,
  reportDetails: (reportId: string) =>
    environment.schedulerUrl + `/report/${reportId}`,

  // Master module (generic)
  masterEntities: environment.orgUrl + `/master/entities`,
  masterEntityMetadata: (entity: string) =>
    environment.orgUrl + `/master/${entity}/metadata`,
  masterList: (entity: string) => environment.orgUrl + `/master/${entity}`,
  masterRecordById: (entity: string, id: string | number) =>
    environment.orgUrl + `/master/${entity}/${id}`,
  masterCreate: (entity: string) => environment.orgUrl + `/master/${entity}`,
  masterUpdate: (entity: string, id: string | number) =>
    environment.orgUrl + `/master/${entity}/${id}`,
  masterOptions: (entity: string) =>
    environment.orgUrl + `/master/${entity}/options`,

  // Cover template mapping (master "Covers")
  coverNameCheck: (name: string) =>
    environment.orgUrl +
    `/master/cover?searchBy=name&search=${encodeURIComponent(name)}&page=1&limit=5`,
  coverTemplates: (policyTypeId: number, organizationId?: number) =>
    environment.orgUrl +
    `/master/cover-templates?policyTypeId=${policyTypeId}` +
    (organizationId ? `&organizationId=${organizationId}` : ""),
  coverTemplatesSync: environment.orgUrl + `/master/cover-templates/sync`,

  // Dashboard
  salesFunnel: environment.opportunityUrl + "/opportunity/sales-funnel",
  renewalFunnel:
    environment.opportunityUrl + "/opportunity/sales-funnel?type=RO",
  renewalScheduleBySbu:
    environment.opportunityUrl + "/opportunity/renewal-schedule-by-sbu",
  salesScheduleBySbu:
    environment.opportunityUrl + "/opportunity/sales-schedule-by-sbu",
  businessPerformanceData:
    environment.policyUrl + "/policy/new-dashboard-business-performance",
  tatSummaryData:
    environment.policyUrl + "/policy/summary-dashboard/tat-summary",
  policySummaryData: environment.policyUrl + "/policy/dashboard-policy-summary",
  businessPerformanceQuarterlyData:
    environment.policyUrl + "/policy/quarterly-dashboard-business-performance",
  businessPerformanceSbuData:
    environment.policyUrl + "/policy/quarterly-dashboard-business-performance-by-sbu-basis",
  OverviewQuery: environment.policyUrl + "/claim/dashboard-business-overview",

  downloadBizDoneReport: `${environment.policyUrl}/policy/policy-report`,
  policyReportExcel: `${environment.policyUrl}/policy/policy-report-excel`,
  // Async BizDone export: enqueue a background job, poll status, list history.
  policyReportExcelExport: `${environment.policyUrl}/policy/bizdone-report-excel/export`,
  policyReportExcelExportStatus: (jobId: number | string) =>
    `${environment.policyUrl}/policy/bizdone-report-excel/export/${jobId}`,
  policyReportExcelExportDownload: (jobId: number | string) =>
    `${environment.policyUrl}/policy/bizdone-report-excel/export/${jobId}/download`,
  policyReportExcelExports: `${environment.policyUrl}/policy/bizdone-report-excel/exports`,
  businessTargetUpsert: `${environment.policyUrl}/policy/business-target`,
  businessTargetReportList: `${environment.policyUrl}/policy/business-target-report-list`,
  businessTargetReportExport: `${environment.policyUrl}/policy/business-target-report/export`,
  businessTargetReportExports: `${environment.policyUrl}/policy/business-target-report/exports`,
  businessTargetReportExportStatus: (jobId: number | string) =>
    `${environment.policyUrl}/policy/business-target-report/export/${jobId}`,
  businessTargetReportExportDownload: (jobId: number | string) =>
    `${environment.policyUrl}/policy/business-target-report/export/${jobId}/download`,
  // Async SO/RO export: same pattern, scoped to SALES_OPPORTUNITY_LIST jobs.
  soReportExcelExport: `${environment.opportunityUrl}/opportunity/so-report-excel/export`,
  soReportExcelExportStatus: (jobId: number | string) =>
    `${environment.opportunityUrl}/opportunity/so-report-excel/export/${jobId}`,
  soReportExcelExportDownload: (jobId: number | string) =>
    `${environment.opportunityUrl}/opportunity/so-report-excel/export/${jobId}/download`,
  soReportExcelExports: `${environment.opportunityUrl}/opportunity/so-report-excel/exports`,
  // Async RO export: same pattern, scoped to RENEWAL_OPPORTUNITY_LIST jobs.
  roReportExcelExport: `${environment.opportunityUrl}/opportunity/ro-report-excel/export`,
  roReportExcelExportStatus: (jobId: number | string) =>
    `${environment.opportunityUrl}/opportunity/ro-report-excel/export/${jobId}`,
  roReportExcelExportDownload: (jobId: number | string) =>
    `${environment.opportunityUrl}/opportunity/ro-report-excel/export/${jobId}/download`,
  roReportExcelExports: `${environment.opportunityUrl}/opportunity/ro-report-excel/exports`,
  // Async plain-policy-listing export: same pattern, scoped to POLICY_LIST
  // jobs — distinct from the BizDone business-performance report above.
  policyListReportExcelExport: `${environment.policyUrl}/policy/policies-report-excel/export`,
  policyListReportExcelExportStatus: (jobId: number | string) =>
    `${environment.policyUrl}/policy/policies-report-excel/export/${jobId}`,
  policyListReportExcelExportDownload: (jobId: number | string) =>
    `${environment.policyUrl}/policy/policies-report-excel/export/${jobId}/download`,
  policyListReportExcelExports: `${environment.policyUrl}/policy/policies-report-excel/exports`,
  employeeListOfValues: environment.orgUrl + "/employee/list-of-values",
  brokerageSummary:
    environment.opportunityUrl + "/opportunity/brokerage-summary",

  //..........................
  userDetails: environment.authUrl + "/user-details",
  employeeCelebrations:
    environment.orgUrl + "/dashboard/team-celebrations?page=1&limit=100",

  //masters
  masterDataByName: (masterName: string) =>
    environment.orgUrl + `/master/${masterName}?page=1&limit=100`,

  //contact
  allContacts: environment.orgUrl + "/contact",
  contactById: (contactId: number) =>
    environment.orgUrl + `/contact/${contactId}`,
  companyById: (companyId: number) =>
    environment.orgUrl + `/company/${companyId}`,
  companiesListInSelectField: environment.orgUrl + "/company/companyList", //used to display compananies list in forms

  companiesList: environment.orgUrl + "/company/companyList?page=1&limit=1000", //used to display compananies list in forms
  companyDetailsById: (companyId: number) =>
    environment.orgUrl + `/company/details/${companyId}`, //used to display company details in forms
  companyHierarchy: environment.orgUrl + "/company/company-hierarchy",
  ibpCompanyHierarchy: environment.ibpUrl + "/hr-module/company-hierarchy",
  companyContacts: (companyId: number) =>
    environment.orgUrl + `/company/${companyId}/contacts`,
  companiesHierarchy: environment.orgUrl + "/company/hierarchy/companies",
  companiesWithPortalConfiguration: environment.orgUrl + "/company/portal-configured/companies",

  //countries
  stateListById: (countryId: number) =>
    environment.orgUrl + `/address/state/${countryId}`,
  cityListById: (countryId: number) =>
    environment.orgUrl + `/address/city/${countryId}`,
  countriesList: environment.orgUrl + "/address/country/list",

  // IBP-scoped address lookups (avoids 401 from org-service for IBP tokens)
  ibpCountriesList: environment.ibpUrl + "/company-employee/address/country/list",
  ibpStateListById: (countryId: number) =>
    environment.ibpUrl + `/company-employee/address/state/${countryId}`,
  ibpCityListById: (stateId: number) =>
    environment.ibpUrl + `/company-employee/address/city/${stateId}`,

  //insurer rewards
  allRewards: environment.orgUrl + "/reward",
  rewardById: (id: number) => environment.orgUrl + `/reward/${id}`,
  rewardsByInsurer: (insurerId: number) =>
    environment.orgUrl + `/reward/by-insurer/${insurerId}`,
  rewardExport: environment.orgUrl + "/reward/export",

  //insureres
  insurerById: (insurerId: number) =>
    environment.orgUrl + `/insurers/${insurerId}`,
  allInsurers: environment.orgUrl + "/insurers",
  insurersList: environment.orgUrl + "/insurers/insurerList",
  insurerSelectList: environment.orgUrl + "/insurers/select-list",
  insurerDistinctNames: environment.orgUrl + "/insurers/distinct/insurer-names",
  insurerDistinctBranchCodes: environment.orgUrl + "/insurers/distinct/branch-codes",
  insurerDistinctBranchNames: environment.orgUrl + "/insurers/distinct/branch-names",

  insurerBranchList: (insurerId: number) =>
    environment.orgUrl + `/insurers/${insurerId}/branches`,
  insurerContactList: (insurerId: number) =>
    environment.orgUrl + `/insurers/${insurerId}/contacts`,
  insurersByCompany: (companyId: number) =>
    environment.orgUrl + `/insurers/company/${companyId}`,

  //tpa
  AllTpas: environment.orgUrl + "/tpa",
  tpaByID: (tpaId: number) => environment.orgUrl + `/tpa/${tpaId}`,
  tpasList: environment.orgUrl + "/tpa/tpaList",
  tpaContactList: (tpaId: number) =>
    environment.orgUrl + `/tpa/${tpaId}/contacts`,

  // tpa external feature integration
  tpaFeatureTypes: `${environment.policyUrl}/tpa-external-feature/feature-types`,
  tpaFeatureAppRefs: `${environment.policyUrl}/tpa-external-feature/app-refs`,
  tpaFeatureAppRefById: (id: number) => `${environment.policyUrl}/tpa-external-feature/app-refs/${id}`,
  tpaFeatureTestApi: `${environment.policyUrl}/tpa-external-feature/app-refs/test`,
  tpaFeatureConfigs: (tpaId: number) =>
    `${environment.policyUrl}/tpa-external-feature/tpa/${tpaId}/configs`,
  tpaFeatureConfigById: (id: number) =>
    `${environment.policyUrl}/tpa-external-feature/configs/${id}`,
  tpaFeatureAllConfigs: `${environment.policyUrl}/tpa-external-feature/configs`,
  tpaFeatureDbSchema: `${environment.policyUrl}/tpa-external-feature/db-schema`,
  tpaFeatureAppRefResponseMappings: (appRefId: number) =>
    `${environment.policyUrl}/tpa-external-feature/app-refs/${appRefId}/response-mappings`,
  tpaFeatureResponseMappingById: (id: number) =>
    `${environment.policyUrl}/tpa-external-feature/response-mappings/${id}`,
  tpaFeatureRotateBasicAuth: (appRefId: number) =>
    `${environment.policyUrl}/tpa-external-feature/app-refs/${appRefId}/rotate-basic-auth`,
  tpaFeatureUpdateSecretKeys: (appRefId: number) =>
    `${environment.policyUrl}/tpa-external-feature/app-refs/${appRefId}/update-secret-keys`,
  tpaFeatureDeleteSecretKeys: (appRefId: number) =>
    `${environment.policyUrl}/tpa-external-feature/app-refs/${appRefId}/secret-keys`,
  tpaFeatureCheckSecretKeys: (appRefId: number) =>
    `${environment.policyUrl}/tpa-external-feature/app-refs/${appRefId}/check-secret-keys`,

  // tpa portal SSO config (encrypt-and-redirect style SSO — GHPL/FHPL/Vidal/HITPA)
  tpaSsoConfigs: `${environment.policyUrl}/tpa-sso-config`,
  tpaSsoConfigByTpa: (tpaId: number) => `${environment.policyUrl}/tpa-sso-config/tpa/${tpaId}`,
  tpaSsoConfigById: (id: number) => `${environment.policyUrl}/tpa-sso-config/${id}`,
  tpaSsoConfigPreview: (id: number) => `${environment.policyUrl}/tpa-sso-config/${id}/preview`,
  tpaSsoConfigUpsertWithFeature: `${environment.policyUrl}/tpa-sso-config/upsert-with-feature`,

  fileUpload: environment.orgUrl + "/file-upload/upload",

  //Renewal Opportunities
  // allRenewalOpportunities: environment.opportunityUrl + "/opportunity?type=RO",

  fileUploadByCompanyId: (companyId: number) =>
    environment.orgUrl +
    `/file-upload/upload?companyType=company&companyId=${companyId}&documentType=policy`,

  fileUploadReplace: environment.orgUrl + "/file-upload/upload/replace",
  fileUploadDelete: environment.orgUrl + "/file-upload/upload/delete",
  fileUploadDownload: environment.orgUrl + "/file-upload",
  fileUploadBulkDownload: environment.orgUrl + "/file-upload/bulk-download",
  fileDetails: environment.orgUrl + "/file-upload/file-details",
  fileDetailsById: (documentId: number) =>
    environment.orgUrl + `/file-upload/${documentId}/file-details`,

  //opty planning
  opportunityActivityByOppurtunityId: (oppurtunityId: number) =>
    environment.opportunityUrl + `/opportunity/activities/${oppurtunityId}`,
  opportunityActivityHistory: (opportunityId: number) =>
    environment.opportunityUrl +
    `/opportunity/${opportunityId}/activity-history`,

  //Tasks , notes and Meetings
  getMeetingById: (meetingId: number) =>
    environment.opportunityUrl + `/meeting/${meetingId}`,
  getMeetings: environment.opportunityUrl + "/meeting?page=1&limit=1000",
  getTasks: environment.opportunityUrl + "/task?page=1&limit=1000",
  completeTasks: (taskId: number) =>
    environment.opportunityUrl + `/task/${taskId}/complete`,

  // Meetings
  meetingList: (opportunityActivtyId: number) =>
    environment.opportunityUrl +
    `/meeting/opportunity-activity/${opportunityActivtyId}`,

  //opportunity by company id
  opportunityByCompanyId: (companyId: number) =>
    environment.opportunityUrl + `/opportunity/company/${companyId}`,
  opportunityByContactId: (contactId: number) =>
    environment.opportunityUrl + `/opportunity/contact/${contactId}`,

  //opportunity contacts
  contactsByOpportunityId: (opportunityId: number) =>
    environment.opportunityUrl +
    `/opportunity/${opportunityId}/contacts?type=COMPANY&status=ACTIVE`,

  //broking slip generation
  brokingSlipVersions: (opportunityActivityId: number) =>
    environment.opportunityUrl +
    `/opportunity/activities/broking-slip/versions/${opportunityActivityId}`, //for versions tabs data
  preferredInsurersByOpportunityId: (opportunityId: number) =>
    environment.opportunityUrl +
    `/opportunity/preferred-insurers/${opportunityId}`,
  installmentsByOpportunityId: (opportunityId: number) =>
    environment.opportunityUrl + `/opportunity/installments/${opportunityId}`,
  getAllQuotesByBrokingSlipId: (brokingSlipId: number) =>
    environment.opportunityUrl +
    `/opportunity/quote/broking-slip/${brokingSlipId}`,

  // smart-assist
  createCompanyOpportunity:
    environment.orgUrl + "/company/company-opportunity-create",

  //localization
  getLocalizationBasedOnUser: environment.orgUrl + "/localization",
  // ibp employees aren't rows in the users/organisation model org-service's
  // endpoint resolves against — ibp is not allowed to call org-service anyway —
  // so this is a duplicate endpoint served by ibp-service, resolving via the
  // employee's own company/country instead.
  getIbpLocalizationBasedOnUser: environment.ibpUrl + "/company-employee/localization",
  policyReportList: `${environment.policyUrl}/policy/policy-report-list`,
  // Org-hierarchy drilldown aggregate (Biz Done Report Enhanced): child nodes
  // at a level with policy count / premium / brokerage. Caller appends the
  // query string.
  policyScopeSummary: `${environment.policyUrl}/policy/scope-summary`,

  policyPortfolioScopeSummary: `${environment.policyUrl}/policy/portfolio/scope-summary`,

  // MIR — Monthly Information Report
  mirReportList: `${environment.policyUrl}/policy/mir-report/list`,
  mirReportGenerate: `${environment.policyUrl}/policy/mir-report/generate`,
  mirReportSections: (reportId: number) =>
    `${environment.policyUrl}/policy/mir-report/${reportId}/sections`,
  mirReportSubmit: (reportId: number) =>
    `${environment.policyUrl}/policy/mir-report/${reportId}/submit`,
  mirReportTransition: (reportId: number) =>
    `${environment.policyUrl}/policy/mir-report/${reportId}/transition`,
  announcement: environment.orgUrl + "/dashboard/announcements",
  // policy details
  // Lightweight, paginated {policyId, policyName, policyNumber} list for
  // picker/dropdown UIs — replaces the "dashboard_policy_cards" report
  // (dashboard-oriented, no pagination) as the data source for
  // ZohoEndorsementPage's "Select Policy" field.
  companyPolicyOptions: (companyId: string | number, page = 1, limit = 100) =>
    `${environment.policyUrl}/policy/company/${companyId}/policy-options?page=${page}&limit=${limit}`,
  getPolicyTemplate: (policyId: string) =>
    environment.policyUrl + `/policy/${policyId}/template`,
  getEnrollmentPolicyTemplate: (policyId: string) =>
    environment.policyUrl + `/policy/${policyId}/enrollment-template`,
  policyEnrollmentUpload: (policyId: string) =>
    environment.policyUrl + `/policy/${policyId}/enrollment-upload`,
  getPolicyUploads: (policyId: string) =>
    environment.policyUrl + `/policy/${policyId}/enrollment-upload-summary`,

  //Policy dashboard
  policyDashboard: (policyID: number) =>
    environment.policyUrl + `/policy/${policyID}/dashboard`,

  employeeInsuredExcel: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/employee-insured-excel`,

  nonGroupPolicyDashboard: (policyID: number) =>
    environment.policyUrl +
    `/policy/${policyID}/dashboard?isNonGroupPolicy=true`,

  // download employee-data template
  downloadEmployeeDataTemplate: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/template`,

  downloadEmployeeEnrollmentTemplate: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/enrollment-template`,

  downloadBypassEnrollmentTemplate: (policyId: number, endorsementType?: string) =>
    environment.policyUrl +
    `/policy/${policyId}/enrollment-template?mode=bypass` +
    (endorsementType
      ? `&endorsementType=${encodeURIComponent(endorsementType)}`
      : ""),

  downloadAssetAndSubAssetEnrollmentTemplate: () =>
    environment.policyUrl + `/policy/generate-template-excel`,

  downloadTPAUploadTemplate: (policyId: number, endorsementId?: number) =>
    environment.policyUrl +
    `/policy/${policyId}/tpa-upload-template${
      endorsementId ? `?endorsementId=${endorsementId}` : ""
    }`,

  // process employee-data
  processEmployeeData: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/enrollment-upload`,

  //employee batch data
  employeeBatchData: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/enrollment-upload-summary`,

  //enrollment-upload-summary-by-endorsement
  enrollmentUploadSummaryByEndorsement: (
    policyId: number,
    endorsementId: number
  ) =>
    environment.policyUrl +
    `/policy/${policyId}/${endorsementId}/enrollment-upload-summary-by-endorsement`,

  // download endorsement file
  endorsementDownload: (policyId: number, insurerId: number) =>
    environment.policyUrl +
    `/policy/${policyId}/endorsement/download?insurerId=${insurerId}`,

  //claims
  allClaims: environment.policyUrl + `/claim`,
  claimsTemplateDownload: environment.policyUrl + `/claim/template`,

  // insurer-acknowledgement
  insurerAcknowledgement: (policyId: number, acknowledgementId: number) =>
    environment.policyUrl +
    `/policy/${policyId}/${acknowledgementId}/insurer-acknowledgement`,

  // tpa-acknowledgement
  tpaAcknowledgement: (endorsementId: number) =>
    environment.policyUrl +
    `/policy/endorsement/${endorsementId}/tpa-id-upload`,

  // insurer document status
  insurerDocumentStatus: (policyId: number, endorsementId: number) =>
    environment.policyUrl +
    `/policy/${policyId}/endorsement/${endorsementId}/insurer-document-status`,

  // endorsement-batch
  endorsementBatchData: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/endorsement-batches`,
  getConstraintsByPolicyId: (policyId: number) =>
    environment.policyUrl + `/policy/constraints/${policyId}`,
  // getAllEndrosmentBatches:
  //   environment.policyUrl + `/policy/endorsement-batches`,
  getAllEndrosmentBatches:
    environment.policyUrl + `/policy/endorsement-management-batches`,
  endorsementBatchTrackerData: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/endorsement-batches-tracker`,

  // non - group policies endorsement tracker
  endorsementBatchesForNonGroupPolicies: (policyId: number) =>
    environment.policyUrl +
    `/policy/${policyId}/asset-endorsement-batches-tracker`,
  // ADD CD details
  addCdDetails: (cautionId: number) =>
    environment.policyUrl + `/policy/caution-deposit/${cautionId}`,
  // ADD CD details for specific policy
  addCdDetailsByPolicy: (policyId: number, cautionId: number) =>
    environment.policyUrl + `/policy/${policyId}/caution-deposit/${cautionId}`,
  getCdDetailsByCompanyId: (companyId: number) =>
    environment.opportunityUrl +
    `/opportunity/company/${companyId}/caution-deposit`,
  getCdDetailsById: (id: number) =>
    environment.policyUrl + `/policy/caution-deposit/${id}`,
  getPolicyTypes: (companyId: number, insurerId: number, showActive:boolean = true) =>
    environment.policyUrl +
    `/policy/policy-types?companyId=${companyId}&insurerId=${insurerId}&showActive=${showActive}`, // This will give active policies (!isMerged)
  getAllCautionDeposits:
    environment.policyUrl + `/policy/company/caution-deposit`,
  getCautionDepositDetails: (cdid: number) =>
    environment.policyUrl + `/policy/caution-deposit/${cdid}`,
  getCautionDepositTransactionDetails: (cdid: number) =>
    environment.policyUrl + `/policy/caution-deposit/${cdid}/transactions`,
  createCDAccount: environment.policyUrl + `/policy/company/caution-deposit`,

  getPremiumDetails: (opportunityId: number) =>
    environment.opportunityUrl + `/opportunity/${opportunityId}/brokerage`,
  brokerageToCollect: environment.policyUrl + `/policy/brokerage-to-collect`,

  myFollowUp:
    environment.opportunityUrl + "/opportunity/pending-activities-summary",

  // Endorsement Steps
  endorsementStepsByPolicyId: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/endorsement-steps`,

  endorsementStepsByEndorsementId: (
    policyId: number,
    endorsementId: number | string
  ) =>
    environment.policyUrl +
    `/policy/${policyId}/endorsement/${endorsementId}/endorsement-steps`,

  assetEndorsementStepsByEndorsementId: (
    policyId: number,
    endorsementId: number | string
  ) =>
    environment.policyUrl +
    `/policy/${policyId}/asset-endorsement/${endorsementId}/endorsement-steps`,

  putEndorsementStepsByEndorsementId: (
    policyId: number,
    endorsementId: number | string
  ) =>
    environment.policyUrl +
    `/policy/${policyId}/endorsement/${endorsementId}/endorsement-steps`,

  putAssetEndorsementStepsByEndorsementId: (
    policyId: number,
    endorsementId: number | string
  ) =>
    environment.policyUrl +
    `/policy/${policyId}/asset-endorsement/${endorsementId}/endorsement-steps`,

  processAssetEnrollmentData: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/asset-enrollment-upload`,

  downloadPolicyExtensionTemplate: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/extension/template`,

  processPolicyExtension: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/extension-upload`,

  getPolicyExtensionAuditHistory: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/extension/audit`,

  getPolicyExtensionUploadStatus: (policyId: number, dpfId: number) =>
    environment.policyUrl + `/policy/${policyId}/extension/upload-status/${dpfId}`,

  submitPolicyExtension: (policyId: number) =>
    environment.policyUrl + `/policy/${policyId}/extension/submit`,

  uploadPolicyExtensionDocument: (policyId: number, endorsementId: number) =>
    environment.policyUrl + `/policy/${policyId}/extension/documents?endorsementId=${endorsementId}`,

  listPolicyExtensionDocuments: (policyId: number, endorsementId: number, page = 1, limit = 10) =>
    environment.policyUrl + `/policy/${policyId}/extension/documents?endorsementId=${endorsementId}&page=${page}&limit=${limit}`,

  getExtensionDetails: (policyId: number, endorsementId: number) =>
    environment.policyUrl + `/policy/${policyId}/extension/${endorsementId}/details`,

  opportunityDocs: (opportunityId: number) =>
    environment.opportunityUrl + `/opportunity/${opportunityId}/documents`,

  companyDocs: (companyId: number) =>
    environment.orgUrl + `/company/${companyId}/documents`,

  fileUploadDownloadById: (fileId: number) =>
    `${environment.orgUrl}/file-upload/${fileId}/download`,

  policyDocs: (policyId: number) =>
    `${environment.policyUrl}/policy/${policyId}/documents`,

  policyDocsUpload: (policyId: number) =>
    `${environment.policyUrl}/policy/${policyId}/documents/upload`,

  //filters
  getFiltersPreference: environment.orgUrl + "/master/filter-preferences",
  saveFiltersPreference: environment.orgUrl + "/master/filter-preference",
  endorsementSteps: environment.policyUrl + `/policy/endorsement-steps`,

  nonGroupClaimActivityStepper: (claimId: number | null) =>
    `${environment.policyUrl}/non-group-claim/activity-stepper?claimId=${claimId}`,

  getNonGroupClaimActivityById: (claimActivityId: number) =>
    `${environment.policyUrl}/non-group-claim/activity-meta/${claimActivityId}`,

  getLocationsByCompanyId: (companyId: number) =>
    environment.orgUrl + `/company/${companyId}/locations`,

  getNonGroupClaimDataTable: environment.policyUrl + "/non-group-claim",
  // update-cd-balance
  accountNumberById: (id: number) =>
    environment.policyUrl + `/policy/caution-deposit/${id}/account-number`,
  coverUpdateByPolicyId: (id: number) =>
    environment.policyUrl + `/policy/${id}/covers`,

  auditHistoryByPolicyId: (policyId: number) =>
    environment.policyUrl +
    `/portal-configuration/policy/${policyId}/hospitals/transactions`,

  //policy Approvals

  policySectionApproval: (id: number) =>
    environment.policyUrl + `/policy/${id}/sections/approval`,
  policySectionSubmission: (id: number) =>
    environment.policyUrl + `/policy/${id}/sections/submission`,
  getInsurerByPolicyId: (policyId: number | undefined) =>
    environment.policyUrl + `/policy/${policyId}/insurers`,
  policySectionStatus: (id: number) =>
    environment.policyUrl + `/policy/${id}/sections/status`,
  policyPreviewDocument: (documentId: number) =>
    environment.policyUrl + `/policy/${documentId}/get-preview-document`,
  premiumCalculationDownload: (policyId: number, endorsementId: number) =>
    environment.policyUrl + `/policy/${policyId}/endorsement/${endorsementId}/premium-calculation-download`,
  //bulk assignments endpoints
  accountManager: (ownerId: number) =>
    environment.documentServiceUrl + `/bulk-edit/users-by-role/${ownerId}`,
  bulkEdit: environment.documentServiceUrl + "/bulk-edit",
  bulkBDRoleUsers: (organisationId: number) =>
    `${environment.documentServiceUrl}/bulk-edit/role-users/ROLE_BD_MANAGER/${organisationId}`,
  bulkISGRoleUsers: (organisationId: number) =>
    `${environment.documentServiceUrl}/bulk-edit/role-users/ROLE_ISG_MANAGER/${organisationId}`,

  // Poppins India SSO
  poppinsAccessUrl:
    environment.documentServiceUrl + "/external-app-sso/magic-url",

  //Faq's
  downloadFaqTemplate: (policyId: number) =>
    environment.policyUrl +
    `/portal-configuration/${policyId}/faq/template/download`,
  faqFileUploads:
    environment.policyUrl + "/portal-configuration/faq/bulk-upload",
  getFaqs: environment.policyUrl + "/portal-configuration/faq",
  getFaqsAuditLogs:
    environment.policyUrl + "/portal-configuration/faq/faq-uploads-log",
  faqExport: (policyId: string | number) =>
    environment.policyUrl + `/portal-configuration/faq/${policyId}/download`,

  //Policy feature documents
  portalConfigPolicyFeatureDocument: (policyId: string | number) =>
    environment.policyUrl +
    `/portal-configuration/${policyId}/feature-document`,
  portalConfigPolicyFeatureDocumentHistory: (policyId: string | number) =>
    environment.policyUrl +
    `/portal-configuration/${policyId}/feature-document?history=true`,
  portalConfigCompanyPolicyFeatureDocument: (companyId: string | number) =>
    environment.policyUrl +
    `/portal-configuration/company/${companyId}/feature-document`,

  // Hospital Network
  hospitalNetworkOverview: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policy/${policyId}/overview`,
  portalConfigHospitalNetworkLocations: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policy/${policyId}/locations`,
  getPortalConfigHospitalNetworks: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policy/hospitals/search/${policyId}`,
  portalConfigHospitalNetworkExport: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policies/${policyId}/hospitals/export`,

  // Contact Metrics
  policyPartyIds: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policy/${policyId}/tpa-insurer-info`,
  tpaContactsForPortal: (tpaId: string | number) =>
    `${environment.policyUrl}/portal-configuration/tpa/${tpaId}/contacts`,
  insurerContactsForPortal: (insurerId: string | number) =>
    `${environment.policyUrl}/portal-configuration/insurer/${insurerId}/contacts`,
  updateContactMatrix: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policy/${policyId}/contact-matrix`,
  getSubmittedContacts: (policyId: string | number) =>
    `${environment.policyUrl}/portal-configuration/policy/${policyId}/submitted/contacts`,
  getCronJobConfigurations: environment.schedulerUrl + `/cron-configurations`,
  updateCronJobConfiguration: (configId: number) =>
    environment.schedulerUrl + `/cron-configurations/${configId}`,
};

//Utility excel file upload
const utilityExcelFileUploadEndPoints = {
  entityFieldsByName: (entityName: string) =>
    `${environment.documentServiceUrl}/entity-fields?entityName=${entityName}`,
  mappingTemplates: `${environment.documentServiceUrl}/mapping-templates`,
  fetchMappingTemplate: (companyId: string | number, entityName: string) =>
    `${environment.documentServiceUrl}/mapping-templates?company_id=${companyId}&entity_name=${entityName}`,
  deleteMappingTemplate: (id: string | number) =>
    `${environment.documentServiceUrl}/mapping-templates/${id}`,
  restoreMappingTemplate: (id: string | number) =>
    `${environment.documentServiceUrl}/mapping-templates/restore/${id}`,
  insertSeedData: (policyId: string | number) =>
    `${environment.policyUrl}/policy/${policyId}/prepare-seed-data`,
};

const strapiEndPoints = {
  // SSO Authentication endpoints
  strapiAuthenticate: `${environment.strapiUrl}/api/auth-integration/authenticate`,
  strapiValidateToken: `${environment.strapiUrl}/api/auth-integration/validate-token`,
  strapiUserPermissions: (userId: string | number) =>
    `${environment.strapiUrl}/api/auth-integration/user-permissions/${userId}`,
  strapiRefreshPermissions: `${environment.strapiUrl}/api/auth-integration/refresh-permissions`,

  // Content API endpoints (require authentication)
  companyTemplate: (companyId: string | number) =>
    `${environment.strapiUrl}/api/company-templates/company/${companyId}?populate[config][populate][faqs]=*&populate[config][populate][footer]=*&populate[config][populate][contactMatrix][populate][hrContacts][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][hrContacts][populate][secondaryEscalation]=*&populate[config][populate][contactMatrix][populate][dpoContacts][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][dpoContacts][populate][secondaryEscalation]=*&populate[config][populate][contactMatrix][populate][grievanceContacts][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][grievanceContacts][populate][secondaryEscalation]=*&populate[config][populate][contactMatrix][populate][tpa][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][tpa][populate][secondaryEscalation]=*&populate[config][populate][contactMatrix][populate][broker][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][broker][populate][secondaryEscalation]=*&populate[config][populate][disclaimerNotes]=*&populate[config][populate][enrollmentYearRange]=*`,
  companyTemplateBySubdomain: (subdomain: string) =>
    `${environment.strapiUrl}/api/company-templates/subdomain/${subdomain}?populate[config][populate][faqs]=*&populate[config][populate][footer]=*&populate[config][populate][contactMatrix][populate][hrContacts][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][hrContacts][populate][secondaryEscalation]=*&populate[config][populate][contactMatrix][populate][dpoContacts][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][dpoContacts][populate][secondaryEscalation]=*&populate[config][populate][contactMatrix][populate][grievanceContacts][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][grievanceContacts][populate][secondaryEscalation]=*&populate[config][populate][contactMatrix][populate][tpa][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][tpa][populate][secondaryEscalation]=*&populate[config][populate][contactMatrix][populate][broker][populate][primaryEscalation]=*&populate[config][populate][contactMatrix][populate][broker][populate][secondaryEscalation]=*&populate[config][populate][disclaimerNotes]=*&populate[config][populate][enrollmentYearRange]=*`,
  policyTemplate: (companyId: string | number, policyId: string | number) =>
    `${environment.strapiUrl}/api/policy-templates/company/${companyId}/policy/${policyId}?populate[config][populate][compulsory][populate][infoPoints]=*&populate[config][populate][optional][populate][infoPoints]=*&populate[config][populate][flex][populate][infoPoints]=*&populate[config][populate][disclaimerNotes]=*&populate[config][populate][faqs]=*&populate[config][populate][policyNotes]=*`,
};
// Password Protection Configuration
const passwordProtectionConfigEndPoints = {
  getAllConfigs: `${environment.documentServiceUrl}/password-protection-config`,
  getConfigByKey: (categoryKey: string) =>
    `${environment.documentServiceUrl}/password-protection-config/${categoryKey}`,
  insertSeedData: (policyId: string | number) =>
    `${environment.policyUrl}/policy/${policyId}/prepare-seed-data`,
};
//Notes endpoints
const notesEndPoints = {
  getNotesByOptyActivityId: (opportunityActivityId: number) =>
    environment.opportunityUrl + `/note/activity/${opportunityActivityId}`,
  createNotes: environment.opportunityUrl + "/note",
  updateNote: (noteId: number) =>
    environment.opportunityUrl + `/note/${noteId}`,
  deleteNote: (noteId: number) =>
    environment.opportunityUrl + `/note/${noteId}`,
};

export const endPoints = {
  ...iworkEndPoints,
  ...ibpEndPoints,
  ...commonEndPoints,
  ...nl2sqlChatbotEndPoints,
  ...configServiceEndPoints,
  ...utilityExcelFileUploadEndPoints,
  ...strapiEndPoints,
  ...passwordProtectionConfigEndPoints,
  ...notesEndPoints,
};
