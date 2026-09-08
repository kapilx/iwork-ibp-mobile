import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  endPoints,
  environment,
  formatDate,
  Table,
  useApiQuery,
  useLocalization,
  formatAmountWithCurrency,
  getTaxLabel,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { useNavigate } from "react-router-dom";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Collapse,
  Tooltip,
  Typography,
} from "@mui/material";
import { CellClickedEvent, ColDef } from "ag-grid-community";
import { useDispatch, useSelector } from "react-redux";
import { usePoliciesFlags } from "../../hooks/usePoliciesFlags";
import { useCompanyConfig } from "../../hooks/useCompanyConfig";
import BenefitCard from "../BenifitsCard";
import PolicySummaryCard from "../PolicySummaryCard";
import compulsoryBenefitIcon from "../../assets/svgs/compulsory-benifits-icon.svg";
import activeShieldIcon from "../../assets/svgs/active-policies.svg";
import enrolledShieldIcon from "../../assets/svgs/newly-enrolled-policies.svg";
import claimsSummaryIcon from "../../../assets/svgs/claims-summary.svg";
import documentIcon from "../../../assets/svgs/document-icon.svg";
import hospitalNetworkIcon from "../../../assets/svgs/hospital-network-icon.svg";
import policyFeatureIcon from "../../../assets/svgs/policy-feature-icon.svg";
import eCard from "../../../assets/svgs/e-cards.svg";
import liveChatIcon from "../../../assets/svgs/live-chat-icon.svg";
import tpaLogin from "../../../assets/svgs/tpa-logic-icon.svg";
import {
  BenefitsSectionContainer,
  StyledAccordion,
  StyledAccordionSummary,
  StyledAccordionDetails,
  ShieldIconWrapper,
  AccordionHeaderContent,
  SectionTitle,
  SectionSubtitle,
  BenefitsGrid,
  ExpandIcon,
  PolicyPeriodBadge,
  PolicyPeriodText,
  PeriodPoliciesContainer,
  QuickAccessSection,
  QuickAccessCard,
  QuickAccessIcon,
  QuickAccessTitle,
  ClaimSummaryCard,
  ClaimSummaryHeader,
  ClaimSummaryIconWrapper,
  ClaimSummaryTitle,
  ClaimSummaryTableWrapper,
  TooltipContainer,
  TooltipHeader,
  TooltipPolicyItem,
  TooltipPolicyName,
  TooltipPolicyDate,
  AccordionTitleRow,
  ContributionWrapper,
  ContributionText,
  ContributionAmount,
  PolicySummaryExpandIcon,
  AccordionHeaderContentBenifitsSection,
} from "./styles";
import { capitalizeFirst, getPolicyFeatures } from "../../utils";
import { AppDispatch, RootState } from "../../redux/store";
import { fetchPolicyTemplate } from "../../redux/policyTemplateSlice";
import { setToastMessage } from "../../redux/slice";
import lifeEventIcon from "../../assets/svgs/life-events.svg";
import optionalBenefitIcon from "../../assets/svgs/optional-benefits-icon.svg";
import {
  flattenPoliciesWithStatus,
  getUnifiedEnrollmentViewState,
  PolicyStatus,
} from "../../utils/flattenPolicies";
import CommonLoader from "../../common/CommonLoader";
import flexBenefitIcon from "../../assets/svgs/flex-benifits.svg";
import WellnessBanner from "../Dashboard/WellnessBanner";

type PolicyTypeFeatures = {
  policyTypeKey: string;
  features: string[];
};

type DashboardBenefitsSectionProps = {
  title?: string;
  subtitle?: string;
  features?: Array<{ text: string }>;
  buttonText?: string;
  overAllEnrollmentStatus?: string;
  onOpenPolicyFeatures?: (policy: any) => void;
  onAccordionControlReady?: (expandFirstAccordion: () => void) => void;
  addOnlyDependents?: boolean;
};

// A flattened period item belongs in the Optional bucket when its component type
// is `optional`, or when the configurator flagged an otherwise-compulsory
// component as `isOptional`. Compared against `true` so components saved before
// the flag existed stay compulsory.
const isOptionalItem = (item: any) =>
  item?.componentType === "optional" || item?.isOptional === true;

