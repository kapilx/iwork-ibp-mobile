import {
  AccordionAction,
  AccordionActionStyles,
  AccordionButtonsRow,
  AccordionCollapsedIconStyles,
  AccordionContainer,
  AccordionHeaderContent,
  AccordionItem,
  AccordionTitle,
  AccordionWrapper,
  AddPolicyButton,
  AnimatedButtonWrapper,
  AnimatedLayer,
  ButtonTextWrapper,
  BasePolicyContainer,
  BasePolicyImage,
  CancelButton,
  CardsContainer,
  CarouselWrapper,
  EnrolledIconStyles,
  EnrollmentHeading,
  EnrollmentHeadingContainer,
  EnrollmentSection,
  EnrollmentOpensBadge,
  EnrollmentOpensIcon,
  ExpandedAccordionTitle,
  // FamilyMembersWrapper,
  AccordionTitleRow,
  NotEnrolledIconWrapper,
  PolicyItemsContainer,
  PolicyItemsTitle,
  PolicyHeaderColumn,
  PolicyHeaderRow,
  PolicySummaryContainer,
  PolicySummaryStatusItem,
  PolicySummaryWrapper,
  PolicySummaryItem,
  PolicySummaryLabel,
  PolicySummaryValue,
  SelectedStatusBadge,
  PolicyTitle,
  PreviousPageImage,
  StyledPolicySection,
  StyledPolicySectionContent,
  NotEnrolledIconWrapperStyled,
  NotifyText,
  PolicyHeaderStack,
  AccordionActionColumn,
  AccordionActionRow,
  PolicyChip,
  CompulsoryBadge,
  MemberSelectionHeaderRow,
  MemberHeaderText,
  SectionAccordionContent,
  SectionAccordionHeader,
  SectionAccordionWrapper,
  SectionHeaderRow,
  SectionsContainer,
  SectionSubtitle,
  SectionSheidlTitle,
  ShieldIconWrapper,
  SheildWrapper,
  PolicyNameContainer,
  AccordionTitleRowCollapsed,
  SectionsContainerForOptions,
  CompulsoryOptionalContainer,
} from "./styles";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ACTIVE,
  formatDate,
  useApiQuery,
  endPoints,
  useLocalization,
  formatAmountWithCurrency,
} from "@ui/ui-lib";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AccordionExpandIcon from "../../../assets/svgs/accordion-arrow.svg";
import BasePolicyIcon from "../../../assets/svgs/base-health-icon.svg";
import CommonPolicyCard from "../../../common/CommonPolicyCard";
import OptionalIcon from "../../../assets/svgs/optional-benefits-icon.svg";
import SheildIcon from '../../../assets/svgs/compulsory-benifits-icon.svg'
import FlexIcon from '../../../assets/svgs/flex-benifits.svg';
import {
  CLICKED,
  SELECT,
  SELECTED,
  UNSELECT,
} from "../../../constants";
import { generatePolicyStructure } from "../../PolicyConfiguration/utils";

import {
  flattenPoliciesWithStatus,
  PolicyStatus,
} from "../../../utils/flattenPolicies";
import { useSelector } from "react-redux";
import FamilyMembersManagement from "../../Enrollment/EnrollmentFlow/FamilyMembersManagement";
import { getEligibleRelationsFromTemplate } from "../../Enrollment/EnrollmentFlow/utils/relationshipFilters";
import {
  resolveApplyToDependentsPremiumClient,
  buildGmcPolicyIdSet,
} from "../../../pages/MultiEnrollment";
import { Box, Checkbox, Typography } from "@mui/material";
import MemberRow from "../../../common/MemberRow";
import { getPolicyIcon } from "../MultiEnrollmentSummary";
import { PolicyHeader, PolicyIcon } from "../MultiEnrollmentSummary/styles";
import CommonLoader from "../../../common/CommonLoader";
import { getPolicyUIControls } from "../../Enrollment/EnrollmentFlow/utils/policyControlUtils";
import checkMark from "../../../assets/svgs/check-mark.svg";
import { flex } from "@mui/system";

interface RelationOption {
  name: string;
  maxAge?: string;
  minAge?: string;
  enabled: boolean;
  maxAgeError?: string;
}

interface RelationType {
  type: string;
  enabled: boolean;
  maxCount: string;
  maxCountError?: string;
  configuredOptions: RelationOption[];
}

interface RelationshipData {
  familyMaxPolicyLevel?: string;
  enabledPolicyRelations: RelationType[];
}

interface RelationConstraints {
  isRelationshipGroup?: boolean;
  relationships?: RelationshipData;
  constraints?: Record<string, unknown>;
  dependents?: unknown[];
  employeeChosenChoices?: unknown[];
  policyComponentsConfiguration?: Record<string, unknown>;
}

