import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { policyTypeKeys } from '../../components/WelllnessBenefitSection/constants';
import LifeEventsSteps from './LifeEventsSteps';
import { getRelationTypeForRelationship } from '../../components/Enrollment/EnrollmentFlow/utils/relationshipFilters';
import {
  ADDITION_STEP_CONFIG,
  ADDITION_LIFE_EVENTS,
  ADDITION_STEPS,
  DELETION_STEP_CONFIG,
  DELETION_LIFE_EVENTS,
  DELETION_STEPS,
  FLOW_TYPE_KEY,
  SELECTED_EVENT_KEY,
  LifeEventStepIconKey,
} from './constants';
import { LifeEventsSubmissionMeta } from './LifeEventsSuccessPage';
import {
  PageContainer,
  StepperContainer,
  ContentContainer,
  LifeEventsStepperConnector,
  LifeEventsStepperHeader,
  LifeEventsStepperIconCircle,
  LifeEventsStepperItem,
  LifeEventsStepperLabel,
  LifeEventsStepperRow,
  LifeEventsStepperSubtitle,
  LifeEventsStepperTitle,
  StepperIllustration,
} from './styles';
import { endPoints, useApiMutation, fetchEmployeePolicies, useApiQuery } from '@ui/ui-lib';
import { apiRequest } from '@ui/ui-lib/utils/apiRequest';
import { buildLifeEventAvailableChoices, buildLifeEventAvailableChoicesForPolicies, filterLifeEventPolicySourcesByRelations, getLifeEventDependentKey, policyHasCapacityForRelations } from './policyChoices';
import { setToastMessage } from '../../redux/slice';
import  AddDependentactive from '../../assets/svgs/add-dependence-active.svg';
import  AddDependentinactive from '../../assets/svgs/add-dependence-inactive.svg';
import  AddDependentcompleted from '../../assets/svgs/add-dependent-completed.svg';
import  ChooseComponentsactive from '../../assets/svgs/choose-components-active.svg';
import  ChooseComponentsinactive from '../../assets/svgs/choose-components-inactive.svg';
import  ChooseComponentscompleted from '../../assets/svgs/choose-components-completed.svg';
import reviewPremiumActive from '../../assets/svgs/review-premium-active.svg';
import reviewPremiumInactive from '../../assets/svgs/review-premium-inactive.svg';
import reviewPremiumCompleted from '../../assets/svgs/review-premium-completed.svg';
import selectReasonActive from '../../assets/svgs/select-reason-active.svg';
import selectReasonInactive from '../../assets/svgs/select-reason-inactive.svg';
import selectReasonCompleted from '../../assets/svgs/select-reason-completed.svg';
import uploadDocActive from '../../assets/svgs/upload-doc-active.svg';
import uploadDocInactive from '../../assets/svgs/upload-doc-inactive.svg';
import uploadDocCompleted from '../../assets/svgs/upload-doc-completed.svg';
import confirmationCompleted from "../../assets/svgs/confirmation-completed.svg";
import confirmationInProgress from "../../assets/svgs/confirmation-in-progress.svg";
import confirmationNotStarted from "../../assets/svgs/confirmation-not-started.svg";
import confirmRemovalActive from "../../assets/svgs/confirm-removal-active.svg";
import confirmRemovalInactive from "../../assets/svgs/confirm-removal-inactive.svg";
import confirmRemovalCompleted from "../../assets/svgs/confirm-removal-completed.svg";
import selectDependentactive from "../../assets/svgs/select-dependent-active.svg";
import selectDependentinactive from "../../assets/svgs/select-dependent-inactive.svg";
import selectDependentcompleted from "../../assets/svgs/select-dependent-completed.svg";
import ageDependentIllustration from "../../../assets/svgs/age-dependent-addition-card.svg";
import ageLimitExceedIllustration from "../../../assets/svgs/age-limit-exceed-card.svg";
import childBirthIllustration from "../../../assets/svgs/child-birth-card.svg";
import dependentDeathIllustration from "../../../assets/svgs/dependent-death-card.svg";
import divorceIllustration from "../../../assets/svgs/divorce-card.svg";
// import marriageIllustration from '../../../assets/svgs/marriage-card.svg';
import marriageIllustration from "../../../assets/svgs/marriage-image.svg";
import noLongerIllustration from "../../../assets/svgs/no-longer-card.svg";
import adoptionIllustration from "../../../assets/svgs/adoption-of-child-card.svg";
import { useQueryClient } from '@tanstack/react-query';
import CommonLoader from '../../common/CommonLoader';

type FlowType = "addition" | "deletion";

const LIFE_EVENT_ILLUSTRATIONS: Record<string, string> = {
  marriage: marriageIllustration,
  child_birth: childBirthIllustration,
  adoption: adoptionIllustration,
  age_eligibility: ageDependentIllustration,
  divorce: divorceIllustration,
  dependent_death: dependentDeathIllustration,
  age_limit_exceeded: ageLimitExceedIllustration,
  no_longer_eligible: noLongerIllustration,
};

const normalizeLifeEventRelationship = (relationshipName?: string) =>
  String(relationshipName || "")
    .toLowerCase()
    .trim();

const getLifeEventRelationshipAliases = (
  relationshipName: string
): string[] => {
  const normalized = normalizeLifeEventRelationship(relationshipName);
  if (!normalized) return [];

  if (
    ["partner", "spouse", "spouse/partner", "wife", "husband"].includes(
      normalized
    )
  ) {
    return ["partner", "spouse", "spouse/partner", "wife", "husband"];
  }

  if (["parent", "parents", "father", "mother"].includes(normalized)) {
    return ["parent", "parents", "father", "mother"];
  }

  if (["child", "children", "son", "daughter"].includes(normalized)) {
    return ["child", "children", "son", "daughter"];
  }

  return [normalized];
};

const areDependentsEqual = (left: any[] = [], right: any[] = []) =>
  JSON.stringify(left) === JSON.stringify(right);

