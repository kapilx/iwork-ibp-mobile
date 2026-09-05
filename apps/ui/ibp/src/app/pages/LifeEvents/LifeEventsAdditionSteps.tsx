import React from "react";
import { Typography, CardContent } from "@mui/material";
import { useLocalization, formatAmountWithCurrency } from "@ui/ui-lib";
import LifeEventsDependentManagement from "./LifeEventsDependentManagement";
import LifeEventsChoiceSelection from "./LifeEventsChoiceSelection";
import PremiumSummary from "./PremiumSummary";
import LifeEventsSuccessPage, {
  LifeEventsSubmissionMeta,
} from "./LifeEventsSuccessPage";
import { LIFE_EVENTS } from "./constants";
import { buildLifeEventAvailableChoicesForPolicies } from "./policyChoices";
import {
  ErrorMessage,
  LifeEventCard,
  LifeEventDescription,
  RequiredDocuments,
  StepContainer,
  StepTitle,
} from "./styles";

interface AdditionStepsProps {
  activeStep: number;
  onNext: () => void;
  onBack: () => void;
  onExit?: () => void;
  onReturnHome?: () => void;
  isSubmitting?: boolean;
  selectedLifeEvent: string | null;
  availableLifeEvents: any[];
  dependentsData: any[];
  gmcPolicyRelationships: any;
  employeeGender: string;
  onLifeEventSelect: (eventId: string) => void;
  onDependentsChange: (dependents: any[]) => void;
  selectedChoiceIds: string[];
  onSelectedChoiceIdsChange: (choiceIds: string[]) => void;
  selectedDependentKeysByGroup: Record<string, string[]>;
  onSelectedDependentKeysByGroupChange: (
    selection: Record<string, string[]>
  ) => void;
  onPendingSelectionsChange?: (
    allPendingSelections: Record<string, string[]>,
    changedSelectionGroupKey: string
  ) => void;
  uploadedDocuments: any[];
  onUploadedDocumentsChange: (documents: any[]) => void;
  policyTemplate: any;
  gmcPolicyData: any;
  lifeEventPolicySources?: any[];
  submissionMeta?: LifeEventsSubmissionMeta | null;
}


const toAmount = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(
    String(value)
      .replace(/[^0-9.-]/g, "")
      .trim()
  );
  return Number.isFinite(numeric) ? numeric : 0;
};