interface EnrollmentFlowProps {
  policyData?: any[];
  policyConfigurationData: any[];
  setPolicyConfigurationData: React.Dispatch<React.SetStateAction<any[]>>;
  isLoading: boolean;
  isPolicyComponentsLoading?: boolean;
  policyComponentLoadingByKey?: Record<string, boolean>;
  familyMemberDetails: Record<string, any[]>;
  profileSuggestedDependents?: any[];
  onProfileSuggestedDepDeleted?: (dep: any) => void;
  onFamilyMemberChange: (updated: Record<string, any[]>) => void;
  setShouldResetSelections: React.Dispatch<React.SetStateAction<boolean>>;
  shouldResetSelections: boolean;
  resetSelectionPolicyIds?: number[];
  setResetSelectionPolicyIds?: React.Dispatch<React.SetStateAction<number[]>>;
  isReadOnly?: boolean;
  groupMediclaimPolicy: any;
  // Map of policyId → policy data for every policy that has dependent/relation support.
  policiesWithDependents?: Record<number, any>;
  resetTrigger?: boolean;
  setResetTrigger: React.Dispatch<React.SetStateAction<boolean>>;
  setAllBasePoliciesEnrolled: React.Dispatch<React.SetStateAction<boolean>>;
  pendingSelections: (any | null)[];
  setPendingSelections: React.Dispatch<React.SetStateAction<(any | null)[]>>;
  policyId?: any;
  enrollmentSummaryData?: {
    sections?: Array<{
      id: string;
      title: string;
      policyId?: number;
      policyTypeKey: string;
      policyType: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  onCompulsorySelectionStatusChange?: (hasAllSelected: boolean) => void;
  onComponentSelectionStateChange?: (stateByComponentKey: Record<string, boolean>) => void;
  // Fires whenever the GPA / parental lock-in acknowledgement checkboxes change,
  // so the parent can fold them into disclaimersAccepted at submit.
  onAckDisclaimersChange?: (
    entries: { policyId: number; text: string; isMandatory: boolean }[],
  ) => void;
  employeeDateOfBirth?: unknown;
  employeeEffectiveDate?: unknown;
}

const CARD_WIDTH = 315;
const GAP_WIDTH = 16;
const CARDS_PER_PAGE = 3;

// Acknowledgement texts — single-sourced so the on-screen note and the value
// persisted into disclaimersAccepted stay identical.
const GPA_SI_ACK_TEXT =
  "If you opt GMC 2 lacs 1+3 your GPA Sum Insured is 2 Lacs, Other than this Plan GPA SI is considered as 5 Lacs";
const buildParentalLockInText = (years: number | string) =>
  `I understand that enrolling Parents or Parents-in-Law for the first time initiates a mandatory ${years}-years lock-in period. If I enrolled them last year, the same dependents continue under the lock-in. During this time, I cannot switch between Parents and Parents-in-Law. Additionally, while I am permitted to increase my Sum Insured compared to last year, I cannot decrease it`;

const getDefaultChoice = (policyOption: any) => {
  const availableChoices = policyOption?.choices?.filter(
    (choice: any) => choice.isAvailable !== false,
  );

  if (!availableChoices || availableChoices.length === 0) {
    return null;
  }

  const choiceToReturn =
    availableChoices.find((choice: any) => choice.isDefault === true) ?? {
      ...availableChoices[0],
      group: policyOption.group,
    } ??
    null;

  // Preserve original sumInsured as rawSumInsured
  if (choiceToReturn && choiceToReturn.sumInsured) {
    return {
      ...choiceToReturn,
      rawSumInsured: choiceToReturn.sumInsured,
    };
  }

  return choiceToReturn;
};

const getComponentSelectionKey = (item: any): string => {
  const actionType = String(
    item?.policyComponentActionType ?? item?.type ?? "",
  ).toLowerCase();

  if (actionType === "optional") {
    return [
      actionType,
      String(item?.parentpolicyComponentActionTypeId ?? "null"),
      String(item?.policyComponentActionTypeId ?? item?.id ?? "null"),
    ].join("|");
  }

  return `${actionType}|${String(
    item?.policyComponentActionLabel ?? item?.label ?? "",
  ).toLowerCase()}`;
};

const buildSummarySectionKey = (policyId: number | string, item: any): string =>
  [
    String(policyId ?? ""),
    String(item?.policyComponentActionType ?? item?.type ?? "").toLowerCase(),
    String(item?.policyComponentActionTypeId ?? "null"),
    String(item?.parentpolicyComponentActionTypeId ?? "null"),
    String(item?.policyComponentActionLabel ?? item?.label ?? ""),
  ].join("|");

const getPolicyComponentIdentityKey = (item: any): string => {
  const policyId = Number(item?.policyId ?? 0);
  return `${policyId}|${getComponentSelectionKey(item)}`;
};

const normalizeChoiceKey = (
  value: number | string | null | undefined,
): string | null =>
  value === null || value === undefined || value === ""
    ? null
    : String(value);

// A relation counts as a "parent" for the parental lock-in note when it is a
// parent / parent-in-law (Father, Mother, Father-in-law, Mother-in-law).
const isParentRelationName = (rel: any): boolean => {
  const v = String(rel ?? "").toLowerCase();
  return v.includes("parent") || v.includes("father") || v.includes("mother");
};

// Counts parent dependents per component key (`${parentId}-${typeId}`), matching
// the IDs carried on each dependent's `choices` entry. Used to detect when a
// parent is freshly added so the lock-in acknowledgement can be reset.
const countParentsByComponent = (
  familyMemberDetails: Record<string, any[]> | undefined,
): Record<string, number> => {
  const counts: Record<string, number> = {};
  Object.values(familyMemberDetails || {})
    .flat()
    .forEach((dep: any) => {
      if (
        !isParentRelationName(
          dep?.relation ?? dep?.relationship ?? dep?.relationshipType,
        )
      )
        return;
      (Array.isArray(dep?.choices) ? dep.choices : []).forEach((c: any) => {
        const key = `${c?.parentpolicyComponentActionTypeId}-${c?.policyComponentActionTypeId}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
  return counts;
};

const buildCommittedFamilyKey = (
  policyId: number | string | null | undefined,
  parentpolicyComponentActionTypeId?: number | string | null,
  policyComponentActionTypeId?: number | string | null,
): string => {
  const normalizedPolicyId = Number(policyId);
  return [
    Number.isFinite(normalizedPolicyId) ? normalizedPolicyId : "unknown",
    normalizeChoiceKey(parentpolicyComponentActionTypeId),
    normalizeChoiceKey(policyComponentActionTypeId),
  ].join("|");
};

const buildPolicyComponentLoadingKey = (
  policyId: number | string | null | undefined,
  parentpolicyComponentActionTypeId?: number | string | null,
  policyComponentActionTypeId?: number | string | null,
): string => {
  const normalizedPolicyId = Number(policyId);
  return [
    Number.isFinite(normalizedPolicyId) ? normalizedPolicyId : "unknown",
    parentpolicyComponentActionTypeId ?? null,
    policyComponentActionTypeId ?? null,
  ].join("|");
};

const matchesPolicySelection = (
  dependent: any,
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

  if (Array.isArray(dependent?.choices) && dependent.choices.length > 0) {
    if (
      dependent.choices.some((choice: any) =>
        matchesIds(
          choice?.parentpolicyComponentActionTypeId,
          choice?.policyComponentActionTypeId,
        ),
      )
    ) {
      return true;
    }
  }

  return matchesIds(
    dependent?.parentpolicyComponentActionTypeId,
    dependent?.policyComponentActionTypeId,
  );
};

const getDependentIdentity = (dependent: any): string =>
  String(
    dependent?.id ??
      dependent?.tempKey ??
      `${dependent?.name ?? ""}|${dependent?.relation ?? ""}|${dependent?.dateOfBirth ?? ""}|${dependent?.gender ?? ""}`,
  );

const getDependentsForSelection = (
  details: Record<string, any[]> | undefined,
  parentpolicyComponentActionTypeId?: string | null,
  policyComponentActionTypeId?: string | null,
): string[] =>
  Object.values(details || {})
    .flat()
    .filter((dependent: any) =>
      matchesPolicySelection(
        dependent,
        parentpolicyComponentActionTypeId,
        policyComponentActionTypeId,
      ),
    )
    .map(getDependentIdentity)
    .sort();

const areStringArraysEqual = (first: string[], second: string[]): boolean => {
  if (first.length !== second.length) return false;
  for (let i = 0; i < first.length; i += 1) {
    if (first[i] !== second[i]) return false;
  }
  return true;
};

const MembersSelection = ({
  familyMemberDetails,
}: {
  familyMemberDetails: Record<string, any[]>;
}) => {
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [members, setMembers] = useState(() => {
    const membersList = [];

    // Add Self member from userDetails
    if (userDetails.id) {
      membersList.push({
        id: userDetails.id,
        name: userDetails.employeeName || userDetails.fullName || "Unknown",
        relation: "Self",
        covered: true, // Self is always covered by default
        disabled: false, // Self can be modified
      });
    }

    // Add family members from familyMemberDetails
    Object.entries(familyMemberDetails || {}).forEach(
      ([relationshipType, members]) => {
        if (Array.isArray(members)) {
          members.forEach((member) => {
            membersList.push({
              id: member.id,
              name: member.name,
              relation:
                member.relationship ||
                member.relationshipType ||
                relationshipType,
              covered: false, // Family members not covered by default
              disabled: false,
            });
          });
        }
      },
    );

    return membersList;
  });

  const updateCoverage = (id: number, covered: boolean) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, covered } : m)),
    );
  };

  return (
    <Box>
      <Box sx={{ display:"flex", flexDirection:"column" }}>
      <Typography variant="h6" mb={3}>
        Select Members to Include
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ color: "#093F84", mt: 0.5 }}>
                 Please Note: Adding dependents may change your SI options and contribution amount.
      </Typography>
      </Box>
      {/* Header Row */}
      <MemberSelectionHeaderRow>
        <MemberHeaderText>Name</MemberHeaderText>
        <MemberHeaderText>Relation</MemberHeaderText>
        <MemberHeaderText>Policy Coverage</MemberHeaderText>
      </MemberSelectionHeaderRow>

      {members.map((member, index) => (
        <MemberRow
          key={member.id}
          name={member.name}
          relation={member.relation}
          covered={member.covered}
          disabled={member.disabled}
          isLastRow={index === members.length - 1}
          onChange={(covered) => updateCoverage(member.id, covered)}
        />
      ))}
    </Box>
  );
};

const EnrollmentFlow: React.FC<EnrollmentFlowProps> = ({
  policyData,
  policyConfigurationData,
  setPolicyConfigurationData,
  isLoading,
  isPolicyComponentsLoading = false,
  policyComponentLoadingByKey = {},
  familyMemberDetails,
  profileSuggestedDependents,
  onProfileSuggestedDepDeleted,
  onFamilyMemberChange,
  setShouldResetSelections,
  shouldResetSelections,
  resetSelectionPolicyIds,
  setResetSelectionPolicyIds,
  isReadOnly = false,
  groupMediclaimPolicy,
  policiesWithDependents = {},
  resetTrigger = false,
  setResetTrigger,
  setAllBasePoliciesEnrolled,
  setPendingSelections,
  pendingSelections,
  policyId,
  enrollmentSummaryData,
  onCompulsorySelectionStatusChange,
  onComponentSelectionStateChange,
  onAckDisclaimersChange,
  employeeDateOfBirth,
  employeeEffectiveDate,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { localizationData } = useLocalization();

  // Helper function to check if the exact policy component is already in enrollment summary.
  const isPolicyInEnrollmentSummary = useCallback(
    (policy: any, selectedChoice: any) => {
      if (
        !policy?.policyId ||
        !selectedChoice ||
        !enrollmentSummaryData?.sections
      ) {
        return false;
      }

      const selectedKey = buildSummarySectionKey(
        policy.policyId,
        selectedChoice
      );
      return enrollmentSummaryData.sections.some(
        (section: any) =>
          buildSummarySectionKey(section.policyId, section) === selectedKey
      );
    },
    [enrollmentSummaryData]
  );

  const [accordionIndexes, setAccordionIndexes] = useState<Set<number>>(new Set());
  const [employeeExclusionStates, setEmployeeExclusionStates] = useState<
    Record<string, boolean>
  >({});
  // Per-component acknowledgement of the parental 2-year lock-in note.
  // Keyed by `${parentComponentId}-${componentId}`. The "Select" button stays
  // disabled until the user checks the box for components that show the note.
  const [lockInAcknowledged, setLockInAcknowledged] = useState<
    Record<string, boolean>
  >({});
  // Per-policy acknowledgement of the GPA sum-insured note. Shown when the
  // policy's selected Designation is "Employee" AND the user picks a non-default
  // choice. Keyed by policyId. Gates "Select" like the lock-in note.
  const [gpaNoteAcknowledged, setGpaNoteAcknowledged] = useState<
    Record<string, boolean>
  >({});
  // Baseline parent counts per component, so we can tell when a parent is
  // *newly* added (vs. already present on first load / revisit).
  const prevParentCountsRef = useRef<Record<string, number>>({});
  const lockInBaselineSetRef = useRef(false);
  // Whenever a parent is freshly added to a component, the lock-in note must be
  // re-acknowledged: force its checkbox unchecked (which disables "Select" until
  // the user re-checks it). When all parents are removed, drop the stale entry.
  // The first run only records the baseline so an already-enrolled policy keeps
  // its acknowledged state on revisit.
  useEffect(() => {
    const counts = countParentsByComponent(familyMemberDetails);
    // While data is still loading/hydrating, keep the baseline synced without
    // forcing — otherwise an async-arriving enrolled parent would look like a
    // fresh "add" and wrongly reset an already-acknowledged policy on revisit.
    if (isLoading || !lockInBaselineSetRef.current) {
      prevParentCountsRef.current = counts;
      if (!isLoading) lockInBaselineSetRef.current = true;
      return;
    }
    const prev = prevParentCountsRef.current;
    const keys = new Set([...Object.keys(prev), ...Object.keys(counts)]);
    setLockInAcknowledged((ack) => {
      let next = ack;
      keys.forEach((key) => {
        const before = prev[key] ?? 0;
        const now = counts[key] ?? 0;
        if (now > before && next[key] !== false) {
          next = { ...next, [key]: false };
        } else if (now === 0 && key in next) {
          const { [key]: _omit, ...rest } = next;
          next = rest;
        }
      });
      return next;
    });
    prevParentCountsRef.current = counts;
  }, [familyMemberDetails, isLoading]);
  const [committedFamilyMembers, setCommittedFamilyMembers] = useState<
    Record<string, any>
  >({});
  const [sectionExpanded, setSectionExpanded] = useState({
    compulsory: true,
    optional: false,
    flex: false,
  });
  
  const [dirtyFlags, setDirtyFlags] = useState<boolean[]>([]);
  // Per-policy signature of the current choice set. Used to detect a refresh —
  // i.e. when the API has returned a new set of choices (different isDefault /
  // isAvailable / sumInsuredId combinations) after a dependent add/remove in an
  // isRelationshipGroup policy.
  const previousChoicesSignaturesRef = useRef<string[]>([]);
  // Policy indices whose choices just refreshed and whose new isDefault must win
  // over any rebuilt committed selection. Cleared when the user clicks a
  // different choice (dirty=true) or when the committed selection naturally
  // aligns with the new isDefault (e.g. after submitting it).
  const refreshDefaultOverrideRef = useRef<Set<number>>(new Set());
  // Per-policy snapshot of the live family member set. When the family changes
  // (add/delete a dependent), the API is re-called even when the returned
  // choices look identical, so this acts as a second refresh trigger.
  const previousDependentsSignaturesRef = useRef<string[]>([]);

  const policiesData = useSelector(
    (state: any) => state.policyData.policiesData,
  );

  // Accepted disclaimer texts per policy, from the policy API
  // (enrolledPolicies[].disclaimersAccepted). Drives the checked state of the
  // GPA / lock-in notes: checked only if that exact text is already accepted.
  const acceptedDisclaimerTextsByPolicy = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    (policiesData?.enrolledPolicies ?? []).forEach((p: any) => {
      map[String(p?.policyId)] = new Set(
        (p?.disclaimersAccepted ?? []).map((d: any) =>
          String(d?.text ?? "").trim(),
        ),
      );
    });
    return map;
  }, [policiesData]);

  // Employee designation drives the GPA sum-insured note. It comes from
  // company-employee-details -> additionalDetails.Designation (not the policy).
  const currentUserForDesignation = JSON.parse(
    sessionStorage.getItem("user") || "{}",
  );
  const designationEmployeeId = currentUserForDesignation?.id;
  const { data: employeeDetailsResponse } = useApiQuery({
    queryKey: ["employeeDetails", designationEmployeeId],
    url: designationEmployeeId ? endPoints.employeeDetails : "",
    enabled: Boolean(designationEmployeeId),
  });
  const isEmployeeDesignation = useMemo(() => {
    const designation =
      (employeeDetailsResponse as any)?.data?.additionalDetails?.Designation ??
      (employeeDetailsResponse as any)?.data?.data?.additionalDetails
        ?.Designation;
    return String(designation ?? "").toLowerCase() === "employee";
  }, [employeeDetailsResponse]);

  // Passed to FamilyMembersManagement solely to resolve the optional
  // "Max Dependent Count" overall cap (see maxDependentCountOverall there).
  const employeeAdditionalDetailsForDependentCap = useMemo(() => {
    return (
      (employeeDetailsResponse as any)?.data?.additionalDetails ??
      (employeeDetailsResponse as any)?.data?.data?.additionalDetails
    );
  }, [employeeDetailsResponse]);

  const flattenedPolicies = useMemo(
    () => flattenPoliciesWithStatus(policiesData),
    [policiesData],
  );

  const gmcPolicyIdsForCards = useMemo(
    () => buildGmcPolicyIdSet(policyData),
    [policyData],
  );

  const policyOptions = useMemo(() => {
    const POLICY_PRIORITY: Record<string, number> = {
      POLICY_TYPE_GMC: 1,
      "POLICY_TYPE_GMC_TOP-UP": 2,
      POLICY_TYPE_GPA: 3,
      POLICY_TYPE_GTL: 4,
    };

    if (!policyData) return [];
    const generatedPolicies = generatePolicyStructure(policyData);
    const enrollmentEnabledPolicyIds = new Set(
      flattenedPolicies
        .filter(
          (policy) =>
            policy.status === PolicyStatus.CAN_ENROLL ||
            policy.status === PolicyStatus.NOT_STARTED ||
            policy.status === PolicyStatus.EDIT_ENROLL,
        )
        .map((policy) => Number(policy.policyId)),
    );

    const filteredPolicies =
      enrollmentEnabledPolicyIds.size > 0
        ? generatedPolicies.filter((policy) =>
            enrollmentEnabledPolicyIds.has(Number(policy.policyId)),
          )
        : generatedPolicies;

    // Combined sequence map: keyed by `${policyId}|${optionId}|${parentMainPolicyId}` → sequence
    // Sequences are globally unique across base and parental (e.g. 1-6)
    const combinedSeqMap = new Map<string, number>();
    (policyData || []).forEach((policy: any) => {
      if (!policy) return;
      const pid = String(policy.policyId ?? "");
      const template = policy.configuration?.policyTemplate;
      const baseMainId = template?.basePolicy?.mainPolicyId;
      const parentalMainId = template?.parentalPolicy?.mainPolicyId;
      (template?.basePolicy?.addonIds ?? []).forEach((addon: any) => {
        combinedSeqMap.set(`${pid}|${addon.optionId}|${baseMainId}`, addon.sequence);
      });
      (template?.parentalPolicy?.addonIds ?? []).forEach((addon: any) => {
        combinedSeqMap.set(
          `${pid}|${addon.optionId}|${parentalMainId}`,
          addon.sequence,
        );
      });
    });

    const getAddonSeq = (item: any): number => {
      const pid = String(item.policyId ?? "");
      const key = `${pid}|${String(item.id ?? "")}|${String(item.parentpolicyComponentActionTypeId ?? "")}`;
      return combinedSeqMap.get(key) ?? 999;
    };

    return filteredPolicies
      .map((policy) => {
        // Find the flattened policy to get its status
        const flattenedPolicy = flattenedPolicies.find(
          (item) => item?.policyId === policy.policyId,
        );
        return {
          ...policy,
          policyFinalstatus: flattenedPolicy
            ? flattenedPolicy.status
            : "unKnown",
        };
      })
      .sort((a: any, b: any) => {
        const priorityA = POLICY_PRIORITY[a.policyTypeKey] ?? 999;
        const priorityB = POLICY_PRIORITY[b.policyTypeKey] ?? 999;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Ensure deterministic ordering so index-based UI state doesn't drift when
        // two policies share the same priority (e.g. GMC + GMC Top-Up).
        const policyIdA = Number(a?.policyId);
        const policyIdB = Number(b?.policyId);
        if (Number.isFinite(policyIdA) && Number.isFinite(policyIdB)) {
          if (policyIdA !== policyIdB) {
            return policyIdA - policyIdB;
          }
        }

        const groupOrder = (item: any) => {
          const group = String(item?.group ?? item?.type ?? "").toLowerCase();
          if (group === "base") return 0;
          if (group === "parental") return 1;
          if (group === "optional") return 2;
          return 9;
        };

        const groupA = groupOrder(a);
        const groupB = groupOrder(b);
        if (groupA !== groupB) {
          return groupA - groupB;
        }

        const seqA = getAddonSeq(a);
        const seqB = getAddonSeq(b);
        if (seqA !== seqB) {
          return seqA - seqB;
        }

        const idA = Number(a?.id);
        const idB = Number(b?.id);
        if (Number.isFinite(idA) && Number.isFinite(idB)) {
          if (idA !== idB) {
            return idA - idB;
          }
        }

        return String(a?.label ?? a?.policyName ?? "").localeCompare(
          String(b?.label ?? b?.policyName ?? ""),
        );
      });
  }, [policyData, flattenedPolicies]);

  const canShowCompanyContributionForPolicy = useCallback(
    (policyId?: number | string) => {
      const normalizedPolicyId = Number(policyId);
      if (!Number.isFinite(normalizedPolicyId)) {
        return true;
      }

      const matchingPolicy = Array.isArray(policyData)
        ? policyData.find((item) => Number(item?.policyId) === normalizedPolicyId)
        : null;

      // showCompanyContribution is resolved per-component inside overAllDataForFlow
      // (two-level: constraint=true → always show; constraint=false → use component flag).
      // Always return true here so the authoritative value in choice.showCompanyContribution
      // is the sole determinant.
      void matchingPolicy;
      return true;
    },
    [policyData],
  );

  const resolveCommittedSelectionForPolicy = useCallback(
    (policy: any, index: number) => {
      const indexedSelection = policyConfigurationData[index] ?? null;
      const policyKey = getComponentSelectionKey(policy);

      if (
        indexedSelection &&
        Number(indexedSelection.policyId) === Number(policy.policyId) &&
        getComponentSelectionKey(indexedSelection) === policyKey
      ) {
        return indexedSelection;
      }

      return (
        policyConfigurationData.find(
          (choice) =>
            choice &&
            Number(choice.policyId) === Number(policy.policyId) &&
            getComponentSelectionKey(choice) === policyKey,
        ) ?? null
      );
    },
    [policyConfigurationData],
  );

  // Reset all accordion data to initial state (API data)
  const resetAllAccordionsToInitial = useCallback(() => {
    // Guard: if policyOptions is transiently empty (policyData briefly undefined
    // during re-fetch), do not wipe selections — they will be restored when data
    // returns, and wiping here causes all buttons to flip to "Select".
    if (policyOptions.length === 0) return;
    // Reset dirty flags
    setDirtyFlags(policyOptions.map(() => false));
    // Reset pending selections directly to committed API data
    setPendingSelections(
      policyOptions.map((policy, index) => {
        const committedSelection = resolveCommittedSelectionForPolicy(
          policy,
          index
        );
        if (committedSelection) {
          return { ...committedSelection, group: (policy as any).group };
        }
        // Only fall back to default if no API data exists
        return null;
      }),
    );
    // Reset committed family members
    setCommittedFamilyMembers({});
  }, [policyOptions, resolveCommittedSelectionForPolicy, setPendingSelections]);

  // Listen for reset trigger from parent
  useEffect(() => {
    if (resetTrigger) {
      resetAllAccordionsToInitial();
      setResetTrigger(false);
    }
  }, [resetTrigger, resetAllAccordionsToInitial, setResetTrigger]);

  useEffect(() => {
    // Step 1: Group policyConfigurationData by policyId
    const enrolledPolicies = policyConfigurationData.filter(
      (config) => config !== null,
    );
    const groupedByPolicyId = enrolledPolicies.reduce((acc, config) => {
      if (!acc[config.policyId]) {
        acc[config.policyId] = [];
      }
      acc[config.policyId].push(config);
      return acc;
    }, {} as Record<number, any[]>);

    // Step 2: Check if EVERY enrolled policy has at least one base component
    const allPoliciesHaveBasePolicy = Object.values(groupedByPolicyId).every(
      (policyConfigs) =>
        policyConfigs.some(
          (config) => config.policyComponentActionType === "base",
        ),
    );

    setAllBasePoliciesEnrolled(allPoliciesHaveBasePolicy);
  }, [policyConfigurationData]);

  // Calculate total pages based on current policy options
  const totalPages = useMemo(() => {
    if (accordionIndexes.size === 0) return 1;

    const firstExpandedIndex = Array.from(accordionIndexes)[0];
    const currentPolicy = policyOptions[firstExpandedIndex];
    if (!currentPolicy) return 1;

    const availableChoices =
      currentPolicy?.choices?.filter((choice: any) => choice.isAvailable) ?? [];
    return Math.ceil(availableChoices.length / CARDS_PER_PAGE);
  }, [accordionIndexes, policyOptions]);

  const handleBackNavigation = () => {
    navigate(-1); // Go back to the previous page in history
  };

  useEffect(() => {
    if (shouldResetSelections) {
      const impactedPolicyIds = new Set<number>(
        (Array.isArray(resetSelectionPolicyIds) ? resetSelectionPolicyIds : [])
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id)),
      );

      // A reset request from the parent means a dependent add/delete refresh just
      // landed. For isRelationshipGroup policies, mark them so the signature
      // effect keeps the new isDefault on screen even after the parent rebuilds
      // committed state from employeeChosenChoices. Without this, a refresh that
      // returns the SAME choice signature (e.g. delete that doesn't shift the
      // bucket) would otherwise fall back to the previously committed selection.
      policyOptions.forEach((policy, index) => {
        if (
          impactedPolicyIds.size > 0 &&
          !impactedPolicyIds.has(Number(policy?.policyId))
        ) {
          return;
        }
        if (
          policy?.policyId &&
          policiesWithDependents?.[Number(policy.policyId)]
        ) {
          refreshDefaultOverrideRef.current.add(index);
        }
      });

      if (impactedPolicyIds.size === 0) {
        setDirtyFlags(policyOptions.map(() => false)); // reset to default
        setPendingSelections(
          policyOptions.map((policy) => getDefaultChoice(policy)),
        );
      } else {
        // Only reset the policies whose relationship-group bucket changed. Other
        // policies/components must keep their existing selections.
        setDirtyFlags((prev) =>
          policyOptions.map((policy, index) =>
            impactedPolicyIds.has(Number(policy?.policyId))
              ? false
              : prev[index] ?? false,
          ),
        );

        // Clear committed selections for impacted policies so UI goes back to "Select".
        setPolicyConfigurationData((prev) => {
          const current = Array.isArray(prev) ? prev : [];
          return current.map((entry) => {
            if (!entry) return entry;
            return impactedPolicyIds.has(Number(entry?.policyId)) ? null : entry;
          });
        });

        // Clear committed family snapshots for impacted policies (component-level keys).
        setCommittedFamilyMembers((prev) => {
          const next: Record<string, any> = {};
          Object.entries(prev || {}).forEach(([key, value]) => {
            const policyIdPart = Number(String(key).split("|")[0]);
            if (!impactedPolicyIds.has(policyIdPart)) {
              next[key] = value;
            }
          });
          return next;
        });

        // Reset pending selection for impacted policies to the new default choice
        // (the one flagged isDefault: true in the refreshed policy data) instead of
        // null — otherwise the UI shows no choice selected after a relationship-group
        // bucket change.
        setPendingSelections((prev) =>
          policyOptions.map((policy, index) => {
            if (impactedPolicyIds.has(Number(policy?.policyId))) {
              return getDefaultChoice(policy);
            }
            return prev[index] ?? null;
          }),
        );
      }

      setShouldResetSelections(false);
      setResetSelectionPolicyIds?.([]);
    }
  }, [
    policyOptions,
    resetSelectionPolicyIds,
    setCommittedFamilyMembers,
    setPolicyConfigurationData,
    setPendingSelections,
    setResetSelectionPolicyIds,
    setShouldResetSelections,
    shouldResetSelections,
    policiesWithDependents,
  ]);

  useEffect(() => {
    setDirtyFlags((prev) => {
      const next = policyOptions.map((_, index) => prev[index] ?? false);
      return next;
    });
  }, [policyOptions]);

  useEffect(() => {
    setPendingSelections((prev) => {
      const next = policyOptions.map((policy, index) => {
        // Build a signature of the current choice set and compare to the last
        // one seen for this policy. If it changed, this re-render is due to a
        // refresh API call (typically a dependent add/remove in an
        // isRelationshipGroup policy returning a different choice list).
        const currentSignature = JSON.stringify(
          (policy?.choices ?? []).map((c: any) => ({
            si: c?.sumInsuredId ?? null,
            d: Boolean(c?.isDefault),
            a: c?.isAvailable !== false,
            // Include contributions: a refresh that keeps the same isDefault
            // sumInsuredId but changes amounts (because the relationship-group
            // bucket changed) must still be detected.
            ec: c?.employeeContribution ?? null,
            cc: c?.companyContribution ?? null,
          })),
        );
        const previousSignature = previousChoicesSignaturesRef.current[index];
        const choicesChanged =
          previousSignature !== undefined &&
          previousSignature !== currentSignature;
        previousChoicesSignaturesRef.current[index] = currentSignature;

        // Also detect dependent set changes via the LIVE familyMemberDetails
        // (the per-policy `policiesWithDependents` map is built from the
        // initial relationConstraints load and is NOT updated when the user
        // adds/deletes dependents). This catches refreshes where the API
        // returns identical choices but a dependent was added/removed.
        const currentDependentsSignature = JSON.stringify(
          Object.entries(familyMemberDetails || {})
            .flatMap(([relationshipType, members]) =>
              Array.isArray(members)
                ? members.map((m: any) =>
                    [
                      relationshipType,
                      m?.id ?? m?.tempKey ?? "",
                      m?.name ?? "",
                      m?.relation ?? "",
                      m?.dateOfBirth ?? "",
                      m?.gender ?? "",
                    ].join("|"),
                  )
                : [],
            )
            .sort(),
        );
        const previousDependentsSignature =
          previousDependentsSignaturesRef.current[index];
        const dependentsChanged =
          previousDependentsSignature !== undefined &&
          previousDependentsSignature !== currentDependentsSignature;
        previousDependentsSignaturesRef.current[index] =
          currentDependentsSignature;

        const isRefresh = choicesChanged || dependentsChanged;

        const currentDefault = getDefaultChoice(policy);
        const isRelationshipGroupPolicy = Boolean(
          policy?.policyId &&
            policiesWithDependents?.[Number(policy.policyId)],
        );

        // On refresh (choice set changed) → ALWAYS use the new isDefault: true
        // choice. Committed/dirty/old pending are all ignored — refresh is the
        // signal that the user's previous context is stale. For
        // isRelationshipGroup policies, also remember that the new isDefault
        // must keep winning across subsequent re-renders (parent may rebuild
        // the committed selection from employeeChosenChoices right after the
        // refresh, which would otherwise override the new default).
        if (isRefresh) {
          if (isRelationshipGroupPolicy) {
            refreshDefaultOverrideRef.current.add(index);
          }
          return currentDefault;
        }

        // Not a refresh (initial mount, page revisit, in-session re-render).
        // Preserve the user's mid-session manual click.
        if (dirtyFlags[index]) {
          // User explicitly clicked something — the post-refresh override is
          // no longer relevant.
          refreshDefaultOverrideRef.current.delete(index);
          return prev[index] ?? currentDefault;
        }

        const committed = resolveCommittedSelectionForPolicy(policy, index);

        // Post-refresh override: a refresh happened earlier and the user has
        // not yet picked anything. Keep the new isDefault on screen even if a
        // committed selection has been rebuilt with a different sumInsuredId.
        // Clear the override once committed aligns with currentDefault (e.g.
        // user submitted the default → committed becomes the same SI).
        if (refreshDefaultOverrideRef.current.has(index)) {
          if (
            committed &&
            currentDefault &&
            committed.sumInsuredId === currentDefault.sumInsuredId
          ) {
            refreshDefaultOverrideRef.current.delete(index);
            return { ...committed, group: policy?.group };
          }
          return currentDefault;
        }

        // No refresh, no dirty: prefer committed (past enrollment) if its
        // sumInsuredId is still available; otherwise fall back to isDefault.
        if (committed) {
          const committedAvailable = (policy?.choices ?? []).some(
            (c: any) =>
              c?.isAvailable !== false &&
              c?.sumInsuredId === committed?.sumInsuredId,
          );
          if (committedAvailable) {
            return { ...committed, group: policy?.group };
          }
        }

        return currentDefault;
      });

      return next;
    });
  }, [
    policyConfigurationData,
    policyOptions,
    dirtyFlags,
    resolveCommittedSelectionForPolicy,
    policiesWithDependents,
    familyMemberDetails,
  ]);

  const updateDirtyFlag = (index: number, value: boolean) => {
    setDirtyFlags((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // A component is compulsory unless it is an `optional` type, or a component the
  // configurator explicitly flagged `isOptional`. Compared against `true` (not
  // falsy) so configurations saved before the flag existed stay compulsory.
  // Both the accordion bucketing and `hasAllCompulsoryOptionsSelected` read this,
  // so the rendered section and the submit gate can never disagree.
  const isCompulsoryPolicy = (policy: any) => {
    return policy?.type !== "optional" && policy?.isOptional !== true;
  };

  // A "parental" component priced via a relation-tier parameter (relationGroupDetails)
  // legitimately has zero available choices while 0 parents are matched (the tier with
  // 0 parents has no priced SI at all -- pricing only starts once a parent is added,
  // shifting to a higher tier). That's a normal "not grown into pricing yet" state, not
  // "this component is disabled" -- so it must still render, letting the employee add a
  // dependent to reach a tier that has pricing. Every other component type keeps the
  // existing rule (hide when it truly has no available choices).
  const hasVisibleChoicesOrIsAddableParental = (policy: any, availableChoices: any[]) => {
    if (availableChoices.length > 0) return true;
    return policy?.type === "parental" && policy?.isOptional === true;
  };

  const isCommittedAndUnchangedForCompulsoryPolicy = useCallback(
    (policy: any, index: number) => {
      const committedSelection = resolveCommittedSelectionForPolicy(policy, index);
      const pendingSelection = pendingSelections[index] ?? null;
      const selectedChoice =
        pendingSelection ||
        committedSelection ||
        (getDefaultChoice(policy)
          ? { ...getDefaultChoice(policy), group: policy?.group }
          : null);

      const familyMemberChanges =
        policy?.policyId && selectedChoice && policiesWithDependents?.[Number(policy.policyId)]
          ? (() => {
              const committedKey = buildCommittedFamilyKey(
                Number(policy.policyId),
                selectedChoice?.parentpolicyComponentActionTypeId,
                selectedChoice?.policyComponentActionTypeId,
              );
              const committed = committedFamilyMembers[committedKey];
              if (!committed) {
                return false;
              }

              const committedMembers = getDependentsForSelection(
                committed,
                selectedChoice?.parentpolicyComponentActionTypeId,
                selectedChoice?.policyComponentActionTypeId,
              );
              const currentMembers = getDependentsForSelection(
                familyMemberDetails,
                selectedChoice?.parentpolicyComponentActionTypeId,
                selectedChoice?.policyComponentActionTypeId,
              );

              return !areStringArraysEqual(committedMembers, currentMembers);
            })()
          : false;

      const hasSelectionChanged =
        Boolean(dirtyFlags[index]) ||
        familyMemberChanges ||
        (committedSelection &&
          pendingSelection &&
          pendingSelection.sumInsuredId !== committedSelection.sumInsuredId);

      const isAlreadyEnrolled = isPolicyInEnrollmentSummary(policy, selectedChoice);
      return Boolean(isAlreadyEnrolled && !hasSelectionChanged);
    },
    [
      committedFamilyMembers,
      dirtyFlags,
      familyMemberDetails,
      pendingSelections,
      policiesWithDependents,
      resolveCommittedSelectionForPolicy,
    ],
  );

  const hasAllCompulsoryOptionsSelected = useMemo(() => {
    const compulsoryEntries = policyOptions
      .map((policy, index) => ({
        policy,
        index,
        availableChoices:
          policy?.choices?.filter((choice: any) => choice.isAvailable) ?? [],
      }))
      .filter(
        ({ policy, availableChoices }) =>
          availableChoices.length > 0 &&
          isCompulsoryPolicy(policy) &&
          policy?.type !== "parental",
      );

    if (!compulsoryEntries.length) {
      return true;
    }

    return compulsoryEntries.every(({ policy, index }) =>
      isCommittedAndUnchangedForCompulsoryPolicy(policy, index),
    );
  }, [
    isCommittedAndUnchangedForCompulsoryPolicy,
    policyOptions,
  ]);

  const compulsorySelectionStatusTimeoutRef = useRef<number | null>(null);
  const lastEmittedCompulsorySelectionStatusRef = useRef<boolean>(
    hasAllCompulsoryOptionsSelected,
  );

  useEffect(() => {
    if (
      lastEmittedCompulsorySelectionStatusRef.current ===
      hasAllCompulsoryOptionsSelected
    ) {
      return;
    }

    if (compulsorySelectionStatusTimeoutRef.current !== null) {
      window.clearTimeout(compulsorySelectionStatusTimeoutRef.current);
    }

    compulsorySelectionStatusTimeoutRef.current = window.setTimeout(() => {
      lastEmittedCompulsorySelectionStatusRef.current =
        hasAllCompulsoryOptionsSelected;
      onCompulsorySelectionStatusChange?.(hasAllCompulsoryOptionsSelected);
      compulsorySelectionStatusTimeoutRef.current = null;
    }, 120);

    return () => {
      if (compulsorySelectionStatusTimeoutRef.current !== null) {
        window.clearTimeout(compulsorySelectionStatusTimeoutRef.current);
        compulsorySelectionStatusTimeoutRef.current = null;
      }
    };
  }, [hasAllCompulsoryOptionsSelected, onCompulsorySelectionStatusChange]);

  const componentSelectionStateByKey = useMemo(() => {
    const next: Record<string, boolean> = {};

    policyOptions.forEach((policy, index) => {
      const availableChoices =
        policy?.choices?.filter((choice: any) => choice.isAvailable) ?? [];
      if (!availableChoices.length) return;

      const committedSelection = resolveCommittedSelectionForPolicy(policy, index);
      const pendingSelection = pendingSelections[index] ?? null;
      const selectedChoice =
        pendingSelection || committedSelection || getDefaultChoice(policy);

      if (!selectedChoice) return;

      const hasChanges =
        dirtyFlags[index] ||
        (policy?.policyId
          ? hasFamilyMemberChanges(
              index,
              Number(policy.policyId),
              selectedChoice?.parentpolicyComponentActionTypeId,
              selectedChoice?.policyComponentActionTypeId,
            )
          : false) ||
        (committedSelection &&
          pendingSelection &&
          pendingSelection.sumInsuredId !== committedSelection.sumInsuredId);

      const isAlreadyEnrolled = isPolicyInEnrollmentSummary(policy, selectedChoice);
      const componentKey = getPolicyComponentIdentityKey({
        ...selectedChoice,
        policyId: policy?.policyId,
      });

      next[componentKey] = Boolean(isAlreadyEnrolled && !hasChanges);
    });

    return next;
  }, [
    dirtyFlags,
    hasFamilyMemberChanges,
    isPolicyInEnrollmentSummary,
    pendingSelections,
    policyOptions,
    resolveCommittedSelectionForPolicy,
  ]);

  const lastEmittedComponentSelectionStateRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const previousState = lastEmittedComponentSelectionStateRef.current;
    const previousKeys = Object.keys(previousState);
    const nextKeys = Object.keys(componentSelectionStateByKey);

    if (
      previousKeys.length === nextKeys.length &&
      nextKeys.every((key) => previousState[key] === componentSelectionStateByKey[key])
    ) {
      return;
    }

    lastEmittedComponentSelectionStateRef.current = componentSelectionStateByKey;
    onComponentSelectionStateChange?.(componentSelectionStateByKey);
  }, [componentSelectionStateByKey, onComponentSelectionStateChange]);
  // Helper function to detect family member changes
  function hasFamilyMemberChanges(
    index: number,
    policyId: number,
    parentpolicyComponentActionTypeId?: string | null,
    policyComponentActionTypeId?: string | null,
  ) {
    // Only check for policies that have dependent/relation support
    if (!policiesWithDependents?.[Number(policyId)]) {
      return false;
    }

    const committedKey = buildCommittedFamilyKey(
      policyId,
      parentpolicyComponentActionTypeId,
      policyComponentActionTypeId,
    );
    const committed = committedFamilyMembers[committedKey];
    if (!committed) {
      // No committed state means this is first time or never enrolled
      return false;
    }

    const committedMembers = getDependentsForSelection(
      committed,
      parentpolicyComponentActionTypeId,
      policyComponentActionTypeId,
    );
    const currentMembers = getDependentsForSelection(
      familyMemberDetails,
      parentpolicyComponentActionTypeId,
      policyComponentActionTypeId,
    );

    // Track membership changes only (add/remove per component).
    // Pure detail edits should not alter button state.
    return !areStringArraysEqual(committedMembers, currentMembers);
  }

  // Callback to handle policy removal when all dependents are deleted
  const handlePolicyComponentRemoval = useCallback(
    (
      parentpolicyComponentActionTypeId?: string,
      policyComponentActionTypeId?: string,
      policyComponentActionType?: string,
      policyComponentActionLabel?: string
    ) => {
      const targetParentId = normalizeChoiceKey(parentpolicyComponentActionTypeId);
      const targetComponentId = normalizeChoiceKey(policyComponentActionTypeId);
      const targetType = String(policyComponentActionType ?? "").toLowerCase();
      const targetLabel = String(policyComponentActionLabel ?? "").toLowerCase();

      const matchesRemovalTarget = (item: any) => {
        if (!item) return false;

        const itemParentId = normalizeChoiceKey(
          item?.parentpolicyComponentActionTypeId,
        );
        const itemComponentId = normalizeChoiceKey(
          item?.policyComponentActionTypeId ?? item?.id,
        );

        if (
          itemParentId === targetParentId &&
          itemComponentId === targetComponentId
        ) {
          return true;
        }

        const itemType = String(item?.policyComponentActionType ?? item?.type ?? "").toLowerCase();
        const itemLabel = String(
          item?.policyComponentActionLabel ?? item?.label ?? "",
        ).toLowerCase();

        return itemType === targetType && itemLabel === targetLabel;
      };

      // Remove the matching committed policy configuration
      setPolicyConfigurationData((prev: any[]) => {
        const updated = prev.filter((policy) => {
          return !matchesRemovalTarget(policy);
        });

        return updated;
      });

      // Also clear matching pending selections so CTA/status flips to "Select" immediately.
      const clearedIndexes: number[] = [];
      setPendingSelections((prev) =>
        prev.map((selection, index) => {
          if (matchesRemovalTarget(selection)) {
            clearedIndexes.push(index);
            return null;
          }
          return selection;
        }),
      );

      if (clearedIndexes.length > 0) {
        setDirtyFlags((prev) => {
          const next = [...prev];
          clearedIndexes.forEach((index) => {
            next[index] = false;
          });
          return next;
        });

        setCommittedFamilyMembers((prev) => {
          const next: Record<string, any> = {};
          const parseKeyPart = (part: string | undefined) =>
            part === undefined || part === "" ? null : part;

          Object.entries(prev || {}).forEach(([key, value]) => {
            const parts = String(key).split("|");
            const parentId = parseKeyPart(parts[1]);
            const componentId = parseKeyPart(parts[2]);

            if (
              parentId === targetParentId &&
              componentId === targetComponentId
            ) {
              return;
            }

            next[key] = value;
          });

          return next;
        });
      }
    },
    [setPendingSelections, setPolicyConfigurationData]
  );
  const handleEmployeeExclusionChange = (policyKey: string, isExcluded: boolean) => {
    setEmployeeExclusionStates((prev) => ({
      ...prev,
      [policyKey]: isExcluded,
    }));
  };

  const handleCardSelection = (
    policy: any,
    index: number,
    group = "optional",
  ) => {
    if (isReadOnly) {
      return;
    }
    setPendingSelections((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...policy,
        group,
        rawSumInsured: policy.sumInsured, // Preserve original sumInsured as rawSumInsured
      };
      return updated;
    });
    updateDirtyFlag(index, true);
  };

  const ensureArrayLength = (data: any[], index: number) => {
    const updated = [...data];
    while (updated.length <= index) {
      updated.push(null);
    }
    return updated;
  };

  // Build a list of valid accordion indexes
  const validIndexes = useMemo(() => {
    return policyOptions?.reduce<number[]>((acc, policy, index) => {
      const availableChoices =
        policy?.choices?.filter((choice: any) => choice.isAvailable) ?? [];
      if (hasVisibleChoicesOrIsAddableParental(policy, availableChoices)) {
        acc.push(index);
      }
      return acc;
    }, []);
  }, [policyOptions]);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (validIndexes.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true; // Only run ONCE on first load

      let targetIndex: number | undefined;

      if (policyId) {
        targetIndex = validIndexes.find((index) => {
          const policy = policyOptions[index];
          return policy?.policyId === policyId;
        });
      }

      if (targetIndex === undefined) {
        targetIndex = validIndexes.find((index) => {
          const policy = policyOptions[index];
          const isLocked =
            policy?.policyFinalstatus === PolicyStatus.LOCKED ||
            policy?.policyFinalstatus === PolicyStatus.NOTIFY;
          return !isLocked;
        });
      }

      const finalIndex =
        targetIndex !== undefined ? targetIndex : validIndexes[0];
      setAccordionIndexes(new Set([finalIndex]));
    }
  }, [validIndexes, policyOptions, policyId]);

  // Snapshot effect: for every open accordion, once its committed selection is available
  // (policyConfigurationData loads async after accordion auto-opens), set the family
  // snapshot so hasFamilyMemberChanges can detect check/uncheck changes.
  // The `if (prev[snapshotKey]) return prev` guard inside setCommittedFamilyMembers
  // ensures we never overwrite an existing snapshot — so this is safe to run on every
  // render and handles ALL open accordions, not just the first one.
  useEffect(() => {
    if (accordionIndexes.size === 0) return;

    const snapshotsToAdd: Record<string, any> = {};

    for (const openIndex of Array.from(accordionIndexes)) {
      const openPolicy = policyOptions[openIndex];
      if (!openPolicy) continue;
      if (!policiesWithDependents?.[Number(openPolicy?.policyId)]) continue;

      const committed = resolveCommittedSelectionForPolicy(openPolicy, openIndex);
      if (!committed) continue; // data not loaded yet — will re-run when policyConfigurationData changes

      const snapshotKey = buildCommittedFamilyKey(
        Number(openPolicy.policyId),
        committed?.parentpolicyComponentActionTypeId,
        committed?.policyComponentActionTypeId,
      );

      snapshotsToAdd[snapshotKey] = JSON.parse(JSON.stringify(familyMemberDetails));
    }

    if (Object.keys(snapshotsToAdd).length === 0) return;

    setCommittedFamilyMembers((prev) => {
      // Only add snapshots that don't exist yet — never overwrite existing ones.
      const additions: Record<string, any> = {};
      for (const [key, value] of Object.entries(snapshotsToAdd)) {
        if (!prev[key]) additions[key] = value;
      }
      if (Object.keys(additions).length === 0) return prev;
      return { ...prev, ...additions };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accordionIndexes, policyOptions, policyConfigurationData, policiesWithDependents, resolveCommittedSelectionForPolicy]);

  const handleEnrollSelection = (index: number) => {
    if (isReadOnly) {
      return;
    }
    const selectedPolicy = pendingSelections[index];

    if (!selectedPolicy) return;

    // Snapshot current family members for this specific component so only this
    // component flips CTA to "Select" when members are later changed.
    const selectedPolicyMeta = policyOptions[index];
    const selectedPolicyId = Number(
      selectedPolicyMeta?.policyId ?? selectedPolicy?.policyId,
    );
    const shouldSnapshotFamily =
      Number.isFinite(selectedPolicyId) &&
      Boolean(policiesWithDependents?.[selectedPolicyId]);
    if (shouldSnapshotFamily) {
      const snapshotKey = buildCommittedFamilyKey(
        selectedPolicyId,
        selectedPolicy?.parentpolicyComponentActionTypeId,
        selectedPolicy?.policyComponentActionTypeId,
      );
      setCommittedFamilyMembers((prev) => ({
        ...prev,
        [snapshotKey]: JSON.parse(JSON.stringify(familyMemberDetails)),
      }));
    }

    setPolicyConfigurationData((prev: any) => {
      const currentData = Array.isArray(prev) ? prev : [];
      const adjusted = [...currentData];

      // Check if this policy is already enrolled
      const policy = policyOptions[index];
      const isAlreadyInEnrollmentSummary = isPolicyInEnrollmentSummary(
        policy,
        selectedPolicy
      );
      const selectionKey = getComponentSelectionKey(selectedPolicy);
      const targetPolicyId = Number(
        policy?.policyId ?? selectedPolicy?.policyId
      );
      const matchedExistingIndex = adjusted.findIndex(
        (item) =>
          item &&
          Number(item.policyId) === targetPolicyId &&
          getComponentSelectionKey(item) === selectionKey
      );
      const indexedCandidate = adjusted[index];
      const indexedCandidateMatchesIdentity =
        indexedCandidate &&
        Number(indexedCandidate.policyId) === targetPolicyId &&
        getComponentSelectionKey(indexedCandidate) === selectionKey;
      const previous =
        matchedExistingIndex >= 0
          ? adjusted[matchedExistingIndex]
          : indexedCandidateMatchesIdentity
          ? indexedCandidate
          : null;

      const updatedPolicy = {
        ...selectedPolicy,
        policyId: targetPolicyId,
        policyName: policy?.policyName ?? selectedPolicy?.policyName,
        policyTypeKey: policy?.policyTypeKey ?? selectedPolicy?.policyTypeKey,
        policyComponentActionType:
          selectedPolicy?.policyComponentActionType ?? policy?.type,
        policyComponentActionLabel:
          selectedPolicy?.policyComponentActionLabel ?? policy?.label,
        id: previous?.id,
        // Add a flag to indicate this is a replacement if policy was already enrolled
        isReplacement: isAlreadyInEnrollmentSummary,
        // Add timestamp to help with deduplication
        updatedAt: Date.now(),
      };

      if (matchedExistingIndex >= 0) {
        adjusted[matchedExistingIndex] = updatedPolicy;
      } else if (!adjusted[index]) {
        adjusted[index] = updatedPolicy;
      } else {
        // Keep cross-policy base selections intact by appending when index slot already belongs to another component.
        adjusted.push(updatedPolicy);
      }

      // Remove stale duplicates of the same policy component and keep the latest one.
      const latestByIdentity = new Map<string, any>();
      adjusted.forEach((item) => {
        if (!item) return;
        const identityKey = getPolicyComponentIdentityKey(item);
        const existing = latestByIdentity.get(identityKey);
        if (
          !existing ||
          Number(item.updatedAt ?? 0) >= Number(existing.updatedAt ?? 0)
        ) {
          latestByIdentity.set(identityKey, item);
        }
      });

      return Array.from(latestByIdentity.values());
    });

    updateDirtyFlag(index, false);

    // Move to next accordion or handle section transitions
    const policy = policyOptions[index];
    if (policiesWithDependents?.[Number(policy?.policyId)]) {
      setCommittedFamilyMembers((prev) => ({
        ...prev,
        [index]: JSON.parse(JSON.stringify(familyMemberDetails)),
      }));
    }
      // Auto-progress logic: compulsory first, then optional
      const isCurrentCompulsory = isCompulsoryPolicy(policyOptions[index]);
      let nextIndex = null;

      if (isCurrentCompulsory) {
        // Find next compulsory policy
        const nextCompulsory = compulsoryPolicyEntries.find(({ index: compIndex }) => compIndex > index);
        if (nextCompulsory) {
          nextIndex = nextCompulsory.index;
        } else if (optionalPolicyEntries.length > 0) {
          if (!sectionExpanded.optional) {
            setSectionExpanded((prev) => ({ ...prev, optional: true }));
          }
          return; // Don't proceed to expand any inner policy accordion
        }
      } else {
        // If current is optional, move to next optional
        const currentOptionalPos = optionalPolicyEntries.findIndex(({ index: optIndex }) => optIndex === index);
        if (currentOptionalPos !== -1 && currentOptionalPos + 1 < optionalPolicyEntries.length) {
          nextIndex = optionalPolicyEntries[currentOptionalPos + 1].index;
        }
      }
      
      // Wait for button animation to complete (600ms) before auto-progressing to next accordion
      if (nextIndex !== null) {
        setTimeout(() => {
          setAccordionIndexes((prev) => {
            const newSet = new Set(prev);
            newSet.add(nextIndex);
            return newSet;
          });
        }, 600);
      }
    };

  const handleCancelSelection = (index: number) => {
    if (isReadOnly) {
      setAccordionIndexes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      return;
    }
    const committedSelection =
      resolveCommittedSelectionForPolicy(policyOptions[index], index) ?? null;
    const pendingSelection = pendingSelections[index] ?? null;

    if (
      pendingSelection &&
      committedSelection &&
      pendingSelection.sumInsuredId !== committedSelection.sumInsuredId
    ) {
      setPendingSelections((prev) => {
        const updated = [...prev];
        updated[index] = committedSelection;
        return updated;
      });
      updateDirtyFlag(index, false);
      return;
    }

    // Clear pending selection (deselect card)
    setPendingSelections((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });

    // Clear policy configuration data
    setPolicyConfigurationData((prev: any) => {
      const currentData = Array.isArray(prev) ? prev : [];
      const policy = policyOptions[index];
      const referenceSelection =
        pendingSelection || committedSelection || policy;

      const removePolicyId = Number(
        referenceSelection?.policyId ?? policy?.policyId ?? 0
      );
      const removeKey = getComponentSelectionKey(referenceSelection);

      return currentData.filter(
        (item) =>
          !(
            item &&
            Number(item.policyId) === removePolicyId &&
            getComponentSelectionKey(item) === removeKey
          )
      );
    });
    // Clear committed family members for this policy
    setCommittedFamilyMembers((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    updateDirtyFlag(index, false);
  };

  // Toggle-off for the primary CTA: clicking "Selected" drops the component
  // again. Applies to every group — compulsory, optional and flex. Removing it
  // from policyConfigurationData is what pulls its premium out of the calculator
  // and the summary — both read that array as the single source of truth.
  const handleUnselectSelection = (index: number) => {
    if (isReadOnly) return;

    const policy = policyOptions[index];
    const reference =
      resolveCommittedSelectionForPolicy(policy, index) ??
      pendingSelections[index] ??
      getDefaultChoice(policy);
    if (!reference) return;

    const removePolicyId = Number(reference?.policyId ?? policy?.policyId ?? 0);
    const removeKey = getComponentSelectionKey(reference);

    setPolicyConfigurationData((prev: any) =>
      (Array.isArray(prev) ? prev : []).filter(
        (item) =>
          !(
            item &&
            Number(item.policyId) === removePolicyId &&
            getComponentSelectionKey(item) === removeKey
          ),
      ),
    );

    setPendingSelections((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });

    // Keyed the same way every other committed-family write is (policyId|parent|component).
    // The index-keyed delete in handleCancelSelection never matches and leaves stale members.
    setCommittedFamilyMembers((prev) => {
      const next = { ...prev };
      delete next[
        buildCommittedFamilyKey(
          removePolicyId,
          reference?.parentpolicyComponentActionTypeId,
          reference?.policyComponentActionTypeId,
        )
      ];
      return next;
    });

    // Drop this component from every dependent's `choices`. Without it the submit
    // payload still enrols those dependents into the component just removed —
    // policyConfigurationData and the dependent list are two separate carriers of
    // the same decision, and both have to agree.
    const targetParentId = normalizeChoiceKey(
      reference?.parentpolicyComponentActionTypeId,
    );
    const targetComponentId = normalizeChoiceKey(
      reference?.policyComponentActionTypeId,
    );
    const nextFamilyMembers: Record<string, any[]> = {};
    Object.entries(familyMemberDetails || {}).forEach(([group, members]) => {
      nextFamilyMembers[group] = (Array.isArray(members) ? members : []).map(
        (member: any) => {
          if (!Array.isArray(member?.choices)) return member;
          const choices = member.choices.filter(
            (choice: any) =>
              !(
                normalizeChoiceKey(
                  choice?.parentpolicyComponentActionTypeId,
                ) === targetParentId &&
                normalizeChoiceKey(choice?.policyComponentActionTypeId) ===
                  targetComponentId
              ),
          );
          // The dependent ALSO carries the component on flat top-level fields,
          // which transformFamilyMembersToArray copies straight into the submit
          // payload independently of `choices`. Clearing only `choices` would
          // still ship policyComponentActionTypeId for the removed component.
          const ownsRemovedComponent =
            normalizeChoiceKey(member?.parentpolicyComponentActionTypeId) ===
              targetParentId &&
            normalizeChoiceKey(member?.policyComponentActionTypeId) ===
              targetComponentId;

          if (choices.length === member.choices.length && !ownsRemovedComponent) {
            return member;
          }

          return {
            ...member,
            choices,
            ...(ownsRemovedComponent
              ? {
                  parentpolicyComponentActionTypeId: null,
                  policyComponentActionTypeId: null,
                  policyComponentActionLabel: null,
                  policyComponentActionType: null,
                }
              : {}),
          };
        },
      );
    });
    onFamilyMemberChange(nextFamilyMembers);

    // Without this the CTA stays "Selected": the component is still present in the
    // server-side enrollment summary, so only a dirty flag can flip it back.
    updateDirtyFlag(index, true);
  };

  const formatAmount = (value: number | string | undefined) => {
    if (value === null || value === undefined) {
      return "--";
    }

    const rawValue =
      typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value;

    const numericValue = Number(rawValue);

    if (Number.isNaN(numericValue) || rawValue === "") {
      return String(value);
    }

    return `${formatAmountWithCurrency(numericValue, localizationData?.data, 2)}`;
  };

  const policyName = location.state?.policyInfo?.policyName;

  // Helper function to check if there are any valid relationship options (including Self)
  const hasValidRelationshipOptions = (policyData?: any) => {
    // Handle nested structure from API (relationConstraints.relationships)
    const relationshipData = policyData?.relationships || policyData;

    if (!relationshipData?.enabledPolicyRelations) return false;

    // Check if there are any enabled relations.
    // Self-only policies (e.g. GPA) may have empty configuredOptions — treat that as valid.
    const hasValidOptions = relationshipData.enabledPolicyRelations.some(
      (relation: any) =>
        relation.enabled &&
        (!relation.configuredOptions?.length ||
          relation.configuredOptions.some((option: any) => option.enabled)),
    );

    return hasValidOptions;
  };

  // FamilyMembersManagement visibility and read-only state are now computed per-accordion
  // using policiesWithDependents so any policy type (GMC, GPA, GTL, etc.) is supported.
  // groupMediclaimPolicy is kept for the isRelationshipGroup=true API flow only.

  // Derive the GPA / lock-in acknowledgement disclaimers from the LIVE checkbox
  // state (not from clicking Select), so submit always reflects the current
  // acknowledgements — including removal when a note no longer applies.
  const ackDisclaimerEntries = useMemo(() => {
    const entries: { policyId: number; text: string; isMandatory: boolean }[] =
      [];
    policyOptions.forEach((policy: any, index: number) => {
      const policyId = Number(policy?.policyId);
      if (!Number.isFinite(policyId)) return;
      const committed = resolveCommittedSelectionForPolicy(policy, index);
      const pending = pendingSelections[index];
      const dflt = getDefaultChoice(policy);
      const summarySel = pending || committed || dflt;

      const acceptedTexts = acceptedDisclaimerTextsByPolicy[String(policyId)];

      // GPA note: GPA policy + employee designation + non-default choice + checked.
      // "Checked" is the EFFECTIVE state the user sees: local toggle OR already
      // accepted in the policy API (so an already-checked note still persists).
      const isGpaPolicy = String(policy?.policyTypeKey ?? "")
        .toUpperCase()
        .includes("GPA");
      const isNonDefault =
        Boolean(summarySel) &&
        Number(summarySel?.sumInsuredId) !== Number(dflt?.sumInsuredId);
      const gpaChecked =
        gpaNoteAcknowledged[String(policyId)] ??
        Boolean(acceptedTexts?.has(GPA_SI_ACK_TEXT.trim()));
      if (isGpaPolicy && isEmployeeDesignation && isNonDefault && gpaChecked) {
        entries.push({ policyId, text: GPA_SI_ACK_TEXT, isMandatory: true });
      }

      // Lock-in note: period > 0 + checked (key resolved committed → pending → default).
      const lockInTypeId =
        committed?.policyComponentActionTypeId ??
        pending?.policyComponentActionTypeId ??
        dflt?.policyComponentActionTypeId;
      const lockInParentTypeId =
        committed?.parentpolicyComponentActionTypeId ??
        pending?.parentpolicyComponentActionTypeId ??
        dflt?.parentpolicyComponentActionTypeId;
      const period = Number(
        (policiesWithDependents?.[policyId]?.configuration as any)?.constraints
          ?.parentalLockInPeriod ?? 0,
      );
      const lockInText = buildParentalLockInText(period);
      const lockInChecked =
        lockInAcknowledged[`${lockInParentTypeId}-${lockInTypeId}`] ??
        Boolean(acceptedTexts?.has(lockInText.trim()));
      if (period > 0 && lockInChecked) {
        entries.push({
          policyId,
          text: lockInText,
          isMandatory: true,
        });
      }
    });
    return entries;
  }, [
    policyOptions,
    pendingSelections,
    gpaNoteAcknowledged,
    lockInAcknowledged,
    isEmployeeDesignation,
    policiesWithDependents,
    resolveCommittedSelectionForPolicy,
    acceptedDisclaimerTextsByPolicy,
  ]);

  useEffect(() => {
    onAckDisclaimersChange?.(ackDisclaimerEntries);
  }, [ackDisclaimerEntries, onAckDisclaimersChange]);

  let displayIndex = 0;

  const visiblePolicyEntries = policyOptions
    .map((policy, index) => ({
      policy,
      index,
      availableChoices:
        policy?.choices?.filter((choice: any) => choice.isAvailable) ?? [],
    }))
    .filter(({ policy, availableChoices }) =>
      hasVisibleChoicesOrIsAddableParental(policy, availableChoices)
    );

  const isFlexPolicyEntry = ({ policy }: { policy: any; availableChoices: any[] }) =>
    policy?.type === "optional" && policy?.isBenefitComponent === true;

  const compulsoryPolicyEntries = visiblePolicyEntries.filter(
    (entry) => isCompulsoryPolicy(entry.policy) && !isFlexPolicyEntry(entry)
  );
  const optionalPolicyEntries = visiblePolicyEntries.filter(
    (entry) => !isCompulsoryPolicy(entry.policy) && !isFlexPolicyEntry(entry)
  );
  const flexPolicyEntries = visiblePolicyEntries.filter(isFlexPolicyEntry);

  const toggleSection = (section: "compulsory" | "optional" | "flex") => {
    setSectionExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };


  const renderPolicyAccordion = ({
    policy,
    index,
    availableChoices,
  }: {
    policy: any;
    index: number;
    availableChoices: any[];
  }) => {
    const isCompulsory = isCompulsoryPolicy(policy);
    const isExpanded = accordionIndexes.has(index);
    const committedSelection = resolveCommittedSelectionForPolicy(policy, index);
    const isSelected = Boolean(committedSelection);
    const pendingSelection = pendingSelections[index];
    const defaultChoice = getDefaultChoice(policy);
    const selectedChoiceForSummary =
      pendingSelection || committedSelection || defaultChoice;
    const latestChoiceForSummary =
      selectedChoiceForSummary && Array.isArray(availableChoices)
        ? availableChoices.find(
            (choice: any) =>
              Number(choice?.sumInsuredId) ===
              Number(selectedChoiceForSummary?.sumInsuredId),
          ) ?? null
        : null;
    const rawSummarySelection = selectedChoiceForSummary
      ? { ...selectedChoiceForSummary, ...(latestChoiceForSummary ?? {}) }
      : latestChoiceForSummary;

    // The collapsed-accordion summary strip is a separate computation from
    // the expanded per-tier card list below, and was never wired to the same
    // proration/per-life logic — it showed the raw full value even when the
    // expanded card correctly showed the prorated one. Same fix, same source
    // of truth, applied here too.
    const summaryLivePremium = rawSummarySelection
      ? resolveApplyToDependentsPremiumClient(
          {
            policyId: policy?.policyId,
            policyComponentActionTypeId:
              rawSummarySelection?.policyComponentActionTypeId,
            policyComponentActionType: policy?.type,
            policyComponentActionLabel: policy?.label,
            parentpolicyComponentActionTypeId:
              rawSummarySelection?.parentpolicyComponentActionTypeId,
            sumInsuredId: rawSummarySelection?.sumInsuredId,
            companyContribution: rawSummarySelection?.companyContribution,
            employeeContribution: rawSummarySelection?.employeeContribution,
          },
          Object.values(familyMemberDetails).flat(),
          gmcPolicyIdsForCards,
          policyData,
          employeeDateOfBirth,
          employeeEffectiveDate,
          flattenedPolicies
        )
      : null;
    const summarySelection = rawSummarySelection
      ? {
          ...rawSummarySelection,
          companyContribution:
            summaryLivePremium?.companyContribution ??
            rawSummarySelection.companyContribution,
          employeeContribution:
            summaryLivePremium?.employeeContribution ??
            rawSummarySelection.employeeContribution,
        }
      : rawSummarySelection;

    // ── Parental 2-year lock-in note + acknowledgement gate ──────────────────
    // Show the note + checkbox ONLY when the user has added a parent
    // (Father / Mother / in-law) dependent to THIS component. The "Select"
    // button stays disabled until the box is checked.
    // IDs are resolved committed-first because a raw plan-card click yields a
    // pendingSelection without component IDs (see note near the button below);
    // this mirrors the IDs the dependent's `choices` entry is tagged with.
    const lockInTypeId =
      committedSelection?.policyComponentActionTypeId ??
      pendingSelection?.policyComponentActionTypeId ??
      defaultChoice?.policyComponentActionTypeId;
    const lockInParentTypeId =
      committedSelection?.parentpolicyComponentActionTypeId ??
      pendingSelection?.parentpolicyComponentActionTypeId ??
      defaultChoice?.parentpolicyComponentActionTypeId;
    const lockInKey = `${lockInParentTypeId}-${lockInTypeId}`;
    // Same "dependent belongs to this component" match used by coveredDepCount.
    const isParentAddedToComponent = (dep: any) =>
      isParentRelationName(
        dep?.relation ?? dep?.relationship ?? dep?.relationshipType,
      ) &&
      Array.isArray(dep?.choices) &&
      dep.choices.some(
        (c: any) =>
          String(c?.policyComponentActionTypeId) === String(lockInTypeId) &&
          String(c?.parentpolicyComponentActionTypeId ?? "null") ===
            String(lockInParentTypeId ?? "null"),
      );
    const hasAddedParents =
      lockInTypeId != null &&
      Object.values(familyMemberDetails || {})
        .flat()
        .some(isParentAddedToComponent);
    // Gate on the configured lock-in period — a period of 0 (or absent) means
    // no lock-in applies, so the note must never show.
    const parentalLockInPeriod = Number(
      (policiesWithDependents?.[Number(policy?.policyId)]?.configuration as any)
        ?.constraints?.parentalLockInPeriod ?? 0,
    );
    const showLockInNote = hasAddedParents && parentalLockInPeriod > 0;
    // Checked state reflects the policy API: checked only if this exact lock-in
    // text is already in the policy's disclaimersAccepted. Local edits win.
    const backendLockInAck = Boolean(
      acceptedDisclaimerTextsByPolicy[String(policy?.policyId)]?.has(
        buildParentalLockInText(parentalLockInPeriod).trim(),
      ),
    );
    const isLockInAcknowledged =
      lockInAcknowledged[lockInKey] ?? backendLockInAck;
    // Once submitted and unchanged, the acknowledgement is locked (checked +
    // read-only). Any unsaved change (e.g. removing then re-adding a parent)
    // unlocks it so the user must acknowledge again.
    const isLockInLocked = isCommittedAndUnchangedForCompulsoryPolicy(
      policy,
      index,
    );
    // Only lock the box when it's actually checked — an unchecked box must stay
    // interactive so the user can acknowledge.
    const isLockInDisabled = isLockInLocked && isLockInAcknowledged;

    // ── GPA sum-insured note + acknowledgement gate ──────────────────────────
    // Show ONLY on GPA policy cards, when (a) the employee's designation is
    // "Employee" (from company-employee-details) and (b) the user picked a
    // non-default sum-insured. Mirrors the lock-in note: "Select" stays disabled
    // until the box is checked.
    const isGpaPolicy = String(policy?.policyTypeKey ?? "")
      .toUpperCase()
      .includes("GPA");
    const isNonDefaultSelected =
      Boolean(summarySelection) &&
      Number(summarySelection?.sumInsuredId) !==
        Number(defaultChoice?.sumInsuredId);
    const showGpaNote =
      isGpaPolicy && isEmployeeDesignation && isNonDefaultSelected;
    const gpaNoteKey = String(policy?.policyId ?? "");
    // Checked state reflects the policy API: checked only if this exact GPA text
    // is already in the policy's disclaimersAccepted. Local edits win.
    const backendGpaAck = Boolean(
      acceptedDisclaimerTextsByPolicy[gpaNoteKey]?.has(GPA_SI_ACK_TEXT.trim()),
    );
    const isGpaNoteAcknowledged =
      gpaNoteAcknowledged[gpaNoteKey] ?? backendGpaAck;
    const isGpaNoteDisabled =
      isCommittedAndUnchangedForCompulsoryPolicy(policy, index) &&
      isGpaNoteAcknowledged;

    const totalPremium = committedSelection
      ? Number(
          committedSelection?.companyContribution ??
            committedSelection?.companyPay ??
                0,
        ) +
        Number(
          committedSelection?.employeeContribution ??
            committedSelection?.employeePay ??
                0,
        )
      : 0;

    const hasCarousel = availableChoices.length > CARDS_PER_PAGE;
    const slideDistance = CARDS_PER_PAGE * (CARD_WIDTH + GAP_WIDTH);
    const group = policy?.group || "optional";
    const optionalChoiceLabel =
      summarySelection?.policyComponentActionLabel ??
      summarySelection?.label ??
      summarySelection?.name ??
      "";
    const displayLabel = isCompulsory
      ? (policy.label || "")
      : (optionalChoiceLabel || policy.label || "");
    const policyDisplayTitle = displayLabel;
    const policyDisplayLabel = <span>{displayLabel}</span>;

    // Determine if this is the first policy of a new policy type/group
    const currentPolicyName = policy.policyName;
    const previousPolicy = index > 0 ? policyOptions[index - 1] : null;
    const previousPolicyName = previousPolicy?.policyName;

    // Check if previous policy had available choices (to ensure we're only comparing visible policies)
    // const previousHadChoices = previousPolicy
    //   ? (
    //       previousPolicy?.choices?.filter((choice) => choice.isAvailable) ??
    //       []
    //     ).length > 0
    //   : false;

    const isNewPolicyGroup =
      index === 0 || currentPolicyName !== previousPolicyName;
    // (previousHadChoices && currentPolicyName !== previousPolicyName);

    const currentPolicyDetails = flattenedPolicies.find(
          (p) => p.policyId === policy?.policyId,
    );

    const isLocked =
      currentPolicyDetails?.status === PolicyStatus.LOCKED ||
      currentPolicyDetails?.status === PolicyStatus.NOTIFY;
    const policyIconData = getPolicyIcon(policy.policyName);

    const activeChoice =
      pendingSelection ||
      committedSelection ||
      (getDefaultChoice(policy)
        ? { ...getDefaultChoice(policy), group: policy.group }
        : null);

    const activePolicyKey = `${activeChoice?.parentpolicyComponentActionTypeId}-${activeChoice?.policyComponentActionTypeId}`;
    const isEmployeeExcludedForPolicy =
      employeeExclusionStates[activePolicyKey] || false;

    const familyMembersChangedForPolicy =
      policy.policyId && activeChoice
        ? hasFamilyMemberChanges(
            index,
            Number(policy.policyId),
            activeChoice?.parentpolicyComponentActionTypeId,
            activeChoice?.policyComponentActionTypeId,
          )
        : false;

    const isAlreadyEnrolled = isPolicyInEnrollmentSummary(policy, activeChoice);

    const hasChanges =
      dirtyFlags[index] ||
      familyMembersChangedForPolicy ||
      (committedSelection &&
        pendingSelection &&
        pendingSelection.sumInsuredId !== committedSelection.sumInsuredId);

    // Keep collapsed-chip behavior aligned with the in-panel CTA:
    // show orange "Selected" only when the component is enrolled and unchanged.
    const showSelectedChip = Boolean(isAlreadyEnrolled && !hasChanges);

    return (
      <React.Fragment key={`${policy.id}-${index}`}>
        {/* Policy Group Header - show only for the first policy of each group */}
        {/* {isNewPolicyGroup && (
              <NotEnrolledIconWrapperStyled>
                <PolicyHeaderStack>
                  <PolicyHeaderRow>
                    <PolicyHeaderColumn>
                      <PolicyTitle
                        enrolled={false}
                        title={currentPolicyName || "Unknown Policy"}
                      >
                        {currentPolicyName || "Unknown Policy"}
                      </PolicyTitle>
                      {currentPolicyDetails?.status === PolicyStatus.NOTIFY && (
                        <EnrollmentOpensBadge>
                          <EnrollmentOpensIcon
                            src={LockPolicyIcon}
                            alt="notify"
                          />
                          <span>
                            Enrollment opens on{" "}
                            {currentPolicyDetails?.enrollmentStartDate
                              ? formatDate(
                                  currentPolicyDetails.enrollmentStartDate
                                )
                              : "N/A"}
                          </span>
                        </EnrollmentOpensBadge>
                      )}
                    </PolicyHeaderColumn>
                  </PolicyHeaderRow>
                </PolicyHeaderStack>
                <PolicySummaryContainer>
                  <PolicySummaryItem>
                    <PolicySummaryValue>
                      {currentPolicyDetails?.startDate &&
                      currentPolicyDetails?.dueDate
                        ? `${formatDate(
                            currentPolicyDetails.startDate
                          )} - ${formatDate(currentPolicyDetails.dueDate)}`
                        : "N/A"}
                    </PolicySummaryValue>
                    <PolicySummaryLabel>Policy Period</PolicySummaryLabel>
                  </PolicySummaryItem>
                  {currentPolicyDetails?.status === PolicyStatus.NOTIFY && (
                    <NotifyText>Notify</NotifyText>
                  )}
                </PolicySummaryContainer>
              </NotEnrolledIconWrapperStyled>
            )} */}
        <AccordionWrapper>
          <AccordionItem isExpanded={isExpanded} colorIndex={index}>
            {/* Accordion Header */}
            <AccordionContainer
              onClick={() => {
                  const isCurrentlyExpanded = accordionIndexes.has(index);

                  setAccordionIndexes((prev) => {
                    const newSet = new Set(prev);
                    if (isCurrentlyExpanded) {
                      newSet.delete(index);
                    } else {
                      newSet.add(index);
                    }
                    return newSet;
                  });
                  
                  // If closing, just return
                  if (isCurrentlyExpanded) {
                    return;
                  }
                  
                  // If opening an accordion, sync data
                  const targetIndex = index;
                  
                  // Sync pending data for target accordion
                  setPendingSelections((prevSelections) => {
                    const updated = [...prevSelections];
                    const targetPolicy = policyOptions[targetIndex];
                    const defaultChoice = getDefaultChoice(targetPolicy);
                    const committedForTarget =
                      resolveCommittedSelectionForPolicy(
                        targetPolicy,
                        targetIndex
                      );
                    // Respect the post-refresh override: if a dependent
                    // add/delete recently happened and the new isDefault
                    // hasn't been accepted yet, expanding the accordion must
                    // NOT revert pending back to the previously committed
                    // selection — the new isDefault should keep winning.
                    if (refreshDefaultOverrideRef.current.has(targetIndex)) {
                      updated[targetIndex] = defaultChoice
                        ? { ...defaultChoice, group: targetPolicy?.group }
                        : null;
                    } else {
                      updated[targetIndex] = committedForTarget
                        ? { ...committedForTarget, group: targetPolicy?.group }
                        : { ...defaultChoice, group: targetPolicy?.group };
                    }
                    return updated;
                  });
                  updateDirtyFlag(targetIndex, false);
                  
                  // Initialize committed family snapshot for this component when opening,
                  // so member changes flip CTA to "Select" only for this component.
                  const targetPolicy = policyOptions[targetIndex];
                  const committedForTarget =
                    resolveCommittedSelectionForPolicy(targetPolicy, targetIndex);
                  if (
                    committedForTarget &&
                    policiesWithDependents?.[Number(targetPolicy?.policyId)]
                  ) {
                    const snapshotKey = buildCommittedFamilyKey(
                      Number(targetPolicy?.policyId),
                      committedForTarget?.parentpolicyComponentActionTypeId,
                      committedForTarget?.policyComponentActionTypeId,
                    );
                    if (!committedFamilyMembers[snapshotKey]) {
                      setCommittedFamilyMembers((prev) => ({
                        ...prev,
                        [snapshotKey]: JSON.parse(JSON.stringify(familyMemberDetails)),
                      }));
                    }
                  }
                }
              }
            >
              <AccordionActionStyles>
                <AccordionHeaderContent>
                  {isExpanded ? (
                    <BasePolicyContainer>
                      {/* <PolicyHeader> */}
                      <PolicyIcon gradient={policyIconData.gradient}>
                        {policyIconData.initials}
                      </PolicyIcon>
                      {/* <PolicyTitle>{policyDisplayLabel}</PolicyTitle> */}
                      {/* </PolicyHeader> */}
                      <AccordionTitleRow>
                        <ExpandedAccordionTitle
                          enrolled={isSelected}
                          title={policyDisplayTitle}
                        >
                          {policyDisplayLabel}
                        </ExpandedAccordionTitle>
                        {/* <CompulsoryBadge>
                          {isCompulsory ? "Compulsory" : "Optional"}
                        </CompulsoryBadge> */}
                      </AccordionTitleRow>
                    </BasePolicyContainer>
                  ) : null}

                  {!isExpanded && (
                    <NotEnrolledIconWrapper>
                      <AccordionTitleRowCollapsed>
                        <PolicyNameContainer >
                        <PolicyIcon gradient={policyIconData.gradient}>
                          {policyIconData.initials}
                        </PolicyIcon>
                        <AccordionTitle
                          enrolled={isSelected}
                          title={policyDisplayTitle}
                        >
                          {policyDisplayLabel}
                        </AccordionTitle>
                        {/* <CompulsoryBadge>
                          {isCompulsory ? "Compulsory" : "Optional"}
                        </CompulsoryBadge> */}
                        </PolicyNameContainer>
                      </AccordionTitleRowCollapsed>
                      {/* Not enrolled chip removed as per latest UI */}
                    </NotEnrolledIconWrapper>
                  )}
                </AccordionHeaderContent>

                <PolicySummaryContainer isExpanded={isExpanded}>
                  <PolicySummaryWrapper>
                    <PolicySummaryItem>
                      <PolicySummaryLabel>Sum Insured</PolicySummaryLabel>
                      <PolicySummaryValue>
                        {formatAmount(summarySelection?.sumInsured)}
                      </PolicySummaryValue>
                    </PolicySummaryItem>

                    {summarySelection?.showCompanyContribution !== false && (
                      <PolicySummaryItem>
                        <PolicySummaryLabel>Total Premium</PolicySummaryLabel>
                        <PolicySummaryValue>
                          {formatAmount(
                            Number(
                              summarySelection?.companyContribution ??
                                summarySelection?.companyPay ??
                                    0,
                            ) +
                              Number(
                                summarySelection?.employeeContribution ??
                                  summarySelection?.employeePay ??
                                      0,
                                  ),
                          )}
                        </PolicySummaryValue>
                      </PolicySummaryItem>
                    )}

                    {summarySelection?.showCompanyContribution !== false && (
                      <PolicySummaryItem>
                        <PolicySummaryLabel>
                          Company Contribution
                        </PolicySummaryLabel>
                        <PolicySummaryValue>
                          {formatAmount(
                            summarySelection?.companyContribution ??
                                  summarySelection?.companyPay,
                          )}
                        </PolicySummaryValue>
                      </PolicySummaryItem>
                    )}

                    <PolicySummaryItem>
                      <PolicySummaryLabel>Your Contribution</PolicySummaryLabel>
                      <PolicySummaryValue>
                        {formatAmount(
                          summarySelection?.employeeContribution ??
                                summarySelection?.employeePay,
                        )}
                      </PolicySummaryValue>
                    </PolicySummaryItem>
                    {showSelectedChip && (
                        <PolicySummaryStatusItem>
                          <SelectedStatusBadge>
                            {SELECTED}
                          </SelectedStatusBadge>
                        </PolicySummaryStatusItem>
                      )}
                  
                {/* )} */}
                  </PolicySummaryWrapper>
                </PolicySummaryContainer>
              </AccordionActionStyles>

              <AccordionAction>
                <AccordionActionColumn>
                  <AccordionActionRow>
                    <AccordionCollapsedIconStyles
                      src={AccordionExpandIcon}
                      alt="Expand"
                      expanded={isExpanded}
                    />
                  </AccordionActionRow>
                  {/* Till date removed as per latest UI */}
                </AccordionActionColumn>
              </AccordionAction>
            </AccordionContainer>
            <StyledPolicySection isExpanded={isExpanded}>
              <StyledPolicySectionContent>
                {/* Show FamilyMembersManagement for any policy that has dependent/relation support */}
                {(() => {
                    const policyWithDeps = policiesWithDependents?.[Number(policy?.policyId)];
                    const hasValidOpts = hasValidRelationshipOptions(policyWithDeps?.configuration);
                    console.log("[EnrollmentFlow] FamilyMgmt gate", { policyId: policy?.policyId, label: policy?.label, hasPolicyWithDeps: !!policyWithDeps, hasValidOpts });
                    if (!policyWithDeps || !hasValidOpts) return null;

                    const policyStatus = flattenedPolicies.find(
                      (item) => item?.policyId === policy?.policyId
                    )?.status;
                    const isPolicyReadOnly =
                      !policyStatus ||
                      (policyStatus !== PolicyStatus.CAN_ENROLL &&
                        policyStatus !== PolicyStatus.EDIT_ENROLL &&
                        policyStatus !== PolicyStatus.NOT_STARTED);

                    const selectedChoice =
                      pendingSelection ||
                      committedSelection ||
                      (getDefaultChoice(policy)
                        ? { ...getDefaultChoice(policy), group: policy.group }
                        : null);

                    // committedSelection (policyConfigurationData[index]) always carries the
                    // component IDs when the policy has been saved/enrolled.
                    // pendingSelection from a raw carousel card click loses them because
                    // card objects only have sumInsuredId/contributions. So we prefer
                    // committedSelection for IDs and fall back to selectedChoice.
                    //
                    // Final fallback to policy?.parentpolicyComponentActionTypeId / policy?.id --
                    // getDefaultChoice(policy) returns null when every SI tier for this
                    // employee's matched cohort has isAvailable:false (no priced choice
                    // configured yet), which must not also block dependent management --
                    // whether a dependent can be added to this component is independent of
                    // whether a price tier happens to be available for it. Without this
                    // fallback, typeId silently ends up undefined and every dependent-eligible
                    // relation for the component disappears along with it.
                    const parentId = committedSelection?.parentpolicyComponentActionTypeId
                      ?? selectedChoice?.parentpolicyComponentActionTypeId
                      ?? policy?.parentpolicyComponentActionTypeId;
                    const typeId = committedSelection?.policyComponentActionTypeId
                      ?? selectedChoice?.policyComponentActionTypeId
                      ?? policy?.id;
                    const policyComponentActionLabel = committedSelection?.policyComponentActionLabel
                      ?? selectedChoice?.policyComponentActionLabel ?? null;
                    const policyComponentActionType = committedSelection?.policyComponentActionType
                      ?? selectedChoice?.policyComponentActionType ?? null;
                    const loadingKey = buildPolicyComponentLoadingKey(
                      policy?.policyId,
                      parentId,
                      typeId,
                    );
                    // When acceptRelationsFromParent = true, the component automatically
                    // mirrors dependents from the parent/base policy (read-only synced).
                    // Parental-type components have their own independent eligible relations
                    // (Father/Mother/in-laws) so they must allow independent member management.
                    const isFlexWithMappedDeps =
                      policy?.acceptRelationsFromParent === true && policy?.type !== "parental";
                    const lockedDependentsFromBase: any[] = isFlexWithMappedDeps
                      ? (() => {
                          // Step 1: resolve the parent main-policy ID.
                          // Prefer the explicit parentpolicyComponentActionTypeId on the flex
                          // component; if absent, derive it from policy.group by looking up
                          // the base/parental main policy in policyOptions.
                          let resolvedFlexParentId = normalizeChoiceKey(
                            policy?.parentpolicyComponentActionTypeId,
                          );

                          if (!resolvedFlexParentId) {
                            const flexGroup = policy?.group;
                            if (flexGroup === "base") {
                              const basePrimary = policyOptions.find(
                                (p: any) => p.type === "base",
                              );
                              resolvedFlexParentId = normalizeChoiceKey(basePrimary?.id);
                            } else if (flexGroup === "parental") {
                              const parentalPrimary = policyOptions.find(
                                (p: any) => p.type === "parental",
                              );
                              resolvedFlexParentId = normalizeChoiceKey(parentalPrimary?.id);
                            }
                          }

                          const allDeps = Object.values(familyMemberDetails || {}).flat();

                          if (!resolvedFlexParentId) {
                            // Parent cannot be determined — include all enrolled deps.
                            return allDeps.filter((dep: any) => {
                              if (Array.isArray(dep?.choices) && dep.choices.length > 0) return true;
                              if (dep?.policyComponentActionTypeId) return true;
                              return false;
                            });
                          }

                          // Step 2: include only deps whose choice is for the resolved
                          // parent's MAIN component (policyComponentActionTypeId matches).
                          // This ensures Base flex components don't accidentally pull in
                          // Parental deps and vice-versa.
                          const matchesParentMain = (compId: any) =>
                            normalizeChoiceKey(compId) === resolvedFlexParentId;

                          return allDeps.filter((dep: any) => {
                            // Top-level (newly-checked UI dependents)
                            if (matchesParentMain(dep?.policyComponentActionTypeId)) return true;
                            // choices array (API-loaded dependents)
                            if (Array.isArray(dep?.choices)) {
                              return dep.choices.some((c: any) =>
                                matchesParentMain(c?.policyComponentActionTypeId),
                              );
                            }
                            return false;
                          });
                        })()
                      : [];

                    return (
                      <Box sx={{ mb: 3 }}>
                        <FamilyMembersManagement
                          relationConstraints={policyWithDeps?.configuration}
                          policyId={policy?.policyId}
                          employeeAdditionalDetails={employeeAdditionalDetailsForDependentCap}
                          familyMemberDetails={familyMemberDetails}
                          profileSuggestedDependents={profileSuggestedDependents}
                          onProfileSuggestedDepDeleted={onProfileSuggestedDepDeleted}
                          onFamilyMemberChange={onFamilyMemberChange}
                          isPolicyComponentsLoading={Boolean(
                            policyComponentLoadingByKey?.[loadingKey],
                          )}
                          isReadOnly={isFlexWithMappedDeps || isPolicyReadOnly}
                          acceptRelationsFromParent={Boolean(policy?.acceptRelationsFromParent)}
                          disableAddDependent={isFlexWithMappedDeps}
                          lockedDependents={lockedDependentsFromBase}
                          parentpolicyComponentActionTypeId={parentId}
                          policyComponentActionTypeId={typeId}
                          policyComponentActionLabel={policyComponentActionLabel}
                              policyComponentActionType={policyComponentActionType}
                          onEmployeeExclusionChange={(isExcluded) =>
                            handleEmployeeExclusionChange(
                              `${parentId}-${typeId}`,
                              isExcluded
                            )
                          }
                          isEmployeeExcluded={
                                employeeExclusionStates[`${parentId}-${typeId}`] || false
                          }
                          onPolicyComponentRemoval={handlePolicyComponentRemoval}
                        />
                      </Box>
                    );
                  })()}

                <PolicyItemsContainer isExpanded={isExpanded}>
                  <PolicyItemsTitle>{"Choose Your Plan"}</PolicyItemsTitle>
                </PolicyItemsContainer>
                <CarouselWrapper>
                  <CardsContainer isExpanded={isExpanded}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {availableChoices.map((choice) => {
                        const isSelected =
                              pendingSelection?.sumInsuredId ===
                              choice.sumInsuredId;
                        const isCardReadOnly =
                          (isReadOnly && !isSelected) || isLocked;
                        const isSingleChoice = availableChoices.length === 1;
                        const showCompanyContribution =
                          canShowCompanyContributionForPolicy(policy.policyId) &&
                          Boolean(choice.showCompanyContribution);
                        const activeTypeId = activeChoice?.policyComponentActionTypeId;
                        const activeParentTypeId = activeChoice?.parentpolicyComponentActionTypeId;
                        // Self counts toward the per-life multiplier only when "Self" is an
                        // eligible relation of THIS component (data-driven). e.g. Super Top-up
                        // lists Self → Self + deps; Parental lists only parents → deps only.
                        const componentEligibleRelations = getEligibleRelationsFromTemplate(
                          policiesWithDependents?.[Number(policy?.policyId)]?.configuration,
                          activeParentTypeId,
                          activeTypeId,
                        );
                        const isSelfEligibleForComponent = componentEligibleRelations.some(
                          (relation: any) => String(relation).trim().toLowerCase() === "self",
                        );
                        const allDepsForCount = Object.values(familyMemberDetails).flat();
                        let coveredDepCount: number;
                        if (policy?.acceptRelationsFromParent === true) {
                          // Flex component (e.g. Super Top-up): dependents are mirrored from the
                          // parent (base/parental) main policy and don't carry choices for THIS
                          // component. Count parent-enrolled deps that match its eligibleRelations.
                          let resolvedParentId = normalizeChoiceKey(
                            policy?.parentpolicyComponentActionTypeId,
                          );
                          if (!resolvedParentId) {
                            const primary = policyOptions.find(
                              (p: any) => p.type === (policy?.group === "parental" ? "parental" : "base"),
                            );
                            resolvedParentId = normalizeChoiceKey(primary?.id);
                          }
                          const eligibleLower = componentEligibleRelations.map((r: any) =>
                            String(r).trim().toLowerCase(),
                          );
                          const matchesParentMain = (compId: any) =>
                            normalizeChoiceKey(compId) === resolvedParentId;
                          coveredDepCount = allDepsForCount.filter((dep: any) => {
                            const rel = String(
                              dep?.relation ?? dep?.relationship ?? dep?.relationshipType ?? "",
                            )
                              .trim()
                              .toLowerCase();
                            if (eligibleLower.length > 0 && !eligibleLower.includes(rel)) return false;
                            if (matchesParentMain(dep?.policyComponentActionTypeId)) return true;
                            if (Array.isArray(dep?.choices)) {
                              return dep.choices.some((c: any) =>
                                matchesParentMain(c?.policyComponentActionTypeId),
                              );
                            }
                            return false;
                          }).length;
                        } else {
                          coveredDepCount = allDepsForCount.filter((dep: any) =>
                            Array.isArray(dep.choices) &&
                            dep.choices.some((c: any) =>
                              String(c.policyComponentActionTypeId) === String(activeTypeId) &&
                              String(c.parentpolicyComponentActionTypeId ?? "null") === String(activeParentTypeId ?? "null")
                            )
                          ).length;
                        }
                        const selectedMemberCount =
                          coveredDepCount +
                          (isSelfEligibleForComponent && !isEmployeeExcludedForPolicy ? 1 : 0);

                        // The backend only resolves choice.premiumBreakdown/prices
                        // against dependents already persisted, and never prorates
                        // at all, when this policy's data was fetched — a dependent
                        // added live in the browser isn't reflected there yet, and
                        // proration must apply live too. Recompute per-life,
                        // age-bucket/flat/self-only pricing (proration included)
                        // client-side using the current in-memory dependents list;
                        // fall back to the backend value whenever this doesn't
                        // apply (e.g. relationship-group/dependent-count-attribute
                        // policies, which are already correct as-is).
                        const livePremium = resolveApplyToDependentsPremiumClient(
                          {
                            policyId: policy?.policyId,
                            policyComponentActionTypeId: activeTypeId,
                            policyComponentActionType: policy?.type,
                            policyComponentActionLabel: policy?.label,
                            parentpolicyComponentActionTypeId: activeParentTypeId,
                            sumInsuredId: choice?.sumInsuredId,
                            companyContribution: choice.companyContribution,
                            employeeContribution: choice.employeeContribution,
                          },
                          allDepsForCount,
                          gmcPolicyIdsForCards,
                          policyData,
                          employeeDateOfBirth,
                          employeeEffectiveDate,
                          flattenedPolicies
                        );
                        const livePremiumBreakdown = livePremium?.breakdown;
                        const liveCompanyPay = livePremium?.companyContribution;
                        const liveEmployeePay = livePremium?.employeeContribution;

                        return (
                          <CommonPolicyCard
                            key={`${choice.sumInsuredId}-${policy.id}`}
                            sumInsured={choice?.sumInsured || "0"}
                            premiumPerFamily={(
                              (liveCompanyPay ?? choice.companyContribution) +
                              (liveEmployeePay ?? choice.employeeContribution)
                            ).toString()}
                            companyPays={(liveCompanyPay ?? choice.companyContribution).toString()}
                            myPay={(liveEmployeePay ?? choice.employeeContribution).toString()}
                            premiumPerLife={choice.premiumPerLife}
                            premiumBreakdown={livePremiumBreakdown ?? choice.premiumBreakdown}
                            sumInsuredBreakdown={choice.sumInsuredBreakdown}
                            selectedMemberCount={selectedMemberCount}
                            showCompanyContribution={showCompanyContribution}
                            state={isSelected ? CLICKED : ACTIVE}
                            onClick={() =>
                              !isLocked &&
                              handleCardSelection(
                                choice,
                                index,
                                    policy?.group || "optional",
                              )
                            }
                            isReadOnly={isCardReadOnly}
                            isSingleChoice={isSingleChoice}
                            localization={localizationData?.data}
                          />
                        );
                      })}
                    </Box>
                  </CardsContainer>
                </CarouselWrapper>

                {/* Parental 2-year lock-in acknowledgement — HIDDEN (commented out per request) */}
                {/* {!isReadOnly && showLockInNote && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.5,
                      mt: 1,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isLockInAcknowledged}
                      disabled={isLockInDisabled}
                      onChange={(event) =>
                        setLockInAcknowledged((prev) => ({
                          ...prev,
                          [lockInKey]: event.target.checked,
                        }))
                      }
                      sx={{
                        p: 0,
                        mt: "2px",
                        color: "#9E9E9E",
                        "&.Mui-checked": { color: "#093F84" },
                        "&.Mui-disabled": { color: "#9E9E9E" },
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      onClick={() => {
                        if (isLockInDisabled) return;
                        setLockInAcknowledged((prev) => ({
                          ...prev,
                          [lockInKey]: !isLockInAcknowledged,
                        }));
                      }}
                      sx={{
                        color: isLockInDisabled ? "#9E9E9E" : "#093F84",
                        cursor: isLockInDisabled ? "default" : "pointer",
                        userSelect: "none",
                      }}
                    >
                      {buildParentalLockInText(parentalLockInPeriod)}
                    </Typography>
                  </Box>
                )} */}

                {/* GPA sum-insured note + acknowledgement — HIDDEN (commented out per request) */}
                {/* {!isReadOnly && showGpaNote && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.5,
                      mt: 1,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isGpaNoteAcknowledged}
                      disabled={isGpaNoteDisabled}
                      onChange={(event) =>
                        setGpaNoteAcknowledged((prev) => ({
                          ...prev,
                          [gpaNoteKey]: event.target.checked,
                        }))
                      }
                      sx={{
                        p: 0,
                        mt: "2px",
                        color: "#9E9E9E",
                        "&.Mui-checked": { color: "#093F84" },
                        "&.Mui-disabled": { color: "#9E9E9E" },
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      onClick={() => {
                        if (isGpaNoteDisabled) return;
                        setGpaNoteAcknowledged((prev) => ({
                          ...prev,
                          [gpaNoteKey]: !isGpaNoteAcknowledged,
                        }));
                      }}
                      sx={{
                        color: isGpaNoteDisabled ? "#9E9E9E" : "#093F84",
                        cursor: isGpaNoteDisabled ? "default" : "pointer",
                        userSelect: "none",
                      }}
                    >
                      If you opt GMC 2 lacs 1+3 your GPA Sum Insured is 2 Lacs, Other than this Plan GPA SI is considered as 5 Lacs
                    </Typography>
                  </Box>
                )} */}

                {/* Buttons */}
                {!isReadOnly && (
                  <AccordionButtonsRow>
                    {(() => {
                          const selectedChoice =
                            committedSelection ||
                            getDefaultChoice(policy);
                      const policyKey = `${selectedChoice?.parentpolicyComponentActionTypeId}-${selectedChoice?.policyComponentActionTypeId}`;
                          const isEmployeeExcluded = employeeExclusionStates[policyKey] || false;
                      const policyControls = getPolicyUIControls(
                        selectedChoice?.policyComponentActionType,
                        selectedChoice?.policyComponentActionLabel,
                        policy?.group,
                        familyMemberDetails,
                        selectedChoice?.parentpolicyComponentActionTypeId,
                        selectedChoice?.policyComponentActionTypeId,
                        Boolean(committedSelection),
                        isEmployeeExcluded
                      );
                      return (
                        policyControls.showDeleteOption && (
                          <CancelButton
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCancelSelection(index);
                            }}
                            disabled={isLocked}
                          >
                            {UNSELECT}
                          </CancelButton>
                        )
                      );
                    })()}

                    {(() => {
                      const selectedChoice =
                        pendingSelection ||
                        committedSelection ||
                        (getDefaultChoice(policy)
                          ? { ...getDefaultChoice(policy), group: policy.group }
                          : null);

                      const policyKey = `${selectedChoice?.parentpolicyComponentActionTypeId}-${selectedChoice?.policyComponentActionTypeId}`;
                      const isEmployeeExcluded =
                        employeeExclusionStates[policyKey] || false;
                      const policyControls = getPolicyUIControls(
                        selectedChoice?.policyComponentActionType,
                        selectedChoice?.policyComponentActionLabel,
                        policy?.group,
                        familyMemberDetails,
                        selectedChoice?.parentpolicyComponentActionTypeId,
                        selectedChoice?.policyComponentActionTypeId,
                        Boolean(pendingSelection || committedSelection),
                        isEmployeeExcluded
                      );

                      // Keep existing enrollment-summary logic, and layer change detection on top:
                      // - Show "SELECTED" only when already enrolled and unchanged
                      // - Show "SELECT" when not enrolled or when there are unsaved changes
                      const buttonText = isCommittedAndUnchangedForCompulsoryPolicy(
                        policy,
                        index,
                      )
                        ? SELECTED
                        : SELECT;

                      // Button is always enabled (except for basic validation).
                      // When the parental lock-in note is shown, the user must
                      // acknowledge it via the checkbox before enabling Select.
                      // In the "Selected" state the button must stay clickable so it
                      // can be toggled back off, even though the enroll-path guards
                      // below would otherwise disable it.
                      const canUnselect = buttonText === SELECTED;

                      const isButtonDisabled =
                        !canUnselect &&
                        (!pendingSelection || policyControls.disableSubmit);
                        // Lock-in & GPA note acknowledgements hidden per request —
                        // gate clauses commented out so Select is not stuck disabled:
                        // (showLockInNote && !isLockInAcknowledged) ||
                        // (showGpaNote && !isGpaNoteAcknowledged);

                      const isSelected = buttonText === SELECTED;

                      return (
                        <motion.div
                          animate={{
                            borderRadius: isSelected ? "20px" : "8px",
                          }}
                          transition={{
                            duration: 0.5,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          style={{
                            display: "inline-flex",
                            overflow: "hidden",
                          }}
                        >
                          <AddPolicyButton
                            variant="contained"
                            disableElevation
                            disabled={isButtonDisabled}
                            onClick={(event) => {
                              event.stopPropagation();
                              // The CTA is a toggle for every group — compulsory,
                              // optional and flex — so a second click un-selects.
                              if (isSelected) {
                                handleUnselectSelection(index);
                                return;
                              }
                              handleEnrollSelection(index);
                            }}
                            sx={{
                              position: "relative",
                              overflow: "hidden",
                              borderRadius: "inherit",
                            }}
                          >
                            <motion.div
                              initial={{ y: 0 }}
                              animate={{
                                y: isSelected ? -50 : 0,
                                opacity: isSelected ? 0 : 1,
                              }}
                              transition={{
                                duration: 0.5,
                                ease: [0.4, 0, 0.2, 1],
                              }}
                              style={{
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              {SELECT}
                            </motion.div>
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ y: "100%", scaleY: 0 }}
                                  animate={{ y: 0, scaleY: 1 }}
                                  exit={{ y: "100%", scaleY: 0 }}
                                  transition={{
                                    duration: 0.5,
                                    ease: [0.4, 0, 0.2, 1],
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transformOrigin: "bottom",
                                    backgroundColor: "#EC6C27",
                                  }}
                                >
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      delay: 0.2,
                                      duration: 0.3,
                                      ease: [0.4, 0, 0.2, 1],
                                    }}
                                  >
                                    {SELECTED}
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </AddPolicyButton>
                        </motion.div>
                      );
                    })()}
                  </AccordionButtonsRow>
                )}
              </StyledPolicySectionContent>
            </StyledPolicySection>
          </AccordionItem>
        </AccordionWrapper>
      </React.Fragment>
    );
  };

  return (
    <EnrollmentSection>
      {isLoading ? (
        <CommonLoader fullScreen={true} />
      ) : (
        <>
      {/* {shouldShowFamilySection && (
        <FamilyMembersManagement
          relationConstraints={groupMediclaimPolicy?.configuration}
          familyMemberDetails={familyMemberDetails}
          onFamilyMemberChange={onFamilyMemberChange}
          isPolicyComponentsLoading={isPolicyComponentsLoading}
          isReadOnly={isGMCReadOnly}
          // isReadOnly={isReadOnly}
        />
      )} */}
      <CompulsoryOptionalContainer>
      {compulsoryPolicyEntries.length > 0 && (
        <SectionsContainer
          isExpanded={sectionExpanded.compulsory}
        >
          <SectionAccordionWrapper>
            <SectionAccordionHeader
              isExpanded={sectionExpanded.compulsory}
              onClick={() => toggleSection("compulsory")}
            >
              <SectionHeaderRow>
                <SheildWrapper> 
                <ShieldIconWrapper>
                  <img src={SheildIcon} alt= "Icon" />
                </ShieldIconWrapper>
                <AccordionHeaderContent>
                  <SectionSheidlTitle>Compulsory</SectionSheidlTitle>
                  <SectionSubtitle>Automatically provided to all employees</SectionSubtitle>
                </AccordionHeaderContent>
                </SheildWrapper>
                <AccordionCollapsedIconStyles
                  src={AccordionExpandIcon}
                  alt="Toggle Compulsory"
                  expanded={sectionExpanded.compulsory}
                />
              </SectionHeaderRow>
            </SectionAccordionHeader>
            <SectionAccordionContent isExpanded={sectionExpanded.compulsory}>
              <Box sx={{ 
                px: sectionExpanded.compulsory ? 3 : 0, 
                pb: sectionExpanded.compulsory ? 4 : 0,
                transition: 'padding 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {compulsoryPolicyEntries.map(renderPolicyAccordion)}
              </Box>
            </SectionAccordionContent>
          </SectionAccordionWrapper>
        </SectionsContainer>
      )}
      {optionalPolicyEntries.length > 0 && (
        <SectionsContainerForOptions
          isExpanded={sectionExpanded.optional}
        >
          <SectionAccordionWrapper>
            <SectionAccordionHeader
              isExpanded={sectionExpanded.optional}
              onClick={() => toggleSection("optional")}
            >
              <SectionHeaderRow>
              <SheildWrapper> 
                <ShieldIconWrapper>
                  <img src={OptionalIcon} alt= "Optional Icon" />
                </ShieldIconWrapper>
                <AccordionHeaderContent>
                  <SectionSheidlTitle>Optional</SectionSheidlTitle>
                  <SectionSubtitle>Choose and add optional benefits for extra protection</SectionSubtitle>
                </AccordionHeaderContent>
                </SheildWrapper>
                <AccordionCollapsedIconStyles
                  src={AccordionExpandIcon}
                  alt="Toggle Optional"
                  expanded={sectionExpanded.optional}
                />
              </SectionHeaderRow>
            </SectionAccordionHeader>
            <SectionAccordionContent isExpanded={sectionExpanded.optional}>
              <Box sx={{ 
                px: sectionExpanded.optional ? 3 : 0, 
                pb: sectionExpanded.optional ? 4 : 0,
                transition: 'padding 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {optionalPolicyEntries.map(renderPolicyAccordion)}
              </Box>
            </SectionAccordionContent>
          </SectionAccordionWrapper>
        </SectionsContainerForOptions>
      )}
            {flexPolicyEntries.length > 0 && (
        <SectionsContainerForOptions
          isExpanded={sectionExpanded.flex}
        >
          <SectionAccordionWrapper>
            <SectionAccordionHeader
              isExpanded={sectionExpanded.flex}
              onClick={() => toggleSection("flex")}
            >
              <SectionHeaderRow>
                <SheildWrapper>
                  <ShieldIconWrapper>
                    <img src={FlexIcon} alt="Flex Icon" />
                  </ShieldIconWrapper>
                  <AccordionHeaderContent>
                    <SectionSheidlTitle>Flex Benefits</SectionSheidlTitle>
                    <SectionSubtitle>Flexible benefits you can customise to your needs</SectionSubtitle>
                  </AccordionHeaderContent>
                </SheildWrapper>
                <AccordionCollapsedIconStyles
                  src={AccordionExpandIcon}
                  alt="Toggle Flex"
                  expanded={sectionExpanded.flex}
                />
              </SectionHeaderRow>
            </SectionAccordionHeader>
            <SectionAccordionContent isExpanded={sectionExpanded.flex}>
              <Box sx={{
                px: sectionExpanded.flex ? 3 : 0,
                pb: sectionExpanded.flex ? 4 : 0,
                transition: 'padding 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {flexPolicyEntries.map(renderPolicyAccordion)}
              </Box>
            </SectionAccordionContent>
          </SectionAccordionWrapper>
        </SectionsContainerForOptions>
      )}
      </CompulsoryOptionalContainer>
        </>
      )}
    </EnrollmentSection>
  );
};

export default EnrollmentFlow;
