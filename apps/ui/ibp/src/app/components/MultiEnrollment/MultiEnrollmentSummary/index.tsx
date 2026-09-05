import {
  BACK,
  CANCEL,
  COMPANY_CONTRIBUTION,
  CONFIRM_ENROLLMENT,
  DECLARATION_DATA,
  PREMIUM,
  SAVE_EXIT,
  YOUR_CONTRIBUTION,
} from "../../../constants";
import {
  ButtonContainer,
  CommonSummaryContainer,
  Container,
  DeclarationCheckbox,
  DeclarationContent,
  DeclarationHelperText,
  DeclarationPoint,
  DeclarationPointLabel,
  DeclarationSection,
  DeclarationTitle,
  MainContainer,
  ViewSummaryContainer,
  SelectedPlansWrapper,
  PlanCard,
  PolicyHeader,
  PolicyIcon,
  PolicyTitle,
  PlanInfoSection,
  PlanInfoGrid,
  InfoColumn,
  InfoValue,
  InfoLabel,
  StyledPolicyCardWrapper,
  PolicyPeriodText,
  Separator,
  SummarySectionAccordionContent,
  SummarySectionAccordionContentInner,
  SummarySectionAccordionHeader,
  SummarySectionAccordionWrapper,
  SummarySectionArrow,
  SummarySectionContainer,
  SummarySectionHeaderContent,
  SummarySectionIcon,
  SummarySectionIconWrapper,
  SummarySectionSubtitle,
  SummarySectionText,
  SummarySectionsWrapper,
  SummarySectionTitle,
} from "./styles";
import ColoredShiledIcon from "../../../assets/svgs/colored-shield-icon.svg";
import OptionalIcon from "../../../assets/svgs/optional-benefits-icon.svg";
import FlexIcon from "../../../assets/svgs/flex-benifits.svg";
import AccordionExpandIcon from "../../../assets/svgs/accordion-arrow.svg";
import EnrollmentBanner from "../../../common/EnrollmentBanner";
import TotalPremiumIcon from "../../../assets/svgs/enrollment-banner-total-premium-image.svg";
import YourContributionIcon from "../../../assets/svgs/enrollment-banner-your-contribution-image.svg";
import CompanyContributionIcon from "../../../assets/svgs/enrollment-banner-company-contribution-image.svg";
import PipeSeparator from "../../../assets/svgs/separator-pipe-symbol.svg";
import EyeIcon from "../../../assets/svgs/eye.svg";
import EyeSlashIcon from "../../../assets/svgs/eye-slash.svg";
import { Box, Typography } from "@mui/material";
import CommonButton from "../../../common/Button";
import { useEffect, useState, useMemo, useRef } from "react";
import CommonLoader from "../../../common/CommonLoader";
import {
  generatePolicySummaryFromConfig,
  normalizePoliciesByBase,
  shouldShowDeclarations,
  findPolicyConfigByPolicyId,
  getPolicyPeriodText,
} from "./utils";
import {
  parseDateString,
  calculateAgeFromDate,
} from "../../Enrollment/EnrollmentFlow/utils/dateValidations";
import { useDispatch, useSelector } from "react-redux";
import {
  flattenPoliciesWithStatus,
  PolicyStatus,
} from "../../../utils/flattenPolicies";
import { capitalizeFirst } from "../../../utils";
import { AppDispatch, RootState } from "../../../redux/store";
import { fetchCompanyTemplate } from "../../../redux/companyTemplateSlice";
import {
  axiosInstance,
  endPoints,
  useLocalization,
  formatAmountWithCurrency,
  getTaxLabel,
  getPayrollInstallments,
  useApiQuery,
} from "@ui/ui-lib";

export interface DisclaimerAccepted {
  policyId: number;
  text: string;
  isMandatory: boolean;
  acceptedAt: string;
}

export interface EnrollmentSummaryProps {
  policyConfigurationData: any[];
  summaryData: any;
  handleSave: (action: string) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
  isLoading: boolean;
  isViewOnly?: boolean;
  gstConfig?: { applicable: boolean; showToEmployee: boolean; rate: number };
  onDisclaimersChange?: (disclaimers: DisclaimerAccepted[]) => void;
  storedDisclaimers?: DisclaimerAccepted[];
}

export const getPolicyIcon = (policyTypeKey?: string | null) => {
  const name = policyTypeKey || "";
  const normalizedName = name.toLowerCase();

  // Special cases for parental policies
  if (normalizedName === "group mediclaim parental") {
    return {
      initials: "GMC-P",
      gradient: "linear-gradient(153.11deg, #FFE168 24.4%, #CAA513 88.51%)",
      borderGradient: "linear-gradient(153.11deg, #FFE168 24.4%, #CAA513 88.51%)",
    };
  }
  if (normalizedName === "group term life parental") {
    return {
      initials: "GTL-P",
      gradient: "linear-gradient(180deg, #88DB8B 0%, #27A62C 100%)",
      borderGradient: "linear-gradient(180deg, #88DB8B 0%, #27A62C 100%)",
    };
  }
  if (normalizedName === "group personal accident parental") {
    return {
      initials: "GPA-P",
      gradient: "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)",
      borderGradient: "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)",
    };
  }

  // Initials: first letter of each of the first 3 alphabetic words (ignores &, -, numbers, etc.)
  const words = name.split(/\s+/).filter((w) => /^[a-zA-Z]/.test(w));
  const initials =
    words
      .slice(0, 3)
      .map((w) => w[0].toUpperCase())
      .join("") || "POL";

  // Fixed colours for known initials
  if (initials === "POL") {
    const g = "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)";
    return { initials, gradient: g, borderGradient: g };
  }
  if (initials === "GTL") {
    const g = "linear-gradient(180deg, #88DB8B 0%, #27A62C 100%)";
    return { initials, gradient: g, borderGradient: g };
  }
  if (initials === "GMC") {
    const g = "linear-gradient(153.11deg, #FFE168 24.4%, #CAA513 88.51%)";
    return { initials, gradient: g, borderGradient: g };
  }
  if (initials === "GPA") {
    const g = "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)";
    return { initials, gradient: g, borderGradient: g };
  }

  // Gradient: deterministic alphabetical pattern so the same policy always gets the same colour
  const gradients = [
    "linear-gradient(153.11deg, #FFE168 24.4%, #CAA513 88.51%)", // gold
    "linear-gradient(180deg, #88DB8B 0%, #27A62C 100%)",          // green
    "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)", // orange
  ];
  const firstAlphaChar = name.match(/[a-zA-Z]/)?.[0]?.toUpperCase() ?? "";
  const alphaIndex = firstAlphaChar
    ? firstAlphaChar.charCodeAt(0) - "A".charCodeAt(0)
    : 0;
  const gradient = gradients[((alphaIndex % 3) + 3) % 3];

  return { initials, gradient, borderGradient: gradient };
};

