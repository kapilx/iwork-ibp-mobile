import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Alert, Box, IconButton, Typography } from "@mui/material";
import { ShieldCheck } from "lucide-react";
import { ArrowBackIosNew, ErrorOutline } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import {
  apiRequest,
  endPoints,
  formatAmountWithCurrency,
  LocalizationConfig,
  useApiQuery,
  useLocalization,
} from "@ui/ui-lib";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { RootState } from "../../redux/store";
import { setToastMessage } from "../../redux/slice";
import { policyTypeKeys } from "../../components/WelllnessBenefitSection/constants";
import { ClaimsIntimationSummary } from "./ClaimsIntimationStepper/ClaimsIntimationSummary";
import { ClaimTypeSelector } from "./ClaimsIntimationStepper/ClaimTypeSelector";
import { PolicyDetailsStep } from "./ClaimsIntimationStepper/PolicyDetailsStep";
import { DiagnosisClaimStep } from "./ClaimsIntimationStepper/DiagnosisClaimStep";
import { HospitalDetailsStep } from "./ClaimsIntimationStepper/HospitalDetailsStep";
import { TpaExtraFieldsSection } from "./ClaimsIntimationStepper/TpaExtraFieldsSection";
import {
  buildInitialClaimsIntimationValues,
  getClaimTypeLabel,
  getDiagnosisClaimConfig,
  getHospitalDetailsConfig,
  getSubmitClaimConfig,
  getPolicyTypeLabel,
  normalizeSelectableDependentId,
} from "./ClaimsIntimationStepper/config";
import {
  ClaimsIntimationFormValues,
  ClaimsSummaryState,
} from "./ClaimsIntimationStepper/types";
import {
  CASHLESS_DOCUMENT_TYPES,
  REIMBURSEMENT_DOCUMENT_TYPES,
  ClaimDocumentsSection,
  isDocumentRequired,
} from "./ClaimsIntimationStepper/ClaimDocumentsSection";
import {
  FooterBarContent,
  FooterSpacer,
  FlowLayout,
  FooterActions,
  FooterBar,
  FooterButton,
  HospitalIntroDescription,
  HospitalIntroSection,
  HospitalIntroTitle,
  MainCard,
  SummaryDock,
  StepItem,
  StepIconImage,
  StepLabel,
  StepContent,
  StepConnector,
  StepNode,
  StepperHeader,
  StepperHeaderContent,
  StepperInner,
  StepperShell,
  StepperTitle,
  StepperTrack,
} from "./ClaimsIntimationStepper/styles";
import policyDetailsActiveIcon from "../../assets/svgs/policy-details-active.svg";
import policyDetailsCompletedIcon from "../../assets/svgs/policy-details-completed.svg";
import diagnosisActiveIcon from "../../assets/svgs/diagnosis-active.svg";
import diagnosisCompletedIcon from "../../assets/svgs/diagnosis-completed.svg";
import diagnosisInactiveIcon from "../../assets/svgs/diagnosis-inactive.svg";
import hospitalActiveIcon from "../../assets/svgs/hospital-active.svg";
import hospitalCompletedIcon from "../../assets/svgs/hospital-completed.svg";
import hospitalInactiveIcon from "../../assets/svgs/hospital-inactive.svg";
const STEP_ICONS = [
  {
    active: policyDetailsActiveIcon,
    completed: policyDetailsCompletedIcon,
    inactive: policyDetailsActiveIcon,
  },
  {
    active: diagnosisActiveIcon,
    completed: diagnosisCompletedIcon,
    inactive: diagnosisInactiveIcon,
  },
  {
    active: hospitalActiveIcon,
    completed: hospitalCompletedIcon,
    inactive: hospitalInactiveIcon,
  },
  {
    // Submit Claim (4th step, MULTI-flow TPAs only) — reuses the hospital icon's
    // pictograph (no dedicated asset for this step), but with the same solid-green
    // completed variant as step 3 for visual consistency once past this step too.
    active: hospitalActiveIcon,
    completed: hospitalCompletedIcon,
    inactive: hospitalInactiveIcon,
  },
];

const formatDisplayDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = date.getDate();
  const suffix =
    day > 3 && day < 21
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ||
        "th";

  return `${day}${suffix} ${date.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  })}`;
};

