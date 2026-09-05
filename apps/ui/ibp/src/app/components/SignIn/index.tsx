import React, { useCallback, useEffect, useState, Suspense, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import store from "../../redux/store";
import { fetchTermsAndConditions } from "../../redux/tcSlice";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import headerLogo from "../../../assets/svgs/header-logo.svg";
import { environment } from "@ui/ui-lib/environment";
// apps/ui/ibp/src/assets/svgs/Faqs-icon.svg
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";

interface SignInProps {
  onClose?: () => void;
  onSuccess?: () => void;
  isFullPage?: boolean;
}
import useApi from "@ui/ui-lib/hooks/useApi";
import emailOtpIcon from "../../assets/svgs/email-otp-method.svg";
import phoneOtpIcon from "../../assets/svgs/phone-otp-method.svg";
import emailIcon from "../../../assets/svgs/login-email-icon.svg";
import mobileIcon from "../../../assets/svgs/login-phone-icon.svg";
import { useSearchParams } from "react-router-dom";

// import emailOtpMethodIcon from "../../../assets/svgs/email-otp-method.svg";
// import phoneOtpMethodIcon from "../../../assets/svgs/phone-otp-method.svg";
import {
  FORGOT_PASSWORD_FORM_CONFIG,
  initialForgotPasswordData,
  initialResetData,
  initialSignInData,
  LOGIN_FORM_CONFIG,
  RESET_FORM_CONFIG,
} from "./formConfig";
import {
  ButtomContainer,
  HeadingContainer,
  LoginContainer,
  TitleContainer,
  ForgotPasswordLink,
  StyledLogin,
  ForgotContainer,
  PasswordResetLinkMessage,
  PasswordResetMessage,
  Email,
  ConformIcon,
  BottomText,
  BottomContainer,
  GuidelinesContainer,
  GuidelinesHeading,
  GuidelineRow,
  GuidelineIcon,
  GuidelineText,
  ButtomContainerVerifyOtp,
  FormContainer,
  BackToLoginContainer,
  ClickableLink,
  ResendOTPContainer,
  ResendOTPText,
  ResendOTPLink,
  PhoneOTPContainer,
  OTPInstructionText,
  PowerText,
  CaptchaContainer,
  TabIconWrapper,
  StyledTab,
  StyledTabs,
  AuthRadioGroup,
  SubTitleContainer,
  RightStyledTab,
  ButtonWrapper,
  SupportText,
  AuthenticationButtonWrapper,
  AuthenticationSubHeading,
  PrimaryAuthenticationWrapper,
  PrimaryAuthenticationIcon,
  PrimaryAuthenticationText,
  AuthenticationHeading,
  AuthenticationWrapper,
  AuthenticationContainer,
  AuthenticationRadioWrapper,
  AuthenticationRadioOption,
  AuthenticationRadioLabel,
  AuthenticationRadioText,
  OtpVerificationContainer,
  OtpSentMessage,
  OtpInputWrapper,
  OtpInput,
  OtpActionsWrapper,
  OtpActionText,
  OtpActionLink,
  CompleteLoginButton,
  LeftStyledTab,
  LoginFlowShell,
  LoginFlowHero,
  LoginFlowCurve,
  LoginFlowBoy,
  LoginFlowHeroContent,
  LoginFlowHeroTitle,
  LoginFlowHeroDots,
  LoginFlowHeroDot,
  LoginFlowCardArea,
  LoginFlowCard,
  LoginFlowFormStack,
  LoginFlowFieldLabel,
  LoginFlowTextField,
  LoginFlowPrimaryButton,
  LoginFlowSecondaryButton,
  LoginFlowDividerText,
  LoginMethodCards,
  LoginMethodCard,
  LoginMethodCardInfo,
  LoginMethodCardIcon,
  LoginMethodCardTitle,
  LoginMethodCardSelectionIcon,
  LoginFlowInlineAction,
  LoginPageContainer,
  LoginPageHeader,
  LoginPageLogo,
  LoginPageActions,
  LoginPageSupportButton,
  LoginPageHomeButton,
  OtpSpinner,
} from "./styles";
import TwoFactorAuthIcon from "../../../assets/svgs/primary-authentication-icon.svg";
import AuthInitialIcon from "../../../assets/svgs/authentication-intial-state-icon.svg";
import BaseHealthPlanFilledIcon from "../../assets/svgs/base-health-plan-filled.svg";
import {
  FORGOT_PASSWORD,
  LOGIN_IWH,
  RESET_PASSWORD,
  SIGNIN,
  TOAST_MESSAGES,
  EMAIL_OTP_SCENARIOS,
  SEND_OTP,
} from "../../constants/index";
import { SignInFormData } from "./types";
import axiosInstance from "@ui/ui-lib/utils/axiosInterceptors";
import { setToastMessage } from "../../redux/slice";
import { clearPortalConfiguration } from "../../redux/portalConfigSlice";
import BannerImage from "../../assets/svgs/login-banner-img.svg";
import LoginBackgroundImage from "../../assets/pngs/login-bg-image.png";
import LoginBoyImage from "../../assets/svgs/login-bg-boy-image.svg";
import {
  endPoints,
  ibpTheme as theme,
  maskMobileNumber,
  maskEmail,
  apiRequest,
} from "@ui/ui-lib";
import ResetIcon from "../../assets/svgs/conform-green-icon.svg";
import { useAuthConfig } from "../../hooks/useAuthConfig";
import type { AuthMethod } from "../../hooks/useAuthConfig";
import { useCompanyConfig } from "../../hooks/useCompanyConfig";
import SupportPage from '../../pages/SupportPage';
import { SupportHelpContactDialog } from '../../common/SupportHelpContactDialog';
import { PasswordValidationUiUtil } from "@ui/ui-lib";
import CircularCheckBox from "../../assets/svgs/circular-check-box.svg";
import AccordionSelected from "../../assets/svgs/accordion-selected.svg";
import {
  InputAdornment,
  Button,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { REGEX_PATTERNS } from "@ui/ui-lib/constants/regex";
import { ValidationErrors } from "@ui/ui-lib/constants/errors";
import { useApiMutation, useCaptcha, CaptchaComponent } from "@ui/ui-lib";
type LoginMethod = "employeeId" | "email" | "mobile";

const INDIAN_PHONE_COUNTRY_CODE = "+91";

const normalizeIndianPhoneDigits = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("91") && digits.length >= 12) {
    return digits.slice(-10);
  }

  return digits.slice(-10);
};

const formatIndianPhoneNumber = (value: string) => {
  const digits = normalizeIndianPhoneDigits(value);
  return digits.length === 10 ? `${INDIAN_PHONE_COUNTRY_CODE}${digits}` : "";
};

// Lazy load auth components
const OTPAuth = React.lazy(() => import("../OTPAuth"));
const CustomEmailOTP = React.lazy(() => import("../CustomEmailOTP"));

// Form configurations for phone OTP forgot password
const PHONE_FORGOT_FORM_CONFIG = [
  {
    key: "phoneNumber",
    name: "phoneNumber",
    label: "Registered Phone Number",
    type: "tel",
    rules: {
      required: {
        value: true,
        message: "Phone number is required",
      },
      pattern: {
        value: /^\d{10}$/,
        message: "Please enter a valid 10-digit phone number",
      },
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Enter your 10-digit phone number",
      InputProps: {
        startAdornment: (
          <InputAdornment position="start">{INDIAN_PHONE_COUNTRY_CODE}</InputAdornment>
        ),
      },
      inputProps: {
        maxLength: 10,
      },
      onInput: (e: any) => {
        e.target.value = normalizeIndianPhoneDigits(e.target.value);
      },
      enableCopyPaste: true,
      sx: {
        "&.MuiTextField-root .MuiOutlinedInput-root": {
          backgroundColor: "transparent",
          borderRadius: "6px",
        },
      },
    },
  },
];

