import { capitalizeFirst } from "../../utils";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, IconButton, Typography } from "@mui/material";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import dayjs from "dayjs";
import {
  AddDependentActionButton,
  BackButton,
  DependantsActionsGroup,
  DependantsSection,
  DependantsSectionHeader,
  DependantsSectionTitle,
  DependantsActionButton,
  DependantsTableCell,
  DependantsTableHeader,
  DependantsTableHeaderCell,
  DependantsTableRow,
  DependantsTableWrapper,
  DependentsEmptyText,
  DependentsFormActions,
  DependentsFormWrapper,
  DependentsSectionContainer,
  LogoutButton,
  ProfileContainer,
  ProfileHeader,
  ProfileHeaderActions,
  ProfileHeaderLeft,
  ProfileIcon,
  ProfileMetaItem,
  ProfileMetaLabel,
  ProfileMetaRow,
  ProfileMetaValue,
  ProfileName,
  ProfileNameRow,
  ProfileRole,
  ProfileSectionContainer,
  ProfileTitleBlock,
  ChangePasswordButton,
} from "./styles";
import {
  apiRequest,
  CustomModal,
  endPoints,
  formatDate,
  useApiQuery,
  fetchEmployeePolicies,
} from "@ui/ui-lib";
import departmentIcon from "../../../assets/svgs/technology-icon.svg";
import dateOfBirthIcon from "../../../assets/svgs/date-icon.svg";
import dateOfJoiningIcon from "../../../assets/svgs/logged-in-icon.svg";
import designationIcon from "../../../assets/svgs/employee-icon.svg";
import employeeIdIcon from "../../../assets/svgs/employee-id-icon.svg";
import maritalStatusIcon from "../../../assets/svgs/martial-status-icon.svg";
import genderIcon from "../../../assets/svgs/gender-icon.svg";
import EditIcon from "../../assets/svgs/edit-blue-color-icon.svg";
import DeleteRedIcon from "../../assets/svgs/delete-red.svg";
import eye from "../../assets/svgs/eye.svg";
import eyeSlash from "../../assets/svgs/eye-slash.svg";
import { useNavigate, useLocation } from "react-router-dom";
import EnrollmentChangePassword from "../EnrollmentChangePassword";
import ContactAddressSection from "../ContactAddressSection";
import { useDispatch, useSelector } from "react-redux";
import { clearPortalConfiguration } from "../../redux/portalConfigSlice";
import { LOGOUT } from "../../constants/index";
import { setToastMessage } from "../../redux/slice";
import { RootState } from "../../redux/store";
import {
  canSelectRelationship as canSelectRelationshipUtil,
  getAgeConstraintsForRelationship as getAgeConstraintsForRelationshipUtil,
  getRelationTypeForRelationship as getRelationTypeForRelationshipUtil,
} from "../Enrollment/EnrollmentFlow/utils/relationshipFilters";
import {
  calculateAgeFromDate,
  getDateLimits,
  parseDateString,
  validateDateOfBirth,
} from "../Enrollment/EnrollmentFlow/utils/dateValidations";

interface EmployeeDetailsResponse {
  data?: {
    employeeName?: string;
    employeeId?: string | number;
    companyEmployeeId?: string | number;
    dateOfBirth?: string;
    gender?: string;
    maritalStatus?: string;
    department?: string;
    designation?: string;
    role?: string;
    additionalDetails?: Record<string, string>;
    phone?: string;
    email?: string;
    dependents?: Array<any>;
  };
}
type PoliciesResponse = {
  data?: {
    employeePolicies?: Array<Record<string, unknown>>;
    enrolledPolicies?: Array<Record<string, unknown>>;
  };
};

const normalizeCombinedChoiceEntry = (choice: any) => ({
  id: Number.parseInt(choice.id, 10),
  sumInsured: Number(choice.sumInsured ?? 0),
  premium: Number(choice.premium ?? 0),
  companyPay: Number(choice.companyPay ?? choice.companyContribution ?? 0),
  employeePay: Number(choice.employeePay ?? choice.employeeContribution ?? 0),
  parentpolicyComponentActionTypeId:
    choice.parentpolicyComponentActionTypeId ?? null,
  policyComponentActionType: choice.policyComponentActionType,
  policyComponentActionTypeId: choice.policyComponentActionTypeId,
  policyComponentActionLabel: choice.policyComponentActionLabel,
});

// Builds a map of birth-event key → multiple-birth tag. Plain "Twin"/"Triplet" for a
// lone group of a type; numbered ("Twin 1", "Twin 2") when 2+ groups of that type exist.
const buildMultipleBirthLabels = (
  items: { key: string; order: number }[],
): Map<string, string> => {
  const counts = new Map<string, number>();
  const orderByKey = new Map<string, number>();
  items.forEach(({ key, order }) => {
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
    const existing = orderByKey.get(key);
    orderByKey.set(key, existing === undefined ? order : Math.min(existing, order));
  });
  const groupsByType = new Map<string, { key: string; order: number }[]>();
  counts.forEach((count, key) => {
    let type: string | null = null;
    if (count >= 3) type = "Triplet";
    else if (count === 2) type = "Twin";
    if (!type) return;
    const bucket = groupsByType.get(type) || [];
    bucket.push({ key, order: orderByKey.get(key) ?? 0 });
    groupsByType.set(type, bucket);
  });
  const result = new Map<string, string>();
  groupsByType.forEach((groups, type) => {
    const sorted = [...groups].sort((a, b) => a.order - b.order);
    const needsNumber = sorted.length > 1;
    sorted.forEach((group, index) => {
      result.set(group.key, needsNumber ? `${type} ${index + 1}` : type);
    });
  });
  return result;
};

// Validates a full set of child DOB timestamps against base maxCount plus the
// multiple-birth group caps (eldest twin / youngest twin or triplet).
const isChildDobSetValid = (
  dobTimes: number[],
  maxCount: number,
  eldestCap: number,
  youngestCap: number,
): boolean => {
  if (!Number.isFinite(maxCount)) return true;
  const times = dobTimes.filter((t) => Number.isFinite(t));
  if (times.length <= maxCount) return true;

  const counts = new Map<number, number>();
  times.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
  // The number of distinct birth events can never exceed the base maxCount.
  if (counts.size > maxCount) return false;

  const distinct = Array.from(counts.keys()).sort((a, b) => a - b);
  const eldestDob = distinct[0];
  const youngestDob = distinct[distinct.length - 1];
  for (const [dob, count] of counts) {
    let cap = 1;
    if (dob === youngestDob) cap = Math.max(cap, youngestCap);
    if (dob === eldestDob) cap = Math.max(cap, eldestCap);
    if (count > cap) return false;
  }
  return true;
};

