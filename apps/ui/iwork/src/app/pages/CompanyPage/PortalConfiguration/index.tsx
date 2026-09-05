import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, MenuItem, Select, Divider, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper } from "@mui/material";
import dayjs from "dayjs";
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  ForwardToInbox as ForwardToInboxIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Edit as EditIcon,
  Language as GlobalIcon,
  VpnKey as KeyIcon,
  Palette as PaletteIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  CustomTabs,
  CommonBreadcrumb,
  ChipRenderer,
  Button,
  FeatureKey,
  selectHasPermission,
  useApiQuery,
  useApiMutation,
  HTTP_METHODS,
  apiRequest,
  endPoints,
  setToastMessage,
  isCopyPasteAllowedForOrg,
  environment,
} from "@ui/ui-lib";
import { useDispatch, useSelector } from "react-redux";
import {
  PortalStatus,
  CompanyOnboardingMailModeResponse,
  CompanyOnboardingMailTriggerMode,
  CompanyPortalConfigResponse,
  UrlAndDomainConfig,
  AuthenticationMethod,
} from "./types";
import { URLDomainSection, isValidSlug } from "./URLDomainSection";
import { LoginAuthSection, AuthenticationConfigState } from "./LoginAuthSection";
import { Toggle } from "./Toggle";
import { BrandingSection } from "./BrandingSection";
import { DashboardConfiguration } from "./DashboardConfiguration";
import { PolicyConfiguration } from "./PolicyConfiguration";
import { WellnessConfiguration } from "./WellnessConfiguration";
import {
  WellnessConfigState,
  buildDefaultWellnessConfig,
  mapWellnessConfigFromApi,
} from "./WellnessConfigurationContent";
import { CompanyConfigurationView } from "./CompanyConfigurationView";
import { DashboardConfigurationView } from "./DashboardConfigurationView";
import { PolicyConfigurationView } from "./PolicyConfigurationView";
import { CompanyPolicyFeatureDocumentTab } from "./CompanyPolicyFeatureDocumentTab";
import { CompanyAdditionalDocumentsTab } from "./CompanyAdditionalDocumentsTab";
import { OffersAndBenefitsTab, OfferBenefitItem } from "./OffersAndBenefitsTab";
import { DomainScopeTab } from "./DomainScopeTab";
import { DomainTabsHeader, DomainTab } from "./DomainTabsHeader";
import { UploadedFile } from "@ui/ui-lib/hooks/useFileUpload";
import { DashboardConfigState } from "./DashboardConfigurationContent";
import { describeCronExpression } from "../../CronJobsListing/config";
import {
  ConfigurationContainer,
  MainContent,
  BreadcrumbSection,
  HeaderSection,
  HeaderContent,
  HeaderLeft,
  CompanyName,
  StatusContainer,
  CompanyInfo,
  HeaderActions,
  ContentArea,
  ConfigureHeader,
  StyledAccordion,
  StyledAccordionSummary,
  AccordionIconBox,
  AccordionTitleBox,
  AccordionNumber,
  AccordionTitle,
  AccordionTitleText,
  AccordionSubtitle,
  StyledAccordionDetails,
  PortalSetupSection,
  SettingsSectionCard,
  SettingsSectionHeader,
  SettingsSectionIconBox,
  SettingsSectionNumber,
  SettingsSectionText,
  SettingsSectionTitle,
  SettingsSectionDescription,
  SettingsSectionBody,
  SettingsControlsRow,
  SectionTitle,
  PortalContainer,
  SectionSubtitle,
  StyledGlobalIcon,
  StyledKeyIcon,
  StyledPaletteIcon,
  StyledEmailIcon,
} from "./styles";
import {
  SECTION_TITLES,
  SECTION_SUBTITLES,
  PAGE_TITLES,
  BUTTON_LABELS,
  STATUS_LABELS,
  TAB_LABELS,
  TAB_KEYS,
  BREADCRUMB_LABELS,
  POLICY_IDS,
  POLICY_NAMES,
  DEFAULT_VALUES,
  METHOD_CODES,
  ALLOWED_METHOD_CODES,
  AUTH_METHOD_KEYS,
  QUERY_KEYS,
  TOAST_MESSAGES,
  STATUS_KEYS,
  PORTAL_STATUS_COLORS,
  ICON_COLORS,
  ACCORDION_NUMBERS,
  ONBOARDING_MAIL_MODE,
} from "./constants";

const DEFAULT_URL_CONFIG: UrlAndDomainConfig = {
  fullUrl: null,
};

const DEFAULT_AUTH_CONFIG: AuthenticationConfigState = {
  method: AUTH_METHOD_KEYS.EMAIL_PASSWORD,
  methods: [
    AUTH_METHOD_KEYS.EMAIL_PASSWORD,
    AUTH_METHOD_KEYS.EMAIL_OTP,
    AUTH_METHOD_KEYS.MOBILE_OTP,
    AUTH_METHOD_KEYS.PHONE_PASSWORD,
    AUTH_METHOD_KEYS.EMPLOYEE_ID,
  ] as string[],
  methodCode: METHOD_CODES.EMAIL_PASSWORD,
  methodKey: AUTH_METHOD_KEYS.EMAIL_PASSWORD,
  methodId: null,
  minPasswordLength: "8",
  passwordRequirements: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
  },
  passwordExpiry: "90",
  enrollmentReminderDays: [0, 1, 2, 3],
  allowedLoginAttempts: "5",
  lockoutDuration: "5",
  changePasswordOnFirstLogin: true,
  requireOldPassword: false,
  sessionTimeout: "30",
  enable2FA: true,
  otpDelivery: "email",
  otpLength: "6",
  otpValidity: "5",
  resendOtpCooldown: "60",
  maxOtpAttempts: "3",
  employeeIdFormat: "EMP-XXXXX",
  enableIdValidation: true,
  maxFailedAttempts: "5",
};

const DEFAULT_DASHBOARD_CONFIG: DashboardConfigState = {
  insuranceWellness: {
    enabled: true,
    options: {
      policyManagement: true,
      claimsTracking: true,
      coverageInsights: true,
      tpaServices: true,
    },
  },
  emotionalWellness: {
    enabled: false,
    options: {
      mentalHealthSupport: false,
      counselingServices: false,
      stressManagement: false,
      mindfulness: false,
    },
  },
  physicalWellness: {
    enabled: false,
    options: {
      fitnessTracking: false,
      workoutSessions: false,
      healthMetrics: false,
      nutritionPlans: false,
    },
  },
  retailInsurance: {
    enabled: true,
    products: {
      electricTwoWheeler: true,
      electronicAllRisk: true,
      individualTravel: false,
      moneyInsurance: true,
      motorInsurance: true,
      motorTwoWheeler: false,
      travelInsurance: true,
    },
  },
  wellnessBanner: {
    enabled: false,
  },
  portingBanner: {
    enabled: false,
  },
};

const createDefaultPolicySettings = () =>
  new Map([
    [
      POLICY_IDS.GMC,
      {
        enrollmentStartDate: null,
        enrollmentEndDate: null,
        employerContribution: "",
        requireConfirmation: false,
        autoLockEnrollment: true,
        autoLockAfterConfirmation: false,
        disclaimerText: "",
        isConfigured: false,
      },
    ],
    [
      POLICY_IDS.GTL,
      {
        enrollmentStartDate: null,
        enrollmentEndDate: null,
        employerContribution: "",
        requireConfirmation: false,
        autoLockEnrollment: true,
        autoLockAfterConfirmation: false,
        disclaimerText: "",
        isConfigured: false,
      },
    ],
    [
      POLICY_IDS.GPA,
      {
        enrollmentStartDate: null,
        enrollmentEndDate: null,
        employerContribution: "",
        requireConfirmation: false,
        autoLockEnrollment: true,
        autoLockAfterConfirmation: false,
        disclaimerText: "",
        isConfigured: false,
      },
    ],
  ]);

const normalizeAuthMethodKey = (
  methodKey?: string | null
): AuthenticationConfigState["method"] | undefined => {
  if (!methodKey) return undefined;
  const normalized = methodKey.toString().toLowerCase().replace(/_/g, "-");

  if (normalized === AUTH_METHOD_KEYS.EMAIL_PASSWORD) return AUTH_METHOD_KEYS.EMAIL_PASSWORD;
  if (normalized === AUTH_METHOD_KEYS.EMAIL_OTP) return AUTH_METHOD_KEYS.EMAIL_OTP;
  if (normalized === "phone-otp" || normalized === AUTH_METHOD_KEYS.MOBILE_OTP) return AUTH_METHOD_KEYS.MOBILE_OTP;
  if (normalized === AUTH_METHOD_KEYS.PHONE_PASSWORD) return AUTH_METHOD_KEYS.PHONE_PASSWORD;
  if (normalized === "username-password" || normalized === AUTH_METHOD_KEYS.EMPLOYEE_ID) return AUTH_METHOD_KEYS.EMPLOYEE_ID;
  if (normalized === AUTH_METHOD_KEYS.OAUTH) return AUTH_METHOD_KEYS.OAUTH;

  return undefined;
};

const getDefaultAuthMethodKey = (method: AuthenticationConfigState["method"]) => {
  switch (method) {
    case AUTH_METHOD_KEYS.EMAIL_OTP:
      return AUTH_METHOD_KEYS.EMAIL_OTP;
    case AUTH_METHOD_KEYS.MOBILE_OTP:
      return AUTH_METHOD_KEYS.MOBILE_OTP;
    case AUTH_METHOD_KEYS.PHONE_PASSWORD:
      return AUTH_METHOD_KEYS.PHONE_PASSWORD;
    case AUTH_METHOD_KEYS.EMPLOYEE_ID:
      return AUTH_METHOD_KEYS.EMPLOYEE_ID;
    case AUTH_METHOD_KEYS.OAUTH:
      return AUTH_METHOD_KEYS.OAUTH;
    case AUTH_METHOD_KEYS.EMAIL_PASSWORD:
    default:
      return AUTH_METHOD_KEYS.EMAIL_PASSWORD;
  }
};

const mapMethodCodeToUiMethod = (
  methodCode?: string | null,
  methodKey?: string | null
): AuthenticationConfigState["method"] => {
  switch (methodCode) {
    case METHOD_CODES.EMAIL_PASSWORD:
      return AUTH_METHOD_KEYS.EMAIL_PASSWORD;
    case METHOD_CODES.EMAIL_OTP:
      return AUTH_METHOD_KEYS.EMAIL_OTP;
    case METHOD_CODES.PHONE_OTP:
      return AUTH_METHOD_KEYS.MOBILE_OTP;
    case METHOD_CODES.PHONE_PASSWORD:
      return AUTH_METHOD_KEYS.PHONE_PASSWORD;
    case METHOD_CODES.USERNAME_PASSWORD:
      return AUTH_METHOD_KEYS.EMPLOYEE_ID;
    case METHOD_CODES.GOOGLE_OAUTH:
    case METHOD_CODES.MICROSOFT_OAUTH:
      return AUTH_METHOD_KEYS.OAUTH;
    default:
      const normalizedKey = normalizeAuthMethodKey(methodKey);
      if (normalizedKey) return normalizedKey;
      return DEFAULT_AUTH_CONFIG.method;
  }
};

const mapStatusFromApi = (
  companyConfigurationStatus: CompanyPortalConfigResponse["companyConfigurationStatus"],
  fallbackStatus?: PortalStatus | string | null
): { status: PortalStatus | null; label: string | null } => {
  const statusKey =
    typeof companyConfigurationStatus === "string"
      ? companyConfigurationStatus
      : companyConfigurationStatus?.key ||
      (companyConfigurationStatus as any)?.value ||
      null;

  const statusValue =
    typeof companyConfigurationStatus === "string"
      ? companyConfigurationStatus
      : companyConfigurationStatus?.value ||
      companyConfigurationStatus?.key ||
      undefined;

  if (!statusKey) {
    return { status: null, label: null };
  }

  const normalized = statusKey.toString().toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("under_review") || normalized === STATUS_KEYS.UNDER_REVIEW) {
    return { status: STATUS_LABELS.PENDING, label: statusValue || STATUS_LABELS.UNDER_REVIEW };
  }
  if (normalized.includes("draft") || normalized === STATUS_KEYS.DRAFT) {
    return { status: STATUS_LABELS.DRAFT, label: statusValue || STATUS_LABELS.DRAFT };
  }
  if (normalized.includes("pending") || normalized === STATUS_KEYS.PENDING) {
    return { status: STATUS_LABELS.PENDING, label: statusValue || STATUS_LABELS.PENDING };
  }
  if (normalized.includes("rejected") || normalized === STATUS_KEYS.REJECTED) {
    return { status: STATUS_LABELS.REJECTED, label: statusValue || STATUS_LABELS.REJECTED };
  }
  if (normalized.includes("active") || normalized === STATUS_KEYS.ACTIVE) {
    return { status: STATUS_LABELS.ACTIVE, label: statusValue || STATUS_LABELS.ACTIVE };
  }

  if (fallbackStatus) {
    const fallbackNormalized = fallbackStatus.toString().toLowerCase();
    if (fallbackNormalized === STATUS_KEYS.DRAFT) return { status: STATUS_LABELS.DRAFT, label: STATUS_LABELS.DRAFT };
    if (fallbackNormalized === STATUS_KEYS.PENDING)
      return { status: STATUS_LABELS.PENDING, label: statusValue || STATUS_LABELS.PENDING };
    if (fallbackNormalized === STATUS_KEYS.REJECTED)
      return { status: STATUS_LABELS.REJECTED, label: statusValue || STATUS_LABELS.REJECTED };
    if (fallbackNormalized === STATUS_KEYS.ACTIVE)
      return { status: STATUS_LABELS.ACTIVE, label: statusValue || STATUS_LABELS.ACTIVE };
  }

  return { status: STATUS_LABELS.DRAFT, label: statusValue || STATUS_LABELS.DRAFT };
};

interface AccordionSectionProps {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  id,
  number,
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <StyledAccordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
    >
      <StyledAccordionSummary expandIcon={<ExpandMoreIcon />} id={id}>
        <AccordionIconBox>{icon}</AccordionIconBox>
        <AccordionNumber>{number}</AccordionNumber>
        <AccordionTitleBox>
          <AccordionTitle>{title}</AccordionTitle>
          {expanded && <AccordionSubtitle>{subtitle}</AccordionSubtitle>}
        </AccordionTitleBox>
      </StyledAccordionSummary>
      <StyledAccordionDetails>{children}</StyledAccordionDetails>
    </StyledAccordion>
  );
};

