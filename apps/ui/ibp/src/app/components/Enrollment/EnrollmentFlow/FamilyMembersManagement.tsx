import { capitalizeFirst } from "../../../utils";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckIcon from "@mui/icons-material/Check";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography,Tooltip, useMediaQuery } from "@mui/material";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import FamilyIcon from "../../../assets/svgs/family-member-management-icon.svg";
import DeleteRedIcon from "../../../assets/svgs/delete-red.svg";
import EditBlueIcon from "../../../assets/svgs/edit-blue-color-icon.svg";
import CommonButton from "../../../common/Button";
import CommonLoader from "../../../common/CommonLoader";
import {
  ADD_DEPENDENT,
  AGE_EXTENSION_DIALOGS,
  CANCEL,
  DELETE,
  FAMILY_MEMBERS_MANAGEMENT,
} from "../../../constants";
import {
  canDeleteDependent
} from "./utils/policyControlUtils";
import {
  ActionButtonsContainer,
  AddDependentButton,
  CardContainer,
  DeleteButton,
  DeleteIcon,
  IconButton1,
  FamilyContainer,
  FamilyImage,
  FormWrapper,
  Header,
  LoadingContainer,
  StyledDialogActions,
  Title,
  EmployeeDetailsToggleButton,
  EmployeeDetailsValueRow,
  AddCommonButton,
  CardMainContainer,
  TableHeaderRow,
  TableHeaderCell,
  TableDataRow,
  TableDataCell,
  TitleText,
  CommonButtonContainer,
  IconsContainer,
  EligibleRelationsStrip,
  EligibleRelationsLabel,
  EligibleRelationChip,
  ConstraintNote,
} from "./styles";
import { CustomModal, environment } from "@ui/ui-lib";
import { DependentDetails, RelationConstraints, RelationshipData } from "./types";
import {
  calculateAgeFromDate,
  getDateLimits,
  parseDateString,
  validateDateOfBirth,
} from "./utils/dateValidations";
import {
  canSelectRelationship as canSelectRelationshipUtil,
  getAgeConstraintsForRelationship as getAgeConstraintsForRelationshipUtil,
  getAvailableRelationshipOptions as getAvailableRelationshipOptionsUtil,
  getRelationTypeForRelationship as getRelationTypeForRelationshipUtil,
  getParentRole,
  isInLawRelationship,
  normalizeRelationship,
} from "./utils/relationshipFilters";
import usePolicyNote from "../../../hooks/usePolicyNote";
import eyeSlash from "../../../assets/svgs/eye-slash.svg";
import eye from "../../../assets/svgs/eye.svg";

// Normalize any date string to DD/MM/YYYY so keys built from API dates (YYYY-MM-DD)
// and form dates (DD/MM/YYYY) always compare equal for the same calendar day.
const normalizeDobForKey = (dateStr: string | undefined | null): string => {
  if (!dateStr) return "";
  const s = String(dateStr).trim().split("T")[0]; // strip time component
  if (s.includes("/")) {
    const parts = s.split("/");
    // already DD/MM/YYYY when the third segment is the 4-digit year
    if (parts[2] && parts[2].length === 4) return s;
    return s;
  }
  if (s.includes("-")) {
    const [yr, mo, dy] = s.split("-");
    if (yr.length === 4) return `${dy}/${mo}/${yr}`; // YYYY-MM-DD → DD/MM/YYYY
    return s;
  }
  return s;
};

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

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
};

// ── Multiple-birth (twin / triplet) child constraints ───────────────────────
// Beyond the configured children `maxCount`, a policy may allow extra children
// that share a birth event with an existing child:
//   • allowFirstChildAsTwin    → the ELDEST child may have 1 twin sibling   (eldest DOB group up to 2)
//   • twinsSecondChildAllowed   → the YOUNGEST child may have 1 twin sibling  (youngest DOB group up to 2)
//   • tripletsSecondChildAllowed → the YOUNGEST child may have 2 triplet siblings (youngest DOB group up to 3)
// These compose, e.g. allowFirstChildAsTwin + twinsSecondChildAllowed → maxCount + 2 (Twin + Twin).
export interface ChildMultipleBirthConfig {
  allowFirstChildAsTwin: boolean;
  twinsSecondChildAllowed: boolean;
  tripletsSecondChildAllowed: boolean;
}

const getChildMultipleBirthConfig = (
  constraints?:
    | {
        allowFirstChildAsTwin?: boolean;
        twinsSecondChildAllowed?: boolean;
        tripletsSecondChildAllowed?: boolean;
      }
    | null,
): ChildMultipleBirthConfig => ({
  allowFirstChildAsTwin: constraints?.allowFirstChildAsTwin === true,
  twinsSecondChildAllowed: constraints?.twinsSecondChildAllowed === true,
  tripletsSecondChildAllowed: constraints?.tripletsSecondChildAllowed === true,
});

// Max children that may share the youngest / eldest child's birth event.
const getYoungestGroupCap = (cfg: ChildMultipleBirthConfig): number =>
  cfg.tripletsSecondChildAllowed ? 3 : cfg.twinsSecondChildAllowed ? 2 : 1;
const getEldestGroupCap = (cfg: ChildMultipleBirthConfig): number =>
  cfg.allowFirstChildAsTwin ? 2 : 1;

// Extra children permitted beyond base maxCount given the active flags.
const getChildExtraSlots = (cfg: ChildMultipleBirthConfig): number =>
  (getEldestGroupCap(cfg) - 1) + (getYoungestGroupCap(cfg) - 1);

const isAnyMultipleBirthAllowed = (cfg: ChildMultipleBirthConfig): boolean =>
  cfg.allowFirstChildAsTwin ||
  cfg.twinsSecondChildAllowed ||
  cfg.tripletsSecondChildAllowed;

// Validates a complete set of child DOB timestamps against base `maxCount` plus
// the multiple-birth flags. Returns true when the whole set is permitted.
const isChildDobSetValid = (
  dobTimes: number[],
  maxCount: number,
  cfg: ChildMultipleBirthConfig,
): boolean => {
  if (!Number.isFinite(maxCount)) return true;
  const times = dobTimes.filter((t) => Number.isFinite(t));
  // Within the base allowance nothing extra needs justifying.
  if (times.length <= maxCount) return true;

  const counts = new Map<number, number>();
  times.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
  // The number of distinct birth events can never exceed the base maxCount.
  if (counts.size > maxCount) return false;

  const distinct = Array.from(counts.keys()).sort((a, b) => a - b);
  const eldestDob = distinct[0];
  const youngestDob = distinct[distinct.length - 1];
  const eldestCap = getEldestGroupCap(cfg);
  const youngestCap = getYoungestGroupCap(cfg);

  for (const [dob, count] of counts) {
    let cap = 1;
    if (dob === youngestDob) cap = Math.max(cap, youngestCap);
    if (dob === eldestDob) cap = Math.max(cap, eldestCap);
    if (count > cap) return false;
  }
  return true;
};

const normalizeChoiceKey = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? null : String(value);

const normalizeRelationshipText = (value?: string) =>
  String(value ?? "").trim().toLowerCase();

const isEnrollDebugEnabled = () =>
  typeof window !== "undefined" && Boolean((window as any).__ENROLL_DEBUG__);