// A policy whose coverage period has already ended can't take life events —
// there's nothing left to add/remove dependents on.
const isPolicyExpired = (dueDate: unknown): boolean => {
  if (!dueDate) return false;

  const parsedEndDate = new Date(dueDate as string);
  if (Number.isNaN(parsedEndDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsedEndDate.setHours(0, 0, 0, 0);

  return parsedEndDate.getTime() < today.getTime();
};

// Step icon SVGs for each state
const STEP_SVG_ICONS: Record<
  LifeEventStepIconKey,
  {
    inactive: React.ReactNode;
    active: React.ReactNode;
    completed: React.ReactNode;
  }
> = {
  select_reason: {
    inactive: <img src={selectReasonInactive} alt="Select Reason Inactive" />,
    active: <img src={selectReasonActive} alt="Select Reason Active" />,
    completed: (
      <img src={selectReasonCompleted} alt="Select Reason Completed" />
    ),
  },
  dependent_details: {
    inactive: (
      <img src={AddDependentinactive} alt="Dependent Details Inactive" />
    ),
    active: <img src={AddDependentactive} alt="Dependent Details Active" />,
    completed: (
      <img src={AddDependentcompleted} alt="Dependent Details Completed" />
    ),
  },
  choose_components: {
    inactive: (
      <img src={ChooseComponentsinactive} alt="Choose Components Inactive" />
    ),
    active: <img src={ChooseComponentsactive} alt="Choose Components Active" />,
    completed: (
      <img src={ChooseComponentscompleted} alt="Choose Components Completed" />
    ),
  },
  select_dependent: {
    inactive: (
      <img src={selectDependentinactive} alt="Select Dependent Inactive" />
    ),
    active: <img src={selectDependentactive} alt="Select Dependent Active" />,
    completed: (
      <img src={selectDependentcompleted} alt="Select Dependent Completed" />
    ),
  },
  review_premium: {
    inactive: <img src={reviewPremiumInactive} alt="Review Premium Inactive" />,
    active: <img src={reviewPremiumActive} alt="Review Premium Active" />,
    completed: (
      <img src={reviewPremiumCompleted} alt="Review Premium Completed" />
    ),
  },
  confirm_removal: {
    inactive: (
      <img src={confirmRemovalInactive} alt="Confirm Removal Inactive" />
    ),
    active: <img src={confirmRemovalActive} alt="Confirm Removal Active" />,
    completed: (
      <img src={confirmRemovalCompleted} alt="Confirm Removal Completed" />
    ),
  },
  upload_documents: {
    inactive: <img src={uploadDocInactive} alt="Upload Documents Inactive" />,
    active: <img src={uploadDocActive} alt="Upload Documents Active" />,
    completed: (
      <img src={uploadDocCompleted} alt="Upload Documents Completed" />
    ),
  },
  confirmation: {
    inactive: (
      <img src={confirmationNotStarted} alt="Confirmation Not Started" />
    ),
    active: <img src={confirmationInProgress} alt="Confirmation In Progress" />,
    completed: <img src={confirmationCompleted} alt="Confirmation Completed" />,
  },
};

const normalizeCombinedChoiceEntry = (choice: any) => ({
  id: Number.parseInt(choice.id, 10),
  sumInsured: Number(choice.sumInsured ?? 0),
  premium: Number(choice.premium ?? 0),
  companyPay: Number(choice.companyPay ?? 0),
  employeePay: Number(choice.employeePay ?? 0),
  parentpolicyComponentActionTypeId:
    choice.parentpolicyComponentActionTypeId ?? null,
  policyComponentActionType: choice.policyComponentActionType,
  policyComponentActionTypeId: choice.policyComponentActionTypeId,
  policyComponentActionLabel: choice.policyComponentActionLabel,
});

const buildLifeEventDependentMergeKey = (dependent: any) =>
  [
    String(dependent?.name ?? "")
      .trim()
      .toLowerCase(),
    String(dependent?.relationship ?? dependent?.relation ?? "")
      .trim()
      .toLowerCase(),
    String(dependent?.dateOfBirth ?? dependent?.dob ?? "")
      .trim()
      .toLowerCase(),
  ].join("|");

const buildLifeEventChoiceKey = (choice: any) =>
  [
    String(choice?.policyComponentActionTypeId ?? "none"),
    String(choice?.policyComponentActionType ?? "none"),
    String(choice?.parentpolicyComponentActionTypeId ?? "none"),
    String(choice?.policyComponentActionLabel ?? "none"),
    String(choice?.sourcePolicyId ?? choice?.policyId ?? "none"),
  ].join("|");

const buildPolicyLocalSelectionGroupKey = (choice: any) =>
  [
    String(choice?.parentpolicyComponentActionTypeId ?? "root"),
    String(choice?.policyComponentActionTypeId ?? "0"),
  ].join("|");

const buildChoiceBucketSignature = (choices: any[] = []) =>
  JSON.stringify(
    (choices || [])
      .map((choice: any) => ({
        sumInsuredId:
          choice?.sumInsuredId !== undefined && choice?.sumInsuredId !== null
            ? Number(choice.sumInsuredId)
            : null,
        sumInsured: String(choice?.sumInsured ?? ""),
        premium: Number(choice?.premium ?? 0),
        companyContribution: Number(
          choice?.companyContribution ?? choice?.companyPay ?? 0
        ),
        employeeContribution: Number(
          choice?.employeeContribution ?? choice?.employeePay ?? 0
        ),
      }))
      .sort((a: any, b: any) => {
        const ak = [
          String(a.sumInsuredId ?? "none"),
          String(a.sumInsured),
          String(a.premium),
          String(a.companyContribution),
          String(a.employeeContribution),
        ].join("|");
        const bk = [
          String(b.sumInsuredId ?? "none"),
          String(b.sumInsured),
          String(b.premium),
          String(b.companyContribution),
          String(b.employeeContribution),
        ].join("|");
        return ak.localeCompare(bk);
      })
  );

const getChangedSelectionGroupKeys = (
  originalPolicyComponentsConfiguration: any,
  refreshedPolicyComponentsConfiguration: any
) => {
  const originalPolicies = generatePolicyStructureForSingleEnrollment(
    originalPolicyComponentsConfiguration
  );
  const refreshedPolicies = generatePolicyStructureForSingleEnrollment(
    refreshedPolicyComponentsConfiguration
  );

  const originalByGroup = new Map<string, string>();
  originalPolicies.forEach((policy: any) => {
    const groupKey = buildPolicyLocalSelectionGroupKey({
      parentpolicyComponentActionTypeId:
        policy?.parentpolicyComponentActionTypeId ?? null,
      policyComponentActionTypeId: policy?.id ?? null,
    });
    originalByGroup.set(groupKey, buildChoiceBucketSignature(policy?.choices));
  });

  const refreshedByGroup = new Map<string, string>();
  refreshedPolicies.forEach((policy: any) => {
    const groupKey = buildPolicyLocalSelectionGroupKey({
      parentpolicyComponentActionTypeId:
        policy?.parentpolicyComponentActionTypeId ?? null,
      policyComponentActionTypeId: policy?.id ?? null,
    });
    refreshedByGroup.set(groupKey, buildChoiceBucketSignature(policy?.choices));
  });

  const allGroupKeys = new Set<string>([
    ...Array.from(originalByGroup.keys()),
    ...Array.from(refreshedByGroup.keys()),
  ]);

  return Array.from(allGroupKeys).filter(
    (groupKey) =>
      originalByGroup.get(groupKey) !== refreshedByGroup.get(groupKey)
  );
};

const mergeLifeEventDependents = (dependents: any[] = []) => {
  const merged = new Map<string, any>();

  dependents.forEach((dependent: any) => {
    if (!dependent) return;
    const key = buildLifeEventDependentMergeKey(dependent);
    const existing = merged.get(key);
    const sourceChoices = Array.isArray(dependent?.choices)
      ? dependent.choices
      : [];
    const annotatedChoices = sourceChoices.map((choice: any) => ({
      ...choice,
      sourcePolicyId:
        choice?.sourcePolicyId ?? dependent?.sourcePolicyId ?? null,
      sourcePolicyName:
        choice?.sourcePolicyName ?? dependent?.sourcePolicyName ?? null,
      sourcePolicyTypeKey:
        choice?.sourcePolicyTypeKey ?? dependent?.sourcePolicyTypeKey ?? null,
      sourcePolicyScopeKey:
        choice?.sourcePolicyScopeKey ?? dependent?.sourcePolicyScopeKey ?? null,
    }));

    const mergedChoices = Array.from(
      new Map(
        [
          ...(Array.isArray(existing?.choices) ? existing.choices : []),
          ...annotatedChoices,
        ].map((choice: any) => [buildLifeEventChoiceKey(choice), choice])
      ).values()
    );

    const mergedDocumentIds = Array.from(
      new Set(
        [
          ...(Array.isArray(existing?.documentIds) ? existing.documentIds : []),
          ...(Array.isArray(dependent?.documentIds)
            ? dependent.documentIds
            : []),
        ]
          .map((id: number | string) => Number(id))
          .filter((id: number) => Number.isFinite(id))
      )
    );

    merged.set(key, {
      ...(existing || {}),
      ...dependent,
      id: existing?.id ?? dependent?.id ?? null,
      entries: Array.isArray(existing?.entries)
        ? [...existing.entries, ...(dependent?.entries || [dependent])]
        : dependent?.entries || [dependent],
      choices: mergedChoices,
      documentIds: mergedDocumentIds,
    });
  });

  return Array.from(merged.values());
};

const LifeEvents: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get flow type from session storage
  const [flowType] = useState<FlowType>(() => {
    const savedFlowType = sessionStorage.getItem(FLOW_TYPE_KEY) as FlowType;
    return savedFlowType || "addition";
  });
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const queryClient = useQueryClient();

  const initialSelectedLifeEvent = sessionStorage.getItem(SELECTED_EVENT_KEY);

  const [activeStep, setActiveStep] = useState<number>(() => {
    if (flowType === "addition" && initialSelectedLifeEvent) {
      return 1;
    }
    return 0;
  });

  const [selectedLifeEvent, setSelectedLifeEvent] = useState<string | null>(
    () => initialSelectedLifeEvent
  );

  const [availableLifeEvents, setAvailableLifeEvents] = useState<
    typeof ADDITION_LIFE_EVENTS
  >([]);
  const [dependentsData, setDependentsData] = useState<any[]>([]);

  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([]);
  const [selectedDependentKeysByGroup, setSelectedDependentKeysByGroup] =
    useState<Record<string, string[]>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  const [submissionMeta, setSubmissionMeta] =
    useState<LifeEventsSubmissionMeta | null>(null);

  const pendingSubmissionMetaRef = useRef<LifeEventsSubmissionMeta | null>(
    null
  );
  const activityLoggedRef = useRef(false);
  const [refreshedPolicyConfigs, setRefreshedPolicyConfigs] = useState<
    Record<
      string,
      {
        policyComponentsConfiguration: any;
        employeeChosenChoices: any[];
        bucketChangedSelectionGroupKeys: string[];
      }
    >
  >({});
  const lastRelGroupPayloadRef = useRef<Record<string, string>>({});

  const clearDraftSelectionState = useCallback(() => {
    setDependentsData([]);
    setSelectedChoiceIds([]);
    setSelectedDependentKeysByGroup({});
    setUploadedDocuments([]);
  }, []);

  // Get current steps and events based on flow type
  const currentSteps =
    flowType === "addition" ? ADDITION_STEPS : DELETION_STEPS;
  const currentStepConfig =
    flowType === "addition" ? ADDITION_STEP_CONFIG : DELETION_STEP_CONFIG;
  const currentEvents =
    flowType === "addition" ? ADDITION_LIFE_EVENTS : DELETION_LIFE_EVENTS;

  // Get data from Redux store
  const relationConstraints = useSelector(
    (state: any) => state.policyData.relationDependentData
  );
  const policiesData = useSelector(
    (state: any) => state.policyData.policiesData
  );
  const isLoading = useSelector((state: any) => state.policyData.loading);

  const lifeEventPolicySources = useMemo<LifeEventPolicySource[]>(() => {
    if (!Array.isArray(relationConstraints)) {
      return [];
    }

    const employeePolicies = policiesData?.employeePolicies ?? [];
    const enrolledPolicies = policiesData?.enrolledPolicies ?? [];
    const editabilityMap = new Map<string, boolean | null>();
    const dueDateMap = new Map<string, string | null>();
    [...employeePolicies, ...enrolledPolicies].forEach((policy: any) => {
      if (policy?.policyId != null) {
        editabilityMap.set(String(policy.policyId), policy?.isEditable ?? null);
        dueDateMap.set(String(policy.policyId), policy?.dueDate ?? null);
      }
    });

    return relationConstraints
      .filter((policy: any) => {
        const policyId = policy?.policyId;
        const isEditable =
          policyId != null
            ? editabilityMap.get(String(policyId))
            : policy?.isEditable ?? null;
        if (isEditable !== false) return false;

        const dueDate = policyId != null ? dueDateMap.get(String(policyId)) : null;
        return !isPolicyExpired(dueDate);
      })
      .filter((policy: any) =>
        Boolean(
          policy?.configuration?.policyComponentsConfiguration ||
            policy?.configuration?.policyTemplate ||
            policy?.configuration?.relationships
        )
      );
  }, [relationConstraints, policiesData]);

  const policyEditabilityById = useMemo(() => {
    const editabilityMap = new Map<string, boolean | null>();
    const employeePolicies = policiesData?.employeePolicies ?? [];
    const enrolledPolicies = policiesData?.enrolledPolicies ?? [];

    [...employeePolicies, ...enrolledPolicies].forEach((policy: any) => {
      if (policy?.policyId == null) return;
      editabilityMap.set(String(policy.policyId), policy?.isEditable ?? null);
    });

    return editabilityMap;
  }, [policiesData]);

  const policyDueDateById = useMemo(() => {
    const dueDateMap = new Map<string, string | null>();
    const employeePolicies = policiesData?.employeePolicies ?? [];
    const enrolledPolicies = policiesData?.enrolledPolicies ?? [];

    [...employeePolicies, ...enrolledPolicies].forEach((policy: any) => {
      if (policy?.policyId == null) return;
      dueDateMap.set(String(policy.policyId), policy?.dueDate ?? null);
    });

    return dueDateMap;
  }, [policiesData]);

  const lifeEventChoicePolicySources = useMemo<LifeEventPolicySource[]>(() => {
    if (!Array.isArray(relationConstraints)) {
      return [];
    }

    return relationConstraints
      .map((policy: any) => {
        const policyId = policy?.policyId;
        const sourceIsEditable =
          policyId != null
            ? policyEditabilityById.get(String(policyId))
            : policy?.isEditable ?? null;

        return {
          ...policy,
          isEditable: sourceIsEditable,
        };
      })
      .filter((policy: any) => policy?.isEditable === false)
      .filter((policy: any) => {
        const policyId = policy?.policyId;
        const dueDate =
          policyId != null ? policyDueDateById.get(String(policyId)) : null;
        return !isPolicyExpired(dueDate);
      })
      .filter((policy: any) =>
        Boolean(
          policy?.configuration?.policyComponentsConfiguration ||
            policy?.configuration?.policyTemplate ||
            policy?.configuration?.relationships
        )
      );
  }, [relationConstraints, policyEditabilityById, policyDueDateById]);

  const effectiveLifeEventChoicePolicySources = useMemo<
    LifeEventPolicySource[]
  >(
    () =>
      lifeEventChoicePolicySources.map((policy: any) => {
        const policyIdKey = String(policy?.policyId ?? "");
        if (!policyIdKey) return policy;
        const refreshed = refreshedPolicyConfigs[policyIdKey];
        if (!refreshed) return policy;
        return {
          ...policy,
          configuration: {
            ...policy.configuration,
            policyComponentsConfiguration:
              refreshed.policyComponentsConfiguration ??
              policy.configuration?.policyComponentsConfiguration,
            employeeChosenChoices:
              refreshed.employeeChosenChoices ??
              policy.configuration?.employeeChosenChoices,
            bucketChangedSelectionGroupKeys:
              refreshed.bucketChangedSelectionGroupKeys ?? [],
          },
        };
      }),
    [lifeEventChoicePolicySources, refreshedPolicyConfigs]
  );

  const relationshipGroupPolicies = useMemo(
    () =>
      lifeEventChoicePolicySources.filter(
        (policy: any) => policy?.configuration?.isRelationshipGroup === true
      ),
    [lifeEventChoicePolicySources]
  );

  const lifeEventDisplayPolicySources = useMemo<LifeEventPolicySource[]>(() => {
    const uniquePolicies = new Map<string, LifeEventPolicySource>();

    lifeEventChoicePolicySources.forEach((policy) => {
      const policyKey = String(policy?.policyTypeKey ?? "")
        .trim()
        .toLowerCase();
      const policyNameKey = String(policy?.policyName ?? "")
        .trim()
        .toLowerCase();
      const displayKey = `${policyKey}|${policyNameKey}`;

      if (!policyKey && !policyNameKey) {
        return;
      }
      if (uniquePolicies.has(displayKey)) {
        return;
      }

      uniquePolicies.set(displayKey, policy);
    });

    return Array.from(uniquePolicies.values());
  }, [lifeEventChoicePolicySources]);

  // Keep a GMC reference for the legacy pieces that still depend on it.
  const gmcPolicyData = useMemo(() => {
    if (!lifeEventChoicePolicySources.length) {
      return null;
    }
    return lifeEventChoicePolicySources.find((policy: any) =>
      policy.policyTypeKey?.includes("POLICY_TYPE_GMC")
    );
  }, [lifeEventChoicePolicySources]);

  const { data: employeeDetailsResponse } = useApiQuery({
    queryKey: ["employeeDetails", user?.id],
    url: user?.id ? endPoints.employeeDetails : "",
    enabled: Boolean(user?.id),
  });

  const employeeGender = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    const details = payload?.data?.data ?? payload?.data ?? null;
    const g = details?.gender;
    const raw = (typeof g === "string" ? g : (g?.key ?? g?.value ?? "")).toLowerCase().trim();
    if (raw === "gender_type_male" || raw === "m" || raw === "male") return "male";
    if (raw === "gender_type_female" || raw === "f" || raw === "female") return "female";

    // Fallback: check additionalDetails when primary gender field is absent/unrecognised
    const additionalDetails = details?.additionalDetails || {};
    const additionalGender = String(
      additionalDetails?.Gender ??
      additionalDetails?.gender ??
      additionalDetails?.["Employee Gender"] ??
      ""
    ).toLowerCase().trim();
    if (additionalGender === "male" || additionalGender === "m") return "male";
    if (additionalGender === "female" || additionalGender === "f") return "female";

    return "male";
  }, [employeeDetailsResponse]);

  const selectedLifeEventData = useMemo(
    () =>
      selectedLifeEvent
        ? availableLifeEvents.find((event) => event.id === selectedLifeEvent) ||
          null
        : null,
    [availableLifeEvents, selectedLifeEvent]
  );

  const selectedLifeEventRelationNames = useMemo(() => {
    const selectedDependentsRelations = (dependentsData || [])
      .map(
        (dependent: any) => dependent?.relationship || dependent?.relation || ""
      )
      .filter(Boolean);
    const relationNames =
      selectedDependentsRelations.length > 0
        ? selectedDependentsRelations
        : selectedLifeEventData?.requiredRelationships || [];

    return Array.from(
      new Set(
        relationNames
          .map((relation) => normalizeLifeEventRelationship(relation))
          .filter(Boolean)
      )
    );
  }, [dependentsData, selectedLifeEventData]);

  const eligibleLifeEventPolicySources = useMemo(() => {
    if (flowType !== "addition") {
      return effectiveLifeEventChoicePolicySources;
    }

    return filterLifeEventPolicySourcesByRelations(
      effectiveLifeEventChoicePolicySources,
      selectedLifeEventRelationNames
    );
  }, [
    flowType,
    effectiveLifeEventChoicePolicySources,
    selectedLifeEventRelationNames,
  ]);

  const lifeEventPolicySourcesForFlow =
    flowType === "addition"
      ? eligibleLifeEventPolicySources
      : lifeEventDisplayPolicySources;

  const normalizationChoices = useMemo(
    () =>
      buildLifeEventAvailableChoicesForPolicies(
        lifeEventPolicySourcesForFlow,
        selectedLifeEventRelationNames
      ),
    [lifeEventPolicySourcesForFlow, selectedLifeEventRelationNames]
  );

  const normalizeSelectedChoiceIds = useCallback(
    (nextChoiceIds: string[]) => {
      const lastChoiceByGroup = new Map<string, string>();

      nextChoiceIds.forEach((choiceId) => {
        const choice = normalizationChoices.find(
          (entry) => entry.id === choiceId
        );
        if (!choice) {
          lastChoiceByGroup.set(choiceId, choiceId);
          return;
        }
        lastChoiceByGroup.set(choice.selectionGroupKey, choice.id);
      });

      return Array.from(lastChoiceByGroup.values());
    },
    [normalizationChoices]
  );

  useEffect(() => {
    sessionStorage.setItem(FLOW_TYPE_KEY, flowType);
  }, [flowType]);

  const mergedLifeEventRelationships = useMemo(() => {
    if (!lifeEventPolicySources.length) {
      return null;
    }

    const relationMap = new Map<string, any>();

    lifeEventPolicySources.forEach((policy: any) => {
      const enabledPolicyRelations =
        policy?.configuration?.relationships?.enabledPolicyRelations || [];

      enabledPolicyRelations.forEach((relation: any) => {
        const relationType = String(relation?.type || "")
          .toLowerCase()
          .trim();
        if (!relationType) return;

        const existing = relationMap.get(relationType);
        if (!existing) {
          relationMap.set(relationType, {
            ...relation,
            enabled: relation?.enabled !== false,
            maxCount: relation?.maxCount ?? null,
          });
          return;
        }

        const currentMax = Number.parseInt(existing?.maxCount, 10);
        const incomingMax = Number.parseInt(relation?.maxCount, 10);
        const mergedMax =
          Number.isFinite(currentMax) && Number.isFinite(incomingMax)
            ? Math.max(currentMax, incomingMax)
            : existing?.maxCount ?? relation?.maxCount ?? null;

        relationMap.set(relationType, {
          ...existing,
          ...relation,
          enabled: existing?.enabled !== false || relation?.enabled !== false,
          maxCount: mergedMax,
        });
      });
    });

    return {
      enabledPolicyRelations: Array.from(relationMap.values()),
    };
  }, [lifeEventPolicySources]);

  // Filter available life events based on GMC policy enabled relationships
  useEffect(() => {
    if (!mergedLifeEventRelationships) {
      setAvailableLifeEvents([]);
      return;
    }

    // Given a relationship name like "wife"/"husband"/"spouse"/"daughter",
    // find the matching enabledPolicyRelations entry (the "relation group") that:
    // - either matches the group type itself (e.g. "children")
    // - or matches one of its configuredOptions by name (e.g. "wife")
    const resolveRelationForRelationshipName = (relationshipName: string) => {
      if (!relationshipName || typeof relationshipName !== "string")
        return null;

      const enabledPolicyRelations =
        mergedLifeEventRelationships.enabledPolicyRelations || [];
      const relationType = getRelationTypeForRelationship(
        mergedLifeEventRelationships,
        relationshipName
      );
      if (!relationType) {
        const requestedAliases =
          getLifeEventRelationshipAliases(relationshipName);
        return (
          enabledPolicyRelations.find((relation: any) => {
            if (!relation?.enabled) return false;

            const relationAliases = getLifeEventRelationshipAliases(
              relation?.type || ""
            );
            if (
              relationAliases.some((alias) => requestedAliases.includes(alias))
            ) {
              return true;
            }

            const configuredOptions = Array.isArray(relation?.configuredOptions)
              ? relation.configuredOptions
              : [];

            return configuredOptions.some((option: any) =>
              getLifeEventRelationshipAliases(option?.name || "").some(
                (alias) => requestedAliases.includes(alias)
              )
            );
          }) || null
        );
      }

      return (
        enabledPolicyRelations.find(
          (relation: any) =>
            relation?.enabled &&
            typeof relation?.type === "string" &&
            relation.type.toLowerCase().trim() ===
              relationType.toLowerCase().trim()
        ) || null
      );
    };

    const getPolicyUsedCountForRelation = (policy: any, relation: any) => {
      const relationType = relation?.type || "";
      if (!relationType) return 0;

      const relationAliases = getLifeEventRelationshipAliases(relationType);
      const existingDependents = policy?.configuration?.dependents || [];
      if (!Array.isArray(existingDependents) || relationAliases.length === 0) {
        return 0;
      }

      return existingDependents.reduce((count: number, dep: any) => {
        const dependentRelationName =
          dep?.relationshipType || dep?.relationship || dep?.relation || "";
        if (!dependentRelationName) return count;

        const dependentType =
          getRelationTypeForRelationship(policy, dependentRelationName) ||
          dependentRelationName;
        const dependentAliases = getLifeEventRelationshipAliases(dependentType);
        const matches = dependentAliases.some((alias) =>
          relationAliases.includes(alias)
        );
        return matches ? count + 1 : count;
      }, 0);
    };

    // For addition flow: maxCount gating
    // Example: spouse maxCount = 1 and spouse already exists => false (cannot add more)
    const hasCapacityForRelationship = (relationshipName: string) =>
      lifeEventPolicySources.some((policy: any) =>
        policyHasCapacityForRelations(policy, relationshipName)
      );

    // For deletion flow: only show life events if there is at least one
    // enrolled dependent for the required relationship type.
    const hasAnyForRelationship = (relationshipName: string) =>
      lifeEventPolicySources.some((policy: any) => {
        const relation = resolveRelationForRelationshipName(relationshipName);
        if (!relation?.type) return false;

        return getPolicyUsedCountForRelation(policy, relation) > 0;
      });

    // Filter life events based on current flow rules:
    // - Addition: show only if relationship is enabled AND hasCapacityForRelationship()
    // - Deletion: show only if relationship is enabled AND hasAnyForRelationship()
    const filteredEvents = currentEvents.filter((event) => {
      return event.requiredRelationships.some((relationship: string) => {
        const relation = resolveRelationForRelationshipName(relationship);
        if (!relation) return false;

        if (flowType === "addition") {
          return hasCapacityForRelationship(relationship);
        }

        if (flowType === "deletion") {
          return hasAnyForRelationship(relationship);
        }

        return true;
      });
    });

    console.log("🎯 Available life events for", flowType, ":", filteredEvents);
    setAvailableLifeEvents(filteredEvents);
  }, [mergedLifeEventRelationships, gmcPolicyData, flowType, currentEvents]);

  const handleLifeEventSelect = (eventId: string) => {
    setSelectedLifeEvent(eventId);
    sessionStorage.setItem(SELECTED_EVENT_KEY, eventId);
    if (selectedLifeEvent && selectedLifeEvent !== eventId) {
      setSelectedChoiceIds([]);
      setSelectedDependentKeysByGroup({});
    }
  };

  const handleDependentsChange = useCallback((dependents: any[]) => {
    console.log("🔄 Updating dependents data:", dependents);
    setDependentsData((prev) => {
      const normalizedDependents = mergeLifeEventDependents(dependents);
      if (areDependentsEqual(prev, normalizedDependents)) {
        return prev;
      }
      setSelectedDependentKeysByGroup({});
      // Clear the ref so the choices screen re-triggers a fresh baseline API call
      lastRelGroupPayloadRef.current = {};
      return normalizedDependents;
    });
  }, []);

  const handleSelectedChoiceIdsChange = (nextChoiceIds: string[]) => {
    console.log("🧾 Updating selected choice IDs:", nextChoiceIds);
    setSelectedChoiceIds(normalizeSelectedChoiceIds(nextChoiceIds));
  };

  const handleSelectedDependentKeysByGroupChange = useCallback(
    (nextSelection: Record<string, string[]>) => {
      setSelectedDependentKeysByGroup((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(nextSelection)) {
          return prev;
        }
        return nextSelection;
      });
    },
    []
  );

  const getSelectedLifeEventData = () => {
    return selectedLifeEvent
      ? availableLifeEvents.find((event) => event.id === selectedLifeEvent)
      : null;
  };

  const prepareDeletionPayload = () => {
    console.log("Preparing gmcPolicyData:", gmcPolicyData);
    const existingDependents = (
      effectiveLifeEventChoicePolicySources || []
    ).flatMap((policy: any) => policy?.configuration?.dependents || []);

    const getProofDocumentIdsForDependent = (dependentId: number) => {
      const depDocIds = (uploadedDocuments || [])
        .filter((doc: any) => Number(doc?.dependentId) === Number(dependentId))
        .map((doc: any) => Number(doc?.id))
        .filter((id: number) => Number.isFinite(id));
      if (depDocIds.length) return depDocIds;
      return (uploadedDocuments || [])
        .map((document: any) => Number(document.id))
        .filter((id: number) => Number.isFinite(id));
    };

    // Fingerprint-based matching: a dependent may exist across multiple policies
    // with different IDs — match by name + relation + gender to mark all copies.
    const getDepFingerprint = (dep: any) =>
      [
        String(dep?.name ?? "").trim().toLowerCase(),
        String(
          dep?.relationshipType ?? dep?.relation ?? dep?.relationship ?? ""
        )
          .trim()
          .toLowerCase(),
        String(dep?.gender ?? "").trim().toLowerCase(),
      ].join("|");

    const selectedFingerprints = new Set<string>(
      (dependentsData || []).map((dep: any) => getDepFingerprint(dep))
    );

    // Build a map of fingerprint → document IDs from the selected dependents.
    const fingerprintToDocIds = new Map<string, number[]>();
    (dependentsData || []).forEach((dep: any) => {
      const fp = getDepFingerprint(dep);
      if (!fingerprintToDocIds.has(fp)) {
        fingerprintToDocIds.set(
          fp,
          getProofDocumentIdsForDependent(Number(dep.id))
        );
      }
    });

    // Deletion flow: send ONLY the dependents being removed. Other enrolled
    // dependents are left untouched. Each entry is tagged DELETE and stripped
    // of frontend-only fields the backend DTO rejects (forbidNonWhitelisted) —
    // notably `isEnrolledForPolicy`, which otherwise triggers a 400 the gateway
    // surfaces as a 502 "Http Exception".
    const dependentsForSubmitRaw = existingDependents
      .filter((dependent: any) =>
        selectedFingerprints.has(getDepFingerprint(dependent))
      )
      .map((dependent: any) => {
        const fingerprint = getDepFingerprint(dependent);
        const {
          documentIds: _documentIds,
          isEnrolledForPolicy: _isEnrolledForPolicy,
          tempKey: _tempKey,
          relationship: _relationship,
          isNewlyAdded: _isNewlyAdded,
          entries: _entries,
          ...rest
        } = dependent || {};
        return {
          ...rest,
          id: dependent.id,
          lifeEventAction: "DELETE",
          documentIds:
            fingerprintToDocIds.get(fingerprint) ??
            getProofDocumentIdsForDependent(Number(dependent.id)),
        };
      });

    // The same dependent row can appear under multiple policy sources
    // (GMC/GTL/GPA), so this yields duplicate DELETE entries with the same id,
    // which the backend rejects ("delete dependents must include a valid id").
    // Dedupe by id.
    const seenDependentIds = new Set<number>();
    const dependentsForSubmit = dependentsForSubmitRaw.filter((dependent: any) => {
      const dependentId = Number(dependent?.id);
      if (!Number.isFinite(dependentId)) return true;
      if (seenDependentIds.has(dependentId)) return false;
      seenDependentIds.add(dependentId);
      return true;
    });
    const employeeChoices = (
      effectiveLifeEventChoicePolicySources || []
    ).flatMap(
      (policy: any) => policy?.configuration?.employeeChosenChoices || []
    );
    console.log("🗑️ Employee chosen choices:", employeeChoices);

    const cleanedCombinedChoices = (
      effectiveLifeEventChoicePolicySources || []
    ).map((policy: any) => ({
      policyId: Number(policy?.policyId),
      policyName: policy?.policyName,
      choices: (policy?.configuration?.employeeChosenChoices || []).map(
        normalizeCombinedChoiceEntry
      ),
    }));

    return {
      employeeId: Number.parseInt(user?.id, 10),
      companyId: Number.parseInt(user?.companyId, 10),
      action: "submit", // or "submit" based on your flow
      isLifeEvent: true,
      dependents: dependentsForSubmit,
      combinedChoices: cleanedCombinedChoices,
    };
  };

  const prepareAdditionPayload = () => {
    const existingDependents = (
      effectiveLifeEventChoicePolicySources || []
    ).flatMap((policy: any) => policy?.configuration?.dependents || []);
    const availableChoices = buildLifeEventAvailableChoicesForPolicies(
      effectiveLifeEventChoicePolicySources,
      (dependentsData || [])
        .map(
          (dependent: any) =>
            dependent?.relationship || dependent?.relation || ""
        )
        .filter(Boolean),
      gmcPolicyData?.configuration?.constraints?.showEmployeeContribution
    );
    const selectedObjects = availableChoices.filter((choice: any) =>
      selectedChoiceIds.includes(String(choice.id))
    );
    const selectedObjectsWithDependents = selectedObjects.filter(
      (choice: any) =>
        (selectedDependentKeysByGroup[choice.selectionGroupKey] || []).length >
        0
    );
    const selectedChoiceByGroup = new Map<string, any>();
    selectedObjectsWithDependents.forEach((choice: any) => {
      selectedChoiceByGroup.set(choice.selectionGroupKey, choice);
    });

    const buildChoiceEntry = (choice: any) => ({
      policyComponentActionTypeId: choice.policyComponentActionTypeId ?? null,
      policyComponentActionType: choice.policyComponentActionType ?? null,
      parentpolicyComponentActionTypeId:
        choice.parentpolicyComponentActionTypeId ?? null,
      policyComponentActionLabel: choice.policyComponentActionLabel ?? null,
    });

    const buildDependentFingerprint = (dependent: any) =>
      [
        String(dependent?.tempKey ?? "")
          .trim()
          .toLowerCase(),
        // String(dependent?.id ?? dependent?.dependentId ?? '')
        //   .trim()
        //   .toLowerCase(),
        String(dependent?.name ?? "")
          .trim()
          .toLowerCase(),
        String(dependent?.relationship ?? dependent?.relation ?? "")
          .trim()
          .toLowerCase(),
        String(dependent?.gender ?? "")
          .trim()
          .toLowerCase(),
        String(dependent?.dateOfBirth ?? dependent?.dob ?? "")
          .trim()
          .toLowerCase(),
      ].join("|");

    const getSelectedChoicesForDependent = (dependent: any) => {
      const dependentKey = getLifeEventDependentKey(dependent);
      const selectedChoicesForDependent = Object.entries(
        selectedDependentKeysByGroup || {}
      )
        .filter(([, dependentKeys]) =>
          (dependentKeys || []).includes(dependentKey)
        )
        .map(([groupKey]) => selectedChoiceByGroup.get(groupKey))
        .filter(Boolean);

      return selectedChoicesForDependent.map(buildChoiceEntry);
    };

    const mergedDependentsMap = new Map<string, any>();

    const upsertDependent = (dependent: any, lifeEventAction?: "ADD") => {
      if (!dependent) {
        return;
      }

      const fingerprint = buildDependentFingerprint(dependent);
      const existing = mergedDependentsMap.get(fingerprint);
      const rawChoices = Array.isArray(dependent?.choices)
        ? dependent.choices
        : [];
      const normalizedChoices = rawChoices
        .map((choice: any) => ({
          policyComponentActionTypeId:
            choice?.policyComponentActionTypeId ?? null,
          policyComponentActionType: choice?.policyComponentActionType ?? null,
          parentpolicyComponentActionTypeId:
            choice?.parentpolicyComponentActionTypeId ?? null,
          policyComponentActionLabel:
            choice?.policyComponentActionLabel ?? null,
        }))
        .filter(
          (choice: any) =>
            choice.policyComponentActionTypeId !== null ||
            choice.policyComponentActionType !== null ||
            choice.parentpolicyComponentActionTypeId !== null ||
            choice.policyComponentActionLabel !== null
        );

      const nextChoices = normalizedChoices.length > 0 ? normalizedChoices : [];
      const payloadRecord = {
        ...(existing || {}),
        ...dependent,
        id: existing?.id ?? dependent?.id ?? null,
        ...(lifeEventAction ? { lifeEventAction } : {}),
        name: dependent?.name ?? existing?.name ?? "",
        relation:
          dependent?.relation ??
          dependent?.relationship ??
          existing?.relation ??
          null,
        relationshipType:
          dependent?.relationshipType ?? existing?.relationshipType ?? null,
        dateOfBirth:
          dependent?.dateOfBirth ??
          dependent?.dob ??
          existing?.dateOfBirth ??
          "",
        gender: dependent?.gender ?? existing?.gender ?? "",
        documentIds: Array.isArray(dependent?.documentIds)
          ? dependent.documentIds.map((id: number | string) => Number(id))
          : Array.isArray(existing?.documentIds)
          ? existing.documentIds
          : uploadedDocuments.map((document: any) => Number(document.id)),
        choices: Array.from(
          new Map(
            [
              ...(Array.isArray(existing?.choices) ? existing.choices : []),
              ...nextChoices,
            ].map((choice: any) => {
              const choiceKey = [
                String(choice?.policyComponentActionTypeId ?? "null"),
                String(choice?.policyComponentActionType ?? "null"),
                String(choice?.parentpolicyComponentActionTypeId ?? "null"),
                String(choice?.policyComponentActionLabel ?? "null"),
              ].join("|");
              return [choiceKey, choice];
            })
          ).values()
        ),
      };

      mergedDependentsMap.set(fingerprint, payloadRecord);
    };

    (existingDependents || []).forEach((dependent: any) =>
      upsertDependent(dependent)
    );

    (dependentsData || []).forEach((dep: any) => {
      const dependentChoiceEntries = getSelectedChoicesForDependent(dep);
      if (dependentChoiceEntries.length === 0) {
        return;
      }
      const primaryDependentChoice = dependentChoiceEntries[0] ?? null;
      const relationshipName = dep?.relationship ?? dep?.relation ?? "";
      const relationshipType = getRelationTypeForRelationship(
        mergedLifeEventRelationships,
        relationshipName
      );

      upsertDependent(
        {
          ...dep,
          relationshipType: relationshipType || dep?.relationshipType || null,
          lifeEventAction: "ADD",
          parentpolicyComponentActionTypeId:
            primaryDependentChoice?.parentpolicyComponentActionTypeId ?? null,
          policyComponentActionTypeId:
            primaryDependentChoice?.policyComponentActionTypeId ?? null,
          policyComponentActionLabel:
            primaryDependentChoice?.policyComponentActionLabel ?? null,
          policyComponentActionType:
            primaryDependentChoice?.policyComponentActionType ?? null,
          choices: dependentChoiceEntries,
        },
        "ADD"
      );
    });

    const selectedChoiceGroupByPolicy = selectedObjectsWithDependents.reduce<
      Record<string, any[]>
    >((accumulator, choice: any) => {
      const policyKey = String(
        choice?.policyId ?? gmcPolicyData?.policyId ?? "unknown"
      );
      if (!accumulator[policyKey]) {
        accumulator[policyKey] = [];
      }
      accumulator[policyKey].push(choice);
      return accumulator;
    }, {});

    const cleanedCombinedChoices = (
      effectiveLifeEventChoicePolicySources || []
    ).map((policy: any) => {
      const policyKey = String(
        policy?.policyId ??
          policy?.policyTypeKey ??
          policy?.policyName ??
          "unknown"
      );
      const policyExistingChoices =
        policy?.configuration?.employeeChosenChoices || [];
      const policySelectedChoices =
        selectedChoiceGroupByPolicy[policyKey] || [];

      const normalizedExistingChoices = policyExistingChoices.map(
        normalizeCombinedChoiceEntry
      );
      const normalizedSelectedChoices = policySelectedChoices.map(
        (choice: any) => {
          const companyPay = Number(
            choice.companyPay ?? choice.companyContribution ?? 0
          );
          const employeePay = Number(
            choice.employeePay ?? choice.employeeContribution ?? 0
          );
          const premium = Number(choice.premium ?? companyPay + employeePay);

          return {
            id: Number.parseInt(choice.id, 10),
            sumInsured: Number(choice.sumInsured ?? 0),
            premium,
            companyPay,
            employeePay,
            parentpolicyComponentActionTypeId:
              choice.parentpolicyComponentActionTypeId ?? null,
            policyComponentActionType: choice.policyComponentActionType,
            policyComponentActionTypeId: choice.policyComponentActionTypeId,
            policyComponentActionLabel: choice.policyComponentActionLabel,
          };
        }
      );

      const mergedChoiceMap = new Map<string, any>();
      [...normalizedExistingChoices, ...normalizedSelectedChoices].forEach(
        (choice: any) => {
          const key = [
            choice.policyComponentActionTypeId ?? "none",
            choice.parentpolicyComponentActionTypeId ?? "none",
            choice.sumInsured ?? "none",
          ].join("::");
          mergedChoiceMap.set(key, choice);
        }
      );

      return {
        policyId: Number(policy?.policyId ?? 0),
        policyName: policy?.policyName ?? policy?.policyTypeKey ?? "Policy",
        choices: Array.from(mergedChoiceMap.values()),
      };
    });

    const normalizedDependentsForSubmit = Array.from(
      mergedDependentsMap.values()
    ).filter(
      (dependent) =>
        Array.isArray(dependent?.choices) && dependent.choices.length > 0
    );

    return {
      employeeId: Number.parseInt(user?.id, 10),
      companyId: Number.parseInt(user?.companyId, 10),
      action: "submit",
      isLifeEvent: true,
      dependents: normalizedDependentsForSubmit.map((dependent) => {
        const {
          documentIds: _documentIds,
          tempKey: _tempKey,
          relationship: _relationship,
          isNewlyAdded: _isNewlyAdded,
          entries: _entries,
          isEnrolledForPolicy: _isEnrolledForPolicy,
          ...rest
        } = dependent || {};
        return rest;
      }),
      combinedChoices: cleanedCombinedChoices,
    };
  };

  const getSelectedAdditionChoices = () => {
    const availableChoices = buildLifeEventAvailableChoicesForPolicies(
      effectiveLifeEventChoicePolicySources,
      (dependentsData || [])
        .map(
          (dependent: any) =>
            dependent?.relationship || dependent?.relation || ""
        )
        .filter(Boolean)
    );

    return availableChoices.filter(
      (choice: any) =>
        selectedChoiceIds.includes(String(choice.id)) &&
        (selectedDependentKeysByGroup[choice.selectionGroupKey] || []).length >
          0
    );
  };

  const getPendingSubmissionMeta = () => {
    if (flowType === "addition") {
      const currentPremium = (effectiveLifeEventChoicePolicySources || [])
        .flatMap(
          (policy: any) => policy?.configuration?.employeeChosenChoices || []
        )
        .reduce(
          (sum: number, choice: any) => sum + (Number(choice?.premium) || 0),
          0
        );
      const selectedObjects = getSelectedAdditionChoices();
      const additionalPremium = selectedObjects.reduce(
        (sum: number, choice: any) => {
          const dependentCount = (
            selectedDependentKeysByGroup[choice.selectionGroupKey] || []
          ).length;
          const basePremium =
            Number(choice.companyPay ?? choice.companyContribution ?? 0) +
            Number(choice.employeePay ?? choice.employeeContribution ?? 0);
          return sum + basePremium * Math.max(1, dependentCount);
        },
        0
      );

      return {
        requestId: null,
        submittedAt: new Date().toISOString(),
        reasonTitle: getSelectedLifeEventData()?.title ?? null,
        newAnnualPremium: currentPremium + additionalPremium,
      } as LifeEventsSubmissionMeta;
    }

    const remainingAnnualPremium = (effectiveLifeEventChoicePolicySources || [])
      .flatMap(
        (policy: any) => policy?.configuration?.employeeChosenChoices || []
      )
      .reduce(
        (sum: number, choice: any) => sum + (Number(choice?.premium) || 0),
        0
      );

    return {
      requestId: null,
      submittedAt: new Date().toISOString(),
      reasonTitle: getSelectedLifeEventData()?.title ?? null,
      newAnnualPremium: remainingAnnualPremium,
    } as LifeEventsSubmissionMeta;
  };

  const getRequestIdFromResponse = (response: any) =>
    response?.data?.requestId ??
    response?.data?.id ??
    response?.data?.referenceNumber ??
    response?.requestId ??
    response?.id ??
    response?.referenceNumber ??
    null;

  const buildChangedDependentsForNotification = (submitPayload: any) => {
    const action = flowType === "deletion" ? "DELETE" : "ADD";
    const submittedDependents = Array.isArray(submitPayload?.dependents)
      ? submitPayload.dependents
      : [];
    const changedDependents =
      flowType === "deletion"
        ? submittedDependents.filter(
            (dependent: any) =>
              String(dependent?.lifeEventAction || "").toUpperCase() ===
              "DELETE"
          )
        : submittedDependents.filter(
            (dependent: any) =>
              String(dependent?.lifeEventAction ?? "").toUpperCase() === "ADD"
          );

    return changedDependents
      .map((dependent: any) => ({
        name: dependent?.name ?? dependent?.fullName ?? "",
        relation:
          dependent?.relation ??
          dependent?.relationship ??
          dependent?.relationshipType ??
          "",
        gender: dependent?.gender ?? "",
        dateOfBirth: dependent?.dateOfBirth ?? dependent?.dob ?? "",
        action,
      }))
      .filter((dependent: any) => String(dependent.name || "").trim());
  };

  const triggerLifeEventConfirmation = (
    submitPayload: any,
    submitResponse: any,
    meta: LifeEventsSubmissionMeta | null
  ) => {
    const affectedPolicyIds = Array.from(
      new Set(
        (Array.isArray(submitPayload?.combinedChoices)
          ? submitPayload.combinedChoices
          : []
        )
          .filter((policy: any) => Array.isArray(policy?.choices) && policy.choices.length)
          .map((policy: any) => Number(policy?.policyId))
          .filter((policyId: number) => Number.isFinite(policyId))
      )
    );

    if (!affectedPolicyIds.length || !user?.id) {
      return;
    }

    const lifeEventData = getSelectedLifeEventData();
    sendLifeEventConfirmation({
      endpoint: endPoints.lifeEventConfirmation,
      method: "POST",
      data: {
        employeeId: Number.parseInt(user.id, 10),
        companyId: Number.parseInt(user.companyId, 10),
        policyIds: affectedPolicyIds,
        flowType,
        lifeEventType: selectedLifeEvent ?? undefined,
        lifeEventTitle:
          lifeEventData?.title ?? meta?.reasonTitle ?? selectedLifeEvent ?? undefined,
        changedDependents: buildChangedDependentsForNotification(submitPayload),
        referenceNumber:
          submitResponse?.data?.referenceNumber ??
          submitResponse?.referenceNumber ??
          (meta as any)?.referenceNumber ??
          meta?.requestId ??
          undefined,
        submissionCount:
          submitResponse?.data?.submissionCount ??
          submitResponse?.submissionCount ??
          (meta as any)?.submissionCount ??
          undefined,
      },
    });
  };

  const logLifeEventActivity = (
    activityKey:
      | "LIFE_EVENT_ADDITION_SUBMITTED"
      | "LIFE_EVENT_DELETION_SUBMITTED",
    requestId: string | number | null
  ) => {
    const lifeEventData = getSelectedLifeEventData();
    const dependentNames = dependentsData
      .map((dep: any) => dep?.name ?? dep?.fullName ?? "--")
      .filter(Boolean)
      .join(", ");
    const activityText =
      flowType === "addition"
        ? `Life event addition submitted: ${
            lifeEventData?.title ?? selectedLifeEvent
          }`
        : `Life event deletion submitted: ${
            lifeEventData?.title ?? selectedLifeEvent
          }`;
    logLifeEventActivityMutation({
      endpoint: endPoints.getActivityLogs,
      method: "POST",
      data: {
        activityKey,
        activityCategory: "LIFE_EVENT",
        referenceId: requestId ?? user?.id,
        referenceType: "LIFE_EVENT",
        metadata: {
          flowType,
          lifeEventType: selectedLifeEvent,
          lifeEventTitle: lifeEventData?.title ?? selectedLifeEvent,
          policyName: gmcPolicyData?.policyName ?? "--",
          dependentNames,
          activityText,
        },
      },
    });
  };

  const { mutate: sendLifeEventConfirmation } = useApiMutation({});
  const { mutate: logLifeEventActivityMutation } = useApiMutation({});

  const { mutate: refreshRelationshipGroupPolicy } = useApiMutation({
    config: {
      onSuccess: (response: any, variables: any) => {
        const requestedPolicyId = String(variables?.data?.policyId ?? "");
        const nextConfig = response?.data?.policyComponentsConfiguration;
        const nextChoices = response?.data?.enrollmentChoicesMade;
        if (requestedPolicyId && nextConfig) {
          const originalPolicy = lifeEventChoicePolicySources.find(
            (policy: any) =>
              String(policy?.policyId ?? "") === requestedPolicyId
          );
          const bucketChangedSelectionGroupKeys = getChangedSelectionGroupKeys(
            originalPolicy?.configuration?.policyComponentsConfiguration,
            nextConfig
          );

          setRefreshedPolicyConfigs((prev) => ({
            ...prev,
            [requestedPolicyId]: {
              policyComponentsConfiguration: nextConfig,
              employeeChosenChoices: Array.isArray(nextChoices)
                ? nextChoices
                : [],
              bucketChangedSelectionGroupKeys,
            },
          }));
        }
      },
      onError: (error: any) => {
        console.error(
          "Life Events: Failed to refresh relationship group policy pricing:",
          error
        );
      },
    },
  });

  const handlePendingSelectionsChange = useCallback(
    (
      allPendingSelections: Record<string, string[]>,
      changedSelectionGroupKey: string
    ) => {
      if (!relationshipGroupPolicies.length || flowType !== "addition") return;

      const policyIdFromGroup = Number(
        String(changedSelectionGroupKey ?? "").split("::")[0]
      );
      if (!Number.isFinite(policyIdFromGroup) || policyIdFromGroup <= 0) return;

      const policy = relationshipGroupPolicies.find(
        (entry: any) => Number(entry?.policyId) === policyIdFromGroup
      );
      if (!policy) return;

      const existingDependentsForPolicy: any[] =
        (policy as any)?.configuration?.dependents || [];
      const existingPayload = existingDependentsForPolicy.map((dep: any) => ({
        ...(Number.isFinite(Number(dep?.id)) && Number(dep?.id) > 0
          ? { id: Number(dep.id) }
          : {}),
        name: dep?.name ?? "",
        relation: dep?.relation ?? dep?.relationship ?? "",
        relationshipType: dep?.relationshipType ?? null,
        dateOfBirth: dep?.dateOfBirth ?? dep?.dob ?? "",
        gender: dep?.gender ?? "",
      }));

      const policyGroupPrefix = String(policyIdFromGroup) + "::";
      const checkedDependentKeysForPolicy = new Set<string>(
        Object.entries(allPendingSelections)
          .filter(([groupKey]) => groupKey.startsWith(policyGroupPrefix))
          .flatMap(([, depKeys]) => depKeys ?? [])
      );

      const selectedNewDependents = (dependentsData || []).filter((dep: any) =>
        checkedDependentKeysForPolicy.has(getLifeEventDependentKey(dep))
      );

      const newPayload = selectedNewDependents.map((dep: any) => ({
        name: dep?.name ?? "",
        relation: dep?.relation ?? dep?.relationship ?? "",
        relationshipType:
          getRelationTypeForRelationship(
            mergedLifeEventRelationships,
            dep?.relationship ?? dep?.relation ?? ""
          ) ??
          dep?.relationshipType ??
          null,
        dateOfBirth: dep?.dateOfBirth ?? dep?.dob ?? "",
        gender: dep?.gender ?? "",
      }));

      const combinedPayload = [...existingPayload, ...newPayload];
      combinedPayload.sort((a: any, b: any) => {
        const ak = [
          String(a.relation ?? "").toLowerCase(),
          String(a.relationshipType ?? "").toLowerCase(),
          String(a.dateOfBirth ?? ""),
          String(a.gender ?? "").toLowerCase(),
        ].join("|");
        const bk = [
          String(b.relation ?? "").toLowerCase(),
          String(b.relationshipType ?? "").toLowerCase(),
          String(b.dateOfBirth ?? ""),
          String(b.gender ?? "").toLowerCase(),
        ].join("|");
        return ak.localeCompare(bk);
      });

      const payloadKey = JSON.stringify(combinedPayload);
      const policyIdStr = String(policyIdFromGroup);
      if (lastRelGroupPayloadRef.current[policyIdStr] === payloadKey) return;
      lastRelGroupPayloadRef.current[policyIdStr] = payloadKey;

      // When all newly-added dependents are unchecked, revert to the original policy
      // config instead of calling the refresh API. The refresh API returns
      // enrollmentChoicesMade: [] which wipes the isDefault flags built from the
      // original enrollment data, causing the enrolled choice to appear unselected.
      if (newPayload.length === 0) {
        setRefreshedPolicyConfigs((prev) => {
          if (!prev[policyIdStr]) return prev;
          const next = { ...prev };
          delete next[policyIdStr];
          return next;
        });
        return;
      }

      refreshRelationshipGroupPolicy({
        endpoint: endPoints.policyConfigurationByDependents,
        method: "POST",
        data: {
          policyId: policyIdFromGroup,
          employeeId: Number.parseInt(user?.id, 10),
          dependents: combinedPayload,
          isModified: true,
        },
      });
    },
    [
      dependentsData,
      flowType,
      mergedLifeEventRelationships,
      refreshRelationshipGroupPolicy,
      relationshipGroupPolicies,
    ]
  );

  const { mutate: saveEnrollment, isPending } = useApiMutation({
    config: {
      onSuccess: async (response: any, variables: any) => {
        console.log("Enrollment update success");
        const nextSubmissionMeta = {
          ...(pendingSubmissionMetaRef.current || {}),
          requestId: getRequestIdFromResponse(response),
          referenceNumber:
            response?.data?.referenceNumber ??
            response?.referenceNumber ??
            pendingSubmissionMetaRef.current?.requestId ??
            null,
          submissionCount:
            response?.data?.submissionCount ??
            response?.submissionCount ??
            null,
          submittedAt:
            response?.data?.submittedAt ||
            pendingSubmissionMetaRef.current?.submittedAt ||
            new Date().toISOString(),
        };
        setSubmissionMeta(nextSubmissionMeta);
        dispatch(
          setToastMessage(
            flowType === "addition"
              ? "Dependent addition request submitted successfully."
              : "Dependent deletion request submitted successfully."
          )
        );
        clearDraftSelectionState();
        if (!activityLoggedRef.current) {
          activityLoggedRef.current = true;
          logLifeEventActivity(
            flowType === "addition"
              ? "LIFE_EVENT_ADDITION_SUBMITTED"
              : "LIFE_EVENT_DELETION_SUBMITTED",
              nextSubmissionMeta.requestId ?? null
          );
        }
        triggerLifeEventConfirmation(
          variables?.data,
          response,
          nextSubmissionMeta
        );
        // Refresh Redux policy/dependent state immediately after success.
        await dispatch(fetchEmployeePolicies());
        // Invalidate React Query caches so dashboard members/dependents update instantly.
        queryClient.invalidateQueries({ queryKey: ["employeePolicies", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["employeePolicies", user?.employeeId] });
        queryClient.invalidateQueries({ queryKey: ["employeeDetails", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["employeeDetails", user?.employeeId] });
        if (flowType === "addition") {
          setActiveStep(4);
          return;
        }
        setActiveStep((prev) => prev + 1);
      },
      onError: (error: any) => {
        console.log("Error:", error);
        dispatch(
          setToastMessage(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to submit the life event request. Please try again."
          )
        );
      },
    },
  });
  const handleNext = () => {
    console.log(
      "➡️ Next button clicked - validating current step requirements",
      activeStep
    );
    if (flowType === "addition") {
      if (activeStep === 0 && !selectedLifeEvent) return;
      // NOTE:
      // Step 1 (Dependent Details) is validated and persisted inside
      // LifeEventsDependentManagement before it calls onContinue.
      // Keeping a hard guard here can intermittently block navigation due to
      // stale parent state in the same tick (child updates dependents + invokes onContinue).
      // So we intentionally do not gate step 1 on dependentsData length here.

      if (activeStep === 3) {
        pendingSubmissionMetaRef.current = getPendingSubmissionMeta();
        const payload = prepareAdditionPayload();
        console.log("➕ Final payload for API:", payload);
        activityLoggedRef.current = false;
        saveEnrollment({
          endpoint: endPoints.updateEnrollmentData,
          method: "PUT",
          data: payload,
        });
        return;
      }

      if (activeStep < 3) {
        setActiveStep((prev) => prev + 1);
      }
      return;
    }

    // Step 0: Must select a life event
    if (activeStep === 0 && !selectedLifeEvent) {
      return;
    }

    // Step 1 (addition flow): Must have at least one dependent
    // Step 1 (deletion flow): Must select dependent to remove
    if (activeStep === 1 && dependentsData.length === 0) {
      // Step 0: Must have at least one dependent
      // if (activeStep === 0 && dependentsData.length === 0) {
      return;
    }

    if (activeStep === currentSteps.length - 1) {
      pendingSubmissionMetaRef.current = getPendingSubmissionMeta();
      const payload =
        flowType === "addition"
          ? prepareAdditionPayload()
          : prepareDeletionPayload();
      console.log(
        flowType === "addition"
          ? "➕ Final payload for API:"
          : "🗑️ Final payload for API:",
        payload
      );
      activityLoggedRef.current = false;
      saveEnrollment({
        endpoint: endPoints.updateEnrollmentData,
        method: "PUT",
        data: payload,
      });
      return;
    }

    if (activeStep === currentSteps.length - 1) {
      setActiveStep(0);
      setSelectedLifeEvent(null);
      setSubmissionMeta(null);
      pendingSubmissionMetaRef.current = null;
      clearDraftSelectionState();
      sessionStorage.removeItem(SELECTED_EVENT_KEY);
      navigate("/life-events");
      return;
    }

    // Log and navigate to next step
    if (activeStep < currentSteps.length - 1) {
      console.log("Navigating to next step:", activeStep + 1);
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      handleBackToMain();
    } else {
      if (activeStep > 0) {
        setActiveStep((prev) => prev - 1);
      }
    }
  };

  const handleBackToMain = () => {
    setActiveStep(0);
    setSelectedLifeEvent(null);
    setSubmissionMeta(null);
    pendingSubmissionMetaRef.current = null;
    clearDraftSelectionState();
    sessionStorage.removeItem(FLOW_TYPE_KEY);
    sessionStorage.removeItem(SELECTED_EVENT_KEY);
    navigate("/life-events");
  };

  const renderStepContent = () => {
    return (
      <LifeEventsSteps
        flowType={flowType}
        activeStep={activeStep}
        onNext={handleNext}
        onBack={handleBack}
        onExit={handleBackToMain}
        onReturnHome={handleBackToMain}
        isSubmitting={isPending}
        selectedLifeEvent={selectedLifeEvent}
        availableLifeEvents={availableLifeEvents}
        dependentsData={dependentsData}
        gmcPolicyRelationships={mergedLifeEventRelationships}
        gmcPolicyData={gmcPolicyData}
        lifeEventPolicySources={lifeEventPolicySourcesForFlow}
        employeeGender={employeeGender}
        onLifeEventSelect={handleLifeEventSelect}
        onDependentsChange={handleDependentsChange}
        onDependentSelection={handleDependentsChange}
        selectedChoiceIds={selectedChoiceIds}
        onSelectedChoiceIdsChange={handleSelectedChoiceIdsChange}
        selectedDependentKeysByGroup={selectedDependentKeysByGroup}
        onSelectedDependentKeysByGroupChange={
          handleSelectedDependentKeysByGroupChange
        }
        onPendingSelectionsChange={handlePendingSelectionsChange}
        uploadedDocuments={uploadedDocuments}
        onUploadedDocumentsChange={setUploadedDocuments}
        getSelectedLifeEventData={getSelectedLifeEventData}
        policyTemplate={gmcPolicyData?.configuration?.policyTemplate || null}
        submissionMeta={submissionMeta}
      />
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <CommonLoader fullScreen />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Stepper */}
      {!(
        (flowType === "addition" && activeStep === 4) ||
        (flowType === "deletion" && activeStep === 3)
      ) && (
        <StepperContainer>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: 1 }}>
              <LifeEventsStepperHeader>
                <LifeEventsStepperTitle>
                  {flowType === "addition"
                    ? `Add Dependent - ${
                        getSelectedLifeEventData()?.title || "Life Events"
                      }`
                    : `Remove Dependent - ${
                        getSelectedLifeEventData()?.title || "Life Events"
                      }`}
                </LifeEventsStepperTitle>
                <LifeEventsStepperSubtitle>
                  {flowType === "addition"
                    ? "Enter the required details to add a dependent under this life event."
                    : "Review dependent details and proceed with natural deletion request."}
                </LifeEventsStepperSubtitle>
              </LifeEventsStepperHeader>
              <LifeEventsStepperRow>
                {currentStepConfig.map((step, index) => {
                  const stepperActiveIndex =
                    flowType === "addition"
                      ? Math.max(0, activeStep - 1)
                      : activeStep;
                  let state: "inactive" | "active" | "completed";
                  if (index < stepperActiveIndex) {
                    state = "completed";
                  } else if (index === stepperActiveIndex) {
                    state = "active";
                  } else {
                    state = "inactive";
                  }

                  return (
                    <React.Fragment key={step.key}>
                      <LifeEventsStepperItem>
                        <LifeEventsStepperIconCircle state={state}>
                          {STEP_SVG_ICONS[step.key] &&
                            STEP_SVG_ICONS[step.key][state]}
                        </LifeEventsStepperIconCircle>
                        <LifeEventsStepperLabel state={state}>
                          {`${index + 1}. ${step.label}`}
                        </LifeEventsStepperLabel>
                      </LifeEventsStepperItem>
                      {index < currentStepConfig.length - 1 ? (
                        <LifeEventsStepperConnector
                          complete={index < stepperActiveIndex}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </LifeEventsStepperRow>
            </Box>
            {selectedLifeEvent &&
              LIFE_EVENT_ILLUSTRATIONS[selectedLifeEvent] &&
              !(flowType === "addition" && activeStep === 2) && (
                <StepperIllustration
                  src={LIFE_EVENT_ILLUSTRATIONS[selectedLifeEvent]}
                  alt={selectedLifeEvent}
                />
              )}
          </Box>
        </StepperContainer>
      )}

      {/* Content */}
      <ContentContainer>{renderStepContent()}</ContentContainer>
    </PageContainer>
  );
};

export default LifeEvents;