// Bolds "<n> equal instalments" inside a declaration line. Done at render time,
// not in the string: React escapes text nodes, so `<b>` in the content would
// show up literally — and that same string is persisted to `disclaimersAccepted`
// on submit, where markup has no business being.
const withBoldInstallments = (text: string) =>
  String(text ?? "")
    .split(/(\d+ equal instalments)/)
    .map((part, index) =>
      /^\d+ equal instalments$/.test(part) ? (
        <b key={`inst-${index}`}>{part}</b>
      ) : (
        part
      ),
    );

type DisclaimerNote = { content: string; isMandatory: boolean };

const extractDisclaimerNotes = (notes: any): DisclaimerNote[] => {
  if (Array.isArray(notes)) {
    return notes
      .map((note: any) => {
        const text =
          note?.text ??
          note?.attributes?.text ??
          note?.description ??
          note?.attributes?.description;
        const isMandatory = Boolean(
          note?.isMandatory ?? note?.attributes?.isMandatory ?? false,
        );
        return {
          content: typeof text === "string" ? text.trim() : "",
          isMandatory,
        };
      })
      .filter((note) => Boolean(note.content));
  }

  if (Array.isArray(notes?.data)) {
    return extractDisclaimerNotes(notes.data);
  }

  if (Array.isArray(notes?.data?.data)) {
    return extractDisclaimerNotes(notes.data.data);
  }

  return [];
};

// Order in which policy disclaimers are presented on the summary. Unknown
// policy types fall after these, preserving their incoming order.
const POLICY_TYPE_SEQUENCE = ["GMC", "GTL", "GPA"];

// Unwraps the various Strapi response shapes to reach the template object that holds `config`.
const normalizeTemplatePayload = (payload: any): any => {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    return payload.length ? normalizeTemplatePayload(payload[0]) : null;
  }
  if (payload.data) {
    return normalizeTemplatePayload(payload.data);
  }
  if (payload.attributes) {
    return { id: payload.id, ...payload.attributes };
  }
  return payload;
};

// Renders one member entry with a masked DOB that can be revealed via an eye toggle.
// Applies to all members including Self.
const MemberWithMaskedDob = ({ member, isLast }: { member: any; isLast: boolean }) => {
  const [revealed, setRevealed] = useState(false);
  const parsedDob = member.dateOfBirth ? parseDateString(member.dateOfBirth) : null;
  const dobDisplay = parsedDob
    ? parsedDob.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const ageDisplay = parsedDob ? calculateAgeFromDate(parsedDob) : null;
  const revealedText = dobDisplay
    ? ageDisplay != null
      ? `${dobDisplay} · Age: ${ageDisplay}`
      : dobDisplay
    : "";

  return (
    <Typography
      component="span"
      variant="body2"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mr: isLast ? 0 : 0.75 }}
    >
      <span>
        {member.name} ({capitalizeFirst(member.relation)}
        {dobDisplay ? " · " : ""}
      </span>
      {dobDisplay && (
        <>
          <Box
            component="span"
            sx={{
              fontFamily: revealed ? "inherit" : "monospace",
              letterSpacing: revealed ? "normal" : "0.1em",
              userSelect: revealed ? "auto" : "none",
              marignTop: "5px",
            }}
          >
            {revealed ? revealedText : "** *** ****"}
          </Box>
          <Box
            component="img"
            src={revealed ? EyeSlashIcon : EyeIcon}
            alt={revealed ? "Hide date of birth" : "Show date of birth"}
            onClick={() => setRevealed((prev) => !prev)}
            sx={{
              width: 16,
              height: 16,
              cursor: "pointer",
              verticalAlign: "middle",
              "&:hover": { opacity: 0.7 },
              transition: "opacity 0.15s",
            }}
          />
        </>
      )}
      <span>{isLast ? ")" : "), "}</span>
    </Typography>
  );
};