const formatDisplayAmount = (
  value?: string | number,
  localization?: LocalizationConfig
) => {
  if (value === undefined || value === null || value === "") return "";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${formatAmountWithCurrency(amount, localization)}`;
};

interface ClaimsIntimationProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const ClaimsIntimation: React.FC<ClaimsIntimationProps> = ({
  onClose,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { localizationData } = useLocalization();
  const locationState = location.state as {
    ocrData?: Record<string, any>;
    ocrFullData?: Record<string, any>;
    ocrOriginalData?: Record<string, any>;
    ocrFileName?: string;
    // Set when arriving via Claims Corner's "Continue Submission" for a claim
    // already sitting in INTIMATED status — jumps straight to the Submit Claim step.
    resumeClaimId?: number | string;
    resumeEmployeeId?: number | string;
    resumePolicyId?: number | string;
  } | null;
  const ocrPrefill = locationState?.ocrData ?? null;
  const ocrFullData = locationState?.ocrFullData ?? null;
  const ocrOriginalData = locationState?.ocrOriginalData ?? null;
  const ocrFileName = locationState?.ocrFileName ?? null;
  const ocrApplied = useRef(false);
  const [ocrBannerVisible, setOcrBannerVisible] = useState(!!ocrPrefill);
  const isResumeMode = Boolean(locationState?.resumeClaimId);
  const [activeStep, setActiveStep] = useState(0);
  // Populated once Intimate Claim succeeds (or immediately, if resuming a claim
  // that's already INTIMATED) — the id submitClaim() needs to complete the claim.
  const [intimatedClaimId, setIntimatedClaimId] = useState<number | string | null>(
    locationState?.resumeClaimId ?? null
  );
  const [isIntimating, setIsIntimating] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const resumeAppliedRef = useRef(false);
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const formMethods = useForm<ClaimsIntimationFormValues>({
    defaultValues: buildInitialClaimsIntimationValues(userDetails.id, []),
    mode: "onChange",
  });
  const [selectedClaimType, setSelectedClaimType] = useState<string>("");
  const [liveFormValues, setLiveFormValues] = useState<
    Partial<ClaimsIntimationFormValues>
  >({});
  const handleFormValuesChange = useCallback((values: any) => {
    const nextValues = { ...(values || {}) };
    setLiveFormValues((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(nextValues)) {
        return prev;
      }
      return nextValues;
    });
  }, []);
  const [policyIds, setPolicyIds] = useState<any[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<
    string | number | null
  >(null);
  const { mutate: uploadClaims } = useApiMutation({});
  // The "Claim Intimation Confirmation" email used to be triggered from here,
  // immediately on intimateClaim's success — but intimateClaim now returns
  // success as soon as the claim is saved/queued, BEFORE the TPA has been
  // contacted (see ClaimTpaSubmissionJob/deliverIntimationJob). Firing the
  // "Successfully Intimated" email at that point would claim TPA acceptance
  // that hasn't happened yet. The email is now sent server-side, from
  // deliverIntimationJob, only once the TPA has genuinely accepted the claim
  // — see company-employee.service.ts. Do not re-add a frontend trigger here
  // without also removing the backend one, or the employee gets it twice.
  const { mutate: submitClaimMutation } = useApiMutation({});
  const employeeId = userDetails?.id;
  const { data: claimsOverviewResponse } = useApiQuery({
    queryKey: ["claimsIntimationOverview", employeeId],
    url: employeeId ? endPoints.employeeClaimsOverview(employeeId) : "",
    enabled: Boolean(employeeId),
  });
  const claimsOverviewPolicies: any[] = useMemo(() => {
    const data =
      (claimsOverviewResponse as any)?.data?.data ??
      (claimsOverviewResponse as any)?.data;
    return Array.isArray(data?.policies) ? data.policies : [];
  }, [claimsOverviewResponse]);

  const { data: employeeDetailsForClaims } = useApiQuery({
    queryKey: ["employeeDetailsForClaims", employeeId],
    url: employeeId ? endPoints.employeeDetails : "",
    enabled: Boolean(employeeId),
  });

  const { data: employeePoliciesData } = useApiQuery({
    queryKey: ["employeePoliciesForClaimsIntimation", employeeId],
    url: employeeId ? endPoints.employeePolicies(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  // Resolves whether the selected policy's TPA needs the MULTI-step (intimate then
  // submit) flow or the SINGLE combined form (today's behaviour, unchanged for most
  // TPAs). Drives the extra benefitType field and where the user goes after submit.
  const { data: claimFlowModeResponse } = useApiQuery({
    queryKey: ["claimFlowMode", selectedPolicyId],
    url: selectedPolicyId ? endPoints.claimFlowMode(selectedPolicyId) : "",
    enabled: Boolean(selectedPolicyId),
  });
  const claimFormType: "SINGLE" | "MULTI" = useMemo(() => {
    const data = (claimFlowModeResponse as any)?.data?.data ?? (claimFlowModeResponse as any)?.data;
    return data?.claimFormType === "MULTI" ? "MULTI" : "SINGLE";
  }, [claimFlowModeResponse]);
  // Whether THIS TPA's own configured payload template references a discharge date at
  // each stage (e.g. ISBS needs it at intimation, FHPL at submission) — purely
  // data-driven from getClaimFlowMode, not hardcoded per TPA here.
  const { requiresDischargeAtIntimation, requiresDischargeAtSubmission } = useMemo(() => {
    const data = (claimFlowModeResponse as any)?.data?.data ?? (claimFlowModeResponse as any)?.data;
    return {
      requiresDischargeAtIntimation: Boolean(data?.requiresDischargeAtIntimation),
      requiresDischargeAtSubmission: data?.requiresDischargeAtSubmission ?? true,
    };
  }, [claimFlowModeResponse]);

  // Resuming a claim already sitting in INTIMATED status (from Claims Corner's
  // "Continue Submission") — set the policy so claimFormType/stepMeta resolve
  // correctly, then jump straight to the last (Submit Claim) step once it's a MULTI
  // TPA. Steps 1-3 are skipped, not re-populated — submitClaim() only needs
  // intimatedClaimId + this step's own fields, not the original intimation data.
  useEffect(() => {
    if (!isResumeMode || resumeAppliedRef.current) return;
    if (locationState?.resumePolicyId) {
      formMethods.setValue("policyId", locationState.resumePolicyId, { shouldValidate: false, shouldDirty: false });
      setSelectedPolicyId(locationState.resumePolicyId);
    }
  }, [isResumeMode, locationState?.resumePolicyId, formMethods]);

  useEffect(() => {
    if (!isResumeMode || resumeAppliedRef.current) return;
    if (claimFormType === "MULTI") {
      resumeAppliedRef.current = true;
      setActiveStep(3);
    }
  }, [isResumeMode, claimFormType]);

  const isEnrollmentWindowOpen = useMemo(() => {
    const policiesPayload =
      (employeePoliciesData as any)?.data?.data ??
      (employeePoliciesData as any)?.data ??
      null;
    const allPolicies: any[] = [
      ...(policiesPayload?.employeePolicies ?? []),
      ...(policiesPayload?.enrolledPolicies ?? []),
    ];
    if (!allPolicies.length) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allPolicies.some((policy: any) => {
      const endDate = policy?.enrollmentEndDate ? new Date(policy.enrollmentEndDate) : null;
      if (!endDate || isNaN(endDate.getTime())) return false;
      const isWindowOpen = today <= endDate;
      const isEnrolled = policy?.employeeEnrollmentStatusKey === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";
      return isWindowOpen || !isEnrolled;
    });
  }, [employeePoliciesData]);

  // Build policyId → enrollmentStatusKey map from the employee details API
  // (relationConstraints does NOT carry employeeEnrollmentStatusKey)
  const enrollmentStatusMap = useMemo(() => {
    const payload =
      (employeeDetailsForClaims as any)?.data?.data ??
      (employeeDetailsForClaims as any)?.data ??
      employeeDetailsForClaims ?? null;
    const map = new Map<string, string>();
    const employeePolicies: any[] = payload?.employeePolicies ?? [];
    employeePolicies.forEach((p: any) => {
      if (p?.policyId && p?.employeeEnrollmentStatusKey) {
        map.set(String(p.policyId), p.employeeEnrollmentStatusKey);
      }
    });
    // Also check policyEnrollmentStatuses as a fallback
    if (map.size === 0) {
      const statuses: any[] = payload?.policyEnrollmentStatuses ?? [];
      statuses.forEach((p: any) => {
        if (p?.policyId && p?.employeeEnrollmentStatusKey) {
          map.set(String(p.policyId), p.employeeEnrollmentStatusKey);
        }
      });
    }
    return map;
  }, [employeeDetailsForClaims]);

  const enrollmentEndDateMap = useMemo(() => {
    const payload =
      (employeeDetailsForClaims as any)?.data?.data ??
      (employeeDetailsForClaims as any)?.data ??
      employeeDetailsForClaims ?? null;
    const map = new Map<string, string>();
    const employeePolicies: any[] = payload?.employeePolicies ?? [];
    employeePolicies.forEach((p: any) => {
      if (p?.policyId && p?.enrollmentEndDate) {
        map.set(String(p.policyId), p.enrollmentEndDate);
      }
    });
    return map;
  }, [employeeDetailsForClaims]);

  const relationConstraints = useSelector(
    (state: RootState) => state.policyData.relationDependentData
  );

  useEffect(() => {
    if (!Array.isArray(relationConstraints)) return;

    const policies = relationConstraints.map((policy: any) => ({
      policyId: policy?.policyId,
      policyName: policy?.policyName,
      policyTypeKey: policy?.policyTypeKey,
      employeeEnrollmentStatusKey: enrollmentStatusMap.get(String(policy?.policyId)) ?? null,
      enrollmentEndDate: enrollmentEndDateMap.get(String(policy?.policyId)) ?? null,
    }));
    setPolicyIds(policies);

    const allDependents = relationConstraints.flatMap(
      (policy: any) => policy?.configuration?.dependents || []
    );
    const seen = new Set();
    setDependents(
      allDependents.filter((dep: any) => {
        if (!dep.isEnrolledForPolicy) return false;
        const key = `${dep.name}|${dep.gender}|${dep.dob}|${dep.relation}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
    );
  }, [relationConstraints, enrollmentStatusMap, enrollmentEndDateMap]);

  useEffect(() => {
    if (!formMethods) return;

    const subscription = formMethods.watch((values, { name }) => {
      if (name !== "policyId") return;
      const nextPolicyId = values?.policyId ?? null;
      setSelectedPolicyId(nextPolicyId);

      if (nextPolicyId && Array.isArray(relationConstraints)) {
        const selectedPolicy = relationConstraints.find(
          (policy: any) => String(policy?.policyId) === String(nextPolicyId)
        );
        const policyDependents =
          selectedPolicy?.configuration?.dependents || [];
        const seen = new Set();
        const filteredDependents = policyDependents.filter((dep: any) => {
          if (!dep.isEnrolledForPolicy) return false;
          const key = `${dep.name}|${dep.gender}|${dep.dob}|${dep.relation}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setDependents(filteredDependents);
        const currentDependentId = values?.dependentId;
        const isCurrentDependentValid =
          currentDependentId === "self" ||
          filteredDependents.some(
            (dep: any) => String(dep?.id) === String(currentDependentId)
          );
        if (!isCurrentDependentValid) {
          formMethods.setValue("dependentId", "", {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }

      const policy = policyIds.find(
        (item) => String(item?.policyId) === String(nextPolicyId)
      );
      const isGmc = policy?.policyTypeKey?.includes("POLICY_TYPE_GMC");
      if (!isGmc) {
        formMethods.setValue("claimType", "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        setSelectedClaimType("");
        formMethods.clearErrors("claimType");
        formMethods.setValue("hospitalName", "");
        formMethods.setValue("hospitalLocation", "");
        formMethods.setValue("state", "");
        formMethods.setValue("city", "");
        formMethods.setValue("pincode", "");
        formMethods.setValue("country", "");
        formMethods.setValue("emailOrPhoneNumber", "");
        formMethods.setValue("hospitalEmail", "");
        formMethods.setValue("hospitalPhoneNumber", "");
        formMethods.setValue("dateOfAdmission", "");
        formMethods.setValue("proposedDischargeDate", "");
        formMethods.setValue("placeOfAccident", "");
      }
    });

    return () => subscription.unsubscribe();
  }, [formMethods, policyIds, relationConstraints]);

  useEffect(() => {
    if (!formMethods || policyIds.length === 0) return;
    const currentPolicyId = formMethods.getValues("policyId");
    if (currentPolicyId) {
      setSelectedPolicyId(currentPolicyId);
      return;
    }

    const defaultPolicyId =
      policyIds.find(
        (policy: any) => policy?.policyTypeKey?.includes("POLICY_TYPE_GMC")
      )?.policyId ??
      policyIds[0]?.policyId ??
      null;
    if (!defaultPolicyId) return;

    formMethods.setValue("policyId", defaultPolicyId, {
      shouldValidate: true,
      shouldDirty: false,
      shouldTouch: false,
    });
    setSelectedPolicyId(defaultPolicyId);
  }, [formMethods, policyIds]);

  useEffect(() => {
    const currentClaimType = formMethods.getValues("claimType");
    if (currentClaimType) {
      setSelectedClaimType(currentClaimType);
    }
  }, [formMethods]);

  useEffect(() => {
    const employeeIdValue = userDetails?.employeeId || userDetails?.id || "";
    formMethods.setValue("employeeId", employeeIdValue, {
      shouldValidate: false,
      shouldDirty: false,
      shouldTouch: false,
    });
    // if (!formMethods.getValues("dependentId")) {
    //   formMethods.setValue("dependentId", "self", {
    //     shouldValidate: false,
    //     shouldDirty: false,
    //     shouldTouch: false,
    //   });
    // }
  }, [formMethods, userDetails?.employeeId, userDetails?.id]);

  const showMedicalFields = useMemo(() => {
    if (!selectedPolicyId) return false;
    const policy = policyIds.find(
      (item) => String(item?.policyId) === String(selectedPolicyId)
    );
    return policy?.policyTypeKey?.includes("POLICY_TYPE_GMC");
  }, [policyIds, selectedPolicyId]);

  const hospitalPolicyIds = useMemo(() => {
    if (!selectedPolicyId) return [];
    const selected = policyIds.find(
      (item) => String(item?.policyId) === String(selectedPolicyId)
    );
    if (selected?.policyTypeKey?.includes("TOP-UP")) {
      return policyIds
        .filter((p) => p?.policyTypeKey?.includes("POLICY_TYPE_GMC"))
        .map((p) => p.policyId);
    }
    return [selectedPolicyId];
  }, [policyIds, selectedPolicyId]);

  const watchedPolicyId = formMethods.watch("policyId");

  // Apply OCR-extracted values once after the default policy is auto-selected.
  // We wait for watchedPolicyId so the policy-change effect (which clears fields
  // for non-GMC policies) has already run before we write our values.
  useEffect(() => {
    if (!ocrPrefill || ocrApplied.current || !watchedPolicyId) return;
    ocrApplied.current = true;

    if (ocrPrefill.diagnosis)
      formMethods.setValue("diagnosis", String(ocrPrefill.diagnosis), { shouldDirty: true, shouldValidate: true });
    if (ocrPrefill.estimatedClaimAmount != null)
      formMethods.setValue("estimatedClaimAmount", ocrPrefill.estimatedClaimAmount, { shouldDirty: true, shouldValidate: true });
    if (ocrPrefill.dateOfAdmission)
      formMethods.setValue("dateOfAdmission", String(ocrPrefill.dateOfAdmission), { shouldDirty: true, shouldValidate: true });
    if (ocrPrefill.proposedDischargeDate)
      formMethods.setValue("proposedDischargeDate", String(ocrPrefill.proposedDischargeDate), { shouldDirty: true, shouldValidate: true });
    if (ocrPrefill.hospitalName)
      formMethods.setValue("hospitalName", String(ocrPrefill.hospitalName), { shouldDirty: true, shouldValidate: true });
    if (ocrPrefill.hospitalLocation)
      formMethods.setValue("hospitalLocation", String(ocrPrefill.hospitalLocation), { shouldDirty: true, shouldValidate: true });
    if (ocrPrefill.placeOfAccident)
      formMethods.setValue("placeOfAccident", String(ocrPrefill.placeOfAccident), { shouldDirty: true, shouldValidate: true });
    if (ocrPrefill.claimType === "CASHLESS" || ocrPrefill.claimType === "REIMBURSEMENT") {
      formMethods.setValue("claimType", ocrPrefill.claimType, { shouldDirty: true, shouldValidate: true });
      setSelectedClaimType(ocrPrefill.claimType);
    }
    if (String(ocrPrefill.patientRelation ?? "").toUpperCase() === "SELF") {
      formMethods.setValue("dependentId", "self", { shouldDirty: true, shouldValidate: true });
    }
  }, [ocrPrefill, watchedPolicyId, formMethods]);

  const selectedPolicy = useMemo(
    () =>
      policyIds.find(
        (item) =>
          String(item?.policyId) === String(watchedPolicyId ?? selectedPolicyId)
      ),
    [policyIds, selectedPolicyId, watchedPolicyId]
  );

  const selectedPolicySumInsured = useMemo(() => {
    if (!selectedPolicyId || claimsOverviewPolicies.length === 0) return undefined;
    const match = claimsOverviewPolicies.find(
      (p: any) => String(p?.policyId) === String(selectedPolicyId)
    );
    return match?.sumInsured ?? undefined;
  }, [claimsOverviewPolicies, selectedPolicyId]);

  const watchedDateOfAdmission = formMethods.watch("dateOfAdmission");

  const currentStepConfig = useMemo(() => {
    if (activeStep === 1)
      return getDiagnosisClaimConfig(selectedPolicy?.policyTypeKey, selectedPolicySumInsured, watchedDateOfAdmission, claimFormType === "MULTI", requiresDischargeAtIntimation, localizationData?.data);
    if (activeStep === 2) return getHospitalDetailsConfig(showMedicalFields);
    if (activeStep === 3 && claimFormType === "MULTI") return getSubmitClaimConfig(watchedDateOfAdmission, requiresDischargeAtSubmission, localizationData?.data);
    return [];
  }, [activeStep, selectedPolicy?.policyTypeKey, selectedPolicySumInsured, showMedicalFields, watchedDateOfAdmission, claimFormType, requiresDischargeAtIntimation, requiresDischargeAtSubmission, localizationData]);

  const sortedPolicies = useMemo(() => {
    const priority: Record<string, number> = {
      POLICY_TYPE_GMC: 1,
      "POLICY_TYPE_GMC_TOP-UP": 2,
      POLICY_TYPE_GPA: 3,
      POLICY_TYPE_GTL: 4,
    };
    return policyIds
      .filter((policy) => policy?.policyTypeKey !== policyTypeKeys.GTL)
      .slice()
      .sort((a, b) => {
        return (
          (priority[a?.policyTypeKey] ?? 999) -
          (priority[b?.policyTypeKey] ?? 999)
        );
      });
  }, [policyIds]);

  const allEnrolledPoliciesCount = useMemo(() => {
    const relationData = Array.isArray(relationConstraints)
      ? relationConstraints
      : [];
    const uniquePolicyIds = new Set(
      relationData
        .map((policy: any) => Number(policy?.policyId))
        .filter((id: number) => Number.isFinite(id)),
    );
    if (uniquePolicyIds.size > 0) return uniquePolicyIds.size;
    return policyIds.length;
  }, [policyIds.length, relationConstraints]);

  const intimateForOptions = useMemo(() => {
    const relationData = Array.isArray(relationConstraints)
      ? relationConstraints
      : [];
    const dependentPolicyCountMap = relationData.reduce(
      (acc: Record<string, number>, policy: any) => {
        const policyDependents = policy?.configuration?.dependents || [];
        const uniqueKeysForPolicy = new Set<string>();
        policyDependents.forEach((dep: any) => {
          const key = `${dep?.name || ""}|${dep?.relation || ""}|${
            dep?.dateOfBirth || dep?.dob || ""
          }|${dep?.gender || ""}`;
          uniqueKeysForPolicy.add(key.toLowerCase());
        });
        uniqueKeysForPolicy.forEach((key) => {
          acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
      },
      {}
    );

    const selfOption = {
      id: "self",
      name: userDetails?.employeeName || "Self",
      relation: "Self",
      dob: userDetails?.dateOfBirth || "",
      enrolledPoliciesCount: allEnrolledPoliciesCount,
    };

    const dependentOptions = dependents.map((dep: any) => {
      const key = `${dep?.name || ""}|${dep?.relation || ""}|${
        dep?.dateOfBirth || dep?.dob || ""
      }|${dep?.gender || ""}`.toLowerCase();
      return {
        id: dep?.id,
        name: dep?.name || "Dependent",
        relation: dep?.relation || dep?.relationshipType || "--",
        dob: dep?.dateOfBirth || dep?.dob || "",
        enrolledPoliciesCount: dependentPolicyCountMap[key] || 0,
      };
    });

    return [selfOption, ...dependentOptions];
  }, [
    dependents,
    relationConstraints,
    sortedPolicies.length,
    allEnrolledPoliciesCount,
    userDetails?.dateOfBirth,
  ]);

  const watchedDependentId = formMethods.watch("dependentId");

  const stepThreeTitle = showMedicalFields ? "Hospital Details" : "Claim Documents";
  const stepThreeDescription = showMedicalFields
    ? "Select the hospital where treatment will be provided"
    : "Upload the required claim supporting documents";
  const isClaimTypeRequired =
    selectedPolicy?.policyTypeKey?.includes("POLICY_TYPE_GMC");
  const isGpaPolicy = selectedPolicy?.policyTypeKey === policyTypeKeys.GPA;
  const stepMeta = useMemo(
    () => [
      { label: "Policy Details" },
      { label: isGpaPolicy ? "Accident Details" : "Diagnosis & Claim" },
      // MULTI-flow TPAs upload documents at the separate Submit Claim step instead, so
      // step 3 here is just the hospital details.
      { label: claimFormType === "MULTI" ? "Hospital Details" : "Hospital details/Document upload" },
      ...(claimFormType === "MULTI" ? [{ label: "Submit Claim" }] : []),
    ],
    [isGpaPolicy, claimFormType]
  );

  const handlePolicySelect = (policyId: string | number) => {
    formMethods.setValue("policyId", policyId, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleIntimateForSelect = (dependentId: string | number) => {
    formMethods.setValue("dependentId", dependentId, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const summary = useMemo<ClaimsSummaryState>(() => {
    const values = {
      ...(formMethods?.getValues?.() ?? {}),
      ...(liveFormValues ?? {}),
    };
    const selectedDependentId = values?.dependentId ?? watchedDependentId ?? null;
    const selectedDependent =
      selectedDependentId === "self" || selectedDependentId === null
        ? null
        : dependents.find(
            (dep: any) => String(dep.id) === String(selectedDependentId)
          ) || null;
    const claimantName =
      selectedDependentId === "self"
        ? userDetails?.employeeName || "Self"
        : !selectedDependentId
        ? "--"
        : selectedDependent?.name || "Selected Dependent";
    const claimantRelation =
      selectedDependentId === "self"
        ? "Self"
        : !selectedDependentId
        ? "--"
        : selectedDependent?.relation || "Dependent";

    const hospitalLocation = [
      values?.hospitalLocation,
      values?.city,
      values?.state,
      values?.pincode,
    ]
      .filter(Boolean)
      .join(", ");

      return {
        policyLabel: getPolicyTypeLabel(selectedPolicy),
        claimantName,
        claimantRelation,
        claimTypeLabel: getClaimTypeLabel(values?.claimType),
        diagnosis: values?.diagnosis || "",
        dateOfAdmission: formatDisplayDate(values?.dateOfAdmission),
        proposedDischargeDate: formatDisplayDate(values?.proposedDischargeDate),
        placeOfAccident: String(values?.placeOfAccident || values?.proposedDischargeDate || ""),
        estimatedClaimAmount: formatDisplayAmount(values?.estimatedClaimAmount, localizationData?.data),
        hospitalName: values?.hospitalName || "",
      hospitalLocation,
      documentsCount: (() => {
        const docsByType = values?.documentsByType;
        if (docsByType && typeof docsByType === "object") {
          return Object.values(docsByType).reduce((sum: number, docs: any) => {
            return sum + (Array.isArray(docs) ? docs.length : 0);
          }, 0);
        }
        return 0;
      })(),
    };
  }, [
    dependents,
    formMethods,
    liveFormValues,
    selectedPolicy,
    userDetails?.name,
    watchedDependentId,
    localizationData,
  ]);

  const isNonEmptyText = (value: unknown) =>
    String(value ?? "").trim().length > 0;

  const watchedDocumentsByType = (formMethods.watch("documentsByType") || {}) as Record<
    string,
    Array<{ documentId: number; fileUpload: { id: number; fileName: string } }>
  >;
  const watchedSubmissionDocumentsByType = (formMethods.watch("submissionDocumentsByType") || {}) as Record<string, any[]>;
  const watchedDiagnosis = formMethods.watch("diagnosis");
  const watchedEstimatedClaimAmount = formMethods.watch("estimatedClaimAmount");
  const watchedProposedDischargeDate = formMethods.watch("proposedDischargeDate");
  const watchedPlaceOfAccident = formMethods.watch("placeOfAccident");
  const watchedHospitalName = formMethods.watch("hospitalName");

  useEffect(() => {
    if (watchedProposedDischargeDate) {
      formMethods.trigger("proposedDischargeDate");
    }
  }, [watchedDateOfAdmission, formMethods, watchedProposedDischargeDate]);

  const isSelectedPolicyEnrolled =
    !selectedPolicy?.employeeEnrollmentStatusKey ||
    selectedPolicy?.employeeEnrollmentStatusKey === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";

  const isPolicyStepValid =
    isNonEmptyText(formMethods.watch("policyId")) &&
    isNonEmptyText(watchedDependentId) &&
    isSelectedPolicyEnrolled;

  const isDiagnosisStepValid = (() => {
    if (!isNonEmptyText(watchedDiagnosis)) return false;
    if (!isNonEmptyText(watchedEstimatedClaimAmount)) return false;
    if (
      selectedPolicySumInsured &&
      Number(watchedEstimatedClaimAmount) > selectedPolicySumInsured
    )
      return false;
    if (!isNonEmptyText(watchedDateOfAdmission)) return false;
    if (selectedPolicy?.policyTypeKey === policyTypeKeys.GPA) {
      return isNonEmptyText(watchedPlaceOfAccident);
    }
    // MULTI-flow TPAs collect discharge date later in Step 4, not here.
    if (claimFormType === "MULTI") return true;
    if (!isNonEmptyText(watchedProposedDischargeDate)) return false;
    if (watchedDateOfAdmission && watchedProposedDischargeDate) {
      const admission = new Date(watchedDateOfAdmission);
      const discharge = new Date(watchedProposedDischargeDate);
      if (!isNaN(admission.getTime()) && !isNaN(discharge.getTime()) && discharge <= admission) {
        return false;
      }
    }
    return true;
  })();

  const activeDocumentTypes =
    selectedClaimType === "CASHLESS"
      ? CASHLESS_DOCUMENT_TYPES
      : REIMBURSEMENT_DOCUMENT_TYPES;

  const requiredDocTypes = activeDocumentTypes.filter((config) => {
    if (config.required === true) return true;
    if (typeof config.required === "function") {
      return config.required({ placeOfAccident: watchedPlaceOfAccident } as ClaimsIntimationFormValues);
    }
    return false;
  });

  const missingRequiredDocsCount = requiredDocTypes.filter(({ value }) => {
    const docs = watchedDocumentsByType[value];
    return !(Array.isArray(docs) && docs.length > 0);
  }).length;

  // Step 4 (Submit Claim) reuses the same CASHLESS/REIMBURSEMENT document matrix as
  // Step 3, just against submissionDocumentsByType instead — so "required documents
  // uploaded" means the same thing here as it does there.
  const missingSubmissionRequiredDocsCount = requiredDocTypes.filter((config) => {
    if (!isDocumentRequired(config, formMethods.getValues())) return false;
    const docs = watchedSubmissionDocumentsByType[config.value];
    return !(Array.isArray(docs) && docs.length > 0);
  }).length;
  const hasSubmissionDocuments = missingSubmissionRequiredDocsCount === 0;

  // MULTI-flow TPAs don't accept documents at intimation — for GMC policies (where
  // Step 3 has hospital fields) ClaimDocumentsSection isn't rendered there, so don't
  // gate on it; documents move to Step 4 (ClaimDocumentsSection, reused there) instead. Non-GMC
  // policies (GPA/GTL) have no hospital step at all, so Step 3 IS the document upload
  // step regardless of claimFormType — never hide/bypass it there.
  const hideDocumentsAtHospitalStep = claimFormType === "MULTI" && showMedicalFields;
  const areSelectedDocumentsUploaded =
    hideDocumentsAtHospitalStep ? true : missingRequiredDocsCount === 0;

  const isHospitalStepValid = (() => {
    if (!showMedicalFields) {
      return areSelectedDocumentsUploaded;
    }
    return isNonEmptyText(watchedHospitalName) && areSelectedDocumentsUploaded;
  })();

  const validateHospitalStep = () => {
    if (!formMethods || !showMedicalFields) return true;

    const values = formMethods.getValues();

    if (!values?.hospitalName?.trim()) {
      formMethods.setError("hospitalName", {
        type: "required",
        message: "Hospital name is required",
      });
      return false;
    }

    formMethods.clearErrors("hospitalName");
    return true;
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      const values = formMethods.getValues();
      if (!values?.policyId) {
        formMethods.setError("policyId", {
          type: "required",
          message: "Please select a policy",
        });
        return;
      }
      if (
        values?.dependentId === undefined ||
        values?.dependentId === null ||
        values?.dependentId === ""
      ) {
        formMethods.setError("dependentId", {
          type: "required",
          message: "Please select who you are intimating for",
        });
        return;
      }
      formMethods.clearErrors("policyId");
      formMethods.clearErrors("dependentId");
      setActiveStep((prev) => Math.min(prev + 1, stepMeta.length - 1));
      return;
    }

    if (activeStep === 1 && isClaimTypeRequired) {
      const claimTypeValue = formMethods.getValues("claimType");
      if (!claimTypeValue) {
        formMethods.setError("claimType", {
          type: "required",
          message: "Please select a claim type",
        });
        return;
      }
      formMethods.clearErrors("claimType");
    }

    const valid = await formMethods.trigger();
    if (!valid) return;
    if (activeStep === 2 && !validateHospitalStep()) return;

    // MULTI-flow TPAs: "Continue" from step 3 (Hospital/Documents) actually calls
    // Intimate Claim — advancing to step 4 only happens inside its onSuccess, since
    // the claim isn't intimated yet at this point. SINGLE-flow TPAs never reach here
    // for step 2, since it's already their last step (shows "Submit", not "Continue").
    if (activeStep === 2 && claimFormType === "MULTI") {
      handleIntimateSubmit();
      return;
    }

    setActiveStep((prev) => Math.min(prev + 1, stepMeta.length - 1));
  };

  const handleBack = () => {
    // Resumed from Claims Corner straight into the Submit Claim step — steps 1-3
    // were never populated (the original intimation data isn't re-fetched), so
    // stepping back into them would show an empty/broken form. Leave via Claims
    // Corner instead, same as "Cancel" would.
    if (isResumeMode && isSubmitClaimStep) {
      navigate("/claims-corner");
      return;
    }
    if (activeStep === 0) {
      if (onClose) {
        onClose();
        return;
      }
      if (locationState?.ocrFileName || locationState?.ocrData) {
        navigate("/intimate-claim-via-docs", {
          state: {
            returnToStep: 1 as const,
            ocrData: locationState.ocrData,
            ocrFullData: locationState.ocrFullData,
            ocrOriginalData: locationState.ocrOriginalData,
            ocrFileName: locationState.ocrFileName,
          },
        });
        return;
      }
      navigate("/claims-corner");
      return;
    }
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveAndExit = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate("/claims-corner");
  };

  const handleClaimTypeChange = (value: string) => {
    console.log("handleClaimTypeChange called with:", value);
    setSelectedClaimType(value);
    if (!formMethods) return;
    formMethods.setValue(
      "claimType",
      value as ClaimsIntimationFormValues["claimType"],
      {
        shouldValidate: true,
        shouldDirty: true,
      }
    );
    formMethods.clearErrors("claimType");
    // Verify the value was set
    console.log("Form claimType after setValue:", formMethods.getValues("claimType"));
  };

  // Calls intimate-claim. For SINGLE-flow TPAs this is the whole claim (final —
  // navigates away on success, unchanged from before this feature existed). For
  // MULTI-flow TPAs this is only stage 1 — success advances to the in-page Submit
  // Claim step instead of navigating anywhere.
  const handleIntimateSubmit = () => {
    if (!formMethods) return;
    if (!validateHospitalStep()) return;
    // Clear any stale errors (e.g. hospitalLocation set by old validation)
    // so they don't silently block formMethods.handleSubmit from calling the callback
    formMethods.clearErrors();
    setIsIntimating(true);
    formMethods.handleSubmit(
      (data: ClaimsIntimationFormValues) => {
      console.log("Form data on submit:", data);
      console.log("claimType value:", data.claimType);
      console.log("selectedClaimType state:", selectedClaimType);

      const normalizedData: ClaimsIntimationFormValues = {
        ...data,
        dependentId: normalizeSelectableDependentId(data?.dependentId),
      };

      // Format dateOfAdmission as ISO 8601 if it exists
      let dateOfAdmission = "";
      if (normalizedData.dateOfAdmission) {
        const date = new Date(normalizedData.dateOfAdmission);
        if (!isNaN(date.getTime())) {
          dateOfAdmission = date.toISOString();
        }
      }

      let proposedDischargeDate = "";
      if (normalizedData.proposedDischargeDate) {
        const date = new Date(normalizedData.proposedDischargeDate);
        if (!isNaN(date.getTime())) {
          proposedDischargeDate = date.toISOString();
        }
      }

      // Create payload with only the fields the API expects
      const apiPayload = {
        policyId: normalizedData.policyId,
        employeeId: normalizedData.employeeId,
        dependentId: normalizedData.dependentId,
        diagnosis: normalizedData.diagnosis || "",
        estimatedClaimAmount: normalizedData.estimatedClaimAmount || "",
        ...(dateOfAdmission && { dateOfAdmission }),
        ...(proposedDischargeDate && { proposedDischargeDate }),
        ...(selectedPolicy?.policyTypeKey === policyTypeKeys.GPA &&
        normalizedData.placeOfAccident
          ? { placeOfAccident: normalizedData.placeOfAccident }
          : {}),
        hospitalName: normalizedData.hospitalName || "",
        hospitalLocation: normalizedData.hospitalLocation || "",
        hospitalId: normalizedData.hospitalId || null,
        ...(normalizedData.claimType
          ? { claimType: normalizedData.claimType }
          : {}),
        ...(normalizedData.benefitType
          ? { benefitType: normalizedData.benefitType }
          : {}),
        documentIds: (() => {
          const result: { documentId: number; documentType: string }[] = [];
          const docsByType = normalizedData?.documentsByType;
          if (docsByType && typeof docsByType === "object") {
            Object.entries(docsByType).forEach(([docType, docs]: [string, any]) => {
              if (!Array.isArray(docs)) return;
              docs.forEach((doc) => {
                const id = Number(doc?.documentId ?? doc?.fileUpload?.id);
                if (Number.isFinite(id)) {
                  result.push({ documentId: id, documentType: docType });
                }
              });
            });
          }
          return result;
        })(),
        ...(normalizedData.intimateExtraFields && Object.keys(normalizedData.intimateExtraFields).length
          ? { extraFields: normalizedData.intimateExtraFields }
          : {}),
      };

      // Backend handles ISBS BrokerClaimCreation internally before saving to DB
      uploadClaims(
        {
          endpoint: endPoints.uploadClaims,
          method: "POST",
          data: apiPayload,
        },
        {
          onSuccess: (response: any) => {
            if (ocrPrefill) {
              apiRequest(endPoints.claimFormSaveExtraction, {
                method: "POST",
                data: {
                  policyId: apiPayload.policyId ? Number(apiPayload.policyId) : null,
                  employeeId: apiPayload.employeeId ? Number(apiPayload.employeeId) : null,
                  fileName: ocrFileName ?? "",
                  claimData: ocrFullData ?? {},
                  aiResponseData: ocrOriginalData ?? null,
                },
              }).catch((err) => {
                console.error("Failed to save OCR claim form extraction:", err);
              });
            }
            onSuccess?.();
            setIsIntimating(false);

            // MULTI-flow TPAs (FHPL, Health India): the claim is only INTIMATED at
            // this point — the user may submit bills days later, on their own time.
            // Don't force them straight into Step 4; go to Claims Corner instead, same
            // as SINGLE-flow. Claims Corner shows a "Submit Claim" action on INTIMATED
            // (not yet SUBMITTED) claims that resumes straight into Step 4 later via
            // the existing resumeClaimId/resumeEmployeeId/resumePolicyId navigation.
            const responseData = response?.data?.data ?? response?.data ?? response;
            const returnedClaimFormType = responseData?.claimFormType;
            const returnedClaimId = responseData?.claimId;

            if (returnedClaimFormType === "MULTI" && returnedClaimId) {
              dispatch(setToastMessage("Claim intimated successfully. You can submit bills anytime from Claims Corner."));
              if (onClose) { onClose(); return; }
              navigate("/claims-corner");
              return;
            }

            dispatch(setToastMessage("Claim intimation submitted successfully."));
            if (onClose) { onClose(); return; }
            navigate("/claims-corner");
          },
          onError: (error: any) => {
            setIsIntimating(false);
            dispatch(
              setToastMessage(
                error?.response?.data?.message ||
                  error?.message ||
                  "Claim intimation submission failed. Please try again."
              )
            );
          },
        }
      );
    },
    (fieldErrors) => {
      setIsIntimating(false);
      const firstMessage = Object.values(fieldErrors)
        .map((e: any) => e?.message)
        .filter(Boolean)[0];
      dispatch(
        setToastMessage(
          firstMessage || "Please fill all required fields before submitting."
        )
      );
    }
    )();
  };

  // Step 4 (MULTI-flow only) — submits bank/discharge details + bills against the
  // claim intimated at step 3, via the separate submitClaim endpoint.
  const handleSubmitClaimStep = () => {
    if (!intimatedClaimId) {
      dispatch(setToastMessage("Missing claim reference — please intimate the claim again."));
      return;
    }
    const values = formMethods.getValues();
    const submissionDocs = values.submissionDocumentsByType || {};
    const documentIds = Object.entries(submissionDocs).flatMap(([docType, docs]) =>
      (docs || []).map((d: any) => ({ documentId: d.documentId, documentType: docType }))
    );
    if (documentIds.length === 0) {
      dispatch(setToastMessage("Please upload at least one document before submitting."));
      return;
    }

    setIsSubmittingClaim(true);
    submitClaimMutation(
      {
        endpoint: endPoints.submitClaim(intimatedClaimId, employeeId),
        method: "POST",
        data: {
          dateOfDischarge: values.dateOfDischargeActual || undefined,
          finalClaimedAmount: values.finalClaimedAmount ? Number(values.finalClaimedAmount) : undefined,
          payeeName: values.payeeName || undefined,
          bankAccountNo: values.bankAccountNo || undefined,
          accountType: values.accountType || undefined,
          ifscCode: values.ifscCode || undefined,
          documentIds,
          ...(values.submitExtraFields && Object.keys(values.submitExtraFields).length
            ? { extraFields: values.submitExtraFields }
            : {}),
        },
      },
      {
        onSuccess: () => {
          setIsSubmittingClaim(false);
          dispatch(setToastMessage("Claim submitted successfully."));
          if (onSuccess) onSuccess();
          if (onClose) { onClose(); return; }
          navigate("/claims-corner");
        },
        onError: (error: any) => {
          setIsSubmittingClaim(false);
          dispatch(
            setToastMessage(
              error?.response?.data?.message || error?.message || "Claim submission failed. Please try again."
            )
          );
        },
      }
    );
  };

  const isLastStep = activeStep === stepMeta.length - 1;
  const isSubmitClaimStep = activeStep === 3 && claimFormType === "MULTI";

  const submitHints: string[] = [];
  if (isLastStep && !isSubmitClaimStep) {
    if (showMedicalFields && !isNonEmptyText(watchedHospitalName)) {
      submitHints.push("Hospital name is required");
    }
    if (missingRequiredDocsCount > 0) {
      submitHints.push(
        `${missingRequiredDocsCount} required document${missingRequiredDocsCount > 1 ? "s" : ""} still pending`
      );
    }
  }
  if (isSubmitClaimStep && !hasSubmissionDocuments) {
    submitHints.push(
      `${missingSubmissionRequiredDocsCount} required document${missingSubmissionRequiredDocsCount > 1 ? "s" : ""} still pending`
    );
  }

  const employeeIdForHeader =
    formMethods.watch("employeeId") ||
    userDetails?.employeeId ||
    userDetails?.id ||
    "--";

  if (isEnrollmentWindowOpen) {
    return (
      <StepperShell>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, p: 4, textAlign: "center" }}>
          <ShieldCheck size={52} color="#093F84" strokeWidth={1.5} />
          <Typography sx={{ fontSize: 17, fontWeight: 600, color: "#1F2937", mt: 1 }}>
            Enrollment Window Not Yet Completed
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6B7280", maxWidth: 400, lineHeight: 1.8 }}>
            Your current policy enrollment window is not yet completed. Claim submission will be available once your enrollment is finalized.
          </Typography>
        </Box>
      </StepperShell>
    );
  }

  return (
    <StepperShell>
      <StepperInner>
        <StepperHeader>
          <StepperHeaderContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => navigate(-1)} sx={{ p: 0, color: "inherit" }}>
                <ArrowBackIosNew sx={{ fontSize: "inherit" }} />
              </IconButton>
              <StepperTitle sx={{ mb: 0 }}>{`${isSubmitClaimStep ? "Claim Submission" : "Claim Intimation"} - (Emp ID: ${employeeIdForHeader})`}</StepperTitle>
            </Box>
            <StepperTrack>
              {stepMeta.map((step, index) => {
                const completed = index < activeStep;
                const active = index === activeStep;
                const isLast = index === stepMeta.length - 1;
                const stepIcon = completed
                  ? STEP_ICONS[index].completed
                  : active
                  ? STEP_ICONS[index].active
                  : STEP_ICONS[index].inactive;
                return (
                  <StepItem key={step.label}>
                    <StepContent>
                      <StepNode completed={completed} active={active}>
                        <StepIconImage
                          src={stepIcon}
                          alt={`${step.label} step`}
                        />
                      </StepNode>
                      <StepLabel>{`${index + 1}. ${step.label}`}</StepLabel>
                    </StepContent>
                    {!isLast && <StepConnector completed={index < activeStep} />}
                  </StepItem>
                );
              })}
            </StepperTrack>
          </StepperHeaderContent>
        </StepperHeader>

        {ocrBannerVisible && ocrPrefill && (
          <Alert
            severity="info"
            onClose={() => setOcrBannerVisible(false)}
            sx={{ mx: 2, mt: 1.5 }}
          >
            Form fields have been pre-filled from your uploaded claim document — please review and correct anything before submitting.
          </Alert>
        )}

        {activeStep === 1 && (
          <DiagnosisClaimStep policyTypeKey={selectedPolicy?.policyTypeKey} />
        )}
        {activeStep === 2 && (
          <HospitalIntroSection>
            <HospitalIntroTitle>{stepThreeTitle}</HospitalIntroTitle>
            <HospitalIntroDescription>
              {stepThreeDescription}
            </HospitalIntroDescription>
          </HospitalIntroSection>
        )}
        {isSubmitClaimStep && (
          <HospitalIntroSection>
            <HospitalIntroTitle>Submit Claim</HospitalIntroTitle>
            <HospitalIntroDescription>
              Your claim was intimated successfully. Add discharge/bank details and upload bills to complete it.
            </HospitalIntroDescription>
          </HospitalIntroSection>
        )}
        <FlowLayout>
          <MainCard $activeStep={activeStep} $transparent={activeStep === 0}>
            {activeStep === 0 && (
              <PolicyDetailsStep
                policies={sortedPolicies}
                intimateForOptions={intimateForOptions}
                selectedPolicyId={selectedPolicyId}
                selectedIntimateForId={watchedDependentId ?? null}
                onPolicySelect={handlePolicySelect}
                onIntimateForSelect={handleIntimateForSelect}
              />
            )}

            {activeStep === 2 && (
              <>
                <HospitalDetailsStep
                  selectedPolicyId={selectedPolicyId}
                  hospitalPolicyIds={hospitalPolicyIds}
                  formMethods={formMethods}
                  showMedicalFields={showMedicalFields}
                  claimType={selectedClaimType || formMethods?.watch("claimType")}
                  hideDocuments={hideDocumentsAtHospitalStep}
                />
                <TpaExtraFieldsSection
                  formMethods={formMethods}
                  policyId={selectedPolicyId}
                  apiType="INTIMATE_CLAIM"
                  formFieldName="intimateExtraFields"
                />
              </>
            )}

            {activeStep === 1 && isClaimTypeRequired && (
              <ClaimTypeSelector
                value={selectedClaimType || formMethods?.watch("claimType")}
                onChange={handleClaimTypeChange}
                errorMessage={formMethods.formState.errors.claimType?.message}
              />
            )}

            {activeStep > 0 && (
              // <DynamicForm
              //   formConfig={currentStepConfig}
              //   defaultValues={buildInitialClaimsIntimationValues(
              //     userDetails.id,
              //     policyIds
              //   )}
              //   existingMethods={formMethods}
              //   variant="ibp"
              //   shouldReset={false}
              // />
              <DynamicForm
              formConfig={currentStepConfig}
              defaultValues={buildInitialClaimsIntimationValues(
                userDetails.id,
                policyIds
              )}
              existingMethods={formMethods}
              onValuesChange={handleFormValuesChange}
              variant="ibp"
              shouldReset={false}
            />
            )}

            {isSubmitClaimStep && (
              <>
                <TpaExtraFieldsSection
                  formMethods={formMethods}
                  policyId={selectedPolicyId}
                  apiType="SUBMIT_CLAIM"
                  formFieldName="submitExtraFields"
                />
                <ClaimDocumentsSection
                  formMethods={formMethods}
                  claimType={selectedClaimType || formMethods?.watch("claimType")}
                  title="Bills & Documents"
                  documentsFieldName="submissionDocumentsByType"
                  documentTypesFieldName="submissionDocumentTypes"
                />
              </>
            )}
          </MainCard>

          <SummaryDock $activeStep={activeStep}>
            <ClaimsIntimationSummary
              summary={summary}
              activeStep={activeStep}
              policyTypeKey={selectedPolicy?.policyTypeKey}
              isClaimTypeRequired={isClaimTypeRequired}
            />
          </SummaryDock>
        </FlowLayout>

        <FooterBar>
          <FooterBarContent>
            {isLastStep && submitHints.length > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "8px",
                  bgcolor: "#FEF2F2",
                  border: "1px solid #FECACA",
                }}
              >
                <ErrorOutline sx={{ fontSize: 16, color: "#DC2626", flexShrink: 0 }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                  {submitHints.map((hint, i) => (
                    <React.Fragment key={hint}>
                      {i > 0 && <Box component="span" sx={{ color: "#FCA5A5", fontSize: 12 }}>·</Box>}
                      <Box component="span" sx={{ fontSize: 12, color: "#DC2626", fontWeight: 500 }}>{hint}</Box>
                    </React.Fragment>
                  ))}
                </Box>
              </Box>
            ) : (
              <FooterSpacer />
            )}
            <FooterActions>
              <FooterButton variant="outlined" onClick={handleSaveAndExit}>
                Cancel
              </FooterButton>
              <FooterButton variant="outlined" onClick={handleBack}>
                Back
              </FooterButton>
              {isSubmitClaimStep ? (
                <FooterButton
                  variant="contained"
                  onClick={handleSubmitClaimStep}
                  disabled={!hasSubmissionDocuments || isSubmittingClaim}
                >
                  {isSubmittingClaim ? "Submitting…" : "Submit Claim"}
                </FooterButton>
              ) : isLastStep ? (
                <FooterButton
                  variant="contained"
                  onClick={handleIntimateSubmit}
                  disabled={
                    !areSelectedDocumentsUploaded ||
                    (showMedicalFields && !isNonEmptyText(watchedHospitalName)) ||
                    isIntimating
                  }
                >
                  {isIntimating ? "Submitting…" : "Submit"}
                </FooterButton>
              ) : (
                <FooterButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && !isPolicyStepValid) ||
                    (activeStep === 1 && !isDiagnosisStepValid) ||
                    (activeStep === 2 && !isHospitalStepValid) ||
                    isIntimating
                  }
                >
                  {activeStep === 2 && claimFormType === "MULTI"
                    ? (isIntimating ? "Intimating…" : "Intimate Claim")
                    : "Continue"}
                </FooterButton>
              )}
            </FooterActions>
          </FooterBarContent>
        </FooterBar>
      </StepperInner>
    </StepperShell>
  );
};

export default ClaimsIntimation;