export const PortalConfigurationScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const canReadPortalConfig = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_PORTAL_CONFIGURATION)(state as any)
  );
  const canUpdatePortalConfig = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_PORTAL_CONFIGURATION)(state as any)
  );
  const canApprovePortalConfig = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_PORTAL_CONFIGURATION)(state as any)
  );
  const canEditPortalConfig = canUpdatePortalConfig || canApprovePortalConfig;
  const [portalStatus, setPortalStatus] = useState<PortalStatus | null>(null);
  const [portalStatusLabel, setPortalStatusLabel] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [canSubmitAfterSave, setCanSubmitAfterSave] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.COMPANY);
  const [brandingLogo, setBrandingLogo] = useState<UploadedFile | null>(null);
  const [urlConfig, setUrlConfig] = useState<UrlAndDomainConfig>(DEFAULT_URL_CONFIG);
  const [slug, setSlug] = useState<string>("");
  const [slugSubmitted, setSlugSubmitted] = useState(false);
  const [inheritedCompanyIds, setInheritedCompanyIds] = useState<number[]>([]);
  const [ccEmailAddresses, setCcEmailAddresses] = useState<string[]>([]);
  const [hasStatus, setHasStatus] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [showRejectionError, setShowRejectionError] = useState(false);

  // Portal status style configuration using constants
  const portalStatusStyleMap = {
    active: PORTAL_STATUS_COLORS.ACTIVE,
    draft: PORTAL_STATUS_COLORS.DRAFT,
    pending: PORTAL_STATUS_COLORS.PENDING,
    rejected: PORTAL_STATUS_COLORS.REJECTED,
    "under review": PORTAL_STATUS_COLORS.UNDER_REVIEW,
  };

  const [portalConfigId, setPortalConfigId] = useState<number | null>(null);
  const [domainTabs, setDomainTabs] = useState<DomainTab[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<number | null>(null);
  const [isCreatingDomain, setIsCreatingDomain] = useState(false);
  // true while user is filling in a brand-new domain that hasn't been saved to DB yet
  const [isPendingNewDomain, setIsPendingNewDomain] = useState(false);
  const [unscopedPolicyCount, setUnscopedPolicyCount] = useState(0);
  const pendingScopeRef = React.useRef<unknown>(null);
  const isDirtyRef = React.useRef(false);
  const confirmResolveRef = React.useRef<((val: boolean) => void) | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });
  const showConfirmDialog = (title: string, message: string): Promise<boolean> =>
    new Promise((resolve) => { confirmResolveRef.current = resolve; setConfirmDialog({ open: true, title, message }); });
  const handleConfirmOk = () => { setConfirmDialog((p) => ({ ...p, open: false })); confirmResolveRef.current?.(true); };
  const handleConfirmCancel = () => { setConfirmDialog((p) => ({ ...p, open: false })); confirmResolveRef.current?.(false); };
  const [brandingHeading, setBrandingHeading] = useState(DEFAULT_VALUES.BRANDING_HEADING);
  const [brandingBodyText, setBrandingBodyText] = useState(
    DEFAULT_VALUES.BRANDING_BODY_TEXT
  );

  // Auth configuration state - will be updated from LoginAuthSection
  const [authConfig, setAuthConfig] =
    useState<AuthenticationConfigState>(DEFAULT_AUTH_CONFIG);

  const [dashboardConfig, setDashboardConfig] =
    useState<DashboardConfigState>(DEFAULT_DASHBOARD_CONFIG);

  const [wellnessConfig, setWellnessConfig] = useState<WellnessConfigState>(
    buildDefaultWellnessConfig()
  );
  // Life Events gate for the IBP portal. Defaults to true so employees can
  // access Life Events unless a company explicitly disables it.
  const [isLifeEventEnable, setIsLifeEventEnable] = useState<boolean>(true);

  const [offersAndBenefits, setOffersAndBenefits] = useState<OfferBenefitItem[]>([]);
  const [offersAndBenefitsEnabled, setOffersAndBenefitsEnabled] = useState(true);

  const [policySettings, setPolicySettings] = useState(createDefaultPolicySettings());
  const [onboardingMailTriggerMode, setOnboardingMailTriggerMode] =
    useState<CompanyOnboardingMailTriggerMode>(ONBOARDING_MAIL_MODE.CRON);
  const [isOnboardingMailEditMode, setIsOnboardingMailEditMode] = useState(false);
  const [onboardingMailTriggerModeLocal, setOnboardingMailTriggerModeLocal] =
    useState<CompanyOnboardingMailTriggerMode>(ONBOARDING_MAIL_MODE.CRON);
  const [testEmployeeEmail, setTestEmployeeEmail] = useState("");
  const [testMailStatusMessage, setTestMailStatusMessage] = useState(
    "No test initiated. Enter an email and click Send.",
  );
  const [testConfirmationEmployeeEmail, setTestConfirmationEmployeeEmail] = useState("");
  const [confirmationMailStatusMessage, setConfirmationMailStatusMessage] = useState(
    "No test initiated. Enter an email and click Send.",
  );
  const [isConfirmationPreviewOpen, setIsConfirmationPreviewOpen] = useState(false);
  const [isSendingConfirmationInBackground, setIsSendingConfirmationInBackground] = useState(false);
  const confirmationJobJustTriggeredAtRef = useRef<number | null>(null);
  const [confirmationPreviewPage, setConfirmationPreviewPage] = useState(0);
  const [confirmationPreviewPageSize, setConfirmationPreviewPageSize] = useState(15);

  // Same "eligible count / view list / refresh" pattern as the confirmation
  // mail preview above, for the initial onboarding mail trigger.
  const [isOnboardingPreviewOpen, setIsOnboardingPreviewOpen] = useState(false);
  const [isSendingOnboardingInBackground, setIsSendingOnboardingInBackground] = useState(false);
  const onboardingJobJustTriggeredAtRef = useRef<number | null>(null);
  const [onboardingPreviewPage, setOnboardingPreviewPage] = useState(0);
  const [onboardingPreviewPageSize, setOnboardingPreviewPageSize] = useState(15);

  const [companyName, setCompanyName] = useState(
    location.state?.companyName || ""
  );
  const [industry, setIndustry] = useState(DEFAULT_VALUES.INDUSTRY);
  const [mailServiceType, setMailServiceType] = useState<"SES" | "SENDGRID">("SES");

  const { data: portalConfigListData, refetch: refetchPortalConfigList } = useApiQuery({
    url: id ? endPoints.companyPortalConfigList(id) : "",
    queryKey: [QUERY_KEYS.COMPANY_PORTAL_CONFIG, "list", id],
    enabled: Boolean(id),
  });

  const { data: portalConfigData, refetch: refetchPortalConfig } = useApiQuery({
    url: activeConfigId
      ? endPoints.companyPortalConfigByConfigId(activeConfigId)
      : id ? endPoints.companyPortalConfigById(id) : "",
    queryKey: [QUERY_KEYS.COMPANY_PORTAL_CONFIG, activeConfigId ?? id],
    enabled: Boolean(activeConfigId ?? id),
  });

   const { data: companyDetailsData } = useApiQuery({
    url: id ? endPoints.companyDetailsById(Number(id)) : "",
    queryKey: [QUERY_KEYS.COMPANY_DETAILS, id],
    enabled: Boolean(id),
  });

  // Auth config is domain-scoped: prefer the active domain tab's own subdomain
  // so switching tabs re-fetches that domain's settings, falling back to the
  // company's base subdomain before domain tabs have loaded.
  const activeDomainSubdomain = domainTabs.find(
    (tab) => tab.configId === activeConfigId
  )?.subDomain;
  const companySubdomain = activeDomainSubdomain || companyDetailsData?.data?.subDomain;

  const { data: authConfigData, refetch: refetchAuthConfig } = useApiQuery({
    url: companySubdomain ? endPoints.companyAuthConfigBySubdomain(companySubdomain) : "",
    queryKey: [QUERY_KEYS.AUTH_CONFIG, companySubdomain],
    enabled: Boolean(companySubdomain),
  });

  const resolvedCompanyName =
    companyName ||
    companyDetailsData?.data?.displayName ||
    companyDetailsData?.data?.companyName ||
    "";
    
  useEffect(() => {
    if (resolvedCompanyName && !companyName) {
      setCompanyName(resolvedCompanyName);
    }
  }, [resolvedCompanyName, companyName]);


  const { data: authMethodsResponse } = useApiQuery({
    url: endPoints.authenticationMethods,
    queryKey: [QUERY_KEYS.AUTHENTICATION_METHODS],
  });

  const { data: onboardingMailModeData, refetch: refetchOnboardingMailMode } = useApiQuery({
    url: id ? endPoints.companyOnboardingMailModeByCompanyId(id) : "",
    queryKey: ["company-onboarding-mail-mode", id],
    enabled: Boolean(id),
  });

  const { data: cronConfigurationsData } = useApiQuery({
    url: `${endPoints.getCronJobConfigurations}?page=1&limit=1000`,
    queryKey: ["cron-job-configurations", "onboarding"],
    enabled: Boolean(id),
  });

  const {
    data: confirmationPreviewData,
    refetch: refetchConfirmationPreview,
    isError: isConfirmationPreviewError,
    error: confirmationPreviewError,
    isFetching: isConfirmationPreviewFetching,
  } = useApiQuery({
    url: id
      ? endPoints.previewBulkEnrollmentConfirmation(
          id,
          companySubdomain,
          confirmationPreviewPage + 1,
          confirmationPreviewPageSize,
        )
      : "",
    queryKey: [
      "bulk-enrollment-confirmation-preview",
      id,
      companySubdomain,
      confirmationPreviewPage,
      confirmationPreviewPageSize,
    ],
    enabled: Boolean(id),
  });

  const { data: confirmationJobStatusData, refetch: refetchConfirmationJobStatus } = useApiQuery({
    url: id ? endPoints.confirmationMailJobStatus(id, companySubdomain) : "",
    queryKey: ["bulk-enrollment-confirmation-status", id, companySubdomain],
    enabled: Boolean(id),
    config: {
      refetchInterval: isSendingConfirmationInBackground ? 5000 : false,
    },
  });

  useEffect(() => {
    const inProgress = (confirmationJobStatusData as any)?.data?.inProgress;
    if (inProgress === undefined) return;

    if (inProgress) {
      setIsSendingConfirmationInBackground(true);
      return;
    }

    // inProgress === false: ignore a stale "false" for a few seconds right after
    // clicking Trigger, since the background job takes a moment to mark itself
    // in-progress — otherwise we'd briefly flash "done" before it's really started.
    const justTriggered =
      confirmationJobJustTriggeredAtRef.current !== null &&
      Date.now() - confirmationJobJustTriggeredAtRef.current < 3000;
    if (justTriggered) return;

    setIsSendingConfirmationInBackground((wasSending) => {
      if (wasSending) {
        refetchConfirmationPreview();
      }
      return false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmationJobStatusData]);

  const {
    data: onboardingPreviewData,
    refetch: refetchOnboardingPreview,
    isError: isOnboardingPreviewError,
    error: onboardingPreviewError,
    isFetching: isOnboardingPreviewFetching,
  } = useApiQuery({
    url: id
      ? endPoints.previewCompanyInitialOnboardingNotifications(
          id,
          companySubdomain,
          onboardingPreviewPage + 1,
          onboardingPreviewPageSize,
        )
      : "",
    queryKey: [
      "initial-onboarding-preview",
      id,
      companySubdomain,
      onboardingPreviewPage,
      onboardingPreviewPageSize,
    ],
    enabled: Boolean(id),
  });

  const { data: onboardingJobStatusData, refetch: refetchOnboardingJobStatus } = useApiQuery({
    url: id ? endPoints.onboardingMailJobStatus(id, companySubdomain) : "",
    queryKey: ["initial-onboarding-status", id, companySubdomain],
    enabled: Boolean(id),
    config: {
      refetchInterval: isSendingOnboardingInBackground ? 5000 : false,
    },
  });

  useEffect(() => {
    const inProgress = (onboardingJobStatusData as any)?.data?.inProgress;
    if (inProgress === undefined) return;

    if (inProgress) {
      setIsSendingOnboardingInBackground(true);
      return;
    }

    // Same "ignore a stale false right after triggering" guard as the
    // confirmation-mail job status effect above.
    const justTriggered =
      onboardingJobJustTriggeredAtRef.current !== null &&
      Date.now() - onboardingJobJustTriggeredAtRef.current < 3000;
    if (justTriggered) return;

    setIsSendingOnboardingInBackground((wasSending) => {
      if (wasSending) {
        refetchOnboardingPreview();
      }
      return false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingJobStatusData]);

  const authenticationMethods: AuthenticationMethod[] = useMemo(() => {
    const methods = (authMethodsResponse?.data ?? authMethodsResponse ?? []) as AuthenticationMethod[];
    return methods.filter((method) => ALLOWED_METHOD_CODES.has(method.methodCode));
  }, [authMethodsResponse]);

  const { mutateAsync: savePortalConfig, isPending: isSaving } = useApiMutation({
    config: {
      onSuccess: async () => {
        dispatch(setToastMessage(TOAST_MESSAGES.SAVE_SUCCESS));
        setCanSubmitAfterSave(true);
        await refetchPortalConfig();
        await refetchAuthConfig();
      },
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TOAST_MESSAGES.SAVE_ERROR;
        dispatch(setToastMessage(message));
      },
    },
  });

  const { mutateAsync: submitPortalConfig, isPending: isSubmitting } = useApiMutation({
    config: {
      onSuccess: () => dispatch(setToastMessage(TOAST_MESSAGES.SUBMIT_SUCCESS)),
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TOAST_MESSAGES.ACTION_ERROR;
        dispatch(setToastMessage(message));
      },
    },
  });

  const { mutateAsync: approvePortalConfig, isPending: isApproving } = useApiMutation({
    config: {
      onSuccess: () => dispatch(setToastMessage(TOAST_MESSAGES.APPROVE_SUCCESS)),
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TOAST_MESSAGES.ACTION_ERROR;
        dispatch(setToastMessage(message));
      },
    },
  });

  const {
    mutateAsync: updateOnboardingMailMode,
    isPending: isUpdatingOnboardingMailMode,
  } = useApiMutation({
    config: {
      onSuccess: () =>
        dispatch(setToastMessage("Onboarding mail mode updated successfully.")),
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TOAST_MESSAGES.ACTION_ERROR;
        dispatch(setToastMessage(message));
      },
    },
  });

  const {
    mutateAsync: triggerCompanyInitialOnboardingNotifications,
    isPending: isTriggeringOnboardingMails,
  } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        dispatch(
          setToastMessage(
            response?.message ||
              response?.data?.message ||
              "Onboarding mails triggered successfully.",
          ),
        );
        refetchOnboardingPreview();
      },
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TOAST_MESSAGES.ACTION_ERROR;
        dispatch(setToastMessage(message));
      },
    },
  });

  const {
    mutateAsync: triggerTestEmployeeOnboardingMail,
    isPending: isSendingTestMail,
  } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        const message =
          response?.message ||
          response?.data?.message ||
          "Onboarding mail sent successfully.";
        dispatch(setToastMessage(message));
        setTestMailStatusMessage(message);
      },
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TOAST_MESSAGES.ACTION_ERROR;
        dispatch(setToastMessage(message));
        setTestMailStatusMessage(message);
      },
    },
  });

  const {
    mutateAsync: triggerBulkEnrollmentConfirmation,
    isPending: isTriggeringConfirmationMails,
  } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        dispatch(
          setToastMessage(
            response?.message ||
              response?.data?.message ||
              "Confirmation mails triggered successfully.",
          ),
        );
        refetchConfirmationPreview();
      },
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TOAST_MESSAGES.ACTION_ERROR;
        dispatch(setToastMessage(message));
      },
    },
  });

  const {
    mutateAsync: triggerTestEmployeeEnrollmentConfirmation,
    isPending: isSendingTestConfirmationMail,
  } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        const message =
          response?.message ||
          response?.data?.message ||
          "Confirmation mail sent successfully.";
        dispatch(setToastMessage(message));
        setConfirmationMailStatusMessage(message);
        refetchConfirmationPreview();
      },
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TOAST_MESSAGES.ACTION_ERROR;
        dispatch(setToastMessage(message));
        setConfirmationMailStatusMessage(message);
      },
    },
  });

  const mapAuthConfigFromNewApi = (authMethod: any): AuthenticationConfigState => {
    const configuration = authMethod?.configuration || {};
    // Support both new API format (authMethod.configuration.passwordConfig)
    // and portal config fallback format (authMethod.passwordConfig at root)
    const passwordConfig = configuration?.passwordConfig || authMethod?.passwordConfig || {};
    const otpConfig = configuration?.otpConfig || authMethod?.otpConfig || {};
    const sessionSettings = configuration?.sessionSettings || authMethod?.sessionSettings || {};
    const twoFactorAuth = passwordConfig?.twoFactorAuthentication || configuration?.twoFactorAuthentication || {};
    const passwordPolicy = passwordConfig?.passwordPolicy || {};
    const requirements = passwordPolicy?.requirements || {};

    // Map method code to UI method
    const uiMethod = mapMethodCodeToUiMethod(
      authMethod?.methodCode,
      authMethod?.authenticationMethodKey
    );

    return {
      ...DEFAULT_AUTH_CONFIG,
      method: uiMethod ?? DEFAULT_AUTH_CONFIG.method,
      methodCode: authMethod?.methodCode ?? DEFAULT_AUTH_CONFIG.methodCode,
      methodId: configuration?.authentication_method_id ?? authMethod?.authentication_method_id ?? null,
      methodKey: authMethod?.authenticationMethodKey ?? configuration?.authentication_method_key ?? DEFAULT_AUTH_CONFIG.methodKey,
      
      // Password Configuration
      minPasswordLength: passwordPolicy?.minLength?.toString() ?? DEFAULT_AUTH_CONFIG.minPasswordLength,
      passwordRequirements: {
        uppercase: requirements?.uppercase?.required ?? DEFAULT_AUTH_CONFIG.passwordRequirements.uppercase,
        lowercase: requirements?.lowercase?.required ?? DEFAULT_AUTH_CONFIG.passwordRequirements.lowercase,
        numbers: requirements?.numbers?.required ?? DEFAULT_AUTH_CONFIG.passwordRequirements.numbers,
        special: requirements?.special?.required ?? DEFAULT_AUTH_CONFIG.passwordRequirements.special,
      },
      passwordExpiry: passwordPolicy?.expiryDays === 0 || passwordPolicy?.expiryDays === null
        ? "never"
        : passwordPolicy?.expiryDays?.toString() ?? DEFAULT_AUTH_CONFIG.passwordExpiry,
      changePasswordOnFirstLogin: passwordConfig?.changePasswordOnFirstLogin ?? DEFAULT_AUTH_CONFIG.changePasswordOnFirstLogin,
      requireOldPassword: passwordConfig?.requireOldPassword ?? DEFAULT_AUTH_CONFIG.requireOldPassword,

      // OTP Configuration
      otpValidity: (otpConfig?.otpValidityMinutes || twoFactorAuth?.otpValidityMinutes)?.toString() ?? DEFAULT_AUTH_CONFIG.otpValidity,
      resendOtpCooldown: (otpConfig?.resendOtpCooldownSeconds || twoFactorAuth?.resendOtpCooldownSeconds)?.toString() ?? DEFAULT_AUTH_CONFIG.resendOtpCooldown,
      otpLength: (otpConfig?.otpLength || twoFactorAuth?.otpLength)?.toString() ?? DEFAULT_AUTH_CONFIG.otpLength,
      
      // Two Factor Authentication
      enable2FA: twoFactorAuth?.enabled ?? DEFAULT_AUTH_CONFIG.enable2FA,
      otpDelivery: twoFactorAuth?.otpDeliveryMethod === "sms" ? "phone" : twoFactorAuth?.otpDeliveryMethod ?? DEFAULT_AUTH_CONFIG.otpDelivery,
      
      // Session Settings
      sessionTimeout: sessionSettings?.sessionTimeoutMinutes?.toString() ?? DEFAULT_AUTH_CONFIG.sessionTimeout,
      
      // Enrollment Reminders
      enrollmentReminderDays: configuration?.enrollmentReminderDays ?? passwordConfig?.enrollmentReminderDays ?? authMethod?.enrollmentReminderDays ?? DEFAULT_AUTH_CONFIG.enrollmentReminderDays,
      
      // Other defaults
      employeeIdFormat: DEFAULT_AUTH_CONFIG.employeeIdFormat,
      enableIdValidation: DEFAULT_AUTH_CONFIG.enableIdValidation,
      maxFailedAttempts: DEFAULT_AUTH_CONFIG.maxFailedAttempts,
      allowedLoginAttempts: DEFAULT_AUTH_CONFIG.allowedLoginAttempts,
      lockoutDuration: DEFAULT_AUTH_CONFIG.lockoutDuration,
      maxOtpAttempts: DEFAULT_AUTH_CONFIG.maxOtpAttempts,
  };
  }
  const buildDashboardConfigFromApi = (
    dashboard?: CompanyPortalConfigResponse["companyPortalDashboardConfig"]
  ): DashboardConfigState => {
    const wellness = (dashboard as any)?.wellness ?? dashboard ?? {};
    const insurance = (dashboard as any)?.insurance ?? dashboard ?? {};

    return {
      insuranceWellness: {
        enabled:
          wellness?.insuranceWellness?.enabled ??
          dashboard?.insuranceWellness?.enabled ??
          DEFAULT_DASHBOARD_CONFIG.insuranceWellness.enabled,
        options: {
          ...DEFAULT_DASHBOARD_CONFIG.insuranceWellness.options,
          ...(wellness?.insuranceWellness?.options ??
            dashboard?.insuranceWellness?.options ??
            {}),
        },
      },
      emotionalWellness: {
        enabled:
          wellness?.emotionalWellness?.enabled ??
          dashboard?.emotionalWellness?.enabled ??
          DEFAULT_DASHBOARD_CONFIG.emotionalWellness.enabled,
        options: {
          ...DEFAULT_DASHBOARD_CONFIG.emotionalWellness.options,
          ...(wellness?.emotionalWellness?.options ??
            dashboard?.emotionalWellness?.options ??
            {}),
        },
      },
      physicalWellness: {
        enabled:
          wellness?.physicalWellness?.enabled ??
          dashboard?.physicalWellness?.enabled ??
          DEFAULT_DASHBOARD_CONFIG.physicalWellness.enabled,
        options: {
          ...DEFAULT_DASHBOARD_CONFIG.physicalWellness.options,
          ...(wellness?.physicalWellness?.options ??
            dashboard?.physicalWellness?.options ??
            {}),
        },
      },
      retailInsurance: {
        enabled:
          insurance?.retailInsurance?.enabled ??
          dashboard?.retailInsurance?.enabled ??
          DEFAULT_DASHBOARD_CONFIG.retailInsurance.enabled,
        products: {
          ...DEFAULT_DASHBOARD_CONFIG.retailInsurance.products,
          ...(insurance?.retailInsurance?.products ??
            dashboard?.retailInsurance?.products ??
            {}),
        },
      },
      wellnessBanner: {
        enabled:
          (dashboard as any)?.wellnessBanner?.enabled ??
          DEFAULT_DASHBOARD_CONFIG.wellnessBanner.enabled,
      },
      portingBanner: {
        enabled:
          (dashboard as any)?.portingBanner?.enabled ??
          DEFAULT_DASHBOARD_CONFIG.portingBanner.enabled,
      },
    };
  };

  useEffect(() => {
    const list = (portalConfigListData as any)?.data;
    if (!Array.isArray(list)) return;
    const tabs: DomainTab[] = list.map((item: any) => ({
      configId: item.configId,
      subDomain: item.subDomain ?? null,
      fullUrl: item.fullUrl ?? null,
      status: item.status ?? null,
      scopeCount: item.scopeCount ?? 0,
    }));
    setDomainTabs(tabs);
    if (tabs.length > 0 && !activeConfigId) {
      setActiveConfigId(tabs[0].configId);
    }
    // Count policies covered by any scope (scopeCount > 0 means that domain has explicit scope)
    // If all domains use ALL_POLICIES mode (scopeCount=0), unscopedPolicyCount=0 (no restriction needed)
    // If any domain has explicit scopes, check for uncovered policies — leave for future enhancement
    setUnscopedPolicyCount(0);
  }, [portalConfigListData]);

  useEffect(() => {
    if (!portalConfigData) {
      return;
    }

    // Don't overwrite the blank new-domain form with stale cached data
    if (isPendingNewDomain) {
      return;
    }

    const configData = portalConfigData as CompanyPortalConfigResponse;

    // Skip stale cached data from a previous domain tab — wait for the fresh fetch
    if (activeConfigId && configData.portalConfigId && configData.portalConfigId !== activeConfigId) {
      return;
    }

    if (configData.portalConfigId) {
      setPortalConfigId(configData.portalConfigId);
    }

    if (configData.companyName) {
      setCompanyName(configData.companyName);
    }
    if (configData.industry) {
      setIndustry(configData.industry);
    }
    const mappedStatus = mapStatusFromApi(
      configData.companyConfigurationStatus,
      configData.status as PortalStatus
    );
    setHasStatus(Boolean(mappedStatus.status));
    setPortalStatus(mappedStatus.status ?? null);
    setPortalStatusLabel(mappedStatus.label || "");
    setCanSubmitAfterSave(mappedStatus.status === STATUS_LABELS.DRAFT);

    const urlAndDomain = configData.companyPortalConfig?.urlAndDomain;
    const loadedFullUrl = urlAndDomain?.fullUrl ?? null;
    setUrlConfig({ fullUrl: loadedFullUrl });
    if (loadedFullUrl) {
      try {
        const full = new URL(loadedFullUrl);
        // Extract only the first subdomain segment — works regardless of environment URL
        const firstSegment = full.hostname.split('.')[0];
        setSlug(full.hostname.includes('.') ? firstSegment : '');
      } catch {
        setSlug('');
      }
    }
    const loadedInheritedIds = (configData as any)?.inheritedCompanyIds ?? [];
    setInheritedCompanyIds(loadedInheritedIds);
    setCcEmailAddresses((configData as any)?.ccEmailAddresses ?? []);

    const branding = configData.companyPortalConfig?.branding;
    if (branding) {
      setBrandingHeading(
        branding.loginWelcomeMessage?.heading || "Welcome to Insurance and Wellness Hub"
      );
      setBrandingBodyText(
        branding.loginWelcomeMessage?.bodyText ||
        "Complete healthcare coverage for you and your family"
      );
      if (branding.companyLogoFileId) {
        setBrandingLogo({
          id: branding.companyLogoFileId,
          fileName: "Company Logo",
          fileBuffer: "",
        });
      } else {
        setBrandingLogo(null);
      }
    } else {
      setBrandingHeading("Welcome to Insurance and Wellness Hub");
      setBrandingBodyText(
        "Complete healthcare coverage for you and your family"
      );
      setBrandingLogo(null);
    }

    // Handle multiple authentication methods from new API
    const authMethodsFromNewApi = authConfigData?.data?.authMethods || [];
    const mappedAuth = authMethodsFromNewApi.length > 0 
      ? (() => {
          // Process all authentication methods from new API format
          const allMethods = authMethodsFromNewApi.map(authMethod => {
            const uiMethod = mapMethodCodeToUiMethod(
              authMethod?.methodCode,
              authMethod?.authenticationMethodKey
            );
            return uiMethod;
          }).filter(Boolean); // Remove any undefined methods
          
          // Use the first method for primary configuration
          const primaryAuth = mapAuthConfigFromNewApi(authMethodsFromNewApi[0]);

          // Build per-method configs for ALL auth methods so each method's drawer
          // is pre-populated with its own saved settings from the API
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const perMethodConfigs: Record<string, any> = {};
          authMethodsFromNewApi.forEach((authMethod: any) => {
            const uiMethod = mapMethodCodeToUiMethod(
              authMethod?.methodCode,
              authMethod?.authenticationMethodKey
            );
            if (uiMethod) {
              perMethodConfigs[uiMethod] = mapAuthConfigFromNewApi(authMethod);
            }
          });

          // Return enhanced config with methods array and per-method configs
          return {
            ...primaryAuth,
            methods: allMethods, // Add the methods array for multi-select
            perMethodConfigs,
          };
        })()
      : (() => {
          // Fallback to old API format if new API data is not available
          const authMethodsFromApi = configData.companyPortalConfig?.authentication || [];
          if (authMethodsFromApi.length === 0) {
            return DEFAULT_AUTH_CONFIG;
          }
          
          // Process old API format (maintained for backward compatibility)
          const allMethods = authMethodsFromApi.map((authItem: any) => {
            const normalizedMethodKey = normalizeAuthMethodKey(
              authItem?.authentication_method_key ?? (authItem?.method as string)
            );
            return mapMethodCodeToUiMethod(
              authItem?.methodCode,
              normalizedMethodKey ?? (authItem?.method as string)
            );
          }).filter(Boolean);

          // Build per-method configs from old format too
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const perMethodConfigs: Record<string, any> = {};
          authMethodsFromApi.forEach((authItem: any) => {
            const normalizedMethodKey = normalizeAuthMethodKey(
              authItem?.authentication_method_key ?? (authItem?.method as string)
            );
            const uiMethod = mapMethodCodeToUiMethod(
              authItem?.methodCode,
              normalizedMethodKey ?? (authItem?.method as string)
            );
            if (uiMethod) {
              perMethodConfigs[uiMethod] = mapAuthConfigFromNewApi(authItem);
            }
          });

          return {
            ...DEFAULT_AUTH_CONFIG,
            methods: allMethods,
            perMethodConfigs,
          };
        })();

    setAuthConfig(mappedAuth);

    const dashboardFromApi = configData.companyPortalDashboardConfig;
    if (dashboardFromApi) {
      setDashboardConfig(buildDashboardConfigFromApi(dashboardFromApi));
    } else {
      setDashboardConfig(DEFAULT_DASHBOARD_CONFIG);
    }

    setWellnessConfig(mapWellnessConfigFromApi(configData.companyPortalWellnessConfig));
    // Absent key => enabled (default true); only an explicit false disables it.
    // Backend persists this under `enableLifeEvents` (per portal config / domain).
    setIsLifeEventEnable(
      (dashboardFromApi as any)?.enableLifeEvents !== false
    );

    if (configData.mailServiceType) {
      setMailServiceType(configData.mailServiceType as "SES" | "SENDGRID");
    }

    if (configData.companyPolicyConfig) {
      const mappedSettings = createDefaultPolicySettings();
      const basePolicySetting = {
        enrollmentStartDate: null,
        enrollmentEndDate: null,
        employerContribution: "",
        requireConfirmation: false,
        autoLockEnrollment: true,
        autoLockAfterConfirmation: false,
        disclaimerText: "",
        isConfigured: false,
      };
      configData.companyPolicyConfig.forEach((policy) => {
        const existing = mappedSettings.get(policy.policyId) || basePolicySetting;
        mappedSettings.set(policy.policyId, {
          ...basePolicySetting,
          ...existing,
          enrollmentStartDate: policy.enrollmentPeriod?.startDate
            ? dayjs(policy.enrollmentPeriod.startDate)
            : null,
          enrollmentEndDate: policy.enrollmentPeriod?.endDate
            ? dayjs(policy.enrollmentPeriod.endDate)
            : null,
          requireConfirmation:
            policy.settings?.requireConfirmation ??
            (existing as any)?.requireConfirmation ??
            false,
          autoLockEnrollment:
            policy.settings?.autoLockEnrollment ??
            (existing as any)?.autoLockEnrollment ??
            true,
          autoLockAfterConfirmation:
            policy.settings?.autoLockAfterConfirmation ??
            (existing as any)?.autoLockAfterConfirmation ??
            false,
          disclaimerText: policy.settings?.disclaimerText ?? (existing as any)?.disclaimerText ?? "",
          employerContribution: (existing as any)?.employerContribution ?? "",
          isConfigured: policy.isConfigured ?? (existing as any)?.isConfigured ?? false,
        });
      });
      setPolicySettings(mappedSettings);
    }

    const offersAndBenefitsFromApi = (configData as any)?.offersAndBenefits;
    setOffersAndBenefits(
      Array.isArray(offersAndBenefitsFromApi)
        ? offersAndBenefitsFromApi.map((item: any) => ({
            id: item.id,
            localKey: `server-${item.id}`,
            title: item.title ?? "",
            description: item.description ?? "",
            redirectionUrl: item.redirectionUrl ?? "",
            imageFileId: item.imageFileId ?? null,
            isEnabled: item.isEnabled ?? true,
            displayOrder: item.displayOrder ?? 0,
          }))
        : []
    );
    setOffersAndBenefitsEnabled(
      (configData as any)?.offersAndBenefitsEnabled ?? true
    );
  }, [portalConfigData, authConfigData, authenticationMethods, isPendingNewDomain]);

  useEffect(() => {
    const onboardingMode =
      onboardingMailModeData as CompanyOnboardingMailModeResponse | undefined;
    setOnboardingMailTriggerMode(
      onboardingMode?.mode === ONBOARDING_MAIL_MODE.MANUAL
        ? ONBOARDING_MAIL_MODE.MANUAL
        : ONBOARDING_MAIL_MODE.CRON,
    );
  }, [onboardingMailModeData]);

  const initialOnboardingCronConfig = useMemo(() => {
    const response = cronConfigurationsData as
      | {
          data?: {
            data?: Array<{
              schedulerKey?: string;
              schedulerExpression?: string;
              isEnabled?: boolean;
            }>;
          };
        }
      | undefined;

    return (
      response?.data?.data?.find(
        (config) =>
          config.schedulerKey === "HANDLE_INITIAL_ONBOARDING_NOTIFICATIONS",
      ) ?? null
    );
  }, [cronConfigurationsData]);

  const initialOnboardingCronLabel = useMemo(() => {
    if (!initialOnboardingCronConfig?.schedulerExpression) {
      return null;
    }

    return describeCronExpression(initialOnboardingCronConfig.schedulerExpression);
  }, [initialOnboardingCronConfig]);

  const handleBack = () => {
    const fromPath = location.state?.fromPath;
    const filters = location.state?.filters;
    const safeState = filters ? { filters } : undefined;

    if (fromPath) {
      navigate(fromPath, { state: safeState });
      return;
    }

    if (location.state?.from === "companies") {
      navigate("/companies", { state: safeState });
      return;
    }

    if (id) {
      navigate(`/companies/${id}`);
      return;
    }

    navigate(-1);
  };

  const buildPasswordRequirements = (
    requirements: AuthenticationConfigState["passwordRequirements"]
  ) => ({
    uppercase: {
      required: requirements.uppercase,
      regex: requirements.uppercase ? "[A-Z]" : null,
    },
    lowercase: {
      required: requirements.lowercase,
      regex: requirements.lowercase ? "[a-z]" : null,
    },
    numbers: {
      required: requirements.numbers,
      regex: requirements.numbers ? "[0-9]" : null,
    },
    special: {
      required: requirements.special,
      regex: requirements.special ? "[^A-Za-z0-9]" : null,
    },
  });

  const resolveCompanyId = () => {
    const parsed = id ? Number(id) : null;
    if (parsed) return parsed;
    // fallback to API responses if id is not available
    return (
      (portalConfigData as CompanyPortalConfigResponse | undefined)?.companyId ??
      (companyDetailsData as any)?.companyId ??
      (companyDetailsData as any)?.company?.id ??
      null
    );
  };

  const handleSaveAndPublish = async (statusOverride?: PortalStatus | string | null) => {
    // Custom Domain Prefix is required (and must be valid) while it is still editable.
    const isSlugEditable = isEditMode && !urlConfig.fullUrl;
    if (isSlugEditable) {
      setSlugSubmitted(true);
      const trimmedSlug = slug.trim();
      if (!trimmedSlug) {
        dispatch(setToastMessage("Custom Domain Prefix is required."));
        return;
      }
      if (trimmedSlug.length < 3) {
        dispatch(setToastMessage("Custom Domain Prefix must be at least 3 characters."));
        return;
      }
      if (!isValidSlug(trimmedSlug)) {
        dispatch(setToastMessage("Please enter a valid Custom Domain Prefix."));
        return;
      }
    }

    const passwordRequirements = buildPasswordRequirements(
      authConfig.passwordRequirements
    );

    const selectedMethodKey =
      authConfig.methodKey || getDefaultAuthMethodKey(authConfig.method);

    const selectedMethod =
      authenticationMethods.find(
        (method) =>
          method.methodCode === authConfig.methodCode ||
          method.authenticationMethodKey === selectedMethodKey
      ) ?? null;

    const selectedMethodCode =
      authConfig.methodCode ||
      selectedMethod?.methodCode ||
      authConfig.methodKey ||
      selectedMethodKey;

    const otpRetryLimitValue = authConfig.maxOtpAttempts
      ? parseInt(authConfig.maxOtpAttempts, 10)
      : undefined;
    const normalizedOtpDeliveryMethod =
      authConfig.otpDelivery === "phone" || authConfig.otpDelivery === "sms"
        ? "phone"
        : "email";

    const twoFactorAuthentication = authConfig.enable2FA
      ? {
          enabled: authConfig.enable2FA,
          otpDeliveryMethod: normalizedOtpDeliveryMethod,
          otpValidityMinutes: parseInt(authConfig.otpValidity || "0", 10),
          resendOtpCooldownSeconds: parseInt(authConfig.resendOtpCooldown || "0", 10),
          otpRetryLimit: otpRetryLimitValue,
        }
      : { enabled: false };

    const passwordConfig =
      authConfig.method === AUTH_METHOD_KEYS.EMAIL_PASSWORD ||
        authConfig.method === AUTH_METHOD_KEYS.PHONE_PASSWORD
        ? {
          passwordPolicy: {
            minLength: parseInt(authConfig.minPasswordLength || "0", 10),
            requirements: passwordRequirements,
            expiryDays:
              authConfig.passwordExpiry === "never"
                ? null
                : parseInt(authConfig.passwordExpiry || "0", 10),
          },
          enrollmentReminderDays:
            authConfig.enrollmentReminderDays ?? DEFAULT_AUTH_CONFIG.enrollmentReminderDays,
          changePasswordOnFirstLogin: authConfig.changePasswordOnFirstLogin,
          requireOldPassword: authConfig.requireOldPassword,
          twoFactorAuthentication,
        }
        : undefined;

    const otpConfig =
      authConfig.method === AUTH_METHOD_KEYS.EMAIL_OTP ||
      authConfig.method === AUTH_METHOD_KEYS.MOBILE_OTP ||
      authConfig.method === AUTH_METHOD_KEYS.PHONE_PASSWORD
        ? {
            otpValidityMinutes: authConfig.otpValidity
              ? parseInt(authConfig.otpValidity, 10)
              : undefined,
            resendOtpCooldownSeconds: authConfig.resendOtpCooldown
              ? parseInt(authConfig.resendOtpCooldown, 10)
              : undefined,
          }
        : undefined;

    const resolvedFullUrl = (() => {
      // If domain is already saved in DB, never overwrite it with a locally-built URL
      if (urlConfig.fullUrl) return urlConfig.fullUrl;
      // Only build from slug when creating a new domain
      if (slug.trim()) {
        try {
          const base = new URL(environment.ibpAppUrl);
          return `${base.protocol}//${slug.trim()}.${base.host}${base.pathname}`;
        } catch {
          return null;
        }
      }
      return null;
    })();

    const targetStatus = statusOverride || STATUS_LABELS.PENDING;
    const portalConfigurationData = {
      // Domain the save targets; set below to activeConfigId/portalConfigId so
      // the backend writes to THIS config's detail (not a companyId fallback).
      configId: null as number | null,
      companyId: id || "",
      companyName:
        companyName ||
        companyDetailsData?.companyName ||
        companyDetailsData?.company?.companyName ||
        "",
      industry,
      companyPortalConfig: {
        urlAndDomain: {
          fullUrl: resolvedFullUrl,
        },
        authentication: (authConfig.methods && authConfig.methods.length > 0)
          ? // Multi-select: Create authentication object for each selected method
            (authConfig.methods.map((method, index) => {
              // For each method, find the corresponding authentication method data
              // First normalize the method key to match backend data format
              const normalizedMethodKey = getDefaultAuthMethodKey(method);
              
              // Debug logging to understand the mapping
              console.log(`Mapping method: ${method}, normalized: ${normalizedMethodKey}`);
              console.log('Available authentication methods:', authenticationMethods.map(am => ({
                id: am.id, 
                methodCode: am.methodCode, 
                authenticationMethodKey: am.authenticationMethodKey
              })));
              
              const methodData = authenticationMethods.find((authMethod) => {
                // Try multiple matching strategies
                const matches = [
                  authMethod.authenticationMethodKey === normalizedMethodKey,
                  authMethod.methodCode === method.toUpperCase(),
                  authMethod.methodCode === normalizedMethodKey,
                  authMethod.authenticationMethodKey === method,
                  // Handle specific mappings
                  (method === AUTH_METHOD_KEYS.EMAIL_PASSWORD && authMethod.methodCode === 'EMAIL_PASSWORD'),
                  (method === AUTH_METHOD_KEYS.EMAIL_OTP && authMethod.methodCode === 'EMAIL_OTP'), 
                  (method === AUTH_METHOD_KEYS.PHONE_PASSWORD && authMethod.methodCode === 'PHONE_PASSWORD'),
                  (method === AUTH_METHOD_KEYS.MOBILE_OTP && authMethod.methodCode === 'PHONE_OTP'),
                  (method === AUTH_METHOD_KEYS.EMPLOYEE_ID && authMethod.methodCode === 'USERNAME_PASSWORD')
                ];
                return matches.some(m => m);
              });
              
              console.log("Method %s mapped to:", method, methodData);

              // Ensure we have valid method data
              if (!methodData) {
                console.error(`No authentication method found for: ${method}`);
                return null; // Skip this method if we can't find matching data
              }

              const methodCode = methodData.methodCode;
              const methodKey = methodData.authenticationMethodKey || normalizedMethodKey;

              // Use this method's own saved config if available, otherwise fall back to flat authConfig
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const perMethodCfgs = (authConfig as any).perMethodConfigs || {};
              const mc = perMethodCfgs[method] || authConfig;

              // Build per-method password requirements
              const mcPasswordRequirements = buildPasswordRequirements(
                mc.passwordRequirements || authConfig.passwordRequirements
              );
              const mcTwoFactor = mc.enable2FA
                ? {
                    enabled: true,
                    otpDeliveryMethod:
                      mc.otpDelivery === "phone" || mc.otpDelivery === "sms" ? "phone" : "email",
                    otpValidityMinutes: parseInt(mc.otpValidity || "0", 10),
                    resendOtpCooldownSeconds: parseInt(mc.resendOtpCooldown || "0", 10),
                  }
                : { enabled: false };

              // Build configs for this specific method
              const isPasswordMethod = method === AUTH_METHOD_KEYS.EMAIL_PASSWORD || method === AUTH_METHOD_KEYS.PHONE_PASSWORD;
              const isOtpMethod = method === AUTH_METHOD_KEYS.EMAIL_OTP || method === AUTH_METHOD_KEYS.MOBILE_OTP || method === AUTH_METHOD_KEYS.PHONE_PASSWORD;

              const methodPasswordConfig = isPasswordMethod ? {
                passwordPolicy: {
                  minLength: parseInt(mc.minPasswordLength || "0", 10),
                  requirements: mcPasswordRequirements,
                  expiryDays:
                    mc.passwordExpiry === "never"
                      ? null
                      : parseInt(mc.passwordExpiry || "0", 10),
                },
                enrollmentReminderDays:
                  mc.enrollmentReminderDays ?? DEFAULT_AUTH_CONFIG.enrollmentReminderDays,
                changePasswordOnFirstLogin: mc.changePasswordOnFirstLogin,
                requireOldPassword: mc.requireOldPassword,
                twoFactorAuthentication: mcTwoFactor,
              } : undefined;

              const methodOtpConfig = isOtpMethod ? {
                otpValidityMinutes: parseInt(mc.otpValidity || "0", 10),
                resendOtpCooldownSeconds: parseInt(mc.resendOtpCooldown || "0", 10),
                ...(mc.maxOtpAttempts && { otpRetryLimit: parseInt(mc.maxOtpAttempts, 10) }),
              } : undefined;

              return {
                authentication_method_key: methodKey,
                methodCode: methodCode,
                authentication_method_id: methodData.id,
                enrollmentReminderDays:
                  mc.enrollmentReminderDays ?? DEFAULT_AUTH_CONFIG.enrollmentReminderDays,
                ...(methodPasswordConfig && { passwordConfig: methodPasswordConfig }),
                ...(methodOtpConfig && { otpConfig: methodOtpConfig }),
                ...(mc.sessionTimeout && {
                  sessionSettings: {
                    sessionTimeoutMinutes: parseInt(mc.sessionTimeout, 10),
                  },
                }),
              };
            })).filter(Boolean) // Remove any null results from methods that couldn't be mapped
          : // Single-select: Backward compatibility - create single authentication object
            [
              {
                authentication_method_key: selectedMethodCode,
                methodCode: selectedMethodCode,
                authentication_method_id: authConfig.methodId ?? selectedMethod?.id ?? null,
                enrollmentReminderDays:
                  authConfig.enrollmentReminderDays ?? DEFAULT_AUTH_CONFIG.enrollmentReminderDays,
                ...(passwordConfig && { passwordConfig }),
                ...(otpConfig && { otpConfig }),
                ...(authConfig.sessionTimeout && {
                  sessionSettings: {
                    sessionTimeoutMinutes: parseInt(authConfig.sessionTimeout, 10),
                  },
                }),
              },
            ],
        branding: {
          companyLogoFileId: brandingLogo?.id ?? null,
          loginWelcomeMessage: {
            heading: brandingHeading,
            bodyText: brandingBodyText,
          },
        },
      },
      companyPortalDashboardConfig: {
        wellness: {
          insuranceWellness: dashboardConfig.insuranceWellness,
          emotionalWellness: dashboardConfig.emotionalWellness,
          physicalWellness: dashboardConfig.physicalWellness,
        },
        insurance: {
          retailInsurance: dashboardConfig.retailInsurance,
        },
        wellnessBanner: dashboardConfig.wellnessBanner,
        portingBanner: dashboardConfig.portingBanner,
        enableLifeEvents: isLifeEventEnable,
      },
      companyPortalWellnessConfig: wellnessConfig,
      companyPolicyConfig: Array.from(policySettings.entries()).map(
        ([policyId, settings]) => ({
          policyId,
          policyName:
            policyId === POLICY_IDS.GMC
              ? POLICY_NAMES.GMC
              : policyId === POLICY_IDS.GTL
              ? POLICY_NAMES.GTL
              : POLICY_NAMES.GPA,
          isConfigured: settings.isConfigured,
          settings: {
            requireConfirmation: settings.requireConfirmation,
            autoLockEnrollment: settings.autoLockEnrollment,
            autoLockAfterConfirmation: settings.autoLockAfterConfirmation,
            disclaimerText: settings.disclaimerText,
          },
        })
      ),
      status: targetStatus,
      submittedAt: targetStatus === STATUS_LABELS.PENDING ? new Date().toISOString() : portalConfigData?.submittedAt ?? null,
      inheritedCompanyIds,
      offersAndBenefits: offersAndBenefits.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        redirectionUrl: item.redirectionUrl,
        imageFileId: item.imageFileId ?? undefined,
        isEnabled: item.isEnabled,
        displayOrder: item.displayOrder,
      })),
      offersAndBenefitsEnabled,
      ccEmailAddresses,
    };

    try {
      // Snapshot scope at the very start — state updates later will cause DomainScopeTab to
      // re-mount and overwrite pendingScopeRef before we save it.
      // Fall back to [] (= show all policies) if the user never interacted with scope tab.
      const scopeSnapshot: unknown[] = (pendingScopeRef.current as unknown[]) ?? [];

      // If this is a brand-new domain (never saved), create the DB record first
      let resolvedConfigId: number | null = activeConfigId ?? portalConfigId;
      if (isPendingNewDomain) {
        const createResult = await apiRequest(endPoints.createCompanyPortalConfig, {
          method: HTTP_METHODS.POST,
          data: { companyId: Number(id) },
        });
        const newConfigId = (createResult as any)?.data?.portalConfigId ?? (createResult as any)?.portalConfigId;
        if (!newConfigId) throw new Error("Failed to create domain portal");
        resolvedConfigId = newConfigId;
        portalConfigurationData.configId = newConfigId;

        // Immediately save scope to DB before state updates that re-mount DomainScopeTab.
        try {
          await apiRequest(endPoints.domainConfigScope(newConfigId), {
            method: HTTP_METHODS.POST,
            data: { scope: scopeSnapshot },
          });
        } catch (scopeErr) {
          console.error('Scope save failed for new domain:', scopeErr);
        }

        // Update state after scope is safely stored
        setActiveConfigId(newConfigId);
        setPortalConfigId(newConfigId);
        setIsPendingNewDomain(false);
      } else if (resolvedConfigId) {
        // Without this, the PUT omits configId entirely and the backend falls back to
        // findByCompanyId(companyId), which can resolve to a DIFFERENT domain's config
        // row for companies with multiple domain tabs — silently saving this domain's
        // edits (including Offers & Benefits) onto the wrong row.
        portalConfigurationData.configId = resolvedConfigId;
      }

      // Always target the domain being edited. Without configId the backend
      // resolves the row via findByCompanyId (a company-level fallback), so the
      // save lands on the wrong config and the data reads back null on
      // domain-scoped GETs (iwork prefill + ibp auth-config by subdomain).
      if (resolvedConfigId) {
        portalConfigurationData.configId = resolvedConfigId;
      }

      const saveResult = await savePortalConfig({
        endpoint: endPoints.updateCompanyPortalConfig,
        method: HTTP_METHODS.PUT as "PUT",
        data: portalConfigurationData,
      });
      // Use PUT response as fallback in case resolvedConfigId was still null (edge case)
      if (!resolvedConfigId) {
        resolvedConfigId = (saveResult as any)?.portalConfigId ?? (saveResult as any)?.data?.portalConfigId ?? null;
      }

      await refetchPortalConfigList();
      await refetchPortalConfig();

      // Save scope for existing domains using the resolvedConfigId captured above.
      // isPendingNewDomain is true in this closure for new domains (stale closure),
      // so we skip re-saving for new domains (already saved before state updates above).
      if (resolvedConfigId && !isPendingNewDomain) {
        try {
          await apiRequest(endPoints.domainConfigScope(resolvedConfigId), {
            method: HTTP_METHODS.POST,
            data: { scope: scopeSnapshot },
          });
        } catch (scopeErr) {
          console.error('Scope save failed for existing domain:', scopeErr);
        }
      }

      // Switch to view mode only after scope is saved so view DomainScopeTab fetches up-to-date data
      isDirtyRef.current = false;
      setIsEditMode(false);
      await updateOnboardingMailMode({
        endpoint: endPoints.updateCompanyOnboardingMailMode,
        method: HTTP_METHODS.PUT as "PUT",
        data: {
          companyId: Number(id),
          mode: onboardingMailTriggerMode,
        },
      });
      await refetchOnboardingMailMode();
    } catch (error) {
      // handled in mutation onError
    }
  };

  const handleEdit = () => {
    isDirtyRef.current = false;
    setIsEditMode(true);
    setCanSubmitAfterSave(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleDomainTabChange = async (configId: number) => {
    if (configId === activeConfigId && !isPendingNewDomain) return;
    if (isEditMode && isDirtyRef.current) {
      const ok = await showConfirmDialog("Unsaved Changes", "You have unsaved changes. Switch domain tab anyway? Unsaved changes will be lost.");
      if (!ok) return;
    }
    // If leaving a pending new domain (never saved to DB), just discard the state — no DB cleanup needed
    setIsPendingNewDomain(false);
    // Clear stale state before switching so the new domain loads fresh
    setUrlConfig({ fullUrl: null });
    setSlug("");
    setSlugSubmitted(false);
    setInheritedCompanyIds([]);
    setCcEmailAddresses([]);
    isDirtyRef.current = false;
    setIsEditMode(false);
    setActiveConfigId(configId);
    setPortalConfigId(configId);
  };

  const handleAddDomain = async () => {
    if (!id) return;
    if (isEditMode && isDirtyRef.current) {
      const ok = await showConfirmDialog("Unsaved Changes", "You have unsaved changes. Add a new domain anyway? Unsaved changes will be lost.");
      if (!ok) return;
    }
    // Don't create DB record yet — just switch to a blank edit form
    // The DB record is created only when user clicks Save
    setIsPendingNewDomain(true);
    setUrlConfig({ fullUrl: null });
    setSlug("");
    setSlugSubmitted(false);
    setAuthConfig(DEFAULT_AUTH_CONFIG);
    setInheritedCompanyIds([]);
    setOffersAndBenefits([]);
    setOffersAndBenefitsEnabled(true);
    setCcEmailAddresses([]);
    isDirtyRef.current = false;
    setActiveConfigId(null);
    setPortalConfigId(null);
    setIsEditMode(true);
  };

  const handleSaveDraft = () => handleSaveAndPublish(STATUS_LABELS.DRAFT);

  const resolveActiveSubDomain = () =>
    domainTabs.find((tab) => tab.configId === activeConfigId)?.subDomain ??
    slug ??
    null;

  // Quotes/escapes each field so commas, quotes, and newlines inside an
  // employee name/email don't silently corrupt the CSV's column layout.
  const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const downloadEmployeeListCsv = (
    employees: Array<{
      employeeId: number;
      employeeName: string;
      employeeEmail: string | null;
      companyEmployeeId: string | null;
    }>,
    fileNamePrefix: string,
  ) => {
    const headers = ["Employee ID", "Employee Name", "Employee Email"];
    const rows = employees.map((employee) =>
      [
        csvCell(employee.companyEmployeeId ?? ""),
        csvCell(employee.employeeName),
        csvCell(employee.employeeEmail ?? ""),
      ].join(","),
    );
    const csv = [headers.map(csvCell).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${fileNamePrefix}_${dayjs().format("YYYYMMDDHHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadOnboardingList = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue || !onboardingPreviewTotalCount) return;
    const subDomainValue = resolveActiveSubDomain();
    const response = await apiRequest(
      endPoints.previewCompanyInitialOnboardingNotifications(
        companyIdValue,
        subDomainValue ?? undefined,
        1,
        onboardingPreviewTotalCount,
      ),
      { method: "GET" },
    );
    const employees = (response as any)?.data?.employees ?? [];
    downloadEmployeeListCsv(employees, "onboarding_mail_recipients");
  };

  const handleDownloadConfirmationList = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue || !confirmationPreviewTotalCount) return;
    const subDomainValue = resolveActiveSubDomain();
    const response = await apiRequest(
      endPoints.previewBulkEnrollmentConfirmation(
        companyIdValue,
        subDomainValue ?? undefined,
        1,
        confirmationPreviewTotalCount,
      ),
      { method: "GET" },
    );
    const employees = (response as any)?.data?.employees ?? [];
    downloadEmployeeListCsv(employees, "confirmation_mail_recipients");
  };

  const handleTriggerCompanyOnboardingMails = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue) return;
    const subDomainValue = resolveActiveSubDomain();

    const confirmed = await showConfirmDialog(
      "Send Onboarding Mails?",
      `We have ${onboardingPreviewTotalCount} employee${onboardingPreviewTotalCount === 1 ? "" : "s"} pending under this domain. All of them will receive the onboarding mail. Do you want to continue?`,
    );
    if (!confirmed) return;

    setIsSendingOnboardingInBackground(true);
    onboardingJobJustTriggeredAtRef.current = Date.now();

    await triggerCompanyInitialOnboardingNotifications({
      endpoint: endPoints.triggerCompanyInitialOnboardingNotifications,
      method: HTTP_METHODS.POST as "POST",
      data: {
        companyId: companyIdValue,
        ...(subDomainValue ? { subDomain: subDomainValue } : {}),
      },
    });

    refetchOnboardingJobStatus();
  };

  const handleSendTestOnboardingMail = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue) return;
    const email = testEmployeeEmail.trim();
    if (!email) {
      dispatch(setToastMessage("Enter an employee email to send a test mail."));
      return;
    }
    const subDomainValue = resolveActiveSubDomain();
    setTestMailStatusMessage("Sending onboarding mail…");

    await triggerTestEmployeeOnboardingMail({
      endpoint: endPoints.triggerTestEmployeeOnboardingMail,
      method: HTTP_METHODS.POST as "POST",
      data: {
        companyId: companyIdValue,
        email,
        ...(subDomainValue ? { subDomain: subDomainValue } : {}),
      },
    });
  };

  const handleCancelTestOnboardingMail = () => {
    setTestEmployeeEmail("");
    setTestMailStatusMessage("No test initiated. Enter an email and click Send.");
  };

  const handleTriggerBulkEnrollmentConfirmation = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue) return;
    const subDomainValue = resolveActiveSubDomain();

    const confirmed = await showConfirmDialog(
      "Send Confirmation Mails?",
      `We have ${confirmationPreviewTotalCount} employee${confirmationPreviewTotalCount === 1 ? "" : "s"} enrolled with choices under this domain. All of them will receive this confirmation mail. Do you want to continue?`,
    );
    if (!confirmed) return;

    setIsSendingConfirmationInBackground(true);
    confirmationJobJustTriggeredAtRef.current = Date.now();

    await triggerBulkEnrollmentConfirmation({
      endpoint: endPoints.triggerBulkEnrollmentConfirmation,
      method: HTTP_METHODS.POST as "POST",
      data: {
        companyId: companyIdValue,
        ...(subDomainValue ? { subDomain: subDomainValue } : {}),
      },
    });

    refetchConfirmationJobStatus();
  };

  const handleSendTestConfirmationMail = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue) return;
    const email = testConfirmationEmployeeEmail.trim();
    if (!email) {
      dispatch(setToastMessage("Enter an employee email to send a test mail."));
      return;
    }
    const subDomainValue = resolveActiveSubDomain();
    setConfirmationMailStatusMessage("Sending confirmation mail…");

    await triggerTestEmployeeEnrollmentConfirmation({
      endpoint: endPoints.triggerTestEmployeeEnrollmentConfirmation,
      method: HTTP_METHODS.POST as "POST",
      data: {
        companyId: companyIdValue,
        email,
        ...(subDomainValue ? { subDomain: subDomainValue } : {}),
      },
    });
  };


  const handleSubmitForApproval = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue) return;
    if (!canSubmitAfterSave) {
      dispatch(setToastMessage(TOAST_MESSAGES.SUBMIT_NEEDS_SAVE));
      return;
    }
    await submitPortalConfig({
      endpoint: endPoints.companyPortalSubmission,
      method: HTTP_METHODS.POST as "POST",
      data: {
        companyId: companyIdValue,
        comments: rejectionComment || "",
      },
    });
    await refetchPortalConfig();
    setCanSubmitAfterSave(false);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitDialogOpen(false);
    await handleSubmitForApproval();
  };

  const handleApprove = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue) return;
    await approvePortalConfig({
      endpoint: endPoints.companyPortalApproval,
      method: HTTP_METHODS.PUT as "PUT",
      data: {
        companyId: companyIdValue,
        status: "APPROVED",
        comments: rejectionComment || "",
      },
    });
    await refetchPortalConfig();
    handleBack();
  };

  const handleConfirmApprove = async () => {
    setIsApproveDialogOpen(false);
    await handleApprove();
  };

  const handleReject = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue) return;
    const trimmedComment = rejectionComment.trim();
    if (trimmedComment === "") {
      setShowRejectionError(true);
      return;
    }

    setRejectionComment(trimmedComment);
    setIsRejectDialogOpen(false);
    setShowRejectionError(false);
    await approvePortalConfig({
      endpoint: endPoints.companyPortalApproval,
      method: HTTP_METHODS.PUT as "PUT",
      data: {
        companyId: companyIdValue,
        status: "REJECTED",
        comments: trimmedComment,
      },
    });
    dispatch(setToastMessage(TOAST_MESSAGES.REJECT_SUCCESS));
    await refetchPortalConfig();
  };

  const handleOnboardingMailEdit = () => {
    setOnboardingMailTriggerModeLocal(onboardingMailTriggerMode);
    setIsOnboardingMailEditMode(true);
  };

  const handleOnboardingMailCancel = () => {
    setOnboardingMailTriggerModeLocal(onboardingMailTriggerMode);
    setIsOnboardingMailEditMode(false);
  };

  const handleOnboardingMailSave = async () => {
    const companyIdValue = resolveCompanyId();
    if (!companyIdValue) return;
    await updateOnboardingMailMode({
      endpoint: endPoints.updateCompanyOnboardingMailMode,
      method: HTTP_METHODS.PUT as "PUT",
      data: { companyId: Number(companyIdValue), mode: onboardingMailTriggerModeLocal },
    });
    setOnboardingMailTriggerMode(onboardingMailTriggerModeLocal);
    await refetchOnboardingMailMode();
    setIsOnboardingMailEditMode(false);
  };

  const renderOnboardingMailControls = (isPageEdit: boolean) => {
    const currentMode = isPageEdit ? onboardingMailTriggerMode : onboardingMailTriggerMode;
    const isCardEditing = !isPageEdit && isOnboardingMailEditMode;
    const displayMode = isCardEditing ? onboardingMailTriggerModeLocal : currentMode;

    const subtitle = isPageEdit || isCardEditing
      ? "Choose whether onboarding mails run automatically through cron or are triggered manually for this company."
      : currentMode === ONBOARDING_MAIL_MODE.CRON
      ? initialOnboardingCronLabel
        ? `Runs automatically: ${initialOnboardingCronLabel}`
        : "Runs automatically via cron schedule."
      : "Triggered manually for this company.";

    return (
      <SettingsSectionCard>
        <SettingsSectionHeader>
          <SettingsSectionIconBox>
            <ForwardToInboxIcon sx={{ fontSize: 24, color: "#3B82F6" }} />
          </SettingsSectionIconBox>
          <SettingsSectionText>
            <SettingsSectionTitle>Initial Onboarding Mails</SettingsSectionTitle>
            <SettingsSectionDescription>{subtitle}</SettingsSectionDescription>
          </SettingsSectionText>
          {!isPageEdit && !isCardEditing && canEditPortalConfig && (
            <Button
              variantType="secondary"
              sizeType="small"
              startIcon={<EditIcon />}
              onClick={handleOnboardingMailEdit}
            >
              {BUTTON_LABELS.EDIT}
            </Button>
          )}
        </SettingsSectionHeader>
        <SettingsSectionBody>
          {isPageEdit || isCardEditing ? (
            <SettingsControlsRow>
              <FormControl
                size="small"
                sx={{ minWidth: 260, "& .MuiOutlinedInput-root": { minHeight: 48 } }}
              >
                <InputLabel id="onboarding-mail-mode-label">Onboarding Mail Mode</InputLabel>
                <Select
                  labelId="onboarding-mail-mode-label"
                  value={isPageEdit ? onboardingMailTriggerMode : onboardingMailTriggerModeLocal}
                  label="Onboarding Mail Mode"
                  onChange={(event) => {
                    const val = event.target.value as CompanyOnboardingMailTriggerMode;
                    if (isPageEdit) setOnboardingMailTriggerMode(val);
                    else setOnboardingMailTriggerModeLocal(val);
                  }}
                >
                  <MenuItem value={ONBOARDING_MAIL_MODE.CRON}>Cron</MenuItem>
                  <MenuItem value={ONBOARDING_MAIL_MODE.MANUAL}>Manual</MenuItem>
                </Select>
              </FormControl>
              {isCardEditing && (
                <>
                  <Button
                    variantType="primary"
                    sizeType="small"
                    onClick={handleOnboardingMailSave}
                    disabled={isUpdatingOnboardingMailMode}
                  >
                    {BUTTON_LABELS.SAVE}
                  </Button>
                  <Button
                    variantType="secondary"
                    sizeType="small"
                    onClick={handleOnboardingMailCancel}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </SettingsControlsRow>
          ) : (
            <SettingsControlsRow>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ color: "#6B7280" }}>Mode:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {currentMode === ONBOARDING_MAIL_MODE.MANUAL ? "Manual" : "Cron"}
                </Typography>
              </Box>
              {currentMode === ONBOARDING_MAIL_MODE.MANUAL && (
                <Button
                  variant="outlined"
                  onClick={handleTriggerCompanyOnboardingMails}
                  sx={{ minWidth: 220, height: 48 }}
                  disabled={isTriggeringOnboardingMails || isSendingOnboardingInBackground}
                >
                  {isTriggeringOnboardingMails || isSendingOnboardingInBackground ? (
                    <>
                      <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                      Sending...
                    </>
                  ) : (
                    BUTTON_LABELS.TRIGGER_ONBOARDING_MAILS
                  )}
                </Button>
              )}
            </SettingsControlsRow>
          )}
          {!isPageEdit && !isCardEditing && currentMode === ONBOARDING_MAIL_MODE.MANUAL && (
            <>
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mt: 2 }}>
                {isOnboardingPreviewError ? (
                  <Typography variant="body2" sx={{ color: "#DC2626" }}>
                    Couldn't load the eligible employee count —{" "}
                    {(onboardingPreviewError as any)?.message || "please try refreshing."}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: "#374151" }}>
                    <strong>{onboardingPreviewTotalCount}</strong> employee
                    {onboardingPreviewTotalCount === 1 ? "" : "s"}
                    {onboardingPreviewTotalCount === 1 ? " is" : " are"} currently pending (haven't
                    received the onboarding mail yet).
                  </Typography>
                )}
                <Button
                  variantType="secondary"
                  sizeType="small"
                  onClick={() => setIsOnboardingPreviewOpen(true)}
                  disabled={!onboardingPreviewTotalCount}
                >
                  View list
                </Button>
                <Button variantType="secondary" sizeType="small" onClick={() => refetchOnboardingPreview()}>
                  Refresh count
                </Button>
                <Button
                  variantType="secondary"
                  sizeType="small"
                  onClick={handleDownloadOnboardingList}
                  disabled={!onboardingPreviewTotalCount}
                >
                  Download
                </Button>
              </Box>
              <Typography variant="caption" sx={{ color: "#6B7280", display: "block", mt: 1 }}>
                Sending happens in the background — the button stays disabled and the
                count refreshes automatically once it's done.
              </Typography>
            </>
          )}
          {!isPageEdit && !isCardEditing && canEditPortalConfig && (
            <>
              <Divider sx={{ my: 4 }} />
              <Box display="flex" gap={4} flexWrap="wrap">
                <Box sx={{ flex: "1 1 260px", minWidth: 220 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
                    Onboarding Mails for a User
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6B7280", mt: 0.5 }}>
                    Enter an email address to send a onboarding mail to a
                    specific user. This helps verify delivery and layout.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: "1 1 360px",
                    minWidth: 320,
                    border: "1px solid #E5E7EB",
                    borderRadius: 2,
                    bgcolor: "#F8FAFC",
                    p: 3,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: "#374151", display: "block", mb: 1 }}
                  >
                    User email (Required)
                  </Typography>
                  <Box display="flex" gap={1.5} flexWrap="wrap">
                    <TextField
                      size="small"
                      placeholder="employee@example.com"
                      value={testEmployeeEmail}
                      onChange={(e) => setTestEmployeeEmail(e.target.value)}
                      sx={{
                        flex: "1 1 220px",
                        bgcolor: "white",
                        "& .MuiOutlinedInput-root": { minHeight: 44 },
                      }}
                    />
                    <Button
                      variant="contained"
                      label={BUTTON_LABELS.SEND_TEST_EMAILS}
                      onClick={handleSendTestOnboardingMail}
                      sx={{ minWidth: 160, height: 44 }}
                      disabled={isSendingTestMail || !testEmployeeEmail.trim()}
                    />
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" sx={{ color: "#6B7280" }}>
                    <strong>Status:</strong> {testMailStatusMessage}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </SettingsSectionBody>
      </SettingsSectionCard>
    );
  };

  const confirmationPreviewTotalCount = confirmationPreviewData?.data?.totalCount ?? 0;
  const confirmationPreviewEmployees = confirmationPreviewData?.data?.employees ?? [];

  const onboardingPreviewTotalCount = onboardingPreviewData?.data?.totalCount ?? 0;
  const onboardingPreviewEmployees = onboardingPreviewData?.data?.employees ?? [];

  const renderConfirmationMailControls = () => (
    <SettingsSectionCard>
      <SettingsSectionHeader>
        <SettingsSectionIconBox>
          <MarkEmailReadIcon sx={{ fontSize: 24, color: "#3B82F6" }} />
        </SettingsSectionIconBox>
        <SettingsSectionText>
          <SettingsSectionTitle>Enrollment Confirmation Mails</SettingsSectionTitle>
          <SettingsSectionDescription>
            Send enrollment confirmation mails to all employees enrolled with
            choices under this domain.
          </SettingsSectionDescription>
        </SettingsSectionText>
      </SettingsSectionHeader>
      <SettingsSectionBody>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
          {isConfirmationPreviewError ? (
            <Typography variant="body2" sx={{ color: "#DC2626" }}>
              Couldn't load the eligible employee count —{" "}
              {(confirmationPreviewError as any)?.message || "please try refreshing."}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: "#374151" }}>
              <strong>{confirmationPreviewTotalCount}</strong> employee
              {confirmationPreviewTotalCount === 1 ? "" : "s"} enrolled with choices
              {confirmationPreviewTotalCount === 1 ? " is" : " are"} currently eligible for this mail.
            </Typography>
          )}
          <Button
            variantType="secondary"
            sizeType="small"
            onClick={() => setIsConfirmationPreviewOpen(true)}
            disabled={!confirmationPreviewTotalCount}
          >
            View list
          </Button>
          <Button variantType="secondary" sizeType="small" onClick={() => refetchConfirmationPreview()}>
            Refresh count
          </Button>
          <Button
            variantType="secondary"
            sizeType="small"
            onClick={handleDownloadConfirmationList}
            disabled={!confirmationPreviewTotalCount}
          >
            Download
          </Button>
        </Box>
        <SettingsControlsRow>
          <Button
            variant="outlined"
            onClick={handleTriggerBulkEnrollmentConfirmation}
            sx={{ minWidth: 220, height: 48 }}
            disabled={isTriggeringConfirmationMails || isSendingConfirmationInBackground}
          >
            {isTriggeringConfirmationMails || isSendingConfirmationInBackground ? (
              <>
                <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                Sending...
              </>
            ) : (
              BUTTON_LABELS.TRIGGER_CONFIRMATION_MAILS
            )}
          </Button>
        </SettingsControlsRow>
        <Typography variant="caption" sx={{ color: "#6B7280", display: "block", mt: 1 }}>
          Sending happens in the background — the button stays disabled and the
          count refreshes automatically once it's done.
        </Typography>
        {canEditPortalConfig && (
          <>
            <Divider sx={{ my: 4 }} />
            <Box display="flex" gap={4} flexWrap="wrap">
              <Box sx={{ flex: "1 1 260px", minWidth: 220 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
                  Confirmation Mails for a User
                </Typography>
                <Typography variant="body2" sx={{ color: "#6B7280", mt: 0.5 }}>
                  Enter an email address to send a confirmation mail to a
                  specific user. This helps verify delivery and layout.
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: "1 1 360px",
                  minWidth: 320,
                  border: "1px solid #E5E7EB",
                  borderRadius: 2,
                  bgcolor: "#F8FAFC",
                  p: 3,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#374151", display: "block", mb: 1 }}
                >
                  User email (Required)
                </Typography>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                  <TextField
                    size="small"
                    placeholder="employee@example.com"
                    value={testConfirmationEmployeeEmail}
                    onChange={(e) => setTestConfirmationEmployeeEmail(e.target.value)}
                    sx={{
                      flex: "1 1 220px",
                      bgcolor: "white",
                      "& .MuiOutlinedInput-root": { minHeight: 44 },
                    }}
                  />
                  <Button
                    variant="contained"
                    label={BUTTON_LABELS.SEND_TEST_EMAILS}
                    onClick={handleSendTestConfirmationMail}
                    sx={{ minWidth: 160, height: 44 }}
                    disabled={isSendingTestConfirmationMail || !testConfirmationEmployeeEmail.trim()}
                  />
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" sx={{ color: "#6B7280" }}>
                  <strong>Status:</strong> {confirmationMailStatusMessage}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </SettingsSectionBody>
    </SettingsSectionCard>
  );

  const renderConfirmationPreviewDialog = () => (
    <Dialog
      open={isConfirmationPreviewOpen}
      onClose={() => setIsConfirmationPreviewOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: 620, paddingBottom: 0 } }}
    >
      <DialogTitle>Confirmation mail recipients</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", paddingBottom: '0px !important' }}>
        <Typography variant="body2" sx={{ color: "#6B7280", mb: 2 }}>
          {confirmationPreviewTotalCount} employee{confirmationPreviewTotalCount === 1 ? "" : "s"} enrolled
          with choices {confirmationPreviewTotalCount === 1 ? "is" : "are"} currently eligible for this mail.
        </Typography>
        <Box sx={{ position: "relative", height: 400 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ height: "100%" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Employee Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {confirmationPreviewEmployees.map((employee: any) => (
                  <TableRow key={employee.employeeId}>
                    <TableCell>{employee.companyEmployeeId ?? "—"}</TableCell>
                    <TableCell>{employee.employeeName}</TableCell>
                    <TableCell>{employee.employeeEmail}</TableCell>
                  </TableRow>
                ))}
                {!confirmationPreviewEmployees.length && !isConfirmationPreviewFetching && (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ color: "#6B7280" }}>
                      No eligible employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {isConfirmationPreviewFetching && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255, 255, 255, 0.6)",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          )}
        </Box>
        <TablePagination
          component="div"
          count={confirmationPreviewTotalCount}
          page={confirmationPreviewPage}
          onPageChange={(_event, newPage) => setConfirmationPreviewPage(newPage)}
          rowsPerPage={confirmationPreviewPageSize}
          onRowsPerPageChange={(event) => {
            setConfirmationPreviewPageSize(Number(event.target.value));
            setConfirmationPreviewPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            position: "sticky",
            bottom: 0,
            bgcolor: "background.paper",
            borderTop: "1px solid #E5E7EB",
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button variantType="secondary" sizeType="small" onClick={handleDownloadConfirmationList}>
          Download
        </Button>
        <Button variantType="secondary" sizeType="small" onClick={() => setIsConfirmationPreviewOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderOnboardingPreviewDialog = () => (
    <Dialog
      open={isOnboardingPreviewOpen}
      onClose={() => setIsOnboardingPreviewOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: 620, paddingBottom: 0 } }}
    >
      <DialogTitle>Onboarding mail recipients</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", paddingBottom: '0px !important' }}>
        <Typography variant="body2" sx={{ color: "#6B7280", mb: 2 }}>
          {onboardingPreviewTotalCount} employee{onboardingPreviewTotalCount === 1 ? "" : "s"}{" "}
          {onboardingPreviewTotalCount === 1 ? "is" : "are"} currently pending (haven't received
          the onboarding mail yet).
        </Typography>
        <Box sx={{ position: "relative", height: 400 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ height: "100%" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Employee Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {onboardingPreviewEmployees.map((employee: any) => (
                  <TableRow key={employee.employeeId}>
                    <TableCell>{employee.companyEmployeeId ?? "—"}</TableCell>
                    <TableCell>{employee.employeeName}</TableCell>
                    <TableCell>{employee.employeeEmail}</TableCell>
                  </TableRow>
                ))}
                {!onboardingPreviewEmployees.length && !isOnboardingPreviewFetching && (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ color: "#6B7280" }}>
                      No pending employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {isOnboardingPreviewFetching && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255, 255, 255, 0.6)",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          )}
        </Box>
        <TablePagination
          component="div"
          count={onboardingPreviewTotalCount}
          page={onboardingPreviewPage}
          onPageChange={(_event, newPage) => setOnboardingPreviewPage(newPage)}
          rowsPerPage={onboardingPreviewPageSize}
          onRowsPerPageChange={(event) => {
            setOnboardingPreviewPageSize(Number(event.target.value));
            setOnboardingPreviewPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            position: "sticky",
            bottom: 0,
            bgcolor: "background.paper",
            borderTop: "1px solid #E5E7EB",
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button variantType="secondary" sizeType="small" onClick={handleDownloadOnboardingList}>
          Download
        </Button>
        <Button variantType="secondary" sizeType="small" onClick={() => setIsOnboardingPreviewOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderLifeEventsSetting = (readOnly: boolean) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 3,
        p: 2.5,
        mt: readOnly ? 0 : 2,
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        bgcolor: "#F9FAFB",
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", mb: 0.5 }}>
          Life Events
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
          When enabled, employees can access the Life Events section in the
          IBP portal to add or remove dependents after a qualifying life
          event (such as marriage or childbirth). Turn this off to hide the
          Life Events section for this company.
        </Typography>
      </Box>
      <Box sx={{ pointerEvents: readOnly ? "none" : "auto", pt: 0.5 }}>
        <Toggle
          checked={isLifeEventEnable}
          onChange={(checked) => {
            if (readOnly) return;
            isDirtyRef.current = true;
            setIsLifeEventEnable(checked);
          }}
        />
      </Box>
    </Box>
  );

  const renderCompanyConfigurationEdit = () => (
    <PortalContainer>
      {(domainTabs.length > 0 || isPendingNewDomain) && (
        <DomainTabsHeader
          tabs={domainTabs}
          activeConfigId={activeConfigId}
          onTabChange={handleDomainTabChange}
          onAddDomain={handleAddDomain}
          unscopedPolicyCount={unscopedPolicyCount}
          isEditMode={isEditMode}
          isCreating={isCreatingDomain}
          isPendingNewDomain={isPendingNewDomain}
        />
      )}
      <PortalSetupSection sx={{ marginBottom: 6.5 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SectionTitle>{SECTION_TITLES.PORTAL_SETUP}</SectionTitle>
        </Box>
        <SectionSubtitle>
          {SECTION_SUBTITLES.PORTAL_SETUP}
        </SectionSubtitle>
        {renderOnboardingMailControls(true)}
      </PortalSetupSection>

      <AccordionSection
        id="url-domain"
        number={ACCORDION_NUMBERS.URL_DOMAIN}
        title={SECTION_TITLES.PORTAL_URL_DOMAIN}
        subtitle={SECTION_SUBTITLES.PORTAL_URL_DOMAIN}
        icon={<StyledGlobalIcon />}
        defaultExpanded={true}
      >
        <URLDomainSection
          isRejected={portalStatus === STATUS_LABELS.REJECTED}
          fullUrl={urlConfig.fullUrl}
          slug={slug}
          onSlugChange={setSlug}
          isEditMode={isEditMode}
          isDomainLocked={Boolean(urlConfig.fullUrl) && Boolean(slug)}
          submitted={slugSubmitted}
        />
        <DomainScopeTab
          key={`scope-${portalConfigId ?? 'new'}`}
          configId={portalConfigId}
          currentCompanyId={id}
          currentCompanyName={companyName}
          inheritedCompanyIds={inheritedCompanyIds}
          onInheritedCompaniesChange={(ids) => { isDirtyRef.current = true; setInheritedCompanyIds(ids); }}
          isEditMode={true}
          onScopeChange={(scope) => { pendingScopeRef.current = scope; }}
          onDirty={() => { isDirtyRef.current = true; }}
          ccEmailAddresses={ccEmailAddresses}
          onCcEmailAddressesChange={setCcEmailAddresses}
        />
      </AccordionSection>

      <AccordionSection
        id="login-auth"
        number={ACCORDION_NUMBERS.LOGIN_AUTH}
        title={SECTION_TITLES.LOGIN_AUTHENTICATION}
        subtitle={SECTION_SUBTITLES.LOGIN_AUTHENTICATION}
        icon={<StyledKeyIcon />}
        defaultExpanded={false}
      >
          <LoginAuthSection
            config={authConfig}
            availableMethods={authenticationMethods}
            onConfigChange={(val) => { isDirtyRef.current = true; setAuthConfig(val); }}
            hideEmployeeIdMethod={false}
          />
      </AccordionSection>

      {/* <AccordionSection
        id="branding"
        number={ACCORDION_NUMBERS.BRANDING}
        title={SECTION_TITLES.BRANDING}
        subtitle={SECTION_SUBTITLES.BRANDING}
        icon={<StyledPaletteIcon />}
        defaultExpanded={false}
      >
        <BrandingSection
          companyId={id}
          existingLogo={brandingLogo}
          onLogoChange={setBrandingLogo}
          heading={brandingHeading}
          bodyText={brandingBodyText}
          onHeadingChange={setBrandingHeading}
          onBodyTextChange={setBrandingBodyText}
          disableWelcomeMessage={isDefaultLocked}
        />
      </AccordionSection> */}

      <AccordionSection
        id="notification-settings"
        number={ACCORDION_NUMBERS.NOTIFICATION_SETTINGS}
        title={SECTION_TITLES.NOTIFICATION_SETTINGS}
        subtitle={SECTION_SUBTITLES.NOTIFICATION_SETTINGS}
        icon={<StyledEmailIcon />}
        defaultExpanded={false}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 0.5 }}>
              Mail Service Provider
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 1.5 }}>
              All IBP emails (OTPs, enrollment, reminders, password reset) for this company will be
              sent via the selected provider. AWS SES is the default — switch to SendGrid only if
              SendGrid credentials are configured in the environment.
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              {(["SES", "SENDGRID"] as const).map((option) => (
                <Box
                  key={option}
                  onClick={() => { isDirtyRef.current = true; setMailServiceType(option); }}
                  sx={{
                    px: 3, py: 1.5,
                    border: `2px solid ${mailServiceType === option ? "#093F84" : "#D1D5DB"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    bgcolor: mailServiceType === option ? "#EFF6FF" : "#FFFFFF",
                    fontWeight: mailServiceType === option ? 700 : 400,
                    fontSize: 13,
                    color: mailServiceType === option ? "#093F84" : "#374151",
                    transition: "all 0.15s",
                    userSelect: "none",
                    "&:hover": { borderColor: "#093F84", bgcolor: "#EFF6FF" },
                  }}
                >
                  {option === "SES" ? "AWS SES (Default)" : "SendGrid (SMTP)"}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </AccordionSection>
      {renderLifeEventsSetting(false)}
    </PortalContainer>
  );

  const renderCompanyConfigurationView = () => (
    <Box display="flex" flexDirection="column" gap={5} sx={{ paddingTop: 5 }}>
      {domainTabs.length > 0 && (
        <DomainTabsHeader
          tabs={domainTabs}
          activeConfigId={activeConfigId}
          onTabChange={handleDomainTabChange}
          onAddDomain={handleAddDomain}
          unscopedPolicyCount={unscopedPolicyCount}
          isEditMode={false}
          isCreating={isCreatingDomain}
        />
      )}
      <PortalSetupSection>
        <SectionTitle>{SECTION_TITLES.PORTAL_SETUP}</SectionTitle>
        <SectionSubtitle>
          {SECTION_SUBTITLES.PORTAL_SETUP}
        </SectionSubtitle>
        {renderOnboardingMailControls(false)}
        {renderOnboardingPreviewDialog()}
        {renderConfirmationMailControls()}
        {renderConfirmationPreviewDialog()}
      </PortalSetupSection>
      <CompanyConfigurationView
        authConfig={authConfig}
        portalStatus={portalStatus}
        brandingHeading={brandingHeading}
        brandingBodyText={brandingBodyText}
        brandingLogo={brandingLogo}
        offersAndBenefits={offersAndBenefits}
        domainScopeSlot={
          <DomainScopeTab
            key={`scope-${portalConfigId ?? 'new'}`}
            configId={portalConfigId}
            currentCompanyId={id}
            currentCompanyName={companyName}
            inheritedCompanyIds={inheritedCompanyIds}
            onInheritedCompaniesChange={setInheritedCompanyIds}
            isEditMode={false}
            fullUrl={urlConfig.fullUrl}
            ccEmailAddresses={ccEmailAddresses}
          />
        }
      />


      <SettingsSectionCard>
        <SettingsSectionHeader>
          <SettingsSectionIconBox>
            <StyledEmailIcon />
          </SettingsSectionIconBox>
          <SettingsSectionText>
            <SettingsSectionTitle>{SECTION_TITLES.NOTIFICATION_SETTINGS}</SettingsSectionTitle>
            <SettingsSectionDescription>{SECTION_SUBTITLES.NOTIFICATION_SETTINGS}</SettingsSectionDescription>
          </SettingsSectionText>
        </SettingsSectionHeader>
        <SettingsSectionBody>
          <Box sx={{ display: "flex", gap: 2 }}>
            {(["SES", "SENDGRID"] as const).map((option) => (
              <Box
                key={option}
                sx={{
                  px: 3, py: 1.5,
                  border: `2px solid ${mailServiceType === option ? "#093F84" : "#E5E7EB"}`,
                  borderRadius: "8px",
                  bgcolor: mailServiceType === option ? "#EFF6FF" : "#F9FAFB",
                  fontWeight: mailServiceType === option ? 700 : 400,
                  fontSize: 13,
                  color: mailServiceType === option ? "#093F84" : "#9CA3AF",
                  cursor: "default",
                  userSelect: "none",
                }}
              >
                {option === "SES" ? "AWS SES (Default)" : "SendGrid (SMTP)"}
              </Box>
            ))}
          </Box>
        </SettingsSectionBody>
      </SettingsSectionCard>
      {renderLifeEventsSetting(true)}
    </Box>
  );

  const tabs = [
    {
      tabKey: TAB_KEYS.COMPANY,
      label: TAB_LABELS.COMPANY,
      content: isEditMode
        ? renderCompanyConfigurationEdit()
        : renderCompanyConfigurationView(),
    },
    // {
    //   tabKey: TAB_KEYS.DASHBOARD,
    //   label: TAB_LABELS.DASHBOARD,
    //   content: isEditMode ? (
    //     <DashboardConfiguration
    //       isEditMode={isEditMode}
    //       config={dashboardConfig}
    //       onChange={setDashboardConfig}
    //     />
    //   ) : (
    //     <DashboardConfigurationView dashboardConfig={dashboardConfig} />
    //   ),
    // },
    ...(environment.featureFlag.FF_IWORK_WELLNESS_CONFIGURATION
      ? [
          {
            tabKey: TAB_KEYS.WELLNESS,
            label: TAB_LABELS.WELLNESS,
            content: (
              <Box display="flex" flexDirection="column" gap={5}>
                {(domainTabs.length > 0 || isPendingNewDomain) && (
                  <DomainTabsHeader
                    tabs={domainTabs}
                    activeConfigId={activeConfigId}
                    onTabChange={handleDomainTabChange}
                    onAddDomain={handleAddDomain}
                    unscopedPolicyCount={unscopedPolicyCount}
                    isEditMode={isEditMode}
                    isCreating={isCreatingDomain}
                    isPendingNewDomain={isPendingNewDomain}
                  />
                )}
                <WellnessConfiguration
                  isEditMode={isEditMode}
                  companyId={resolveCompanyId()}
                  config={wellnessConfig}
                  onChange={setWellnessConfig}
                />
              </Box>
            ),
          },
        ]
      : []),
    {
      tabKey: TAB_KEYS.POLICY,
      label: TAB_LABELS.POLICY,
      content: isEditMode ? (
        <PolicyConfiguration
          isEditMode={isEditMode}
          policySettings={policySettings}
          onPolicySettingsChange={(settings) => setPolicySettings(new Map(settings))}
        />
      ) : (
        <PolicyConfigurationView policySettings={policySettings} />
      ),
    },
    {
      tabKey: TAB_KEYS.POLICY_FEATURE_DOCUMENT,
      label: TAB_LABELS.POLICY_FEATURE_DOCUMENT,
      content: (
        <CompanyPolicyFeatureDocumentTab
          companyId={resolveCompanyId()}
          isEditMode={isEditMode}
        />
      ),
    },
    {
      tabKey: TAB_KEYS.ADDITIONAL_DOCUMENTS,
      label: TAB_LABELS.ADDITIONAL_DOCUMENTS,
      content: (
        <CompanyAdditionalDocumentsTab
          companyId={resolveCompanyId()}
          isEditMode={isEditMode}
        />
      ),
    },
    ...(environment.featureFlag.FF_IWORK_OFFERS_BENEFITS
      ? [
          {
            tabKey: TAB_KEYS.OFFERS_BENEFITS,
            label: TAB_LABELS.OFFERS_BENEFITS,
            content: (
              <OffersAndBenefitsTab
                companyId={resolveCompanyId()}
                isEditMode={isEditMode}
                items={offersAndBenefits}
                onItemsChange={(next) => {
                  isDirtyRef.current = true;
                  setOffersAndBenefits(next);
                }}
                sectionEnabled={offersAndBenefitsEnabled}
                onSectionEnabledChange={(next) => {
                  isDirtyRef.current = true;
                  setOffersAndBenefitsEnabled(next);
                }}
              />
            ),
          },
        ]
      : []),
    // "Customise Email Templates" used to be a tab here — relocated to a
    // "Customise" drill-down on the standalone Template Management module
    // instead (reachable from a template's own row), so it works from the
    // template's perspective ("who has customized this?") rather than only
    // from one company's page at a time. See
    // docs/IBP-Email-Notification-Company-Templates/.
  ];

  const isUnderReview = portalStatus === STATUS_LABELS.PENDING;
  const isRejected = portalStatus === STATUS_LABELS.REJECTED;
  const isActive = portalStatus === STATUS_LABELS.ACTIVE;

  const renderHeaderActions = () => {
    const buttons: React.ReactNode[] = [];

    buttons.push(
      <Button
        key="back"
        variantType="secondary"
        startIcon={<ArrowBackIcon />}
        onClick={isEditMode ? handleCancelEdit : handleBack}
        sizeType="small"
      >
        {BUTTON_LABELS.BACK}
      </Button>
    );

    if (!canReadPortalConfig) {
      return buttons;
    }

    if (isEditMode && !canEditPortalConfig) {
      return buttons;
    }

    if (isEditMode && canEditPortalConfig) {
      buttons.push(
        <Button
          key="save"
          variantType="secondary"
          sizeType="small"
          onClick={handleSaveDraft}
          disabled={isSaving || isSubmitting || isApproving}
        >
          {BUTTON_LABELS.SAVE}
        </Button>
      );
      return buttons;
    }

    if (isUnderReview) {
      if (canApprovePortalConfig) {
        buttons.push(
          <Button
            key="reject"
            variantType="secondary"
            onClick={() => {
              setShowRejectionError(false);
              setIsRejectDialogOpen(true);
            }}
            sizeType="small"
          >
            {BUTTON_LABELS.REJECT}
          </Button>
        );
        buttons.push(
          <Button
            key="approve"
            variantType="primary"
            onClick={() => setIsApproveDialogOpen(true)}
            disabled={isSaving || isSubmitting || isApproving}
            sizeType="small"
          >
            {BUTTON_LABELS.APPROVE}
          </Button>
        );
      }
      return buttons;
    }

    if (isRejected) {
      buttons.push(
        <Button
          key="comments"
          variantType="secondary"
          onClick={() => setIsCommentsDialogOpen(true)}
          sizeType="small"
        >
          {BUTTON_LABELS.COMMENTS}
        </Button>
      );

      if (canEditPortalConfig && !isActive) {
        buttons.push(
          <Button
            key="edit"
            variantType="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sizeType="small"
          >
            {BUTTON_LABELS.EDIT}
          </Button>
        );
        if (canSubmitAfterSave) {
          buttons.push(
            <Button
              key="submit-rejected"
              variantType="secondary"
              startIcon={<SendIcon />}
              onClick={() => setIsSubmitDialogOpen(true)}
              disabled={isSaving || isSubmitting || isApproving}
              sizeType="small"
            >
              {BUTTON_LABELS.SUBMIT_FOR_APPROVAL}
            </Button>
          );
        }
      }

      return buttons;
    }

    if (canEditPortalConfig && !isActive) {
      buttons.push(
        <Button
          key="edit"
          variantType="primary"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          sizeType="small"
        >
          {BUTTON_LABELS.EDIT}
        </Button>
      );

      if (canApprovePortalConfig && canSubmitAfterSave) {
        buttons.push(
          <Button
            key="submit-default"
            variantType="secondary"
            startIcon={<SendIcon />}
            onClick={() => setIsSubmitDialogOpen(true)}
            disabled={isSaving || isSubmitting || isApproving}
            sizeType="small"
          >
            {BUTTON_LABELS.SUBMIT_FOR_APPROVAL}
          </Button>
        );
      }
    }

    return buttons;
  };

  // Dynamic breadcrumb configuration based on navigation source
  const getPortalConfigBreadcrumbs = (
    companyName: string,
    companyId: string,
    from?: string,
    filters?: any,
    fromPath?: string
  ) => {
    const baseCompanyPath = `/companies/${companyId}`;
    const baseCompanyState = filters ? { filters } : undefined;
    const companyPath = fromPath || baseCompanyPath;

    if (from === "companies") {
      return [
        {
          label: BREADCRUMB_LABELS.MY_COMPANIES,
          path: "/companies",
          state: baseCompanyState
        },
        {
          label: companyName,
          path: baseCompanyPath,
          state: baseCompanyState
        },
        { label: BREADCRUMB_LABELS.CONFIGURE_IBP_PORTAL },
      ];
    }

    // Default breadcrumb structure
    return [
      {
        label: BREADCRUMB_LABELS.MY_COMPANIES,
        path: "/companies",
        state: baseCompanyState
      },
      {
        label: companyName,
        path: baseCompanyPath
      },
      { label: BREADCRUMB_LABELS.CONFIGURE_IBP_PORTAL },
    ];
  };

  // Extract navigation context from location state
  const from = location.state?.from;
  const filters = location.state?.filters;
  const fromPath = location.state?.fromPath;

  const breadcrumbs = getPortalConfigBreadcrumbs(
    companyName || companyDetailsData?.companyName || companyDetailsData?.company?.companyName || "",
    id || "",
    from,
    filters,
    fromPath
  );

  return (
    <ConfigurationContainer>
      <MainContent>
        {/* Breadcrumb */}
        <BreadcrumbSection>
          <CommonBreadcrumb crumbs={breadcrumbs} />
        </BreadcrumbSection>

        {/* Header */}
        <HeaderSection>
          <HeaderContent>
            <HeaderLeft>
              <ConfigureHeader>
                <Box display="flex" alignItems="center" gap={5}>
                  <CompanyName>{PAGE_TITLES.CONFIGURE_IBP_PORTAL}</CompanyName>
                  {hasStatus && (
                    <StatusContainer>
                      <ChipRenderer
                        value={portalStatusLabel}
                        styleMap={portalStatusStyleMap}
                        variant="variable"
                        size="small"
                      />
                    </StatusContainer>
                  )}
                </Box>
                <CompanyInfo>
                  <Typography variant="caption">
                    {DEFAULT_VALUES.LAST_UPDATED}
                  </Typography>
                </CompanyInfo>
              </ConfigureHeader>
            </HeaderLeft>

            <HeaderActions>
              {renderHeaderActions()}
            </HeaderActions>
          </HeaderContent>
        </HeaderSection>

        {/* Content with Tabs */}
        <ContentArea>
          <CustomTabs
            tabs={tabs}
            initialTabKey={TAB_KEYS.COMPANY}
            activeTabKey={activeTab}
            onTabChange={setActiveTab}
          />
        </ContentArea>
      </MainContent>

      <Dialog
        open={isCommentsDialogOpen}
        onClose={() => setIsCommentsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{BUTTON_LABELS.COMMENTS}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {rejectionComment || "No comments available."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variantType="secondary" onClick={() => setIsCommentsDialogOpen(false)}>
            {BUTTON_LABELS.BACK}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isRejectDialogOpen}
        onClose={() => {
          setIsRejectDialogOpen(false);
          setShowRejectionError(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{BUTTON_LABELS.REJECT} *</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={rejectionComment}
            onChange={(e) => {
              setRejectionComment(e.target.value);
              setShowRejectionError(false);
            }}
            onPaste={(e) => {
              if (!isCopyPasteAllowedForOrg()) {
                e.preventDefault();
              }
            }}
            placeholder="Add rejection comments"
            required
            error={showRejectionError && rejectionComment.trim() === ""}
            helperText={
              showRejectionError && rejectionComment.trim() === ""
                ? "Rejection comment is required"
                : ""
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            variantType="secondary"
            onClick={() => {
              setIsRejectDialogOpen(false);
              setShowRejectionError(false);
            }}
          >
            {BUTTON_LABELS.CANCEL}
          </Button>
          <Button variantType="primary" onClick={handleReject} disabled={isSaving}>
            {BUTTON_LABELS.REJECT}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isApproveDialogOpen}
        onClose={() => setIsApproveDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{BUTTON_LABELS.APPROVE}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Once you approve this portal configuration, it will be finalized and no further
            changes can be made. Do you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variantType="secondary"
            onClick={() => setIsApproveDialogOpen(false)}
          >
            {BUTTON_LABELS.CANCEL}
          </Button>
          <Button
            variantType="primary"
            onClick={handleConfirmApprove}
            disabled={isSaving || isSubmitting || isApproving}
          >
            {BUTTON_LABELS.CONFIRM}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{BUTTON_LABELS.SUBMIT_FOR_APPROVAL}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Once you submit these configurations for approval, you will not be able to edit them until the review process is complete. Please ensure all settings are correct before proceeding.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variantType="secondary"
            onClick={() => setIsSubmitDialogOpen(false)}
          >
            {BUTTON_LABELS.CANCEL}
          </Button>
          <Button
            variantType="primary"
            onClick={handleConfirmSubmit}
            disabled={isSaving || isSubmitting || isApproving}
          >
            {BUTTON_LABELS.CONFIRM}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unsaved changes confirm dialog */}
      <Dialog open={confirmDialog.open} onClose={handleConfirmCancel} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Typography sx={{ fontSize: 18 }}>⚠️</Typography>
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{confirmDialog.title}</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 0.5, pb: 2 }}>
          <Typography sx={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variantType="secondary" sizeType="small" onClick={handleConfirmCancel}>Cancel</Button>
          <Button variantType="primary" sizeType="small" onClick={handleConfirmOk}>Continue</Button>
        </DialogActions>
      </Dialog>
    </ConfigurationContainer>
  );
};
