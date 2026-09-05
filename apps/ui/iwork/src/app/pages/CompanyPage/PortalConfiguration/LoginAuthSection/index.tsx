import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Drawer, IconButton, TextField } from "@mui/material";
import { isCopyPasteAllowedForOrg } from "@ui/ui-lib";
import {
  PhoneAndroid as MobileIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Badge as BadgeIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import {
  AuthMethodGrid,
  PasswordPolicySection,
  PasswordExpirySection,
  EnrollmentReminderSection,
  AccountLockoutSection,
  SessionTimeoutSection,
  TwoFactorAuthSection,
  OTPConfigSection,
  ChangePasswordPolicySection,
} from "./loginMethods";
import type { AuthMethod, AuthMethodOption } from "./loginMethods";
import {
  SectionDescription,
  ConfigSection,
  DrawerHeader,
  DrawerTitle,
  DrawerSubtitle,
  DrawerContent,
  ConfigSectionTitle,
  ConfigSectionSubtitle,
  InfoAlert,
  LoginConfigurationContainer,
  Label,
  CommonToggle,
  InfoIconStyled,
  AlertText,
  SectionHeader,
  SectionIcon,
  SectionIconLarge,
  TextFieldLabel,
  HelperText,
  LabelWithDescription,
  LabelTitle,
  LabelDescriptionText,
  DrawerFooter,
  PrimaryButton,
  DrawerWrapper,
  ConfigurationTitle,
  ConfigurationDescription,
  FlexContainer,
} from "./styles";
import {
  AUTH_METHOD_LABELS,
  AUTH_METHOD_DESCRIPTIONS,
  METHOD_CODES,
  METHOD_KEYS,
  SECTION_TITLES,
  SECTION_DESCRIPTIONS,
  FIELD_LABELS,
  TOGGLE_LABELS,
  BUTTON_LABELS,
  HELPER_TEXT,
  ALERT_MESSAGES,
  CONFIG_TITLES,
  DEFAULT_VALUES,
} from "./constants";
import { AuthenticationMethod } from "../types";

// Set of allowed authentication method codes for filtering
const ALLOWED_METHOD_CODES = new Set([
  METHOD_CODES.EMAIL_PASSWORD,
  METHOD_CODES.PHONE_PASSWORD,
  METHOD_CODES.USERNAME_PASSWORD,
  METHOD_CODES.EMAIL_OTP,
  METHOD_CODES.PHONE_OTP,
]);

// Default authentication methods configuration for the login section
const DEFAULT_AUTH_METHODS: AuthMethodOption[] = [
  {
    id: METHOD_KEYS.EMAIL_PASSWORD as AuthMethod,
    icon: EmailIcon,
    label: AUTH_METHOD_LABELS.EMAIL_PASSWORD,
    description: AUTH_METHOD_DESCRIPTIONS.EMAIL_PASSWORD,
    methodCode: METHOD_CODES.EMAIL_PASSWORD,
    methodKey: METHOD_KEYS.EMAIL_PASSWORD,
  },
  {
    id: METHOD_KEYS.EMAIL_OTP as AuthMethod,
    icon: EmailIcon,
    label: AUTH_METHOD_LABELS.EMAIL_OTP,
    description: AUTH_METHOD_DESCRIPTIONS.EMAIL_OTP,
    methodCode: METHOD_CODES.EMAIL_OTP,
    methodKey: METHOD_KEYS.EMAIL_OTP,
  },
  {
    id: METHOD_KEYS.MOBILE_OTP as AuthMethod,
    icon: MobileIcon,
    label: AUTH_METHOD_LABELS.MOBILE_OTP,
    description: AUTH_METHOD_DESCRIPTIONS.MOBILE_OTP,
    methodCode: METHOD_CODES.PHONE_OTP,
    methodKey: METHOD_KEYS.MOBILE_OTP,
  },
  {
    id: METHOD_KEYS.PHONE_PASSWORD as AuthMethod,
    icon: MobileIcon,
    label: AUTH_METHOD_LABELS.PHONE_PASSWORD,
    description: AUTH_METHOD_DESCRIPTIONS.PHONE_PASSWORD,
    methodCode: METHOD_CODES.PHONE_PASSWORD,
    methodKey: METHOD_KEYS.PHONE_PASSWORD,
  },
  {
    id: METHOD_KEYS.EMPLOYEE_ID as AuthMethod,
    icon: BadgeIcon,
    label: AUTH_METHOD_LABELS.EMPLOYEE_ID,
    description: AUTH_METHOD_DESCRIPTIONS.EMPLOYEE_ID,
    methodCode: METHOD_CODES.USERNAME_PASSWORD,
    methodKey: METHOD_KEYS.EMPLOYEE_ID,
  },
];

export interface AuthenticationConfigState {
  method: AuthMethod;
  methods?: AuthMethod[]; // Array of all selected methods for multi-select
  methodCode?: string;
  methodId?: number | null;
  methodKey?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perMethodConfigs?: Record<string, any>;
  minPasswordLength?: string;
  passwordRequirements: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
  };
  passwordExpiry?: string;
  enrollmentReminderDays?: number[];
  allowedLoginAttempts?: string;
  lockoutDuration?: string;
  changePasswordOnFirstLogin?: boolean;
  requireOldPassword?: boolean;
  sessionTimeout?: string;
  enable2FA?: boolean;
  otpDelivery?: string;
  otpLength?: string;
  otpValidity?: string;
  resendOtpCooldown?: string;
  maxOtpAttempts?: string;
  employeeIdFormat?: string;
  enableIdValidation?: boolean;
  maxFailedAttempts?: string;
}

