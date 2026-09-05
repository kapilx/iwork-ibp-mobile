export type PortalStatus = 'Draft' | 'Pending' | 'Rejected' | 'Active';

export interface Comment {
  id: string;
  section: string;
  field: string;
  text: string;
  author: string;
  date: string;
}

export interface AuthConfig {
  method: 'email-password' | 'mobile-otp' | 'employee-yob' | 'email-otp' | 'phone-password';
  // Email + Password config
  minPasswordLength?: string;
  characterType?: 'numbers' | 'alphabets' | 'alphanumeric';
  uppercaseRequirement?: 'none' | 'first' | 'last';
  specialCharacterRequired?: boolean;
  passwordExpiryDuration?: '30' | '60' | '90' | '120' | 'never';
  allowedLoginAttempts?: string;
  requireOldPassword?: boolean;
  sessionTimeout?: '15' | '20' | '25' | '30' | '35' | '40' | '45' | '50' | '55' | '60';
  enable2FA?: boolean;
  changePasswordOnFirstLogin?: boolean;
  // 2FA OTP config (when enabled)
  twoFactorDeliveryMethods?: ('email' | 'phone')[];
  otpLength?: '4' | '6' | '8';
  otpValidityDuration?: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
  resendOtpCooldown?: '30' | '60' | '90' | '120';
  otpRetryLimit?: '3' | '5';
  // Mobile + OTP config
  otpSessionTimeout?: '15' | '30' | '60';
  // Employee ID + YOB config
  requireIdFormat?: boolean;
  idFormat?: string;
  maxIdFailedAttempts?: string;
  // Phone + Password config
  enablePasswordResetViaOtp?: boolean;
  lockoutDuration?: string;
  failedLoginAttemptLimit?: '3' | '5' | '10';
}

export interface DashboardConfig {
  emotionalWellnessEnabled: boolean;
  physicalWellnessEnabled: boolean;
  retailInsuranceEnabled: boolean;
  emotionalSubOptions: {
    mentalHealthSupport: boolean;
    counselingServices: boolean;
    stressManagement: boolean;
    mindfulness: boolean;
  };
  physicalSubOptions: {
    fitnessTracking: boolean;
    nutritionGuidance: boolean;
    gymMembership: boolean;
    healthCheckups: boolean;
  };
  insuranceSubOptions: {
    policyManagement: boolean;
    claimsTracking: boolean;
    coverageInsights: boolean;
    tpaServices: boolean;
  };
}

export interface PolicySettings {
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  employerContribution: string;
  requireConfirmation: boolean;
  autoLockEnrollment: boolean;
  autoLockAfterConfirmation: boolean;
  disclaimerText?: string;
  isConfigured?: boolean;
}

export interface PolicyConfig {
  gmc: PolicySettings;
  gtl: PolicySettings;
  gpa: PolicySettings;
}

export interface PortalConfigData {
  portalStatus: PortalStatus;
  authConfig: AuthConfig;
  dashboardConfig: DashboardConfig;
  policyConfig: PolicyConfig;
  comments: Comment[];
  companyId: number;
  companyName: string;
}

export type CompanyOnboardingMailTriggerMode = "cron" | "manual";

export interface CompanyOnboardingMailModeResponse {
  companyId: number;
  mode: CompanyOnboardingMailTriggerMode;
}

export type AuthMethodCode =
  | "EMAIL_OTP"
  | "PHONE_OTP"
  | "SIMPLE_AUTH"
  | "GOOGLE_OAUTH"
  | "MICROSOFT_OAUTH"
  | string;

export interface AuthenticationMethod {
  id: number;
  methodCode: AuthMethodCode;
  methodName: string;
  description?: string;
  isActive?: boolean;
  configuration?: Record<string, any> | null;
  authenticationMethodKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UrlAndDomainConfig {
  fullUrl?: string | null;
}

export interface BrandingConfig {
  companyLogoFileId?: number | null;
  loginWelcomeMessage?:
    | {
        heading?: string | null;
        bodyText?: string | null;
      }
    | null;
}

export interface PasswordRequirements {
  uppercase?: { required: boolean; regex?: string | null };
  lowercase?: { required: boolean; regex?: string | null };
  numbers?: { required: boolean; regex?: string | null };
  special?: { required: boolean; regex?: string | null };
}

export interface PasswordPolicyConfig {
  minLength?: number;
  requirements?: PasswordRequirements;
  expiryDays?: number;
}

export interface AccountLockoutConfig {
  failedLoginAttemptLimit?: number;
  lockoutDurationHours?: number;
}

export interface SessionSettingsConfig {
  sessionTimeoutMinutes?: number;
}

export interface TwoFactorAuthConfig {
  enabled?: boolean;
  otpDeliveryMethod?: string | null;
  otpLength?: number;
  otpValidityMinutes?: number;
  resendOtpCooldownSeconds?: number;
  otpRetryLimit?: number;
}

export interface PasswordConfig {
  passwordPolicy?: PasswordPolicyConfig;
  enrollmentReminderDays?: number[];
  accountLockout?: AccountLockoutConfig;
  sessionSettings?: SessionSettingsConfig;
  changePasswordOnFirstLogin?: boolean;
  twoFactorAuthentication?: TwoFactorAuthConfig;
}

export interface PortalAuthenticationConfig {
  authentication_method_key?: string | null;
  authentication_method_id?: number | null;
  methodCode?: AuthMethodCode;
  passwordConfig?: PasswordConfig;
  sessionSettings?: SessionSettingsConfig;
  otpConfig?: Record<string, any>;
  twoFactorAuthentication?: TwoFactorAuthConfig;
  changePasswordOnFirstLogin?: boolean;
}

export interface PortalDashboardConfig {
  wellness?: {
    insuranceWellness?: { enabled?: boolean; options?: Record<string, boolean> };
    emotionalWellness?: { enabled?: boolean; options?: Record<string, boolean> };
    physicalWellness?: { enabled?: boolean; options?: Record<string, boolean> };
  };
  insurance?: {
    retailInsurance?: { enabled?: boolean; products?: Record<string, boolean> };
  };
  insuranceWellness?: { enabled?: boolean; options?: Record<string, boolean> };
  emotionalWellness?: { enabled?: boolean; options?: Record<string, boolean> };
  physicalWellness?: { enabled?: boolean; options?: Record<string, boolean> };
  retailInsurance?: { enabled?: boolean; products?: Record<string, boolean> };
}

export interface CompanyPortalConfigResponse {
  companyId: number | string;
  portalConfigId?: number | null;
  companyName?: string | null;
  subDomain?: string | null;
  companyConfigurationStatus?:
    | PortalStatus
    | string
    | null
    | {
        lid?: number;
        key?: string;
        value?: string;
      };
  companyPortalConfig?: {
    urlAndDomain?: UrlAndDomainConfig | null;
    authentication?: PortalAuthenticationConfig[];
    branding?: BrandingConfig | null;
  };
  companyPortalDashboardConfig?: PortalDashboardConfig | null;
  companyPolicyConfig?: Array<{
    policyId: string;
    policyName?: string;
    isConfigured?: boolean;
    enrollmentPeriod?: { startDate?: string | null; endDate?: string | null };
    settings?: {
      requireConfirmation?: boolean;
      autoLockEnrollment?: boolean;
      autoLockAfterConfirmation?: boolean;
      disclaimerText?: string;
    };
  }> | null;
  companyPortalWellnessConfig?: Record<string, any> | null;
  industry?: string | null;
  status?: PortalStatus | string | null;
  submittedAt?: string | null;
  mailServiceType?: string | null;
}