// Formats a date of birth as a plain CALENDAR date, ignoring any time/timezone.
// The API may return a DOB as "YYYY-MM-DD" or a full ISO "…T00:00:00.000Z";
// passing the latter straight to dayjs() shifts the day back in ahead-of-UTC
// timezones (e.g. IST). Taking only the Y-M-D part and parsing it locally keeps
// the displayed/edited day identical to what was saved.
const formatDobSafe = (
  dob?: string | null,
  fmt: string = "DD MMM YYYY",
): string => {
  if (!dob) return "";
  const s = String(dob).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return dayjs(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`).format(fmt);
  }
  const parsed = parseDateString(s);
  return parsed ? dayjs(parsed).format(fmt) : "";
};

const buildDependentChoiceKey = (choice: any) =>
  [
    String(choice?.policyComponentActionTypeId ?? "none"),
    String(choice?.policyComponentActionType ?? "none"),
    String(choice?.parentpolicyComponentActionTypeId ?? "none"),
    String(choice?.policyComponentActionLabel ?? "none"),
  ].join("|");

const ProfileSection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [showDependentForm, setShowDependentForm] = useState(false);
  const [isSavingDependent, setIsSavingDependent] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [dobVisibility, setDobVisibility] = useState<Record<string, boolean>>({});
  const [employeeDobVisible, setEmployeeDobVisible] = useState(false);
  const [editingDependentId, setEditingDependentId] = useState<number | null>(
    null,
  );
  const [editingDependentSourcePolicyId, setEditingDependentSourcePolicyId] = useState<number | null>(null);
  const [lastSavedDependent, setLastSavedDependent] = useState<{ id: number; dateOfBirth: string } | null>(null);
  const [formRenderKey, setFormRenderKey] = useState(0);
  const [deleteTargetDependent, setDeleteTargetDependent] = useState<any | null>(
    null,
  );
  const [isDeletingDependent, setIsDeletingDependent] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState({
    name: "",
    relationship: "",
    gender: "",
    dateOfBirth: "",
  });
  const [relationshipValidationMessage, setRelationshipValidationMessage] =
    useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const formRef = useRef<any>(null);
  const watchSubscriptionRef = useRef<(() => void) | null>(null);

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const companyId = userDetails?.companyId;

  const onProfileClick = () => {
    setIsChangePasswordOpen(true);
  };

  const handleResetEnrollment = async () => {
    const allOptions = { clearChoices: true, clearDependents: true, resetPassword: true, clearClaims: true, clearActivityLogs: true, clearMails: true, clearTickets: true };
    setIsResetting(true);
    try {
      await apiRequest(endPoints.resetEnrollment, {
        method: "POST",
        data: allOptions,
      });
      setShowResetModal(false);
      await handleLogout();
    } catch {
      setShowResetModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const openChangePassword = Boolean((location.state as any)?.openChangePassword);
    if (!openChangePassword) return;

    setIsChangePasswordOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const handleLogout = async () => {
    try {
      await apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey: "LOGGED_OUT",
          activityCategory: "AUTH",
          referenceId: userDetails?.employeeId,
          referenceType: "USER",
          metadata: null,
        },
        headers: { userid: String(userDetails?.employeeId) },
      });
    } catch (error) {
      console.error("Failed to log logout activity:", error);
    }

    dispatch(clearPortalConfiguration());
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("sessionStartedAt");
    navigate("/landing");
  };

  const { data: employeeDetailsResponse, refetch: refetchEmployeeDetails } =
    useApiQuery({
      queryKey: ["employeeDetails", employeeId],
      url: employeeId ? endPoints.employeeDetails : "",
      enabled: Boolean(employeeId),
    });

  const { data: policiesResponse } = useApiQuery({
    queryKey: ["employeePolicies", employeeId],
    url: employeeId ? endPoints.employeePolicies(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  // Disables profile dependent actions (add/edit/delete) when the policy set is in
  // add-only-dependents mode. Driven by the policy API's `addOnlyDependents` flag —
  // true only when EVERY policy has it set. A mixed set (some true, some false) or
  // no policies at all keeps the actions enabled.
  const addOnlyDependents = useMemo(() => {
    const payload = policiesResponse as PoliciesResponse | undefined;
    const data =
      payload?.data ?? { employeePolicies: [], enrolledPolicies: [] };
    const allPolicies = [
      ...(data.employeePolicies ?? []),
      ...(data.enrolledPolicies ?? []),
    ];
    return (
      allPolicies.length > 0 &&
      allPolicies.every(
        (policy) =>
          (policy as { addOnlyDependents?: boolean })?.addOnlyDependents === true,
      )
    );
  }, [policiesResponse]);

  const relationDependentData = useSelector(
    (state: RootState) => state.policyData.relationDependentData,
  );

  useEffect(() => {
    if (!employeeId) return;
    if (Array.isArray(relationDependentData) && relationDependentData.length > 0) {
      return;
    }
    dispatch(fetchEmployeePolicies());
  }, [dispatch, employeeId, relationDependentData]);

  useEffect(() => {
    return () => {
      watchSubscriptionRef.current?.();
      watchSubscriptionRef.current = null;
    };
  }, []);

  const employeeDetails = useMemo(() => {
    const payload = employeeDetailsResponse as EmployeeDetailsResponse | undefined;
    return payload?.data ?? (payload as any)?.data?.data ?? null;
  }, [employeeDetailsResponse]);

  const gmcPolicyData = useMemo(() => {
    const relations = Array.isArray(relationDependentData)
      ? relationDependentData
      : [];
    return relations.find((policy: any) => {
      const typeKey = String(policy?.policyTypeKey ?? "").toUpperCase();
      const name = String(policy?.policyName ?? "").toUpperCase();
      return (
        typeKey.includes("GMC") ||
        name.includes("MEDICLAIM") ||
        name.includes("GMC")
      );
    });
  }, [relationDependentData]);

  const policiesData = useSelector(
    (state: RootState) => state.policyData.policiesData,
  );
  
  // Check if any policy is locked (isEditable: false)
  const isAnyPolicyLocked = useMemo(() => {
    if (!policiesData) return false;
    
    const allPolicies = [
      ...(policiesData.employeePolicies || []),
      ...(policiesData.enrolledPolicies || [])
    ];
    
    return allPolicies.some(policy => policy.isEditable === false);
  }, [policiesData]);

  const existingDependents = useMemo(() => {
    const relations = Array.isArray(relationDependentData) ? relationDependentData : [];
    const allDeps: any[] = relations.flatMap((policy: any) =>
      Array.isArray(policy?.configuration?.dependents)
        ? policy.configuration.dependents.map((dep: any) => ({ ...dep, _sourcePolicyId: Number(policy.policyId) }))
        : [],
    );
    if (allDeps.length > 0) {
      // Apply a DOB patch for the most recently saved dependent so stale data
      // from other policies (that weren't part of the PUT call) doesn't override it.
      const patchedDeps = allDeps.map((dep: any) => {
        if (lastSavedDependent && Number(dep?.id) === lastSavedDependent.id) {
          return { ...dep, dateOfBirth: lastSavedDependent.dateOfBirth };
        }
        return dep;
      });

      const seen = new Map<string, any>();
      patchedDeps.forEach((dep: any) => {
        const key = `${String(dep?.name || "").toLowerCase().trim()}-${String(dep?.relation || dep?.relationship || "").toLowerCase().trim()}`;
        const existing = seen.get(key);
        if (!existing) {
          seen.set(key, dep);
        } else {
          // Merge choices from both policy occurrences instead of picking one.
          // This prevents a stale multi-choice entry from overwriting a freshly updated one.
          const existingChoices = Array.isArray(existing?.choices) ? existing.choices : [];
          const newChoices = Array.isArray(dep?.choices) ? dep.choices : [];
          const choiceKey = (c: any) =>
            `${c?.policyComponentActionTypeId ?? ""}-${c?.parentpolicyComponentActionTypeId ?? ""}`;
          const mergedChoicesMap = new Map(
            [...existingChoices, ...newChoices].map((c) => [choiceKey(c), c])
          );
          seen.set(key, { ...existing, choices: Array.from(mergedChoicesMap.values()) });
        }
      });
      return Array.from(seen.values());
    }
    return (
      (employeeDetailsResponse as any)?.data?.dependents ||
      (employeeDetailsResponse as any)?.data?.data?.dependents ||
      []
    );
  }, [employeeDetailsResponse, lastSavedDependent, relationDependentData]);

  const filteredDependentsForValidation = useMemo(() => {
    if (!editingDependentId) return existingDependents;
    return (existingDependents || []).filter(
      (dep: any) => Number(dep?.id) !== Number(editingDependentId),
    );
  }, [editingDependentId, existingDependents]);

  const toDisplayValue = (value: unknown, fallback: string) => {
    if (value === null || value === undefined) {
      return fallback;
    }
    if (typeof value === "object") {
      const valueRecord = value as { value?: string | number };
      if (valueRecord?.value !== undefined && valueRecord?.value !== null) {
        return String(valueRecord.value);
      }
      return fallback;
    }
    return String(value);
  };

  const toGenderDisplayValue = (value: unknown, fallback: string) => {
    const raw = toDisplayValue(value, fallback).trim().toLowerCase();
    if (raw === "male" || raw === "m" || raw === "gender_type_male") {
      return "Male";
    }
    if (raw === "female" || raw === "f" || raw === "gender_type_female") {
      return "Female";
    }
    if (raw === "other" || raw === "o") {
      return "Other";
    }
    return toDisplayValue(value, fallback);
  };

  const policyData = useMemo(() => {
    const relationships = gmcPolicyData?.configuration?.relationships;
    if (!relationships) return undefined;
    return {
      ...relationships,
      policyTemplate: gmcPolicyData?.configuration?.policyTemplate,
    };
  }, [gmcPolicyData]);

  const constraints = gmcPolicyData?.configuration?.constraints ?? {};
  const parentAgeGapRequirement = Number(
    constraints?.ageGapBetweenParentAndEmployee ?? 0,
  );
  const childAgeGapRequirement = Number(
    constraints?.ageGapBetweenChildrenAndEmployee ?? 0,
  );
  const studyingSonAgeExtension = Number(constraints?.studyingSonAgeExtension ?? 0);
  const unmarriedDaughterAgeExtension = Number(
    constraints?.unmarriedDaughterAgeExtension ?? 0,
  );

  // Multiple-birth (twin / triplet) child constraints — let children exceed the
  // base maxCount by the configured extra birth slots (mirrors the enrollment flow).
  const allowFirstChildAsTwin = constraints?.allowFirstChildAsTwin === true;
  const twinsSecondChildAllowed = constraints?.twinsSecondChildAllowed === true;
  const tripletsSecondChildAllowed = constraints?.tripletsSecondChildAllowed === true;
  const anyMultipleBirthAllowed =
    allowFirstChildAsTwin || twinsSecondChildAllowed || tripletsSecondChildAllowed;
  const eldestGroupCap = allowFirstChildAsTwin ? 2 : 1;
  const youngestGroupCap = tripletsSecondChildAllowed
    ? 3
    : twinsSecondChildAllowed
      ? 2
      : 1;
  const childExtraSlots = eldestGroupCap - 1 + (youngestGroupCap - 1);

  const employeeDateOfBirth = useMemo(
    () => parseDateString(employeeDetails?.dateOfBirth),
    [employeeDetails?.dateOfBirth],
  );
  const employeeAge = useMemo(
    () => (employeeDateOfBirth ? calculateAgeFromDate(employeeDateOfBirth) : null),
    [employeeDateOfBirth],
  );
  const employeeGender = useMemo(() => {
    const g = (employeeDetails as any)?.gender;
    const raw = (typeof g === "string" ? g : (g?.key ?? g?.value ?? "")).toLowerCase().trim();
    if (raw === "gender_type_male" || raw === "male" || raw === "m") return "male";
    if (raw === "gender_type_female" || raw === "female" || raw === "f") return "female";
    return "male";
  }, [employeeDetails]);

  const getRelationTypeForRelationship = useCallback(
    (relationshipName: string) =>
      getRelationTypeForRelationshipUtil(policyData as any, relationshipName),
    [policyData],
  );

  const getAgeConstraintsForRelationship = useCallback(
    (relationshipName: string) =>
      getAgeConstraintsForRelationshipUtil(
        policyData as any,
        relationshipName,
        Number.isNaN(studyingSonAgeExtension) ? 0 : studyingSonAgeExtension,
        Number.isNaN(unmarriedDaughterAgeExtension)
          ? 0
          : unmarriedDaughterAgeExtension,
      ),
    [policyData, studyingSonAgeExtension, unmarriedDaughterAgeExtension],
  );

  const getAllEligibleRelationsFromPolicyTemplate = useCallback(() => {
    const policyTemplate = gmcPolicyData?.configuration?.policyTemplate;
    if (!policyTemplate || typeof policyTemplate !== "object") {
      return [];
    }
    const allRelations = new Set<string>();
    Object.values(policyTemplate).forEach((policy: any) => {
      policy?.eligibleRelations?.forEach((relation: string) =>
        allRelations.add(relation),
      );
      policy?.addonIds?.forEach((addon: any) => {
        addon?.eligibleRelations?.forEach((relation: string) =>
          allRelations.add(relation),
        );
      });
    });
    return Array.from(allRelations);
  }, [gmcPolicyData]);

  const resolveRelationshipConfig = useCallback(
    (relationshipName: string) => {
      const normalizedRelationshipName = relationshipName?.toLowerCase().trim();
      const enabledPolicyRelations =
        gmcPolicyData?.configuration?.relationships?.enabledPolicyRelations || [];

      for (const relation of enabledPolicyRelations) {
        if (!relation?.enabled) continue;

        if (relation.type?.toLowerCase().trim() === normalizedRelationshipName) {
          return {
            relationType: relation.type,
            canonicalName: relation.type,
            relation,
          };
        }

        const matchingOption = relation.configuredOptions?.find((option: any) => {
          if (!option?.name || option.enabled === false) return false;
          return option.name.toLowerCase().trim() === normalizedRelationshipName;
        });

        if (matchingOption) {
          return {
            relationType: relation.type,
            canonicalName: matchingOption.name,
            relation,
          };
        }
      }
      return null;
    },
    [gmcPolicyData],
  );

  const canSelectRelationship = useCallback(
    (relationshipName: string) => {
      if (!gmcPolicyData?.configuration?.constraints) {
        return { allowed: true };
      }

      return canSelectRelationshipUtil({
        relationshipName,
        policyData: gmcPolicyData.configuration.relationships,
        dependents: (filteredDependentsForValidation || []).map((dep: any) => ({
          ...dep,
          relationship: dep?.relation || dep?.relationship,
          relationshipType:
            dep?.relationshipType || dep?.relation || dep?.relationship,
        })),
        constraints: gmcPolicyData.configuration.constraints,
        employeeGender,
      });
    },
    [employeeGender, filteredDependentsForValidation, gmcPolicyData],
  );

  const getGenderByRelationship = useCallback(
    (relationship: string): string => {
      const normalizedRelationship = relationship.toLowerCase().trim();
      if (
        normalizedRelationship === "spouse" ||
        normalizedRelationship === "spouse/partner" ||
        normalizedRelationship === "partner"
      ) {
        if (employeeGender === "male") return "female";
        if (employeeGender === "female") return "male";
        return "";
      }
      const genderMap: Record<string, string> = {
        father: "male",
        mother: "female",
        son: "male",
        daughter: "female",
        husband: "male",
        wife: "female",
        brother: "male",
        sister: "female",
        grandfather: "male",
        grandmother: "female",
        grandson: "male",
        granddaughter: "female",
        "father-in-law": "male",
        "mother-in-law": "female",
        "son-in-law": "male",
        "daughter-in-law": "female",
        "brother-in-law": "male",
        "sister-in-law": "female",
        "same-sex_partner": employeeGender === "male" ? "male" : "female",
        "same-sex_spouse": employeeGender === "male" ? "male" : "female",
      };
      return genderMap[normalizedRelationship] || "";
    },
    [employeeGender],
  );

  const availableRelationshipOptions = useMemo(() => {
    const allEligible = getAllEligibleRelationsFromPolicyTemplate();
    const uniqueRelations = Array.from(new Set(allEligible));
    const existingRelationshipNames = new Set(
      (filteredDependentsForValidation || [])
        .map((dep: any) =>
          String(dep?.relation || dep?.relationship || dep?.relationshipType || "")
            .toLowerCase()
            .trim(),
        )
        .filter(Boolean),
    );
    const singleSelectParentRelationships = new Set([
      "father",
      "mother",
      "father-in-law",
      "mother-in-law",
    ]);

    const availableOptionsMap = new Map<string, { name: string; displayName: string }>();

    uniqueRelations.forEach((relationName) => {
      const resolved = resolveRelationshipConfig(relationName);
      if (!resolved) return;
      const { relationType, canonicalName, relation } = resolved;
      const normalizedCanonicalName = canonicalName.toLowerCase().trim();
      if (normalizedCanonicalName === "self") return;

      const usedCount = (filteredDependentsForValidation || []).filter((dep: any) => {
        const depType = getRelationTypeForRelationship(
          dep?.relation || dep?.relationship || dep?.relationshipType || "",
        );
        return depType === relationType;
      }).length;

      const parsedMax = relation.maxCount ? parseInt(relation.maxCount, 10) : NaN;
      const maxCount = Number.isNaN(parsedMax)
        ? Number.POSITIVE_INFINITY
        : parsedMax;
      if (usedCount >= maxCount) {
        // Children may exceed maxCount by the extra twin/triplet slots; the DOB
        // validation enforces the actual same-DOB requirement at add time.
        const isMultipleBirthSlotOpen =
          relationType.toLowerCase() === "children" &&
          anyMultipleBirthAllowed &&
          usedCount < maxCount + childExtraSlots;
        if (!isMultipleBirthSlotOpen) return;
      }

      if (
        singleSelectParentRelationships.has(normalizedCanonicalName) &&
        existingRelationshipNames.has(normalizedCanonicalName)
      ) {
        return;
      }

      if (relationType.toLowerCase() === "parents") {
        const selectionCheck = canSelectRelationship(canonicalName);
        if (!selectionCheck.allowed) return;
      }

      if (!availableOptionsMap.has(normalizedCanonicalName)) {
        availableOptionsMap.set(normalizedCanonicalName, {
          name: canonicalName,
          displayName: canonicalName,
        });
      }
    });

    return Array.from(availableOptionsMap.values()).map((item) => ({
      value: item.name,
      label: item.displayName,
    }));
  }, [
    anyMultipleBirthAllowed,
    canSelectRelationship,
    childExtraSlots,
    filteredDependentsForValidation,
    getAllEligibleRelationsFromPolicyTemplate,
    getRelationTypeForRelationship,
    resolveRelationshipConfig,
  ]);

  const canAddDependent = Boolean(
    gmcPolicyData?.policyId &&
      !showDependentForm &&
      // Disable once every policy-allowed relationship is already exhausted.
      availableRelationshipOptions.length > 0,
  );

  const dependants = useMemo(() => {
    const dependentsList: any[] = [];
    (existingDependents || []).forEach((dependent: any) => {
      const relation =
        dependent?.relation || dependent?.relationship || dependent?.relationshipType;
      // DOB is optional: some policies return effectiveDate instead of
      // dateOfBirth. Show the dependent regardless; a missing DOB renders as "--".
      if (dependent?.name && relation) {
        dependentsList.push({
          id: dependent?.id,
          name: dependent.name,
          relationship: relation,
          gender: toGenderDisplayValue(dependent.gender, "--"),
          rawGender: String(dependent?.gender || "").toLowerCase(),
          rawDateOfBirth: dependent.dateOfBirth,
          dateOfBirth: formatDobSafe(dependent.dateOfBirth, "DD MMM YYYY") || "--",
          choices: Array.isArray(dependent?.choices) ? dependent.choices : [],
          sourcePolicyId: dependent?._sourcePolicyId ?? null,
          policyComponentActionLabel: dependent?.policyComponentActionLabel ?? null,
          policyComponentActionType: dependent?.policyComponentActionType ?? null,
          policyComponentActionTypeId: dependent?.policyComponentActionTypeId ?? null,
          parentpolicyComponentActionTypeId:
            dependent?.parentpolicyComponentActionTypeId ?? null,
        });
      }
    });
    const uniqueDependents = Array.from(
      new Map(
        dependentsList.map((dep) => [
          `${String(dep.name || "").toLowerCase().trim()}-${String(dep.relationship || "").toLowerCase().trim()}`,
          dep,
        ]),
      ).values(),
    );
    return uniqueDependents;
  }, [existingDependents]);

  // Maps each child DOB (by timestamp) shared by multiple children to its tag —
  // "Twin"/"Triplet", numbered ("Twin 1", "Twin 2") when 2+ groups of a type exist.
  const multipleBirthLabelByDob = useMemo(() => {
    const items = (existingDependents || [])
      .filter((dep: any) => {
        const rel = dep?.relation || dep?.relationship || dep?.relationshipType || "";
        return getRelationTypeForRelationship(rel)?.toLowerCase() === "children";
      })
      .map((dep: any) => {
        const t = parseDateString(dep?.dateOfBirth)?.getTime();
        return t === undefined ? null : { key: String(t), order: t };
      })
      .filter((item: any): item is { key: string; order: number } => item !== null);
    return buildMultipleBirthLabels(items);
  }, [existingDependents, getRelationTypeForRelationship]);

  const formatDobTime = useCallback((time: number) => {
    const d = new Date(time);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }, []);

  // Existing children's DOB timestamps (sorted ascending, eldest first), excluding the row being edited.
  const childDobTimes = useMemo(
    () =>
      (filteredDependentsForValidation || [])
        .filter((dep: any) => {
          const rel = dep?.relation || dep?.relationship || dep?.relationshipType || "";
          return getRelationTypeForRelationship(rel)?.toLowerCase() === "children";
        })
        .map((dep: any) => parseDateString(dep?.dateOfBirth)?.getTime())
        .filter((t: number | undefined): t is number => t !== undefined)
        .sort((a: number, b: number) => a - b),
    [filteredDependentsForValidation, getRelationTypeForRelationship],
  );

  const childMaxCount = useMemo(() => {
    const rels =
      gmcPolicyData?.configuration?.relationships?.enabledPolicyRelations || [];
    const childRel = rels.find((r: any) => r?.type?.toLowerCase() === "children");
    return childRel?.maxCount ? parseInt(childRel.maxCount, 10) : NaN;
  }, [gmcPolicyData]);

  // In a "beyond base maxCount" slot — an extra child must share an eligible birth event.
  const isInMultipleBirthSlot =
    anyMultipleBirthAllowed &&
    !Number.isNaN(childMaxCount) &&
    childDobTimes.length >= childMaxCount;

  // Birth events an extra (beyond-maxCount) child may join — only groups that
  // still have spare capacity, each labelled by its position so the message is accurate.
  const allowedMultipleBirthDobs = useMemo(() => {
    const entries: { label: string; dob: string }[] = [];
    if (!anyMultipleBirthAllowed || childDobTimes.length === 0) return entries;
    const eldestTime = childDobTimes[0];
    const youngestTime = childDobTimes[childDobTimes.length - 1];
    const eldestCount = childDobTimes.filter((t: number) => t === eldestTime).length;
    const youngestCount = childDobTimes.filter((t: number) => t === youngestTime).length;

    // All existing children share a single birth event — its cap is the larger applicable one.
    if (eldestTime === youngestTime) {
      const cap = Math.max(
        allowFirstChildAsTwin ? eldestGroupCap : 1,
        twinsSecondChildAllowed || tripletsSecondChildAllowed ? youngestGroupCap : 1,
      );
      if (eldestCount < cap) {
        entries.push({ label: "the existing child", dob: formatDobTime(eldestTime) });
      }
      return entries;
    }

    if (allowFirstChildAsTwin && eldestCount < eldestGroupCap) {
      entries.push({ label: "the elder child", dob: formatDobTime(eldestTime) });
    }
    if (
      (twinsSecondChildAllowed || tripletsSecondChildAllowed) &&
      youngestCount < youngestGroupCap
    ) {
      entries.push({ label: "the younger child", dob: formatDobTime(youngestTime) });
    }
    return entries;
  }, [
    anyMultipleBirthAllowed,
    childDobTimes,
    allowFirstChildAsTwin,
    twinsSecondChildAllowed,
    tripletsSecondChildAllowed,
    eldestGroupCap,
    youngestGroupCap,
    formatDobTime,
  ]);

  const { minAge, maxAge } = selectedRelationship
    ? getAgeConstraintsForRelationship(selectedRelationship)
    : { minAge: null, maxAge: null };
  const { minDate, maxDate } = getDateLimits(minAge, maxAge);

  const dependentFormConfig = useMemo(
    () => [
      {
        key: "name",
        name: "name",
        label: "Name",
        type: "text" as const,
        rules: {
          required: { value: true, message: "Name is required" },
          validate: (value: string) => {
            if (!value) return true;
            // Trim only leading/trailing whitespace before validating; internal
            if (!/^(?=.{2,100}$)(?!.*\s{2,})[\p{L}][\p{L}\p{M}'\- ]*[\p{L}\p{M}]$/u.test(value.trim())) {
              return "Please enter a valid name using alphabets, spaces, hyphens (-), or apostrophes (')";
            }
            return true;
          },
        },
        gridColumn: 2,
        componentProps: {
          fullWidth: true,
          placeholder: "Enter dependent name",
          inputProps: {
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              const allowedKeys = [
                'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
                'Tab', 'Home', 'End', 'Enter',
              ];
              if (!allowedKeys.includes(e.key) && !/^[\p{L}\p{M}'\- ]$/u.test(e.key)) {
                e.preventDefault();
              }
            },
          },
        },
      },
      {
        key: "relationship",
        name: "relationship",
        label: "Relationship",
        type: "select" as const,
        options: availableRelationshipOptions,
        rules: {
          required: { value: true, message: "Relationship is required" },
          validate: (value: string) => {
            if (!value) return true;
            const result = canSelectRelationship(value);
            return (
              result.allowed ||
              result.message ||
              "Selected relationship is not allowed by current constraints"
            );
          },
        },
        gridColumn: 2,
        componentProps: { fullWidth: true },
      },
      {
        key: "gender",
        name: "gender",
        label: "Gender",
        type: "select" as const,
        options: [
          { label: "Male", value: "male" },
          { label: "Female", value: "female" },
          { label: "Other", value: "other" },
        ],
        rules: {
          required: { value: true, message: "Gender is required" },
        },
        gridColumn: 2,
        // Relations that imply a gender (father, mother, in-laws, spouse...)
        // prefill it and lock the field; ambiguous ones stay user-editable.
        componentProps: {
          fullWidth: true,
          disabled: Boolean(getGenderByRelationship(selectedRelationship)),
        },
      },
      {
        key: "dateOfBirth",
        name: "dateOfBirth",
        label: "Date of Birth",
        type: "date" as const,
        rules: {
          required: { value: true, message: "Date of Birth is required" },
          validate: {
            ageRange: (
              value: string,
              formValues: { relationship: string },
            ) =>
              validateDateOfBirth({
                value,
                relationship: formValues.relationship || selectedRelationship,
                getAgeConstraintsForRelationship,
                getRelationTypeForRelationship,
                parentAgeGapRequirement,
                childAgeGapRequirement,
                employeeDateOfBirth,
                employeeAge,
              }),
            twinsDob: (value: string, formValues: { relationship: string }) => {
              if (!isInMultipleBirthSlot) return true;
              const rel = formValues.relationship || selectedRelationship;
              if (getRelationTypeForRelationship(rel)?.toLowerCase() !== "children") {
                return true;
              }
              const parsed = parseDateString(value);
              if (!parsed) return true;
              const allDobTimes = [...childDobTimes, parsed.getTime()];
              if (
                isChildDobSetValid(
                  allDobTimes,
                  childMaxCount,
                  eldestGroupCap,
                  youngestGroupCap,
                )
              ) {
                return true;
              }
              if (allowedMultipleBirthDobs.length > 0) {
                return `To add this child to an existing birth, its date of birth must match ${allowedMultipleBirthDobs
                  .map((e) => `${e.label} (${e.dob})`)
                  .join(" or ")}.`;
              }
              return "Maximum number of children reached.";
            },
          },
        },
        gridColumn: 2,
        componentProps: {
          showAge:true,
          fullWidth: true,
          format: "DD/MM/YYYY",
          maxDate: dayjs(),
          inputProps: {
            min: minDate ? minDate.toISOString().split("T")[0] : undefined,
            max: maxDate ? maxDate.toISOString().split("T")[0] : undefined,
          },
          helperText:
            isInMultipleBirthSlot &&
            getRelationTypeForRelationship(selectedRelationship)?.toLowerCase() === "children" &&
            allowedMultipleBirthDobs.length > 0
              ? `Multiple birth: date of birth must match ${allowedMultipleBirthDobs.map((e) => e.dob).join(" or ")}`
              : selectedRelationship && minAge && maxAge
                ? `Age must be between ${minAge} and ${maxAge} years`
                : selectedRelationship && minAge
                  ? `Minimum age: ${minAge} years`
                  : selectedRelationship && maxAge
                    ? `Maximum age: ${maxAge} years`
                    : "Please select relationship first",
        },
      },
    ],
    [
      allowedMultipleBirthDobs,
      availableRelationshipOptions,
      canSelectRelationship,
      childAgeGapRequirement,
      childDobTimes,
      childMaxCount,
      eldestGroupCap,
      employeeAge,
      employeeDateOfBirth,
      getAgeConstraintsForRelationship,
      getGenderByRelationship,
      getRelationTypeForRelationship,
      isInMultipleBirthSlot,
      maxAge,
      maxDate,
      minAge,
      minDate,
      parentAgeGapRequirement,
      selectedRelationship,
      youngestGroupCap,
    ],
  );

  const handleCancelAddDependent = useCallback(() => {
    setShowDependentForm(false);
    setSelectedRelationship("");
    setEditingDependentId(null);
    setEditingDependentSourcePolicyId(null);
    setRelationshipValidationMessage(null);
    watchSubscriptionRef.current?.();
    watchSubscriptionRef.current = null;
    const resetValues = {
      name: "",
      relationship: "",
      gender: "",
      dateOfBirth: "",
    };
    setFormInitialValues(resetValues);
    formRef.current?.reset?.(resetValues);
  }, []);

  const handleOpenAddDependent = useCallback(() => {
    const initialValues = {
      name: "",
      relationship: "",
      gender: "",
      dateOfBirth: "",
    };
    setEditingDependentId(null);
    setFormInitialValues(initialValues);
    setSelectedRelationship("");
    setRelationshipValidationMessage(null);
    setFormRenderKey((prev) => prev + 1);
    setShowDependentForm(true);
  }, []);

  const handleEditDependent = useCallback((dependent: any) => {
    const relationship = String(dependent?.relationship || "");
    const parsedId = Number(dependent?.id);
    const normalizedDob = dependent?.rawDateOfBirth
      ? formatDobSafe(dependent.rawDateOfBirth, "DD/MM/YYYY")
      : "";
    const initialValues = {
      name: dependent?.name || "",
      relationship,
      gender: dependent?.rawGender || "",
      dateOfBirth: normalizedDob,
    };

    setEditingDependentId(Number.isFinite(parsedId) ? parsedId : null);
    setEditingDependentSourcePolicyId(Number(dependent?.sourcePolicyId) || null);
    setFormInitialValues(initialValues);
    setSelectedRelationship(relationship);
    setRelationshipValidationMessage(null);
    setFormRenderKey((prev) => prev + 1);
    setShowDependentForm(true);
  }, []);

  const handleSaveDependent = useCallback(async () => {
    if (!formRef.current || !employeeId || !companyId) {
      return;
    }

    const isValid = await formRef.current.trigger();
    if (!isValid) return;

    const formValues = formRef.current.getValues();
    const relation = formValues.relationship;
    const relationType = getRelationTypeForRelationship(relation) || relation;
    // Build a timezone-proof YYYY-MM-DD from whatever the date field holds (a
    // "DD/MM/YYYY" string, an ISO/Date, or a dayjs). We must NOT let a Date reach
    // JSON.stringify (toISOString shifts the day back in ahead-of-UTC zones like
    // IST +05:30 — a picked 16/06 becomes 2007-06-15T18:30:00Z → saved as the 15th).
    // Reading local getters gives exactly the calendar date the user picked.
    const rawDob = formValues.dateOfBirth;
    let dobDate: Date | null = null;
    if (rawDob instanceof Date) {
      dobDate = rawDob;
    } else if (
      rawDob &&
      typeof rawDob === "object" &&
      typeof (rawDob as { toDate?: unknown }).toDate === "function"
    ) {
      // dayjs/moment-like object. Duck-typed on .toDate() rather than dayjs.isDayjs()
      // because the date picker may bundle a different dayjs instance, which would
      // make isDayjs() return false and let the object reach JSON.stringify → ISO Z.
      dobDate = (rawDob as { toDate: () => Date }).toDate();
    } else if (typeof rawDob === "string" && rawDob.trim()) {
      const trimmed = rawDob.trim();
      dobDate = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)
        ? dayjs(trimmed, "DD/MM/YYYY").toDate()
        : dayjs(trimmed).isValid()
          ? dayjs(trimmed).toDate()
          : null;
    }
    // Never fall back to a raw object/Date — that would serialize via toISOString()
    // and shift the day. Only ever send a plain YYYY-MM-DD string (or "").
    const normalizedDob =
      dobDate && !Number.isNaN(dobDate.getTime())
        ? `${dobDate.getFullYear()}-${String(dobDate.getMonth() + 1).padStart(2, "0")}-${String(dobDate.getDate()).padStart(2, "0")}`
        : typeof rawDob === "string"
          ? rawDob
          : "";

    setIsSavingDependent(true);
    try {
      await apiRequest(endPoints.upsertProfileDependents, {
        method: "PUT",
        data: {
          employeeId: Number(employeeId),
          companyId: Number(companyId),
          isUpdate: true,
          dependents: [
            {
              ...(editingDependentId ? { id: Number(editingDependentId) } : {}),
              name: (formValues.name ?? "").trim(),
              relation,
              relationshipType: relationType,
              gender: formValues.gender,
              dateOfBirth: normalizedDob,
            },
          ],
        },
      });

      dispatch(
        setToastMessage(
          editingDependentId
            ? "Dependent updated successfully."
            : "Dependent added successfully.",
        ),
      );
      if (editingDependentId) {
        setLastSavedDependent({ id: Number(editingDependentId), dateOfBirth: normalizedDob });
      }
      handleCancelAddDependent();
      await Promise.all([refetchEmployeeDetails(), dispatch(fetchEmployeePolicies())]);
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to add dependent.",
        ),
      );
    } finally {
      setIsSavingDependent(false);
    }
  }, [
    companyId,
    dispatch,
    editingDependentId,
    employeeId,
    getRelationTypeForRelationship,
    handleCancelAddDependent,
    refetchEmployeeDetails,
    setLastSavedDependent,
  ]);

  const closeDeleteDependentModal = useCallback(() => {
    if (isDeletingDependent) return;
    setDeleteTargetDependent(null);
  }, [isDeletingDependent]);

  const getChoiceDisplayLabel = useCallback((choice: any) => {
    const label = String(choice?.policyComponentActionLabel ?? "").trim();
    const type = String(choice?.policyComponentActionType ?? "").trim();
    if (label && type) return `${label} (${type})`;
    if (label) return label;
    if (type) return type;
    const addonId = choice?.policyComponentActionTypeId ?? "N/A";
    const parentId = choice?.parentpolicyComponentActionTypeId ?? "N/A";
    return `Choice ${addonId} / Parent ${parentId}`;
  }, []);

  const getDependentImpactedChoices = useCallback(
    (dependent: any) => {
      const choices = Array.isArray(dependent?.choices) ? dependent.choices : [];
      const unique = new Set<string>();
      const labels: string[] = [];

      choices.forEach((choice: any) => {
        const key = [
          choice?.policyComponentActionLabel ?? "",
          choice?.policyComponentActionType ?? "",
          choice?.policyComponentActionTypeId ?? "",
          choice?.parentpolicyComponentActionTypeId ?? "",
        ].join("|");

        if (!unique.has(key)) {
          unique.add(key);
          labels.push(getChoiceDisplayLabel(choice));
        }
      });

      if (!labels.length) {
        const fallbackChoice = {
          policyComponentActionLabel: dependent?.policyComponentActionLabel,
          policyComponentActionType: dependent?.policyComponentActionType,
          policyComponentActionTypeId: dependent?.policyComponentActionTypeId,
          parentpolicyComponentActionTypeId:
            dependent?.parentpolicyComponentActionTypeId,
        };
        const hasFallbackValues = Object.values(fallbackChoice).some(
          (value) => value !== null && value !== undefined && String(value).trim() !== "",
        );
        if (hasFallbackValues) {
          labels.push(getChoiceDisplayLabel(fallbackChoice));
        }
      }

      return labels;
    },
    [getChoiceDisplayLabel],
  );

  const deleteTargetImpactedChoices = useMemo(() => {
    if (!deleteTargetDependent) return [];

    const fromChoices = getDependentImpactedChoices(deleteTargetDependent);
    if (fromChoices.length > 0) return fromChoices;

    // dependent.choices is empty from server data — fall back to all employeeChosenChoices
    // for the source policy so the user can see what coverage is affected.
    const sourcePolicyId = Number(deleteTargetDependent?.sourcePolicyId);
    const sourcePolicy = (Array.isArray(relationDependentData) ? relationDependentData : [])
      .find((p: any) => Number(p.policyId) === sourcePolicyId);
    const policyToCheck = sourcePolicy ?? gmcPolicyData;
    const empChoices: any[] = policyToCheck?.configuration?.employeeChosenChoices || [];

    const unique = new Set<string>();
    const labels: string[] = [];
    empChoices.forEach((choice: any) => {
      const label = getChoiceDisplayLabel(choice);
      if (!unique.has(label)) {
        unique.add(label);
        labels.push(label);
      }
    });
    return labels;
  }, [deleteTargetDependent, getDependentImpactedChoices, getChoiceDisplayLabel, relationDependentData, gmcPolicyData]);

  const getMappedChoicesFromDependent = useCallback((dependent: any) => {
    const mappedChoices: any[] = [];
    const seenChoiceKeys = new Set<string>();
    const dependentChoices = Array.isArray(dependent?.choices)
      ? dependent.choices
      : [];

    if (dependentChoices.length > 0) {
      dependentChoices.forEach((choice: any) => {
        const normalizedChoice = {
          policyComponentActionTypeId: choice?.policyComponentActionTypeId ?? null,
          policyComponentActionType: choice?.policyComponentActionType ?? null,
          parentpolicyComponentActionTypeId:
            choice?.parentpolicyComponentActionTypeId ?? null,
          policyComponentActionLabel: choice?.policyComponentActionLabel ?? null,
        };
        const choiceKey = buildDependentChoiceKey(normalizedChoice);
        if (!seenChoiceKeys.has(choiceKey)) {
          seenChoiceKeys.add(choiceKey);
          mappedChoices.push(normalizedChoice);
        }
      });
      return mappedChoices;
    }

    const fallbackChoice = {
      policyComponentActionTypeId: dependent?.policyComponentActionTypeId ?? null,
      policyComponentActionType: dependent?.policyComponentActionType ?? null,
      parentpolicyComponentActionTypeId:
        dependent?.parentpolicyComponentActionTypeId ?? null,
      policyComponentActionLabel: dependent?.policyComponentActionLabel ?? null,
    };
    const hasFallbackChoice = Object.values(fallbackChoice).some(
      (value) => value !== null && value !== undefined && String(value).trim() !== "",
    );

    if (hasFallbackChoice) {
      mappedChoices.push(fallbackChoice);
    }

    return mappedChoices;
  }, []);

  const handleConfirmDeleteDependent = useCallback(async () => {
    const deleteTargetPolicyId = Number(deleteTargetDependent?.sourcePolicyId) || Number(gmcPolicyData?.policyId);
    if (
      !deleteTargetDependent?.id ||
      !employeeId ||
      !companyId ||
      !deleteTargetPolicyId
    ) {
      return;
    }
    const deletePolicyData = (Array.isArray(relationDependentData) ? relationDependentData : [])
      .find((p: any) => Number(p.policyId) === deleteTargetPolicyId) ?? gmcPolicyData;

    // Match enrollment-style save semantics: start from the full current dependent
    // snapshot and remove only the selected dependent from it.
    const policyDependents: any[] = Array.isArray(existingDependents)
      ? existingDependents
      : [];

    const rawRemainingDependents = policyDependents.filter(
      (dep: any) => Number(dep?.id) !== Number(deleteTargetDependent.id),
    );

    const remainingDependents = rawRemainingDependents
      .map((dep: any) => ({
        id: dep?.id ? Number(dep.id) : undefined,
        name: dep?.name,
        relation: dep?.relation || dep?.relationship,
        relationshipType: dep?.relationshipType || dep?.relation || dep?.relationship,
        gender: dep?.gender,
        // Re-send as a plain calendar date (no time/zone). Forwarding the raw API
        // timestamp here makes the backend re-convert it and shift the day back —
        // which is why deleting one child shifted the others' DOBs.
        dateOfBirth: formatDobSafe(dep?.dateOfBirth, "YYYY-MM-DD") || dep?.dateOfBirth,
        choices: getMappedChoicesFromDependent(dep),
      }))
      .filter((dep: any) => dep.name && dep.relation);

    const deletedDependentSource = policyDependents.find(
      (dep: any) => Number(dep?.id) === Number(deleteTargetDependent.id),
    );
    const deletedDependentChoiceKeys = new Set(
      getMappedChoicesFromDependent(deletedDependentSource).map((choice: any) =>
        buildDependentChoiceKey(choice),
      ),
    );
    const remainingDependentChoiceKeys = new Set(
      rawRemainingDependents.flatMap((dep: any) =>
        getMappedChoicesFromDependent(dep).map((choice: any) =>
          buildDependentChoiceKey(choice),
        ),
      ),
    );
    const existingEmployeeChoices =
      deletePolicyData?.configuration?.employeeChosenChoices || [];
    const normalizedCombinedChoices = existingEmployeeChoices
      .filter((choice: any) => {
        const choiceKey = buildDependentChoiceKey(choice);
        if (!deletedDependentChoiceKeys.has(choiceKey)) {
          return true;
        }
        return remainingDependentChoiceKeys.has(choiceKey);
      })
      .map(normalizeCombinedChoiceEntry);

    setIsDeletingDependent(true);
    try {
      await apiRequest(endPoints.updateEnrollmentData, {
        method: "PUT",
        data: {
          employeeId: Number(employeeId),
          companyId: Number(companyId),
          action: "save",
          dependents: remainingDependents,
          combinedChoices: [
            {
              policyId: deleteTargetPolicyId,
              policyName: deletePolicyData?.policyName,
              choices: normalizedCombinedChoices,
            },
          ],
          deletedDependentIds: [Number(deleteTargetDependent.id)],
        },
      });

      dispatch(setToastMessage("Dependent deleted successfully."));
      setDeleteTargetDependent(null);
      await Promise.all([refetchEmployeeDetails(), dispatch(fetchEmployeePolicies())]);
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to delete dependent.",
        ),
      );
    } finally {
      setIsDeletingDependent(false);
    }
  }, [
    companyId,
    deleteTargetDependent,
    dispatch,
    employeeId,
    getMappedChoicesFromDependent,
    gmcPolicyData,
    relationDependentData,
    refetchEmployeeDetails,
  ]);

  useEffect(() => {
    if (!selectedRelationship || !formRef.current) return;
    const autoGender = getGenderByRelationship(selectedRelationship);
    if (autoGender) {
      formRef.current.setValue("gender", autoGender);
      formRef.current.trigger("gender");
    }
  }, [getGenderByRelationship, selectedRelationship]);
 console.log("employee details:",employeeDetails);
  const employeeName = employeeDetails?.employeeName || "";
  const designation = employeeDetails?.designation;
  const role = employeeDetails?.role;
  const employeeCode = toDisplayValue(employeeDetails?.companyEmployeeId, "--");
  const dateOfBirth = employeeDetails?.dateOfBirth
    ? formatDate(employeeDetails?.dateOfBirth, "DD MMM YYYY")
    : "--";
  const gender = toGenderDisplayValue(employeeDetails?.gender, "--");
  const maritalStatus = employeeDetails?.additionalDetails?.["Marital Status"];
  const dateOfJoining = employeeDetails?.additionalDetails?.["Effective Date"]
    ? formatDate(employeeDetails.additionalDetails["Effective Date"], "DD MMM YYYY")
    : "--";
  const profileDetails = [
    {
      label: "Employee ID",
      value: employeeCode,
      icon: employeeIdIcon,
    },
    {
      label: "Date of Birth",
      value: dateOfBirth,
      icon: dateOfBirthIcon,
    },
    // {
    //   label: "Date of Joining",
    //   value: dateOfJoining,
    //   icon: dateOfJoiningIcon,
    // },
    {
      label: "Gender",
      value: gender,
      icon: genderIcon,
    },
    {
      label: "Marital Status",
      value: maritalStatus,
      icon: maritalStatusIcon,
    },
    {
      label: "Designation",
      value: designation || "--",
      icon: designationIcon,
    },
    {
      label: "Role",
      value: role || "--",
      icon: departmentIcon,
    },
  ];

  const hasPasswordAuth = userDetails?.loginMethod
    ?.toLowerCase()
    ?.includes("password");
  const getDependentVisibilityKey = useCallback((dependant: any, index: number) => {
    const idPart = Number.isFinite(Number(dependant?.id))
      ? String(Number(dependant.id))
      : `idx-${index}`;
    const namePart = String(dependant?.name ?? '').trim().toLowerCase();
    const relationPart = String(
      dependant?.relationship ?? dependant?.relation ?? '',
    )
      .trim()
      .toLowerCase();
    return `${idPart}:${namePart}:${relationPart}`;
  }, []);

  return (
    <ProfileContainer>
      <ProfileSectionContainer>
        <ProfileHeader>
          <ProfileHeaderLeft>
            <ProfileTitleBlock>
              <ProfileNameRow>
                <BackButton aria-label="Go back" onClick={() => navigate(-1)}>
                  <ArrowBackIosNewIcon fontSize="small" />
                </BackButton>
                <ProfileName>{employeeName}</ProfileName>
              </ProfileNameRow>
              <ProfileRole>{designation}</ProfileRole>
            </ProfileTitleBlock>
          </ProfileHeaderLeft>
          <ProfileHeaderActions>
            {/* {hasPasswordAuth && ( */}
              <ChangePasswordButton
                startIcon={
                  <img src={EditIcon} alt="" style={{ width: 16, height: 16 }} />
                }
                onClick={onProfileClick}
              >
                Change Password
              </ChangePasswordButton>
            {/* )} */}
            {(employeeDetails as any)?.allowEnrollmentReset === true && (
              <ChangePasswordButton
                variant="outlined"
                onClick={() => setShowResetModal(true)}
                sx={{ color: "#DC2626", borderColor: "#DC2626", "&:hover": { bgcolor: "#FEF2F2", borderColor: "#DC2626" } }}
              >
                Reset Enrolment
              </ChangePasswordButton>
            )}
            <LogoutButton onClick={handleLogout}>{LOGOUT}</LogoutButton>
          </ProfileHeaderActions>
        </ProfileHeader>
        <ProfileMetaRow>
          {profileDetails.map((detail) => (
            <ProfileMetaItem key={detail.label}>
              <ProfileIcon src={detail.icon} alt="" />
              <div>
                <ProfileMetaLabel>{detail.label}</ProfileMetaLabel>
                {detail.label === "Date of Birth" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ProfileMetaValue>
                      {employeeDobVisible ? (detail.value || "--") : (detail.value && detail.value !== "--" ? "**********" : "--")}
                    </ProfileMetaValue>
                    {detail.value && detail.value !== "--" && (
                      <IconButton
                        size="small"
                        onClick={() => setEmployeeDobVisible((v) => !v)}
                        aria-label={employeeDobVisible ? "Hide date of birth" : "Show date of birth"}
                        style={{ padding: 2 }}
                      >
                        <img src={employeeDobVisible ? eyeSlash : eye} alt={employeeDobVisible ? "Hide DOB" : "Show DOB"} style={{ width: 16, height: 16 }} />
                      </IconButton>
                    )}
                  </div>
                ) : (
                  <ProfileMetaValue>{detail.value || "--"}</ProfileMetaValue>
                )}
              </div>
            </ProfileMetaItem>
          ))}
        </ProfileMetaRow>
        {isChangePasswordOpen && (
          <EnrollmentChangePassword onClose={() => setIsChangePasswordOpen(false)} />
        )}
        <ContactAddressSection
          primaryContactInfo={{
            phone: employeeDetails?.phone,
            email: employeeDetails?.email,
          }}
        />
      </ProfileSectionContainer>

      <DependentsSectionContainer>
        <DependantsSection>
          <DependantsSectionHeader>
            <DependantsSectionTitle>Dependents</DependantsSectionTitle>
            <AddDependentActionButton
              variant="contained"
              onClick={handleOpenAddDependent}
              disabled={!canAddDependent || addOnlyDependents}
              // disabled
            >
              Add Dependent
            </AddDependentActionButton>
          </DependantsSectionHeader>

          {showDependentForm && (
            <DependentsFormWrapper>
              <DynamicForm
                key={formRenderKey}
                formConfig={dependentFormConfig}
                defaultValues={formInitialValues}
                formMethods={(methods) => {
                  formRef.current = methods;
                  if (methods?.watch) {
                    watchSubscriptionRef.current?.();
                    const subscription = methods.watch(
                      (value: { relationship?: string }, { name }: { name?: string }) => {
                        if (name === "relationship") {
                          const relationship = value?.relationship || "";
                          setSelectedRelationship(relationship);
                          setRelationshipValidationMessage(null);
                          if (relationship) {
                            const validation = canSelectRelationship(relationship);
                            if (!validation.allowed && validation.message) {
                              setRelationshipValidationMessage(validation.message);
                            }
                          }
                          methods.setValue("dateOfBirth", "");
                        }
                      },
                    );
                    watchSubscriptionRef.current = subscription.unsubscribe;
                  }
                }}
              />
              {relationshipValidationMessage && (
                <DependentsEmptyText>{relationshipValidationMessage}</DependentsEmptyText>
              )}
              <DependentsFormActions>
                <AddDependentActionButton variant="outlined" onClick={handleCancelAddDependent}>
                  Cancel
                </AddDependentActionButton>
                <AddDependentActionButton
                  variant="contained"
                  onClick={handleSaveDependent}
                  disabled={isSavingDependent}
                >
                  {isSavingDependent ? "Saving..." : editingDependentId ? "Update" : "Add"}
                </AddDependentActionButton>
              </DependentsFormActions>
            </DependentsFormWrapper>
          )}

          {dependants.length > 0 ? (
            <DependantsTableWrapper>
              <DependantsTableHeader>
                <DependantsTableHeaderCell>Name</DependantsTableHeaderCell>
                <DependantsTableHeaderCell>Relationship</DependantsTableHeaderCell>
                <DependantsTableHeaderCell>Gender</DependantsTableHeaderCell>
                <DependantsTableHeaderCell>Date Of Birth</DependantsTableHeaderCell>
                <DependantsTableHeaderCell>Actions</DependantsTableHeaderCell>
              </DependantsTableHeader>
              {dependants.map((dependant, index) => (
                <DependantsTableRow
                  key={`${dependant.name}-${dependant.relationship}-${index}`}
                >
                  <DependantsTableCell>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                      <span>{dependant.name}</span>
                      {(() => {
                        const depType = getRelationTypeForRelationship(
                          dependant.relationship || "",
                        );
                        const depDobTime = parseDateString(
                          dependant.rawDateOfBirth,
                        )?.getTime();
                        const multipleBirthLabel =
                          depType?.toLowerCase() === "children" &&
                          depDobTime !== undefined
                            ? multipleBirthLabelByDob.get(String(depDobTime))
                            : undefined;
                        return multipleBirthLabel ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              background: "#EEF2FF",
                              color: "#4338CA",
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "1px 7px",
                              borderRadius: "10px",
                              border: "1px solid #C7D2FE",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {multipleBirthLabel}
                          </span>
                        ) : null;
                      })()}
                    </Box>
                  </DependantsTableCell>
                  <DependantsTableCell>{capitalizeFirst(dependant.relationship)}</DependantsTableCell>
                  <DependantsTableCell>{dependant.gender}</DependantsTableCell>
                  <DependantsTableCell>
                    {(() => {
                      // No DOB available — render nothing in this cell (no value, no eye toggle).
                      const hasDob =
                        Boolean(dependant.dateOfBirth) && dependant.dateOfBirth !== "--";
                      if (!hasDob) return null;
                      const visibilityKey = getDependentVisibilityKey(dependant, index);
                      const isDobVisible = dobVisibility[visibilityKey] ?? false;
                      return (
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                          <span>
                            {(() => {
                              if (!isDobVisible) return "**********";
                              const parsedDob = parseDateString(dependant.dateOfBirth);
                              const age = parsedDob ? calculateAgeFromDate(parsedDob) : null;
                              return age !== null
                                ? `${dependant.dateOfBirth} (Age:${age})`
                                : dependant.dateOfBirth;
                            })()}
                          </span>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDobVisibility((prev) => ({
                                ...prev,
                                [visibilityKey]: !(prev[visibilityKey] ?? false),
                              }));
                            }}
                            aria-label={
                              isDobVisible ? "Hide date of birth" : "Show date of birth"
                            }
                          >
                            {isDobVisible ? (
                              <img src={eyeSlash} alt="Hide DOB" />
                            ) : (
                              <img src={eye} alt="Show DOB" />
                            )}
                          </IconButton>
                        </Box>
                      );
                    })()}
                  </DependantsTableCell>
                  <DependantsTableCell>
                    <DependantsActionsGroup>
                      <DependantsActionButton
                        onClick={() => handleEditDependent(dependant)}
                        disabled={(isSavingDependent || isDeletingDependent || isAnyPolicyLocked) || addOnlyDependents}
                        // disabled = {true}
                        aria-label={`Edit ${dependant.name}`}
                      >
                        <img src={EditIcon} alt="edit-icon" />
                      </DependantsActionButton>
                      <DependantsActionButton
                        onClick={() => setDeleteTargetDependent(dependant)}
                        disabled={(isSavingDependent || isDeletingDependent || isAnyPolicyLocked) || addOnlyDependents}
                        // disabled = {true}
                        aria-label={`Delete ${dependant.name}`}
                      >
                        <img src={DeleteRedIcon} alt="delete-icon" />
                      </DependantsActionButton>
                    </DependantsActionsGroup>
                  </DependantsTableCell>
                </DependantsTableRow>
              ))}
            </DependantsTableWrapper>
          ) : (
            <DependentsEmptyText>No dependents added yet.</DependentsEmptyText>
          )}
        </DependantsSection>
      </DependentsSectionContainer>

      <CustomModal
        open={Boolean(deleteTargetDependent)}
        handleClose={closeDeleteDependentModal}
        heading="Delete Dependent"
        modalBoxStyles={{
          width: "720px",
          maxWidth: "92vw",
          minHeight: "280px",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflowY: "auto",
        }}
        buttons={[
          {
            label: "Cancel",
            onClick: closeDeleteDependentModal,
            variant: "secondary",
            disabled: isDeletingDependent,
          },
          {
            label: isDeletingDependent ? "Deleting..." : "Delete",
            onClick: handleConfirmDeleteDependent,
            variant: "primary",
            disabled: isDeletingDependent,
          },
        ]}
      >
        <Typography sx={{ mb: 1.5 }}>
          This action will remove{" "}
          <Box component="span" sx={{ fontWeight: 700 }}>
            {(() => {
              const dependentName =
                (deleteTargetDependent?.name || "").trim() ||
                "the selected dependent";
              const dependentRelation = (
                deleteTargetDependent?.relationship || ""
              ).trim();

              return dependentRelation
                ? `${dependentName} (${dependentRelation})`
                : dependentName;
            })()}
          </Box>{" "}
          from your profile dependents.
        </Typography>
        {deleteTargetImpactedChoices.length > 0 ? (
          <>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Affected choices:</Typography>
            <Box component="ul" sx={{ margin: 0, paddingLeft: "20px" }}>
              {deleteTargetImpactedChoices.map((choiceLabel: string) => (
                <li key={choiceLabel}>
                  <Typography component="span">{choiceLabel}</Typography>
                </li>
              ))}
            </Box>
          </>
        ) : (
          <Typography>No mapped choices found</Typography>
        )}
      </CustomModal>

      <CustomModal
        open={showResetModal}
        handleClose={() => !isResetting && setShowResetModal(false)}
        heading="Reset Enrolment"
        modalBoxStyles={{ width: "500px", maxWidth: "92vw" }}
        buttons={[
          {
            label: "Cancel",
            onClick: () => setShowResetModal(false),
            variant: "secondary",
            disabled: isResetting,
          },
          {
            label: isResetting ? "Resetting..." : "Confirm Reset",
            onClick: handleResetEnrollment,
            variant: "primary",
            disabled: isResetting,
          },
        ]}
      >
        <Box sx={{ bgcolor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", p: 1.5, mb: 2 }}>
          <Typography sx={{ fontWeight: 700, color: "#DC2626", fontSize: 13, mb: 0.5 }}>⚠ Important — Read before proceeding</Typography>
          <Typography sx={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.6 }}>
            This will <strong>permanently delete</strong> all enrollment data including enrollment choices, dependents, claims, activity logs, confirmation mails, and support tickets. Your password will also be reset and you will be <strong>logged out immediately</strong>. This action cannot be recovered.
          </Typography>
        </Box>
      </CustomModal>
    </ProfileContainer>
  );
};

export default ProfileSection;