interface LoginAuthSectionProps {
  selectedMethod?: AuthMethod;
  onMethodChange?: (method: AuthMethod) => void;
  onConfigChange?: (config: AuthenticationConfigState) => void;
  config?: AuthenticationConfigState;
  availableMethods?: AuthenticationMethod[];
  hideEmployeeIdMethod?: boolean;
}

const DEFAULT_PASSWORD_REQUIREMENTS = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  special: true,
};

const normalizeMethodKey = (method?: string): AuthMethod => {
  const normalized = method?.toLowerCase().replace(/_/g, "-");
  switch (normalized) {
    case METHOD_KEYS.EMAIL_OTP:
      return METHOD_KEYS.EMAIL_OTP as AuthMethod;
    case "mobile-otp":
    case "phone-otp":
      return METHOD_KEYS.MOBILE_OTP as AuthMethod;
    case METHOD_KEYS.PHONE_PASSWORD:
      return METHOD_KEYS.PHONE_PASSWORD as AuthMethod;
    case METHOD_KEYS.EMPLOYEE_ID:
    case "username-password":
      return METHOD_KEYS.EMPLOYEE_ID as AuthMethod;
    case METHOD_KEYS.OAUTH:
      return METHOD_KEYS.OAUTH as AuthMethod;
    case METHOD_KEYS.EMAIL_PASSWORD:
    default:
      return METHOD_KEYS.EMAIL_PASSWORD as AuthMethod;
  }
};

// Returns the default method key based on the authentication method type
const getDefaultMethodKey = (method: AuthMethod): string => {
  switch (method) {
    case METHOD_KEYS.EMAIL_OTP:
      return METHOD_KEYS.EMAIL_OTP;
    case METHOD_KEYS.MOBILE_OTP:
      return METHOD_KEYS.MOBILE_OTP;
    case METHOD_KEYS.PHONE_PASSWORD:
      return METHOD_KEYS.PHONE_PASSWORD;
    case METHOD_KEYS.EMPLOYEE_ID:
      return METHOD_KEYS.EMPLOYEE_ID;
    case METHOD_KEYS.EMAIL_PASSWORD:
    default:
      return METHOD_KEYS.EMAIL_PASSWORD;
  }
};

const getDefaultOtpDeliveryForMethod = (method: AuthMethod): string => {
  switch (method) {
    case METHOD_KEYS.EMAIL_PASSWORD:
    case METHOD_KEYS.EMAIL_OTP:
      return "email";
    case METHOD_KEYS.MOBILE_OTP:
    case METHOD_KEYS.PHONE_PASSWORD:
      return "phone";
    case METHOD_KEYS.EMPLOYEE_ID:
      return "email";
    default:
      return DEFAULT_VALUES.OTP_DELIVERY;
  }
};

// Maps method code from backend API to internal AuthMethod type
const mapMethodCodeToAuthMethod = (
  methodCode?: string,
  methodKey?: string
): AuthMethod => {
  // If no method code provided, fallback to method key
  if (!methodCode && methodKey) {
    return normalizeMethodKey(methodKey);
  }

  // Map method code to corresponding auth method
  switch (methodCode) {
    case METHOD_CODES.EMAIL_PASSWORD:
      return METHOD_KEYS.EMAIL_PASSWORD as AuthMethod;
    case METHOD_CODES.PHONE_PASSWORD:
      return METHOD_KEYS.PHONE_PASSWORD as AuthMethod;
    case METHOD_CODES.USERNAME_PASSWORD:
      return METHOD_KEYS.EMPLOYEE_ID as AuthMethod;
    case METHOD_CODES.EMAIL_OTP:
      return METHOD_KEYS.EMAIL_OTP as AuthMethod;
    case METHOD_CODES.PHONE_OTP:
      return METHOD_KEYS.MOBILE_OTP as AuthMethod;
    default:
      return normalizeMethodKey(methodKey);
  }
};

export const LoginAuthSection = forwardRef<
  HTMLDivElement,
  LoginAuthSectionProps
