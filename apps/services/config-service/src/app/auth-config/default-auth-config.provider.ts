import { Injectable } from "@nestjs/common";
import { AuthMethodResponse } from "./auth-config.service";

type DefaultCompanyConfig = {
  companyId: number | null;
  subDomain: string;
  logoFileId: number | null;
  companyLogoId: number | null;
  databaseConfig: null;
  portalBrandingConfig: Record<string, unknown>;
  passwordRules: Array<Record<string, unknown>>;
  country: string;
  isDefaultConfig: boolean;
};

type DefaultAuthConfigResponse = {
  companyId: number | null;
  companyConfig: DefaultCompanyConfig;
  authMethods: AuthMethodResponse[];
};

@Injectable()
export class DefaultAuthConfigProvider {
  private readonly defaultPasswordPolicy = {
    minLength: 5,
    requirements: {
      uppercase: { required: true, regex: "[A-Z]" },
      lowercase: { required: true, regex: "[a-z]" },
      numbers: { required: true, regex: "[0-9]" },
      special: { required: true, regex: "[^A-Za-z0-9]" },
    },
    expiryDays: 30,
  };

  private readonly defaultSessionSettings = {
    sessionTimeoutMinutes: 15,
  };
  private readonly defaultEnrollmentReminderDays = [0, 1, 2, 3, 5, 7];
  private readonly defaultPasswordRules = [
    {
      id: 1,
      name: "Length",
      minChars: 5,
      errorMessage: "Password must be at least 5 characters long",
    },
    {
      id: 2,
      name: "Uppercase",
      isRequired: true,
      regex: "[A-Z]",
      errorMessage: "Uppercase requirement not satisfied",
    },
    {
      id: 3,
      name: "Lowercase",
      isRequired: true,
      regex: "[a-z]",
      errorMessage: "Lowercase requirement not satisfied",
    },
    {
      id: 4,
      name: "Numbers",
      isRequired: true,
      regex: "[0-9]",
      errorMessage: "Numbers requirement not satisfied",
    },
    {
      id: 5,
      name: "Special",
      isRequired: true,
      regex: "[^A-Za-z0-9]",
      errorMessage: "Special requirement not satisfied",
    },
  ];

  private readonly methodBuilders: Record<string, () => AuthMethodResponse> = {
    USERNAME_PASSWORD: () => ({
      methodCode: "USERNAME_PASSWORD",
      methodName: "Username and Password",
      isEnabled: true,
      displayOrder: 5,
      authenticationMethodKey: "username_password",
      configuration: {},
    }),
    EMAIL_PASSWORD: () => ({
      methodCode: "EMAIL_PASSWORD",
      methodName: "Email and Password",
      isEnabled: true,
      displayOrder: 1,
      authenticationMethodKey: "email_password",
      configuration: {
        authentication_method_id: null,
        authentication_method_key: "email_password",
        methodCode: "EMAIL_PASSWORD",
        passwordConfig: {
          passwordPolicy: this.defaultPasswordPolicy,
          enrollmentReminderDays: this.defaultEnrollmentReminderDays,
          changePasswordOnFirstLogin: true,
          requireOldPassword: true,
          twoFactorAuthentication: {
            enabled: true,
            otpDeliveryMethod: "email",
            otpValidityMinutes: 1,
            resendOtpCooldownSeconds: 30,
          },
        },
        sessionSettings: this.defaultSessionSettings,
        enrollmentReminderDays: this.defaultEnrollmentReminderDays,
      },
    }),
    EMAIL_OTP: () => ({
      methodCode: "EMAIL_OTP",
      methodName: "Email OTP",
      isEnabled: true,
      displayOrder: 2,
      authenticationMethodKey: "email-otp",
      configuration: {
        authentication_method_id: null,
        authentication_method_key: "email-otp",
        methodCode: "EMAIL_OTP",
        otpConfig: {
          otpRetryLimit: 3,
          otpValidityMinutes: 1,
          resendOtpCooldownSeconds: 30,
        },
        sessionSettings: this.defaultSessionSettings,
        enrollmentReminderDays: this.defaultEnrollmentReminderDays,
      },
    }),
    PHONE_PASSWORD: () => ({
      methodCode: "PHONE_PASSWORD",
      methodName: "Phone and Password",
      isEnabled: true,
      displayOrder: 3,
      authenticationMethodKey: "phone_password",
      configuration: {
        authentication_method_id: null,
        authentication_method_key: "phone_password",
        methodCode: "PHONE_PASSWORD",
        otpConfig: {
          otpRetryLimit: 3,
          otpValidityMinutes: 5,
          resendOtpCooldownSeconds: 60,
        },
        passwordConfig: {
          passwordPolicy: {
            ...this.defaultPasswordPolicy,
            minLength: 8,
          },
          enrollmentReminderDays: this.defaultEnrollmentReminderDays,
          changePasswordOnFirstLogin: true,
          requireOldPassword: true,
          twoFactorAuthentication: {
            enabled: true,
            otpDeliveryMethod: "phone",
            otpValidityMinutes: 5,
            resendOtpCooldownSeconds: 60,
          },
        },
        sessionSettings: this.defaultSessionSettings,
        enrollmentReminderDays: this.defaultEnrollmentReminderDays,
      },
    }),
    PHONE_OTP: () => ({
      methodCode: "PHONE_OTP",
      methodName: "Phone OTP",
      isEnabled: true,
      displayOrder: 4,
      authenticationMethodKey: "mobile-otp",
      configuration: {
        authentication_method_id: null,
        authentication_method_key: "mobile-otp",
        methodCode: "PHONE_OTP",
        otpConfig: {
          otpRetryLimit: 3,
          otpValidityMinutes: 1,
          resendOtpCooldownSeconds: 30,
        },
        sessionSettings: this.defaultSessionSettings,
        enrollmentReminderDays: this.defaultEnrollmentReminderDays,
      },
    }),
  };

  buildDefaultCompanyAuthConfig(
    requestedSubdomain?: string,
  ): DefaultAuthConfigResponse {
    const normalizedSubdomain = String(requestedSubdomain || "").trim();
    const effectiveSubdomain = normalizedSubdomain || "localhost";

    const authMethods = [
      this.methodBuilders.EMAIL_PASSWORD(),
      this.methodBuilders.EMAIL_OTP(),
      this.methodBuilders.PHONE_PASSWORD(),
      this.methodBuilders.PHONE_OTP(),
      this.methodBuilders.USERNAME_PASSWORD(),
    ];

    return {
      companyId: null,
      companyConfig: {
        companyId: null,
        subDomain: effectiveSubdomain,
        logoFileId: null,
        companyLogoId: null,
        databaseConfig: null,
        portalBrandingConfig: {
          companyLogoFileId: null,
          loginWelcomeMessage: {
            heading: "Welcome to Insurance and Wellness Hub",
            bodyText: "Complete healthcare coverage for you and your family",
          },
        },
        passwordRules: this.defaultPasswordRules,
        country: "India",
        isDefaultConfig: true,
      },
      authMethods,
    };
  }
}