const AdditionSteps: React.FC<AdditionStepsProps> = ({
  activeStep,
  onNext,
  onBack,
  onExit,
  onReturnHome,
  isSubmitting = false,
  selectedLifeEvent,
  availableLifeEvents,
  dependentsData,
  gmcPolicyRelationships,
  employeeGender,
  onLifeEventSelect,
  onDependentsChange,
  selectedChoiceIds,
  onSelectedChoiceIdsChange,
  selectedDependentKeysByGroup,
  onSelectedDependentKeysByGroupChange,
  onPendingSelectionsChange,
  uploadedDocuments,
  onUploadedDocumentsChange,
  policyTemplate,
  gmcPolicyData,
  lifeEventPolicySources = [],
  submissionMeta,
}) => {
  const { localizationData } = useLocalization();

  const formatCurrency = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '--';
    const numeric = Number(String(value).replace(/,/g, '').trim());
    if (Number.isNaN(numeric)) return String(value) || '--';
    return formatAmountWithCurrency(numeric, localizationData?.data, 2);
  };

  const mergedExistingDependents = React.useMemo(() => {
    const seen = new Set<string>();
    const merged: any[] = [];
    (lifeEventPolicySources || []).forEach((policy: any) => {
      (policy?.configuration?.dependents || []).forEach((dep: any) => {
        const key = [
          String(dep?.name ?? "")
            .toLowerCase()
            .trim(),
          String(dep?.relationship ?? dep?.relation ?? "")
            .toLowerCase()
            .trim(),
          String(dep?.gender ?? "")
            .toLowerCase()
            .trim(),
        ].join("|");
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(dep);
        }
      });
    });
    return merged;
  }, [lifeEventPolicySources]);

  const handleBackFromDependentManagement = () => {
    onDependentsChange([]);
    if (onExit) {
      onExit();
      return;
    }
    onBack();
  };

  const selectedRelations = Array.from(
    new Set(
      (dependentsData || [])
        .map(
          (dependent: any) => dependent.relationship || dependent.relation || ""
        )
        .filter(Boolean)
    )
  );

  const selectedRelation =
    selectedRelations.length > 0
      ? selectedRelations.join(", ")
      : selectedLifeEvent
      ? LIFE_EVENTS.find((event) => event.id === selectedLifeEvent)
          ?.requiredRelationships?.[0] || ""
      : "";

  const availableChoices = buildLifeEventAvailableChoicesForPolicies(
    lifeEventPolicySources,
    (dependentsData || [])
      .map(
        (dependent: any) => dependent?.relationship || dependent?.relation || ""
      )
      .filter(Boolean),
    gmcPolicyData?.configuration?.constraints?.showEmployeeContribution
  );

  const selectedObjects = availableChoices.filter((choice: any) =>
    selectedChoiceIds.includes(String(choice.id))
  );
  const selectedObjectsWithDependents = selectedObjects.filter(
    (choice: any) =>
      (selectedDependentKeysByGroup[choice.selectionGroupKey] || []).length > 0
  );
  const selectedDependentCountByGroup = React.useMemo(
    () =>
      Object.entries(selectedDependentKeysByGroup || {}).reduce<
        Record<string, number>
      >((accumulator, [groupKey, dependentKeys]) => {
        accumulator[groupKey] = Array.isArray(dependentKeys)
          ? dependentKeys.length
          : 0;
        return accumulator;
      }, {}),
    [selectedDependentKeysByGroup]
  );

  const existingDependentsCountByComponentId = React.useMemo(() => {
    const countMap = new Map<number, number>();
    const allDependents = (lifeEventPolicySources || []).flatMap(
      (policy: any) => policy?.configuration?.dependents || []
    );
    allDependents.forEach((dependent: any) => {
      const componentIds = new Set<number>();
      if (Number.isFinite(Number(dependent?.policyComponentActionTypeId))) {
        componentIds.add(Number(dependent?.policyComponentActionTypeId));
      }
      (dependent?.choices || []).forEach((choice: any) => {
        if (Number.isFinite(Number(choice?.policyComponentActionTypeId))) {
          componentIds.add(Number(choice?.policyComponentActionTypeId));
        }
      });
      componentIds.forEach((componentId: number) => {
        countMap.set(componentId, (countMap.get(componentId) || 0) + 1);
      });
    });
    return countMap;
  }, [lifeEventPolicySources]);

  const selectedPolicySummaries = selectedObjectsWithDependents.map(
    (choice: any) => {
      const componentId = Number(
        choice.policyComponentActionTypeId ?? choice.id
      );
      return {
        policyId: choice.policyComponentActionTypeId ?? choice.id ?? "--",
        selectionGroupKey: choice.selectionGroupKey,
        policyTypeKey: choice.policyTypeKey ?? "",
        policyName: choice.policyName ?? "",
        policyLabel: choice.policyComponentActionLabel ?? "--",
        policyType: choice.policyComponentActionType ?? "--",
        isOptional: choice.isOptional === true,
        sumInsured: choice.sumInsured ?? "--",
        premium: toAmount(choice.premium ?? choice.sumInsured),
        totalPremium:
          toAmount(choice.companyContribution ?? choice.companyPay) +
          toAmount(choice.employeeContribution ?? choice.employeePay),
        companyContribution: toAmount(
          choice.companyContribution ?? choice.companyPay
        ),
        employeeContribution: toAmount(
          choice.employeeContribution ?? choice.employeePay
        ),
        premiumPerLife: Boolean(choice?.premiumPerLife),
        isRelationshipGroup: Boolean(choice?.isRelationshipGroup),
        showCompanyContribution: choice?.showCompanyContribution,
        selectedDependentCount:
          selectedDependentCountByGroup[choice.selectionGroupKey] ?? 0,
        selectedDependentKeys:
          selectedDependentKeysByGroup[choice.selectionGroupKey] ?? [],
        existingDependentsCount: Number.isFinite(componentId)
          ? existingDependentsCountByComponentId.get(componentId) || 0
          : 0,
      };
    }
  );

  const currentlyEnrolledComponentIds = React.useMemo(
    () =>
      new Set<number>(
        (lifeEventPolicySources || [])
          .flatMap(
            (policy: any) => policy?.configuration?.employeeChosenChoices || []
          )
          .map((choice: any) => Number(choice?.policyComponentActionTypeId))
          .filter((id: number) => Number.isFinite(id))
      ),
    [lifeEventPolicySources]
  );

  const componentHasSelfCoverage = React.useMemo(() => {
    const map = new Map<number, boolean>();
    const addEligibleRelations = (
      componentId: unknown,
      eligibleRelations?: unknown[]
    ) => {
      const parsedId = Number(componentId);
      if (!Number.isFinite(parsedId)) return;
      const hasSelf = (eligibleRelations || []).some(
        (relation) =>
          String(relation || "")
            .trim()
            .toLowerCase() === "self"
      );
      if (hasSelf) {
        map.set(parsedId, true);
      }
    };

    (lifeEventPolicySources || []).forEach((policy: any) => {
      const policyTemplate = policy?.configuration?.policyTemplate || {};
      addEligibleRelations(
        policyTemplate?.basePolicy?.mainPolicyId,
        policyTemplate?.basePolicy?.eligibleRelations
      );
      (policyTemplate?.basePolicy?.addonIds || []).forEach((addon: any) => {
        addEligibleRelations(addon?.optionId, addon?.eligibleRelations);
      });
      addEligibleRelations(
        policyTemplate?.parentalPolicy?.mainPolicyId,
        policyTemplate?.parentalPolicy?.eligibleRelations
      );
      (policyTemplate?.parentalPolicy?.addonIds || []).forEach((addon: any) => {
        addEligibleRelations(addon?.optionId, addon?.eligibleRelations);
      });
    });
    return map;
  }, [lifeEventPolicySources]);

  // Employee always pays only their contribution regardless of showCompanyContribution flag.
  // showCompanyContribution only controls UI visibility of company portion, not what employee pays.
  const effectivePremium = (policySummary: any): number =>
    toAmount(policySummary?.employeeContribution);

  const selectedComponentsCurrentTotalPremium = selectedPolicySummaries.reduce(
    (sum: number, policySummary: any) => {
      const componentId = Number(policySummary?.policyId);
      const isCurrentlyEnrolled =
        Number.isFinite(componentId) &&
        currentlyEnrolledComponentIds.has(componentId);
      if (!isCurrentlyEnrolled) {
        return sum;
      }
      const componentPremium = effectivePremium(policySummary);
      const existingDependentsCount = Number.isFinite(componentId)
        ? existingDependentsCountByComponentId.get(componentId) || 0
        : 0;
      const hasSelfCoverage = Boolean(
        componentHasSelfCoverage.get(componentId)
      );
      const coveredLives = existingDependentsCount + (hasSelfCoverage ? 1 : 0);
      return (
        sum +
        (policySummary?.premiumPerLife
          ? componentPremium * coveredLives
          : componentPremium)
      );
    },
    0
  );

  const additionalPremium = selectedPolicySummaries.reduce(
    (sum: number, policySummary: any) =>
      sum +
      (policySummary?.premiumPerLife
        ? effectivePremium(policySummary) *
          (Number(policySummary?.selectedDependentCount) || 0)
        : Number.isFinite(Number(policySummary?.policyId)) &&
          !currentlyEnrolledComponentIds.has(Number(policySummary?.policyId))
        ? effectivePremium(policySummary)
        : 0),
    0
  );

  const currentTotalPremium = selectedComponentsCurrentTotalPremium;

  const newTotalPremium = currentTotalPremium + additionalPremium;

  const payrollInstallments = Math.max(
    1,
    (lifeEventPolicySources || []).reduce((max: number, policy: any) => {
      const inst = policy?.configuration?.constraints?.payrollInstallments;
      return typeof inst === "number" && inst > max ? inst : max;
    }, 1),
  );
  const monthlyDeduction =
    payrollInstallments > 0 ? newTotalPremium / payrollInstallments : null;

  switch (activeStep) {
    case 0:
      return (
        <StepContainer>
          <StepTitle variant="h6" gutterBottom>
            Select the reason for adding a dependent
          </StepTitle>
          {availableLifeEvents.length === 0 ? (
            <ErrorMessage>
              No life events available for your current policy configuration.
            </ErrorMessage>
          ) : (
            availableLifeEvents.map((event) => (
              <LifeEventCard
                key={event.id}
                selected={selectedLifeEvent === event.id}
                onClick={() => onLifeEventSelect(event.id)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {event.title}
                  </Typography>
                  <LifeEventDescription variant="body2">
                    {event.description}
                  </LifeEventDescription>
                  <RequiredDocuments>
                    <Typography variant="subtitle2" gutterBottom>
                      📋 Required Documents:
                    </Typography>
                    <ul>
                      {event.requiredDocuments.map(
                        (doc: string, index: number) => (
                          <li
                            key={`${event.id}-doc-${doc.substring(
                              0,
                              10
                            )}-${index}`}
                          >
                            <Typography variant="body2">{doc}</Typography>
                          </li>
                        )
                      )}
                    </ul>
                  </RequiredDocuments>
                </CardContent>
              </LifeEventCard>
            ))
          )}
        </StepContainer>
      );

    case 1:
      return (
        <StepContainer>
          {selectedLifeEvent && gmcPolicyRelationships ? (
            <LifeEventsDependentManagement
              selectedLifeEvent={selectedLifeEvent}
              gmcRelationships={{
                configuration: {
                  relationships: gmcPolicyRelationships,
                  policyTemplate,
                },
              }}
              existingDependents={mergedExistingDependents}
              draftDependents={dependentsData}
              onDependentsChange={onDependentsChange}
              uploadedDocuments={uploadedDocuments}
              onUploadedDocumentsChange={onUploadedDocumentsChange}
              employeeGender={employeeGender}
              gmcPolicyData={gmcPolicyData}
              onBack={handleBackFromDependentManagement}
              onExit={onExit}
              onContinue={onNext}
            />
          ) : (
            <ErrorMessage>Please select a life event first.</ErrorMessage>
          )}
        </StepContainer>
      );

    case 2:
      return (
        <StepContainer>
          {selectedLifeEvent && dependentsData.length > 0 ? (
            <LifeEventsChoiceSelection
              selectedLifeEvent={selectedLifeEvent}
              dependentsData={dependentsData}
              gmcPolicyData={gmcPolicyData}
              lifeEventPolicySources={lifeEventPolicySources}
              selectedChoiceIds={selectedChoiceIds}
              onSelectedChoiceIdsChange={onSelectedChoiceIdsChange}
              selectedDependentKeysByGroup={selectedDependentKeysByGroup}
              onSelectedDependentKeysByGroupChange={
                onSelectedDependentKeysByGroupChange
              }
              onPendingSelectionsChange={onPendingSelectionsChange}
              onBack={onBack}
              onExit={onExit}
              onContinue={() => {
                onNext();
              }}
              disableInitialChoiceAutoSelect
            />
          ) : (
            <ErrorMessage>Please add dependents first.</ErrorMessage>
          )}
        </StepContainer>
      );

    case 3:
      return (
        <StepContainer>
          {selectedLifeEvent && dependentsData.length > 0 ? (
            <PremiumSummary
              selectedRelation={selectedRelation}
              selectedPolicySummaries={selectedPolicySummaries}
              dependentsData={dependentsData}
              currentTotalPremium={currentTotalPremium}
              newTotalPremium={newTotalPremium}
              additionalPremium={additionalPremium}
              monthlyDeduction={monthlyDeduction}
              isSubmitting={isSubmitting}
              onBack={onBack}
              onExit={onExit}
              onContinue={() => {
                onNext();
              }}
              formatCurrency={formatCurrency}
              isGstApplicable={gmcPolicyData?.configuration?.constraints?.gstApplicable === true}
              showGst={gmcPolicyData?.configuration?.constraints?.showGstToEmployee === true}
              gstRate={0.18}
            />
          ) : (
            <ErrorMessage>Please add dependents first.</ErrorMessage>
          )}
        </StepContainer>
      );

    case 4:
      return onReturnHome ? (
        <LifeEventsSuccessPage
          flowType="addition"
          submissionMeta={submissionMeta}
          onReturnHome={onReturnHome}
        />
      ) : null;

    default:
      return null;
  }
};

export default AdditionSteps;
