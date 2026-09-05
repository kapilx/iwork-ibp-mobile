export interface PortalDashboardSection {
  enabled?: boolean;
  options?: Record<string, boolean>;
  products?: Record<string, boolean>;
}

export interface CompanyPortalDashboardConfig {
  wellness?: {
    retailInsurance?: PortalDashboardSection | null;
    physicalWellness?: PortalDashboardSection | null;
    emotionalWellness?: PortalDashboardSection | null;
    insuranceWellness?: PortalDashboardSection | null;
  } | null;
  retailInsurance?: PortalDashboardSection | null;
  physicalWellness?: PortalDashboardSection | null;
  emotionalWellness?: PortalDashboardSection | null;
  insuranceWellness?: PortalDashboardSection | null;
}

export interface CompanyPolicyConfigItem {
  policyId: string;
  policyName?: string;
  isConfigured?: boolean;
  enrollmentPeriod?: {
    startDate: string | null;
    endDate: string | null;
  } | null;
  settings?: Record<string, unknown>;
}

export interface PasswordRule {
  id: number;
  name: string;
  minChars?: number;
  isRequired?: boolean;
  regex?: string;
  errorMessage: string;
}

export interface PortalConfigurationResponseData {
  companyPortalDashboardConfig?: CompanyPortalDashboardConfig | null;
  companyPolicyConfig?: CompanyPolicyConfigItem[] | null;
  companyPortalConfig?: {
    branding?: {
      companyLogoFileId?: number | null;
      loginWelcomeMessage?: {
        heading?: string | null;
        bodyText?: string | null;
      } | null;
    } | null;
  } | null;
  passwordRules?: PasswordRule[] | null;
  dependentRelationConfig?: {
    relations?: Record<string, { maxCount: number }>;
    constraints?: Record<string, boolean | number>;
  } | null;
}