const SignIn: React.FC<SignInProps> = ({
  onClose,
  onSuccess,
  isFullPage = false,
}) => {
  const OTP_LENGTH = 6;
  // --- Password state for checklist ---
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [phoneFormMethods, setPhoneFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [emailPasswordReady, setEmailPasswordReady] = useState(false);
  const [emailPasswordIdentifier, setEmailPasswordIdentifier] = useState("");
  const [phonePasswordReady, setPhonePasswordReady] = useState(false);
  const [phonePasswordIdentifier, setPhonePasswordIdentifier] = useState("");
  const [resetLinkMessage, setResetLinkMessage] = useState("");
  const [resetLinkDestination, setResetLinkDestination] = useState("");
  const [resetLinkIdentifier, setResetLinkIdentifier] = useState("");
  const [resetLinkMethodCode, setResetLinkMethodCode] = useState("");

  const [loginState, setLoginState] = useState<any>(null);
  const captcha = useCaptcha();
  const { authMethods, loading: authConfigLoading } = useAuthConfig();
  const {
    companyId,
    passwordRules,
    logoUrl,
    logoFileId,
    portalBrandingConfig,
    loading: companyConfigLoading,
  } = useCompanyConfig();

  const subdomain = window.location.hostname.split(".")[0];
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
  const [brandingLogoFailed, setBrandingLogoFailed] = useState(false);
  const passwordMethodCodes = [
    "EMAIL_PASSWORD",
    "PHONE_PASSWORD",
    "USERNAME_PASSWORD",
  ];
  // Group authentication methods by tab category
  const methodsByCategory = useMemo(() => {
    const categories = {
      employeeId: [] as AuthMethod[],
      email: [] as AuthMethod[],
      mobile: [] as AuthMethod[],
    };

    authMethods.forEach((method) => {
      if (!method.isEnabled) return;

      const code = method.methodCode;
      if (code === "USERNAME_PASSWORD") {
        categories.employeeId.push(method);
      } else if (code === "EMAIL_PASSWORD" || code === "EMAIL_OTP") {
        categories.email.push(method);
      } else if (
        code === "PHONE_PASSWORD" ||
        code === "PHONE_OTP" ||
        code === "MOBILE_OTP"
      ) {
        categories.mobile.push(method);
      }
    });

    return categories;
  }, [authMethods]);

  // Check which tabs should be enabled based on available auth methods
  const tabAvailability = {
    employeeId: methodsByCategory.employeeId.length > 0,
    email: methodsByCategory.email.length > 0,
    mobile: methodsByCategory.mobile.length > 0,
  };

  // State for selected authentication method within each tab
  const [selectedAuthType, setSelectedAuthType] = useState<{
    employeeId?: string;
    email?: string;
    mobile?: string;
  }>({});

  // Get the first available tab as default
  const getDefaultTab = () => {
    if (tabAvailability.email) return "email";
    if (tabAvailability.mobile) return "mobile";
    if (tabAvailability.employeeId) return "employeeId";
    return "email"; // fallback
  };

  // Get dynamic placeholder text based on available auth methods
  const getIdentifierPlaceholder = () => {
    const hasEmail = methodsByCategory.email.length > 0;
    const hasMobile = methodsByCategory.mobile.length > 0;

    if (hasEmail && hasMobile) {
      return "Enter Email or Mobile No";
    } else if (hasEmail) {
      return "Enter Email";
    } else if (hasMobile) {
      return "Enter Mobile No";
    } else {
      return "Enter Email or Mobile No"; // fallback
    }
  };

  // Get dynamic label text based on available auth methods
  const getIdentifierLabel = () => {
    const hasEmail = methodsByCategory.email.length > 0;
    const hasMobile = methodsByCategory.mobile.length > 0;

    if (hasEmail && hasMobile) {
      return "Email or Mobile No *";
    } else if (hasEmail) {
      return "Email *";
    } else if (hasMobile) {
      return "Mobile No *";
    } else {
      return "Email or Mobile No *"; // fallback
    }
  };

  const getIdentifierSubtitle = () => {
    const hasEmail = methodsByCategory.email.length > 0;
    const hasMobile = methodsByCategory.mobile.length > 0;

    if (hasEmail && hasMobile) {
      return "Enter your registered email or mobile number to continue";
    }
    if (hasEmail) {
      return "Enter your registered email to continue";
    }
    if (hasMobile) {
      return "Enter your registered mobile number to continue";
    }
    return "Enter your registered email or mobile number to continue";
  };

  // Auto-switch to available tab if current selection is disabled
  React.useEffect(() => {
    if (!tabAvailability[loginMethod]) {
      setLoginMethod(getDefaultTab());
    }
  }, [authMethods, loginMethod, tabAvailability]);

  // Get current authentication method for the selected tab
  const getCurrentAuthMethod = () => {
    const methods = methodsByCategory[loginMethod];
    if (methods.length === 0) return null;

    // If only one method, use it directly
    if (methods.length === 1) return methods[0];

    // If multiple methods, use selected one or default to password method first
    const selectedType = selectedAuthType[loginMethod];
    if (selectedType) {
      return methods.find((m) => m.methodCode === selectedType) || methods[0];
    }
    // Default: prefer password method so password is always shown first
    const defaultPassword = methods.find((m) =>
      m.methodCode.includes("PASSWORD")
    );
    return defaultPassword || methods[0];
  };

  const currentAuthMethod = getCurrentAuthMethod();

  // Auto-set auth type for tabs with single method
  useEffect(() => {
    const methods = methodsByCategory[loginMethod];
    if (methods.length === 1 && !selectedAuthType[loginMethod]) {
      setSelectedAuthType((prev) => ({
        ...prev,
        [loginMethod]: methods[0].methodCode,
      }));
    }
  }, [loginMethod, methodsByCategory, selectedAuthType]);

  // Get the correct password method for current tab (for 2FA and form config)
  const passwordMethod = useMemo(() => {
    const methods = methodsByCategory[loginMethod];
    const passwordMethods = methods.filter((m) =>
      m.methodCode.includes("PASSWORD")
    );
    return passwordMethods[0]; // Get the password method for current tab
  }, [methodsByCategory, loginMethod]);

  const authMethodMap = useMemo(() => {
    return authMethods.reduce<Record<string, AuthMethod>>((acc, method) => {
      acc[method.methodCode] = method;
      return acc;
    }, {});
  }, [authMethods, loginMethod]);
  const formatAuthButtonLabel = (methodCode: string, fallback: string) => {
    const method = authMethodMap[methodCode];
    if (!method?.methodName) {
      return fallback;
    }
    const trimmedName = method.methodName.trim().replace(/\s+/g, " ");
    const lowerCaseName = trimmedName.toLowerCase();
    if (
      lowerCaseName.startsWith("sign in") ||
      lowerCaseName.startsWith("signin")
    ) {
      return trimmedName;
    }
    return `Sign in with ${trimmedName}`;
  };
  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: LoginMethod
  ) => {
    // Only allow switching to enabled tabs
    if (!tabAvailability[newValue]) {
      return;
    }

    setLoginMethod(newValue);
    setEmailPasswordReady(false);
    setEmailPasswordIdentifier("");
    setPhonePasswordReady(false);
    setPhonePasswordIdentifier("");
    setIsOtpInitializing(false);

    // Reset step to login when switching tabs so OTP/forgot state does not carry over
    if (
      step === "forgot" ||
      step === "linkSent" ||
      step === "otp" ||
      step === "email-otp"
    ) {
      setStep("login");
    }

    const methods = methodsByCategory[newValue];
    if (methods.length === 1) {
      setSelectedAuthType((prev) => ({
        ...prev,
        [newValue]: methods[0].methodCode,
      }));
    }

    // Reset form when switching tabs
    if (formMethods) {
      const newInitialData = { ...initialSignInData };
      const newAuthMethod = methods.length === 1 ? methods[0] : methods[0]; // Default to first
      if (newAuthMethod?.methodCode === "PHONE_PASSWORD") {
        newInitialData.userName = "+91";
      }
      formMethods.reset(newInitialData);
    }
  };

  const handleAuthTypeChange = (authType: string) => {
    setSelectedAuthType((prev) => ({
      ...prev,
      [loginMethod]: authType,
    }));
    setIsOtpInitializing(false);
    if (step === "otp" || step === "email-otp") {
      setStep("login");
    }

    // Reset form with appropriate defaults
    if (formMethods) {
      const newInitialData = { ...initialSignInData };
      if (authType === "PHONE_PASSWORD") {
        newInitialData.userName = "+91";
      }
      formMethods.reset(newInitialData);
    }
  };
  const handleContactSupport = () => {
    setIsSupportPageOpen(true);
  };
  const findAuthMethodByCodes = (codes: string[]) =>
    authMethods.find((method) => {
      if (!method?.isEnabled) return false;
      const normalizedCode = String(
        method.methodCode ||
          (method as any).authenticationMethodKey ||
          (method as any).authentication_method_key ||
          ""
      )
        .trim()
        .toUpperCase();
      return codes.includes(normalizedCode);
    });

  const phoneOtpMethod =
    findAuthMethodByCodes(["PHONE_OTP", "MOBILE_OTP", "SMS_OTP"]) ||
    authMethodMap["PHONE_OTP"];
  const emailOtpMethod =
    findAuthMethodByCodes(["EMAIL_OTP"]) || authMethodMap["EMAIL_OTP"];
  const isPhoneOtpMethodCode = (methodCode?: string) =>
    ["PHONE_OTP", "MOBILE_OTP", "SMS_OTP"].includes(String(methodCode || ""));
  const isEmailOtpMethodCode = (methodCode?: string) =>
    String(methodCode || "") === "EMAIL_OTP";
  const googleMethod = authMethodMap["GOOGLE_OAUTH"];
  const microsoftMethod = authMethodMap["MICROSOFT_OAUTH"];
  const phoneOtpEnabled = phoneOtpMethod?.isEnabled ?? false;
  const emailOtpEnabled = emailOtpMethod?.isEnabled ?? false;
  const googleEnabled = googleMethod?.isEnabled ?? false;
  const microsoftEnabled = microsoftMethod?.isEnabled ?? false;
  const hideForgotPassword = false;
  const hasAlternativeMethods =
    phoneOtpEnabled || emailOtpEnabled || googleEnabled || microsoftEnabled;
  const getResendCooldownSeconds = useMemo(
    () => (method?: AuthMethod) => {
      if (!method) return 60;
      const seconds = Number(
        method?.configuration?.otpConfig?.resendOtpCooldownSeconds ??
          method?.configuration?.resendOtpCooldownSeconds
      );
      return seconds > 0 ? seconds : 60;
    },
    []
  );

  // Check if we're within cooldown period to prevent rapid OTP sends
  const isWithinOtpCooldown = (methodCode: string) => {
    if (!lastOtpSendTime) return false;

    const method = authMethods.find((m) => m.methodCode === methodCode);
    const cooldownSeconds = getResendCooldownSeconds(method);
    const timeSinceLastSend = (Date.now() - lastOtpSendTime) / 1000;

    return timeSinceLastSend < cooldownSeconds;
  };

  // Get remaining cooldown seconds for OTP resend
  const getRemainingCooldownSeconds = (methodCode: string): number => {
    if (!lastOtpSendTime) return 0;
    const method = authMethods.find((m) => m.methodCode === methodCode);
    const cooldownSeconds = getResendCooldownSeconds(method);
    const timeSinceLastSend = (Date.now() - lastOtpSendTime) / 1000;
    return Math.max(0, Math.ceil(cooldownSeconds - timeSinceLastSend));
  };

  // Count total authentication methods available
  const totalAuthMethods = [
    !!passwordMethod,
    phoneOtpEnabled,
    emailOtpEnabled,
    googleEnabled,
    microsoftEnabled,
  ].filter(Boolean).length;

  const hasMultipleAuthMethods = totalAuthMethods > 1;
  const passwordRecoveryLabel =
    loginMethod === "employeeId"
      ? "Reset Password / Create Password"
      : FORGOT_PASSWORD;
  const brandingMessageHeading =
    portalBrandingConfig?.loginWelcomeMessage?.heading?.trim() || null;
  const brandingMessageBody =
    portalBrandingConfig?.loginWelcomeMessage?.bodyText?.trim() || null;
  const bannerHeading = brandingMessageHeading || SIGNIN.BANNER_WELCOME_TITLE;
  const bannerBody = brandingMessageBody || SIGNIN.BANNER_WELCOME_SUBTITLE;
  const resolvedLogoFileId =
    logoFileId ??
    portalBrandingConfig?.companyLogoFileId ??
    portalBrandingConfig?.companyLogoId ??
    null;
  const resolvedLogoDownloadUrls = useMemo(() => {
    if (!resolvedLogoFileId || resolvedLogoFileId <= 0 || brandingLogoFailed) {
      return [];
    }
    return [endPoints.ibpPublicFileUploadDownloadById(resolvedLogoFileId)];
  }, [resolvedLogoFileId, brandingLogoFailed]);
  const resolvedLogoDownloadUrl =
    resolvedLogoDownloadUrls.length > 0 ? resolvedLogoDownloadUrls[0] : null;
  const headerLogoSrc = brandingLogoUrl || resolvedLogoDownloadUrl || logoUrl;
  const bannerImageSrc = BannerImage;
  const userNamePlaceholderMap: Record<string, string> = {
    EMAIL_PASSWORD: "Enter your email (e.g. employee@company.com)",
    PHONE_PASSWORD: "Enter your phone number (e.g. 9876543210)",
    USERNAME_PASSWORD: "Enter your Employee ID",
  };
  const getUserNamePattern = (methodCode?: string) => {
    switch (methodCode) {
      case "EMAIL_PASSWORD":
        return {
          value: REGEX_PATTERNS.EMAIL,
          message: ValidationErrors.EMAIL,
        };
      case "PHONE_PASSWORD":
        return {
          value: /^\+91\d{10}$/,
          message: "Please enter a valid 10-digit phone number",
        };
      case "USERNAME_PASSWORD":
        return {
          value: REGEX_PATTERNS.ALPHANUMERIC_WITH_SPECIALS,
          message: ValidationErrors.ALPHANUMERIC_WITH_SPECIALS,
        };
      default:
        return null;
    }
  };
  const getUserNameHelper = (methodCode?: string) => {
    switch (methodCode) {
      case "EMAIL_PASSWORD":
        return "Format: username@company.com";
      case "PHONE_PASSWORD":
        return "Enter 10 digits (e.g. 9876543210)";
      case "USERNAME_PASSWORD":
        return "Enter your Employee ID";
      default:
        return "";
    }
  };
  // Create dynamic initial values based on login method
  const getInitialSignInData = useMemo(() => {
    const baseData = { ...initialSignInData };
    if (passwordMethod?.methodCode === "PHONE_PASSWORD") {
      baseData.userName = "+91";
    }
    if (
      passwordMethod?.methodCode === "EMAIL_PASSWORD" &&
      emailPasswordIdentifier
    ) {
      baseData.userName = emailPasswordIdentifier;
    }
    if (
      passwordMethod?.methodCode === "PHONE_PASSWORD" &&
      phonePasswordIdentifier
    ) {
      baseData.userName = phonePasswordIdentifier;
    }
    return baseData;
  }, [
    passwordMethod?.methodCode,
    emailPasswordIdentifier,
    phonePasswordIdentifier,
  ]);
  const phoneOtpLabel = formatAuthButtonLabel(
    "PHONE_OTP",
    "Sign in with Mobile OTP"
  );
  const emailOtpLabel = formatAuthButtonLabel(
    "EMAIL_OTP",
    "Sign in with Email OTP"
  );
  const googleLabel = formatAuthButtonLabel(
    "GOOGLE_OAUTH",
    "Sign in with Google"
  );
  const microsoftLabel = formatAuthButtonLabel(
    "MICROSOFT_OAUTH",
    "Sign in with Microsoft"
  );
  const HERO_SLIDES = [
    { line1: "Insurance", line2: "that works at", line3: "a corporate scale." },
    { line1: "Wellness benefits", line2: "designed for", line3: "every employee." },
    { line1: "Smart claims,", line2: "simplified for", line3: "your peace of mind." },
  ];
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [step, setStep] = useState<
    | "login"
    | "forgot"
    | "linkSent"
    | "reset"
    | "resetSuccessful"
    | "otp"
    | "email-otp"
    | "twoFactorOtpVerify"
    | "twoFactorAuthentication"
  >("login");
  const [loginStage, setLoginStage] = useState<"identifier" | "auth">(
    "identifier"
  );
  const [identifierInput, setIdentifierInput] = useState("");
  const [resolvedIdentifier, setResolvedIdentifier] = useState("");
  const [isSupportContactOpen, setIsSupportContactOpen] = useState(false);
  const [isSupportPageOpen, setIsSupportPageOpen] = useState(false);

  // OTP cooldown tracking to prevent rapid consecutive sends
  const [lastOtpSendTime, setLastOtpSendTime] = useState<number | null>(null);
  const [isOtpInitializing, setIsOtpInitializing] = useState<boolean>(false);
  const loginFormConfig = useMemo(() => {
    const isEmailPasswordFlow = passwordMethod?.methodCode === "EMAIL_PASSWORD";
    const isPhonePasswordFlow = passwordMethod?.methodCode === "PHONE_PASSWORD";
    // Override label for specific method codes to ensure consistency
    let label = passwordMethod?.methodName ?? LOGIN_FORM_CONFIG[0].label;
    if (passwordMethod?.methodCode === "PHONE_PASSWORD") {
      label = "Phone Number";
    }
    if (passwordMethod?.methodCode === "EMAIL_PASSWORD") {
      label = "Email Id";
    }
    if (passwordMethod?.methodCode === "USERNAME_PASSWORD") {
      label = "Employee ID";
    }

    const placeholder =
      userNamePlaceholderMap[passwordMethod?.methodCode ?? ""] ??
      "Enter your user name";
    const patternConfig = getUserNamePattern(passwordMethod?.methodCode);

    const mappedConfig = LOGIN_FORM_CONFIG.map((field) => {
      if (field.name === "userName") {
        if (
          loginMethod !== "employeeId" &&
          loginStage === "auth" &&
          resolvedIdentifier
        ) {
          return null;
        }
        const computedInputType =
          passwordMethod?.methodCode === "EMAIL_PASSWORD"
            ? "email"
            : passwordMethod?.methodCode === "PHONE_PASSWORD"
            ? "text"
            : field.componentProps?.type ?? "text";
        const rules = {
          ...field.rules,
        };
        if (patternConfig) {
          rules.pattern = {
            value: patternConfig.value,
            message: patternConfig.message,
          };
        } else {
          delete rules.pattern;
        }
        const baseComponentProps = field.componentProps ?? {};

        // For phone password, we need special handling to show +91 in the field
        let inputProps;
        if (passwordMethod?.methodCode === "PHONE_PASSWORD") {
          inputProps = {
            ...(baseComponentProps.InputProps ?? {}),
          };
        } else {
          inputProps = baseComponentProps.InputProps;
        }
        const helperText = getUserNameHelper(passwordMethod?.methodCode);
        return {
          ...field,
          label,
          rules,
          componentProps: {
            ...baseComponentProps,
            placeholder,
            type: computedInputType,
            InputProps: inputProps,
            helperText,
            ...(passwordMethod?.methodCode === "PHONE_PASSWORD" && {
              onInput: (e: any) => {
                let value = e.target.value;

                // Always ensure +91 prefix
                if (!value.startsWith("+91")) {
                  value = "+91" + value.replace(/\D/g, "");
                } else {
                  // Extract only digits after +91
                  const digitsAfter91 = value.slice(3).replace(/\D/g, "");
                  // Limit to 10 digits
                  value = "+91" + digitsAfter91.slice(0, 10);
                }

                e.target.value = value;
              },
              onKeyDown: (e: any) => {
                const cursorPos = e.target.selectionStart;
                const isControlKey = e.ctrlKey || e.altKey || e.metaKey;

                // Prevent deletion of +91 prefix
                if (
                  (e.key === "Backspace" || e.key === "Delete") &&
                  cursorPos <= 3
                ) {
                  e.preventDefault();
                  return;
                }

                // Allow only digits and control keys
                if (
                  !/[0-9]/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Home",
                    "End",
                  ].includes(e.key) &&
                  !isControlKey
                ) {
                  e.preventDefault();
                }
              },
              onFocus: (e: any) => {
                // Ensure +91 is always present
                if (!e.target.value || !e.target.value.startsWith("+91")) {
                  e.target.value = "+91";
                }
                // Set cursor after +91 if field is just +91
                setTimeout(() => {
                  if (e.target.value === "+91") {
                    e.target.setSelectionRange(3, 3);
                  }
                }, 0);
              },
              onClick: (e: any) => {
                // Prevent cursor from going before +91
                const cursorPos = e.target.selectionStart;
                if (cursorPos < 3) {
                  setTimeout(() => {
                    e.target.setSelectionRange(3, 3);
                  }, 0);
                }
              },
            }),
          },
        };
      }
      if (
        field.name === "password" &&
        ((isEmailPasswordFlow && !emailPasswordReady) ||
          (isPhonePasswordFlow && !phonePasswordReady))
      ) {
        return null;
      }
      return field;
    });
    return mappedConfig.filter(Boolean);
  }, [
    passwordMethod,
    loginMethod,
    loginStage,
    resolvedIdentifier,
    emailPasswordReady,
    phonePasswordReady,
  ]);

  // Force form re-render when loginMethod changes
  const formKey = useMemo(
    () =>
      `form-${loginMethod}-${loginStage}-${currentAuthMethod?.methodCode}-${
        selectedAuthType[loginMethod]
      }-${emailPasswordReady ? "email-ready" : "email-not-ready"}-${
        phonePasswordReady ? "phone-ready" : "phone-not-ready"
      }`,
    [
      loginMethod,
      loginStage,
      currentAuthMethod,
      selectedAuthType,
      emailPasswordReady,
      phonePasswordReady,
    ]
  );
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [isCheckingPasswordReadiness, setIsCheckingPasswordReadiness] =
    useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { doFetch, data: loginData, error: loginError, loading } = useApi();
  const {
    doFetch: doFetchResetMail,
    data: resetMailData,
    error: resetMailError,
  } = useApi();
  const {
    doFetch: doFetchResetPassword,
    data: resetPasswordData,
    error: resetPasswordError,
  } = useApi();
  const {
    mutate: sendForgotOTPMutate,
    data: phoneOTPResetData,
    error: phoneOTPResetError,
    isPending: phoneOTPResetLoading,
  } = useApiMutation({});
  const {
    mutate: verifyForgotOTPMutate,
    data: verifyOTPResetData,
    error: verifyOTPResetError,
    isPending: verifyOTPResetLoading,
  } = useApiMutation({});
  const [searchParams] = useSearchParams(); // get query params
  const tokenFromUrl = searchParams.get("token") ?? "";
  const stepFromUrl = searchParams.get("step") as
    | "login"
    | "forgot"
    | "reset"
    | null;
  const methodFromUrl = searchParams.get("method") ?? "";

  const clearResetQueryParams = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("step");
    url.searchParams.delete("token");
    url.searchParams.delete("method");
    window.history.replaceState({}, "", url.toString());
  };

  // Derive password rules from authMethods for the relevant method
  const getPasswordRulesForMethod = (methodCode: string) => {
    const method = authMethods.find((m) => m.methodCode === methodCode);
    const policy = method?.configuration?.passwordConfig?.passwordPolicy;
    if (!policy) return null;
    const rules: any[] = [];
    if (policy.minLength) {
      rules.push({
        name: "Length",
        minChars: policy.minLength,
        errorMessage: `Must be at least ${policy.minLength} characters long`,
      });
    }
    const reqs = policy.requirements ?? {};
    const reqOrder = ["uppercase", "lowercase", "numbers", "special"];
    for (const key of reqOrder) {
      const req = reqs[key];
      if (req?.required && req?.regex) {
        const labels: Record<string, string> = {
          uppercase: "Must contain an uppercase letter",
          lowercase: "Must contain a lowercase letter",
          numbers: "Must contain a number",
          special: "Must contain a special character",
        };
        rules.push({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          isRequired: true,
          regex: req.regex,
          errorMessage: labels[key] ?? `${key} requirement not satisfied`,
        });
      }
    }
    return rules.length ? rules : null;
  };

  // Active password rules: for reset-via-email use methodFromUrl, for phone OTP reset use passwordMethod
  const activePasswordRules =
    stepFromUrl === "reset"
      ? getPasswordRulesForMethod(
          methodFromUrl || passwordMethod?.methodCode || ""
        ) ?? passwordRules
      : passwordRules;

  // Inject dynamic validator into reset form config when password rules are available
  const [resetFormConfig] = useState(RESET_FORM_CONFIG);

  useEffect(() => {
    if (stepFromUrl === "reset" && tokenFromUrl) {
      setStep("reset");
    }
  }, [stepFromUrl, tokenFromUrl]);

  const handleResetPasswordSubmit = () => {
    if (!formMethods) return;
    const formData = formMethods.getValues();
    const { newPassword, confirmPassword } = formData;

    // Check password validation rules before API call
    if (activePasswordRules) {
      const errors = PasswordValidationUiUtil.validatePassword(
        newPassword,
        activePasswordRules
      );
      if (errors && errors.length > 0) {
        dispatch(setToastMessage(errors[0].message));
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      dispatch(setToastMessage(TOAST_MESSAGES.PASSWORDS_MISMATCH));
      return;
    }

    const tokenToUse = tokenFromUrl;

    doFetchResetMail(endPoints.ibpResetPassword, {
      method: "POST",
      data: {
        token: tokenToUse,
        password: newPassword,
        ...(environment.featureFlag.FF_PASSWORD_RULES && companyId
          ? { companyId }
          : {}),
      },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenToUse}`,
      },
    });
  };

  // Phone OTP forgot password states
  const [forgotOTPStep, setForgotOTPStep] = useState<"phone" | "otp">("phone");
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  // OTP verification states for forgot password
  const [forgotOtp, setForgotOtp] = useState("");
  const [isForgotOtpVerified, setIsForgotOtpVerified] = useState(false);
  const [hasForgotOtpError, setHasForgotOtpError] = useState(false);

  // Two-factor authentication method selection
  const [twoFactorMethod, setTwoFactorMethod] = useState<
    "mobile" | "email" | "both"
  >("mobile");

  // OTP verification tab selection
  const [otpTabValue, setOtpTabValue] = useState<0 | 1 | 2>(2); // 0: Employee ID, 1: Email, 2: Mobile Number

  // OTP input values
  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(""));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isSendingTwoFactorOtp, setIsSendingTwoFactorOtp] = useState(false);
  const [isVerifyingTwoFactorOtp, setIsVerifyingTwoFactorOtp] = useState(false);
  const [isTwoFactorResendDisabled, setIsTwoFactorResendDisabled] =
    useState(false);
  const [twoFactorResendCountdown, setTwoFactorResendCountdown] = useState(0);
  const [twoFactorContact, setTwoFactorContact] = useState({
    email: "",
    phone: "",
  });
  const [lastLoginMethodCode, setLastLoginMethodCode] = useState<string>("");
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const hasTriggeredMobileResetLinkRef = useRef(false);

  useEffect(() => {
    if (
      !["EMAIL_PASSWORD", "PHONE_PASSWORD"].includes(
        passwordMethod?.methodCode || ""
      )
    ) {
      setEmailPasswordReady(false);
      setEmailPasswordIdentifier("");
      setPhonePasswordReady(false);
      setPhonePasswordIdentifier("");
      return;
    }

    if (passwordMethod?.methodCode !== "EMAIL_PASSWORD") {
      setEmailPasswordReady(false);
      setEmailPasswordIdentifier("");
    }

    if (passwordMethod?.methodCode !== "PHONE_PASSWORD") {
      setPhonePasswordReady(false);
      setPhonePasswordIdentifier("");
    }
  }, [passwordMethod?.methodCode]);

  const normalizePhoneIdentifier = (value: string) => {
    return formatIndianPhoneNumber(value);
  };

  const forgotPhoneDefaultValue = useMemo(
    () =>
      normalizeIndianPhoneDigits(
        phonePasswordIdentifier || resolvedIdentifier || ""
      ),
    [phonePasswordIdentifier, resolvedIdentifier]
  );

  const maskSelectedIdentifier = (method: LoginMethod, value: string) => {
    if (method === "mobile") {
      return maskMobileNumber(value) || value;
    }
    if (method === "email") {
      return maskEmail(value) || value;
    }
    return value;
  };

  const getPreferredMethodForTab = (method: LoginMethod) => {
    const methods = methodsByCategory[method];
    return (
      methods.find((item) => item.methodCode.includes("PASSWORD")) || methods[0]
    );
  };

  const resetToIdentifierStage = () => {
    setStep("login");
    setLoginStage("identifier");
    setResolvedIdentifier("");
    setEmailPasswordReady(false);
    setEmailPasswordIdentifier("");
    setPhonePasswordReady(false);
    setPhonePasswordIdentifier("");
    if (formMethods) {
      formMethods.reset(initialSignInData);
    }
  };

  const triggerOtpFlow = (method: AuthMethod, identifier: string) => {
    // Clear any existing toast messages when navigating to OTP
    dispatch(setToastMessage(null));

    setSelectedAuthType((prev) => ({
      ...prev,
      [loginMethod]: method.methodCode,
    }));
    setResolvedIdentifier(identifier);
    setLoginStage("auth");
    setStep(method.methodCode === "EMAIL_OTP" ? "email-otp" : "otp");
  };

  const handleIdentifierContinue = async () => {
    const trimmedIdentifier = identifierInput.trim();

    const isEmailIdentifier = REGEX_PATTERNS.EMAIL.test(trimmedIdentifier);
    const normalizedPhone = normalizePhoneIdentifier(trimmedIdentifier);
    const isPhoneIdentifier = Boolean(normalizedPhone);

    if (!trimmedIdentifier || (!isEmailIdentifier && !isPhoneIdentifier)) {
      dispatch(
        setToastMessage({
          message: "Please enter a valid email or mobile number",
          type: "error",
        })
      );
      return;
    }

    const nextLoginMethod: LoginMethod = isEmailIdentifier ? "email" : "mobile";
    const nextIdentifier = isEmailIdentifier
      ? trimmedIdentifier.toLowerCase()
      : normalizedPhone;
    const availableMethods = methodsByCategory[nextLoginMethod];

    if (!availableMethods.length) {
      dispatch(
        setToastMessage({
          message:
            nextLoginMethod === "email"
              ? "Email login is not available right now"
              : "Mobile login is not available right now",
          type: "error",
        })
      );
      return;
    }

    // **NEW: Check password readiness before proceeding**
    try {
      setIsCheckingPasswordReadiness(true);

      const response = await axiosInstance.post(
        `${environment.ibpUrl}/company-employee/login/password-readiness`,
        {
          userName: nextIdentifier,
          domain: window.location.hostname.split(".")[0],
          loginMethod:
            nextLoginMethod === "email" ? "EMAIL_PASSWORD" : "PHONE_PASSWORD",
        }
      );

      const passwordReadinessData = response.data?.data;

      // If user exists but password is not set, redirect to password reset
      if (
        !passwordReadinessData?.canUsePassword &&
        passwordReadinessData?.shouldSendResetLink
      ) {
        dispatch(
          setToastMessage({
            message: passwordReadinessData.message,
            type: "info",
          })
        );
        setResetLinkMessage(
          passwordReadinessData?.message || SIGNIN.PASSWORD_LINK_SENT,
        );
        triggerResetLinkEmail(
          nextIdentifier,
          nextLoginMethod === "email" ? "EMAIL_PASSWORD" : "PHONE_PASSWORD",
          passwordReadinessData?.maskedEmail || nextIdentifier,
        );
        return;
      }

      // Success case - user can use password, show success message
      if (passwordReadinessData?.canUsePassword) {
        dispatch(
          setToastMessage({
            message: "Account verified! Please continue with your login.",
            type: "success",
          })
        );

        // Set password readiness for the correct method
        if (nextLoginMethod === "email") {
          setEmailPasswordReady(true);
          setEmailPasswordIdentifier(nextIdentifier);
        } else if (nextLoginMethod === "mobile") {
          setPhonePasswordReady(true);
          setPhonePasswordIdentifier(nextIdentifier);
        }
      }
    } catch (error: any) {
      // Handle different types of errors
      const errorResponse = error?.response;
      const statusCode = errorResponse?.status;
      const errorMessage = errorResponse?.data?.message || error?.message;

      if (statusCode === 502 || errorMessage?.includes("User not found")) {
        // User not found - show error and stop the flow
        dispatch(
          setToastMessage({
            message:
              errorMessage,
            type: "error",
          })
        );
        return; // Stop the flow, don't proceed with login
      } else if (statusCode >= 400 && statusCode < 500) {
        // Client errors (400-499)
        dispatch(
          setToastMessage({
            message:
              errorMessage || "Invalid request. Please check your input.",
            type: "error",
          })
        );
        return;
      } else if (statusCode >= 500) {
        // Server errors (500+)
        dispatch(
          setToastMessage({
            message: "Server error. Please try again later or contact support.",
            type: "error",
          })
        );
        return;
      } else {
        // Network or other errors
        dispatch(
          setToastMessage({
            message:
              "Connection error. Please check your internet and try again.",
            type: "error",
          })
        );
        // For network errors, we might want to continue with normal flow as fallback
      }
    } finally {
      setIsCheckingPasswordReadiness(false);
    }

    const preferredMethod = getPreferredMethodForTab(nextLoginMethod);

    setLoginMethod(nextLoginMethod);
    setResolvedIdentifier(nextIdentifier);
    setIdentifierInput(nextIdentifier);
    setSelectedAuthType((prev) => ({
      ...prev,
      [nextLoginMethod]: preferredMethod?.methodCode,
    }));

    if (nextLoginMethod === "email") {
      setEmailPasswordIdentifier(nextIdentifier);
      setPhonePasswordIdentifier("");
      setPhonePasswordReady(false);
    } else {
      setPhonePasswordIdentifier(nextIdentifier);
      setEmailPasswordIdentifier("");
      setEmailPasswordReady(false);
    }

    // **Auto-skip to OTP if only one OTP method available**
    if (
      preferredMethod?.methodCode.includes("OTP") &&
      availableMethods.length === 1
    ) {
      console.log("Auto-skipping to OTP - only one method available:", preferredMethod.methodCode);
      triggerOtpFlow(preferredMethod, nextIdentifier);
      return;
    }

    // **Auto-skip to OTP if all methods are OTP (no password available)**
    const hasPasswordMethods = availableMethods.some(m => m.methodCode.includes("PASSWORD"));
    const hasOnlyOtpMethods = availableMethods.every(m => m.methodCode.includes("OTP"));

    if (hasOnlyOtpMethods && !hasPasswordMethods) {
      console.log("Auto-skipping to OTP - no password methods available, only:", availableMethods.map(m => m.methodCode));
      triggerOtpFlow(preferredMethod!, nextIdentifier);
      return;
    }

    // Clear any existing toast messages when successfully navigating to auth stage
    dispatch(setToastMessage(null));

    setLoginStage("auth");
    setStep("login"); // Ensure we're on the login step to show Password/OTP selection
  };

  const handleEmployeeIdLogin = () => {
    setLoginMethod("employeeId");
    setResolvedIdentifier("");
    setLoginStage("auth");
    setStep("login");
    const preferredMethod = getPreferredMethodForTab("employeeId");
    if (preferredMethod) {
      setSelectedAuthType((prev) => ({
        ...prev,
        employeeId: preferredMethod.methodCode,
      }));
    }
    if (formMethods) {
      formMethods.reset(initialSignInData);
    }
  };

  const handleLoginMethodSelection = (method: AuthMethod) => {
    // Clear any existing toast messages
    dispatch(setToastMessage(null));

    setSelectedAuthType((prev) => ({
      ...prev,
      [loginMethod]: method.methodCode,
    }));

    // Set password readiness based on method selection
    if (method.methodCode.includes("PASSWORD")) {
      if (loginMethod === "email") {
        setEmailPasswordReady(true);
        setEmailPasswordIdentifier(resolvedIdentifier);
      } else if (loginMethod === "mobile") {
        setPhonePasswordReady(true);
        setPhonePasswordIdentifier(resolvedIdentifier);
      }
    }

    // For OTP methods, handle cooldown and initialization
    if (method.methodCode.includes("OTP")) {
      // Check if we're within cooldown period - if so, show message and return
      if (isWithinOtpCooldown(method.methodCode)) {
        const cooldownSeconds = getResendCooldownSeconds(method);
        const timeSinceLastSend = lastOtpSendTime
          ? (Date.now() - lastOtpSendTime) / 1000
          : 0;
        const remainingTime = Math.ceil(cooldownSeconds - timeSinceLastSend);

        dispatch(
          setToastMessage({
            message: `Please wait ${remainingTime} seconds before sending another OTP`,
            type: "warning",
          })
        );
        return;
      }

      // Set initialization state to show loader
      setIsOtpInitializing(true);

      // Clear initialization state after component mounts and sends OTP
      setTimeout(() => {
        setIsOtpInitializing(false);
      }, 2000); // Give time for auto-send to complete

      return;
    }

    setStep("login");
  };

  const configuredOtpDeliveryMethodRaw =
    passwordMethod?.configuration?.passwordConfig?.twoFactorAuthentication
      ?.otpDeliveryMethod ??
    passwordMethod?.configuration?.twoFactorAuthentication?.otpDeliveryMethod;

  const normalizeOtpDeliveryMethod = (
    method?: string
  ): "email" | "mobile" | "both" => {
    const normalized = String(method || "")
      .trim()
      .toLowerCase();

    if (normalized === "email") return "email";
    if (["sms", "mobile", "phone", "phonenumber"].includes(normalized)) {
      return "mobile";
    }
    if (normalized === "both") return "both";

    // Fallback by primary password auth method
    if (passwordMethod?.methodCode === "EMAIL_PASSWORD") return "email";
    if (passwordMethod?.methodCode === "PHONE_PASSWORD") return "mobile";
    return "both";
  };

  const configuredOtpDeliveryMethod = useMemo(
    () => normalizeOtpDeliveryMethod(configuredOtpDeliveryMethodRaw),
    [configuredOtpDeliveryMethodRaw, passwordMethod?.methodCode]
  );

  const allowedTwoFactorMethods = useMemo(() => {
    if (configuredOtpDeliveryMethod === "email") return ["email"] as const;
    if (configuredOtpDeliveryMethod === "mobile") return ["mobile"] as const;
    return ["mobile", "email"] as const;
  }, [configuredOtpDeliveryMethod]);

  useEffect(() => {
    if (allowedTwoFactorMethods.length === 0) return;
    if (
      !allowedTwoFactorMethods.includes(twoFactorMethod as "mobile" | "email")
    ) {
      const defaultMethod =
        allowedTwoFactorMethods.length === 1
          ? allowedTwoFactorMethods[0]
          : passwordMethod?.methodCode === "EMAIL_PASSWORD"
          ? "email"
          : "mobile";
      setTwoFactorMethod(defaultMethod);
    }
  }, [allowedTwoFactorMethods, twoFactorMethod, passwordMethod?.methodCode]);

  useEffect(() => {
    if (step !== "twoFactorAuthentication" || allowedTwoFactorMethods.length !== 1 || isSendingTwoFactorOtp) return;
    handleSendTwoFactorOtp();
  }, [step]); 

  const getTwoFactorOtpDestination = () => {
    const maskedPhone = maskMobileNumber(twoFactorContact.phone);
    const maskedEmail = maskEmail(twoFactorContact.email);

    if (twoFactorMethod === "mobile")
      return maskedPhone || "your registered mobile number";
    if (twoFactorMethod === "email")
      return maskedEmail || "your registered email";

    if (maskedPhone && maskedEmail) return `${maskedPhone} and ${maskedEmail}`;
    return maskedPhone || maskedEmail || "your registered contact methods";
  };

  const getTwoFactorResendCooldownSeconds = () => {
    const seconds = Number(
      passwordMethod?.configuration?.passwordConfig?.twoFactorAuthentication
        ?.resendOtpCooldownSeconds ??
        passwordMethod?.configuration?.twoFactorAuthentication
          ?.resendOtpCooldownSeconds
    );
    return seconds > 0 ? seconds : 60;
  };

  // reset

  // Handle OTP input change with auto-focus
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length <= 1) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = numericValue;
      setOtpValues(newOtpValues);

      // Auto-focus next input if value entered
      if (numericValue && index < OTP_LENGTH - 1) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle backspace key
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste functionality for OTP
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, OTP_LENGTH);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtpValues = [...otpValues];
    pastedData.split("").forEach((char, index) => {
      if (index < OTP_LENGTH) {
        newOtpValues[index] = char;
      }
    });
    setOtpValues(newOtpValues);

    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length - 1, OTP_LENGTH - 1);
    otpInputRefs.current[lastIndex]?.focus();
  };

  const fetchTwoFactorContacts = async () => {
    const response = await axiosInstance.get(endPoints.employeeDetails);
    const employee = response?.data?.data ?? {};
    return {
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
    };
  };

  const formatTwoFactorPhoneNumber = (phone: string): string => {
    const trimmedPhone = (phone ?? "").trim();
    const cleanedDigits = trimmedPhone.replace(/\D/g, "");

    if (!cleanedDigits) {
      return "";
    }

    if (trimmedPhone.startsWith("+")) {
      return `+${cleanedDigits}`;
    }

    if (cleanedDigits.length === 10) {
      return `+91${cleanedDigits}`;
    }

    if (cleanedDigits.length === 12 && cleanedDigits.startsWith("91")) {
      return `+${cleanedDigits}`;
    }

    return `+${cleanedDigits}`;
  };

  const handleSendTwoFactorOtp = async () => {
    if (isSendingTwoFactorOtp) return;
    setIsSendingTwoFactorOtp(true);
    try {
      const contacts = await fetchTwoFactorContacts();
      setTwoFactorContact(contacts);

      const shouldSendMobile = twoFactorMethod === "mobile";
      const shouldSendEmail = twoFactorMethod === "email";
      const formattedPhone = formatTwoFactorPhoneNumber(contacts.phone);

      if (shouldSendMobile && !contacts.phone) {
        dispatch(setToastMessage("Registered mobile number not found"));
        return;
      }

      if (shouldSendEmail && !contacts.email) {
        dispatch(setToastMessage("Registered email address not found"));
        return;
      }

      setOtpValues(Array(OTP_LENGTH).fill(""));
      if (shouldSendEmail) {
        await axiosInstance.post(endPoints.sendEmailOtp, {
          email: contacts.email,
          domain: subdomain,
          scenario: EMAIL_OTP_SCENARIOS.TWO_FACTOR_AUTH,
          passwordMethodCode: passwordMethod?.methodCode,
        });
      }
      if (shouldSendMobile) {
        await axiosInstance.post(endPoints.sendPhoneOtp, {
          phoneNumber: formattedPhone,
          domain: subdomain,
          scenario: "TWO_FACTOR_AUTH",
          passwordMethodCode: passwordMethod?.methodCode,
        });
      }
      const cooldownSeconds = getTwoFactorResendCooldownSeconds();
      setIsTwoFactorResendDisabled(cooldownSeconds > 0);
      setTwoFactorResendCountdown(cooldownSeconds);
      setStep("twoFactorOtpVerify");
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            TOAST_MESSAGES.ERROR
        )
      );
    } finally {
      setIsSendingTwoFactorOtp(false);
    }
  };

  const handleVerifyTwoFactorOtp = async () => {
    if (isVerifyingTwoFactorOtp) return;
    const enteredOtp = otpValues.join("");

    if (enteredOtp.length !== OTP_LENGTH) {
      dispatch(setToastMessage("Please enter a valid 6-digit OTP"));
      return;
    }

    setIsVerifyingTwoFactorOtp(true);
    try {
      const shouldVerifyMobile = twoFactorMethod === "mobile";
      const shouldVerifyEmail = twoFactorMethod === "email";
      const formattedPhone = formatTwoFactorPhoneNumber(twoFactorContact.phone);

      if (shouldVerifyEmail && !twoFactorContact.email) {
        dispatch(setToastMessage("Registered email address not found"));
        return;
      }

      if (shouldVerifyMobile && !formattedPhone) {
        dispatch(setToastMessage("Registered mobile number not found"));
        return;
      }

      if (shouldVerifyEmail) {
        await axiosInstance.post(endPoints.verifyEmailOtp, {
          email: twoFactorContact.email,
          otp: enteredOtp,
          domain: subdomain,
        });
      }
      if (shouldVerifyMobile) {
        await axiosInstance.post(endPoints.verifyPhoneOtp, {
          phoneNumber: formattedPhone,
          otp: enteredOtp,
          domain: subdomain,
        });
      }
      setIsFetchingUser(true);
    } catch (verifyOtpError: any) {
      dispatch(
        setToastMessage(
          verifyOtpError?.response?.data?.message ||
            verifyOtpError?.message ||
            TOAST_MESSAGES.ERROR
        )
      );
    } finally {
      setIsVerifyingTwoFactorOtp(false);
    }
  };

  const onSubmit: SubmitHandler<SignInFormData> = (formData) => {
    const run = async () => {
      const selectedMethodCode = passwordMethod?.methodCode ?? "";
      setLastLoginMethodCode(selectedMethodCode);

      if (
        selectedMethodCode === "EMAIL_PASSWORD" ||
        selectedMethodCode === "PHONE_PASSWORD"
      ) {
        const normalizedUserName =
          selectedMethodCode === "EMAIL_PASSWORD"
            ? String(formData.userName || "")
                .trim()
                .toLowerCase()
            : String(formData.userName || "").trim();

        if (!normalizedUserName) {
          dispatch(
            setToastMessage(
              selectedMethodCode === "EMAIL_PASSWORD"
                ? "Email is required"
                : "Phone number is required"
            )
          );
          return;
        }
      }

      doFetch(endPoints.ibpAuth, {
        method: "POST",
        data: {
          ...formData,
          domain: subdomain,
          loginMethod: selectedMethodCode,
        },
      });
    };
    void run();
  };

  // Use correct password method for 2FA calculation
  const shouldUseTwoFactor =
    passwordMethod?.configuration?.passwordConfig?.twoFactorAuthentication
      ?.enabled === true;
  useEffect(() => {
    if (loginData?.statusCode === 200) {
      // Use 2FA config from selected password method

      dispatch(clearPortalConfiguration());
      const userWithLoginMethod = {
        ...loginData.data,
        loginMethod: lastLoginMethodCode || loginData?.data?.loginMethod,
        portal: "IBP",
      };
      sessionStorage.setItem("user", JSON.stringify(userWithLoginMethod));
      setLoginState(userWithLoginMethod); // store login data (access token)
      if (shouldUseTwoFactor) {
        setStep("twoFactorAuthentication");
      } else {
        setIsFetchingUser(true); // previous login flow
        dispatch(setToastMessage(TOAST_MESSAGES.LOGIN_SUCCESS));
      }
    } else if (loginError) {
      dispatch(setToastMessage((loginError as any).message));
    }
  }, [loginData, loginError, dispatch, lastLoginMethodCode]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const [, response] = await Promise.all([
          environment.featureFlag.FF_IBP_CONSENT_MANAGEMENT
            ? dispatch(fetchTermsAndConditions())
            : Promise.resolve(null),
          axiosInstance.get(endPoints.employeeDetails),
        ]);

        const userData = response.data;

        const combinedUser = {
          ...loginState,
          ...userData?.data,
        };

        console.log("[SignIn] employeeDetails response:", userData?.data);
        console.log("[SignIn] combinedUser:", { isEmployee: combinedUser.isEmployee, isHR: combinedUser.isHR, roleKey: combinedUser.roleKey });

        // Save & redirect
        sessionStorage.setItem("user", JSON.stringify(combinedUser));

        if (environment.featureFlag.FF_IBP_CONSENT_MANAGEMENT) {
          const isPasswordMethod =
            lastLoginMethodCode === "EMAIL_PASSWORD" ||
            lastLoginMethodCode === "PHONE_PASSWORD" ||
            lastLoginMethodCode === "USERNAME_PASSWORD";
          const tcNotAccepted = !combinedUser?.isTCAccepted;
          const latestTcVersion = store.getState().tc.data?.version ?? null;
          const tcVersionMismatch =
            latestTcVersion !== null &&
            combinedUser?.tcAcceptedVersion !== latestTcVersion;
          const shouldShowPopup = isPasswordMethod && (tcNotAccepted || tcVersionMismatch);

          if (shouldShowPopup) {
            sessionStorage.setItem("showLoginWelcomePopup", "true");
          }
        }

        if (combinedUser.roleKey === "PORTAL_CRM") {
          navigate("/hr-portal/portfolio");
        } else if (combinedUser.isHR && combinedUser.isEmployee && combinedUser.roleKey !== "EXTERNAL_HR") {
          // HR_ADMIN / ONLY_HR who are also IBP employees → IBP portal
          if (onSuccess) { onSuccess(); } else { navigate("/"); }
        } else if (combinedUser.isHR) {
          navigate("/hr-portal/portfolio");
        } else if (onSuccess) {
          onSuccess();
        } else {
          navigate("/");
        }
        await apiRequest(endPoints.getActivityLogs, {
          method: "POST",
          data: {
            activityKey: "LOGGED_IN",
            activityCategory: "AUTH",
            referenceId: combinedUser?.employeeDetails?.id,
            referenceType: "USER",
            metadata: null,
          },
        });
      } catch (err: any) {
        console.error("User fetch error:", err);
        // If employee details fails, still redirect using token data alone
        const fallbackUser = loginState;
        if (fallbackUser?.accessToken?.accessToken) {
          if (fallbackUser.roleKey === "PORTAL_CRM") {
            navigate("/hr-portal/portfolio");
          } else if (fallbackUser.isHR && fallbackUser.isEmployee && fallbackUser.roleKey !== "EXTERNAL_HR") {
            navigate("/");
          } else if (fallbackUser.isHR) {
            navigate("/hr-portal/portfolio");
          } else {
            navigate("/");
          }
        } else {
          dispatch(setToastMessage(err.message || TOAST_MESSAGES.ERROR));
        }
      } finally {
        setIsFetchingUser(false);
      }
    };

    if (isFetchingUser && loginState?.accessToken?.accessToken) {
      fetchUserDetails();
    }
  }, [isFetchingUser, loginState, navigate, loginData]);

  // Phone OTP forgot password handlers
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    if (!phone.startsWith("+")) {
      return `+91${cleaned}`;
    }
    return `+${cleaned}`;
  };

  const handleSendForgotOTP = async () => {
    if (!phoneFormMethods) return;

    hasTriggeredMobileResetLinkRef.current = false;
    const isValid = await phoneFormMethods.trigger();
    if (!isValid) return;

    const formData = phoneFormMethods.getValues();
    const formattedPhone = formatPhoneNumber(formData.phoneNumber);

    sendForgotOTPMutate({
      endpoint: endPoints.sendPasswordResetOtp,
      method: "POST",
      data: { phoneNumber: formattedPhone, domain: subdomain },
    });
  };

  const handleVerifyForgotOTP = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      setHasForgotOtpError(true);
      return;
    }

    if (!phoneFormMethods) return;

    setHasForgotOtpError(false);
    const phoneData = phoneFormMethods.getValues();
    const formattedPhone = formatPhoneNumber(phoneData.phoneNumber);

    verifyForgotOTPMutate({
      endpoint: endPoints.varifyPasswordResetOtp,
      method: "POST",
      data: { phoneNumber: formattedPhone, otp: forgotOtp, domain: subdomain },
    });
  };

  const handleResendForgotOTP = async () => {
    setForgotOtp("");
    setIsForgotOtpVerified(false);
    setHasForgotOtpError(false);
    hasTriggeredMobileResetLinkRef.current = false;
    await handleSendForgotOTP();
  };

  const triggerResetLinkEmail = useCallback(
    (
      identifier: string,
      methodCode?: string,
      maskedDestination?: string,
    ) => {
      const normalizedIdentifier = String(identifier || "")
        .trim()
        .toLowerCase();

      if (!normalizedIdentifier || isSendingResetEmail) {
        return;
      }

      setResetLinkIdentifier(normalizedIdentifier);
      setResetLinkMethodCode(methodCode || "");
      setResetLinkDestination(
        maskedDestination ||
          (methodCode === "PHONE_PASSWORD"
            ? ""
            : normalizedIdentifier || resetLinkDestination),
      );
      setIsSendingResetEmail(true);

      doFetchResetPassword(
        endPoints.ibpSendResetMailByEmail(
          normalizedIdentifier,
          subdomain,
          methodCode,
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
    },
    [
      doFetchResetPassword,
      isSendingResetEmail,
      resetLinkDestination,
      subdomain,
    ],
  );

  const handleResetClick = () => {
    if (isSendingResetEmail) return;

    const identifier =
      formMethods?.getValues?.().email ||
      resetLinkIdentifier ||
      emailPasswordIdentifier;

    if (!identifier) {
      dispatch(setToastMessage(TOAST_MESSAGES.EMAIL_REQUIREMENT));
      return;
    }

    triggerResetLinkEmail(
      identifier,
      resetLinkMethodCode || passwordMethod?.methodCode,
      resetLinkDestination,
    );
  };

  useEffect(() => {
    if (resetPasswordData) {
      const maskedDestination =
        resetPasswordData?.data?.maskedEmail ||
        resetPasswordData?.maskedEmail ||
        "";
      dispatch(
        setToastMessage(
          resetPasswordData.message || TOAST_MESSAGES.EMAIL_SENT_SUCCESS
        )
      );
      setResetLinkMessage(
        resetPasswordData.message || TOAST_MESSAGES.EMAIL_SENT_SUCCESS,
      );
      setResetLinkDestination(
        maskedDestination ||
          resetLinkDestination ||
          resetLinkIdentifier ||
          "",
      );
      setStep("linkSent");
    }
    if (resetPasswordError) {
      dispatch(
        setToastMessage(resetPasswordError.message || TOAST_MESSAGES.ERROR)
      );
    }
    // Reset loading state regardless of success or error
    if (resetPasswordData || resetPasswordError) {
      setIsSendingResetEmail(false);
    }
  }, [
    resetLinkDestination,
    resetLinkIdentifier,
    resetPasswordData,
    resetPasswordError,
  ]);

  useEffect(() => {
    if (resetMailData) {
      clearResetQueryParams();
      dispatch(
        setToastMessage(
          resetMailData.message || TOAST_MESSAGES.RESET_SUCCESSFUL
        )
      );
      setStep("resetSuccessful");
    }
    if (resetMailError) {
      dispatch(
        setToastMessage(
          resetMailError.message || TOAST_MESSAGES.EMAIL_SENT_ERROR
        )
      );
    }
  }, [resetMailData, resetMailError]);

  // Handle phone OTP reset responses
  useEffect(() => {
    if (phoneOTPResetData) {
      setForgotOTPStep("otp");
      setIsResendDisabled(true);
      setResendCountdown(getResendCooldownSeconds(passwordMethod));
      dispatch(
        setToastMessage({
          message: phoneOTPResetData.message || "OTP sent successfully!",
          type: "success",
        })
      );
    }
    if (phoneOTPResetError) {
      dispatch(
        setToastMessage({
          message: phoneOTPResetError.message || "Failed to send OTP",
          type: "error",
        })
      );
    }
  }, [phoneOTPResetData, phoneOTPResetError, dispatch]);

  useEffect(() => {
    if (verifyOTPResetData) {
      if (hasTriggeredMobileResetLinkRef.current) {
        return;
      }
      hasTriggeredMobileResetLinkRef.current = true;
      setIsForgotOtpVerified(true);
      setHasForgotOtpError(false);
      dispatch(
        setToastMessage({
          message: "OTP verified. Sending reset link to your email...",
          type: "success",
        })
      );

      const phoneData = phoneFormMethods?.getValues();
      const formattedPhone = formatPhoneNumber(phoneData?.phoneNumber || "");
      if (formattedPhone) {
        triggerResetLinkEmail(
          formattedPhone,
          "PHONE_PASSWORD",
          resetLinkDestination,
        );
      }
    }
    if (verifyOTPResetError) {
      hasTriggeredMobileResetLinkRef.current = false;
      setHasForgotOtpError(true);
      setIsForgotOtpVerified(false);
      dispatch(
        setToastMessage({
          message: verifyOTPResetError.message || "Invalid OTP",
          type: "error",
        })
      );
    }
  }, [verifyOTPResetData, verifyOTPResetError, dispatch, phoneFormMethods, resetLinkDestination, triggerResetLinkEmail]);

  // Resend countdown effect for forgot password OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else {
      setIsResendDisabled(false);
    }
  }, [resendCountdown]);

  useEffect(() => {
    if (twoFactorResendCountdown > 0) {
      const timer = setTimeout(
        () => setTwoFactorResendCountdown(twoFactorResendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
    setIsTwoFactorResendDisabled(false);
    return undefined;
  }, [twoFactorResendCountdown]);

  const [watchedPassword, setWatchedPassword] = useState("");
  // to keep track of confirm password field
  const [watchedConfirmPassword, setWatchedConfirmPassword] = useState("");
  useEffect(() => {
    if (!formMethods) return;
    const subscription = formMethods.watch((values) => {
      setWatchedPassword(values.newPassword || "");
      setWatchedConfirmPassword(values.confirmPassword || "");
    });
    return () => subscription.unsubscribe();
  }, [formMethods]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const fetchBrandingLogo = async () => {
      if (!resolvedLogoFileId || resolvedLogoFileId <= 0) {
        setBrandingLogoUrl(null);
        setBrandingLogoFailed(false);
        return;
      }

      const tryDownload = async (url: string) => {
        const response = await axiosInstance.get(url, { responseType: "blob" });
        return (response as any)?.data ?? response;
      };

      for (const url of resolvedLogoDownloadUrls) {
        try {
          setBrandingLogoFailed(false);
          const blobData = await tryDownload(url);
          if (!active) return;
          objectUrl = URL.createObjectURL(blobData);
          setBrandingLogoUrl(objectUrl);
          return;
        } catch (error) {
          console.warn("Unable to load branding logo from", url, error);
        }
      }

      if (active) {
        setBrandingLogoUrl(null);
        setBrandingLogoFailed(true);
      }
    };

    fetchBrandingLogo();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resolvedLogoFileId, resolvedLogoDownloadUrls]);

  const handleLogoError = () => {
    setBrandingLogoFailed(true);
    setBrandingLogoUrl(null);
  };

  // Render authentication content based on current tab and available methods
  const renderAuthenticationContent = () => {
    const methods = methodsByCategory[loginMethod];
    const authMethod = currentAuthMethod;

    if (!authMethod) {
      return <div>No authentication methods available</div>;
    }

    // Get password and OTP methods for this tab
    const passwordMethods = methods.filter((m) =>
      m.methodCode.includes("PASSWORD")
    );
    const otpMethods = methods.filter((m) => m.methodCode.includes("OTP"));
    const oauthMethods = methods.filter((m) => m.methodCode.includes("OAUTH"));

    // Determine what to show by default
    const defaultMethod =
      passwordMethods[0] || otpMethods[0] || oauthMethods[0];
    const showPasswordFirst = passwordMethods.length > 0;
    const hasOtpAlternative = otpMethods.length > 0;
    const hasOauthAlternative = oauthMethods.length > 0;

    // Check if we're currently showing an OTP method (clicked from button)
    const isShowingOtp = otpMethods.some(
      (m) => m.methodCode === authMethod.methodCode
    );
    const isShowingOauth = oauthMethods.some(
      (m) => m.methodCode === authMethod.methodCode
    );

    return (
      <div>
        {/* Show Password Method by Default (only when not showing OTP or OAuth) */}
        {!isShowingOtp && !isShowingOauth && showPasswordFirst && (
          <>
            <DynamicForm
              key={formKey}
              formConfig={loginFormConfig}
              defaultValues={getInitialSignInData}
              formMethods={setFormMethods}
            />

            {!hideForgotPassword && (
              <ForgotPasswordLink onClick={() => setStep("forgot")}>
                {passwordRecoveryLabel}
              </ForgotPasswordLink>
            )}

            {environment.enableCaptcha && (
              <CaptchaContainer
                sx={{
                  minHeight: captcha.isCaptchaVerified ? 0 : "65px",
                  marginTop: captcha.isCaptchaVerified ? 0 : "25px",
                  opacity: captcha.isCaptchaVerified ? 0 : 1,
                  height: captcha.isCaptchaVerified ? 0 : "auto",
                  overflow: "hidden",
                  transition: "all 0.3s ease-in-out",
                }}
              >
                <CaptchaComponent
                  captchaKey={captcha.captchaKey}
                  captchaRef={captcha.captchaRef}
                  onVerify={captcha.handleCaptchaVerify}
                />
              </CaptchaContainer>
            )}

            <ButtomContainer>
              {(() => {
                const primaryLabel =
                  (passwordMethod?.methodCode === "EMAIL_PASSWORD" &&
                    !emailPasswordReady) ||
                  (passwordMethod?.methodCode === "PHONE_PASSWORD" &&
                    !phonePasswordReady)
                    ? "Continue"
                    : shouldUseTwoFactor
                    ? LOGIN_IWH
                    : "Sign In";
                return (
                  <ButtonWrapper
                    variant="contained"
                    buttonType="secondary"
                    label={primaryLabel}
                    onClick={
                      formMethods
                        ? formMethods.handleSubmit(onSubmit)
                        : undefined
                    }
                    loading={loading || isFetchingUser}
                    disabled={
                      loading ||
                      isFetchingUser ||
                      (environment.enableCaptcha && !captcha.isCaptchaVerified)
                    }
                    bgcolor={theme.palette.background.buttonbackground}
                    color={theme.palette.background.paper}
                  />
                );
              })()}
            </ButtomContainer>

            {/* Show OTP Alternative Links when password method is shown */}
            {hasOtpAlternative && (
              <>
                {otpMethods.map((otpMethod) => (
                  <ButtomContainer
                    key={otpMethod.methodCode}
                    style={{ marginTop: "15px" }}
                  >
                    <ButtonWrapper
                      variant="text"
                      buttonType="primary"
                      label={`Login with ${otpMethod.methodName}`}
                      onClick={() => {
                        setSelectedAuthType((prev) => ({
                          ...prev,
                          [loginMethod]: otpMethod.methodCode,
                        }));
                      }}
                      disabled={loading || isFetchingUser}
                      color={theme.palette.text.lightGradientBlue}
                    />
                  </ButtomContainer>
                ))}
              </>
            )}

            {/* Show OAuth Alternative Buttons */}
            {hasOauthAlternative &&
              oauthMethods.map((method) => (
                <ButtomContainer
                  key={method.methodCode}
                  style={{ marginTop: "15px" }}
                >
                  <ButtonWrapper
                    variant="outlined"
                    buttonType="secondary"
                    label={`Login with ${
                      method.methodCode.includes("GOOGLE")
                        ? "Google"
                        : "Microsoft"
                    }`}
                    onClick={() => {
                      setSelectedAuthType((prev) => ({
                        ...prev,
                        [loginMethod]: method.methodCode,
                      }));
                    }}
                    disabled={loading || isFetchingUser}
                    bgcolor={theme.palette.background.buttonbackground}
                    color={theme.palette.background.paper}
                  />
                </ButtomContainer>
              ))}
          </>
        )}

        {/* Show OTP Method when selected */}
        {isShowingOtp && (
          <>
            {isPhoneOtpMethodCode(authMethod.methodCode) ? (
              <Suspense fallback={<div>Loading...</div>}>
                <OTPAuth
                  loading={loading || isFetchingUser}
                  setLoading={(val) => {}}
                  resendCooldownSeconds={getResendCooldownSeconds(authMethod)}
                />
              </Suspense>
            ) : isEmailOtpMethodCode(authMethod.methodCode) ? (
              <Suspense fallback={<div>Loading...</div>}>
                <CustomEmailOTP
                  loading={loading || isFetchingUser}
                  setLoading={(val) => {}}
                  resendCooldownSeconds={getResendCooldownSeconds(authMethod)}
                />
              </Suspense>
            ) : null}

            {/* Back to Password Button */}
            {passwordMethods.length > 0 && (
              <ButtomContainer style={{ marginTop: "20px" }}>
                <ButtonWrapper
                  variant="text"
                  buttonType="primary"
                  label="Back to Password Login"
                  onClick={() => {
                    const passwordMethod = passwordMethods[0];
                    if (passwordMethod) {
                      setSelectedAuthType((prev) => ({
                        ...prev,
                        [loginMethod]: passwordMethod.methodCode,
                      }));
                    }
                  }}
                  disabled={loading || isFetchingUser}
                  color={theme.palette.text.lightGradientBlue}
                />
              </ButtomContainer>
            )}
          </>
        )}

        {/* Show OAuth Method when selected */}
        {isShowingOauth && (
          <>
            {authMethod.methodCode === "GOOGLE_OAUTH" ? (
              <ButtomContainer>
                <ButtonWrapper
                  variant="outlined"
                  buttonType="secondary"
                  label={googleLabel}
                  bgcolor="#093F84"
                  color={theme.palette.background.paper}
                  onClick={async () => {
                    try {
                      const url = `${environment.authUrl}/auth/google/auth-url`;
                      const response = await axiosInstance.get(url);
                      if (response.data?.url) {
                        window.location.href = response.data.url;
                      }
                    } catch (error) {
                      // Error will be handled by axios interceptor
                    }
                  }}
                  disabled={loading || isFetchingUser || authConfigLoading}
                  startIcon={
                    <svg
                      width="18"
                      height="18"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  }
                />
              </ButtomContainer>
            ) : authMethod.methodCode === "MICROSOFT_OAUTH" ? (
              <ButtomContainer>
                <ButtonWrapper
                  variant="outlined"
                  buttonType="secondary"
                  label={microsoftLabel}
                  onClick={async () => {
                    try {
                      const url = `${environment.authUrl}/auth/microsoft/auth-url`;
                      const response = await axiosInstance.get(url);
                      if (response.data?.url) {
                        window.location.href = response.data.url;
                      }
                    } catch (error) {
                      // Error handled via interceptor
                    }
                  }}
                  disabled={loading || isFetchingUser || authConfigLoading}
                  startIcon={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M0 0h11v11H0z" fill="#f1511b" />
                      <path d="M13 0h11v11H13z" fill="#85bc2a" />
                      <path d="M0 13h11v11H0z" fill="#00adef" />
                      <path d="M13 13h11v11H13z" fill="#ffb612" />
                    </svg>
                  }
                  bgcolor={theme.palette.background.buttonbackground}
                  color={theme.palette.background.paper}
                />
              </ButtomContainer>
            ) : null}

            {/* Back to main auth options */}
            <ButtomContainer style={{ marginTop: "20px" }}>
              <ButtonWrapper
                variant="text"
                buttonType="primary"
                label="Back to Other Options"
                onClick={() => {
                  const defaultMethod = passwordMethods[0] || otpMethods[0];
                  if (defaultMethod) {
                    setSelectedAuthType((prev) => ({
                      ...prev,
                      [loginMethod]: defaultMethod.methodCode,
                    }));
                  }
                }}
                disabled={loading || isFetchingUser}
                color={theme.palette.background.buttonbackground}
              />
            </ButtomContainer>
          </>
        )}

        {/* Show OTP Only (when no password method available - NOT when user clicked OTP from password) */}
        {!isShowingOtp &&
          !showPasswordFirst &&
          !isShowingOauth &&
          otpMethods.length > 0 && (
            <>
              {/* Render only the current auth method */}
              {isPhoneOtpMethodCode(authMethod.methodCode) && (
                <Suspense fallback={<div>Loading...</div>}>
                  <OTPAuth
                    loading={loading || isFetchingUser}
                    setLoading={(val) => {}}
                    resendCooldownSeconds={getResendCooldownSeconds(authMethod)}
                  />
                </Suspense>
              )}

              {isEmailOtpMethodCode(authMethod.methodCode) && (
                <Suspense fallback={<div>Loading...</div>}>
                  <CustomEmailOTP
                    loading={loading || isFetchingUser}
                    setLoading={(val) => {}}
                    resendCooldownSeconds={getResendCooldownSeconds(authMethod)}
                  />
                </Suspense>
              )}

              {/* Show alternative OTP buttons if multiple OTP methods available */}
              {otpMethods.length > 1 && (
                <>
                  {otpMethods
                    .filter(
                      (method) => method.methodCode !== authMethod.methodCode
                    )
                    .map((method) => (
                      <ButtomContainer
                        key={method.methodCode}
                        style={{ marginTop: "15px" }}
                      >
                        <ButtonWrapper
                          variant="outlined"
                          buttonType="secondary"
                          label={`Login with ${method.methodName}`}
                          onClick={() => {
                            setSelectedAuthType((prev) => ({
                              ...prev,
                              [loginMethod]: method.methodCode,
                            }));
                          }}
                          disabled={loading || isFetchingUser}
                          bgcolor={theme.palette.background.buttonbackground}
                          color={theme.palette.background.paper}
                        />
                      </ButtomContainer>
                    ))}
                </>
              )}
            </>
          )}

        {/* Show OAuth Only (when no password or OTP method available) */}
        {!showPasswordFirst &&
          otpMethods.length === 0 &&
          !isShowingOtp &&
          oauthMethods.length > 0 && (
            <>
              {oauthMethods.map((method) => (
                <ButtomContainer
                  key={method.methodCode}
                  style={{ marginTop: "15px" }}
                >
                  <ButtonWrapper
                    variant="outlined"
                    buttonType="secondary"
                    label={`Login with ${
                      method.methodCode.includes("GOOGLE")
                        ? "Google"
                        : "Microsoft"
                    }`}
                    onClick={async () => {
                      try {
                        const url = method.methodCode.includes("GOOGLE")
                          ? `${environment.authUrl}/auth/google/auth-url`
                          : `${environment.authUrl}/auth/microsoft/auth-url`;
                        const response = await axiosInstance.get(url);
                        if (response.data?.url) {
                          window.location.href = response.data.url;
                        }
                      } catch (error) {
                        // Error handled via interceptor
                      }
                    }}
                    disabled={loading || isFetchingUser}
                    bgcolor={theme.palette.background.buttonbackground}
                    color={theme.palette.background.paper}
                  />
                </ButtomContainer>
              ))}
            </>
          )}
      </div>
    );
  };

  const activeLoginMethods = methodsByCategory[loginMethod];
  const selectedLoginMethodCode =
    selectedAuthType[loginMethod] ||
    getPreferredMethodForTab(loginMethod)?.methodCode;
  const selectedLoginOption =
    activeLoginMethods.find(
      (method) => method.methodCode === selectedLoginMethodCode
    ) || getPreferredMethodForTab(loginMethod);
  const selectableLoginMethods = activeLoginMethods
    .filter((method) => !method.methodCode.includes("OAUTH"))
    .sort((a, b) => {
      // Password always first
      const aIsPassword = a.methodCode.includes("PASSWORD");
      const bIsPassword = b.methodCode.includes("PASSWORD");
      if (aIsPassword && !bIsPassword) return -1;
      if (!aIsPassword && bIsPassword) return 1;
      return 0;
    });
  const activeOauthMethods = activeLoginMethods.filter((method) =>
    method.methodCode.includes("OAUTH")
  );
  const selectedIdentifierLabel = maskSelectedIdentifier(
    loginMethod,
    resolvedIdentifier
  );
  
  return (
    <LoginPageContainer  
      sx={
        isFullPage
          ? {
              minHeight: "100vh",
              height: "100vh",
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
            }
          : {
              minHeight: "auto",
              height: "auto",
            }
      }
    >
      {isFullPage && step !== "otp" && step !== "email-otp" && (
        <LoginPageHeader>
          {headerLogoSrc && !brandingLogoFailed && (
            <LoginPageLogo
              src={headerLogoSrc}
              alt=""
              onClick={() => navigate("/landing")}
              onError={handleLogoError}
            />
          )}
          <LoginPageActions>
            {!isSupportPageOpen && <LoginPageSupportButton onClick={handleContactSupport} style={{ cursor: "pointer" }}>Support</LoginPageSupportButton>}
            <LoginPageHomeButton onClick={() => navigate("/landing")}>
              Home
            </LoginPageHomeButton>
          </LoginPageActions>
        </LoginPageHeader>
      )}
      <LoginFlowShell
        sx={
          isFullPage
            ? {
                flex: 1,
                minHeight: 0,
                height: "auto",
                gridTemplateColumns: "minmax(0, 1.7fr) minmax(420px, 31%)",
                // overflow: "hidden",
              }
            : undefined
        }
      >
        <LoginFlowHero
          sx={
            isFullPage
              ? {
                  minHeight: 0,
                  height: "100%",
                  // padding: "36px 3.5%",
                }
              : undefined
          }
        >
          <LoginFlowCurve
            src={LoginBackgroundImage}
            alt="Login background"
          />
          <LoginFlowBoy
            src={LoginBoyImage}
            alt="Login illustration"
            sx={
              isFullPage
                ? {
                    // 769–1280px: lift boy up from the bottom edge
                    "@media (min-width: 769px) and (max-width: 1280px)": {
                      bottom: "75px",
                    },
                    // >1280px: desktop overrides
                    "@media (min-width: 1281px)": {
                      width: "40%",
                      maxWidth: "260px",
                      minWidth: "112px",
                      left: "3%",
                      bottom: "10px",
                    },
                  }
                : undefined
            }
          />
          <LoginFlowHeroContent
            sx={
              isFullPage
                ? {
                    marginLeft: "30%",
                    maxWidth: "506px",
                  }
                : undefined
            }
          >
            <LoginFlowHeroTitle
              key={heroSlide}
              sx={
                isFullPage
                  ? {
                      fontSize: "64px",
                    }
                  : undefined
              }
            >
              {HERO_SLIDES[heroSlide].line1}
              <br />
              {HERO_SLIDES[heroSlide].line2}
              <br />
              {HERO_SLIDES[heroSlide].line3}
            </LoginFlowHeroTitle>
            <LoginFlowHeroDots>
              {HERO_SLIDES.map((_, i) => (
                <LoginFlowHeroDot
                  key={i}
                  $active={i === heroSlide}
                  onClick={() => setHeroSlide(i)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </LoginFlowHeroDots>
          </LoginFlowHeroContent>
        </LoginFlowHero>
        <LoginFlowCardArea
          sx={
            isFullPage
              ? {
                  // padding: "32px 3.5% 32px 24px",
                  alignItems: "center",
                }
              : undefined
          }
        >
          <LoginFlowCard
            sx={
              isFullPage
                ? {
                    width: "100%",
                    maxWidth: "420px",
                    minHeight: "452px",
                    height: "auto",
                    maxHeight: "calc(100vh - 96px)",
                    // padding: "28px 32px",
                    boxShadow: "none",
                  }
                : undefined
            }
          >
            <StyledLogin>
              <LoginContainer
                tabIndex={0}
                onKeyDown={async (e) => {
                  if (
                    e.key === "Enter" &&
                    !loading &&
                    !isCheckingPasswordReadiness
                  ) {
                    // Let OTP components handle Enter for send/verify actions themselves
                    if (
                      step === "otp" ||
                      step === "email-otp" ||
                      (step === "login" &&
                        (isPhoneOtpMethodCode(currentAuthMethod?.methodCode) ||
                          isEmailOtpMethodCode(currentAuthMethod?.methodCode)))
                    ) {
                      return; // Don't preventDefault, let OTPAuth handle it
                    }

                    // For all other cases, handle normally
                    e.preventDefault();
                    if (step === "login") {
                      if (loginStage === "identifier") {
                        await handleIdentifierContinue();
                      } else {
                        formMethods?.handleSubmit(onSubmit)();
                      }
                    } else if (step === "reset") {
                      handleResetPasswordSubmit();
                    }
                  }
                }}
                step={step}
                sx={
                  isFullPage
                    ? {
                        maxWidth: "100%",
                        paddingBottom: 0,
                        overflowY: "hidden",
                      }
                    : undefined
                }
              >
                {/* {loginError && <StyledAlert>{(loginError as any).message}</StyledAlert>} */}
                {/* <DynamicForm
              formConfig={LOGIN_FORM_CONFIG}
              defaultValues={initialSignInData}
              formMethods={setFormMethods}
              sx={{ maxWidth: "372px" }}
            />
            <ForgotPasswordLink to="/reset-password">
              {FORGOT_PASSWORD}
            </ForgotPasswordLink>
            <ButtomContainer>
              <CommonButton
                variant="contained"
                buttonType="secondary"
                label={LOGIN_IWH}
                onClick={
                  formMethods ? formMethods.handleSubmit(onSubmit) : undefined
                }
                loading={loading}
                disabled={loading}
                bgcolor={theme.palette.text.Deeporange}
               color={theme.palette.background.paper}
               width="160px"
               height="40px"
              />

            </ButtomContainer> */}

                {step === "login" && (
                  <>
                    <HeadingContainer>
                      <TitleContainer variant="h1">Login</TitleContainer>
                      {/* {loginStage === "identifier" && (
                        <SubTitleContainer>
                          {getIdentifierSubtitle()}
                        </SubTitleContainer>
                      )} */}
                      {loginStage === "auth" &&
                        loginMethod !== "employeeId" && (
                          <SubTitleContainer>
                            Verify to login with registered{" "} <br></br>
                            {loginMethod === "mobile" ? "mobile no" : "email"}{" "}
                            {selectedIdentifierLabel}
                          </SubTitleContainer>
                        )}
                    </HeadingContainer>

                    {loginStage === "identifier" ? (
                      <LoginFlowFormStack>
                        <div>
                          <LoginFlowFieldLabel>
                            {getIdentifierLabel()}
                          </LoginFlowFieldLabel>
                          <LoginFlowTextField
                            fullWidth
                            value={identifierInput}
                            placeholder={getIdentifierPlaceholder()}
                            onChange={(e) => setIdentifierInput(e.target.value)}
                            onKeyDown={async (e) => {
                              if (
                                e.key === "Enter" &&
                                !loading &&
                                !isCheckingPasswordReadiness
                              ) {
                                e.preventDefault();
                                e.stopPropagation(); // Prevent bubbling to parent handler
                                await handleIdentifierContinue();
                              }
                            }}
                          />
                        </div>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            width: "100%",
                          }}
                        >
                          <LoginFlowPrimaryButton
                            variant="contained"
                            buttonType="secondary"
                            label={
                              isCheckingPasswordReadiness
                                ? "Checking..."
                                : "Login"
                            }
                            onClick={async () => await handleIdentifierContinue()}
                            loading={
                              loading ||
                              authConfigLoading ||
                              isCheckingPasswordReadiness
                            }
                            disabled={
                              loading ||
                              authConfigLoading ||
                              isCheckingPasswordReadiness
                            }
                            bgcolor={theme.palette.background.buttonbackground}
                            color={theme.palette.background.paper}
                          />
                        </Box>
                        <LoginFlowDividerText>Or</LoginFlowDividerText>
                        <LoginFlowSecondaryButton
                          variant="outlined"
                          buttonType="secondary"
                          label="Login with Employee ID"
                          onClick={handleEmployeeIdLogin}
                          disabled={!tabAvailability.employeeId}
                          bgcolor="#FFFFFF"
                          color={theme.palette.background.buttonbackground}
                        />
                        <SupportText>
                          Need help?{" "}
                          <a onClick={handleContactSupport}>
                            Contact HR Support
                          </a>
                        </SupportText>
                      </LoginFlowFormStack>
                    ) : (
                      <>
                        {selectableLoginMethods.length > 1 && (
                          <LoginMethodCards>
                            {selectableLoginMethods.map((method) => {
                              const isSelected =
                                selectedLoginOption?.methodCode ===
                                method.methodCode;
                              const isPasswordMethod =
                                method.methodCode.includes("PASSWORD");

                              // Pick icon based on specific method code
                              const methodIcon = (() => {
                                return isPasswordMethod ? emailOtpIcon : phoneOtpIcon;
                              })();

                              const methodLabel = (() => {
                                return isPasswordMethod ? "Password" : "OTP";
                              })();

                              return (
                                <LoginMethodCard
                                  key={method.methodCode}
                                  $selected={isSelected}
                                  onClick={() =>
                                    handleLoginMethodSelection(method)
                                  }
                                >
                                  <LoginMethodCardInfo>
                                    <LoginMethodCardIcon
                                      $variant={
                                        isPasswordMethod ? "password" : "otp"
                                      }
                                    >
                                      <img
                                        src={methodIcon}
                                        alt={methodLabel}
                                        style={{ width: 40, height: 40 }}
                                      />
                                    </LoginMethodCardIcon>
                                    <LoginMethodCardTitle>
                                      {methodLabel}
                                    </LoginMethodCardTitle>
                                  </LoginMethodCardInfo>
                                  <LoginMethodCardSelectionIcon
                                    src={
                                      isSelected
                                        ? BaseHealthPlanFilledIcon
                                        : AuthInitialIcon
                                    }
                                    alt={
                                      isSelected ? "Selected" : "Not selected"
                                    }
                                  />
                                </LoginMethodCard>
                              );
                            })}
                          </LoginMethodCards>
                        )}

                        {selectedLoginOption?.methodCode?.includes(
                          "PASSWORD"
                        ) && (
                          <Box sx={{ paddingTop: 6 }}>
                            <DynamicForm
                              key={formKey}
                              formConfig={loginFormConfig}
                              defaultValues={getInitialSignInData}
                              formMethods={setFormMethods}
                            />

                            {(loginMethod === "email" ||
                              loginMethod === "mobile" ||
                              loginMethod === "employeeId") && (
                              <ForgotPasswordLink
                                onClick={() => setStep("forgot")}
                              >
                                Forgot Password?
                              </ForgotPasswordLink>
                            )}

                            {environment.enableCaptcha && (
                              <CaptchaContainer
                                sx={{
                                  minHeight: captcha.isCaptchaVerified
                                    ? 0
                                    : "65px",
                                  marginTop: captcha.isCaptchaVerified
                                    ? 0
                                    : "25px",
                                  opacity: captcha.isCaptchaVerified ? 0 : 1,
                                  height: captcha.isCaptchaVerified
                                    ? 0
                                    : "auto",
                                  overflow: "hidden",
                                  transition: "all 0.3s ease-in-out",
                                }}
                              >
                                <CaptchaComponent
                                  captchaKey={captcha.captchaKey}
                                  captchaRef={captcha.captchaRef}
                                  onVerify={captcha.handleCaptchaVerify}
                                />
                              </CaptchaContainer>
                            )}
                          <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            width: "100%",
                          }}
                        >
                            <LoginFlowPrimaryButton
                              variant="contained"
                              buttonType="secondary"
                              label={
                                (selectedLoginOption?.methodCode ===
                                  "EMAIL_PASSWORD" &&
                                  !emailPasswordReady) ||
                                (selectedLoginOption?.methodCode ===
                                  "PHONE_PASSWORD" &&
                                  !phonePasswordReady)
                                  ? "Continue"
                                  : "Login"
                              }
                              onClick={
                                formMethods
                                  ? formMethods.handleSubmit(onSubmit)
                                  : undefined
                              }
                              loading={loading || isFetchingUser}
                              disabled={
                                loading ||
                                isFetchingUser ||
                                (environment.enableCaptcha &&
                                  !captcha.isCaptchaVerified)
                              }
                              bgcolor="#093F84"
                              color={theme.palette.background.paper}
                            />
                            </Box>
                          </Box>
                        )}

                        {selectedLoginOption?.methodCode?.includes("OTP") && (
                          <>
                            {/* Show loader during OTP initialization */}
                            {isOtpInitializing ? (
                              <div
                                style={{
                                  height: "200px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexDirection: "column",
                                  gap: "16px",
                                }}
                              >
                                <OtpSpinner />
                                <span
                                  style={{ color: "#666", fontSize: "14px" }}
                                >
                                  Sending OTP...
                                </span>
                              </div>
                            ) : (
                              <>
                                {isEmailOtpMethodCode(
                                  selectedLoginOption?.methodCode
                                ) ? (
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <CustomEmailOTP
                                      loading={loading || isFetchingUser}
                                      setLoading={(val) => {}}
                                      initialEmail={resolvedIdentifier}
                                      autoSendOnMount={Boolean(
                                        resolvedIdentifier
                                      ) &&
                                        !isWithinOtpCooldown(
                                          selectedLoginOption?.methodCode || "EMAIL_OTP"
                                        )}
                                      hideIdentifierEntry={Boolean(
                                        resolvedIdentifier
                                      )}
                                      onBack={resetToIdentifierStage}
                                      backLabel="Change Email"
                                      resendCooldownSeconds={getResendCooldownSeconds(
                                        selectedLoginOption
                                      )}
                                      remainingResendCooldownSeconds={getRemainingCooldownSeconds("EMAIL_OTP")}
                                      onOtpSent={() => {
                                        setLastOtpSendTime(Date.now());
                                        setIsOtpInitializing(false);
                                      }}
                                    />
                                  </Suspense>
                                ) : isPhoneOtpMethodCode(
                                  selectedLoginOption?.methodCode
                                ) ? (
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <OTPAuth
                                      loading={loading || isFetchingUser}
                                      setLoading={(val) => {}}
                                      initialPhoneNumber={resolvedIdentifier}
                                      autoSendOnMount={Boolean(
                                        resolvedIdentifier
                                      ) &&
                                        !isWithinOtpCooldown(
                                          selectedLoginOption?.methodCode || "PHONE_OTP"
                                        )}
                                      hideIdentifierEntry={Boolean(
                                        resolvedIdentifier
                                      )}
                                      onBack={resetToIdentifierStage}
                                      backLabel="Change Mobile Number"
                                      resendCooldownSeconds={getResendCooldownSeconds(
                                        selectedLoginOption
                                      )}
                                      remainingResendCooldownSeconds={getRemainingCooldownSeconds(
                                        selectedLoginOption?.methodCode || "PHONE_OTP"
                                      )}
                                      onOtpSent={() => {
                                        setLastOtpSendTime(Date.now());
                                        setIsOtpInitializing(false);
                                      }}
                                    />
                                  </Suspense>
                                ) : null}
                              </>
                            )}
                          </>
                        )}

                        {activeOauthMethods.length > 0 && (
                          <>
                            {activeOauthMethods.map((method) => (
                              <ButtomContainer key={method.methodCode}>
                                <ButtonWrapper
                                  variant="outlined"
                                  buttonType="secondary"
                                  label={`Login with ${
                                    method.methodCode.includes("GOOGLE")
                                      ? "Google"
                                      : "Microsoft"
                                  }`}
                                  onClick={async () => {
                                    try {
                                      const url = method.methodCode.includes(
                                        "GOOGLE"
                                      )
                                        ? `${environment.authUrl}/auth/google/auth-url`
                                        : `${environment.authUrl}/auth/microsoft/auth-url`;
                                      const response = await axiosInstance.get(
                                        url
                                      );
                                      if (response.data?.url) {
                                        window.location.href =
                                          response.data.url;
                                      }
                                    } catch (error) {
                                      // handled via interceptor
                                    }
                                  }}
                                  disabled={
                                    loading ||
                                    isFetchingUser ||
                                    authConfigLoading
                                  }
                                  bgcolor="#FFFFFF"
                                  color={
                                    theme.palette.background.buttonbackground
                                  }
                                />
                              </ButtomContainer>
                            ))}
                          </>
                        )}

                        {!selectedLoginOption?.methodCode?.includes("OTP") && (
                          <LoginFlowInlineAction
                            onClick={resetToIdentifierStage}
                          >
                            {loginMethod === "employeeId"
                              ? "Back to Email or Mobile login"
                              : `Change ${
                                  loginMethod === "mobile"
                                    ? "Mobile Number"
                                    : "Email"
                                }`}
                          </LoginFlowInlineAction>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* 2FA - Method selection + Send OTP */}
                {step === "twoFactorAuthentication" && (
                  <div
                    tabIndex={0}
                    style={{ outline: "none" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isSendingTwoFactorOtp) {
                        e.preventDefault();
                        handleSendTwoFactorOtp();
                      }
                    }}
                  >
                    <HeadingContainer>
                      <TitleContainer variant="h1">
                        {SIGNIN.SIGNIN_TO_YOUR_PORTAL}
                      </TitleContainer>
                      <SubTitleContainer>
                        Choose your preferred login method
                      </SubTitleContainer>
                    </HeadingContainer>

                    <AuthenticationContainer>
                      {allowedTwoFactorMethods.length === 1 ? (
                        /* Single method: skip selection, show spinner while auto-sending */
                        <div
                          style={{
                            minHeight: 160,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                          }}
                        >
                          <OtpSpinner />
                          <span style={{ color: "#666", fontSize: "14px" }}>
                            Sending OTP to your registered {twoFactorMethod === "email" ? "email" : "mobile number"}...
                          </span>
                        </div>
                      ) : (
                        <>
                      <AuthenticationWrapper>
                        <AuthenticationHeading>
                          Two-Factor Authentication (2FA)
                        </AuthenticationHeading>
                        <AuthenticationSubHeading>
                          Please enter the OTP sent to your registered contact
                          to complete login
                        </AuthenticationSubHeading>
                        <PrimaryAuthenticationWrapper
                          onClick={() => setStep("login")}
                        >
                          <PrimaryAuthenticationIcon
                            src={TwoFactorAuthIcon}
                            alt="2FA Icon"
                          />
                          <PrimaryAuthenticationText>
                            Go back to primary authentication
                          </PrimaryAuthenticationText>
                        </PrimaryAuthenticationWrapper>
                      </AuthenticationWrapper>
                      <AuthenticationRadioWrapper>
                        <AuthenticationRadioText>
                          Select OTP delivery method(s):
                        </AuthenticationRadioText>
                        <AuthRadioGroup>
                          {allowedTwoFactorMethods.includes("mobile") && (
                            <AuthenticationRadioOption
                              onClick={() => setTwoFactorMethod("mobile")}
                              className={
                                twoFactorMethod === "mobile" ? "selected" : ""
                              }
                            >
                              <img
                                src={
                                  twoFactorMethod === "mobile"
                                    ? BaseHealthPlanFilledIcon
                                    : AuthInitialIcon
                                }
                                alt="selection icon"
                              />
                              <AuthenticationRadioLabel>
                                Phone Number
                              </AuthenticationRadioLabel>
                            </AuthenticationRadioOption>
                          )}

                          {allowedTwoFactorMethods.includes("email") && (
                            <AuthenticationRadioOption
                              onClick={() => setTwoFactorMethod("email")}
                              className={
                                twoFactorMethod === "email" ? "selected" : ""
                              }
                            >
                              <img
                                src={
                                  twoFactorMethod === "email"
                                    ? BaseHealthPlanFilledIcon
                                    : AuthInitialIcon
                                }
                                alt="selection icon"
                              />
                              <AuthenticationRadioLabel>
                                Email Address
                              </AuthenticationRadioLabel>
                            </AuthenticationRadioOption>
                          )}
                        </AuthRadioGroup>
                      </AuthenticationRadioWrapper>
                      <AuthenticationButtonWrapper>
                        <ButtonWrapper
                          variant="contained"
                          buttonType="secondary"
                          label={SEND_OTP}
                          loading={isSendingTwoFactorOtp}
                          onClick={handleSendTwoFactorOtp}
                          bgcolor={theme.palette.background.buttonbackground}
                          color={theme.palette.background.paper}
                        />
                      </AuthenticationButtonWrapper>
                        </>
                      )}
                    </AuthenticationContainer>
                  </div>
                )}

                {/* 2FA - OTP input + Verify */}
                {step === "twoFactorOtpVerify" && (
                  <div
                    tabIndex={0}
                    style={{ outline: "none" }}
                    onKeyDown={(e) => {
                      // Trigger Verify OTP button on Enter, but not Resend OTP link
                      if (
                        e.key === "Enter" &&
                        !isSendingTwoFactorOtp &&
                        !isVerifyingTwoFactorOtp
                      ) {
                        e.preventDefault();
                        handleVerifyTwoFactorOtp();
                      }
                    }}
                  >
                    <HeadingContainer>
                      <TitleContainer variant="h1">
                        {SIGNIN.SIGNIN_TO_YOUR_PORTAL}
                      </TitleContainer>
                      {/* <SubTitleContainer>Choose your preferred login method</SubTitleContainer> */}
                    </HeadingContainer>
                    <OtpVerificationContainer>
                      <OtpSentMessage>
                        We've sent a 6-digit OTP to{" "}
                        <span>{getTwoFactorOtpDestination()}</span>
                      </OtpSentMessage>

                      <OtpInputWrapper>
                        {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                          <OtpInput
                            key={index}
                            type="text"
                            maxLength={1}
                            value={otpValues[index]}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            ref={(el) => (otpInputRefs.current[index] = el)}
                          />
                        ))}
                      </OtpInputWrapper>

                      <OtpActionsWrapper>
                        <OtpActionText>Didn't receive OTP?</OtpActionText>
                        <OtpActionLink
                          onClick={
                            isSendingTwoFactorOtp || isTwoFactorResendDisabled
                              ? undefined
                              : handleSendTwoFactorOtp
                          }
                          style={{
                            opacity:
                              isSendingTwoFactorOtp || isTwoFactorResendDisabled
                                ? 0.6
                                : 1,
                            color:
                              isSendingTwoFactorOtp || isTwoFactorResendDisabled
                                ? theme.palette.text.disabled
                                : theme.palette.text.lightGradientBlue,
                            cursor:
                              isSendingTwoFactorOtp || isTwoFactorResendDisabled
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isSendingTwoFactorOtp
                            ? "Sending..."
                            : isTwoFactorResendDisabled
                            ? `Resend OTP in ${twoFactorResendCountdown}s`
                            : "Resend OTP"}
                        </OtpActionLink>
                      </OtpActionsWrapper>

                      <CompleteLoginButton
                        variant="contained"
                        buttonType="secondary"
                        label="Verify OTP"
                        loading={isVerifyingTwoFactorOtp}
                        disabled={
                          isSendingTwoFactorOtp || isVerifyingTwoFactorOtp
                        }
                        onClick={handleVerifyTwoFactorOtp}
                        bgcolor={theme.palette.background.buttonbackground}
                        color={theme.palette.background.paper}
                      />
                    </OtpVerificationContainer>
                  </div>
                )}

                {step === "forgot" && (
                  <>
                    <HeadingContainer>
                      <TitleContainer variant="h1">
                        {passwordRecoveryLabel}
                      </TitleContainer>
                    </HeadingContainer>
                    <BottomContainer>
                      {/* Show reset-link flow for email and employee ID */}
                      {(loginMethod === "email" ||
                        loginMethod === "employeeId") && (
                        <div
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !isSendingResetEmail &&
                              !loading
                            ) {
                              e.preventDefault();
                              handleResetClick();
                            }
                          }}
                          >
                          <DynamicForm
                            formConfig={FORGOT_PASSWORD_FORM_CONFIG}
                            defaultValues={{
                              email: resolvedIdentifier || "",
                            }}
                            formMethods={setFormMethods}
                          />
                          <ButtomContainer>
                            <ButtonWrapper
                              variant="contained"
                              buttonType="secondary"
                              label={
                                isSendingResetEmail
                                  ? "Sending..."
                                  : SIGNIN.SEND_RESET_LINK
                              }
                              onClick={() => {
                                if (!isSendingResetEmail && !loading) {
                                  handleResetClick();
                                }
                              }}
                              bgcolor={
                                theme.palette.background.buttonbackground
                              }
                              color={theme.palette.background.paper}
                              loading={isSendingResetEmail || loading}
                              disabled={isSendingResetEmail || loading}
                            />
                          </ButtomContainer>

                          {/* Back to Login Button */}
                          {/* <ButtomContainer style={{ marginTop: "20px" }}>
                          <ButtonWrapper
                            variant="text"
                            buttonType="primary"
                            label="Back to Login"
                            onClick={() => setStep("login")}
                            disabled={loading}
                            bgcolor={theme.palette.background.buttonbackground}
                            color={theme.palette.background.paper}
                          />
                        </ButtomContainer> */}
                        </div>
                      )}

                      {/* Show phone OTP reset for mobile tab */}
                      {loginMethod === "mobile" && (
                        <PhoneOTPContainer>
                          <FormContainer>
                            <DynamicForm
                              key={`forgot-phone-${forgotPhoneDefaultValue}`}
                              formConfig={PHONE_FORGOT_FORM_CONFIG}
                              defaultValues={{
                                phoneNumber: forgotPhoneDefaultValue,
                              }}
                              formMethods={setPhoneFormMethods}
                              disabled={forgotOTPStep === "otp"}
                            />
                          </FormContainer>

                          <ButtomContainerVerifyOtp
                            style={{ justifyContent: "center" }}
                          >
                            <ButtonWrapper
                              variant="contained"
                              buttonType="secondary"
                              label="Send OTP"
                              onClick={handleSendForgotOTP}
                              loading={
                                phoneOTPResetLoading &&
                                forgotOTPStep === "phone"
                              }
                              disabled={
                                phoneOTPResetLoading || forgotOTPStep === "otp"
                              }
                              bgcolor={
                                theme.palette.background.buttonbackground
                              }
                              color={theme.palette.background.paper}
                              width="170px"
                              height="48px"
                            />
                          </ButtomContainerVerifyOtp>

                          {forgotOTPStep === "otp" && (
                            <>
                              <FormContainer>
                                <Typography
                                  variant="body1"
                                  sx={{ mb: 1, mt: 4, fontWeight: 500 }}
                                >
                                  OTP *
                                </Typography>
                                <TextField
                                  fullWidth
                                  placeholder="Enter 6-digit OTP"
                                  value={forgotOtp}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      .replace(/[^0-9]/g, "")
                                      .slice(0, 6);
                                    setForgotOtp(value);
                                    if (value.length < 6) {
                                      setHasForgotOtpError(false);
                                      setIsForgotOtpVerified(false);
                                    }
                                  }}
                                  error={hasForgotOtpError}
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        {isForgotOtpVerified ? (
                                          <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                          >
                                            <circle
                                              cx="12"
                                              cy="12"
                                              r="12"
                                              fill="#4CAF50"
                                            />
                                            <path
                                              d="m9 12 2 2 4-4"
                                              stroke="white"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        ) : (
                                          <Button
                                            variant="text"
                                            size="small"
                                            onClick={handleVerifyForgotOTP}
                                            disabled={
                                              forgotOtp.length !== 6 ||
                                              verifyOTPResetLoading
                                            }
                                            sx={{
                                              color:
                                                forgotOtp.length === 6
                                                  ? theme.palette.background
                                                      .buttonbackground
                                                  : "#999",
                                              minWidth: "auto",
                                              padding: "4px 8px",
                                              fontSize: "14px",
                                              textTransform: "none",
                                            }}
                                          >
                                            {verifyOTPResetLoading
                                              ? "Verifying..."
                                              : "Verify"}
                                          </Button>
                                        )}
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{
                                    "&.MuiTextField-root .MuiOutlinedInput-root":
                                      {
                                        backgroundColor: "transparent",
                                        borderRadius: "6px",
                                      },
                                  }}
                                  inputProps={{ maxLength: 6 }}
                                />
                              </FormContainer>

                              <ResendOTPContainer>
                                <ResendOTPLink
                                  onClick={
                                    !isResendDisabled
                                      ? handleResendForgotOTP
                                      : undefined
                                  }
                                  disabled={isResendDisabled}
                                  disabledColor="#999"
                                  activeColor={
                                    theme.palette.background.buttonbackground
                                  }
                                >
                                  {isResendDisabled
                                    ? `resend OTP in ${resendCountdown}s`
                                    : "resend OTP"}
                                </ResendOTPLink>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginTop: "8px",
                                  }}
                                >
                                  <ResendOTPLink
                                    onClick={() => {
                                      setForgotOTPStep("phone");
                                      setForgotOtp("");
                                      setIsForgotOtpVerified(false);
                                      setHasForgotOtpError(false);
                                      phoneFormMethods?.reset({
                                        phoneNumber: forgotPhoneDefaultValue,
                                      });
                                    }}
                                    activeColor={
                                      theme.palette.background.buttonbackground
                                    }
                                  >
                                    Change Number
                                  </ResendOTPLink>
                                </div>
                              </ResendOTPContainer>
                            </>
                          )}
                        </PhoneOTPContainer>
                      )}

                      {/* Back to Login */}
                      <BackToLoginContainer>
                        <ClickableLink
                          onClick={() => {
                            setStep("login");
                            setForgotOTPStep("phone");
                            if (phoneFormMethods)
                              phoneFormMethods.reset({
                                phoneNumber: forgotPhoneDefaultValue,
                              });
                          }}
                        >
                          Back to Login
                        </ClickableLink>
                      </BackToLoginContainer>
                    </BottomContainer>
                  </>
                )}

                {step === "linkSent" && (
                  <>
                    <HeadingContainer>
                      <TitleContainer>
                        {FORGOT_PASSWORD}
                      </TitleContainer>
                    </HeadingContainer>
                    <ForgotContainer>
                      <ConformIcon src={ResetIcon} alt="reset-icon" />
                      <PasswordResetLinkMessage>
                        {" "}
                        {resetLinkMessage || SIGNIN.PASSWORD_LINK_SENT}
                      </PasswordResetLinkMessage>
                      <PasswordResetMessage>
                        {" "}
                        {`${SIGNIN.CHECK_INBOX} ${resetLinkDestination || formMethods?.getValues().email || ""}`}
                      </PasswordResetMessage>
                      <Email
                        onClick={() => {
                          if (loginMethod === "mobile") {
                            setLoginStage("identifier");
                            setResolvedIdentifier("");
                            setIdentifierInput("");
                            setStep("login");
                            return;
                          }
                          setStep("forgot");
                        }}
                      >
                        {" "}
                        {loginMethod === "mobile"
                          ? "Change Mobile Number"
                          : SIGNIN.CHANGE_EMAIL}
                      </Email>
                      <BottomText>
                        {SIGNIN.DIDNT_RECEIVE_EMAIL}{" "}
                        <span
                          className="resend-link"
                          onClick={() => {
                            if (!isSendingResetEmail && !loading) {
                              handleResetClick();
                            }
                          }}
                          style={{
                            opacity: isSendingResetEmail || loading ? 0.6 : 1,
                            cursor:
                              isSendingResetEmail || loading
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {SIGNIN.CLICK_TO_RESEND}
                        </span>
                      </BottomText>
                    </ForgotContainer>
                  </>
                )}

                {step === "reset" && (
                  <>
                    <HeadingContainer>
                      <TitleContainer variant="h1">
                        {RESET_PASSWORD}
                      </TitleContainer>
                    </HeadingContainer>
                    <BottomContainer>
                      <DynamicForm
                        formConfig={resetFormConfig}
                        // formConfig={RESET_FORM_CONFIG}

                        defaultValues={initialResetData}
                        formMethods={setFormMethods}
                      />
                      {/* Password rules checklist below password field */}
                      {formMethods && activePasswordRules && (
                        <GuidelinesContainer>
                          <GuidelinesHeading>
                            Create a password that:
                          </GuidelinesHeading>
                          {activePasswordRules.map((rule: any, idx: number) => {
                            let passed = false;
                            if (watchedPassword) {
                              // Length rule
                              if (rule.name?.toLowerCase() === "length") {
                                passed = rule.minChars
                                  ? watchedPassword.length >= rule.minChars
                                  : true;
                              }
                              // Regex-based rules (Uppercase, Lowercase, Numbers, Special)
                              else if (rule.regex && rule.isRequired) {
                                const regex = new RegExp(rule.regex);
                                passed = regex.test(watchedPassword);
                              }
                            }

                            return (
                              <GuidelineRow key={idx}>
                                <GuidelineIcon
                                  src={
                                    passed
                                      ? AccordionSelected
                                      : CircularCheckBox
                                  }
                                  alt={passed ? "Passed" : "Not passed"}
                                />
                                <GuidelineText passed={passed}>
                                  {rule.errorMessage}
                                </GuidelineText>
                              </GuidelineRow>
                            );
                          })}
                        </GuidelinesContainer>
                      )}
                      <ButtomContainer>
                        <ButtonWrapper
                          variant="contained"
                          buttonType="secondary"
                          label={RESET_PASSWORD}
                          // onClick={() => setStep("resetSuccessful")}
                          bgcolor={theme.palette.background.buttonbackground}
                          onClick={handleResetPasswordSubmit}
                          color={theme.palette.background.paper}
                          width="250px"
                          height="40px"
                          disabled={(() => {
                            if (!formMethods) return true;
                            if (!watchedPassword || !watchedConfirmPassword) {
                              return true;
                            }
                            if (watchedPassword !== watchedConfirmPassword) {
                              return true;
                            }
                            if (activePasswordRules) {
                              const errors =
                                PasswordValidationUiUtil.validatePassword(
                                  watchedPassword,
                                  activePasswordRules
                                );
                              if (errors.length > 0) {
                                return true;
                              }
                            }
                            return false;
                          })()}
                        />
                      </ButtomContainer>
                    </BottomContainer>
                  </>
                )}

                {step === "resetSuccessful" && (
                  <>
                    <HeadingContainer>
                      <TitleContainer variant="h1">
                        {" "}
                        {RESET_PASSWORD}
                      </TitleContainer>
                    </HeadingContainer>
                    <ForgotContainer>
                      <ConformIcon src={ResetIcon} alt="reset-icon" />
                      <PasswordResetLinkMessage>
                        {" "}
                        {SIGNIN.PASSWORD_RESET}
                      </PasswordResetLinkMessage>
                      <PasswordResetMessage>
                        {" "}
                        {SIGNIN.PASSWORD_RESET_SUCCESS_MESSAGE}
                      </PasswordResetMessage>
                      {/* <Email> Change Email</Email> */}
                      {/* <BottomText>Didn't receive the email? <span className="resend-link">Click to Resend</span></BottomText> */}
                      <ButtonWrapper
                        variant="contained"
                        buttonType="secondary"
                        label={SIGNIN.SIGNIN}
                        onClick={() => {
                          clearResetQueryParams();
                          setLoginStage("identifier");
                          setResolvedIdentifier("");
                          setIdentifierInput("");
                          setResetLinkMessage("");
                          setResetLinkDestination("");
                          setResetLinkIdentifier("");
                          setResetLinkMethodCode("");
                          setStep("login");
                        }}
                        bgcolor={theme.palette.background.buttonbackground}
                        color={theme.palette.background.paper}
                        width="250px"
                        height="40px"
                      />
                    </ForgotContainer>
                  </>
                )}

                {step === "otp" && (
                  <>
                    <HeadingContainer>
                      <TitleContainer variant="h1">
                        {phoneOtpMethod?.methodName ?? "Mobile Login"}
                      </TitleContainer>
                    </HeadingContainer>
                    <BottomContainer>
                      <Suspense fallback={<div>Loading...</div>}>
                        <OTPAuth
                          loading={loading || isFetchingUser}
                          setLoading={(val) => {}}
                          initialPhoneNumber={resolvedIdentifier}
                          autoSendOnMount={
                            Boolean(resolvedIdentifier) &&
                            !isWithinOtpCooldown(
                              phoneOtpMethod?.methodCode || "PHONE_OTP"
                            )
                          }
                          hideIdentifierEntry={Boolean(resolvedIdentifier)}
                          onBack={resetToIdentifierStage}
                          backLabel="Change Mobile Number"
                          resendCooldownSeconds={getResendCooldownSeconds(
                            phoneOtpMethod
                          )}
                          remainingResendCooldownSeconds={getRemainingCooldownSeconds(
                            phoneOtpMethod?.methodCode || "PHONE_OTP"
                          )}
                        />
                      </Suspense>
                      <ForgotPasswordLink
                        onClick={resetToIdentifierStage}
                        style={{
                          marginTop: "20px",
                          textAlign: "center",
                          cursor: "pointer",
                          alignSelf: "center",
                        }}
                      >
                        Back to Login
                      </ForgotPasswordLink>
                    </BottomContainer>
                  </>
                )}

                {step === "email-otp" && (
                  <>
                    <HeadingContainer>
                      <TitleContainer variant="h1">
                        {emailOtpMethod?.methodName ?? "Email OTP Login"}
                      </TitleContainer>
                    </HeadingContainer>
                    <BottomContainer>
                      <Suspense fallback={<div>Loading...</div>}>
                        <CustomEmailOTP
                          loading={loading || isFetchingUser}
                          setLoading={(val) => {}}
                          initialEmail={resolvedIdentifier}
                          autoSendOnMount={Boolean(resolvedIdentifier) && !isWithinOtpCooldown("EMAIL_OTP")}
                          hideIdentifierEntry={Boolean(resolvedIdentifier)}
                          onBack={resetToIdentifierStage}
                          backLabel="Change Email"
                          resendCooldownSeconds={getResendCooldownSeconds(
                            emailOtpMethod
                          )}
                          remainingResendCooldownSeconds={getRemainingCooldownSeconds("EMAIL_OTP")}
                        />
                      </Suspense>
                      <ForgotPasswordLink
                        onClick={resetToIdentifierStage}
                        style={{
                          marginTop: "20px",
                          textAlign: "center",
                          cursor: "pointer",
                          alignSelf: "center",
                        }}
                      >
                        Back to Login
                      </ForgotPasswordLink>
                    </BottomContainer>
                  </>
                )}

                {/* <StyledTermsBlock>
          <SupportText>
            Need help? <a onClick={handleContactSupport}>Contact HR Support</a>
          </SupportText>
          </StyledTermsBlock> */}
              </LoginContainer>
            </StyledLogin>
          </LoginFlowCard>
        </LoginFlowCardArea>
      </LoginFlowShell>

      {isSupportPageOpen && (
        <Box sx={{ position: "fixed", inset: 0, zIndex: 100, overflowY: "auto", top:"50px", bgcolor: "#EBF6FF" }}>
          <SupportPage />
        </Box>
      )}

      <SupportHelpContactDialog
        open={isSupportContactOpen}
        onClose={() => setIsSupportContactOpen(false)}
      />
    </LoginPageContainer>
  );
};

export default SignIn;