const debugLog = (...args: any[]) => {
  if (isEnrollDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

const getDependentKey = (dependent: DependentDetails) =>
  dependent.tempKey ||
  `${(dependent.name || "").toLowerCase().trim()}_${dependent.dateOfBirth}_${(
    dependent.gender || ""
  ).toLowerCase()}`;

const selectionSlotSx = {
  width: 44,
  minWidth: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const checkboxButtonSx = {
  ...selectionSlotSx,
  padding: 0,
  borderRadius: 0,
  width: "20px",
  "&:hover": {
    backgroundColor: "transparent",
  },
};

const selectedCheckboxSx = {
  width: 16,
  height: 16,
  borderRadius: "4px",
  backgroundColor: "#1B4F95",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 0 0 1px #123B72 inset",
};

const disabledSelfCheckboxSx = {
  width: 16,
  height: 16,
  borderRadius: "4px",
  backgroundColor: "#D9DDE3",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 0 0 1px #C1C7D0 inset",
};

const unselectedCheckboxSx = {
  width: 16,
  height: 16,
  borderRadius: "4px",
  boxSizing: "border-box",
  border: "1px solid #C7CBD1",
  backgroundColor: "#FFFFFF",
};

const matchesPolicySelection = (
  dependent: DependentDetails,
  parentpolicyComponentActionTypeId?: string | null,
  policyComponentActionTypeId?: string | null,
): boolean => {
  const currentParentId = normalizeChoiceKey(parentpolicyComponentActionTypeId);
  const currentAddonId = normalizeChoiceKey(policyComponentActionTypeId);

  const matchesIds = (
    depParentId: number | string | null | undefined,
    depAddonId: number | string | null | undefined,
  ) =>
    normalizeChoiceKey(depParentId) === currentParentId &&
    normalizeChoiceKey(depAddonId) === currentAddonId;

  // When the dependent has an explicit choices array (even empty), use it as the
  // authoritative source.  An empty array means the dependent has been removed from
  // all policy components and should NOT match, regardless of the top-level ID fields
  // (which may be null/undefined and would otherwise match a base policy with null IDs).
  if (Array.isArray(dependent.choices)) {
    return dependent.choices.some((choice) =>
      matchesIds(
        choice.parentpolicyComponentActionTypeId,
        choice.policyComponentActionTypeId,
      ),
    );
  }

  // Fallback for dependents without a choices array (legacy / old-structure records).
  return matchesIds(
    dependent.parentpolicyComponentActionTypeId,
    dependent.policyComponentActionTypeId,
  );
};

interface StoredEmployeeDetails {
  employeeName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string | { key?: string; value?: string; label?: string };
}

interface FamilyMembersManagementProps {
  relationConstraints?: RelationConstraints;
  familyMemberDetails: Record<string, DependentDetails[]>;
  profileSuggestedDependents?: any[];
  onProfileSuggestedDepDeleted?: (dep: any) => void;
  onFamilyMemberChange: (updated: Record<string, DependentDetails[]>) => void;
  isPolicyComponentsLoading: boolean;
  isReadOnly?: boolean;
  disableAddDependent?: boolean;
  lockedDependents?: DependentDetails[];
  parentpolicyComponentActionTypeId?: string;
  policyComponentActionTypeId?: string;
  policyComponentActionLabel?: string | null;
  policyComponentActionType?: string | null;
  acceptRelationsFromParent?: boolean;
  onEmployeeExclusionChange?: (isExcluded: boolean) => void;
  isEmployeeExcluded?: boolean;
  onPolicyComponentRemoval?: (
    parentpolicyComponentActionTypeId?: string,
    policyComponentActionTypeId?: string,
    policyComponentActionType?: string,
    policyComponentActionLabel?: string
  ) => void;
  // Employee's additionalDetails (from company-employee-details), used only to
  // resolve the optional "Max Dependent Count" parameter's overall cap below.
  employeeAdditionalDetails?: Record<string, unknown>;
  // Drives the Strapi-authored "Policy Note" block. Omitted → no note rendered.
  policyId?: string | number | null;
}

const defaultFormValues = {
  name: "",
  relationship: "",
  gender: "",
  dateOfBirth: "",
};

const SCROLL_OFFSET_PX = 120;

const buildProfileOnlyKey = (dep: any) => {
  const name = String(dep?.name ?? "")
    .trim()
    .toLowerCase();
  const relation = String(dep?.relation ?? dep?.relationship ?? dep?.relationshipType ?? "")
    .trim()
    .toLowerCase();
  const dob = String(dep?.dateOfBirth ?? "").trim();
  const gender = String(dep?.gender ?? "")
    .trim()
    .toLowerCase();

  return [name, relation, dob, gender].join("|");
};

const toFamilyMemberMap = (
  dependents: DependentDetails[],
  profileSuggestedDependents?: any[],
  deletedProfileKeys?: Set<string>,
) => {
  debugLog("dependents to be mapped to family member details:", dependents);
  const profileOnlyKeySet = new Set<string>();
  if (Array.isArray(profileSuggestedDependents)) {
    profileSuggestedDependents.forEach((dep: any) => {
      const key = buildProfileOnlyKey(dep);
      if (key) profileOnlyKeySet.add(key);
    });
  }

  return dependents.reduce<Record<string, DependentDetails[]>>(
    (acc, dependent) => {
      const hasChoices = Array.isArray(dependent.choices) && dependent.choices.length > 0;

      // Exclude profile-only suggested deps (no choices, not manually added via form).
      // But keep real dependents even when unchecked (choices can become []).
      // Exception: if the dep has a backend ID it must be preserved so the backend
      // doesn't silently delete it when the user saves without enrolling it yet.
      if (!dependent.isManuallyAdded && !hasChoices) {
        const hasBackendId =
          dependent.id != null && Number.isFinite(Number(dependent.id));

        const isInjectedProfileOnly =
          typeof dependent?.tempKey === "string" &&
          dependent.tempKey.startsWith("profile:");
        if (isInjectedProfileOnly && !hasBackendId) {
          return acc;
        }

        if (!isInjectedProfileOnly) {
          const profileOnlyKey = buildProfileOnlyKey(dependent);
          const deletedKey = `${String(dependent?.name ?? "")
            .trim()
            .toLowerCase()}_${String(dependent?.relationship ?? dependent?.relationshipType ?? "")
            .trim()
            .toLowerCase()}`;

          const isProfileOnly =
            (profileOnlyKey && profileOnlyKeySet.has(profileOnlyKey)) ||
            (deletedProfileKeys && deletedProfileKeys.has(deletedKey));

          if (isProfileOnly && !hasBackendId) {
            return acc;
          }
        }
      }
      const relationKey = normalizeRelationship(
        dependent.relationshipType || dependent.relationship,
      );

      if (!relationKey) {
        return acc;
      }

      const normalizedDependent: DependentDetails = {
        ...dependent,
        relationship: dependent.relationship,
        relationshipType: dependent.relationshipType || dependent.relationship,
      };

      if (acc[relationKey]) {
        acc[relationKey] = [...acc[relationKey], normalizedDependent];
      } else {
        acc[relationKey] = [normalizedDependent];
      }

      return acc;
    },
    {},
  );
};

const FamilyMembersManagement: React.FC<FamilyMembersManagementProps> = ({
  relationConstraints,
  familyMemberDetails,
  profileSuggestedDependents,
  onProfileSuggestedDepDeleted,
  onFamilyMemberChange,
  isPolicyComponentsLoading,
  isReadOnly = false,
  disableAddDependent = false,
  lockedDependents = [],
  parentpolicyComponentActionTypeId,
  policyComponentActionTypeId,
  policyComponentActionLabel,
  policyComponentActionType,
  acceptRelationsFromParent = false,
  onEmployeeExclusionChange,
  isEmployeeExcluded = false,
  onPolicyComponentRemoval,
  employeeAdditionalDetails,
  policyId,
}) => {
  const { notes: policyNotes } = usePolicyNote(policyId);
  // Kill switch: the Strapi-authored Policy Note block only renders when the
  // flag is on, independent of what is published in the CMS.
  const showPolicyNotes =
    environment.featureFlag.FF_IBP_PARENTAL_LOCK_IN && policyNotes.length > 0;
  debugLog("FamilyMembersManagement rendered with props:", isReadOnly);
  const [dependents, setDependents] = useState<DependentDetails[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<string>("");
  const [formKey, setFormKey] = useState(0); // Force form re-render when constraints change
  const [employeeDetails, setEmployeeDetails] =
    useState<StoredEmployeeDetails>();
  const [genderOptions] = useState([
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ]);
  const [dobVisibility, setDobVisibility] = useState<Record<string, boolean>>(
    {},
  );

  const [showStudyingSonPopup, setShowStudyingSonPopup] = useState(false);
  const [showUnmarriedDaughterPopup, setShowUnmarriedDaughterPopup] =
    useState(false);
  const [deleteTargetDependent, setDeleteTargetDependent] =
    useState<DependentDetails | null>(null);
  const deletedProfileKeysRef = useRef<Set<string>>(new Set());
  const [pendingDependent, setPendingDependent] =
    useState<DependentDetails | null>(null);
  const [editingDependentKey, setEditingDependentKey] = useState<string | null>(null);
  const [editingDependentData, setEditingDependentData] = useState<DependentDetails | null>(null);
  const relationshipSyncRef = useRef<string>("");
  const formRef = useRef<
    UseFormReturn<{
      name: string;
      relationship: string;
      gender: string;
      dateOfBirth: string;
    }>
  >(null);
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const cardMainContainerRef = useRef<HTMLDivElement | null>(null);

  // Ref to store the watch subscription for cleanup
  const watchSubscriptionRef = useRef<(() => void) | null>(null);

  // Tracks the last sync key used for auto-enrolling locked dependents so the
  // effect is idempotent and doesn't re-run on unrelated re-renders.
  const prevLockedSyncKeyRef = useRef<string>("");


  const isMidRange = useMediaQuery('(min-width:1025px) and (max-width:1280px)');
  const formGridColumn = isMidRange ? 4 : 3;
  const relationshipGridColumn = isMidRange ? 6 : 3;
  const nameGridColumn = isMidRange ? 4 : 2;

  const isParentalPolicySelection = React.useMemo(() => {
    const actionType = (policyComponentActionType ?? "").toLowerCase();
    const actionLabel = (policyComponentActionLabel ?? "").toLowerCase();

    return (
      actionType.includes("parent") ||
      actionLabel.includes("parental") ||
      actionLabel.includes("parent")
    );
  }, [policyComponentActionLabel, policyComponentActionType]);

  const visibleDependents = React.useMemo(() => {    
    const filtered = dependents.filter((dependent) =>
      matchesPolicySelection(
        dependent,
        parentpolicyComponentActionTypeId,
        policyComponentActionTypeId,
      ),
    );
    
    return filtered;
  }, [
    dependents,
    parentpolicyComponentActionTypeId,
    policyComponentActionTypeId,
    policyComponentActionType,
    policyComponentActionLabel,
  ]);

  // Use API data - handle nested structure from API (relationConstraints.relationships)
  const policyData = React.useMemo<any | undefined>(() => {
    if (!relationConstraints) {
      return undefined;
    }

    // Case 1: relationships already structured correctly
    if (relationConstraints.relationships) {
      return {
        ...relationConstraints.relationships,
        policyTemplate: relationConstraints.policyTemplate, // attach here also
      };
    }

    // Case 2: relationships not present → relationConstraints itself is the data
    const { eligibleOptions, ...rest } = relationConstraints as any;

    return {
      ...(rest as RelationshipData),
      policyTemplate: relationConstraints.policyTemplate, // explicitly include policyTemplate
    };
  }, [relationConstraints]);

  // Optional overall dependent-count cap, independent of and additive to the
  // per-relation-type maxCount checks below. Only active when the policy has
  // a `max-dependent-count` parameter configured AND the employee's own
  // additionalDetails value matches one of its labeled options — otherwise
  // this resolves to undefined and the existing per-type-only behavior is
  // completely unchanged (FR: must not affect policies without this param).
  const maxDependentCountOverall = React.useMemo<number | undefined>(() => {
    const parameters = (relationConstraints as any)?.policyComponentsConfiguration
      ?.parameters;
    if (!Array.isArray(parameters)) return undefined;

    const param = parameters.find((p: any) => p?.type === "max-dependent-count");
    const options = param?.maxDependentCountConfig?.options;
    if (!Array.isArray(options) || options.length === 0) return undefined;

    const employeeLabel = String(
      employeeAdditionalDetails?.[param?.parameterMasterName ?? param?.displayName] ?? ""
    ).trim();
    if (!employeeLabel) return undefined;

    const matched = options.find(
      (opt: any) => String(opt?.label ?? "").trim() === employeeLabel
    );
    const max = matched ? parseInt(String(matched.max), 10) : NaN;
    return Number.isFinite(max) ? max : undefined;
  }, [relationConstraints, employeeAdditionalDetails]);

  // Eligible relations for the *current* component, pulled from the policy template
  // (base/parental main or addon). Disambiguates between base and parental scopes via
  // parentpolicyComponentActionTypeId — addons with the same optionId can appear under
  // both base and parental with different eligibleRelations, so parentId decides which
  // bucket to look in.
  const eligibleRelationsForComponent = React.useMemo<string[]>(() => {
    const template = policyData?.policyTemplate;
    if (!template) return [];
    const componentId = policyComponentActionTypeId ? Number(policyComponentActionTypeId) : null;
    const parentId = parentpolicyComponentActionTypeId ? Number(parentpolicyComponentActionTypeId) : null;
    if (componentId == null || !Number.isFinite(componentId)) return [];

    const norm = (arr: any): string[] =>
      Array.isArray(arr)
        ? Array.from(new Set(arr.map((r: string) => String(r).trim()).filter(Boolean)))
        : [];

    const basePolicyMainId =
      template.basePolicy?.mainPolicyId != null ? Number(template.basePolicy.mainPolicyId) : null;
    const parentalPolicyMainId =
      template.parentalPolicy?.mainPolicyId != null ? Number(template.parentalPolicy.mainPolicyId) : null;

    // No parent → component is itself a main policy (base or parental)
    if (parentId == null || parentId === 0) {
      if (basePolicyMainId != null && componentId === basePolicyMainId) {
        return norm(template.basePolicy.eligibleRelations);
      }
      if (parentalPolicyMainId != null && componentId === parentalPolicyMainId) {
        return norm(template.parentalPolicy.eligibleRelations);
      }
      return [];
    }

    // Parent matches base main → look up addon under basePolicy.addonIds
    if (basePolicyMainId != null && parentId === basePolicyMainId) {
      const addon = (template.basePolicy?.addonIds || []).find(
        (a: any) => Number(a?.optionId) === componentId,
      );
      return norm(addon?.eligibleRelations ?? template.basePolicy.eligibleRelations);
    }

    // Parent matches parental main → look up addon under parentalPolicy.addonIds
    if (parentalPolicyMainId != null && parentId === parentalPolicyMainId) {
      const addon = (template.parentalPolicy?.addonIds || []).find(
        (a: any) => Number(a?.optionId) === componentId,
      );
      return norm(addon?.eligibleRelations ?? template.parentalPolicy.eligibleRelations);
    }

    return [];
  }, [policyData, parentpolicyComponentActionTypeId, policyComponentActionTypeId]);

  // Show the 2-year lock-in note on any component where parents / parents-in-law
  // are eligible (covers the parental main policy AND parental add-ons), gated by
  // the FF_IBP_PARENTAL_LOCK_IN feature flag.
  const showParentalLockIn = React.useMemo(() => {
    if (!environment.featureFlag.FF_IBP_PARENTAL_LOCK_IN) return false;
    return eligibleRelationsForComponent.some((r) => {
      const v = String(r).toLowerCase();
      return v.includes("parent") || v.includes("father") || v.includes("mother");
    });
  }, [eligibleRelationsForComponent]);

  // Counts selected dependents per relation type for the current policy component.
  // Used to enforce maxCount on the eligible-dependent checkboxes.
  const relationTypeCountsForComponent = React.useMemo(() => {
    const counts: Record<string, number> = {};
    visibleDependents.forEach((dep) => {
      const relationType =
        getRelationTypeForRelationshipUtil(policyData, dep.relationship || dep.relationshipType || "") || "";
      if (relationType) {
        counts[relationType] = (counts[relationType] || 0) + 1;
      }
    });
    return counts;
  }, [visibleDependents, policyData]);

  // Helper function to check if "Self" is allowed based on eligibleRelations using ID-based matching
  const isSelfAllowedInPolicy = React.useMemo(() => {
    if (!policyData?.policyTemplate) {
      return true; // Fallback to allow if no policy template found
    }

    const template = policyData.policyTemplate;
    let eligibleRelations: string[] = [];

    // Convert IDs to numbers for comparison (handle null properly)
    const currentActionId = policyComponentActionTypeId ? Number(policyComponentActionTypeId) : null;
    const parentActionId = parentpolicyComponentActionTypeId ? Number(parentpolicyComponentActionTypeId) : null;

    // Try to match based on policy template structure using IDs
    // Check basePolicy main policy ID
    if (template.basePolicy?.mainPolicyId) {
      const basePolicyId = Number(template.basePolicy.mainPolicyId);
      if ((currentActionId !== null && currentActionId === basePolicyId) || 
          (parentActionId !== null && parentActionId === basePolicyId)) {
        eligibleRelations = template.basePolicy.eligibleRelations || [];
      }
    }

    // Check parentalPolicy main policy ID
    if (template.parentalPolicy?.mainPolicyId && eligibleRelations.length === 0) {
      const parentalPolicyId = Number(template.parentalPolicy.mainPolicyId);
      if ((currentActionId !== null && currentActionId === parentalPolicyId) || 
          (parentActionId !== null && parentActionId === parentalPolicyId)) {
        eligibleRelations = template.parentalPolicy.eligibleRelations || [];
      }
    }

    // Check basePolicy addons by ID
    if (template.basePolicy?.addonIds && eligibleRelations.length === 0) {
      const matchingAddon = template.basePolicy.addonIds.find((addon: any) => {
        const addonId = addon.optionId ? Number(addon.optionId) : null;
        return (currentActionId !== null && addonId !== null && currentActionId === addonId) ||
               (parentActionId !== null && addonId !== null && parentActionId === addonId);
      });
      if (matchingAddon) {
        eligibleRelations = matchingAddon.eligibleRelations || [];
      }
    }

    // Check parentalPolicy addons by ID
    if (template.parentalPolicy?.addonIds && eligibleRelations.length === 0) {
      const matchingAddon = template.parentalPolicy.addonIds.find((addon: any) => {
        const addonId = addon.optionId ? Number(addon.optionId) : null;
        return (currentActionId !== null && addonId !== null && currentActionId === addonId) ||
               (parentActionId !== null && addonId !== null && parentActionId === addonId);
      });
      if (matchingAddon) {
        eligibleRelations = matchingAddon.eligibleRelations || [];
      }
    }

    // Check if "Self" is in eligibleRelations (case-insensitive)
    return eligibleRelations.some(relation => relation.toLowerCase() === "self");
  }, [policyData, policyComponentActionTypeId, parentpolicyComponentActionTypeId]);

  debugLog("isSelfAllowedInPolicy", isSelfAllowedInPolicy);

  const constraints = relationConstraints?.constraints;

  const crossParentsAllowed = constraints?.crossParentsAllowed ?? true;
  const sameGenderParentsAllowed =
    constraints?.sameGenderParentsAllowed !== false;
  const studyingSonAgeExtension = toNumber(
    constraints?.studyingSonAgeExtension,
  );
  const unmarriedDaughterAgeExtension = toNumber(
    constraints?.unmarriedDaughterAgeExtension,
  );
  const allowMaleEmployeesCoverParents =
    constraints?.maleEmployeesCoverParents !== false;
  const allowMaleEmployeesCoverInLaws =
    constraints?.maleEmployeesCoverInLaws !== false;
  const allowFemaleEmployeesCoverParents =
    constraints?.femaleEmployeesCoverParents !== false;
  const allowFemaleEmployeesCoverInLaws =
    constraints?.femaleEmployeesCoverInLaws !== false;
  const parentAgeGapRequirement = toNumber(
    constraints?.ageGapBetweenParentAndEmployee,
  );
  const childAgeGapRequirement = toNumber(
    constraints?.ageGapBetweenChildrenAndEmployee,
  );
  const childMultipleBirthConfig = React.useMemo(
    () => getChildMultipleBirthConfig(constraints),
    [constraints],
  );
  const twinsSecondChildAllowed = childMultipleBirthConfig.twinsSecondChildAllowed;
  const allowFirstChildAsTwin = childMultipleBirthConfig.allowFirstChildAsTwin;
  const tripletsSecondChildAllowed = childMultipleBirthConfig.tripletsSecondChildAllowed;
  const anyMultipleBirthAllowed = isAnyMultipleBirthAllowed(childMultipleBirthConfig);
  const childExtraSlots = getChildExtraSlots(childMultipleBirthConfig);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedUser = window.sessionStorage.getItem("user");
      if (!storedUser) {
        setEmployeeDetails(undefined);
        return;
      }

      const parsedUser = JSON.parse(storedUser) as StoredEmployeeDetails;
      setEmployeeDetails(parsedUser);
    } catch (_error) {
      setEmployeeDetails(undefined);
    }
  }, []);

  const employeeDateOfBirth = React.useMemo(
    () => parseDateString(employeeDetails?.dateOfBirth),
    [employeeDetails?.dateOfBirth],
  );

  const employeeAge = React.useMemo(
    () =>
      employeeDateOfBirth ? calculateAgeFromDate(employeeDateOfBirth) : null,
    [employeeDateOfBirth],
  );

  const getAgeDisplay = React.useCallback((dateOfBirth?: string) => {
    const parsedDateOfBirth = parseDateString(dateOfBirth);
    if (!parsedDateOfBirth) return null;

    const age = calculateAgeFromDate(parsedDateOfBirth);
    return Number.isFinite(age) ? `${age}` : null;
  }, []);

  // Existing children's DOB timestamps (sorted ascending: eldest first), excluding the row being edited.
  // Shared by the multiple-birth (twin/triplet) count gating and DOB validation below.
  const childDobTimes = React.useMemo(() => {
    const base = editingDependentKey
      ? visibleDependents.filter((dep) => getDependentKey(dep) !== editingDependentKey)
      : visibleDependents;
    return base
      .filter((dep) => {
        const rel = dep.relationship || dep.relationshipType || "";
        return getRelationTypeForRelationshipUtil(policyData, rel)?.toLowerCase() === "children";
      })
      .map((dep) => parseDateString(dep.dateOfBirth)?.getTime())
      .filter((t): t is number => t !== undefined)
      .sort((a, b) => a - b);
  }, [visibleDependents, editingDependentKey, policyData]);

  const formatDobTime = React.useCallback((time: number) => {
    const d = new Date(time);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }, []);

  // Birth events an extra (beyond-maxCount) child may join — only groups that
  // still have spare capacity, each labelled by its position so the message is accurate.
  const allowedMultipleBirthDobs = React.useMemo(() => {
    const entries: { label: string; dob: string }[] = [];
    if (!anyMultipleBirthAllowed || childDobTimes.length === 0) return entries;
    const eldestTime = childDobTimes[0];
    const youngestTime = childDobTimes[childDobTimes.length - 1];
    const eldestCount = childDobTimes.filter((t) => t === eldestTime).length;
    const youngestCount = childDobTimes.filter((t) => t === youngestTime).length;
    const eldestCap = getEldestGroupCap(childMultipleBirthConfig);
    const youngestCap = getYoungestGroupCap(childMultipleBirthConfig);

    // All existing children share a single birth event — its cap is the larger applicable one.
    if (eldestTime === youngestTime) {
      const cap = Math.max(
        allowFirstChildAsTwin ? eldestCap : 1,
        twinsSecondChildAllowed || tripletsSecondChildAllowed ? youngestCap : 1,
      );
      if (eldestCount < cap) {
        entries.push({ label: "the existing child", dob: formatDobTime(eldestTime) });
      }
      return entries;
    }

    if (allowFirstChildAsTwin && eldestCount < eldestCap) {
      entries.push({ label: "the elder child", dob: formatDobTime(eldestTime) });
    }
    if (
      (twinsSecondChildAllowed || tripletsSecondChildAllowed) &&
      youngestCount < youngestCap
    ) {
      entries.push({ label: "the younger child", dob: formatDobTime(youngestTime) });
    }
    return entries;
  }, [
    anyMultipleBirthAllowed,
    childDobTimes,
    childMultipleBirthConfig,
    allowFirstChildAsTwin,
    twinsSecondChildAllowed,
    tripletsSecondChildAllowed,
    formatDobTime,
  ]);

  // Maps each normalized child DOB (DD/MM/YYYY) shared by multiple children to its
  // multiple-birth label — "Twin" when 2 share it, "Triplet" when 3+ do — driving the list tag.
  // Uses normalized strings rather than timestamps to avoid UTC vs local-midnight mismatches
  // between ISO API dates and DD/MM/YYYY form dates.
  const multipleBirthLabelByDob = React.useMemo(() => {
    const items = visibleDependents
      .filter((dep) => {
        const rel = dep.relationship || dep.relationshipType || "";
        return getRelationTypeForRelationshipUtil(policyData, rel)?.toLowerCase() === "children";
      })
      .map((dep) => ({
        key: normalizeDobForKey(dep.dateOfBirth),
        order: parseDateString(dep.dateOfBirth)?.getTime() ?? 0,
      }))
      .filter((item) => item.key);
    return buildMultipleBirthLabels(items);
  }, [visibleDependents, policyData]);

  const employeeGender = React.useMemo(() => {
    if (!employeeDetails?.gender) return undefined;

    if (typeof employeeDetails.gender === "string") {
      const normalizedKey = employeeDetails.gender.toLowerCase();
      if (normalizedKey === "gender_type_male" || normalizedKey === "male") {
        return "male";
      }
      if (
        normalizedKey === "gender_type_female" ||
        normalizedKey === "female"
      ) {
        return "female";
      }
      return normalizedKey;
    }

    const normalizedKey = employeeDetails.gender?.key?.toLowerCase();
    if (normalizedKey === "gender_type_male") {
      return "male";
    }

    if (normalizedKey === "gender_type_female") {
      return "female";
    }

    return normalizedKey;
  }, [employeeDetails?.gender]);

  const employeeGenderDisplay = React.useMemo(() => {
    if (!employeeGender) {
      return "--";
    }

    if (employeeGender === "male") {
      return "Male";
    }

    if (employeeGender === "female") {
      return "Female";
    }

    return employeeGender.charAt(0).toUpperCase() + employeeGender.slice(1);
  }, [employeeGender]);

  const constraintFilteredEligibleRelations = React.useMemo(() => {
    const inLawRelations = ["mother-in-law", "father-in-law"];
    const parentRelations = ["father", "mother"];
    // Addon components (parental/top-up addons) have explicit eligibleRelations
    // defined in the template — those are already the authority for what's allowed.
    // Don't apply base-policy gender constraints to override them.
    const isAddonComponent = Boolean(
      parentpolicyComponentActionTypeId && Number(parentpolicyComponentActionTypeId) > 0,
    );
    const canCoverInLaws = isAddonComponent
      ? true
      : employeeGender === "male"
        ? allowMaleEmployeesCoverInLaws
        : employeeGender === "female"
          ? allowFemaleEmployeesCoverInLaws
          : true;
    const canCoverParents = isAddonComponent
      ? true
      : employeeGender === "male"
        ? allowMaleEmployeesCoverParents
        : employeeGender === "female"
          ? allowFemaleEmployeesCoverParents
          : true;
    return eligibleRelationsForComponent.filter((r) => {
      const lower = r.toLowerCase();
      if (inLawRelations.includes(lower) && !canCoverInLaws) return false;
      if (parentRelations.includes(lower) && !canCoverParents) return false;
      return true;
    });
  }, [
    eligibleRelationsForComponent,
    parentpolicyComponentActionTypeId,
    employeeGender,
    allowMaleEmployeesCoverInLaws,
    allowFemaleEmployeesCoverInLaws,
    allowMaleEmployeesCoverParents,
    allowFemaleEmployeesCoverParents,
  ]);

  // Helper function to format gender for display
  const formatGenderDisplay = React.useCallback((gender: string | undefined) => {
    if (!gender) {
      return "--";
    }

    const normalizedGender = gender.toLowerCase().trim();

    // Handle short forms
    if (normalizedGender === "m" || normalizedGender === "male" || normalizedGender === "gender_type_male") {
      return "Male";
    }

    if (normalizedGender === "f" || normalizedGender === "female" || normalizedGender === "gender_type_female") {
      return "Female";
    }

    if (normalizedGender === "o" || normalizedGender === "other") {
      return "Other";
    }

    // Capitalize first letter for any other value
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  }, []);

  useEffect(() => {
    if (!familyMemberDetails) {
      setDependents([]);
      return;
    }
    
    // Convert the flat family member details to unified dependents structure
    const allDependents: DependentDetails[] = [];
    
    // Handle different data structures for familyMemberDetails
    if (familyMemberDetails && typeof familyMemberDetails === 'object') {
        // If it's an array, process each item directly
        if (Array.isArray(familyMemberDetails)) {
        debugLog("Processing array of dependents:", familyMemberDetails);
        familyMemberDetails.forEach((member: any) => {
          const dependentKey = `${(member.name || '').toLowerCase().trim()}_${normalizeDobForKey(member.dateOfBirth)}_${(member.gender || '').toLowerCase()}`;

          let memberChoices: any[] = [];
          if (Array.isArray(member.choices)) {
            memberChoices = member.choices.filter((choice: any) => {
              return choice && 
                     typeof choice === 'object' && 
                     choice.policyComponentActionTypeId &&
                     choice.policyComponentActionTypeId !== null &&
                     choice.policyComponentActionTypeId !== undefined;
            });
          }
          
          const newDependent: DependentDetails = {
            id: member.id,
            tempKey: member.tempKey || dependentKey,
            isManuallyAdded: Boolean(member.isManuallyAdded),
            name: member.name,
            relationship: member.relation || member.relationship,
            relationshipType: member.relationshipType || member.relation || member.relationship,
            dateOfBirth: member.dateOfBirth,
            gender: member.gender,
            choices: memberChoices,
          } as DependentDetails;
          
          allDependents.push(newDependent);
        });
      }
      // If it has name/relationship properties, it's a single dependent
      else if (familyMemberDetails.name && familyMemberDetails.relationship) {
        debugLog("Processing single dependent:", familyMemberDetails);
        
        const member = familyMemberDetails;
        const dependentKey = `${(member.name || '').toLowerCase().trim()}_${normalizeDobForKey(member.dateOfBirth)}_${(member.gender || '').toLowerCase()}`;
        
        let memberChoices: any[] = [];
        
        if (Array.isArray(member.choices)) {
          memberChoices = member.choices.filter((choice: any) => {
            return choice && 
                   typeof choice === 'object' && 
                   choice.policyComponentActionTypeId &&
                   choice.policyComponentActionTypeId !== null &&
                   choice.policyComponentActionTypeId !== undefined;
          });
        }
        
        const newDependent: DependentDetails = {
          id: member.id,
          tempKey: member.tempKey || dependentKey,
          isManuallyAdded: Boolean(member.isManuallyAdded),
          name: member.name,
          relationship: member.relationship,
          relationshipType: member.relationshipType || member.relationship,
          dateOfBirth: member.dateOfBirth,
          gender: member.gender,
          choices: memberChoices,
          parentpolicyComponentActionTypeId: member.parentpolicyComponentActionTypeId,
          policyComponentActionTypeId: member.policyComponentActionTypeId,
          policyComponentActionLabel: member.policyComponentActionLabel,
          policyComponentActionType: member.policyComponentActionType,
        } as DependentDetails;
        
        if (memberChoices.length > 0) {
          debugLog(
            " Added dependent with valid choices:",
            newDependent.name,
            "choices:",
            memberChoices,
          );
        }
        
        allDependents.push(newDependent);
      } else {
        // It's the expected grouped structure
        Object.entries(familyMemberDetails).forEach(([relationshipType, members]) => {
          // Ensure members is an array before processing
          if (!Array.isArray(members)) {
            debugLog(
              "Skipping non-array members for relationship:",
              relationshipType,
              members,
            );
            return;
          }
          
          members.forEach((member: any) => {
            debugLog("familyMemberDetails", familyMemberDetails);
            debugLog(
              " Processing member:",
              member.name,
              "with choices:",
              member.choices,
            );
            
            // Create a consistent key for this dependent (name + DOB + gender)
            const dependentKey = `${(member.name || '').toLowerCase().trim()}_${normalizeDobForKey(member.dateOfBirth)}_${(member.gender || '').toLowerCase()}`;
            
            // Process choices array (this is where policy component data is stored)
            let memberChoices: any[] = [];
        if (member.choices && Array.isArray(member.choices)) {
          // Process each choice in the member's choices array
          memberChoices = member.choices.filter((choice: any) => {
            // Only include choices that have valid policy component data
            return choice.policyComponentActionTypeId !== undefined && 
                   choice.policyComponentActionTypeId !== null &&
                   choice.policyComponentActionTypeId !== '';
          });
          
          debugLog(
            " Found valid choices for",
            member.name,
            ":",
            memberChoices.length,
          );
        }
        
        // Check if this dependent already exists in our unified list using the key
        let existingIndex = allDependents.findIndex(dep => {
          const existingKey = `${(dep.name || '').toLowerCase().trim()}_${normalizeDobForKey(dep.dateOfBirth)}_${(dep.gender || '').toLowerCase()}`;
          return existingKey === dependentKey;
        });
        
        // If no valid choices found, still create dependent but with empty choices
        if (memberChoices.length === 0) {
          debugLog(
            " No valid choices found for:",
            member.name,
            "Creating dependent with empty choices",
          );
          
          if (existingIndex < 0) {
            // Create new dependent without valid choices
            allDependents.push({
              id: member.id, // Preserve existing ID if available
              tempKey: dependentKey, // Use consistent key based on person's data
              isManuallyAdded: Boolean(member.isManuallyAdded),
              name: member.name,
              relationship: member.relation || member.relationship,
              relationshipType,
              dateOfBirth: member.dateOfBirth,
              gender: member.gender,
              choices: [] // Empty choices array for dependents without valid policy data
            });
            debugLog(" Created new dependent without valid choices:", member.name);
          }
          return; // Skip further processing for this member
        }
        
        // If dependent doesn't exist yet, create it with all choices at once
        if (existingIndex < 0) {
          const allChoicesForMember = memberChoices.map((memberChoice: any) => ({
            policyComponentActionTypeId: memberChoice.policyComponentActionTypeId,
            parentpolicyComponentActionTypeId: memberChoice.parentpolicyComponentActionTypeId,
            policyComponentActionLabel: memberChoice.policyComponentActionLabel,
            policyComponentActionType: memberChoice.policyComponentActionType
          }));
          
          // Create new dependent with all choices
          allDependents.push({
            id: member.id, // Preserve existing ID if available
            tempKey: dependentKey, // Use consistent key based on person's data
            isManuallyAdded: Boolean(member.isManuallyAdded),
            name: member.name,
            relationship: member.relation || member.relationship,
            relationshipType,
            dateOfBirth: member.dateOfBirth,
            gender: member.gender,
            choices: allChoicesForMember
          });
          debugLog(
            " Created new dependent with",
            allChoicesForMember.length,
            "choices:",
            member.name,
          );
        } else {
          // Add all new choices to existing dependent
          const existing = allDependents[existingIndex];
          const existingChoices = existing.choices || [];
          
          memberChoices.forEach((memberChoice: any) => {
            const choice = {
              policyComponentActionTypeId: memberChoice.policyComponentActionTypeId,
              parentpolicyComponentActionTypeId: memberChoice.parentpolicyComponentActionTypeId,
              policyComponentActionLabel: memberChoice.policyComponentActionLabel,
              policyComponentActionType: memberChoice.policyComponentActionType
            };
            
            // Don't add duplicate choices
            const choiceExists = existingChoices.some((c: any) => 
              c.policyComponentActionTypeId?.toString() === choice.policyComponentActionTypeId?.toString() &&
              c.parentpolicyComponentActionTypeId?.toString() === choice.parentpolicyComponentActionTypeId?.toString()
            );
            
            if (!choiceExists) {
              existingChoices.push(choice);
              debugLog(
                " Added choice to existing dependent:",
                member.name,
                "Choice ID:",
                choice.policyComponentActionTypeId,
              );
            } else {
              debugLog(
                " Duplicate choice skipped for:",
                member.name,
                "Choice ID:",
                choice.policyComponentActionTypeId,
              );
            }
          });
          
          // Update the dependent with all choices
          allDependents[existingIndex] = {
            ...existing,
            choices: existingChoices
          };
          debugLog(
            " Updated existing dependent:",
            member.name,
            "Total choices:",
            existingChoices.length,
          );
        }
      });
    });
      }
    }
    
    // Inject profile-only dependents (added via profile page, no policy choices yet)
    // as unselected entries so the user can assign policy components to them.
    if (Array.isArray(profileSuggestedDependents) && profileSuggestedDependents.length > 0) {
      profileSuggestedDependents.forEach((dep: any) => {
        const depRelation = (dep.relation || dep.relationship || '').toLowerCase().trim();
        const depKey = `${(dep.name || '').toLowerCase().trim()}_${depRelation}`;
        const alreadyExists = allDependents.some((d) => {
          // Primary check: name + DOB + gender (avoids relationship field inconsistencies)
          if (dep.dateOfBirth && dep.gender && d.dateOfBirth && d.gender) {
            const dDobGenderKey = `${(d.name || '').toLowerCase().trim()}_${d.dateOfBirth}_${(d.gender || '').toLowerCase()}`;
            const depDobGenderKey = `${(dep.name || '').toLowerCase().trim()}_${dep.dateOfBirth}_${(dep.gender || '').toLowerCase()}`;
            if (dDobGenderKey === depDobGenderKey) return true;
          }
          // Fallback: name + relation
          const dRelation = (d.relationship || d.relationshipType || '').toLowerCase().trim();
          const k = `${(d.name || '').toLowerCase().trim()}_${dRelation}`;
          return k === depKey;
        });
        const depRelationName = (dep.relation || dep.relationship || '').trim();
        const isEligibleForComponent =
          eligibleRelationsForComponent.length === 0 ||
          eligibleRelationsForComponent.some(
            (r) => r.toLowerCase() === depRelationName.toLowerCase(),
          );
        if (!alreadyExists && !deletedProfileKeysRef.current.has(depKey) && isEligibleForComponent) {
          allDependents.push({
            id: dep.id,
            tempKey: `profile:${depKey}`,
            isManuallyAdded: false,
            name: dep.name,
            relationship: dep.relation || dep.relationship,
            relationshipType: dep.relationshipType || dep.relation || dep.relationship,
            dateOfBirth: dep.dateOfBirth,
            gender: dep.gender,
            choices: [],
          });
        }
      });
    }

    // Final dedup: collapse same-person duplicates that slipped through earlier
    // dedup checks (e.g. DOB format mismatch between API raw data and processed data).
    // Keeps the entry with the most choices; merges choices from both entries.
    const dedupedDependents = allDependents.reduce<DependentDetails[]>((acc, dep) => {
      const normName = (dep.name || '').toLowerCase().trim();
      // Strip time component so "1965-03-15T00:00:00.000Z" matches "1965-03-15"
      const normDob = String(dep.dateOfBirth || '').split('T')[0];
      const normGender = (dep.gender || '').toLowerCase().trim().replace(/gender_type_/g, '');
      const normRel = (dep.relationship || dep.relationshipType || '').toLowerCase().trim();

      const existingIdx = acc.findIndex((d) => {
        const dName = (d.name || '').toLowerCase().trim();
        if (dName !== normName) return false;
        const dNormDob = String(d.dateOfBirth || '').split('T')[0];
        const dNormGender = (d.gender || '').toLowerCase().trim().replace(/gender_type_/g, '');
        // Primary: name + DOB + gender
        if (normDob && normGender && dNormDob && dNormGender) {
          return dNormDob === normDob && dNormGender === normGender;
        }
        // Fallback: name + relation (only when non-empty to avoid over-matching)
        const dRel = (d.relationship || d.relationshipType || '').toLowerCase().trim();
        return normRel !== '' && dRel === normRel;
      });

      if (existingIdx === -1) {
        acc.push(dep);
      } else {
        const existing = acc[existingIdx];
        const mergedChoices = [...(existing.choices || [])];
        (dep.choices || []).forEach((choice: any) => {
          const isDuplicate = mergedChoices.some(
            (c: any) =>
              c.policyComponentActionTypeId?.toString() ===
                choice.policyComponentActionTypeId?.toString() &&
              c.parentpolicyComponentActionTypeId?.toString() ===
                choice.parentpolicyComponentActionTypeId?.toString(),
          );
          if (!isDuplicate) mergedChoices.push(choice);
        });
        acc[existingIdx] = {
          ...existing,
          choices: mergedChoices,
          // Prefer the entry that is explicitly not a profile-only injection
          isManuallyAdded: existing.isManuallyAdded || dep.isManuallyAdded,
        };
      }
      return acc;
    }, []);

    debugLog(" LOG 2: Final unified dependents:", dedupedDependents);
    setDependents(dedupedDependents);
  }, [familyMemberDetails, profileSuggestedDependents]);

  // For flex components with acceptRelationsFromParent: true, auto-enroll/un-enroll
  // locked dependents (mapped from the base policy) into this component's choices.
  // disableAddDependent is the gate: it is only true for such flex components.
  useEffect(() => {
    if (!disableAddDependent || !policyComponentActionTypeId) return;

    const sortedLockedKeys = lockedDependents.map(getDependentKey).sort().join(",");
    const syncKey = `${sortedLockedKeys}|${policyComponentActionTypeId}|${parentpolicyComponentActionTypeId ?? ""}`;

    if (prevLockedSyncKeyRef.current === syncKey) return;
    prevLockedSyncKeyRef.current = syncKey;

    const lockedKeySet = new Set(lockedDependents.map(getDependentKey));

    setDependents((prev) => {
      let changed = false;
      const next = prev.map((dep) => {
        const depKey = getDependentKey(dep);
        const isLocked = lockedKeySet.has(depKey);

        const alreadyEnrolled = (dep.choices || []).some(
          (c: any) =>
            String(c.policyComponentActionTypeId ?? "") === String(policyComponentActionTypeId ?? "") &&
            String(c.parentpolicyComponentActionTypeId ?? "") === String(parentpolicyComponentActionTypeId ?? ""),
        );

        if (isLocked && !alreadyEnrolled) {
          changed = true;
          return {
            ...dep,
            choices: [
              ...(dep.choices || []),
              {
                policyComponentActionTypeId,
                parentpolicyComponentActionTypeId,
                policyComponentActionLabel,
                policyComponentActionType,
                isSelected: true,
              },
            ],
          };
        }

        if (!isLocked && alreadyEnrolled) {
          changed = true;
          return {
            ...dep,
            choices: (dep.choices || []).filter(
              (c: any) =>
                !(
                  String(c.policyComponentActionTypeId ?? "") === String(policyComponentActionTypeId ?? "") &&
                  String(c.parentpolicyComponentActionTypeId ?? "") === String(parentpolicyComponentActionTypeId ?? "")
                ),
            ),
          };
        }

        return dep;
      });

      if (!changed) return prev;

      // Notify parent after state settles so the flex component's family members
      // are included when the user clicks "Select".
      Promise.resolve().then(() => {
        onFamilyMemberChange(
          toFamilyMemberMap(next, profileSuggestedDependents, deletedProfileKeysRef.current),
        );
      });

      return next;
    });
  }, [
    disableAddDependent,
    lockedDependents,
    policyComponentActionTypeId,
    parentpolicyComponentActionTypeId,
    policyComponentActionLabel,
    policyComponentActionType,
    profileSuggestedDependents,
    onFamilyMemberChange,
  ]);

  const getRelationTypeForRelationship = React.useCallback(
    (relationshipName: string) =>
      getRelationTypeForRelationshipUtil(policyData, relationshipName),
    [policyData],
  );

  const getAgeConstraintsForRelationship = React.useCallback(
    (relationshipName: string) =>
      getAgeConstraintsForRelationshipUtil(
        policyData,
        relationshipName,
        studyingSonAgeExtension,
        unmarriedDaughterAgeExtension,
      ),
    [policyData, studyingSonAgeExtension, unmarriedDaughterAgeExtension],
  );

  // Helper function to check if son's age falls within the extension range
  const isAgeInStudyingSonExtensionRange = React.useCallback(
    (relationshipName: string, dateOfBirth: string) => {
      if (
        relationshipName.toLowerCase() !== "son" ||
        studyingSonAgeExtension <= 0 ||
        !dateOfBirth
      ) {
        return false;
      }

      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return false;
      }

      const age = calculateAgeFromDate(birthDate);

      // Get the base constraints without extension
      const baseConstraints = getAgeConstraintsForRelationshipUtil(
        policyData,
        relationshipName,
        0, // No extension for base constraint
        0, // No extension for base constraint
      );

      const baseMaxAge = baseConstraints.maxAge;
      const extendedMaxAge = baseMaxAge
        ? baseMaxAge + studyingSonAgeExtension
        : null;

      // Check if age is beyond base limit but within extended limit
      return (
        baseMaxAge !== null &&
        extendedMaxAge !== null &&
        age > baseMaxAge &&
        age <= extendedMaxAge
      );
    },
    [policyData, studyingSonAgeExtension],
  );

  // Helper function to check if daughter's age falls within the extension range
  const isAgeInUnmarriedDaughterExtensionRange = React.useCallback(
    (relationshipName: string, dateOfBirth: string) => {
      if (
        relationshipName.toLowerCase() !== "daughter" ||
        unmarriedDaughterAgeExtension <= 0 ||
        !dateOfBirth
      ) {
        return false;
      }

      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return false;
      }

      const age = calculateAgeFromDate(birthDate);

      // Get the base constraints without extension
      const baseConstraints = getAgeConstraintsForRelationshipUtil(
        policyData,
        relationshipName,
        0, // No extension for base constraint
        0, // No extension for base constraint
      );

      const baseMaxAge = baseConstraints.maxAge;
      const extendedMaxAge = baseMaxAge
        ? baseMaxAge + unmarriedDaughterAgeExtension
        : null;

      // Check if age is beyond base limit but within extended limit
      return (
        baseMaxAge !== null &&
        extendedMaxAge !== null &&
        age > baseMaxAge &&
        age <= extendedMaxAge
      );
    },
    [policyData, unmarriedDaughterAgeExtension],
  );

  const canSelectRelationship = React.useCallback(
    (relationshipName: string) => {
      // Use visibleDependents (enrolled in this component) so that unchecked
      // dependents (e.g. MIL/FIL unselected) don't block adding the opposite
      // parent family (Father/Mother and vice-versa).
      const depsForCheck = editingDependentKey
        ? visibleDependents.filter((dep) => getDependentKey(dep) !== editingDependentKey)
        : visibleDependents;
      // Addon components have explicit eligibleRelations — bypass base-policy
      // gender constraints that would otherwise block parent/in-law selection.
      const isAddon = Boolean(
        parentpolicyComponentActionTypeId && Number(parentpolicyComponentActionTypeId) > 0,
      );
      return canSelectRelationshipUtil({
        relationshipName,
        policyData,
        dependents: depsForCheck,
        constraints: {
          crossParentsAllowed,
          sameGenderParentsAllowed,
          maleEmployeesCoverInLaws: isAddon ? true : allowMaleEmployeesCoverInLaws,
          maleEmployeesCoverParents: isAddon ? true : allowMaleEmployeesCoverParents,
          femaleEmployeesCoverInLaws: isAddon ? true : allowFemaleEmployeesCoverInLaws,
          femaleEmployeesCoverParents: isAddon ? true : allowFemaleEmployeesCoverParents,
        },
        employeeGender,
      });
    },
    [
      policyData,
      visibleDependents,
      editingDependentKey,
      parentpolicyComponentActionTypeId,
      crossParentsAllowed,
      sameGenderParentsAllowed,
      allowMaleEmployeesCoverInLaws,
      allowMaleEmployeesCoverParents,
      allowFemaleEmployeesCoverInLaws,
      allowFemaleEmployeesCoverParents,
      employeeGender,
    ],
  );

  const getAvailableRelationshipOptionsForChoice = React.useCallback(
    (
      relationshipName: string,
      allDependents: DependentDetails[],
      choice: {
        parentpolicyComponentActionTypeId?: number | string | null;
        policyComponentActionTypeId?: number | string | null;
      },
    ) => {
      const choiceDependents = allDependents.filter((dependent) =>
        matchesPolicySelection(
          dependent,
          String(choice.parentpolicyComponentActionTypeId ?? 0),
          String(choice.policyComponentActionTypeId ?? 0),
        ),
      );

      const choiceCanSelectRelationship = (candidateRelationshipName: string) =>
        canSelectRelationshipUtil({
          relationshipName: candidateRelationshipName,
          policyData,
          dependents: choiceDependents,
          constraints: {
            crossParentsAllowed,
            sameGenderParentsAllowed,
            maleEmployeesCoverInLaws: allowMaleEmployeesCoverInLaws,
            maleEmployeesCoverParents: allowMaleEmployeesCoverParents,
            femaleEmployeesCoverInLaws: allowFemaleEmployeesCoverInLaws,
            femaleEmployeesCoverParents: allowFemaleEmployeesCoverParents,
          },
          employeeGender,
        });

      const availableOptions = getAvailableRelationshipOptionsUtil({
        policyData,
        dependents: choiceDependents,
        canSelectRelationship: choiceCanSelectRelationship,
        parentpolicyComponentActionTypeId: Number.parseInt(
          String(choice.parentpolicyComponentActionTypeId ?? 0),
          10,
        ),
        policyComponentActionTypeId: Number.parseInt(
          String(choice.policyComponentActionTypeId ?? 0),
          10,
        ),
      });

      return availableOptions.some(
        (option) =>
          option.value.toLowerCase() === relationshipName.toLowerCase(),
      );
    },
    [
      policyData,
      crossParentsAllowed,
      sameGenderParentsAllowed,
      allowMaleEmployeesCoverInLaws,
      allowMaleEmployeesCoverParents,
      allowFemaleEmployeesCoverInLaws,
      allowFemaleEmployeesCoverParents,
      employeeGender,
    ],
  );


  // Auto-populate gender when relationship changes
  useEffect(() => {
    if (selectedRelationship && formRef.current) {
      // the form components are ready to receive them
      requestAnimationFrame(() => {
        if (formRef.current) {
          const autoGender = getGenderByRelationship(selectedRelationship);
          if (autoGender) {
            formRef.current.setValue("gender", autoGender);
            // Force trigger to update the form state
            formRef.current.trigger("gender");
          }
        }
      });
    }
  }, [selectedRelationship]); // Removed formKey dependency

  // Validate existing date of birth when relationship changes
  useEffect(() => {
    if (selectedRelationship && formRef.current) {
      const currentDate = formRef.current.getValues("dateOfBirth");
      if (currentDate) {
        // Validate current date against new relationship constraints
        const { minAge, maxAge } =
          getAgeConstraintsForRelationship(selectedRelationship);
        if (minAge || maxAge) {
          const birthDate = new Date(currentDate);
          const today = new Date();
          const age =
            today.getFullYear() -
            birthDate.getFullYear() -
            (today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() &&
              today.getDate() < birthDate.getDate())
              ? 1
              : 0);

          if ((minAge && age < minAge) || (maxAge && age > maxAge)) {
            // Clear invalid date
            formRef.current.setValue("dateOfBirth", "");
          }
        }
      }
    }
  }, [selectedRelationship, getAgeConstraintsForRelationship]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    // Handle different date formats
    let date: Date;

    // If it's already in DD/MM/YYYY format, parse it correctly
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/");
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (dateString.includes("-")) {
      // If it's already in YYYY-MM-DD format, parse it correctly
      date = new Date(dateString);
    } else {
      // If it's in ISO format or other format
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid
    }

    // Format as DD MMM YYYY for display
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = date.getFullYear();
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    return `${day} ${month} ${year}`;
  };

 // Helper function to normalize date for comparison (moved to component level)
  const normalizeDate = React.useCallback((dateStr: string) => {
    if (!dateStr) return '';
    
    let day: string, month: string, year: string;
    
    // Handle DD/MM/YYYY format (like "22/03/1977")
    if (dateStr.includes("/")) {
      [day, month, year] = dateStr.split("/");
    } 
    // Handle YYYY-MM-DD format (like "1977-03-22") - convert to DD/MM/YYYY
    else if (dateStr.includes("-")) {
      const [yearPart, monthPart, dayPart] = dateStr.split("-");
      day = dayPart;
      month = monthPart;
      year = yearPart;
    } 
    // Handle other formats
    else {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return dateStr;
      day = String(date.getDate()).padStart(2, "0");
      month = String(date.getMonth() + 1).padStart(2, "0");
      year = String(date.getFullYear());
    }
    
    // Always return DD/MM/YYYY format for consistent comparison
    const paddedDay = day.padStart(2, "0");
    const paddedMonth = month.padStart(2, "0");
    return `${paddedDay}/${paddedMonth}/${year}`;
  }, []);

  // Helper function to convert any date format to DD/MM/YYYY for form inputs and storage
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    return normalizeDate(dateString);
  };

  useEffect(() => {
    if (showForm && formSectionRef.current) {
      // Use requestAnimationFrame to ensure DOM has been updated after showForm state change
      requestAnimationFrame(() => {
        if (typeof window === "undefined") return;
        const elementRect = formSectionRef.current!.getBoundingClientRect();
        const targetTop = window.scrollY + elementRect.top - SCROLL_OFFSET_PX;
        window.scrollTo({
          top: targetTop > 0 ? targetTop : 0,
          behavior: "smooth",
        });

        // Wait a bit more before focusing to ensure form field is ready
        window.setTimeout(() => {
          // Populate form if editing
          if (editingDependentData && formRef.current) {
            const dependent = editingDependentData;
            const matchedRelationship = getMatchingRelationshipOptionValue(
              dependent.relationship || dependent.relationshipType || "",
            );
            relationshipSyncRef.current = matchedRelationship;

            // Populate form with dependent data
            formRef.current.setValue("name", dependent.name || "");
            formRef.current.setValue("relationship", matchedRelationship);
            formRef.current.setValue(
              "gender",
              getMatchingGenderOptionValue(dependent.gender || ""),
            );
            formRef.current.setValue("dateOfBirth", formatDateForInput(dependent.dateOfBirth) || "");
          }
          
          formRef.current?.setFocus("relationship");
        }, 250);
      });
    }
  }, [showForm, editingDependentData]);

  // Function to get available relationship options based on current dependents
  const getAvailableRelationshipOptions = React.useCallback(() => {
    if (
      !policyData ||
      !policyData.enabledPolicyRelations ||
      !policyData.policyTemplate
    ) {
      return [];
    }

    const options = getAvailableRelationshipOptionsUtil({
      policyData,
      dependents: [],
      canSelectRelationship,
      parentpolicyComponentActionTypeId: Number.parseInt(
        parentpolicyComponentActionTypeId ?? "0",
        10,
      ),
      policyComponentActionTypeId: Number.parseInt(
        policyComponentActionTypeId ?? "0",
        10,
      ),
    });

    // Use visibleDependents (filtered to the CURRENT policy component) for maxCount and parent
    // constraint checks since those are per-component limits.
    const allDependentsExceptEditing = editingDependentKey
      ? visibleDependents.filter((dep) => getDependentKey(dep) !== editingDependentKey)
      : visibleDependents;

    // Use ALL dependents (across all policy components) for the global uniqueness check.
    // This ensures that if a Spouse/Son/etc. already exists as a record (even if unchecked
    // / not enrolled in this specific component), that relation is still blocked from the
    // Add form — the user should enroll the existing dependent via checkbox instead.
    const allGlobalDependentsExceptEditing = editingDependentKey
      ? dependents.filter((dep) => getDependentKey(dep) !== editingDependentKey)
      : dependents;

    const relationCounts: Record<string, number> = {};
    allDependentsExceptEditing.forEach((dep) => {
      const rel = dep.relationship || dep.relationshipType || "";
      const relationType = getRelationTypeForRelationship(rel) || "";

      if (!relationType) {
        return;
      }

      relationCounts[relationType] = (relationCounts[relationType] || 0) + 1;
    });
    
    // Filter out gender-specific relationships based on employee gender
    const genderFilteredOptions = options.filter((option) => {
      const relationshipLower = option.value.toLowerCase();
      
      // If employee is male, exclude "husband"
      if (employeeGender === "male" && relationshipLower === "husband") {
        return false;
      }
      
      // If employee is female, exclude "wife"
      if (employeeGender === "female" && relationshipLower === "wife") {
        return false;
      }
      
      return true;
    });

    // Filter out relationships that can only exist once (not controlled by maxCount alone).
    // son/daughter/son-in-law/daughter-in-law are intentionally excluded here because
    // their count is governed by the maxCount on the "children" relation type — they
    // should remain selectable until that limit is reached.
    //
    // All comparisons are done against the NORMALIZED relationship name so that
    // "Spouse/Partner" (API/policy value) is treated the same as "Spouse" (display value).
    const uniqueRelationships = [
      'father', 'mother', 'spouse', 'husband', 'wife', 'partner',
      'father-in-law', 'mother-in-law'
    ];

    // Normalize existing relationship names so variants like "Spouse/Partner" collapse to
    // their canonical form ("Spouse") before lowercasing for comparison.
    const existingRelationships = allGlobalDependentsExceptEditing.map(dep => {
      const raw = dep.relationship || dep.relationshipType || "";
      return normalizeRelationship(raw).toLowerCase().trim();
    }).filter(Boolean);

    debugLog("🔍 Filtering relationships:", {
      allDependentsCount: dependents.length,
      allDependentsExceptEditingCount: allDependentsExceptEditing.length,
      allGlobalDependentsExceptEditingCount: allGlobalDependentsExceptEditing.length,
      allExistingRelationships: existingRelationships,
      uniqueRelationships,
      beforeFilter: genderFilteredOptions.map(opt => opt.value)
    });

    const finalFilteredOptions = genderFilteredOptions.filter((option) => {
      // Normalize the option value (e.g. "Spouse/Partner" → "Spouse") so it matches
      // the same canonical form used in existingRelationships above.
      const relationshipLower = normalizeRelationship(option.value).toLowerCase().trim();

      // For unique relationships, exclude if already exists globally
      if (uniqueRelationships.includes(relationshipLower)) {
        const alreadyExists = existingRelationships.includes(relationshipLower);
        if (alreadyExists) {
          debugLog(`Filtering out "${option.value}" - already exists`);
          return false;
        }
      }

      const relationType = getRelationTypeForRelationship(option.value) || "";
      if (!relationType) {
        return false;
      }

      const relationConfig = policyData.enabledPolicyRelations?.find(
        (relation: any) => relation?.type === relationType,
      );

      if (relationConfig?.maxCount) {
        const parsedMax = parseInt(relationConfig.maxCount, 10);
        const maxCount = Number.isNaN(parsedMax)
          ? Number.POSITIVE_INFINITY
          : parsedMax;

        const usedCount = relationCounts[relationType] || 0;

        // maxCount is the TOTAL cap for the relation type. For parents,
        // crossParentsAllowed governs which parents may be mixed (own / in-law),
        // not how many — so the cap stays total, not per sub-family.
        if (usedCount >= maxCount) {
          // Children may exceed maxCount by the extra twin/triplet slots; the DOB
          // validator enforces that the extra child shares an eligible birth event.
          const isMultipleBirthSlotOpen =
            relationType.toLowerCase() === "children" &&
            anyMultipleBirthAllowed &&
            usedCount < maxCount + childExtraSlots;
          if (!isMultipleBirthSlotOpen) return false;
        }
      }

      // Overall dependent-count cap (see maxDependentCountOverall above) — additive
      // to the per-relation-type check above, and only active when configured.
      if (maxDependentCountOverall !== undefined) {
        const totalDependentsUsed = allDependentsExceptEditing.length;
        if (totalDependentsUsed >= maxDependentCountOverall) {
          return false;
        }
      }

      const isAddon = Boolean(
        parentpolicyComponentActionTypeId && Number(parentpolicyComponentActionTypeId) > 0,
      );
      const selectionCheck = canSelectRelationshipUtil({
        relationshipName: option.value,
        policyData,
        // Use the component-scoped (enrolled) list, not the global one, so that
        // unchecked dependents don't falsely block opposite parent family.
        dependents: allDependentsExceptEditing,
        constraints: {
          crossParentsAllowed,
          sameGenderParentsAllowed,
          // Addon components have explicit eligibleRelations — bypass base-policy
          // gender constraints that would otherwise block parent selection.
          maleEmployeesCoverInLaws: isAddon ? true : allowMaleEmployeesCoverInLaws,
          maleEmployeesCoverParents: isAddon ? true : allowMaleEmployeesCoverParents,
          femaleEmployeesCoverInLaws: isAddon ? true : allowFemaleEmployeesCoverInLaws,
          femaleEmployeesCoverParents: isAddon ? true : allowFemaleEmployeesCoverParents,
        },
        employeeGender,
      });

      if (!selectionCheck.allowed) {
        return false;
      }
      
      return true;
    });
        
    return finalFilteredOptions;
  }, [
    policyData,
    visibleDependents,
    canSelectRelationship,
    dependents,
    maxDependentCountOverall,
    parentpolicyComponentActionTypeId,
    policyComponentActionTypeId,
    editingDependentKey,
    employeeGender,
    crossParentsAllowed,
    sameGenderParentsAllowed,
    allowMaleEmployeesCoverInLaws,
    allowMaleEmployeesCoverParents,
    allowFemaleEmployeesCoverInLaws,
    allowFemaleEmployeesCoverParents,
    anyMultipleBirthAllowed,
    childExtraSlots,
  ]);

  // Dynamic default values based on edit mode
  const getFormDefaultValues = React.useMemo(() => {
    if (editingDependentKey && editingDependentData) {
      return {
        name: editingDependentData.name || "",
        relationship: getMatchingRelationshipOptionValue(
          editingDependentData.relationship ||
            editingDependentData.relationshipType ||
            "",
        ),
        gender: getMatchingGenderOptionValue(editingDependentData.gender || ""),
        dateOfBirth: editingDependentData.dateOfBirth
          ? formatDateForInput(editingDependentData.dateOfBirth)
          : "",
      };
    }
    
    return defaultFormValues;
  }, [editingDependentKey, editingDependentData]);

  const hasCurrentPolicyComponent = React.useCallback(
    (dependent: DependentDetails) => {
      if (!dependent.choices || !Array.isArray(dependent.choices)) {
        return false;
      }

      return dependent.choices.some((choice: any) => {
        return (
          choice.policyComponentActionTypeId?.toString() ===
            policyComponentActionTypeId?.toString() &&
          choice.parentpolicyComponentActionTypeId?.toString() ===
            parentpolicyComponentActionTypeId?.toString()
        );
      });
    },
    [parentpolicyComponentActionTypeId, policyComponentActionTypeId],
  );

  // Get eligible dependents for checkbox selection (replaces dropdown)
  const getEligibleDependentsForCheckbox = React.useCallback(() => {
    // Get allowed relationships for the current component WITHOUT filtering for uniqueness or
    // selection constraints. We want to show existing dependents regardless of whether their
    // relationship type is already taken or whether the max count has been reached.
    const originalOptions = getAvailableRelationshipOptionsUtil({
      policyData,
      dependents: [], // Pass empty to get all available relationships without filtering
      canSelectRelationship: () => ({ allowed: true }), // Never block by selection state
      parentpolicyComponentActionTypeId: Number.parseInt(
        parentpolicyComponentActionTypeId ?? "0",
        10,
      ),
      policyComponentActionTypeId: Number.parseInt(
        policyComponentActionTypeId ?? "0",
        10,
      ),
    });
    
    const allowedRelationships = new Set(
      originalOptions.map((option) => String(option.value || "").toLowerCase()),
    );
    const allowedRelationshipTypes = new Set(
      originalOptions
        .map((option) => getRelationTypeForRelationship(option.value) || option.value)
        .map((value) => String(value || "").toLowerCase()),
    );
    
    const availableDependents = dependents.filter((dependent) => {
      const dependentRelationship = String(
        dependent.relationship || dependent.relation || "",
      ).toLowerCase();
      const dependentRelationshipType = String(
        getRelationTypeForRelationship(
          dependent.relationship || dependent.relationshipType || "",
        ) || dependent.relationshipType || "",
      ).toLowerCase();

      // Allow either exact relationship match (wife/husband/partner) OR relation-group match (spouse/partner).
      const isRelationshipAllowed =
        (dependentRelationship &&
          allowedRelationships.has(dependentRelationship)) ||
        (dependentRelationshipType &&
          allowedRelationshipTypes.has(dependentRelationshipType));

      if (!isRelationshipAllowed) return false;

      // Further restrict by component-level eligibleRelations from policyTemplate.
      // e.g. Critical Illness Cover may allow Son/Daughter/Father/Mother but NOT Mother-in-law/Father-in-law
      // even though those relations are valid at the policy level.
      if (eligibleRelationsForComponent.length > 0) {
        const eligibleLower = eligibleRelationsForComponent.map((r) => r.toLowerCase());
        return (
          eligibleLower.includes(dependentRelationship) ||
          eligibleLower.includes(dependentRelationshipType)
        );
      }

      return true;
    });

    // Exclude dependents that are already shown as locked (mapped from base)
    const lockedKeys = new Set((lockedDependents || []).map(getDependentKey));
    const filteredDependents = availableDependents.filter(
      (dep) => !lockedKeys.has(getDependentKey(dep)),
    );

    debugLog("FINAL: Eligible dependents for checkbox selection:", filteredDependents);
    return filteredDependents;
  }, [dependents, policyData, parentpolicyComponentActionTypeId, policyComponentActionTypeId, eligibleRelationsForComponent, lockedDependents]);

  function getMatchingRelationshipOptionValue(relationship?: string) {
    const normalizedRelationship = normalizeRelationshipText(relationship);
    if (!normalizedRelationship) {
      return "";
    }

    const availableOptions = getAvailableRelationshipOptions();
    const directMatch = availableOptions.find(
      (option) =>
        normalizeRelationshipText(option.value) === normalizedRelationship,
    );
    if (directMatch) {
      return directMatch.value;
    }

    const labelMatch = availableOptions.find(
      (option) =>
        normalizeRelationshipText(option.label) === normalizedRelationship,
    );
    if (labelMatch) {
      return labelMatch.value;
    }

    const relationTypeMatch = availableOptions.find(
      (option) =>
        normalizeRelationshipText(
          getRelationTypeForRelationship(option.value) || "",
        ) === normalizedRelationship,
    );
    if (relationTypeMatch) {
      return relationTypeMatch.value;
    }

    return relationship ?? "";
  }

  function getMatchingGenderOptionValue(gender?: string) {
    const normalizedGender = normalizeRelationshipText(gender);
    if (!normalizedGender) {
      return "";
    }

    const directMatch = genderOptions.find(
      (option) =>
        normalizeRelationshipText(option.value) === normalizedGender,
    );
    if (directMatch) {
      return directMatch.value;
    }

    const labelMatch = genderOptions.find(
      (option) =>
        normalizeRelationshipText(option.label) === normalizedGender,
    );
    if (labelMatch) {
      return labelMatch.value;
    }

    return gender ?? "";
  }

  // Handle checkbox selection for existing dependents - auto add/remove
  const handleDependentCheckboxChange = React.useCallback((dependentKey: string, isChecked: boolean) => {
    if (isChecked) {
      // Find the dependent from the main dependents array (not from filtered eligible list)
      const dependent = dependents.find(dep => {
        const tempKey = getDependentKey(dep);
        return tempKey === dependentKey;
      });
      
      if (dependent) {
        debugLog("Adding dependent to policy component:", {
          dependentName: dependent.name,
          dependentRelationship: dependent.relationship,
          currentChoices: dependent.choices
        });
        
        // Add choice to dependent's payload
        const newChoice = {
          policyComponentActionTypeId: policyComponentActionTypeId,
          parentpolicyComponentActionTypeId: parentpolicyComponentActionTypeId,
          policyComponentActionLabel: policyComponentActionLabel,
          policyComponentActionType: policyComponentActionType,
          isSelected: true,
        };
        
        // Update dependents list - read latest state inside setter to avoid stale closure
        setDependents(prev => {
          const latestDependent = prev.find(dep => getDependentKey(dep) === dependentKey);
          if (!latestDependent) return prev;

          const alreadyHasChoice = (latestDependent.choices || []).some((c: any) =>
            c.policyComponentActionTypeId?.toString() === policyComponentActionTypeId?.toString() &&
            c.parentpolicyComponentActionTypeId?.toString() === parentpolicyComponentActionTypeId?.toString()
          );

          const updatedDependent = alreadyHasChoice
            ? latestDependent
            : { ...latestDependent, choices: [...(latestDependent.choices || []), newChoice] };

          debugLog("🔧 Updated dependent:", updatedDependent);

          const updatedDependents = prev.map(dep =>
            getDependentKey(dep) === dependentKey ? updatedDependent : dep
          );

          // Trigger parent callback with full family member map
          onFamilyMemberChange?.(
            toFamilyMemberMap(
              updatedDependents,
              profileSuggestedDependents,
              deletedProfileKeysRef.current,
            ),
          );

          return updatedDependents;
        });
      }
    } else {
      // Remove the dependent from current policy component
      setDependents(prev => {
        const updated = prev.map(dependent => {
          const depTempKey = getDependentKey(dependent);
          
          if (depTempKey !== dependentKey) {
            return dependent;
          }
          
          // Remove current policy component choice from this dependent
          const remainingChoices = (dependent.choices || []).filter((choice: any) => {
            const choiceMatches = (
              choice.policyComponentActionTypeId?.toString() === policyComponentActionTypeId?.toString() &&
              choice.parentpolicyComponentActionTypeId?.toString() === parentpolicyComponentActionTypeId?.toString()
            );
            return !choiceMatches;
          });

          const clearedTopLevel =
            remainingChoices.length === 0
              ? {
                  policyComponentActionTypeId: undefined,
                  parentpolicyComponentActionTypeId: undefined,
                  policyComponentActionType: null,
                  policyComponentActionLabel: null,
                }
              : {};

          return {
            ...dependent,
            choices: remainingChoices,
            ...clearedTopLevel,
          };
        });

        const hasRemainingDependentsForCurrentComponent = updated.some(
          (dependent) => {
            return (dependent.choices || []).some((choice: any) => {
              return (
                choice.policyComponentActionTypeId?.toString() ===
                  policyComponentActionTypeId?.toString() &&
                choice.parentpolicyComponentActionTypeId?.toString() ===
                  parentpolicyComponentActionTypeId?.toString() &&
                choice.policyComponentActionType ===
                  policyComponentActionType &&
                choice.policyComponentActionLabel ===
                  policyComponentActionLabel
              );
            });
          },
        );

        const isEmployeeEnrolledInComponent =
          isSelfAllowedInPolicy && !isEmployeeExcluded;

        if (
          !hasRemainingDependentsForCurrentComponent &&
          !isEmployeeEnrolledInComponent &&
          onPolicyComponentRemoval
        ) {
          onPolicyComponentRemoval(
            parentpolicyComponentActionTypeId,
            policyComponentActionTypeId,
            policyComponentActionType || undefined,
            policyComponentActionLabel || undefined,
          );
        }
        
        onFamilyMemberChange(
          toFamilyMemberMap(
            updated,
            profileSuggestedDependents,
            deletedProfileKeysRef.current,
          ),
        );
        return updated;
      });
    }
  }, [
    dependents,
    isEmployeeExcluded,
    isSelfAllowedInPolicy,
    onFamilyMemberChange,
    onPolicyComponentRemoval,
    parentpolicyComponentActionTypeId,
    policyComponentActionLabel,
    policyComponentActionType,
    policyComponentActionTypeId,
  ]);

  const eligibleCheckboxDependents = React.useMemo(
    () => getEligibleDependentsForCheckbox(),
    [getEligibleDependentsForCheckbox],
  );

  // If no API data is available, show loading or error state
  if (
    !policyData ||
    !policyData.enabledPolicyRelations ||
    isPolicyComponentsLoading
  ) {
    return (
      <CardContainer>
        <LoadingContainer>
          <CommonLoader size={40} thickness={4} />
        </LoadingContainer>
      </CardContainer>
    );
  }

  // Helper function to get gender based on relationship
  const getGenderByRelationship = (relationship: string): string => {
    const normalizedRelationship = relationship.toLowerCase().trim();

    // Spouse gender is the opposite of the employee's gender
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
      "spouse": employeeGender === "male" ? "female" : "male",
      "same-sex_partner": employeeGender === "male" ? "male" : "female",
      "same-sex_spouse": employeeGender === "male" ? "male" : "female"
    };

    return genderMap[normalizedRelationship] || "";
  };

  // Dynamic form config - name field is always text input now
  const getDependentFormConfig = () => {
    // Use selectedRelationship state to determine age constraints
    const { minAge, maxAge } =
      getAgeConstraintsForRelationship(selectedRelationship);
    const { minDate, maxDate } = getDateLimits(minAge, maxAge);

    const baseRelationshipOptions = getAvailableRelationshipOptions();

    // Render-time parent-conflict post-filter using current `visibleDependents`
    // (dependents enrolled in THIS policy component only) for freshness.
    // Using global `dependents` here would see parents enrolled in OTHER policy
    // accordions (e.g. Father/Mother in the GMC) and incorrectly block in-laws
    // for this parental policy when crossParentsAllowed=false.
    // Exclude the dep being edited so its own relationship isn't counted against itself.
    const depsForParentFilter = editingDependentKey
      ? visibleDependents.filter((dep) => getDependentKey(dep) !== editingDependentKey)
      : visibleDependents;
    const allExistingParents = depsForParentFilter.filter((dep) => {
      const rt = getRelationTypeForRelationship(dep.relationship || dep.relationshipType || "");
      return rt?.toLowerCase() === "parents";
    });
    const hasInLawParent = allExistingParents.some((dep) =>
      isInLawRelationship(dep.relationship || dep.relationshipType)
    );
    const hasOwnParent = allExistingParents.some((dep) =>
      !isInLawRelationship(dep.relationship || dep.relationshipType)
    );

    // Generic "Parent" relation: gender (Male = father/father-in-law,
    // Female = mother/mother-in-law) is chosen in the Gender dropdown rather than
    // implied by the relationship name. Two same-gender parents (e.g. Male + Male)
    // are allowed ONLY when every relevant constraint permits it; otherwise the user
    // may add at most one Male and one Female (still capped by the parents maxCount).
    const isGenericParentSelected =
      selectedRelationship.toLowerCase().trim() === "parent";
    const parentSameGenderCombineAllowed =
      crossParentsAllowed &&
      allowMaleEmployeesCoverParents &&
      allowMaleEmployeesCoverInLaws &&
      allowFemaleEmployeesCoverParents &&
      allowFemaleEmployeesCoverInLaws;
    const usedParentGenders = new Set(
      allExistingParents
        .map((dep) => String(dep.gender || "").toLowerCase().trim())
        .filter((gender) => gender === "male" || gender === "female")
    );
    const parentGenderOptions =
      isGenericParentSelected && !parentSameGenderCombineAllowed
        ? genderOptions.filter((option) => {
            const value = option.value.toLowerCase();
            if (value === "male" || value === "female") {
              return !usedParentGenders.has(value);
            }
            return true;
          })
        : genderOptions;
    const relationshipOptions =
      allExistingParents.length === 0
        ? baseRelationshipOptions
        : baseRelationshipOptions.filter((opt) => {
            const rt = getRelationTypeForRelationship(opt.value);
            if (rt?.toLowerCase() !== "parents") return true;
            const optIsInLaw = isInLawRelationship(opt.value);
            if (!crossParentsAllowed) {
              if (optIsInLaw && hasOwnParent) return false;
              if (!optIsInLaw && hasInLawParent) return false;
            }
            return true;
          });

    // Multiple-birth (twin/triplet) slot detection — reused by the DOB validator and helperText below.
    const childRelConfig = policyData?.enabledPolicyRelations?.find(
      (r: any) => r?.type?.toLowerCase() === "children",
    );
    const childMaxCount = childRelConfig?.maxCount ? parseInt(childRelConfig.maxCount, 10) : NaN;
    const existingChildDobTimes = childDobTimes;
    const existingChildCount = existingChildDobTimes.length;
    // We're in a "beyond base maxCount" slot where an extra child must share an
    // eligible birth event (eldest twin / youngest twin or triplet).
    const isInMultipleBirthSlot =
      anyMultipleBirthAllowed &&
      !Number.isNaN(childMaxCount) &&
      existingChildCount >= childMaxCount;

    const formFields = [];
    
    // Name field - always text input (no more dropdown)
    formFields.push({
      key: "name",
      name: "name",
      label: "Name",
      type: "text" as const,
      rules: {
        required: {
          value: true,
          message: "Name is required",
        },
        maxLength: {
          value: 100,
          message: "Name cannot exceed 100 characters",
        },
        validate: (value: string) => {
          if (!value) return true;
          // Trim only leading/trailing whitespace before validating; internal
          if (!/^(?=.{2,100}$)(?!.*\s{2,})[\p{L}][\p{L}\p{M}'\- ]*[\p{L}\p{M}]$/u.test(value.trim())) {
            return "Please enter a valid name using alphabets, spaces, hyphens (-), or apostrophes (')";
          }
          return true;
        },
      },
      gridColumn: nameGridColumn,
      componentProps: {
        fullWidth: true,
        placeholder: "Enter dependent name",
        enableCopyPaste: true,
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
    });

    // Add remaining fields
    formFields.push(
      {
        key: "relationship",
        name: "relationship",
        label: "Relationship",
        type: "select" as const,
        options: relationshipOptions,
        rules: {
          required: {
            value: true,
            message: "Relationship is required",
          },
          validate: (value: string) => {
            if (!value) return true;
            const validation = canSelectRelationship(value);
            return (
              validation.allowed ||
              validation.message ||
              "Selected relationship is not allowed by current constraints"
            );
          },
        },
        gridColumn: relationshipGridColumn,
        componentProps: {
          fullWidth: true,
          // Remove custom onChange handlers - we'll use watch mechanism instead
        },
      },
      {
        key: "gender",
        name: "gender",
        label: "Gender",
        type: "select" as const,
        options: parentGenderOptions,
        rules: {
          required: {
            value: true,
            message: "Gender is required",
          },
          validate: (value: string) => {
            // Enforce the generic-Parent same-gender combination rule on submit, in
            // case a gender was already set before the option list was filtered.
            if (!value || !isGenericParentSelected) return true;
            const normalized = value.toLowerCase();
            if (normalized !== "male" && normalized !== "female") return true;
            if (parentSameGenderCombineAllowed) return true;
            if (usedParentGenders.has(normalized)) {
              return "Only one Male and one Female parent can be added for this policy.";
            }
            return true;
          },
        },
        gridColumn: formGridColumn,
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
          required: {
            value: true,
            message: "Date of Birth is required",
          },
          validate: {
            ageRange: (
              value: string,
              formValues: {
                name: string;
                relationship: string;
                gender: string;
                dateOfBirth: string;
              },
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
            twinsDob: (
              value: string,
              formValues: { name: string; relationship: string; gender: string; dateOfBirth: string },
            ) => {
              if (!isInMultipleBirthSlot) return true;
              const rel = formValues.relationship || selectedRelationship;
              if (getRelationTypeForRelationship(rel)?.toLowerCase() !== "children") return true;
              const parsed = parseDateString(value);
              if (!parsed) return true;
              // The full child set (existing + this one) must satisfy the base maxCount
              // plus the multiple-birth group caps (eldest twin / youngest twin or triplet).
              const allDobTimes = [...existingChildDobTimes, parsed.getTime()];
              if (isChildDobSetValid(allDobTimes, childMaxCount, childMultipleBirthConfig)) {
                return true;
              }
              if (allowedMultipleBirthDobs.length > 0) {
                return `To add this child to an existing birth, its date of birth must match ${allowedMultipleBirthDobs
                  .map((e) => `${e.label} (${e.dob})`)
                  .join(" or ")}.`;
              }
              return `Maximum number of children reached.`;
            },
          },
        },
        gridColumn: formGridColumn,
        componentProps: {
          showAge:true,
          fullWidth: true,
          minWidth: "150px",
          format: "DD/MM/YYYY", // Pass format from parent component
          maxDate: dayjs(), // Disables future dates
          inputProps: {
            min: minDate ? minDate.toISOString().split("T")[0] : undefined,
            max: maxDate ? maxDate.toISOString().split("T")[0] : undefined,
          },
          helperText: (() => {
            const rel = selectedRelationship;
            const relType = rel ? getRelationTypeForRelationship(rel) : null;
            if (
              isInMultipleBirthSlot &&
              relType?.toLowerCase() === "children" &&
              allowedMultipleBirthDobs.length > 0
            ) {
              return `Multiple birth: date of birth must match ${allowedMultipleBirthDobs.map((e) => e.dob).join(" or ")}`;
            }
            if (rel && minAge && maxAge)
              return `Age must be between ${minAge} and ${maxAge} years`;
            if (rel && minAge) return `Minimum age: ${minAge} years`;
            if (rel && maxAge) return `Maximum age: ${maxAge} years`;
            if (rel) return "Select a valid date of birth";
            return "Please select a relationship first, then choose date of birth";
          })(),
          popperDetails: {
            disablePortal: false,
          },
        },
      }
    );

    return formFields;
  };

  const handleEmployeeDelete = () => {
    if (onEmployeeExclusionChange) {
      onEmployeeExclusionChange(true);
    }
  };

  // Function to check if we can add more dependents.
  // getAvailableRelationshipOptions already applies all constraints including the twin
  // override, so any non-empty result means at least one relationship can still be added.
  const canAddMoreDependents = () => {
    return getAvailableRelationshipOptions().length > 0;
  };

  // Returns whether the eligible-dependent checkbox should be disabled, and why.
  // An unselected checkbox is disabled when (a) its relation type has reached maxCount,
  // or (b) selecting it would violate a parent-combination constraint (cross-parents /
  // same-gender / employee-cover). Already-selected checkboxes are never disabled so the
  // user can still deselect them.
  const isCheckboxDisabledForDependent = React.useCallback(
    (
      dependent: DependentDetails,
      isCurrentlySelected: boolean,
    ): { disabled: boolean; reason: string } => {
      const notDisabled = { disabled: false, reason: "" };
      if (isCurrentlySelected) return notDisabled;

      const relationType =
        getRelationTypeForRelationshipUtil(policyData, dependent.relationship || dependent.relationshipType || "") || "";
      if (!relationType || !policyData?.enabledPolicyRelations) return notDisabled;

      const relationConfig = (policyData.enabledPolicyRelations as any[]).find(
        (r) => r?.type === relationType,
      );

      // maxCount gate (only when a maxCount is configured for this relation type).
      if (relationConfig?.maxCount) {
        const parsedMax = parseInt(relationConfig.maxCount, 10);
        const maxCount = Number.isNaN(parsedMax) ? Number.POSITIVE_INFINITY : parsedMax;
        const usedCount = relationTypeCountsForComponent[relationType] || 0;

        if (usedCount >= maxCount) {
          let maxCountDisabled = true;
          // Multiple-birth slot: allow re-selecting a child whose DOB completes a
          // valid eldest-twin / youngest-twin-or-triplet set with the existing children.
          if (
            anyMultipleBirthAllowed &&
            relationType.toLowerCase() === "children" &&
            usedCount < maxCount + childExtraSlots
          ) {
            const depDobTime = parseDateString(dependent.dateOfBirth)?.getTime();
            if (depDobTime !== undefined) {
              maxCountDisabled = !isChildDobSetValid(
                [...childDobTimes, depDobTime],
                maxCount,
                childMultipleBirthConfig,
              );
            }
          }
          if (maxCountDisabled) {
            return {
              disabled: true,
              reason: "Maximum allowed count for this dependent category has been reached.",
            };
          }
        }
      }

      // Overall dependent-count cap (see maxDependentCountOverall above) — additive
      // to the per-relation-type gate above, and only active when configured.
      if (maxDependentCountOverall !== undefined) {
        const totalDependentsUsed = visibleDependents.length;
        if (totalDependentsUsed >= maxDependentCountOverall) {
          return {
            disabled: true,
            reason: "Maximum allowed number of dependents has been reached.",
          };
        }
      }

      // Parent-combination constraints (cross-parents / same-gender), enforced by NAME
      // (father / mother / father-in-law / mother-in-law) against the rows already enrolled
      // in this component. Name-based so it holds regardless of how the policy template
      // groups in-laws under relationType — getRelationTypeForRelationship can resolve
      // in-laws to a non-"parents" type, which would silently bypass the shared util.
      const candidateRel = dependent.relationship || dependent.relationshipType || "";
      const candidateRole = getParentRole(candidateRel);
      if (candidateRole) {
        const candidateIsInLaw = isInLawRelationship(candidateRel);
        const relOf = (d: DependentDetails) => d.relationship || d.relationshipType || "";
        const enrolledParentFamily = visibleDependents.filter((d) => getParentRole(relOf(d)));
        const ownRoles = enrolledParentFamily
          .filter((d) => !isInLawRelationship(relOf(d)))
          .map((d) => getParentRole(relOf(d)));
        const inLawRoles = enrolledParentFamily
          .filter((d) => isInLawRelationship(relOf(d)))
          .map((d) => getParentRole(relOf(d)));

        // Exact same relationship already enrolled (e.g. a second "Father" row).
        if (enrolledParentFamily.some((d) => relOf(d).toLowerCase() === candidateRel.toLowerCase())) {
          return { disabled: true, reason: "This parent relationship has already been added." };
        }

        if (!sameGenderParentsAllowed) {
          if (
            (candidateIsInLaw && ownRoles.includes(candidateRole)) ||
            (!candidateIsInLaw && inLawRoles.includes(candidateRole))
          ) {
            return { disabled: true, reason: "Same-gender parent combinations are not allowed." };
          }
        }

        if (!crossParentsAllowed) {
          // Cross pairing is only tolerable when same-gender pairing is allowed AND every
          // existing opposite-side parent shares this candidate's role.
          if (candidateIsInLaw && ownRoles.length > 0) {
            const canPair = sameGenderParentsAllowed && ownRoles.every((r) => r === candidateRole);
            if (!canPair) {
              return {
                disabled: true,
                reason: "Cross selection of parents is not allowed. Remove existing parents to add parents-in-law.",
              };
            }
          }
          if (!candidateIsInLaw && inLawRoles.length > 0) {
            const canPair = sameGenderParentsAllowed && inLawRoles.every((r) => r === candidateRole);
            if (!canPair) {
              return {
                disabled: true,
                reason: "Cross selection of parents is not allowed. Remove existing parents-in-law to add parents.",
              };
            }
          }
        }
      }

      // Remaining constraints (employee-cover) still handled by the shared util; it returns
      // { allowed: true } for non-parent relations, so this is a no-op for children/spouse.
      const selectionCheck = canSelectRelationship(candidateRel);
      if (!selectionCheck.allowed) {
        return {
          disabled: true,
          reason:
            ("message" in selectionCheck && selectionCheck.message) ||
            "This dependent cannot be selected with the current selection.",
        };
      }

      return notDisabled;
    },
    [
      policyData,
      relationTypeCountsForComponent,
      maxDependentCountOverall,
      visibleDependents,
      anyMultipleBirthAllowed,
      childExtraSlots,
      childDobTimes,
      childMultipleBirthConfig,
      canSelectRelationship,
      visibleDependents,
      crossParentsAllowed,
      sameGenderParentsAllowed,
    ],
  );

  const handleAddDependentClick = () => {
    if (canAddMoreDependents()) {
      setShowForm(true);
    }
  };

  const handleCancelForm = () => {
    // Cleanup subscription if it exists
    if (watchSubscriptionRef.current) {
      watchSubscriptionRef.current();
      watchSubscriptionRef.current = null;
    }
    
    setShowForm(false);
    setSelectedRelationship("");
    relationshipSyncRef.current = "";
    setFormKey((prev) => prev + 1);
    setEditingDependentKey(null); // Reset edit mode
    setEditingDependentData(null); // Clear edit data
    // Reset the form when cancelled
    if (formRef.current) {
      formRef.current.reset(defaultFormValues);
    }
  };

  const handleConfirmAddDependent = async () => {
    try {
      if (formRef.current) {
        const formValues = formRef.current.getValues();

        // Validate the form before submission
        const isValid = await formRef.current.trigger();
        if (!isValid) {
          console.error("Form validation failed");
          return;
        }

        // Trim leading/trailing whitespace from the name once, so every
        // downstream use (edit/add branches, dedup key) persists it clean.
        formValues.name = (formValues.name ?? "").trim();

        // Format date to DD/MM/YYYY for consistent storage
        let formattedDate = formValues.dateOfBirth;
        if (formValues.dateOfBirth) {
          // Ensure we always store in DD/MM/YYYY format
          formattedDate = formatDateForInput(formValues.dateOfBirth);
        }

        const relationshipType =
          getRelationTypeForRelationship(formValues.relationship) ||
          formValues.relationship;

        // Check if we're in edit mode
        if (editingDependentKey) {
          setDependents((prev) => {
            const updated = prev.map((dep) => {
              const depKey = getDependentKey(dep);
              if (depKey === editingDependentKey) {
                // IMPORTANT: Editing dependent details (name/DOB/gender/relationship) must not
                // silently unselect this person from other policy components.
                // Preserve the existing `choices` as-is; selection changes must happen only
                // via checkbox add/remove, not via edit.
                const preservedChoices = Array.isArray(dep.choices)
                  ? dep.choices
                  : [];

                return {
                  ...dep,
                  tempKey: getDependentKey({
                    ...dep,
                    name: formValues.name,
                    gender: formValues.gender ?? dep.gender,
                    dateOfBirth: formattedDate,
                  } as DependentDetails),
                  name: formValues.name,
                  relationship: formValues.relationship,
                  gender: formValues.gender ?? dep.gender,
                  dateOfBirth: formattedDate,
                  relationshipType,
                  choices: preservedChoices,
                };
              }

              return {
                ...dep,
              };
            });

            onFamilyMemberChange(
              toFamilyMemberMap(
                updated,
                profileSuggestedDependents,
                deletedProfileKeysRef.current,
              ),
            );
            return updated;
          });
          setShowForm(false);
          setSelectedRelationship("");
          relationshipSyncRef.current = "";
          setFormKey(0);
          setEditingDependentKey(null);
          setEditingDependentData(null);
          if (formRef.current) {
            formRef.current.reset(defaultFormValues);
          }
          
          // Scroll to "Select Members to Include" section after successful update
          setTimeout(() => {
            if (cardMainContainerRef.current) {
              
              // Get the container's position
              const containerElement = cardMainContainerRef.current;
              const containerRect = containerElement.getBoundingClientRect();
              const scrollTop = window.scrollY + containerRect.top - 150; // 150px offset from top
              
              // Use both scrollIntoView and manual scroll for better compatibility
              containerElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest"
              });
              
              // Backup manual scroll
              window.scrollTo({
                top: scrollTop,
                behavior: "smooth"
              });
              
            } else {
              debugLog(
                "cardMainContainerRef.current is null - cannot scroll to container after update",
              );
            }
          }, 300);
          
          return;
        }

        // Create new dependent - no dropdown logic needed anymore
        const dependentKey = `${formValues.name.toLowerCase().trim()}_${formattedDate}_${(formValues.gender || '').toLowerCase()}`;
        
        const newDependent: DependentDetails = {
          tempKey: dependentKey, // Use consistent key based on person's data
          isManuallyAdded: true,
          name: formValues.name,
          relationship: formValues.relationship,
          gender: formValues.gender ?? "Not specified", 
          dateOfBirth: formattedDate,
          relationshipType,
          choices: [{
            policyComponentActionTypeId,
            parentpolicyComponentActionTypeId,
            policyComponentActionLabel,
            policyComponentActionType
          }]
        } as DependentDetails;

        // Check if this is a son with age in the extension range
        if (
          isAgeInStudyingSonExtensionRange(
            formValues.relationship,
            formValues.dateOfBirth,
          )
        ) {
          // Show popup for studying son confirmation
          setPendingDependent(newDependent);
          setShowStudyingSonPopup(true);
          return; // Don't add the dependent yet, wait for popup confirmation
        }

        // Check if this is a daughter with age in the extension range
        if (
          isAgeInUnmarriedDaughterExtensionRange(
            formValues.relationship,
            formValues.dateOfBirth,
          )
        ) {
          // Show popup for unmarried daughter confirmation
          setPendingDependent(newDependent);
          setShowUnmarriedDaughterPopup(true);
          return; // Don't add the dependent yet, wait for popup confirmation
        }

        // Add dependent directly if no popup needed
        addDependentToList(newDependent);
      }
    } catch (error) {
      // Form validation errors are handled within the form
      console.error("Form validation failed:", error);
    }
  };

  // Helper function to add dependent to the list
  const addDependentToList = (newDependent: DependentDetails) => {
    setDependents((prev) => {
      // Enrich the new dependent with current policy component info
      const updatedNewDependent = {
        ...newDependent,
        parentpolicyComponentActionTypeId,
        policyComponentActionTypeId,
        policyComponentActionLabel,
        policyComponentActionType,
        // Ensure choices array is included
        choices: newDependent.choices || [{
          policyComponentActionTypeId,
          parentpolicyComponentActionTypeId,
          policyComponentActionLabel,
          policyComponentActionType
        }]
      };

      // If a dependent with the same key already exists (e.g. user re-adds the same
      // person via form while viewing a different policy accordion), merge the new
      // choice into the existing entry rather than creating a duplicate.  Duplicates
      // with the same tempKey produce identical React keys, causing the second entry
      // to be silently dropped from the rendered list, which makes the selection for
      // the new policy appear lost.
      //
      // We match by both exact tempKey and a normalized name+DOB+gender comparison so
      // that API-loaded dependents (ISO dates) and form-added dependents (DD/MM/YYYY)
      // are recognised as the same person even when the raw tempKey strings differ.
      const newName = (updatedNewDependent.name || '').toLowerCase().trim();
      const newDob = normalizeDobForKey(updatedNewDependent.dateOfBirth);
      const newGender = (updatedNewDependent.gender || '').toLowerCase().trim();
      const newKey = getDependentKey(updatedNewDependent);
      const existingIndex = prev.findIndex(dep => {
        if (getDependentKey(dep) === newKey) return true;
        const depName = (dep.name || '').toLowerCase().trim();
        if (depName !== newName) return false;
        const depDob = normalizeDobForKey(dep.dateOfBirth);
        const depGender = (dep.gender || '').toLowerCase().trim();
        if (newDob && depDob && newGender && depGender) {
          return newDob === depDob && newGender === depGender;
        }
        return false;
      });

      let updated: DependentDetails[];
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const existingChoices: any[] = Array.isArray(existing.choices) ? existing.choices : [];
        const incomingChoices: any[] = Array.isArray(updatedNewDependent.choices) ? updatedNewDependent.choices : [];
        const mergedChoices = [...existingChoices];
        for (const incoming of incomingChoices) {
          const alreadyPresent = mergedChoices.some(
            (c: any) =>
              c.policyComponentActionTypeId?.toString() === incoming.policyComponentActionTypeId?.toString() &&
              c.parentpolicyComponentActionTypeId?.toString() === incoming.parentpolicyComponentActionTypeId?.toString(),
          );
          if (!alreadyPresent) {
            mergedChoices.push(incoming);
          }
        }
        updated = prev.map((dep, i) =>
          i === existingIndex ? { ...dep, choices: mergedChoices } : dep,
        );
      } else {
        updated = [...prev, updatedNewDependent];
      }

      onFamilyMemberChange(
        toFamilyMemberMap(
          updated,
          profileSuggestedDependents,
          deletedProfileKeysRef.current,
        ),
      );
      return updated;
    });
    setShowForm(false);
    setSelectedRelationship("");
    relationshipSyncRef.current = "";
    setFormKey((prev) => prev + 1);
    setEditingDependentKey(null); // Reset edit mode
    setEditingDependentData(null); // Clear edit data

    // Reset the form for next use
    if (formRef.current) {
      formRef.current.reset(defaultFormValues);
    }
    
    // Scroll to "Select Members to Include" section after successful addition
    setTimeout(() => {
      if (cardMainContainerRef.current) {
        // Get the container's position
        const containerElement = cardMainContainerRef.current;
        const containerRect = containerElement.getBoundingClientRect();
        const scrollTop = window.scrollY + containerRect.top - 150; // 150px offset from top
        
        // Use both scrollIntoView and manual scroll for better compatibility
        containerElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest"
        });
        
        // Backup manual scroll
        window.scrollTo({
          top: scrollTop,
          behavior: "smooth"
        });
      } else {
        debugLog("cardMainContainerRef.current is null - cannot scroll to container");
      }
    }, 300); // Reduced delay but should still work after form closes
  };

  // Handler for editing a dependent
  const handleEditDependent = (dependent: DependentDetails) => {
    const dependentKey = getDependentKey(dependent);
    
    setEditingDependentKey(dependentKey || null);
    setEditingDependentData(dependent);
    
    // Set the selected relationship first
    const matchedRelationship = getMatchingRelationshipOptionValue(
      dependent.relationship || dependent.relationshipType || "",
    );
    relationshipSyncRef.current = matchedRelationship;
    setSelectedRelationship(matchedRelationship);
    
    setShowForm(true);
    setFormKey((prev) => prev + 1); // Force form re-render
  };

  const getChoiceDisplayLabel = (choice: any) => {
    const label = String(choice?.policyComponentActionLabel ?? "").trim();
    const type = String(choice?.policyComponentActionType ?? "").trim();
    if (label && type) {
      return `${label} (${type})`;
    }
    if (label) {
      return label;
    }
    if (type) {
      return type;
    }
    const addonId = choice?.policyComponentActionTypeId ?? "N/A";
    const parentId = choice?.parentpolicyComponentActionTypeId ?? "N/A";
    return `Choice ${addonId} / Parent ${parentId}`;
  };

  const getDependentImpactedChoices = (dependent: DependentDetails) => {
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
    return labels;
  };

  const openDeleteDependentModal = (dependent: DependentDetails) => {
    setDeleteTargetDependent(dependent);
  };

  const closeDeleteDependentModal = () => {
    setDeleteTargetDependent(null);
  };

  const handleConfirmDeleteDependent = () => {
    if (!deleteTargetDependent) {
      return;
    }

    const impactedChoices = Array.isArray(deleteTargetDependent?.choices)
      ? deleteTargetDependent.choices
      : [];

    const targetKey = getDependentKey(deleteTargetDependent);
    setDependents((prev) => {
      const updated = prev.filter((dependent) => getDependentKey(dependent) !== targetKey);

      const hasRemainingDependentsForChoice = (choiceToCheck: any) => {
        return updated.some((dependent) => {
          return (dependent.choices || []).some((choice: any) => {
            return (
              choice.policyComponentActionTypeId?.toString() ===
                choiceToCheck?.policyComponentActionTypeId?.toString() &&
              choice.parentpolicyComponentActionTypeId?.toString() ===
                choiceToCheck?.parentpolicyComponentActionTypeId?.toString() &&
              choice.policyComponentActionType === choiceToCheck?.policyComponentActionType &&
              choice.policyComponentActionLabel === choiceToCheck?.policyComponentActionLabel
            );
          });
        });
      };

      const hasRemainingDependentsForCurrentComponent = updated.some((dependent) => {
        return (dependent.choices || []).some((choice: any) => {
          return (
            choice.policyComponentActionTypeId?.toString() ===
              policyComponentActionTypeId?.toString() &&
            choice.parentpolicyComponentActionTypeId?.toString() ===
              parentpolicyComponentActionTypeId?.toString() &&
            choice.policyComponentActionType === policyComponentActionType &&
            choice.policyComponentActionLabel === policyComponentActionLabel
          );
        });
      });

      const isEmployeeEnrolledInComponent = isSelfAllowedInPolicy && !isEmployeeExcluded;
      if (
        !hasRemainingDependentsForCurrentComponent &&
        !isEmployeeEnrolledInComponent &&
        onPolicyComponentRemoval
      ) {
        onPolicyComponentRemoval(
          parentpolicyComponentActionTypeId,
          policyComponentActionTypeId,
          policyComponentActionType || undefined,
          policyComponentActionLabel || undefined,
        );
      }

      // The delete modal states "remove from all selected choices", but the UI renders per-component.
      // If the deletion removes the last dependent from other non-base components (e.g. parental),
      // clear those components as well so choices don't stay selected with 0 members.
      if (onPolicyComponentRemoval && impactedChoices.length) {
        impactedChoices.forEach((choice: any) => {
          const type = String(choice?.policyComponentActionType ?? "");
          if (!type || type === "base") {
            return;
          }
          if (!hasRemainingDependentsForChoice(choice)) {
            onPolicyComponentRemoval(
              choice?.parentpolicyComponentActionTypeId ?? null,
              choice?.policyComponentActionTypeId ?? null,
              choice?.policyComponentActionType ?? undefined,
              choice?.policyComponentActionLabel ?? undefined,
            );
          }
        });
      }

      onFamilyMemberChange(
        toFamilyMemberMap(
          updated,
          profileSuggestedDependents,
          deletedProfileKeysRef.current,
        ),
      );
      return updated;
    });

    // If the deleted dep has a matching entry in profileSuggestedDependents (matched
    // by name+dob+relation+gender fingerprint, not id — enrolled and profile versions
    // carry different backend ids), remember it and notify the parent to remove it
    // from activeProfileSuggestedDependents so all FMM instances stop showing it.
    if (deleteTargetDependent) {
      const buildFp = (d: any) =>
        `${String(d?.name ?? '').trim().toLowerCase()}|${String(d?.dateOfBirth ?? '').trim()}|${String((d as any)?.relation ?? d?.relationship ?? '').trim().toLowerCase()}|${String(d?.gender ?? '').trim().toLowerCase()}`;

      const deletedFp = buildFp(deleteTargetDependent);

      const matchingProfileDep = Array.isArray(profileSuggestedDependents)
        ? profileSuggestedDependents.find((d: any) => buildFp(d) === deletedFp)
        : null;

      if (matchingProfileDep) {
        const delRelation = (
          deleteTargetDependent.relationship ||
          (deleteTargetDependent as any).relation ||
          ''
        ).toLowerCase().trim();
        const delKey = `${(deleteTargetDependent.name || '').toLowerCase().trim()}_${delRelation}`;
        deletedProfileKeysRef.current.add(delKey);
        // Pass the PROFILE dep (with the profile id) so the parent can filter by that id.
        onProfileSuggestedDepDeleted?.(matchingProfileDep);
      } else {
        // Fallback: still notify parent using deleted dependent payload so it can
        // remove matching profile-only entries by fingerprint when id matching fails.
        onProfileSuggestedDepDeleted?.(deleteTargetDependent);
      }
    }

    setDeleteTargetDependent(null);
  };

  // Handle studying son popup confirmation
  const handleStudyingSonConfirm = () => {
    if (pendingDependent) {
      addDependentToList(pendingDependent);
    }
    setShowStudyingSonPopup(false);
    setPendingDependent(null);
  };

  // Handle studying son popup cancellation
  const handleStudyingSonCancel = () => {
    setShowStudyingSonPopup(false);
    setPendingDependent(null);
    // Keep the form open so user can modify the date
  };

  // Handle unmarried daughter popup confirmation
  const handleUnmarriedDaughterConfirm = () => {
    if (pendingDependent) {
      addDependentToList(pendingDependent);
    }
    setShowUnmarriedDaughterPopup(false);
    setPendingDependent(null);
  };

  // Handle unmarried daughter popup cancellation
  const handleUnmarriedDaughterCancel = () => {
    setShowUnmarriedDaughterPopup(false);
    setPendingDependent(null);
    // Keep the form open so user can modify the date
  };

  const isEmployeeSelfShown =
    employeeDetails &&
    !isParentalPolicySelection &&
    !isEmployeeExcluded &&
    isSelfAllowedInPolicy;

  const hasEligibleDependents =
    (!isReadOnly && eligibleCheckboxDependents.length > 0) || lockedDependents.length > 0;

  const hasCurrentDependents = visibleDependents.length > 0;

  const showEmptyState =
    !isEmployeeSelfShown &&
    !hasEligibleDependents &&
    !hasCurrentDependents &&
    !showForm;

  const tableHeaderCellSx = {
    minWidth: 0,
    whiteSpace: "nowrap",
  } as const;

  const nameHeaderCellSx = {
    ...tableHeaderCellSx,
    paddingLeft: "58px",
  } as const;

  const actionsHeaderCellSx = {
    ...tableHeaderCellSx,
    justifySelf: "end",
    paddingRight: "56px",
  } as const;

  const actionsDataCellSx = {
    justifyContent: "flex-end",
    paddingRight: "18px",
    overflow: "visible",
  } as const;


  return (
    <CardMainContainer ref={cardMainContainerRef}>
      {constraintFilteredEligibleRelations.length > 0 && (
        <EligibleRelationsStrip>
          <EligibleRelationsLabel>Eligible Relations:</EligibleRelationsLabel>
          {constraintFilteredEligibleRelations
            .map((r) => (
              <EligibleRelationChip key={r}>{r}</EligibleRelationChip>
            ))}
          {(!crossParentsAllowed || !sameGenderParentsAllowed) &&
            // Only relevant when a parent/in-law relation is actually eligible for
            // this component — no point showing a "can't mix parents and
            // in-laws" note on a component that doesn't offer either.
            constraintFilteredEligibleRelations.some((r) =>
              ["father", "mother", "father-in-law", "mother-in-law", "parent"].includes(r.toLowerCase()),
            ) && (
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
              {!crossParentsAllowed && (
                <ConstraintNote>* Cannot add both parents and parents-in-law together</ConstraintNote>
              )}
              {!sameGenderParentsAllowed && (
                <ConstraintNote>* Same-gender parent combinations are not allowed (e.g. Father + Father-in-law)</ConstraintNote>
              )}
            </Box>
          )}
        </EligibleRelationsStrip>
      )}
      <Header>
        <FamilyContainer>
          {/* <FamilyImage src={FamilyIcon} /> */}
          {/* <Title>{FAMILY_MEMBERS_MANAGEMENT}</Title> */}
          <TitleText>Select Members to Include</TitleText>
          {showPolicyNotes && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: "#093F84" }}>
                Policy Note
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 6.25 }}>
                {policyNotes.map((policyNote) => (
                  <Typography
                    key={policyNote.id}
                    component="li"
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: "#093F84", whiteSpace: "pre-line" }}
                  >
                    {policyNote.text}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </FamilyContainer>

        {/* Add 'Add Dependent' button — always in header next to "Select Members to Include" */}
        {!isReadOnly && !showForm && !disableAddDependent && (
          <AddDependentButton
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddDependentClick}
            disabled={isReadOnly || showForm || !canAddMoreDependents()}
          >
            {ADD_DEPENDENT}
          </AddDependentButton>
        )}
      </Header>
      

      
      {(employeeDetails || dependents.length > 0 || showForm || eligibleCheckboxDependents.length > 0 || lockedDependents.length > 0) && (
        <CardContainer data-testid="family-members-management">
          {!showEmptyState && (
            <TableHeaderRow>
              <TableHeaderCell sx={nameHeaderCellSx}>Name</TableHeaderCell>
              <TableHeaderCell sx={tableHeaderCellSx}>Relation</TableHeaderCell>
              <TableHeaderCell sx={tableHeaderCellSx}>Gender</TableHeaderCell>
              <TableHeaderCell sx={tableHeaderCellSx}>Date Of Birth</TableHeaderCell>
              <TableHeaderCell sx={actionsHeaderCellSx}>Actions</TableHeaderCell>
            </TableHeaderRow>
          )}

          {/* Employee (Self) Row */}
          {isEmployeeSelfShown && (
            <TableDataRow>
              <TableDataCell
                sx={{ display: "flex", alignItems: "center", gap: "4px", paddingLeft: "8px" }}
              >
                <Box sx={selectionSlotSx}>
                  <Box sx={disabledSelfCheckboxSx}>
                    <CheckIcon
                      sx={{ color: "#8A94A6", fontSize: 14, fontWeight: 700 }}
                    />
                  </Box>
                </Box>
                {employeeDetails.employeeName ||
                  employeeDetails.fullName ||
                  "Employee"}
              </TableDataCell>
              <TableDataCell data-label="Relation">Self</TableDataCell>
              <TableDataCell data-label="Gender">{employeeGenderDisplay}</TableDataCell>
              <TableDataCell data-label="Date of Birth">
                <EmployeeDetailsValueRow>
                  {employeeDetails.dateOfBirth
                    ? dobVisibility["employee"]
                      ? `${formatDate(employeeDetails.dateOfBirth)} (Age:${getAgeDisplay(employeeDetails.dateOfBirth) ?? "--"})`
                      : "**********"
                    : "--"}
                  {employeeDetails.dateOfBirth && (
                    <EmployeeDetailsToggleButton
                      onClick={() =>
                        setDobVisibility((prev) => ({
                          ...prev,
                          employee: !prev["employee"],
                        }))
                      }
                      aria-label={
                        dobVisibility["employee"]
                          ? "Hide date of birth"
                          : "Show date of birth"
                      }
                      size="small"
                    >
                      {dobVisibility["employee"] ? (
                        <img src={eyeSlash} alt="Hide DOB" />
                      ) : (
                        <img src={eye} alt="Show DOB" />
                      )}
                    </EmployeeDetailsToggleButton>
                  )}
                </EmployeeDetailsValueRow>
              </TableDataCell>
              <TableDataCell sx={actionsDataCellSx}>
                {(canDeleteDependent(
                  policyComponentActionType,
                  policyComponentActionLabel,
                  undefined, // policyGroup not available in this context
                  { relationship: "Self" }, // Mock dependent with Self relationship
                  isReadOnly 
                ) && !isSelfAllowedInPolicy) && (
                  <DeleteButton onClick={handleEmployeeDelete}>
                    <DeleteIcon src={DeleteRedIcon} alt="delete employee" />
                  </DeleteButton>
                )}
              </TableDataCell>
            </TableDataRow>
          )}

          {/* Locked Dependents (mapped from base, pre-checked, non-editable) */}
          {lockedDependents.map((dependent) => {
            const dependentKey = getDependentKey(dependent);
            const isDobVisible = dobVisibility[dependentKey] ?? false;
            return (
              <TableDataRow key={`locked-${dependentKey}`}>
                <TableDataCell sx={{ display: "flex", alignItems: "center", paddingLeft: "8px" }}>
                  <Box sx={selectionSlotSx}>
                    <Box sx={selectedCheckboxSx}>
                      <CheckIcon sx={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700 }} />
                    </Box>
                  </Box>
                  {dependent.name || "Unnamed"}
                </TableDataCell>
                <TableDataCell data-label="Relation">{capitalizeFirst(dependent.relationship)}</TableDataCell>
                <TableDataCell data-label="Gender">{formatGenderDisplay(dependent.gender)}</TableDataCell>
                <TableDataCell data-label="Date of Birth">
                  <EmployeeDetailsValueRow>
                    {dependent.dateOfBirth
                      ? isDobVisible
                        ? `${formatDate(dependent.dateOfBirth)} (Age:${getAgeDisplay(dependent.dateOfBirth) ?? "--"})`
                        : "**********"
                      : "--"}
                    {dependent.dateOfBirth && (
                      <EmployeeDetailsToggleButton
                        onClick={() =>
                          setDobVisibility((prev) => ({ ...prev, [dependentKey]: !isDobVisible }))
                        }
                        aria-label={isDobVisible ? "Hide date of birth" : "Show date of birth"}
                        size="small"
                      >
                        {isDobVisible ? (
                          <img src={eyeSlash} alt="Hide DOB" />
                        ) : (
                          <img src={eye} alt="Show DOB" />
                        )}
                      </EmployeeDetailsToggleButton>
                    )}
                  </EmployeeDetailsValueRow>
                </TableDataCell>
                <TableDataCell sx={actionsDataCellSx} />
              </TableDataRow>
            );
          })}

          {/* Eligible Dependents for Selection */}
          {!isReadOnly && eligibleCheckboxDependents.map((dependent, depIndex) => {
              const dependentKey = getDependentKey(dependent);
              const isLastDependent = depIndex === eligibleCheckboxDependents.length - 1;
              const isDobVisible = dobVisibility[dependentKey] ?? false;
              const isCurrentlySelected = hasCurrentPolicyComponent(dependent);
              const { disabled: isCheckboxDisabled, reason: checkboxDisabledReason } =
                isCheckboxDisabledForDependent(dependent, isCurrentlySelected);
              const depDobStr = normalizeDobForKey(dependent.dateOfBirth);
              const multipleBirthLabel =
                getRelationTypeForRelationshipUtil(policyData, dependent.relationship || dependent.relationshipType || "")?.toLowerCase() === "children" &&
                depDobStr
                  ? multipleBirthLabelByDob.get(depDobStr)
                  : undefined;

              return (
                <TableDataRow key={`eligible-${dependentKey}`} data-testid="eligible-dependent-row">
                  <TableDataCell
                    data-testid="eligible-dependent-name"
                    sx={{ display: "flex", alignItems: "center", paddingLeft: "8px" }}
                  >
                    <Tooltip
                      title={isCheckboxDisabled ? checkboxDisabledReason : ""}
                      placement="top"
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDependentCheckboxChange(
                              dependentKey,
                              !isCurrentlySelected,
                            )
                          }
                          disabled={isCheckboxDisabled || acceptRelationsFromParent}
                          aria-label={
                            isCurrentlySelected
                              ? "Unselect dependent"
                              : "Select dependent"
                          }
                          sx={checkboxButtonSx}
                        >
                          {isCurrentlySelected ? (
                            <Box sx={selectedCheckboxSx}>
                              <CheckIcon sx={{ color: "#FFFFFF", fontSize: 16, fontWeight: 700 }} />
                            </Box>
                          ) : (
                            <Box sx={isCheckboxDisabled ? disabledSelfCheckboxSx : unselectedCheckboxSx} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    {dependent.name || 'Unnamed'}
                    {multipleBirthLabel && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: '#EEF2FF', color: '#4338CA', fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '10px', marginLeft: '6px', border: '1px solid #C7D2FE', whiteSpace: 'nowrap' }}>
                        {multipleBirthLabel}
                      </span>
                    )}
                  </TableDataCell>
                  <TableDataCell data-label="Relation" data-testid="dependent-relationship" >
                    {capitalizeFirst(dependent.relationship)}
                  </TableDataCell>
                  <TableDataCell data-label="Gender" data-testid="dependent-gender">
                    {formatGenderDisplay(dependent.gender)}
                  </TableDataCell>
                  <TableDataCell data-label="Date of Birth" data-testid="dependent-dateOfBirth">
                    <EmployeeDetailsValueRow>
                      {dependent.dateOfBirth
                        ? isDobVisible
                          ? `${formatDate(dependent.dateOfBirth)} (Age:${getAgeDisplay(dependent.dateOfBirth) ?? "--"})`
                          : "**********"
                        : "--"}
                      {dependent.dateOfBirth && (
                        <EmployeeDetailsToggleButton
                          onClick={() =>
                            setDobVisibility((prev) => ({
                              ...prev,
                              [dependentKey]: !isDobVisible,
                            }))
                          }
                          aria-label={
                            isDobVisible
                              ? "Hide date of birth"
                              : "Show date of birth"
                          }
                          size="small"
                        >
                          {isDobVisible ? (
                            <img src={eyeSlash} alt="Hide DOB" />
                          ) : (
                            <img src={eye} alt="Show DOB" />
                          )}
                        </EmployeeDetailsToggleButton>
                      )}
                    </EmployeeDetailsValueRow>
                  </TableDataCell>
                  <TableDataCell sx={actionsDataCellSx}>
                    {!isReadOnly && !acceptRelationsFromParent && (
                      <IconsContainer>
                        <IconButton1
                          onClick={() => handleEditDependent(dependent)}
                        >
                          <DeleteIcon
                            src={EditBlueIcon}
                            alt="edit dependent"
                          />
                        </IconButton1>
                        {canDeleteDependent(
                          policyComponentActionType,
                          policyComponentActionLabel,
                          undefined,
                          { relationship: dependent.relationship },
                          isReadOnly,
                        ) && (
                          <IconButton1
                            onClick={() => openDeleteDependentModal(dependent)}
                          >
                            <DeleteIcon
                              src={DeleteRedIcon}
                              alt="delete dependent"
                            />
                          </IconButton1>
                        )}
                        {isLastDependent && !showForm && canAddMoreDependents() && !disableAddDependent && (
                          <IconButton1
                            onClick={handleAddDependentClick}
                            aria-label="Add dependent"
                          >
                            <AddCircleOutlineIcon sx={{ color: '#0088F0', fontSize: 22 }} />
                          </IconButton1>
                        )}
                      </IconsContainer>
                    )}
                  </TableDataCell>
                </TableDataRow>
              );
            })}

          {/* Empty State Message */}
          {showEmptyState && (
            <Box
              sx={{
                minHeight: "100px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#666",
                px: 4,
              }}
            >
              <Typography
                sx={{
                  maxWidth: "680px",
                  fontSize: "16px",
                  fontWeight: 500,
                  lineHeight: 1.6,
                }}
              >
                {isParentalPolicySelection
                  ? "No dependents available for this parental policy selection. Add a new dependent to continue."
                  : "No dependents available for this policy component. Add a new dependent or check if dependents are available in other policy components."}
              </Typography>
            </Box>
          )}


          {showForm && !isReadOnly && (
            <div ref={formSectionRef}>
              <FormWrapper>
                <DynamicForm
                  key={formKey}
                  formConfig={getDependentFormConfig()}
                  defaultValues={getFormDefaultValues}
                  formMethods={(methods) => {
                    formRef.current = methods;                    
                    // Set up watch subscription immediately when methods are available
                    if (methods && methods.watch) {
                      // Cleanup previous subscription if exists
                      if (watchSubscriptionRef.current) {
                        watchSubscriptionRef.current();
                      }
                      
                      // Create new subscription - simplified for text-only name field
                      const subscription = methods.watch((value, { name }) => {
                        if (name === "relationship" && value.relationship) {
                          if (
                            relationshipSyncRef.current === value.relationship
                          ) {
                            return;
                          }

                          relationshipSyncRef.current = value.relationship;
                          setSelectedRelationship(value.relationship);
                          // Reset date of birth when relationship changes
                          methods.setValue("dateOfBirth", "");
                        }
                      });
                      
                      // Store the unsubscribe function
                      watchSubscriptionRef.current = subscription.unsubscribe;
                    }
                  }}
                  variant="ibp"
                />
                <ActionButtonsContainer>
                  <CommonButton
                    variant="outlined"
                    buttonType="primary"
                    label={CANCEL}
                    onClick={handleCancelForm}
                  />
                  <AddCommonButton
                    variant="contained"
                    buttonType="secondary"
                    label={editingDependentKey ? "Update" : "Add"}
                    onClick={handleConfirmAddDependent}
                  />
                </ActionButtonsContainer>
              </FormWrapper>
            </div>
          )}

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
                label: CANCEL,
                onClick: closeDeleteDependentModal,
                variant: "secondary",
              },
              {
                label: DELETE,
                onClick: handleConfirmDeleteDependent,
                variant: "primary",
              },
            ]}
          >
            <Box>
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
                from all selected choices.
              </Typography>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Affected choices:
              </Typography>
              <Box component="ul" sx={{ margin: 0, paddingLeft: "20px" }}>
                {deleteTargetDependent &&
                getDependentImpactedChoices(deleteTargetDependent).length > 0 ? (
                  getDependentImpactedChoices(deleteTargetDependent).map(
                    (choiceLabel) => (
                      <li key={choiceLabel}>
                        <Typography component="span">{choiceLabel}</Typography>
                      </li>
                    ),
                  )
                ) : (
                  <li>
                    <Typography component="span">No mapped choices found</Typography>
                  </li>
                )}
              </Box>
            </Box>
          </CustomModal>

          {/* Studying Son Age Extension Popup */}
          <Dialog
            open={showStudyingSonPopup}
            onClose={handleStudyingSonCancel}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Typography variant="h6" component="div">
                {AGE_EXTENSION_DIALOGS.STUDYING_SON.TITLE}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {AGE_EXTENSION_DIALOGS.STUDYING_SON.PRIMARY_MESSAGE}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {AGE_EXTENSION_DIALOGS.STUDYING_SON.SECONDARY_MESSAGE}
              </Typography>
            </DialogContent>
            <StyledDialogActions>
              <CommonButtonContainer
                variant="outlined"
                buttonType="primary"
                label={AGE_EXTENSION_DIALOGS.ACTIONS.CANCEL}
                onClick={handleStudyingSonCancel}
                sx={{
                  borderRadius: "8px"
                }}
              />
              <CommonButtonContainer
                variant="contained"
                buttonType="secondary"
                label={AGE_EXTENSION_DIALOGS.ACTIONS.CONFIRM}
                onClick={handleStudyingSonConfirm}
              />
            </StyledDialogActions>
          </Dialog>

          {/* Unmarried Daughter Age Extension Popup */}
          <Dialog
            open={showUnmarriedDaughterPopup}
            onClose={handleUnmarriedDaughterCancel}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Typography variant="h6" component="div">
                {AGE_EXTENSION_DIALOGS.UNMARRIED_DAUGHTER.TITLE}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {AGE_EXTENSION_DIALOGS.UNMARRIED_DAUGHTER.PRIMARY_MESSAGE}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {AGE_EXTENSION_DIALOGS.UNMARRIED_DAUGHTER.SECONDARY_MESSAGE}
              </Typography>
            </DialogContent>
            <StyledDialogActions>
              <CommonButton
                variant="outlined"
                buttonType="primary"
                label={AGE_EXTENSION_DIALOGS.ACTIONS.CANCEL}
                onClick={handleUnmarriedDaughterCancel}
              />
              <CommonButton
                variant="contained"
                buttonType="secondary"
                label={AGE_EXTENSION_DIALOGS.ACTIONS.CONFIRM}
                onClick={handleUnmarriedDaughterConfirm}
              />
            </StyledDialogActions>
          </Dialog>
        </CardContainer>
      )}
    </CardMainContainer>
  );
};

export default FamilyMembersManagement;