const DashboardBenefitsSection = ({
  title = "Compulsory Benefits",
  subtitle = "Automatically provided to all employees",
  features = [],
  buttonText,
  overAllEnrollmentStatus,
  onOpenPolicyFeatures,
  onAccordionControlReady,
  addOnlyDependents = false,
}: DashboardBenefitsSectionProps) => {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const [expandedPanelIds, setExpandedPanelIds] = useState<Set<string>>(new Set());
  const [nestedAccordionState, setNestedAccordionState] = useState<
    Record<string, Set<"compulsory" | "optional" | "flex">>
  >({});
  const lastAccordionGroupKeyRef = useRef<string>("");
  const previousExpandedItemCountRef = useRef<number | null>(null);
  const lastExpandedAccordionRef = useRef<string | null>(null);
  const lastExpandedNestedAccordionRef = useRef<string | null>(null);
  const previousExpandedPanelsSizeRef = useRef<number>(0);
  const previousNestedExpandedCountRef = useRef<number>(0);
  const isInitialMountRef = useRef<boolean>(true);
  const accordionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const nestedAccordionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dispatch = useDispatch<AppDispatch>();
  const { data: policyTemplate, byPolicyId: policyTemplatesById } = useSelector(
    (state: RootState) => state.policyTemplate,
  );
  // Get employee ID and gender from session storage
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails.id || "";
  const employeeGender = userDetails.gender || "";
  const employeeAdditionalDetails =
    (userDetails?.additionalDetails as Record<string, unknown> | undefined) ??
    undefined;

  const toOptionalNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : undefined;
    }
    return undefined;
  };

  const getMultipleFactorValue = (label?: string): number | undefined => {
    if (!label) return undefined;
    // Most common case: label is "CTC" and additionalDetails has { CTC: 1500000 }
    const direct = toOptionalNumber(employeeAdditionalDetails?.[label]);
    if (direct != null) return direct;
    // Fallbacks for inconsistent key casing
    const upper = toOptionalNumber(employeeAdditionalDetails?.[label.toUpperCase()]);
    if (upper != null) return upper;
    const lower = toOptionalNumber(employeeAdditionalDetails?.[label.toLowerCase()]);
    if (lower != null) return lower;
    return undefined;
  };

  const isGmcPolicy = (policy: any): boolean => {
    const raw = String(policy?.policyTypeKey ?? policy?.policyName ?? "")
      .trim()
      .toUpperCase();

    return (
      raw === "GMC" ||
      raw.endsWith("_GMC") ||
      raw.includes("MEDICLAIM") ||
      raw.includes("HEALTH")
    );
  };

  // Navigation handlers
  const handleEnrollNow = (policy: any) => {
    if (onOpenPolicyFeatures) {
      onOpenPolicyFeatures(policy);
      return;
    }
    navigate("/unified-enrollment", {
      state: {
        ...getPolicyRouteState(policy),
        source: "dashboard",
      },
    });
  };

  const handleViewSummary = (policy: any) => {
    navigate("/unified-enrollment", {
      state: {
        ...getPolicyRouteState(policy),
        source: "dashboard",
      },
    });
  };

  const handleEnrollFromActive = (policy: any) => {
    if (onOpenPolicyFeatures) {
      onOpenPolicyFeatures(policy);
      return;
    }
    navigate("/unified-enrollment", {
      state: {
        ...getPolicyRouteState(policy),
        source: "dashboard",
      },
    });
  };

  const handleEnrollAll = () => {
    navigate("/unified-enrollment", {
      state: {
        ...unifiedEnrollmentViewState,
        source: "dashboard",
      },
    });
  };

  const handleViewUnifiedSummary = () => {
    navigate("/unified-enrollment", {
      state: {
        ...unifiedEnrollmentViewState,
        source: "dashboard",
      },
    });
  };

  // Fetch employee policies
  const { refetch: fetchTpaPortalSso, isFetching: isSsoFetching } = useApiQuery({
    queryKey: ["tpaPortalSsoDashboard", employeeId],
    url: employeeId ? endPoints.employeeTpaPortalSso(employeeId) : "",
    enabled: false,
    config: { retry: 0 },
  });

  const [tpaFeatureLoading, setTpaFeatureLoading] = useState<string | null>(null); // feature id being loaded
  const [tpaDisplayData, setTpaDisplayData] = useState<{ label: string; data: Record<string, string> } | null>(null);

  // Generic handler for any TPA feature with an appRefId configured.
  // Checks our standard response mapping keys first (REDIRECT_URL, DOWNLOAD_URL, BASE64_PDF),
  // then falls back to legacy TPA-specific keys for TPAs not yet on response mappings.
  const handleGenericTpaFeatureClick = async (feature: { id: string; label: string; buttonLabel: string; appKey: string | null; flowType: string | null }) => {
    if (!feature.appKey) return;
    setTpaFeatureLoading(feature.id);
    try {
      console.log("[TpaFeature] click", { featureId: feature.id, appKey: feature.appKey, flowType: feature.flowType });
      const res = await apiRequest(endPoints.eCardExternalUrl, {
        method: "POST",
        data: { appKey: feature.appKey, dynamicFields: {} },
      });
      const result = (res?.data as any)?.data ?? res?.data ?? {};
      const flowType = feature.flowType ?? "REDIRECT";
      console.log("[TpaFeature] response", { flowType, responseKeys: Object.keys(result) });

      // Standard keys (set via iWork response mapping config)
      const redirectUrl = result.REDIRECT_URL ?? result.DOWNLOAD_URL
        // Legacy TPA-specific fallbacks (for TPAs without response mappings configured)
        ?? result.url ?? result.downloadUrl ?? result.ecardUrl ?? result.EcardUrl
        ?? result.redirectUrl ?? null;

      if (flowType === "REDIRECT" && redirectUrl) {
        console.log("[TpaFeature] opening redirect URL");
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
        return;
      }

      // Base64 PDF — standard key or legacy keys
      const base64 = result.BASE64_PDF
        ?? result.Ecard_Base64String ?? result.base64 ?? result.Base64
        ?? result.pdfBase64 ?? result.data ?? null;

      if (flowType === "REDIRECT" && typeof base64 === "string" && base64) {
        console.log("[TpaFeature] opening base64 PDF");
        const blob = await fetch(`data:application/pdf;base64,${base64.trim()}`).then((r) => r.blob());
        window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        return;
      }

      if (flowType === "DISPLAY" && Object.keys(result).length > 0) {
        setTpaDisplayData({ label: feature.label, data: result });
        return;
      }

      console.warn("[TpaFeature] no usable key in response:", result);
      dispatch(setToastMessage({ message: `${feature.buttonLabel} is not available right now.`, type: "error" }));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Something went wrong.";
      console.error("[TpaFeature] error:", msg);
      dispatch(setToastMessage({ message: msg, type: "error" }));
    } finally {
      setTpaFeatureLoading(null);
    }
  };

  const handleTpaPortalClick = async () => {
    const result = await fetchTpaPortalSso();
    const data = (result?.data as any)?.data ?? (result?.data as any) ?? {};
    console.log("[TpaPortal] SSO response keys:", Object.keys(data));
    // Check standard key first, then legacy TPA-specific key
    const redirectUrl = data?.REDIRECT_URL ?? data?.redirectUrl ?? data?.url ?? data?.ecardUrl ?? null;
    if (redirectUrl) {
      console.log("[TpaPortal] opening portal URL");
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
    } else {
      const err = result?.error as any;
      const msg = err?.response?.data?.message ?? err?.message ?? "TPA portal is not available.";
      console.warn("[TpaPortal] no redirect URL found:", data);
      dispatch(setToastMessage({ message: msg, type: "error" }));
    }
  };

  // Fetch dynamic TPA feature buttons configured by admin in iWork
  const { data: tpaFeaturesData } = useApiQuery({
    queryKey: ["employeeTpaFeatures", employeeId],
    url: employeeId ? endPoints.employeeTpaFeatures(Number(employeeId)) : "",
    enabled: Boolean(employeeId),
    config: { retry: 0 },
  });

  const dynamicTpaFeatures: Array<{ id: string; label: string; buttonLabel: string; featureKey: string; appRefId: number | null; appKey: string | null; flowType: string | null }> = useMemo(() => {
    const features = (tpaFeaturesData as any)?.data ?? [];
    return features
      .filter((f: any) => f.isActive)
      .map((f: any) => ({
        id: `tpa-feature-${f.id}`,
        label: f.label,
        buttonLabel: f.buttonLabel,
        featureKey: f.featureType?.key ?? "",
        appRefId: f.appRefId ?? null,
        appKey: f.appRef?.label ?? null,
        flowType: f.appRef?.flowType ?? null,
      }));
  }, [tpaFeaturesData]);

  const { data: policiesData, isLoading } = useApiQuery({
    queryKey: ["employeePolicies", employeeId],
    url: endPoints.employeePolicies(employeeId),
    enabled: Boolean(employeeId),
  });

  const { data: relationsData } = useApiQuery({
    queryKey: ["employeePolicyRelations", employeeId],
    url: endPoints.getRelationDetails(employeeId),
    enabled: Boolean(employeeId),
  });

  const policyIds = useMemo(() => {
    const employeePolicies = policiesData?.data?.employeePolicies ?? [];
    const enrolledPolicies = policiesData?.data?.enrolledPolicies ?? [];
    const allPolicies = [...employeePolicies, ...enrolledPolicies];
    const uniqueIds = Array.from(
      new Set(
        allPolicies
          .map((policy: any) => policy?.policyId)
          .filter((policyId: any) => policyId != null),
      ),
    );
    return uniqueIds;
  }, [policiesData]);

  useEffect(() => {
    if (policyIds.length > 0) {
      dispatch(fetchPolicyTemplate(policyIds));
    }
  }, [dispatch, policyIds]);

  const { data: claimsOverviewData, isLoading: isClaimsLoading } = useApiQuery({
    queryKey: ["claimsOverviewDashboard", employeeId],
    url: endPoints.employeeClaimsOverview(employeeId),
    enabled: Boolean(employeeId),
  });

  const claimedAmountByPolicyId = useMemo(() => {
    const payload = claimsOverviewData?.data?.data ?? claimsOverviewData?.data;
    const policies: any[] = payload?.policies ?? [];
    const map = new Map<number, number>();
    policies.forEach((p: any) => {
      const policyId = Number(p?.policyId);
      const claims: any[] = p?.basePolicy?.claims ?? [];
      const claimed = claims
        .filter((c: any) => c?.status?.toLowerCase() === "settled")
        .reduce((sum: number, c: any) => sum + Number(c?.claimSettledAmount ?? 0), 0);
      if (Number.isFinite(policyId) && policyId > 0) {
        map.set(policyId, claimed);
      }
    });
    return map;
  }, [claimsOverviewData]);

  const claimIntimatedAmountByPolicyId = useMemo(() => {
    const payload = claimsOverviewData?.data?.data ?? claimsOverviewData?.data;
    const policies: any[] = payload?.policies ?? [];
    const map = new Map<number, number>();
    policies.forEach((p: any) => {
      const policyId = Number(p?.policyId);
      const claims: any[] = p?.basePolicy?.claims ?? [];
      const intimated = claims
        .reduce((sum: number, c: any) => sum + Number(c?.claimAmount ?? 0), 0);
      if (Number.isFinite(policyId) && policyId > 0) {
        map.set(policyId, intimated);
      }
    });
    return map;
  }, [claimsOverviewData]);

  const relationsByPolicyId = useMemo(() => {
    const relationsList = relationsData?.data || [];
    return relationsList.reduce((acc: Record<string, any>, item: any) => {
      acc[String(item.policyId)] = item;
      return acc;
    }, {});
  }, [relationsData]);

  const flattenedPolicies = useMemo(
    () =>
      flattenPoliciesWithStatus(
        policiesData?.data ?? { employeePolicies: [], enrolledPolicies: [] },
      ),
    [policiesData],
  );

  const unifiedEnrollmentViewState = useMemo(
    () => getUnifiedEnrollmentViewState(flattenedPolicies),
    [flattenedPolicies],
  );

  const flattenedPoliciesById = useMemo(
    () =>
      new Map(
        flattenedPolicies.map((policy) => [Number(policy.policyId), policy]),
      ),
    [flattenedPolicies],
  );

  const getPolicyRouteState = useCallback(
    (policy: any) => {
      const policyStatus = flattenedPoliciesById.get(Number(policy?.policyId))
        ?.status;
      const shouldOpenSummary = policyStatus === PolicyStatus.LOCKED;

      return {
        policyInfo: policy,
        openSummary: shouldOpenSummary,
        isViewOnly: shouldOpenSummary,
      };
    },
    [flattenedPoliciesById],
  );

  const isPolicyInNotifyState = useCallback(
    (policy: any) =>
      flattenedPoliciesById.get(Number(policy?.policyId))?.status ===
      PolicyStatus.NOTIFY,
    [flattenedPoliciesById],
  );

  const getPolicyCtaLabel = useCallback(
    (policy: any) => {
      const policyStatus = flattenedPoliciesById.get(Number(policy?.policyId))
        ?.status;

      return policyStatus === PolicyStatus.LOCKED
        ? "View Summary"
        : buttonText || "Continue Enrolment";
    },
    [buttonText, flattenedPoliciesById],
  );

  const viewablePolicyIds = useMemo(
    () =>
      new Set(
        flattenedPolicies
          .filter(
            (policy) =>
              policy.status === PolicyStatus.EDIT_ENROLL ||
              policy.status === PolicyStatus.LOCKED,
          )
          .map((policy) => Number(policy.policyId)),
      ),
    [flattenedPolicies],
  );

  const hasViewablePolicies = viewablePolicyIds.size > 0;

  const getDefaultSumInsuredTotal = useCallback((policyRelations: any) => {
    const availableChoices =
      policyRelations?.configuration?.policyComponentsConfiguration
        ?.availablePolicyChoices;
    const components =
      policyRelations?.configuration?.policyComponentsConfiguration
        ?.components || [];

    if (!availableChoices || !components.length) return 0;

    let total = 0;

    // Helper function to get sum insured value by component id and sum insured id
    const getSumInsuredByComponentAndId = (
      componentId: number,
      sumInsuredId: number,
    ) => {
      const component = components.find((comp: any) => comp.id === componentId);
      if (!component || !component.sumInsuredOptions) return 0;

      const option = component.sumInsuredOptions.find(
        (opt: any) => opt.id === sumInsuredId,
      );
      return option ? Number(option.value) || 0 : 0;
    };

    // Process base policy choices
    if (availableChoices.basePolicyChoices?.mainPolicyChoices?.choices) {
      const defaultChoice =
        availableChoices.basePolicyChoices.mainPolicyChoices.choices.find(
          (choice: any) => choice.isDefault && choice.isAvailable,
        );
      if (defaultChoice) {
        const policyId =
          availableChoices.basePolicyChoices.mainPolicyChoices.policyId;
        total += getSumInsuredByComponentAndId(
          policyId,
          defaultChoice.sumInsuredId,
        );
      }
    }

    return total;
  }, []);

  const getSumInsuredValue = useCallback(
    (policyRelations: any) => {
      // First try employeeChosenChoices
      if (policyRelations?.configuration?.employeeChosenChoices?.length) {
        const total =
          policyRelations.configuration.employeeChosenChoices.reduce(
            (sum: number, choice: any) => {
              const amount = Number(choice.sumInsured);
              return Number.isFinite(amount) ? sum + amount : sum;
            },
            0,
          );
        return total > 0
          ? `${formatAmountWithCurrency(total, localizationData?.data)}`
          : null;
      }

      // Fallback to default choices
      const defaultTotal = getDefaultSumInsuredTotal(policyRelations);
      return defaultTotal > 0
        ? `${formatAmountWithCurrency(defaultTotal, localizationData?.data)}`
        : null;
    },
    [getDefaultSumInsuredTotal, localizationData],
  );

  const getTotalSumInsuredNumeric = useCallback(
    (policyRelations: any) => {
      // First try employeeChosenChoices
      if (policyRelations?.configuration?.employeeChosenChoices?.length) {
        const total =
          policyRelations.configuration.employeeChosenChoices.reduce(
            (sum: number, choice: any) => {
              const amount = Number(choice.sumInsured);
              return Number.isFinite(amount) ? sum + amount : sum;
            },
            0,
          );
        return total > 0 ? total : null;
      }

      // Fallback to default choices
      const defaultTotal = getDefaultSumInsuredTotal(policyRelations);
      return defaultTotal > 0 ? defaultTotal : null;
    },
    [getDefaultSumInsuredTotal],
  );
  const getMembersCoveredForBenefits = useCallback(
    (eligibleRelations: string[]) => {
      if (!Array.isArray(eligibleRelations) || !eligibleRelations.length) {
        return null;
      }

      const relationCounts: Record<string, number> = {};

      eligibleRelations.forEach((relation: string) => {
        const normalized = String(relation || "")
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();

        if (!normalized) return;

        if (normalized === "self") {
          relationCounts.self = 1;
          return;
        }

        if (
          normalized === "spouse" ||
          normalized === "wife" ||
          normalized === "husband"
        ) {
          relationCounts.spouse = 1;
          return;
        }

        if (normalized === "father" || normalized === "mother") {
          relationCounts.parents = (relationCounts.parents || 0) + 1;
          return;
        }

        if (
          normalized === "child" ||
          normalized === "son" ||
          normalized === "daughter"
        ) {
          relationCounts.child = (relationCounts.child || 0) + 1;
          return;
        }

        relationCounts[normalized] = (relationCounts[normalized] || 0) + 1;
      });

      const orderedKeys = [
        "self",
        "spouse",
        "parents",
        "child",
        ...Object.keys(relationCounts).filter(
          (key) => !["self", "spouse", "parents", "child"].includes(key)
        ),
      ].filter((key, index, values) => values.indexOf(key) === index);

      const parts = orderedKeys
        .filter((key) => relationCounts[key] > 0)
        .map((key) => {
          const count = relationCounts[key];

          if (key === "self") return "Self";
          if (key === "spouse") return "Spouse";
          if (key === "parents")
            return count > 1 ? `${count} Parents` : "Parent";
          if (key === "child") return count > 1 ? `${count} Children` : "Child";

          return count > 1 ? `${count} ${capitalizeFirst(key)}` : capitalizeFirst(key);
        });

      return parts.length ? parts.join(" + ") : null;
    },
    []
  );

  const buildComponentPeriods = useCallback(
    (
      policies: Array<any>,
      filterType: "compulsory" | "optional" | "flex" | "all",
      options?: { onlyShowEnrolledChoices?: boolean }
    ) => {
      if (!policies.length) {
        return [];
      }

      const shouldOnlyShowEnrolledChoices =
        options?.onlyShowEnrolledChoices === true;
      const componentItems: any[] = [];

      policies.forEach((policy: any) => {
        const policyRelations = relationsByPolicyId[String(policy.policyId)];
        const policyTemplateData = policyRelations?.configuration?.policyTemplate;

        // Combined sequence map: keyed by `${optionId}|${parentMainPolicyId}` → sequence
        // Sequences are globally unique across base and parental (e.g. 1-6)
        const combinedSeqMap = new Map<string, number>();
        const baseMainId = policyTemplateData?.basePolicy?.mainPolicyId;
        const parentalMainId = policyTemplateData?.parentalPolicy?.mainPolicyId;
        (policyTemplateData?.basePolicy?.addonIds ?? []).forEach(
          (addon: any) => {
            combinedSeqMap.set(`${addon.optionId}|${baseMainId}`, addon.sequence);
          }
        );
        (policyTemplateData?.parentalPolicy?.addonIds ?? []).forEach(
          (addon: any) => {
            combinedSeqMap.set(
              `${addon.optionId}|${parentalMainId}`,
              addon.sequence
            );
          }
        );

        const rawComponents =
          policyRelations?.configuration?.policyComponentsConfiguration
            ?.components || [];
        const components = rawComponents;
        const policyItems: any[] = [];
        const employeeChosenChoices =
          policyRelations?.configuration?.employeeChosenChoices ?? [];

        const getChoiceSelectionKey = (choice: any) =>
          `${String(
            choice?.parentpolicyComponentActionTypeId ?? "null"
          )}|${String(choice?.policyComponentActionTypeId ?? "")}`;

        const isChoiceEnrolled = (choice: any) => {
          if (typeof choice?.isEnrolled === "boolean") {
            return choice.isEnrolled;
          }

          const normalizedStatus = String(
            choice?.choiceEnrollmentStatus ??
              choice?.choiceStatus ??
              choice?.choiceStatusKey ??
              choice?.employeeEnrollmentStatusKey ??
              choice?.status ??
              ""
          ).toUpperCase();

          if (!normalizedStatus) {
            return true;
          }

          return (
            normalizedStatus.includes("ENROLLED") ||
            normalizedStatus.includes("SUBMITTED")
          );
        };

        const enrolledChoiceKeySet = new Set(
          (Array.isArray(employeeChosenChoices) ? employeeChosenChoices : [])
            .filter(isChoiceEnrolled)
            .map((choice: any) => getChoiceSelectionKey(choice))
        );

        const getMatchedEmployeeChoice = (
          componentId: number,
          parentPolicyComponentActionTypeId?: number
        ) =>
          (Array.isArray(employeeChosenChoices)
            ? employeeChosenChoices
            : []
          ).find(
            (choice: any) =>
              String(choice?.policyComponentActionTypeId ?? "") ===
                String(componentId) &&
              String(choice?.parentpolicyComponentActionTypeId ?? "null") ===
                String(parentPolicyComponentActionTypeId ?? "null")
          );

        components.forEach((component: any) => {
          const isOptional =
            component.type === "optional" || component.isOptional === true;
          const isFlex = component.type === "flex";

          // Filter based on type ("all" passes every component through)
          if (filterType === "optional" && !isOptional) return;
          if (filterType === "flex" && !isFlex) return;
          if (filterType === "compulsory" && (isOptional || isFlex)) return;

          const availablePolicyChoices =
            policyRelations?.configuration?.policyComponentsConfiguration
              ?.availablePolicyChoices;

          const baseFeatures =
            features && features.length > 0
              ? features.map((f) => f.text)
              : getPolicyFeatures(policy.policyTypeKey);
          const templateForPolicy =
            policyTemplatesById[String(policy.policyId)] ?? policyTemplate;
          const isBenefitComponent = component.isBenefitComponent === true;
          const sectionKey = (isFlex || isBenefitComponent)
            ? 'flex'
            : isOptional
              ? 'optional'
              : 'compulsory';
          const sectionList = templateForPolicy?.config?.[sectionKey as 'compulsory' | 'optional' | 'flex'];
          const componentConfig = Array.isArray(sectionList)
            ? sectionList.find((c: any) => String(c.componentId) === String(component.id))
            : null;
          const infoPoints = Array.isArray(componentConfig?.infoPoints)
            ? componentConfig.infoPoints
            : [];
          const policyInfoPoints =
            templateForPolicy?.policyId &&
            String(templateForPolicy.policyId) === String(policy.policyId)
              ? infoPoints
              : [];
          const infoPointTexts =
            policyInfoPoints.length > 0
              ? policyInfoPoints
                  .map((point: any) => {
                    const text =
                      point?.text ??
                      point?.label ??
                      point?.title ??
                      point?.description ??
                      point?.value;
                    if (typeof text === "string" && text.trim()) {
                      return text.trim();
                    }
                    if (point?.label && point?.value) {
                      return `${point.label}: ${point.value}`;
                    }
                    return "";
                  })
                  .filter(Boolean)
              : [];

          // Helper function to get sum insured value from availablePolicyChoices
          const getSumInsuredFromChoices = (
            componentId: number,
            componentType: string,
            isParentalAddon: boolean = false,
          ) => {
            if (!availablePolicyChoices || !component.sumInsuredOptions)
              return null;

            let choiceConfig = null;

            // Find the appropriate choice based on component type
            if (componentType === "base") {
              choiceConfig =
                availablePolicyChoices.basePolicyChoices?.mainPolicyChoices;
            } else if (componentType === "parental") {
              choiceConfig =
                availablePolicyChoices.parentalPolicyChoices?.mainPolicyChoices;
            } else if (componentType === "optional") {
              // For optional, check both base and parental addon choices
              const basePolicySection =
                availablePolicyChoices.basePolicyChoices;
              const parentalPolicySection =
                availablePolicyChoices.parentalPolicyChoices;

              if (isParentalAddon && parentalPolicySection?.addonChoices) {
                choiceConfig = parentalPolicySection.addonChoices.find(
                  (addon: any) => addon.policyId === componentId,
                );
              } else if (basePolicySection?.addonChoices) {
                choiceConfig = basePolicySection.addonChoices.find(
                  (addon: any) => addon.policyId === componentId,
                );
              }
            }

            if (!choiceConfig || choiceConfig.policyId !== componentId)
              return null;

            // Get the default or first available choice
            const defaultChoice =
              choiceConfig.choices?.find(
                (choice: any) => choice.isDefault && choice.isAvailable,
              ) ||
              choiceConfig.choices?.find((choice: any) => choice.isAvailable) ||
              choiceConfig.choices?.[0];

            if (!defaultChoice?.sumInsuredId) return null;

            // Look up the actual value from component's sumInsuredOptions
            const sumInsuredOption = component.sumInsuredOptions.find(
              (opt: any) => opt.id === defaultChoice.sumInsuredId,
            );
            return sumInsuredOption?.value
              ? `${formatAmountWithCurrency(Number(sumInsuredOption.value), localizationData?.data)}`
              : null;
          };

          // All { policyId, choices } groups across every section, used to look up
          // a component's choices and their isAvailable flags by sumInsuredId.
          const getComponentChoices = (componentId: number): any[] | null => {
            const groups = Object.values(availablePolicyChoices ?? {}).flatMap(
              (s: any) => [
                s?.mainPolicyChoices,
                ...(s?.addonChoices ?? []),
              ],
            );
            return (
              groups.find((g: any) => Number(g?.policyId) === componentId)
                ?.choices ?? null
            );
          };

          // Get sum insured from availablePolicyChoices
          const componentSumInsured = getSumInsuredFromChoices(
            component.id,
            component.type,
          );

          // Helper function to create component item with eligible relations
          const createComponentItem = (
            eligibleRelations: string[],
            suffix?: string,
            isParentalAddon: boolean = false,
            parentPolicyComponentActionTypeId?: number
          ) => {
            if (!eligibleRelations.length) return null;

            if (shouldOnlyShowEnrolledChoices) {
              const componentChoiceKey = `${String(
                parentPolicyComponentActionTypeId ?? "null"
              )}|${String(component.id)}`;
              if (!enrolledChoiceKeySet.has(componentChoiceKey)) {
                return null;
              }
            }

            const matchedChoice = getMatchedEmployeeChoice(
              component.id,
              parentPolicyComponentActionTypeId
            );
            const showEmployeeContribution =
              policyRelations?.configuration?.constraints
                ?.showEmployeeContribution === true;
            const showCompanyContribution =
              showEmployeeContribution &&
              component?.showCompanyContribution === true;

            // Resolve contribution amounts from the currently configured choices.
            // Dynamically scans all sections in availablePolicyChoices by matching
            // component.id against policyId — no hardcoded component type strings.
            const resolveContributionsFromAvailableChoices = () => {
              if (!matchedChoice || !availablePolicyChoices) return null;
              const targetSumInsured = String(matchedChoice.sumInsured ?? '');
              const sumInsuredOption = (component.sumInsuredOptions ?? []).find(
                (opt: any) => String(opt.value ?? '') === targetSumInsured,
              );
              if (!sumInsuredOption) return null;
              const sumInsuredId = Number(sumInsuredOption.id);

              // Collect every { policyId, choices[] } pair from all groups
              // without relying on component.type names.
              const allChoicesSections: { policyId: number; choices: any[] }[] = [];
              const collectSection = (section: any) => {
                if (!section) return;
                if (section.mainPolicyChoices?.policyId != null) {
                  allChoicesSections.push({
                    policyId: Number(section.mainPolicyChoices.policyId),
                    choices: section.mainPolicyChoices.choices ?? [],
                  });
                }
                if (Array.isArray(section.addonChoices)) {
                  section.addonChoices.forEach((addon: any) => {
                    if (addon?.policyId != null) {
                      allChoicesSections.push({
                        policyId: Number(addon.policyId),
                        choices: addon.choices ?? [],
                      });
                    }
                  });
                }
              };
              Object.values(availablePolicyChoices).forEach((group: any) => collectSection(group));

              const matchedSection = allChoicesSections.find(
                (s) => s.policyId === component.id,
              );
              if (!matchedSection) return null;
              return matchedSection.choices.find(
                (c: any) => Number(c.sumInsuredId) === sumInsuredId,
              ) ?? null;
            };

            const currentAvailableChoice = resolveContributionsFromAvailableChoices();
            // Prefer the prorated columns — they equal the full value whenever
            // proration doesn't apply (proRationEnabled=false, or an older
            // saved choice from before these columns existed), so this is
            // always safe to read unconditionally.
            const savedCompany =
              matchedChoice?.proratedCompanyPay ??
              matchedChoice?.companyPay ??
              matchedChoice?.companyContribution;
            const savedEmployee =
              matchedChoice?.proratedEmployeePay ??
              matchedChoice?.employeePay ??
              matchedChoice?.employeeContribution;
            const companyContributionAmount = savedCompany != null
              ? Number(savedCompany)
              : currentAvailableChoice != null
              ? Number(currentAvailableChoice.companyContribution ?? 0)
              : 0;
            const employeeContributionAmount = savedEmployee != null
              ? Number(savedEmployee)
              : currentAvailableChoice != null
              ? Number(currentAvailableChoice.employeeContribution ?? 0)
              : 0;
            const contributionKey = [
              String(policy?.policyId ?? ""),
              String(parentPolicyComponentActionTypeId ?? "null"),
              String(component?.id ?? ""),
            ].join("|");

            const getChoiceMatch = (choice: any) =>
              String(choice?.policyComponentActionTypeId ?? "") ===
                String(component.id) &&
              String(choice?.parentpolicyComponentActionTypeId ?? "null") ===
                String(parentPolicyComponentActionTypeId ?? "null");

            // Filter relations based on employee gender
            const filteredRelations = eligibleRelations.filter(
              (relation: string) => {
                const type = String(relation || "").toLowerCase();
                const gender = String(employeeGender || "").toLowerCase();
                if (gender === "male" && type === "husband") {
                  return false;
                }
                if (gender === "female" && type === "wife") {
                  return false;
                }
                return true;
              }
            );

            const benefitsMembersCovered =
              filteredRelations.length > 0 ? filteredRelations.join(" + ") : null;

            const dependents = Array.isArray(
              policyRelations?.configuration?.dependents,
            )
              ? policyRelations.configuration.dependents
              : [];

            const selfName =
              userDetails?.employeeName || userDetails?.fullName || "Self";
            const memberLabels: string[] = [];

            if (
              filteredRelations.some(
                (relation) => relation.toLowerCase() === "self",
              )
            ) {
              memberLabels.push(`${selfName} (Self)`);
            }

            dependents.forEach((dependent: any) => {
              const dependentChoices = Array.isArray(dependent?.choices)
                ? dependent.choices
                : [];

              const matchesComponent =
                dependentChoices.some((choice: any) => getChoiceMatch(choice)) ||
                getChoiceMatch(dependent);

              if (!matchesComponent) return;

              const dependentName = dependent?.name;
              const dependentRelation =
                dependent?.relation || dependent?.relationshipType;
              if (!dependentName || !dependentRelation) return;

              memberLabels.push(`${dependentName} (${capitalizeFirst(dependentRelation)})`);
            });

            const uniqueMemberLabels = Array.from(new Set(memberLabels));
            const policySummaryMembersCovered = uniqueMemberLabels.length
              ? uniqueMemberLabels.join(", ")
              : null;
            // premiumPerLife can arrive as the string "false" (not just a real boolean) — Boolean("false")
            // is true in JS, so a naive Boolean() coercion here would wrongly re-multiply an
            // already-combined per-life total (e.g. proratedEmployeePay) by the lives count again.
            const rawPremiumPerLife = matchedChoice?.premiumPerLife ?? component?.premiumPerLife;
            const isPremiumPerLife = typeof rawPremiumPerLife === "string"
              ? rawPremiumPerLife.trim().toLowerCase() === "true"
              : Boolean(rawPremiumPerLife);
            const premiumMultiplier =
              isPremiumPerLife && isGmcPolicy(policy)
                ? Math.max(uniqueMemberLabels.length, 1)
                : 1;

            // Get all sum insured values for the component and join with '/'
            let itemSumInsured: string | null = null;
            if (matchedChoice?.sumInsured != null) {
              const selectedSumInsured = Number(matchedChoice.sumInsured);
              itemSumInsured = Number.isFinite(selectedSumInsured)
                ? `${formatAmountWithCurrency(selectedSumInsured, localizationData?.data)}`
                : null;
            } else if (
              component.sumInsuredOptions &&
              Array.isArray(component.sumInsuredOptions) &&
              component.sumInsuredOptions.length > 0
            ) {
              const sumInsuredModel = String(
                component?.sumInsuredModel ?? "",
              ).toUpperCase();
              const multipleFactorValue = getMultipleFactorValue(
                component?.siMultipleLabel,
              );
              const siMultipleMin = toOptionalNumber(component?.siMultipleMin);
              const siMultipleMax = toOptionalNumber(component?.siMultipleMax);

              // Hide options whose matching choice is not available; when the
              // component has no choices, show all options.
              const componentChoices = getComponentChoices(component.id);
              const values = component.sumInsuredOptions
                .filter((opt: any) => {
                  if (opt?.value == null || opt?.value === "") return false;
                  return componentChoices
                    ? componentChoices.some(
                        (c: any) =>
                          Number(c?.sumInsuredId) === Number(opt?.id) &&
                          c?.isAvailable,
                      )
                    : true;
                })
                .map((opt: any) => {
                  const baseValue = Number(opt?.value);
                  if (
                    sumInsuredModel === "MULTIPLE" &&
                    multipleFactorValue != null &&
                    multipleFactorValue > 0 &&
                    Number.isFinite(baseValue) &&
                    baseValue > 0
                  ) {
                    let bounded = baseValue * multipleFactorValue;
                    if (siMultipleMin != null && bounded < siMultipleMin) {
                      bounded = siMultipleMin;
                    }
                    if (siMultipleMax != null && bounded > siMultipleMax) {
                      bounded = siMultipleMax;
                    }
                    return `${formatAmountWithCurrency(bounded, localizationData?.data)}`;
                  }
                  return `${formatAmountWithCurrency(baseValue, localizationData?.data)}`;
                });
              const uniqueValues = values.filter(
                (value: string, index: number) => values.indexOf(value) === index,
              );
              itemSumInsured =
                uniqueValues.length > 0 ? uniqueValues.join(" / ") : null;
            } else {
              itemSumInsured =
                component.type === "optional"
                  ? getSumInsuredFromChoices(
                      component.id,
                      component.type,
                      isParentalAddon,
                    )
                  : componentSumInsured;
            }
            const selectedSumInsuredValue =
              matchedChoice?.sumInsured != null
                ? Number(matchedChoice.sumInsured)
                : itemSumInsured
                ? Number(itemSumInsured.replace(/[^0-9.]/g, ""))
                : 0;

            const claimIntimatedValue = (() => {
              const intimated = claimIntimatedAmountByPolicyId.get(Number(policy.policyId));
              if (intimated !== undefined && Number.isFinite(intimated) && intimated > 0) {
                return intimated;
              }
              return null;
            })();

            const amountClaimedValue = (() => {
              const apiClaimed = claimedAmountByPolicyId.get(Number(policy.policyId));
              if (apiClaimed !== undefined && Number.isFinite(apiClaimed)) {
                return apiClaimed;
              }
              // fallback: derive from balance
              const availableValue = Number(policy.balance);
              if (
                !Number.isFinite(selectedSumInsuredValue) ||
                !Number.isFinite(availableValue)
              ) {
                return null;
              }
              return Math.max(selectedSumInsuredValue - availableValue, 0);
            })();

            const amountAvailableValue =
              amountClaimedValue != null &&
              Number.isFinite(selectedSumInsuredValue)
                ? Math.max(selectedSumInsuredValue - amountClaimedValue, 0)
                : null;

            
            return {
              id: `${policy.policyId}-${component.id}${suffix || ""}`,
              name: component.label,
              policyStartDate: policy.startDate,
              policyEndDate: policy.dueDate,
              features:
                infoPointTexts.length > 0 ? infoPointTexts : baseFeatures,
              sumInsured: itemSumInsured,
              amountAvailable: amountAvailableValue,
              amountClaimed: amountClaimedValue,
              claimIntimatedAmount: claimIntimatedValue,
              benefitsMembersCovered,
              eligibleRelations: filteredRelations,
              policySummaryMembersCovered,
              balance: policy.balance,
              dependentsCount: policy.dependentsCount || 0,
              isEnrolled: policy.isEnrolled,
              isEditable: policy.isEditable,
              componentType: component.type,
              isBenefitComponent: component.isBenefitComponent === true,
              isOptional: component.isOptional === true,
              contributionKey,
              companyContributionAmount: Number.isFinite(companyContributionAmount)
                ? companyContributionAmount * premiumMultiplier
                : 0,
              employeeContributionAmount: Number.isFinite(employeeContributionAmount)
                ? employeeContributionAmount * premiumMultiplier
                : 0,
              showCompanyContribution,
              policyData: policy,
            };
          };

          // Handle different component types
          if (
            component.type === "base" &&
            policyTemplateData?.basePolicy?.mainPolicyId === component.id
          ) {
            const eligibleRelations =
              policyTemplateData.basePolicy.eligibleRelations || [];
            const item = createComponentItem(eligibleRelations);
            if (item) policyItems.push({ ...item, _addonSeq: 0 });
          } else if (
            component.type === "parental" &&
            policyTemplateData?.parentalPolicy?.mainPolicyId === component.id
          ) {
            const eligibleRelations =
              policyTemplateData.parentalPolicy.eligibleRelations || [];
            const item = createComponentItem(eligibleRelations);
            if (item) policyItems.push({ ...item, _addonSeq: 0 });
          } else if (component.type === "optional" && policyTemplateData) {
            // Check basePolicy addons
            const baseAddon = policyTemplateData.basePolicy?.addonIds?.find(
              (addon: any) => addon.optionId === component.id,
            );
            if (baseAddon && baseAddon.eligibleRelations?.length) {
              const item = createComponentItem(
                baseAddon.eligibleRelations,
                " - Base",
                false,
                policyTemplateData.basePolicy?.mainPolicyId
              );
              if (item)
                policyItems.push({
                  ...item,
                  _addonSeq:
                    combinedSeqMap.get(`${component.id}|${baseMainId}`) ?? 999,
                });
            }

            // Also check parentalPolicy addons (addon can exist in both)
            const parentalAddon =
              policyTemplateData.parentalPolicy?.addonIds?.find(
                (addon: any) => addon.optionId === component.id,
              );
            if (parentalAddon && parentalAddon.eligibleRelations?.length) {
              const item = createComponentItem(
                parentalAddon.eligibleRelations,
                " - Parental",
                true,
                policyTemplateData.parentalPolicy?.mainPolicyId
              );
              if (item)
                policyItems.push({
                  ...item,
                  _addonSeq:
                    combinedSeqMap.get(
                      `${component.id}|${parentalMainId}`
                    ) ?? 999,
                });
            }
          } else if (component.type === "flex" && policyTemplateData) {
            const baseAddon = policyTemplateData.basePolicy?.addonIds?.find(
              (addon: any) => addon.optionId === component.id,
            );
            if (baseAddon && baseAddon.eligibleRelations?.length) {
              const item = createComponentItem(
                baseAddon.eligibleRelations,
                undefined,
                false,
                policyTemplateData.basePolicy?.mainPolicyId
              );
              if (item) componentItems.push({ ...item, isBenefitComponent: true });
            }

            const parentalAddon = policyTemplateData.parentalPolicy?.addonIds?.find(
              (addon: any) => addon.optionId === component.id,
            );
            if (parentalAddon && parentalAddon.eligibleRelations?.length) {
              const item = createComponentItem(
                parentalAddon.eligibleRelations,
                undefined,
                true,
                policyTemplateData.parentalPolicy?.mainPolicyId
              );
              if (item) componentItems.push({ ...item, isBenefitComponent: true });
            }
          }
        });

        policyItems.sort((a: any, b: any) => {
          const seqA = a._addonSeq as number;
          const seqB = b._addonSeq as number;
          if (seqA === 0 && seqB === 0) return 0;
          if (seqA === 0) return -1;
          if (seqB === 0) return 1;
          return seqA - seqB;
        });
        componentItems.push(...policyItems);
      });

      // Group by period
      const groupedByPeriod = componentItems.reduce((acc: any, item) => {
        const periodKey = `${item.policyStartDate}-${item.policyEndDate}`;
        if (!acc[periodKey]) {
          acc[periodKey] = {
            startDate: item.policyStartDate,
            dueDate: item.policyEndDate,
            items: [],
          };
        }
        acc[periodKey].items.push(item);
        return acc;
      }, {});

      return Object.values(groupedByPeriod).map((group: any, index) => ({
        id: `period-${index}`,
        title: `Policy Period - ${formatDate(
          group.startDate,
          "DD MMM YYYY",
        )} to ${formatDate(group.dueDate, "DD MMM YYYY")}`,
        items: group.items,
      }));
    },
    [
      features,
      getMembersCoveredForBenefits,
      relationsByPolicyId,
      policyTemplate,
      policyTemplatesById,
      claimedAmountByPolicyId,
      localizationData,
    ]
  );

  const mergeComponentPeriods = useCallback(
    (policies: Array<any>) => {
      const normalizedPolicies = policies.map((policy: any) => ({
        ...policy,
        isEnrolled: true,
      }));

      const allPeriods = buildComponentPeriods(
        normalizedPolicies,
        "all",
        { onlyShowEnrolledChoices: true }
      );

      const periodMap = new Map<string, any>();

      allPeriods.forEach((period: any) => {
        const existing = periodMap.get(period.title);
        if (!existing) {
          periodMap.set(period.title, {
            ...period,
            items: [...period.items],
          });
          return;
        }
        existing.items.push(...period.items);
      });

      return Array.from(periodMap.values());
    },
    [buildComponentPeriods]
  );

  const POLICY_PRIORITY: Record<string, number> = {
    POLICY_TYPE_GMC: 1,
    "POLICY_TYPE_GMC_TOP-UP": 2,
    POLICY_TYPE_GPA: 3,
    POLICY_TYPE_GTL: 4,
  };

  // Transform API data to match component structure
  const benefitsData = useMemo(() => {
    if (!policiesData?.data) {
      return [];
    }

    const { employeePolicies = [], enrolledPolicies = [] } = policiesData.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPolicyExpired = (policy: any) => {
      const policyEndDate = policy?.dueDate;
      if (!policyEndDate) return false;
      const parsedEndDate = new Date(policyEndDate);
      if (Number.isNaN(parsedEndDate.getTime())) return false;
      parsedEndDate.setHours(0, 0, 0, 0);
      return parsedEndDate.getTime() < today.getTime();
    };

    // Exclude policies that have moved to the Expired Policies section:
    // present in employeePolicies, not enrolled, and past their dueDate.
    const enrolledPolicyIds = new Set(
      enrolledPolicies.map((policy: any) => policy?.policyId),
    );

    const allPolicies = [...employeePolicies]
      .filter(
        (policy: any) =>
          !(
            !enrolledPolicyIds.has(policy?.policyId) && isPolicyExpired(policy)
          ),
      )
      .map((policy: any) => ({
        ...policy,
        isEnrolled: false,
      }))
      .sort((a: any, b: any) => {
      const priorityA = POLICY_PRIORITY[a.policyTypeKey] ?? 999;
      const priorityB = POLICY_PRIORITY[b.policyTypeKey] ?? 999;

      return priorityA - priorityB;
    });

    const filterPeriods = (periods: any[], fn: (item: any) => boolean) =>
      periods
        .map((p: any) => ({ ...p, items: p.items.filter(fn) }))
        .filter((p: any) => p.items.length > 0);

    const allPeriods = buildComponentPeriods(allPolicies, "all", {
      onlyShowEnrolledChoices: false,
    });

    return [
      {
        id: "compulsory-benefits",
        title: "Compulsory Benefits",
        subtitle: "Automatically provided to all employees",
        icon: compulsoryBenefitIcon,
        periods: filterPeriods(allPeriods, (item) => !isOptionalItem(item)),
      },
      {
        id: "optional-benefits",
        title: "Optional Benefits",
        subtitle: "Choose and add optional benefits for extra protection",
        icon: optionalBenefitIcon,
        periods: filterPeriods(
          allPeriods,
          (item) => isOptionalItem(item) && !item.isBenefitComponent
        ),
      },
      {
        id: "flex-benefits",
        title: "Flex Benefits",
        subtitle: "Flexible benefits you can customise to your needs",
        icon: flexBenefitIcon,
        periods: filterPeriods(allPeriods, (item) => item.isBenefitComponent === true),
      },
    ].filter((section) => section.periods.length > 0);
  }, [policiesData, buildComponentPeriods]);

  const enrolledPoliciesData = useMemo(() => {
    if (!policiesData?.data) {
      return [];
    }

    const { enrolledPolicies = [], employeePolicies = [] } = policiesData.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isPolicyExpired = (policy: any) => {
      const policyEndDate = policy?.dueDate;
      if (!policyEndDate) return false;

      const parsedEndDate = new Date(policyEndDate);
      if (Number.isNaN(parsedEndDate.getTime())) return false;

      parsedEndDate.setHours(0, 0, 0, 0);
      return parsedEndDate.getTime() < today.getTime();
    };

    const editablePolicies = [...enrolledPolicies]
      .filter((policy: any) => policy?.isEditable === true)
      .sort((a: any, b: any) => {
        const priorityA = POLICY_PRIORITY[a.policyTypeKey] ?? 999;
        const priorityB = POLICY_PRIORITY[b.policyTypeKey] ?? 999;
        return priorityA - priorityB;
      });

    const activePolicies = [...enrolledPolicies]
      .filter(
        (policy: any) =>
          policy?.isEditable === false && !isPolicyExpired(policy),
      )
      .sort((a: any, b: any) => {
        const priorityA = POLICY_PRIORITY[a.policyTypeKey] ?? 999;
        const priorityB = POLICY_PRIORITY[b.policyTypeKey] ?? 999;
        return priorityA - priorityB;
      });

    const expiredPolicies = [...enrolledPolicies]
      .filter(
        (policy: any) =>
          policy?.isEditable === false && isPolicyExpired(policy),
      )
      .sort((a: any, b: any) => {
        const priorityA = POLICY_PRIORITY[a.policyTypeKey] ?? 999;
        const priorityB = POLICY_PRIORITY[b.policyTypeKey] ?? 999;
        return priorityA - priorityB;
      });

    // Policies present in employeePolicies but NOT in enrolledPolicies whose
    // dueDate has passed (today > dueDate) are also treated as expired.
    const enrolledPolicyIds = new Set(
      enrolledPolicies.map((policy: any) => policy?.policyId),
    );
    const expiredEmployeePolicies = [...employeePolicies]
      .filter(
        (policy: any) =>
          !enrolledPolicyIds.has(policy?.policyId) && isPolicyExpired(policy),
      )
      .sort((a: any, b: any) => {
        const priorityA = POLICY_PRIORITY[a.policyTypeKey] ?? 999;
        const priorityB = POLICY_PRIORITY[b.policyTypeKey] ?? 999;
        return priorityA - priorityB;
      });

    const newlyEnrolledSection = {
      id: "newly-enrolled-policies",
      title: "Enroled Policies",
      subtitle: "Select these mandatory components to complete your enrolment",
      icon: enrolledShieldIcon,
      periods: mergeComponentPeriods(editablePolicies),
    };

    const activePoliciesSection = {
      id: "currently-active-policies",
      title: "Currently Active Policies",
      subtitle: "These policies are currently active",
      icon: activeShieldIcon,
      periods: mergeComponentPeriods(activePolicies),
    };

    const expiredPoliciesSection = {
      id: "expired-policies",
      title: "Expired Policies",
      subtitle: "These policies have completed their coverage period",
      icon: activeShieldIcon,
      periods: [
        ...mergeComponentPeriods(expiredPolicies),
        ...buildComponentPeriods(
          expiredEmployeePolicies.map((policy: any) => ({
            ...policy,
            isEnrolled: false,
          })),
          "all",
          { onlyShowEnrolledChoices: false },
        ),
      ],
    };

    return [
      newlyEnrolledSection,
      activePoliciesSection,
      expiredPoliciesSection,
    ].filter((section) => section.periods.length > 0);
  }, [policiesData, mergeComponentPeriods, buildComponentPeriods]);

  const showBenefitsSections = benefitsData.length > 0;
  const showEnrolledSections = enrolledPoliciesData.length > 0;

  // Centralized scroll function for all accordions
  const scrollToElement = useCallback(
    (element: HTMLDivElement, offset: number = 70) => {
      const navbarOffset = offset;
      const viewportPosition = element.getBoundingClientRect().top;
      
      if (Math.abs(viewportPosition - navbarOffset) > 1) {
        const scrollAmount = viewportPosition - navbarOffset;
        const duration = 700; // 0.7 seconds
        const startPosition = window.pageYOffset;
        const startTime = performance.now();
        
        const easeInOutCubic = (t: number) => {
          return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };
        
        const scroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = easeInOutCubic(progress);
          
          window.scrollTo(0, startPosition + scrollAmount * easeProgress);
          
          if (progress < 1) {
            requestAnimationFrame(scroll);
          }
        };
        
        requestAnimationFrame(scroll);
      }
    },
    []
  );

  const handleNestedAccordionToggle = useCallback(
    (
      sectionId: string,
      groupKey: "compulsory" | "optional" | "flex",
      isExpanded: boolean
    ) => {
      setNestedAccordionState((prev) => {
        const currentSet = prev[sectionId] || new Set();
        const newSet = new Set(currentSet);
        
        if (isExpanded) {
          newSet.add(groupKey);
          // Track which nested accordion was just expanded
          lastExpandedNestedAccordionRef.current = `${sectionId}-${groupKey}`;
        } else {
          newSet.delete(groupKey);
          // Clear the ref when collapsing to prevent unwanted scrolls
          if (lastExpandedNestedAccordionRef.current === `${sectionId}-${groupKey}`) {
            lastExpandedNestedAccordionRef.current = null;
          }
        }
        
        return {
          ...prev,
          [sectionId]: newSet,
        };
      });
    },
    []
  );

  const globalGstApplicable = useMemo(() => {
    const allRelations: any[] = Object.values(relationsByPolicyId);
    if (allRelations.length === 0) return true;
    const anyHasConstraints = allRelations.some((item) => item?.configuration?.constraints);
    if (!anyHasConstraints) return true;
    return (
      allRelations.some((item) => item?.configuration?.constraints?.gstApplicable !== false) &&
      allRelations.some((item) => item?.configuration?.constraints?.showGstToEmployee !== false)
    );
  }, [relationsByPolicyId]);

  const sectionContributions = useMemo(() => {
    const GST_RATE = 0.18;
    const result: Record<
      string,
      { company: string; employee: string; showCompanyContribution: boolean; gstApplicable: boolean }
    > = {};

    enrolledPoliciesData.forEach((section) => {
      const uniqueItems = Array.from(
        new Map(
          section.periods
            .flatMap((period: any) => period.items ?? [])
            .map((item: any) => [item?.contributionKey ?? item?.id, item]),
        ).values(),
      );

      const aggregated = uniqueItems
        .reduce(
          (
            accumulator: {
              totalCompany: number;
              totalEmployee: number;
              showCompanyContribution: boolean;
            },
            item: any,
          ) => ({
            totalCompany:
              accumulator.totalCompany +
              (item?.showCompanyContribution === true
                ? Number(item?.companyContributionAmount ?? 0) || 0
                : 0),
            totalEmployee:
              accumulator.totalEmployee +
              (Number(item?.employeeContributionAmount ?? 0) || 0),
            showCompanyContribution:
              accumulator.showCompanyContribution ||
              item?.showCompanyContribution === true,
          }),
          {
            totalCompany: 0,
            totalEmployee: 0,
            showCompanyContribution: false,
          },
        );

      const employeeGst = globalGstApplicable
        ? parseFloat((aggregated.totalEmployee * GST_RATE).toFixed(2))
        : 0;
      const employeeWithGst = parseFloat((aggregated.totalEmployee + employeeGst).toFixed(2));
      const companyGst = globalGstApplicable
        ? parseFloat((aggregated.totalCompany * GST_RATE).toFixed(2))
        : 0;
      const companyWithGst = parseFloat((aggregated.totalCompany + companyGst).toFixed(2));
      const fmt2 = (val: number) =>
        `${formatAmountWithCurrency(val, localizationData?.data, 2)}`;

      result[section.id] = {
        company: fmt2(companyWithGst),
        employee: fmt2(employeeWithGst),
        showCompanyContribution: aggregated.showCompanyContribution,
        gstApplicable: globalGstApplicable,
      };
    });

    return result;
  }, [enrolledPoliciesData, globalGstApplicable, localizationData]);

  // Expose accordion control to parent
  useEffect(() => {
    if (onAccordionControlReady) {
      const expandFirstAccordion = () => {
        // No-op: removed automatic first accordion expansion
        // Accordions now start collapsed by default
      };
      onAccordionControlReady(expandFirstAccordion);
    }
  }, [
    onAccordionControlReady,
  ]);

  useEffect(() => {
    const activeSectionIds = [
      ...benefitsData.map((section) => section.id),
      ...enrolledPoliciesData.map((section) => section.id),
    ];
    const groupKey = activeSectionIds.join("|");

    if (!activeSectionIds.length) {
      lastAccordionGroupKeyRef.current = "";
      if (expandedPanelIds.size > 0) {
        setExpandedPanelIds(new Set());
      }
      return;
    }

    const previousGroupKey = lastAccordionGroupKeyRef.current;
    const isGroupChanged = previousGroupKey !== groupKey;
    const currentExpandedIds = Array.from(expandedPanelIds);
    const stillValidIds = currentExpandedIds.filter((id) => activeSectionIds.includes(id));

    if (isGroupChanged) {
      lastAccordionGroupKeyRef.current = groupKey;
    }

    // Collapsed by default — no auto-expansion on initial mount. Benefit
    // sections/nested compulsory-optional-flex accordions all start closed;
    // the chevron + hint text on each header is the affordance.
    if (isInitialMountRef.current && activeSectionIds.length > 0) {
      isInitialMountRef.current = false;
      return;
    }

    // Preserve the user's current accordion state during async data refreshes.
    // Remove invalid expanded IDs but don't auto-expand any accordion
    if (stillValidIds.length !== currentExpandedIds.length) {
      setExpandedPanelIds(new Set(stillValidIds));
    }
  }, [benefitsData, enrolledPoliciesData, showEnrolledSections, expandedPanelIds]);

  const sectionItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    benefitsData.forEach((section) => {
      counts[section.id] = section.periods.reduce(
        (total: number, period: any) => total + period.items.length,
        0,
      );
    });

    enrolledPoliciesData.forEach((section) => {
      counts[section.id] = section.periods.reduce(
        (total: number, period: any) => total + period.items.length,
        0,
      );
    });

    return counts;
  }, [benefitsData, enrolledPoliciesData]);

  useEffect(() => {
    // Track item count changes for all expanded panels
    const expandedIds = Array.from(expandedPanelIds);
    
    if (expandedIds.length === 0) {
      previousExpandedItemCountRef.current = null;
      return;
    }

    // Only handle scroll adjustment if there's a single expanded panel and it shrinks
    if (expandedIds.length === 1) {
      const panelId = expandedIds[0];
      const currentItemCount = sectionItemCounts[panelId] ?? 0;
      const previousItemCount = previousExpandedItemCountRef.current;
      previousExpandedItemCountRef.current = currentItemCount;

      // When a completed component moves to another accordion, the current accordion
      // suddenly shrinks. Re-anchor the viewport to the accordion header so the
      // user does not see a large empty area below the remaining cards.
      if (
        previousItemCount !== null &&
        currentItemCount < previousItemCount &&
        accordionRefs.current[panelId]
      ) {
        const element = accordionRefs.current[panelId];
        if (element) {
          const elementPosition =
            element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = Math.max(elementPosition - 140, 0);

          window.scrollTo({
            top: offsetPosition,
            behavior: "auto",
          });
        }
      }
    }
  }, [expandedPanelIds, sectionItemCounts]);

  // Auto-scroll to expanded main accordion - only when expanding, not collapsing
  useEffect(() => {
    const currentSize = expandedPanelIds.size;
    const previousSize = previousExpandedPanelsSizeRef.current;
    const isExpanding = currentSize > previousSize;
    
    // Update the ref for next comparison
    previousExpandedPanelsSizeRef.current = currentSize;
    
    // Skip scrolling on initial mount
    if (isInitialMountRef.current) {
      return undefined;
    }
    
    // Only scroll when expanding (size increased), not when collapsing (size decreased)
    if (isExpanding && lastExpandedAccordionRef.current && expandedPanelIds.has(lastExpandedAccordionRef.current)) {
      const expandedId = lastExpandedAccordionRef.current;
      const accordionElement = accordionRefs.current.get(expandedId);
      
      if (accordionElement) {
        scrollToElement(accordionElement);
      }
    }
    return undefined;
  }, [expandedPanelIds, scrollToElement]);

  // Auto-scroll to expanded nested accordion - only when expanding, not collapsing
  useEffect(() => {
    const expandedNestedKeys = Object.entries(nestedAccordionState)
      .flatMap(([sectionId, groupSet]) => 
        Array.from(groupSet).map((groupKey) => `${sectionId}-${groupKey}`)
      );
    
    const currentNestedCount = expandedNestedKeys.length;
    const previousNestedCount = previousNestedExpandedCountRef.current;
    const isExpandingNested = currentNestedCount > previousNestedCount;
    
    // Update the ref for next comparison
    previousNestedExpandedCountRef.current = currentNestedCount;
    
    // Skip scrolling on initial mount
    if (isInitialMountRef.current) {
      return undefined;
    }
    
    // Only scroll when expanding and we have a tracked accordion to scroll to
    if (isExpandingNested && lastExpandedNestedAccordionRef.current) {
      const nestedKey = lastExpandedNestedAccordionRef.current;
      const nestedAccordionElement = nestedAccordionRefs.current.get(nestedKey);
      
      if (nestedAccordionElement) {
        scrollToElement(nestedAccordionElement);
      }
    }
    return undefined;
  }, [nestedAccordionState, scrollToElement]);

  const claimSummaryRows = useMemo(() => {
    const payload = claimsOverviewData?.data?.data ?? claimsOverviewData?.data;
    const policies = payload?.policies ?? [];
    if (!Array.isArray(policies)) return [];

    const toPolicyTypeShort = (policyType?: string) => {
      if (!policyType) return "--";
      const normalized = policyType.trim().toUpperCase();
      const map: Record<string, string> = {
        "GROUP MEDICLAIM POLICY": "GMC",
        "GROUP PERSONAL ACCIDENT POLICY": "GPA",
        "GROUP TERM LIFE INSURANCE (GTL)": "GTL",
        "GROUP TERM LIFE": "GTL",
      };
      return map[normalized] ?? policyType.trim();
    };

    const mapStatus = (status?: string | null) => {
      const normalized = status
        ?.toString()
        .trim()
        .replace(/[\s\-_]+/g, "")
        .toUpperCase();
      if (normalized === "APPROVED" || normalized === "SETTLED") {
        return "Approved";
      }
      if (normalized === "ACTIONREQUIRED") return "Action Required";
      if (normalized === "PENDING" || normalized === "INPROGRESS")
        return "Pending";
      return "Pending";
    };

    const normalizeClaims = (policy: any, claims: any[]) => {
      const policyTypeShort = toPolicyTypeShort(policy?.policyType);
      if (!Array.isArray(claims)) return [];

      return claims.map((claim: any) => ({
        id: claim?.claimNumber ?? claim?.claimId ?? claim?.id,
        claimNumber: claim?.claimNumber ?? claim?.claimId ?? "--",
        policy: policyTypeShort,
        name:
          claim?.memberName && claim?.relation
            ? `${claim.memberName} (${capitalizeFirst(claim.relation)})`
            : claim?.memberName ?? claim?.name ?? "--",
        date: claim?.claimDate
          ? formatDate(claim.claimDate, "DD/MM/YYYY")
          : "--",
        amount: claim?.claimAmount ?? 0,
        status: mapStatus(claim?.status),
        lastUpdatedAt: claim?.updatedAt
      }));
    };

    return policies.flatMap((policy: any) => [
      ...normalizeClaims(policy, policy?.basePolicy?.claims ?? []),
      ...normalizeClaims(policy, policy?.parentalPolicy?.claims ?? []),
    ]);
  }, [claimsOverviewData]);

  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsPageSize, setClaimsPageSize] = useState(10);
  const [claimsSort, setClaimsSort] = useState<
    { colId: string; sort: "asc" | "desc" }[]
  >([]);
  const claimRowHeight = 64;
  const claimHeaderHeight = 56;
  const claimTableHeight =
    claimSummaryRows.length > 0
      ? claimHeaderHeight + claimSummaryRows.length * claimRowHeight
      : claimHeaderHeight;

  const renderClickableClaimNumber = (params: { value?: string }) => {
    if (!params.value) return "--";
    return <span className="claim-number-link">{params.value}</span>;
  };

  const claimSummaryColumns = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Claim Number",
        field: "claimNumber",
        headerClass: "claim-summary-header",
        flex: 1,
        minWidth: 160,
        // setClaimsSort is wired to this table but claimSummaryRows'
        // useApiQuery call never depends on that sort state — clicking a
        // header would show an arrow but never actually refetch/reorder.
        disableSort: true,
        cellRenderer: renderClickableClaimNumber,
        cellStyle: {
          background: "linear-gradient(180deg, #F1F1F1 0%, #F9F9F9 100%)",
          border: "1px solid #FFFFFF",
          fontWeight: 400,
          fontSize: "18px",
          color: "#222222",
          textAlign: "left",
        },
      },
      {
        headerName: "Policy",
        field: "policy",
        headerClass: "claim-summary-header",
        flex: 1,
        minWidth: 120,
        disableSort: true,
        cellStyle: {
          background: "linear-gradient(180deg, #F1F1F1 0%, #F9F9F9 100%)",
          border: "1px solid #FFFFFF",
          fontWeight: 400,
          fontSize: "18px",
          color: "#222222",
          textAlign: "left",
        },
      },
      {
        headerName: "Name",
        field: "name",
        headerClass: "claim-summary-header",
        flex: 1,
        minWidth: 180,
        disableSort: true,
        cellStyle: {
          background: "linear-gradient(180deg, #F1F1F1 0%, #F9F9F9 100%)",
          border: "1px solid #FFFFFF",
          fontWeight: 400,
          fontSize: "18px",
          color: "#222222",
          textAlign: "left",
        },
      },
      {
        headerName: "Date",
        field: "date",
        headerClass: "claim-summary-header",
        flex: 1,
        minWidth: 140,
        disableSort: true,
        cellStyle: {
          background: "linear-gradient(180deg, #F1F1F1 0%, #F9F9F9 100%)",
          border: "1px solid #FFFFFF",
          fontWeight: 400,
          fontSize: "18px",
          color: "#222222",
          textAlign: "left",
        },
      },
      {
        headerName: "Claim Amount",
        field: "amount",
        headerClass: "claim-summary-header claim-summary-header-right",
        valueFormatter: (params) =>
          `${formatAmountWithCurrency(params.value ?? 0, localizationData?.data)}`,
        flex: 1,
        minWidth: 160,
        disableSort: true,
        cellStyle: {
          background: "linear-gradient(180deg, #F1F1F1 0%, #F9F9F9 100%)",
          border: "1px solid #FFFFFF",
          fontWeight: 400,
          fontSize: "18px",
          color: "#222222",
          textAlign: "right",
        },
      },
      {
        headerName: "Status",
        field: "status",
        headerClass: "claim-summary-header",
        flex: 1,
        minWidth: 160,
        disableSort: true,
        cellStyle: (params) => {
          const status = String(params.value || "").toLowerCase();
          if (status === "approved") {
            return {
              background:
                "linear-gradient(143.21deg, rgba(46, 125, 50, 0.04) 21.39%, rgba(46, 125, 50, 0.3) 183.31%)",
              color: "#1EB431",
              fontWeight: 400,
              fontSize: "18px",
              border: "1px solid #FFFFFF",
            };
          }
          if (status === "action required") {
            return {
              background:
                "linear-gradient(143.21deg, rgba(231, 33, 7, 0.04) 21.39%, rgba(231, 33, 7, 0.3) 183.31%)",
              color: "#FA3535",
              fontWeight: 400,
              fontSize: "18px",
              border: "1px solid #FFFFFF",
            };
          }
          return {
            background:
              "linear-gradient(143.21deg, rgba(255, 140, 0, 0.05), rgba(228, 82, 14, 0.25))",
            color: "#E65C00",
            fontWeight: 400,
            fontSize: "18px",
            border: "1px solid #FFFFFF",
          };
        },
      },
      {
        headerName: "Last Updated At",
        field: "lastUpdatedAt",
        headerClass: "claim-summary-header claim-summary-header-right",
        valueFormatter: (params) => (params.value) ?? '',
        flex: 1,
        minWidth: 160,
        disableSort: true,
      },
    ],
    [localizationData],
  );

  const handleAccordionChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanelIds((prev) => {
        const newSet = new Set(prev);
        if (isExpanded) {
          newSet.add(panel);
          lastExpandedAccordionRef.current = panel;
        } else {
          newSet.delete(panel);
          // Clear the ref when collapsing to prevent unwanted scrolls
          if (lastExpandedAccordionRef.current === panel) {
            lastExpandedAccordionRef.current = null;
          }
        }
        return newSet;
      });
      // Scroll is now handled by the centralized useEffect with proper tracking
    };



  const { hasGMCPolicy, hasGMCPolicyForLifeEvents, hasAnyPolicyForLifeEvents } = usePoliciesFlags();
  const { portalDashboardConfig } = useCompanyConfig();
  // Hide Life Events when the feature flag is off OR the company explicitly
  // disabled it (enableLifeEvents === false).
  const isLifeEventDisabled =
    !environment.featureFlag.FF_LIFE_EVENT_DEPENDENT_MANAGEMENT ||
    portalDashboardConfig?.enableLifeEvents === false;

  const quickAccessItems = [
    {
      id: "hospital-network",
      title: "Hospital Network",
      icon: hospitalNetworkIcon,
      variant: "hospital",
      route: "/hospital",
      showWhenEnrolled: true,
      requiresGMC: false,
    },
    {
      id: "documents",
      title: "My Documents",
      icon: documentIcon,
      variant: "documents",
      route: "/my-documents",
      showWhenEnrolled: true,
    },
    {
      id: "e-cards",
      title: "E Cards",
      icon: eCard,
      variant: "ecard",
      route: "/e-card",
      showWhenEnrolled: true,
    },
    {
      id: "policy-features",
      title: "Policy Features",
      icon: policyFeatureIcon,
      variant: "policy",
      route: "/policy-features",
      showWhenEnrolled: true,
    },
    {
      id: "life-events",
      title: "Life Events",
      icon: lifeEventIcon,
      variant: "life-event",
      route: "/life-events",
      showWhenEnrolled: true,
      requiresNonEditableGMC: true,
    },
    {
      id: "tpa-login",
      title: isSsoFetching ? "Redirecting..." : "TPA Login",
      icon: tpaLogin,
      variant: "tpa-login",
      route: "",
      showWhenEnrolled: true,
      disabled: isSsoFetching,
    },
  ];

  const CellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "claimNumber") {
      navigate(`/claims-corner`);
    }
  };

  const policyDatesInfo = useMemo(() => {
    const allPolicies = [...benefitsData, ...enrolledPoliciesData].flatMap(
      (section: any) =>
        section.periods.flatMap((period: any) =>
          period.items.map((item: any) => ({
            name: item.name,
            startDate: item.policyStartDate,
            endDate: item.policyEndDate,
          })),
        ),
    );

    if (!allPolicies.length) return null;

    // Check if there are multiple different date ranges
    const uniqueDateRanges = new Set(
      allPolicies.map((p: any) => `${p.startDate}-${p.endDate}`),
    );

    const hasMultipleDateRanges = uniqueDateRanges.size > 1;

    return {
      firstPolicy: allPolicies[0],
      allPolicies,
      hasMultipleDateRanges,
    };
  }, [benefitsData, enrolledPoliciesData]);

    if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: 280,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CommonLoader />
      </Box>
    );
  }
  
  return (
    <BenefitsSectionContainer>
      <QuickAccessSection>
        {quickAccessItems
          .filter((item) => {
            if (item.showWhenEnrolled && !hasViewablePolicies) return false;
            if (item.requiresGMC && !hasGMCPolicy) return false;
            // Company-level gate: an explicit false hides Life Events.
            if (item.id === "life-events" && isLifeEventDisabled) return false;
            // if (item.requiresNonEditableGMC && !hasAnyPolicyForLifeEvents) return false;
            // Hide the Policy Features and E Cards tiles while in
            // add-only-dependents mode.
            if (
              addOnlyDependents &&
              ["policy-features", "e-cards"].includes(item.id)
            )
              return false;
            return true;
          })
          .map((item) => {
            return (
              <QuickAccessCard
                key={item.id}
                variant={item.variant}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  if (item.id === "tpa-login") {
                    handleTpaPortalClick();
                    return;
                  }
                  navigate(item.route, {
                    state:
                      item.id === "policy-features"
                        ? { showContinueEnrollment: true }
                        : undefined,
                  });
                }}
              >
                <QuickAccessIcon src={item.icon} alt={item.title} />
                <QuickAccessTitle>{item.title}</QuickAccessTitle>
              </QuickAccessCard>
            );
          })}
        {/* Dynamic TPA feature cards (E-card / Hospital Network / TPA Portal Login)
            removed from the quick-access row per request. The data + handlers remain
            wired above; only the render is disabled. */}
      </QuickAccessSection>
      {policyDatesInfo && (
        <PolicyPeriodBadge>
          <PolicyPeriodText>
            Policy Period -{" "}
            {formatDate(policyDatesInfo.firstPolicy.startDate, "DD MMM YYYY")}{" "}
            to {formatDate(policyDatesInfo.firstPolicy.endDate, "DD MMM YYYY")}
          </PolicyPeriodText>
          {policyDatesInfo.hasMultipleDateRanges && (
            <Tooltip
              title={
                <TooltipContainer>
                  <TooltipHeader>Policy Periods</TooltipHeader>
                  {policyDatesInfo.allPolicies.map(
                    (policy: any, index: number) => (
                      <TooltipPolicyItem
                        key={index}
                        isLast={
                          index === policyDatesInfo.allPolicies.length - 1
                        }
                      >
                        <TooltipPolicyName>{policy.name}</TooltipPolicyName>
                        <TooltipPolicyDate>
                          <span>📅</span>
                          <span>
                            {formatDate(policy.startDate, "DD/MM/YYYY")} -{" "}
                            {formatDate(policy.endDate, "DD/MM/YYYY")}
                          </span>
                        </TooltipPolicyDate>
                      </TooltipPolicyItem>
                    ),
                  )}
                </TooltipContainer>
              }
              arrow
              placement="right"
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: "rgba(33, 33, 33, 0.95)",
                    "& .MuiTooltip-arrow": {
                      color: "rgba(33, 33, 33, 0.95)",
                    },
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <InfoOutlinedIcon
                sx={{
                  ml: 1,
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "primary.main",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: "primary.dark",
                    transform: "scale(1.1)",
                  },
                }}
              />
            </Tooltip>
          )}
        </PolicyPeriodBadge>
      )}
      {showBenefitsSections &&
        benefitsData.map((section) => (
          <StyledAccordion
            key={`${section.id}-${sectionItemCounts[section.id] ?? 0}`}
            ref={(el) => {
              if (el) {
                accordionRefs.current.set(section.id, el);
              } else {
                accordionRefs.current.delete(section.id);
              }
            }}
            $sectionType={section.id}
            expanded={expandedPanelIds.has(section.id)}
            onChange={handleAccordionChange(section.id)}
          >
            <StyledAccordionSummary
              expandIcon={
                <ExpandIcon>
                  {expandedPanelIds.has(section.id) ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </ExpandIcon>
              }
            >
              <ShieldIconWrapper>
                <img src={section.icon} alt={`${section.title} Icon`} />
              </ShieldIconWrapper>
              <AccordionHeaderContentBenifitsSection>
                <SectionTitle>{section.title}</SectionTitle>
                <SectionSubtitle>{section.subtitle}</SectionSubtitle>
              </AccordionHeaderContentBenifitsSection>
            </StyledAccordionSummary>
            <StyledAccordionDetails>
              {section.periods.map((period: any) => (
                <PeriodPoliciesContainer key={period.id}>
                  <BenefitsGrid>
                    {period.items.map((item: any) => (
                      <BenefitCard
                        key={item.id}
                        name={item.name}
                        policyStartDate={item.policyStartDate}
                        policyEndDate={item.policyEndDate}
                        features={item.features}
                        buttonText={buttonText}
                        isEnrolled={item.isEnrolled}
                        isEditable={item.isEditable}
                        sumInsured={item.sumInsured}
                        membersCovered={item.benefitsMembersCovered}
                        eligibleRelations={item.eligibleRelations}
                        isActionDisabled={isPolicyInNotifyState(
                          item.policyData,
                        )}
                        onEnroll={() => handleEnrollNow(item.policyData)}
                        onViewSummary={() => handleViewSummary(item.policyData)}
                        policyData={item.policyData}
                      />
                    ))}
                  </BenefitsGrid>
                </PeriodPoliciesContainer>
              ))}
            </StyledAccordionDetails>
          </StyledAccordion>
        ))}
      {showEnrolledSections &&
        enrolledPoliciesData.map((section) => {
          const flatItems = section.periods.flatMap(
            (period: any) => period.items
          );
          const compulsoryItems = flatItems.filter(
            (item: any) => !isOptionalItem(item)
          );
          const optionalItems = flatItems.filter(
            (item: any) => isOptionalItem(item) && !item.isBenefitComponent
          );
          const flexItems = flatItems.filter(
            (item: any) => item.isBenefitComponent === true
          );
          const isExpanded = expandedPanelIds.has(section.id);
          const contributions = sectionContributions[section.id];

          return (
            <StyledAccordion
              key={`${section.id}-${sectionItemCounts[section.id] ?? 0}`}
              ref={(el) => {
                if (el) {
                  accordionRefs.current.set(section.id, el);
                } else {
                  accordionRefs.current.delete(section.id);
                }
              }}
              expanded={isExpanded}
              onChange={handleAccordionChange(section.id)}
              TransitionProps={{
                timeout: 700,
                unmountOnExit: false,
              }}
            >
              <StyledAccordionSummary
                expandIcon={
                  <PolicySummaryExpandIcon>
                    {isExpanded ? (
                      <KeyboardArrowUpIcon />
                    ) : (
                      <KeyboardArrowDownIcon />
                    )}
                  </PolicySummaryExpandIcon>
                }
              >
                <ShieldIconWrapper>
                  <img src={section.icon} alt={`${section.title} Icon`} />
                </ShieldIconWrapper>
                <AccordionHeaderContent>
                  <AccordionTitleRow>
                    <SectionTitle>{section.title}</SectionTitle>
                    <SectionSubtitle>{section.subtitle}</SectionSubtitle>
                    </AccordionTitleRow>
                    <AccordionTitleRow>
                    <Collapse in={!isExpanded && !!contributions} timeout={500}>
                      <ContributionWrapper>
                        {contributions?.showCompanyContribution && (
                            <ContributionText variant="body2">
                              Total Company Contribution{contributions.gstApplicable ? ` (incl. ${getTaxLabel(localizationData?.data)})` : ""}{" "}
                              <ContributionAmount component="strong">
                                {contributions.company}
                              </ContributionAmount>
                            </ContributionText>
                        )}
                        {contributions && (
                          <ContributionText variant="body2">
                            Your Total Contribution{contributions.gstApplicable ? ` (incl. ${getTaxLabel(localizationData?.data)})` : ""}{" "}
                            <ContributionAmount component="strong">
                              {contributions.employee}
                            </ContributionAmount>
                          </ContributionText>
                        )}
                      </ContributionWrapper>
                    </Collapse>
                    </AccordionTitleRow>
                </AccordionHeaderContent>
              </StyledAccordionSummary>
              <StyledAccordionDetails>
                <BenefitsGrid>
                  {[
                    {
                      key: "compulsory",
                      title: "Compulsory",
                      subtitle: "Automatically provided to all employees",
                      items: compulsoryItems,
                      icon: compulsoryBenefitIcon,
                      borderColor: "#EC6C27",
                    },
                    {
                      key: "optional",
                      title: "Optional",
                      subtitle: "These benefits have been added by you for extra protection.",
                      items: optionalItems,
                      icon: optionalBenefitIcon,
                      borderColor: "#E9C945",
                    },
                    {
                      key: "flex",
                      title: "Flex Benefits",
                      subtitle: "Flexible benefits you can customise to your needs",
                      items: flexItems,
                      icon: flexBenefitIcon,
                      borderColor: "#27A62C",
                    },
                  ]
                    .filter((group) => group.items.length > 0)
                    .map((group) => {
                      const sectionSet = nestedAccordionState[section.id] || new Set();
                      const isNestedExpanded = sectionSet.has(group.key as "compulsory" | "optional" | "flex");

                      return (
                        <Accordion
                          key={`${section.id}-${group.key}`}
                          ref={(el) => {
                            const nestedKey = `${section.id}-${group.key}`;
                            if (el) {
                              nestedAccordionRefs.current.set(nestedKey, el);
                            } else {
                              nestedAccordionRefs.current.delete(nestedKey);
                            }
                          }}
                          disableGutters
                          expanded={isNestedExpanded}
                           onChange={(_event, expanded) =>
                            handleNestedAccordionToggle(
                              section.id,
                              group.key as "compulsory" | "optional" | "flex",
                              expanded
                            )
                          }
                          TransitionProps={{
                            timeout: 700,
                            unmountOnExit: false,
                          }}
                          sx={{
                            boxShadow: "none",
                            borderStyle: "solid",
                            borderColor: group.borderColor,
                            borderWidth: isNestedExpanded
                              ? "4px 2px 2px 2px"
                              : "1px",
                            borderRadius: "10px !important",
                            "&:before": { display: "none" },
                            px: 2.5,
                            py: 3.75,
                            transition: "margin 0.3s ease-in-out, border-width 0.7s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                            "& .MuiCollapse-root": {
                              transition: "height 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important",
                            },
                            "& .MuiCollapse-wrapper": {
                              transition: "height 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important",
                            },
                            "& .MuiCollapse-wrapperInner": {
                              transition: "height 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important",
                            },
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<KeyboardArrowDownIcon />}
                            sx={{
                              "& .MuiAccordionSummary-expandIconWrapper": {
                                transform: "rotate(0deg)",
                                transition: "transform 0.2s ease-in-out",
                              },
                              "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded":
                                {
                                  transform: "rotate(180deg)",
                                },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <img
                                src={group.icon}
                                alt={`${group.title} Icon`}
                                style={{ width: 50, height: 50 }}
                              />
                              <Box>
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: "24px",
                                    "@media (max-width: 768px)": { fontSize: "18px" },
                                  }}
                                >
                                  {group.title} ({group.items.length})
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    lineHeight: 1.3,
                                    fontWeight: 400,
                                  }}
                                >
                                  {group.subtitle}
                                </Typography>
                                {!isNestedExpanded && (
                                  <Typography
                                    sx={{
                                      fontSize: "12px",
                                      fontStyle: "italic",
                                      fontWeight: 500,
                                      color: "#7B8794",
                                      mt: 0.5,
                                    }}
                                  >
                                    Tap to expand and view details
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <BenefitsGrid>
                              {group.items.map((item: any) => (
                                <PolicySummaryCard
                                  key={item.id}
                                  name={item.name}
                                  policyName={item.policyData?.policyName}
                                  badgeText={
                                    item.componentType === "flex"
                                      ? "Flex"
                                      : item.componentType === "optional"
                                      ? "Optional"
                                      : "Compulsory"
                                  }
                                  policyStartDate={item.policyStartDate}
                                  policyEndDate={item.policyEndDate}
                                  sumInsured={item.sumInsured}
                                  claimIntimatedAmount={item.claimIntimatedAmount}
                                  amountClaimed={item.amountClaimed}
                                  amountAvailable={item.amountAvailable}
                                  showAmountAvailable={section.id === "currently-active-policies"}
                                  features={item.features ?? []}
                                  membersCovered={
                                    item.policySummaryMembersCovered
                                  }
                                  ctaVariant="button"
                                  ctaLabel={getPolicyCtaLabel(item.policyData)}
                                  onCtaClick={() =>
                                    getPolicyCtaLabel(item.policyData) ===
                                    "View Summary"
                                      ? handleViewSummary(item.policyData)
                                      : section.id === "currently-active-policies"
                                      ? handleEnrollFromActive(item.policyData)
                                      : handleEnrollNow(item.policyData)
                                  }
                                  showCta={true}
                                />
                              ))}
                            </BenefitsGrid>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                </BenefitsGrid>
              </StyledAccordionDetails>
            </StyledAccordion>
          );
        })}
      {showEnrolledSections && hasViewablePolicies && claimSummaryRows.length > 0 && (
        <ClaimSummaryCard>
          <ClaimSummaryHeader>
            <ClaimSummaryIconWrapper>
              <img src={claimsSummaryIcon} alt="Claim Summary Icon" />
            </ClaimSummaryIconWrapper>
            <ClaimSummaryTitle>Claim Summary</ClaimSummaryTitle>
          </ClaimSummaryHeader>
          <ClaimSummaryTableWrapper className="claim-summary-grid">
            <Table
              columns={claimSummaryColumns}
              rowData={claimSummaryRows}
              totalRows={claimSummaryRows.length}
              currentPage={claimsPage}
              loading={isClaimsLoading}
              setCurrentPage={setClaimsPage}
              pageSize={claimSummaryRows.length || claimsPageSize}
              pageSizeOptions={[claimSummaryRows.length || claimsPageSize]}
              setPageSize={setClaimsPageSize}
              onCellClicked={CellClicked}
              setSort={setClaimsSort}
              domLayout="normal"
              height={claimTableHeight}
              getRowHeight={() => claimRowHeight}
              displaySettingsButton={false}
              showRefreshButton={false}

            />
          </ClaimSummaryTableWrapper>
        </ClaimSummaryCard>
      )}
      <WellnessBanner />

      {/* DISPLAY flow — generic TPA data card */}
      {tpaDisplayData && (
        <Dialog open onClose={() => setTpaDisplayData(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ pr: 6, fontWeight: 700, fontSize: "1rem" }}>
            {tpaDisplayData.label}
            <IconButton onClick={() => setTpaDisplayData(null)}
              sx={{ position: "absolute", right: 8, top: 8, color: "#555" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {Object.entries(tpaDisplayData.data).map(([key, val]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0", gap: 12 }}>
                <span style={{ fontSize: "0.8rem", color: "#777", textTransform: "capitalize" }}>
                  {key.replace(/_/g, " ")}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a1a1a", textAlign: "right" }}>
                  {String(val)}
                </span>
              </div>
            ))}
          </DialogContent>
        </Dialog>
      )}
    </BenefitsSectionContainer>
  );
};

export default DashboardBenefitsSection;