>(
  (
    {
      selectedMethod = "email-password",
      onMethodChange,
      onConfigChange,
      config,
      availableMethods,
      hideEmployeeIdMethod = false,
    },
    ref
  ) => {
    const skipNextConfigEmissionRef = useRef(false);
    const lastEmittedConfigRef = useRef("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentlyConfiguringMethod, setCurrentlyConfiguringMethod] = useState<AuthMethod>(
      normalizeMethodKey(config?.method ?? selectedMethod)
    );
    const [localSelectedMethod, setLocalSelectedMethod] = useState<AuthMethod>(
      normalizeMethodKey(config?.method ?? selectedMethod)
    );
    const [localSelectedMethods, setLocalSelectedMethods] = useState<AuthMethod[]>(
      config?.methods
        ? config.methods.map(normalizeMethodKey)
        : DEFAULT_AUTH_METHODS.map((m) => m.id as AuthMethod)
    );
    const [selectedMethodCode, setSelectedMethodCode] = useState<
      string | undefined
    >(config?.methodCode);
    const [selectedMethodId, setSelectedMethodId] = useState<
      number | null | undefined
    >(config?.methodId);
    const [selectedMethodKey, setSelectedMethodKey] = useState<
      string | null | undefined
    >(
      config?.methodKey
        ? getDefaultMethodKey(normalizeMethodKey(config.methodKey))
        : getDefaultMethodKey(
            normalizeMethodKey(config?.method ?? selectedMethod)
          )
    );

    // Password configuration state variables
    const [minPasswordLength, setMinPasswordLength] = useState(
      config?.minPasswordLength ?? DEFAULT_VALUES.MIN_PASSWORD_LENGTH
    );
    const [passwordRequirements, setPasswordRequirements] = useState(
      config?.passwordRequirements ?? { ...DEFAULT_PASSWORD_REQUIREMENTS }
    );
    const [passwordExpiry, setPasswordExpiry] = useState(
      config?.passwordExpiry ?? DEFAULT_VALUES.PASSWORD_EXPIRY
    );
    const [enrollmentReminderDays, setEnrollmentReminderDays] = useState<number[]>(
      config?.enrollmentReminderDays ?? [...DEFAULT_VALUES.ENROLLMENT_REMINDER_DAYS]
    );
    const [allowedLoginAttempts, setAllowedLoginAttempts] = useState(
      config?.allowedLoginAttempts ?? DEFAULT_VALUES.ALLOWED_LOGIN_ATTEMPTS
    );
    const [lockoutDuration, setLockoutDuration] = useState(
      config?.lockoutDuration ?? DEFAULT_VALUES.LOCKOUT_DURATION
    );
    const [changePasswordOnFirstLogin, setChangePasswordOnFirstLogin] =
      useState(config?.changePasswordOnFirstLogin ?? true);
    const [requireOldPassword, setRequireOldPassword] = useState(
      config?.requireOldPassword ?? false
    );
    const [sessionTimeout, setSessionTimeout] = useState(
      config?.sessionTimeout ?? DEFAULT_VALUES.SESSION_TIMEOUT
    );
    const [enable2FA, setEnable2FA] = useState(config?.enable2FA ?? false);
    const [otpDelivery, setOtpDelivery] = useState(
      config?.otpDelivery ?? DEFAULT_VALUES.OTP_DELIVERY
    );
    const [otpLength, setOtpLength] = useState(
      config?.otpLength ?? DEFAULT_VALUES.OTP_LENGTH
    );
    const [otpValidity, setOtpValidity] = useState(
      config?.otpValidity ?? DEFAULT_VALUES.OTP_VALIDITY
    );
    const [resendOtpCooldown, setResendOtpCooldown] = useState(
      config?.resendOtpCooldown ?? DEFAULT_VALUES.RESEND_OTP_COOLDOWN
    );
    const [maxOtpAttempts, setMaxOtpAttempts] = useState(
      config?.maxOtpAttempts ?? DEFAULT_VALUES.MAX_OTP_ATTEMPTS
    );
    const [employeeIdFormat, setEmployeeIdFormat] = useState(
      config?.employeeIdFormat ?? DEFAULT_VALUES.EMPLOYEE_ID_FORMAT
    );
    const [enableIdValidation, setEnableIdValidation] = useState(
      config?.enableIdValidation ?? true
    );
    const [maxFailedAttempts, setMaxFailedAttempts] = useState(
      config?.maxFailedAttempts ?? DEFAULT_VALUES.MAX_FAILED_ATTEMPTS
    );
    // Per-method configuration map — each method's drawer settings are stored independently
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [methodConfigs, setMethodConfigs] = useState<Record<string, any>>(
      config?.perMethodConfigs ?? {}
    );
    const shouldShowOtpRetryLimit =
      localSelectedMethod !== METHOD_KEYS.EMAIL_PASSWORD &&
      localSelectedMethod !== METHOD_KEYS.PHONE_PASSWORD &&
      localSelectedMethod !== METHOD_KEYS.EMAIL_OTP &&
      localSelectedMethod !== METHOD_KEYS.MOBILE_OTP;
    const showChangePasswordFirstLogin =
      localSelectedMethod !== METHOD_KEYS.EMAIL_PASSWORD &&
      localSelectedMethod !== METHOD_KEYS.PHONE_PASSWORD;

    // Synchronize component state with external config prop when it changes
    useEffect(() => {
      if (!config) {
        return;
      }

      skipNextConfigEmissionRef.current = true;
      const nextMethod = normalizeMethodKey(config.method ?? selectedMethod);
      setLocalSelectedMethod(nextMethod);
      
      // Initialize multiple selected methods from config.
      // If no methods array is saved yet, default to all available methods.
      const configMethods = (config as any).methods?.length
        ? (config as any).methods
        : DEFAULT_AUTH_METHODS.map((m) => m.id);
      const selectedMethods = configMethods.map(normalizeMethodKey);
      setLocalSelectedMethods(selectedMethods);
      setSelectedMethodCode(config.methodCode);
      setSelectedMethodId(config.methodId);
      setSelectedMethodKey(
        config.methodKey
          ? getDefaultMethodKey(normalizeMethodKey(config.methodKey))
          : getDefaultMethodKey(nextMethod)
      );
      setMinPasswordLength(
        config.minPasswordLength ?? DEFAULT_VALUES.MIN_PASSWORD_LENGTH
      );
      setPasswordRequirements(
        config.passwordRequirements ?? { ...DEFAULT_PASSWORD_REQUIREMENTS }
      );
      setPasswordExpiry(
        config.passwordExpiry ?? DEFAULT_VALUES.PASSWORD_EXPIRY
      );
      setEnrollmentReminderDays(
        config.enrollmentReminderDays ?? [...DEFAULT_VALUES.ENROLLMENT_REMINDER_DAYS]
      );
      setAllowedLoginAttempts(
        config.allowedLoginAttempts ?? DEFAULT_VALUES.ALLOWED_LOGIN_ATTEMPTS
      );
      setLockoutDuration(
        config.lockoutDuration ?? DEFAULT_VALUES.LOCKOUT_DURATION
      );
      setChangePasswordOnFirstLogin(config.changePasswordOnFirstLogin ?? true);
      setRequireOldPassword(config.requireOldPassword ?? false);
      setSessionTimeout(
        config.sessionTimeout ?? DEFAULT_VALUES.SESSION_TIMEOUT
      );
      setEnable2FA(config.enable2FA ?? false);
      setOtpDelivery(
        config.otpDelivery ?? getDefaultOtpDeliveryForMethod(nextMethod)
      );
      setOtpValidity(config.otpValidity ?? DEFAULT_VALUES.OTP_VALIDITY);
      setResendOtpCooldown(
        config.resendOtpCooldown ?? DEFAULT_VALUES.RESEND_OTP_COOLDOWN
      );
      setMaxOtpAttempts(
        config.maxOtpAttempts ?? DEFAULT_VALUES.MAX_OTP_ATTEMPTS
      );
      setEmployeeIdFormat(
        config.employeeIdFormat ?? DEFAULT_VALUES.EMPLOYEE_ID_FORMAT
      );
      setEnableIdValidation(config.enableIdValidation ?? true);
      setMaxFailedAttempts(
        config.maxFailedAttempts ?? DEFAULT_VALUES.MAX_FAILED_ATTEMPTS
      );
      // Overwrite per-method configs from incoming config prop (e.g. from API GET)
      setMethodConfigs(config.perMethodConfigs ?? {});
    }, [config, selectedMethod]);

    // Build available auth methods from API or use defaults
    const baseMethodList = useMemo(
      () =>
        hideEmployeeIdMethod
          ? DEFAULT_AUTH_METHODS.filter(
              (method) => method.id !== METHOD_KEYS.EMPLOYEE_ID
            )
          : DEFAULT_AUTH_METHODS,
      [hideEmployeeIdMethod]
    );

    const authMethods = useMemo(() => {
      if (!availableMethods?.length) {
        return baseMethodList;
      }

      const mapped = availableMethods
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((method) => ALLOWED_METHOD_CODES.has(method.methodCode as any))
        .map((method) => {
          const mappedId = mapMethodCodeToAuthMethod(
            method.methodCode,
            method.authenticationMethodKey ?? undefined
          );
          const base = baseMethodList.find((item) => item.id === mappedId);
          if (!base) {
            return null;
          }
          return {
            ...base,
            methodCode: method.methodCode,
            methodId: method.id,
            methodKey: method.authenticationMethodKey
              ? getDefaultMethodKey(
                  normalizeMethodKey(method.authenticationMethodKey)
                )
              : getDefaultMethodKey(mappedId),
            label: method.methodName || base.label,
            description: method.description || base.description,
          };
        })
        .filter(Boolean) as AuthMethodOption[];

      return mapped;
    }, [availableMethods, baseMethodList]);

    const selectedMethodMeta = useMemo(
      () => authMethods.find((method) => method.id === localSelectedMethod),
      [authMethods, localSelectedMethod]
    );

    // Auto-select first method if no method is selected
    useEffect(() => {
      if (selectedMethodCode || !authMethods.length) {
        return;
      }
      handleMethodSelect(authMethods[0]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authMethods, selectedMethodCode]);

    // Ensure selected method exists in available methods
    useEffect(() => {
      if (!authMethods.length) {
        return;
      }
      const exists = authMethods.some(
        (method) => method.id === localSelectedMethod
      );
      if (!exists) {
        handleMethodSelect(authMethods[0]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authMethods, localSelectedMethod]);

    const computedConfig = useMemo(
      () => {
        // Use the first selected method as the primary method for backward compatibility
        const primaryMethod = localSelectedMethods.length > 0 ? localSelectedMethods[0] : localSelectedMethod;
        
        return {
          method: primaryMethod,
          methods: localSelectedMethods, // Add array of all selected methods for future use
          methodCode: selectedMethodCode ?? selectedMethodMeta?.methodCode,
          methodId: selectedMethodId ?? selectedMethodMeta?.methodId ?? null,
          methodKey:
            selectedMethodKey ??
            selectedMethodMeta?.methodKey ??
            getDefaultMethodKey(primaryMethod),
          minPasswordLength,
          passwordRequirements,
          passwordExpiry,
          enrollmentReminderDays,
          allowedLoginAttempts:
            primaryMethod === METHOD_KEYS.EMAIL_PASSWORD ||
            primaryMethod === METHOD_KEYS.PHONE_PASSWORD
              ? undefined
              : allowedLoginAttempts,
          lockoutDuration:
            primaryMethod === METHOD_KEYS.EMAIL_PASSWORD ||
            primaryMethod === METHOD_KEYS.PHONE_PASSWORD
              ? undefined
              : lockoutDuration,
          changePasswordOnFirstLogin: showChangePasswordFirstLogin
            ? changePasswordOnFirstLogin
            : undefined,
          requireOldPassword,
          sessionTimeout,
          enable2FA,
          otpDelivery: enable2FA ? otpDelivery : "",
          otpValidity,
          resendOtpCooldown,
          maxOtpAttempts: shouldShowOtpRetryLimit ? maxOtpAttempts : undefined,
          employeeIdFormat,
          enableIdValidation,
          maxFailedAttempts:
            primaryMethod === METHOD_KEYS.EMPLOYEE_ID
              ? maxFailedAttempts
              : undefined,
          perMethodConfigs: methodConfigs,
        };
      },
      [
        localSelectedMethod,
        localSelectedMethods,
        selectedMethodCode,
        selectedMethodId,
        selectedMethodMeta,
        selectedMethodKey,
        minPasswordLength,
        passwordRequirements,
        passwordExpiry,
        enrollmentReminderDays,
        allowedLoginAttempts,
        lockoutDuration,
        changePasswordOnFirstLogin,
        showChangePasswordFirstLogin,
        requireOldPassword,
        sessionTimeout,
        enable2FA,
        otpDelivery,
        otpValidity,
        resendOtpCooldown,
        maxOtpAttempts,
        employeeIdFormat,
        enableIdValidation,
        maxFailedAttempts,
        shouldShowOtpRetryLimit,
        methodConfigs,
      ]
    );

    // Notify parent component when configuration changes, avoiding loops on identical payloads or prop syncs
    useEffect(() => {
      if (!onConfigChange) {
        return;
      }

      const serializedConfig = JSON.stringify(computedConfig);

      if (skipNextConfigEmissionRef.current) {
        skipNextConfigEmissionRef.current = false;
        lastEmittedConfigRef.current = serializedConfig;
        return;
      }

      if (lastEmittedConfigRef.current === serializedConfig) {
        return;
      }

      lastEmittedConfigRef.current = serializedConfig;
      onConfigChange(computedConfig);
    }, [computedConfig, onConfigChange]);

    // Handle selection of authentication method from the grid (multi-select)
    const handleMethodSelect = (method: AuthMethodOption) => {
      const methodKey = method.methodKey
        ? getDefaultMethodKey(normalizeMethodKey(method.methodKey))
        : getDefaultMethodKey(method.id);
      
      // Ensure next config emission is not skipped due to previous prop sync
      skipNextConfigEmissionRef.current = false;
      lastEmittedConfigRef.current = "";
      
      // Toggle method in selectedMethods array
      setLocalSelectedMethods(prev => {
        const isSelected = prev.includes(method.id as AuthMethod);
        if (isSelected) {
          // Remove method if already selected
          return prev.filter(m => m !== method.id);
        } else {
          // Add method if not selected
          return [...prev, method.id as AuthMethod];
        }
      });
      
      // For backward compatibility, set the first selected method as primary
      setLocalSelectedMethod(method.id as AuthMethod);
      setSelectedMethodCode(method.methodCode || method.id);
      setSelectedMethodId(method.methodId);
      setSelectedMethodKey(methodKey);
      setOtpDelivery(getDefaultOtpDeliveryForMethod(method.id as AuthMethod));
      onMethodChange?.(method.id);
    };

    useEffect(() => {
      if (!enable2FA) {
        return;
      }

      if (!otpDelivery) {
        setOtpDelivery(getDefaultOtpDeliveryForMethod(currentlyConfiguringMethod));
      }
    }, [enable2FA, currentlyConfiguringMethod, otpDelivery]);

    // Open the configuration drawer for a specific method
    const handleMethodConfigure = (method: AuthMethodOption) => {
      const methodId = method.id as AuthMethod;
      setCurrentlyConfiguringMethod(method.methodKey as AuthMethod);

      // Load this method's previously saved config into the shared state vars
      const saved = methodConfigs[methodId] || {};
      setMinPasswordLength(saved.minPasswordLength ?? DEFAULT_VALUES.MIN_PASSWORD_LENGTH);
      setPasswordRequirements(saved.passwordRequirements ?? { ...DEFAULT_PASSWORD_REQUIREMENTS });
      setPasswordExpiry(saved.passwordExpiry ?? DEFAULT_VALUES.PASSWORD_EXPIRY);
      setEnrollmentReminderDays(saved.enrollmentReminderDays ?? [...DEFAULT_VALUES.ENROLLMENT_REMINDER_DAYS]);
      setAllowedLoginAttempts(saved.allowedLoginAttempts ?? DEFAULT_VALUES.ALLOWED_LOGIN_ATTEMPTS);
      setLockoutDuration(saved.lockoutDuration ?? DEFAULT_VALUES.LOCKOUT_DURATION);
      setChangePasswordOnFirstLogin(saved.changePasswordOnFirstLogin ?? true);
      setRequireOldPassword(saved.requireOldPassword ?? false);
      setSessionTimeout(saved.sessionTimeout ?? DEFAULT_VALUES.SESSION_TIMEOUT);
      setEnable2FA(saved.enable2FA ?? false);
      setOtpDelivery(saved.otpDelivery ?? getDefaultOtpDeliveryForMethod(methodId));
      setOtpLength(saved.otpLength ?? DEFAULT_VALUES.OTP_LENGTH);
      setOtpValidity(saved.otpValidity ?? DEFAULT_VALUES.OTP_VALIDITY);
      setResendOtpCooldown(saved.resendOtpCooldown ?? DEFAULT_VALUES.RESEND_OTP_COOLDOWN);
      setMaxOtpAttempts(saved.maxOtpAttempts ?? DEFAULT_VALUES.MAX_OTP_ATTEMPTS);
      setEmployeeIdFormat(saved.employeeIdFormat ?? DEFAULT_VALUES.EMPLOYEE_ID_FORMAT);
      setEnableIdValidation(saved.enableIdValidation ?? true);
      setMaxFailedAttempts(saved.maxFailedAttempts ?? DEFAULT_VALUES.MAX_FAILED_ATTEMPTS);

      setDrawerOpen(true);
    };

    // Open the configuration drawer (legacy)
    const handleConfigureClick = () => {
      setDrawerOpen(true);
    };

    // Close the configuration drawer without saving
    const handleDrawerClose = () => {
      setDrawerOpen(false);
    };

    // Save configuration and close drawer
    const handleSaveConfiguration = () => {
      // Persist the current drawer's state vars back to the per-method config map
      setMethodConfigs(prev => ({
        ...prev,
        [currentlyConfiguringMethod]: {
          minPasswordLength,
          passwordRequirements,
          passwordExpiry,
          enrollmentReminderDays,
          allowedLoginAttempts,
          lockoutDuration,
          changePasswordOnFirstLogin,
          requireOldPassword,
          sessionTimeout,
          enable2FA,
          otpDelivery,
          otpLength,
          otpValidity,
          resendOtpCooldown,
          maxOtpAttempts,
          employeeIdFormat,
          enableIdValidation,
          maxFailedAttempts,
        },
      }));
      setDrawerOpen(false);
    };

    // Returns configuration content based on selected authentication method
    const getConfigurationContent = () => {
      // Email + Password Configuration
      if (currentlyConfiguringMethod === METHOD_KEYS.EMAIL_PASSWORD) {
        return (
          <>
            {/* Alert: Onboarding message sent via email */}
            <InfoAlert>
              <InfoIconStyled as={InfoIcon} />
              <AlertText>{ALERT_MESSAGES.EMAIL_ONBOARDING}</AlertText>
            </InfoAlert>

            {/* Password Policy Configuration */}
            <PasswordPolicySection
              minPasswordLength={minPasswordLength}
              onMinPasswordLengthChange={setMinPasswordLength}
              passwordRequirements={passwordRequirements}
              onPasswordRequirementsChange={setPasswordRequirements}
            />

            {/* Password Expiry Configuration */}
            <PasswordExpirySection
              passwordExpiryDuration={passwordExpiry}
              onPasswordExpiryDurationChange={setPasswordExpiry}
            />

            {/* Change Password Policy */}
            <ChangePasswordPolicySection
              requireOldPassword={requireOldPassword}
              onRequireOldPasswordChange={setRequireOldPassword}
              changePasswordOnFirstLogin={changePasswordOnFirstLogin}
              onChangePasswordOnFirstLoginChange={setChangePasswordOnFirstLogin}
              showChangePasswordOnFirstLogin={showChangePasswordFirstLogin}
            />

            {/* Session Timeout Configuration */}
            <SessionTimeoutSection
              sessionTimeout={sessionTimeout}
              onSessionTimeoutChange={setSessionTimeout}
            />

            {/* Two Factor Authentication Configuration */}
            <TwoFactorAuthSection
              enable2FA={enable2FA}
              onEnable2FAChange={setEnable2FA}
              twoFactorDelivery={otpDelivery}
              onTwoFactorDeliveryChange={setOtpDelivery}
              showDeliveryOptions={true}
              twoFactorOTPValidity={otpValidity}
              onTwoFactorOTPValidityChange={setOtpValidity}
              twoFactorOTPCooldown={resendOtpCooldown}
              onTwoFactorOTPCooldownChange={setResendOtpCooldown}
              maxOtpAttempts={
                shouldShowOtpRetryLimit ? maxOtpAttempts : undefined
              }
              onMaxOtpAttemptsChange={
                shouldShowOtpRetryLimit ? setMaxOtpAttempts : undefined
              }
            />

             <EnrollmentReminderSection
              reminderDays={enrollmentReminderDays}
              onReminderDaysChange={setEnrollmentReminderDays}
            />
          </>
        );
      }

      // Email + OTP Configuration
      if (currentlyConfiguringMethod === METHOD_KEYS.EMAIL_OTP) {
        return (
          <>
            {/* Alert: Onboarding message sent via email */}
            <InfoAlert>
              <InfoIconStyled as={InfoIcon} />
              <AlertText>{ALERT_MESSAGES.EMAIL_ONBOARDING}</AlertText>
            </InfoAlert>

            {/* OTP Configuration Section */}
            <OTPConfigSection
              authType="email"
              otpValidity={otpValidity}
              onOTPValidityChange={setOtpValidity}
              otpCooldown={resendOtpCooldown}
              onOTPCooldownChange={setResendOtpCooldown}
            />

            {/* Session Settings */}
            <SessionTimeoutSection
              authType="email"
              sessionTimeout={sessionTimeout}
              onSessionTimeoutChange={setSessionTimeout}
            />

            <EnrollmentReminderSection
              reminderDays={enrollmentReminderDays}
              onReminderDaysChange={setEnrollmentReminderDays}
            />
          </>
        );
      }

      // Mobile + OTP Configuration
      if (currentlyConfiguringMethod === METHOD_KEYS.MOBILE_OTP) {
        return (
          <>
            {/* Alert: Onboarding message sent via SMS */}
            <InfoAlert>
              <InfoIconStyled as={InfoIcon} />
              <AlertText>{ALERT_MESSAGES.SMS_ONBOARDING}</AlertText>
            </InfoAlert>

            {/* OTP Configuration Section */}
            <OTPConfigSection
              authType="mobile"
              otpValidity={otpValidity}
              onOTPValidityChange={setOtpValidity}
              otpCooldown={resendOtpCooldown}
              onOTPCooldownChange={setResendOtpCooldown}
            />

            {/* Session Settings */}
            <SessionTimeoutSection
              authType="mobile"
              sessionTimeout={sessionTimeout}
              onSessionTimeoutChange={setSessionTimeout}
            />

            <EnrollmentReminderSection
              reminderDays={enrollmentReminderDays}
              onReminderDaysChange={setEnrollmentReminderDays}
            />
          </>
        );
      }

      // Phone + Password Configuration
      if (currentlyConfiguringMethod === METHOD_KEYS.PHONE_PASSWORD) {
        return (
          <>
            {/* Alert: Onboarding message sent via SMS */}
            <InfoAlert>
              <InfoIconStyled as={InfoIcon} />
              <AlertText>{ALERT_MESSAGES.SMS_ONBOARDING}</AlertText>
            </InfoAlert>

            {/* Password Policy Configuration */}
            <PasswordPolicySection
              minPasswordLength={minPasswordLength}
              onMinPasswordLengthChange={setMinPasswordLength}
              passwordRequirements={passwordRequirements}
              onPasswordRequirementsChange={setPasswordRequirements}
            />

            {/* Password Expiry Configuration */}
            <PasswordExpirySection
              passwordExpiryDuration={passwordExpiry}
              onPasswordExpiryDurationChange={setPasswordExpiry}
            />

            {/* Change Password After First Login */}
            <LoginConfigurationContainer>
              <Label
                control={
                  <CommonToggle
                    checked={requireOldPassword}
                    onChange={(e) => setRequireOldPassword(e.target.checked)}
                  />
                }
                label={
                  <LabelWithDescription>
                    <LabelTitle>
                      {TOGGLE_LABELS.REQUIRE_OLD_PASSWORD}
                    </LabelTitle>
                    <LabelDescriptionText>
                      {HELPER_TEXT.USERS_ENTER_CURRENT_PASSWORD}
                    </LabelDescriptionText>
                  </LabelWithDescription>
                }
              />
            </LoginConfigurationContainer>

            {/* Two Factor Authentication Configuration */}
            <TwoFactorAuthSection
              enable2FA={enable2FA}
              onEnable2FAChange={setEnable2FA}
              twoFactorDelivery={otpDelivery}
              onTwoFactorDeliveryChange={setOtpDelivery}
              showDeliveryOptions={true}
              twoFactorOTPLength={otpLength}
              onTwoFactorOTPLengthChange={setOtpLength}
              twoFactorOTPValidity={otpValidity}
              onTwoFactorOTPValidityChange={setOtpValidity}
              twoFactorOTPCooldown={resendOtpCooldown}
              onTwoFactorOTPCooldownChange={setResendOtpCooldown}
              maxOtpAttempts={
                shouldShowOtpRetryLimit ? maxOtpAttempts : undefined
              }
              onMaxOtpAttemptsChange={
                shouldShowOtpRetryLimit ? setMaxOtpAttempts : undefined
              }
            />

            {/* Session Settings */}
            <SessionTimeoutSection
              sessionTimeout={sessionTimeout}
              onSessionTimeoutChange={setSessionTimeout}
            />

            <EnrollmentReminderSection
              reminderDays={enrollmentReminderDays}
              onReminderDaysChange={setEnrollmentReminderDays}
            />

          </>
        );
      }

      // Employee ID + YOB Configuration
      if (currentlyConfiguringMethod === METHOD_KEYS.EMPLOYEE_ID) {
        return (
          <>
            {/* Alert: No onboarding message for this method */}
            <InfoAlert>
              <InfoIconStyled as={InfoIcon} />
              <AlertText>{ALERT_MESSAGES.NO_ONBOARDING}</AlertText>
            </InfoAlert>

            {/* Authentication Configuration Section */}
            <LoginConfigurationContainer>
              <SectionHeader>
                <SectionIcon as={BadgeIcon} />
                <Box>
                  <ConfigSectionTitle>
                    {SECTION_TITLES.AUTHENTICATION_CONFIG}
                  </ConfigSectionTitle>
                  <ConfigSectionSubtitle>
                    {SECTION_DESCRIPTIONS.EMPLOYEE_ID_VALIDATION}
                  </ConfigSectionSubtitle>
                </Box>
              </SectionHeader>

              <Box mb={2}>
                <Label
                  control={
                    <CommonToggle
                      checked={enableIdValidation}
                      onChange={(e) => setEnableIdValidation(e.target.checked)}
                    />
                  }
                  label={TOGGLE_LABELS.EMPLOYEE_ID_VALIDATION}
                />
              </Box>

              {enableIdValidation && (
                <>
                  <TextField
                    fullWidth
                    size="small"
                    value={employeeIdFormat}
                    onChange={(e) => setEmployeeIdFormat(e.target.value)}
                    onPaste={(e) => {
                      if (!isCopyPasteAllowedForOrg()) {
                        e.preventDefault();
                      }
                    }}
                    placeholder={DEFAULT_VALUES.EMPLOYEE_ID_FORMAT}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                      },
                      mb: 1,
                    }}
                  />
                  <HelperText>{HELPER_TEXT.EMPLOYEE_ID_FORMAT}</HelperText>
                </>
              )}
            </LoginConfigurationContainer>

            {/* Security Settings */}
            {/* Session Settings */}
            <SessionTimeoutSection
              sessionTimeout={sessionTimeout}
              onSessionTimeoutChange={setSessionTimeout}
            />
          </>
        );
      }

      return null;
    };

    return (
      <Box ref={ref}>
        {/* Description of authentication method selection */}
        <SectionDescription>
          {SECTION_DESCRIPTIONS.SELECT_AUTH_METHOD}
        </SectionDescription>

        {/* Grid of available authentication methods */}
        <AuthMethodGrid
          authMethods={authMethods}
          selectedMethods={localSelectedMethods}
          onMethodSelect={handleMethodSelect}
          onMethodConfigure={handleMethodConfigure}
        />



        {/* Configuration Drawer */}
        <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose}>
          <DrawerWrapper>
            <DrawerHeader>
              <FlexContainer>
                {/* Display appropriate icon based on selected method */}
                {currentlyConfiguringMethod === METHOD_KEYS.EMAIL_PASSWORD && (
                  <SectionIconLarge as={LockIcon} />
                )}
                {currentlyConfiguringMethod === METHOD_KEYS.EMAIL_OTP && (
                  <SectionIconLarge as={LockIcon} />
                )}
                {currentlyConfiguringMethod === METHOD_KEYS.MOBILE_OTP && (
                  <SectionIconLarge as={MobileIcon} />
                )}
                {currentlyConfiguringMethod === METHOD_KEYS.PHONE_PASSWORD && (
                  <SectionIconLarge as={MobileIcon} />
                )}
                {currentlyConfiguringMethod === METHOD_KEYS.EMPLOYEE_ID && (
                  <SectionIconLarge as={BadgeIcon} />
                )}
                {currentlyConfiguringMethod === "oauth" && (
                  <SectionIconLarge as={LockIcon} />
                )}
                <Box>
                  <DrawerTitle>
                    {currentlyConfiguringMethod === METHOD_KEYS.EMAIL_PASSWORD &&
                      CONFIG_TITLES.EMAIL_PASSWORD}
                    {currentlyConfiguringMethod === METHOD_KEYS.EMAIL_OTP &&
                      CONFIG_TITLES.EMAIL_OTP}
                    {currentlyConfiguringMethod === METHOD_KEYS.MOBILE_OTP &&
                      CONFIG_TITLES.MOBILE_OTP}
                    {currentlyConfiguringMethod === METHOD_KEYS.PHONE_PASSWORD &&
                      CONFIG_TITLES.PHONE_PASSWORD}
                    {currentlyConfiguringMethod === METHOD_KEYS.EMPLOYEE_ID &&
                      CONFIG_TITLES.EMPLOYEE_ID_YOB}
                    {currentlyConfiguringMethod === "oauth" && CONFIG_TITLES.SSO}
                  </DrawerTitle>
                  <DrawerSubtitle>
                    {SECTION_DESCRIPTIONS.CONFIGURE_AUTH_SETTINGS}
                  </DrawerSubtitle>
                </Box>
              </FlexContainer>
              <IconButton onClick={handleDrawerClose}>
                <CloseIcon />
              </IconButton>
            </DrawerHeader>

            <DrawerContent>{getConfigurationContent()}</DrawerContent>

            {/* Drawer footer with action buttons */}
            <DrawerFooter>
              <Button variant="outlined" onClick={handleDrawerClose}>
                {BUTTON_LABELS.CANCEL}
              </Button>
              <PrimaryButton
                variant="contained"
                onClick={handleSaveConfiguration}
              >
                {BUTTON_LABELS.SAVE_CONFIGURATION}
              </PrimaryButton>
            </DrawerFooter>
          </DrawerWrapper>
        </Drawer>
      </Box>
    );
  }
);

// Set display name for debugging purposes
LoginAuthSection.displayName = "LoginAuthSection";