const MultiEnrollmentSummary: React.FC<EnrollmentSummaryProps> = ({
  policyConfigurationData,
  summaryData,
  handleSave,
  onBack,
  onContinue,
  loading,
  isLoading,
  isViewOnly = false,
  gstConfig,
  onDisclaimersChange,
  storedDisclaimers = [],
}) => {
  console.log("summaryDatapolicyConfigurationData", summaryData,policyConfigurationData )
  const { localizationData } = useLocalization();
  const [plans, setPlans] = useState<any[]>([]);
  const [sectionExpanded, setSectionExpanded] = useState({
    compulsory: true,
    optional: true,
    flex: true,
  });
  const [bannerData, setBannerData] = useState<any[]>([]);
  
  // Refs for auto-scrolling
  const sectionAccordionRefs = useRef<Map<string, any>>(new Map());
  const prevSectionExpanded = useRef(sectionExpanded);
  
  const updatedPolicyConfigurationData = useMemo(
    () => normalizePoliciesByBase(policyConfigurationData),
    [policyConfigurationData],
  );

  const dispatch = useDispatch<AppDispatch>();
  const policiesData = useSelector(
    (state: any) => state.policyData.policiesData,
  );

  const { data: companyTemplate } = useSelector(
      (state: RootState) => state.companyTemplate,
    );

  // Create policyTemplatesById directly from summaryData instead of Redux
  const policyTemplatesFromSummary = useMemo(() => {
    const templatesByPolicyId: Record<string, any> = {};
    
    // Extract policy templates from summaryData structure
    Object.values(summaryData || {}).forEach((item: any) => {
      if (item?.policyId && item?.configuration?.policyTemplate) {
        templatesByPolicyId[String(item.policyId)] = {
          config: {
            policyTemplate: item.configuration.policyTemplate,
            isRelationshipGroup: item.configuration.isRelationshipGroup === true,
          }
        };
        console.log("Extracted policy template for %s:", item.policyId, item.configuration.policyTemplate);
      }
    });
    
    console.log('Policy templates from summaryData:', templatesByPolicyId);
    return templatesByPolicyId;
  }, [summaryData]);

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const companyId = userDetails?.companyId;

  // Strapi policy-template disclaimer notes, fetched per enrolled policy.
  // These are NOT present in summaryData (which only carries the enrollment
  // policyTemplate), so they must be fetched directly from Strapi like the
  // company template is.
  const [policyTemplateNotesById, setPolicyTemplateNotesById] = useState<
    Record<string, DisclaimerNote[]>
  >({});

  const enrolledPolicyIds = useMemo(() => {
    const policyIds = [
      ...(policiesData?.employeePolicies ?? []),
      ...(policiesData?.enrolledPolicies ?? []),
    ]
      .map((policy: any) => policy?.policyId)
      .filter((policyId: any) => policyId != null);
    return Array.from(new Set(policyIds.map((id: any) => String(id))));
  }, [policiesData]);

  useEffect(() => {
    if (!companyId || enrolledPolicyIds.length === 0) {
      setPolicyTemplateNotesById({});
      return;
    }

    let cancelled = false;
    Promise.all(
      enrolledPolicyIds.map(async (policyId) => {
        try {
          const response = await axiosInstance.get(
            endPoints.policyTemplate(companyId, policyId),
          );
          const notes = extractDisclaimerNotes(
            normalizeTemplatePayload(response?.data)?.config?.disclaimerNotes,
          );
          return [policyId, notes] as const;
        } catch {
          return [policyId, [] as DisclaimerNote[]] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      const map: Record<string, DisclaimerNote[]> = {};
      entries.forEach(([policyId, notes]) => {
        map[policyId] = notes;
      });
      setPolicyTemplateNotesById(map);
    });

    return () => {
      cancelled = true;
    };
  }, [companyId, enrolledPolicyIds]);

  const companyDisclaimerNoteTexts = useMemo(
    () => extractDisclaimerNotes(companyTemplate?.config?.disclaimerNotes),
    [companyTemplate],
  );

  const groupedPlans = useMemo(
    () =>
      plans.reduce(
        (
          acc: { compulsory: any[]; optional: any[]; flex: any[] },
          policy: any,
        ) => {
          const isFlexPlan = (selectedPlan: any) =>
            selectedPlan?.type === "optional" && selectedPlan?.isBenefitComponent === true;

          const flexPolicyPlans =
            policy?.policyPlans?.filter((plan: any) =>
              plan?.selectedPlans?.some(isFlexPlan),
            ) ?? [];

          const compulsoryPolicyPlans =
            policy?.policyPlans?.filter((plan: any) =>
              plan?.selectedPlans?.some(
                (selectedPlan: any) =>
                  String(selectedPlan?.type ?? "").toLowerCase() !== "optional" &&
                  !isFlexPlan(selectedPlan),
              ),
            ) ?? [];

          const optionalPolicyPlans =
            policy?.policyPlans?.filter((plan: any) =>
              plan?.selectedPlans?.some(
                (selectedPlan: any) =>
                  String(selectedPlan?.type ?? "").toLowerCase() === "optional" &&
                  !isFlexPlan(selectedPlan),
              ),
            ) ?? [];

          if (flexPolicyPlans.length > 0) {
            acc.flex.push({
              ...policy,
              policyPlans: flexPolicyPlans,
            });
          }

          if (compulsoryPolicyPlans.length > 0) {
            acc.compulsory.push({
              ...policy,
              policyPlans: compulsoryPolicyPlans,
            });
          }

          if (optionalPolicyPlans.length > 0) {
            acc.optional.push({
              ...policy,
              policyPlans: optionalPolicyPlans,
            });
          }

          return acc;
        },
        { compulsory: [], optional: [], flex: [] },
      ),
    [plans],
  );





  useEffect(() => {
    if (companyId) {
      dispatch(fetchCompanyTemplate(companyId));
    }
  }, [dispatch, companyId]);

  const flattenedPolicies = useMemo(
    () => flattenPoliciesWithStatus(policiesData),
    [policiesData],
  );

  const { data: employeeDetailsResponse } = useApiQuery({
    queryKey: ["employeeDetails", userDetails?.id],
    url: userDetails?.id ? endPoints.employeeDetails : "",
    enabled: Boolean(userDetails?.id),
  });

  const employeeEffectiveDate = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    const additionalDetails =
      payload?.data?.additionalDetails ??
      payload?.data?.data?.additionalDetails;
    return (
      additionalDetails?.["Effective Date"] ??
      additionalDetails?.["dateOfJoining"] ??
      null
    );
  }, [employeeDetailsResponse]);

  const policyEndDateById = useMemo(() => {
    const map = new Map<string, string | null>();
    (flattenedPolicies ?? []).forEach((policy: any) => {
      if (policy?.policyId != null) {
        map.set(String(policy.policyId), policy?.dueDate ?? null);
      }
    });
    return map;
  }, [flattenedPolicies]);

  const policyStartDateById = useMemo(() => {
    const map = new Map<string, string | null>();
    (flattenedPolicies ?? []).forEach((policy: any) => {
      if (policy?.policyId != null) {
        map.set(String(policy.policyId), policy?.startDate ?? null);
      }
    });
    return map;
  }, [flattenedPolicies]);

  // One deduction schedule is shown for the whole submission rather than one per
  // policy: the employee sees a single salary deduction, so the longest span
  // across the selected policies is used. Emitting the same sentence for every
  // policy lets the existing content-based merge collapse it to one checkbox.
  const sharedPayrollInstallments = useMemo(() => {
    const counts = (plans ?? []).map((plan: any) =>
      getPayrollInstallments(
        employeeEffectiveDate ??
          policyStartDateById.get(String(plan?.policyId)),
        policyEndDateById.get(String(plan?.policyId)),
        // The configured cap lives on the policy CONFIGURATION, not on the
        // policies list — flattenedPolicies has no `configuration` key at all.
        findPolicyConfigByPolicyId(summaryData, plan?.policyId)?.configuration
          ?.constraints?.payrollInstallments,
      ),
    );
    return counts.length > 0 ? Math.max(...counts) : 1;
  }, [
    plans,
    employeeEffectiveDate,
    policyStartDateById,
    policyEndDateById,
    summaryData,
  ]);

  // Dynamic declaration data based on API response and portal configuration
  const dynamicDeclarationData = useMemo(() => {
    const declarations: Record<string, any> = {};
    const companyNotes = companyDisclaimerNoteTexts;

    // Use plans array which has the actual policy data
    plans?.forEach((plan: any) => {
      const points: { content: string; isMandatory: boolean }[] = [];
      const policyId = plan.policyId;

      // Use utility function to find policy configuration
      const policyConfig = findPolicyConfigByPolicyId(summaryData, policyId);

      // Only create declarations if enrollmentConfirmationRequired is true
      if (!shouldShowDeclarations(summaryData, policyId)) {
        return; // Skip this policy if enrollment confirmation is not required
      }

      if (sharedPayrollInstallments > 1) {
        points.push({
          content: `Your contribution will be deducted in ${sharedPayrollInstallments} equal instalments from your monthly salary`,
          isMandatory: true,
        });
      }

      // Custom disclaimer: mandatory only when enrollment confirmation is
      // required for this policy; otherwise shown as optional.
      if (policyConfig?.configuration?.constraints?.customDisclaimerBeforeSubmission) {
        points.push({
          content: policyConfig.configuration.constraints.customDisclaimerBeforeSubmission,
          isMandatory: Boolean(
            policyConfig?.configuration?.constraints?.enrollmentConfirmationRequired,
          ),
        });
      }

      // Policy template disclaimers for THIS policy only - keeps notes grouped
      // per policy so the summary can be ordered GMC -> GTL -> GPA. Mandatory
      // state is driven by the Strapi isMandatory flag. Falls back to any
      // disclaimerNotes embedded in summaryData for this policy.
      const thisPolicyNotes =
        (policyTemplateNotesById[String(policyId)] ?? []).length > 0
          ? policyTemplateNotesById[String(policyId)]
          : extractDisclaimerNotes(policyConfig?.configuration?.disclaimerNotes);
      thisPolicyNotes.forEach((note) => {
        points.push({
          content: note.content,
          isMandatory: note.isMandatory,
        });
      });

      // Company template disclaimers - mandatory state driven by Strapi isMandatory flag
      if (companyNotes.length > 0) {
        companyNotes.forEach((note) => {
          points.push({
            content: note.content,
            isMandatory: note.isMandatory,
          });
        });
      }

      // Only add to declarations if there are points to show
      if (points.length > 0) {
        declarations[policyId] = {
          title: DECLARATION_DATA.title,
          points,
        };
      }
    });

    return declarations;
  }, [
    summaryData,
    plans,
    flattenedPolicies,
    companyDisclaimerNoteTexts,
    policyTemplateNotesById,
    sharedPayrollInstallments,
  ]);

  const bottomDeclarationData = useMemo(() => {
    const orderedPolicyIds = plans
      .filter((plan) => plan?.showDeclarations)
      .map((plan) => String(plan.policyId));

    return orderedPolicyIds.reduce((acc: Record<string, any>, policyId) => {
      if (dynamicDeclarationData[policyId]) {
        acc[policyId] = dynamicDeclarationData[policyId];
      }
      return acc;
    }, {});
  }, [dynamicDeclarationData, plans]);

  // Rank each policy by its type so disclaimers render GMC -> GTL -> GPA.
  // Unknown types sort after the known sequence, keeping their incoming order.
  const policyTypeRankById = useMemo(() => {
    const map: Record<string, number> = {};
    flattenedPolicies.forEach((p) => {
      const short = String(p.policyTypeKey || "").replace("POLICY_TYPE_", "");
      const idx = POLICY_TYPE_SEQUENCE.indexOf(short);
      map[String(p.policyId)] = idx === -1 ? POLICY_TYPE_SEQUENCE.length : idx;
    });
    return map;
  }, [flattenedPolicies]);

  const mergedDeclarations = useMemo(() => {
    const entries = Object.entries(bottomDeclarationData);
    let merged: Array<{ policyId: string; index: number; content: string; isMandatory?: boolean }> = [];

    entries.forEach(([policyId, declaration]) => {
      declaration.points.forEach((point: any, index: number) => {
        const content = String(point.content ?? "").trim();
        if (!content) return;
        merged.push({ policyId, index, content, isMandatory: point.isMandatory });
      });
    });

    // Remove duplicate optional disclaimers (isMandatory: false) by content
    const seenOptional = new Set<string>();
    merged = merged.filter((item) => {
      if (item.isMandatory) return true;
      if (seenOptional.has(item.content)) return false;
      seenOptional.add(item.content);
      return true;
    });

    // Sort by policy type (GMC -> GTL -> GPA). Array.sort is stable, so within
    // a policy the notes keep their original order (backend mandatory items
    // first, then Strapi notes in their configured order).
    const rankFor = (policyId: string) =>
      policyTypeRankById[policyId] ?? POLICY_TYPE_SEQUENCE.length;
    merged = merged.sort((a, b) => rankFor(a.policyId) - rankFor(b.policyId));

    return merged;
  }, [bottomDeclarationData, policyTypeRankById]);

  // Display-only view: collapse identical disclaimer texts into a single row so
  // the same note (e.g. the installment disclaimer) isn't shown once per policy.
  // Each row keeps refs to every (policyId, index) it represents, so toggling
  // the one visible checkbox updates all of them — storage stays per policy.
  const displayDeclarations = useMemo(() => {
    const byContent = new Map<
      string,
      {
        content: string;
        isMandatory?: boolean;
        refs: { policyId: string; index: number }[];
      }
    >();
    mergedDeclarations.forEach((item) => {
      const existing = byContent.get(item.content);
      if (existing) {
        existing.refs.push({ policyId: item.policyId, index: item.index });
      } else {
        byContent.set(item.content, {
          content: item.content,
          isMandatory: item.isMandatory,
          refs: [{ policyId: item.policyId, index: item.index }],
        });
      }
    });
    return Array.from(byContent.values());
  }, [mergedDeclarations]);

  const [checkedDeclarations, setCheckedDeclarations] = useState<
    Record<string, boolean[]>
  >({});

  const handleDeclarationChange = (policyId: string, index: number) => {
    setCheckedDeclarations((prev) => {
      const policyDeclarations = [...(prev[policyId] || [])];
      policyDeclarations[index] = !(prev[policyId]?.[index] || false);
      return {
        ...prev,
        [policyId]: policyDeclarations,
      };
    });
  };

  // Toggle every policy that shares this displayed disclaimer text at once.
  const handleGroupDeclarationChange = (
    refs: { policyId: string; index: number }[],
    nextChecked: boolean,
  ) => {
    setCheckedDeclarations((prev) => {
      const next = { ...prev };
      refs.forEach(({ policyId, index }) => {
        const arr = [...(next[policyId] || [])];
        arr[index] = nextChecked;
        next[policyId] = arr;
      });
      return next;
    });
  };

  useEffect(() => {
    if (!onDisclaimersChange) return;
    const accepted: DisclaimerAccepted[] = [];
    mergedDeclarations.forEach((item) => {
      const isChecked = checkedDeclarations[item.policyId]?.[item.index] ?? false;
      if (isChecked) {
        accepted.push({
          policyId: Number(item.policyId),
          text: item.content,
          isMandatory: item.isMandatory ?? false,
          acceptedAt: new Date().toISOString(),
        });
      }
    });
    onDisclaimersChange(accepted);
  }, [checkedDeclarations, mergedDeclarations]);

  const areAllDeclarationsChecked = useMemo(() => {
    // Only check MANDATORY disclaimers (backend ones) for policy IDs that exist in plans data
    const planPolicyIds = plans
      .filter((plan) => plan?.showDeclarations)
      .map((plan) => plan.policyId.toString());

    return planPolicyIds.every((policyId) => {
      const declarationData = dynamicDeclarationData[policyId];
      
      // If no declaration data, continue
      if (!declarationData) {
        return true;
      }
      
      // Only check mandatory disclaimers (backend ones with isMandatory: true)
      // Template disclaimers (company/policy) with isMandatory: false are optional
      const policyChecks = checkedDeclarations[policyId] || [];
      
      return declarationData.points.every((point: any, index: number) => {
        // If this disclaimer is not mandatory (template disclaimer), skip the check
        if (!point.isMandatory) {
          return true;
        }
        // For mandatory disclaimers (backend), it must be checked
        return policyChecks[index] === true;
      });
    });
  }, [checkedDeclarations, plans]);

  // Generate dynamic policy period text
  const policyPeriodText = useMemo(() => {
    return getPolicyPeriodText(plans, flattenedPolicies, isViewOnly);
  }, [plans, flattenedPolicies]);

  useEffect(() => {
    setCheckedDeclarations((prev) => {
      const next: Record<string, boolean[]> = {};
      Object.keys(dynamicDeclarationData).forEach((policyId) => {
        const declaration = dynamicDeclarationData[policyId];
        if (!shouldShowDeclarations(summaryData, Number(policyId))) return;

        const prevPoints = prev[policyId];
        // Preserve user's checked state if the number of checkboxes hasn't changed
        if (prevPoints && prevPoints.length === declaration.points.length) {
          next[policyId] = prevPoints;
          return;
        }

        const policyDetails = plans.find((plan) => plan.policyId === Number(policyId));
        const isLocked = policyDetails?.status === PolicyStatus.LOCKED;
        const policyStoredDisclaimers = storedDisclaimers.filter(
          (d) => String(d.policyId) === String(policyId)
        );
        next[policyId] = declaration.points.map((point: any) => {
          if (isLocked || isViewOnly) return true;
          if (policyStoredDisclaimers.some((d) => d.text.trim() === String(point.content ?? "").trim())) return true;
          return false; // pre-check all by default
        });
      });
      return next;
    });
  }, [dynamicDeclarationData, isViewOnly, summaryData, plans, storedDisclaimers]);

  // Restructure dependents to match policy component structure
  const restructuredDependents = useMemo(() => {
    if (!summaryData?.dependents || !Array.isArray(summaryData.dependents)) {
      return [];
    }

    // Create a flattened array where each dependent-choice combination becomes a separate entry
    const transformed: any[] = [];
    
    summaryData.dependents.forEach((dependent: any) => {
      if (Array.isArray(dependent.choices) && dependent.choices.length > 0) {
        // For each choice, create a separate dependent entry
        dependent.choices.forEach((choice: any) => {
          transformed.push({
            id: dependent.id,
            name: dependent.name,
            relation: dependent.relation,
            relationshipType: dependent.relationshipType,
            dateOfBirth: dependent.dateOfBirth,
            gender: dependent.gender,
            // Add policy component information from choice
            policyComponentActionTypeId: choice.policyComponentActionTypeId,
            parentpolicyComponentActionTypeId:
              choice.parentpolicyComponentActionTypeId,
            policyComponentActionType: choice.policyComponentActionType,
            policyComponentActionLabel: choice.policyComponentActionLabel,
            policyId: choice.policyId
          });
        });
      } else {
        // choices is empty or absent — keep dependent as-is.
        // This covers isRelationshipGroup dependents (policyComponentActionTypeId=null,
        // choices=[]) which are enrolled at the policy level and identified by their id.
        transformed.push(dependent);
      }
    });
    
    console.log("Original dependents:", summaryData.dependents);
    console.log("Restructured dependents:", transformed);
    return transformed;
  }, [summaryData?.dependents]);

  useEffect(() => {
    const { plans, enrollmentInfo: newEnrollmentInfo } =
      generatePolicySummaryFromConfig(
        updatedPolicyConfigurationData,
        restructuredDependents,
        flattenedPolicies,
        localizationData?.data,
        summaryData, // Pass summaryData to enable showDeclarations flag
        policyTemplatesFromSummary, // Use policy templates from summaryData instead of Redux
      );

    const filterdPlans = plans.filter((plan) => {
      if (isViewOnly) {
        // Show only policies with status 'editEnroll' or 'locked'
        return (
          plan.status === PolicyStatus.EDIT_ENROLL ||
          plan.status === PolicyStatus.LOCKED
        );
      } else {
        // Keep confirm-enrollment summary aligned with unified enrollment.
        // Only actionable policies should appear here.
        return (
          plan.status === PolicyStatus.CAN_ENROLL ||
          plan.status === PolicyStatus.EDIT_ENROLL ||
          plan.status === PolicyStatus.NOT_STARTED
        );
      }
    });
    
    setPlans(filterdPlans);

    // Compute banner totals from the visible (filtered) plans only.
    // employee is always summed.
    // company is only summed for plans where showCompanyContribution !== false,
    // because formattedItem.companyContribution is set even on hidden plans.
    let employeeTotal = 0;
    let companyTotal = 0;
    let showCompanyContrib = false;

    filterdPlans.forEach((plan: any) => {
      plan.policyPlans?.forEach((policyPlan: any) => {
        policyPlan.selectedPlans?.forEach((selectedPlan: any) => {
          const empAmt =
            Number.parseFloat(
              String(selectedPlan?.yourContribution || "0").replaceAll(/[^0-9.]/g, ""),
            ) || 0;
          employeeTotal += empAmt;

          if (selectedPlan?.showCompanyContribution === true) {
            const compAmt =
              Number.parseFloat(
                String(selectedPlan?.companyContribution || "0").replaceAll(/[^0-9.]/g, ""),
              ) || 0;
            companyTotal += compAmt;
            showCompanyContrib = true;
          }
        });
      });
    });

    console.log("[Banner totals]", { employeeTotal, companyTotal, showCompanyContrib });

    const gstApplicable = gstConfig?.applicable === true;
    const gstRate = gstConfig?.rate ?? 0.18;
    const employeeGst = gstApplicable ? parseFloat((employeeTotal * gstRate).toFixed(2)) : 0;
    const employeeTotalWithGst = parseFloat((employeeTotal + employeeGst).toFixed(2));
    const companyGst = gstApplicable ? parseFloat((companyTotal * gstRate).toFixed(2)) : 0;
    const companyTotalWithGst = parseFloat((companyTotal + companyGst).toFixed(2));
    const showGstLabel = gstApplicable && gstConfig?.showToEmployee === true;
    const gstLabel = showGstLabel ? `incl. ${Math.round(gstRate * 100)}% ${getTaxLabel(localizationData?.data)}` : undefined;

    const fmt = (val: number) => formatAmountWithCurrency(val, localizationData?.data, 2);
    const totalPremiumValue = fmt(employeeTotalWithGst + companyTotalWithGst);
    const yourContributionValue = fmt(employeeTotalWithGst);
    const companyContributionValue = fmt(companyTotalWithGst);

    const bannerItems = [
      {
        image: TotalPremiumIcon,
        label: PREMIUM,
        value: totalPremiumValue,
        isVisible: showCompanyContrib,
        gstLabel,
      },
      {
        image: YourContributionIcon,
        label: YOUR_CONTRIBUTION,
        value: yourContributionValue,
        isVisible: true,
        gstLabel,
      },
    ];

    if (showCompanyContrib) {
      bannerItems.push({
        image: CompanyContributionIcon,
        label: COMPANY_CONTRIBUTION,
        value: companyContributionValue,
        isVisible: true,
        gstLabel,
      });
    }

    setBannerData(bannerItems);
  }, [
    updatedPolicyConfigurationData,
    restructuredDependents,
    flattenedPolicies,
    isViewOnly,
    policyTemplatesFromSummary,
    summaryData,
    gstConfig,
  ]);

  const toggleSection = (section: "compulsory" | "optional" | "flex") => {
    setSectionExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Auto-scroll to expanded section accordion
  useEffect(() => {
    // Find which section just changed from collapsed to expanded
    const justExpandedSection = Object.keys(sectionExpanded).find((key) => {
      const typedKey = key as keyof typeof sectionExpanded;
      return (
        sectionExpanded[typedKey] === true &&
        prevSectionExpanded.current[typedKey] === false
      );
    });
    
    // Update the ref for next comparison
    prevSectionExpanded.current = sectionExpanded;
    
    if (justExpandedSection) {
      const sectionElement = sectionAccordionRefs.current.get(justExpandedSection);
      
      if (sectionElement) {
        // Start scrolling immediately without waiting for accordion animation
        const navbarOffset = 70;
        const elementRect = sectionElement.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const targetScrollPosition = absoluteElementTop - navbarOffset;
        const currentScrollPosition = window.pageYOffset;
        
        // Smooth scroll with custom 500ms duration
        const startTime = performance.now();
        const duration = 500;
        const distance = targetScrollPosition - currentScrollPosition;
        
        const easeInOutCubic = (t: number): number => {
          return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeInOutCubic(progress);
          
          window.scrollTo(0, currentScrollPosition + distance * easedProgress);
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };
        
        requestAnimationFrame(animateScroll);
      }
    }
    return undefined;
  }, [sectionExpanded]);

  const shouldShowContributionColumns = (
    policyId: number,
    selectedPlan: any,
  ) => {
    const policyConfig = findPolicyConfigByPolicyId(summaryData, policyId);
    const showEmployeeContribution =
      policyConfig?.configuration?.constraints?.showEmployeeContribution === true;

    if (!showEmployeeContribution) {
      return false;
    }

    const componentId = Number(selectedPlan?.policyComponentActionTypeId);
    const matchingComponent =
      policyConfig?.configuration?.policyComponentsConfiguration?.components?.find(
        (component: any) => Number(component?.id) === componentId,
      );

    return matchingComponent?.showCompanyContribution === true;
  };

  const renderPolicies = (policyList: any[]) =>
    policyList.map((policy, policyIndex) => {
      const policyIconData = getPolicyIcon(policy.policyName);

      return (
        <StyledPolicyCardWrapper key={`policy-${policy.policyId}`}>
          {policy?.policyPlans?.map((plan, planIndex) => (
            <Box key={`plan-${policy.policyId}-${plan.id}`}>
              {plan?.selectedPlans?.map((selectedPlan: any, idx: number) => (
                (() => {
                  const showCompanyContribution =
                    shouldShowContributionColumns(policy.policyId, selectedPlan);

                  return (
                <PlanCard
                  key={`${policyIndex}-${planIndex}-${idx}`}
                  borderGradient={policyIconData.borderGradient}
                >
                  <PolicyHeader>
                    <PolicyIcon gradient={policyIconData.gradient}>
                      {policyIconData.initials}
                    </PolicyIcon>
                    <PolicyTitle>{selectedPlan?.name ?? ""}</PolicyTitle>
                  </PolicyHeader>

                  <PlanInfoSection>
                    <PlanInfoGrid>
                      <InfoColumn>
                        <InfoLabel>Sum Insured</InfoLabel>
                        <InfoValue>{selectedPlan?.sumInsured}</InfoValue>
                      </InfoColumn>
                      {showCompanyContribution && (
                        <>
                          <Separator src={PipeSeparator} alt="separator" />
                          <InfoColumn>
                            <InfoLabel>Premium</InfoLabel>
                            <InfoValue>
                              {(() => {
                                const isGstApplicable = gstConfig?.applicable === true;
                                if (!isGstApplicable) return selectedPlan?.premium;
                                // Premium = company contribution + your contribution (with GST)
                                const rawEmployee = Number.parseFloat(
                                  String(selectedPlan?.yourContribution || '0').replace(/[^0-9.]/g, '')
                                ) || 0;
                                const rawCompany = Number.parseFloat(
                                  String(selectedPlan?.companyContribution || '0').replace(/[^0-9.]/g, '')
                                ) || 0;
                                const gstRate = gstConfig?.rate ?? 0.18;
                                const total = (rawCompany + rawEmployee) * (1 + gstRate);
                                return `${formatAmountWithCurrency(total, localizationData?.data, 2)}`;
                              })()}
                            </InfoValue>
                          </InfoColumn>
                        </>
                      )}
                      {showCompanyContribution && (
                        <>
                          <Separator src={PipeSeparator} alt="separator" />
                          <InfoColumn>
                            <InfoLabel style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                              Company contribution
                              {gstConfig?.applicable === true && gstConfig?.showToEmployee === true && (
                                <span style={{ fontSize: 12, opacity: 0.75 }}>
                                  incl. {Math.round((gstConfig?.rate ?? 0.18) * 100)}% {getTaxLabel(localizationData?.data)}
                                </span>
                              )}
                            </InfoLabel>
                            <InfoValue>
                              {(() => {
                                const isGstApplicable = gstConfig?.applicable === true;
                                if (!isGstApplicable) return selectedPlan?.companyContribution;
                                const raw = Number.parseFloat(
                                  String(selectedPlan?.companyContribution || '0').replace(/[^0-9.]/g, '')
                                ) || 0;
                                const gstRate = gstConfig?.rate ?? 0.18;
                                const withGst = parseFloat((raw * (1 + gstRate)).toFixed(2));
                                return `${formatAmountWithCurrency(withGst, localizationData?.data, 2)}`;
                              })()}
                            </InfoValue>
                          </InfoColumn>
                        </>
                      )}
                      <Separator src={PipeSeparator} alt="separator" />
                     <InfoColumn>
                        <InfoLabel style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                          Your contribution
                          {gstConfig?.applicable === true && gstConfig?.showToEmployee === true && (
                            <span style={{ fontSize: 12, opacity: 0.75 }}>
                              incl. {Math.round((gstConfig?.rate ?? 0.18) * 100)}% {getTaxLabel(localizationData?.data)}
                            </span>
                          )}
                        </InfoLabel>
                        <InfoValue>
                          {(() => {
                            const isGstApplicable = gstConfig?.applicable === true;
                            if (!isGstApplicable) return selectedPlan?.yourContribution;
                            const raw = Number.parseFloat(
                              String(selectedPlan?.yourContribution || '0').replace(/[^0-9.]/g, '')
                            ) || 0;
                            const gstRate = gstConfig?.rate ?? 0.18;
                            const withGst = parseFloat((raw * (1 + gstRate)).toFixed(2));
                            return `${formatAmountWithCurrency(withGst, localizationData?.data, 2)}`;
                          })()}
                        </InfoValue>
                      </InfoColumn>
                    </PlanInfoGrid>

                    {plan?.membersCovered?.length > 0 && (
                      <Box>
                        <InfoLabel sx={{ mb: 1, fontSize: "14px" }}>
                          Members covered
                        </InfoLabel>
                        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", rowGap: 0.5 }}>
                          {plan.membersCovered
                            .sort((a: any, b: any) => {
                              if (a.relation === "Self") return -1;
                              if (b.relation === "Self") return 1;
                              return 0;
                            })
                            .map((member: any, idx: number, arr: any[]) => (
                              <MemberWithMaskedDob
                                key={`${member.name}-${member.relation}-${idx}`}
                                member={member}
                                isLast={idx === arr.length - 1}
                              />
                            ))}
                        </Box>
                      </Box>
                    )}
                  </PlanInfoSection>
                </PlanCard>
                  );
                })()
              ))}
            </Box>
          ))}
        </StyledPolicyCardWrapper>
      );
    });

  return (
    <ViewSummaryContainer>
      {isLoading ? (
        <CommonLoader fullScreen={true} />
      ) : (
        <Container>
          <MainContainer>
            {/* Banner hidden as per Figma design */}
            <EnrollmentBanner enrollmentInfo={bannerData} />

            <SelectedPlansWrapper data-testid="your-selected-plans-box">
              <PolicyPeriodText>
                {(() => {
                  const match = policyPeriodText.match(
                    /^(Here's the )(Enrolment Completion summary|Enrolment summary)( for current policy year )(.+)$/
                  );
                  if (match) {
                    return (
                      <>
                        {match[1]}
                        <strong>{match[2]}</strong>
                        {match[3]}
                        <strong>{match[4]}</strong>
                      </>
                    );
                  }
                  return policyPeriodText;
                })()}
              </PolicyPeriodText>
              <CommonSummaryContainer data-testid="common-summary-container">
                <SummarySectionsWrapper>
                  {groupedPlans.compulsory.length > 0 && (
                    <SummarySectionContainer
                      ref={(el) => {
                        if (el) {
                          sectionAccordionRefs.current.set('compulsory', el);
                        } else {
                          sectionAccordionRefs.current.delete('compulsory');
                        }
                      }}
                      isExpanded={sectionExpanded.compulsory}
                      sectionType="compulsory"
                    >
                      <SummarySectionAccordionWrapper>
                        <SummarySectionAccordionHeader
                          isExpanded={sectionExpanded.compulsory}
                          onClick={() => toggleSection("compulsory")}
                        >
                          <SummarySectionHeaderContent>
                            <SummarySectionIconWrapper>
                              <SummarySectionIcon
                                src={ColoredShiledIcon}
                                alt="Compulsory benefits"
                              />
                            </SummarySectionIconWrapper>
                            <SummarySectionText>
                              <SummarySectionTitle>
                                Compulsory Benefits
                              </SummarySectionTitle>
                              <SummarySectionSubtitle>
                                Automatically provided to all employees
                              </SummarySectionSubtitle>
                            </SummarySectionText>
                          </SummarySectionHeaderContent>
                          <SummarySectionArrow
                            src={AccordionExpandIcon}
                            alt="toggle compulsory section"
                            expanded={sectionExpanded.compulsory}
                          />
                        </SummarySectionAccordionHeader>
                        <SummarySectionAccordionContent
                          isExpanded={sectionExpanded.compulsory}
                        >
                          <SummarySectionAccordionContentInner isExpanded={sectionExpanded.compulsory}>
                            {renderPolicies(groupedPlans.compulsory)}
                          </SummarySectionAccordionContentInner>
                        </SummarySectionAccordionContent>
                      </SummarySectionAccordionWrapper>
                    </SummarySectionContainer>
                  )}

                  {groupedPlans.optional.length > 0 && (
                    <SummarySectionContainer
                      ref={(el) => {
                        if (el) {
                          sectionAccordionRefs.current.set('optional', el);
                        } else {
                          sectionAccordionRefs.current.delete('optional');
                        }
                      }}
                      isExpanded={sectionExpanded.optional}
                      sectionType="optional"
                    >
                      <SummarySectionAccordionWrapper>
                        <SummarySectionAccordionHeader
                          isExpanded={sectionExpanded.optional}
                          onClick={() => toggleSection("optional")}
                        >
                          <SummarySectionHeaderContent>
                            <SummarySectionIconWrapper>
                              <SummarySectionIcon
                                src={OptionalIcon}
                                alt="Optional benefits"
                              />
                            </SummarySectionIconWrapper>
                            <SummarySectionText>
                              <SummarySectionTitle>
                                Optional Benefits
                              </SummarySectionTitle>
                              <SummarySectionSubtitle>
                                These benefits have been added by you for extra protection.
                              </SummarySectionSubtitle>
                            </SummarySectionText>
                          </SummarySectionHeaderContent>
                          <SummarySectionArrow
                            src={AccordionExpandIcon}
                            alt="toggle optional section"
                            expanded={sectionExpanded.optional}
                          />
                        </SummarySectionAccordionHeader>
                        <SummarySectionAccordionContent
                          isExpanded={sectionExpanded.optional}
                        >
                          <SummarySectionAccordionContentInner isExpanded={sectionExpanded.optional}>
                            {renderPolicies(groupedPlans.optional)}
                          </SummarySectionAccordionContentInner>
                        </SummarySectionAccordionContent>
                      </SummarySectionAccordionWrapper>
                    </SummarySectionContainer>
                  )}
                  {groupedPlans.flex.length > 0 && (
                    <SummarySectionContainer
                      ref={(el) => {
                        if (el) {
                          sectionAccordionRefs.current.set('flex', el);
                        } else {
                          sectionAccordionRefs.current.delete('flex');
                        }
                      }}
                      isExpanded={sectionExpanded.flex}
                      sectionType="flex"
                    >
                      <SummarySectionAccordionWrapper>
                        <SummarySectionAccordionHeader
                          isExpanded={sectionExpanded.flex}
                          onClick={() => toggleSection("flex")}
                        >
                          <SummarySectionHeaderContent>
                            <SummarySectionIconWrapper sectionType="flex">
                              <SummarySectionIcon
                                src={FlexIcon}
                                alt="Flex benefits"
                              />
                            </SummarySectionIconWrapper>
                            <SummarySectionText>
                              <SummarySectionTitle>
                                Flex Benefits
                              </SummarySectionTitle>
                              <SummarySectionSubtitle>
                                Flexible benefits you can customise to your needs
                              </SummarySectionSubtitle>
                            </SummarySectionText>
                          </SummarySectionHeaderContent>
                          <SummarySectionArrow
                            src={AccordionExpandIcon}
                            alt="toggle flex section"
                            expanded={sectionExpanded.flex}
                          />
                        </SummarySectionAccordionHeader>
                        <SummarySectionAccordionContent
                          isExpanded={sectionExpanded.flex}
                        >
                          <SummarySectionAccordionContentInner isExpanded={sectionExpanded.flex}>
                            {renderPolicies(groupedPlans.flex)}
                          </SummarySectionAccordionContentInner>
                        </SummarySectionAccordionContent>
                      </SummarySectionAccordionWrapper>
                    </SummarySectionContainer>
                  )}
                </SummarySectionsWrapper>
              </CommonSummaryContainer>
            </SelectedPlansWrapper>
          
            {displayDeclarations.length > 0 && !isViewOnly && (
              <DeclarationSection>
                <DeclarationTitle>
                  {DECLARATION_DATA.title}
                  <DeclarationHelperText>
                    (Please check all the required disclaimers below to confirm enrolment.)
                  </DeclarationHelperText>
                </DeclarationTitle>
                <DeclarationContent>
                  {displayDeclarations.map((item) => {
                    const isChecked = item.refs.every(
                      (ref) =>
                        checkedDeclarations[ref.policyId]?.[ref.index] || false,
                    );
                    const isDisabled =
                      isViewOnly ||
                      item.refs.some(
                        (ref) =>
                          plans.find(
                            (plan) => String(plan.policyId) === ref.policyId,
                          )?.status === PolicyStatus.LOCKED,
                      );
                    return (
                      <DeclarationPoint key={item.content}>
                        <DeclarationCheckbox
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            handleGroupDeclarationChange(item.refs, !isChecked)
                          }
                          disabled={isDisabled}
                        />
                        <DeclarationPointLabel>
                          {item.isMandatory ? (
                            <span
                              style={{
                                color: "#e20f13",
                                fontSize: "1.4em",
                                fontWeight: 700,
                              }}
                            >
                              *{" "}
                            </span>
                          ) : (
                            ""
                          )}
                          {withBoldInstallments(item.content)}
                        </DeclarationPointLabel>
                      </DeclarationPoint>
                    );
                  })}
                </DeclarationContent>
              </DeclarationSection>
            )}

            {isViewOnly && storedDisclaimers && storedDisclaimers.length > 0 && (
              <DeclarationSection>
                <DeclarationTitle>
                  {DECLARATION_DATA.title}
                  <DeclarationHelperText>
                    (Please check all the required disclaimers below to continue.)
                  </DeclarationHelperText>
                </DeclarationTitle>
                <DeclarationContent>
                  {storedDisclaimers.map((d, idx) => (
                    <DeclarationPoint key={idx}>
                      <DeclarationCheckbox
                        type="checkbox"
                        checked={true}
                        onChange={() => {}}
                        disabled={true}
                      />
                      <DeclarationPointLabel>
                        {d.isMandatory ? (
                          <span
                            style={{
                              color: "#e20f13",
                              fontSize: "1.4em",
                              fontWeight: 700,
                            }}
                          >
                            *{" "}
                          </span>
                        ) : (
                          ""
                        )}
                        {withBoldInstallments(d.text)}
                      </DeclarationPointLabel>
                    </DeclarationPoint>
                  ))}
                </DeclarationContent>
              </DeclarationSection>
            )}
          </MainContainer>

          <ButtonContainer>
            <div>
              <CommonButton
                variant="gradient-outlined"
                buttonType="primary"
                label={BACK}
                onClick={onBack}
              />
                {!isViewOnly && (
                  <CommonButton
                    variant="gradient-outlined"
                    buttonType="primary"
                    label={SAVE_EXIT}
                    onClick={() => handleSave("save")}
                  />
                )}
              {!isViewOnly && (
                  <CommonButton
                    variant="gradient"
                    buttonType="primary"
                    label={CONFIRM_ENROLLMENT}
                    onClick={onContinue}
                    loading={loading}
                    disabled={loading || !areAllDeclarationsChecked}
                  />
              )}
            </div>
          </ButtonContainer>
        </Container>
      )}
    </ViewSummaryContainer>
  );
};

export default MultiEnrollmentSummary;
