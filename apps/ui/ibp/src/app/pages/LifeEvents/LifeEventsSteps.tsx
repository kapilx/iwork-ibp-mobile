import React from "react";
import AdditionSteps from "./LifeEventsAdditionSteps";
import DeletionSteps from "./LifeEventsDeletionSteps";
import { LifeEventsSubmissionMeta } from "./LifeEventsSuccessPage";

type FlowType = "addition" | "deletion";

interface LifeEventsStepsProps {
  flowType: FlowType;
  activeStep: number;
  onNext: () => void;
  onBack: () => void;
  onExit?: () => void;
  onReturnHome?: () => void;
  isSubmitting?: boolean;
  selectedLifeEvent: string | null;
  availableLifeEvents: any[];
  dependentsData: any[];
  gmcPolicyRelationships?: any;
  gmcPolicyData?: any;
  lifeEventPolicySources?: any[];
  employeeGender: string;
  onLifeEventSelect: (eventId: string) => void;
  onDependentsChange: (dependents: any[]) => void;
  onDependentSelection: (dependents: any[]) => void;
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
  getSelectedLifeEventData: () => any;
  policyTemplate?: any;
  submissionMeta?: LifeEventsSubmissionMeta | null;
}

const LifeEventsSteps: React.FC<LifeEventsStepsProps> = ({
  flowType,
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
  gmcPolicyData,
  lifeEventPolicySources,
  employeeGender,
  onLifeEventSelect,
  onDependentsChange,
  onDependentSelection,
  getSelectedLifeEventData,
  policyTemplate,
  selectedChoiceIds,
  onSelectedChoiceIdsChange,
  selectedDependentKeysByGroup,
  onSelectedDependentKeysByGroupChange,
  onPendingSelectionsChange,
  submissionMeta,
  uploadedDocuments,
  onUploadedDocumentsChange,
}) => {
  if (flowType === "addition") {
    return (
      <AdditionSteps
        activeStep={activeStep}
        onNext={onNext}
        onBack={onBack}
        onExit={onExit}
        onReturnHome={onReturnHome}
        isSubmitting={isSubmitting}
        selectedLifeEvent={selectedLifeEvent}
        availableLifeEvents={availableLifeEvents}
        dependentsData={dependentsData}
        gmcPolicyRelationships={gmcPolicyRelationships}
        employeeGender={employeeGender}
        onLifeEventSelect={onLifeEventSelect}
        onDependentsChange={onDependentsChange}
        selectedChoiceIds={selectedChoiceIds}
        onSelectedChoiceIdsChange={onSelectedChoiceIdsChange}
        selectedDependentKeysByGroup={selectedDependentKeysByGroup}
        onSelectedDependentKeysByGroupChange={
          onSelectedDependentKeysByGroupChange
        }
        onPendingSelectionsChange={onPendingSelectionsChange}
        uploadedDocuments={uploadedDocuments}
        onUploadedDocumentsChange={onUploadedDocumentsChange}
        policyTemplate={policyTemplate}
        gmcPolicyData={gmcPolicyData}
        lifeEventPolicySources={lifeEventPolicySources}
        submissionMeta={submissionMeta}
      />
    );
  }

  if (flowType === "deletion") {
    return (
      <DeletionSteps
        activeStep={activeStep}
        onNext={onNext}
        onBack={onBack}
        onExit={onExit}
        onReturnHome={onReturnHome} // Pass the handler
        isSubmitting={isSubmitting}
        selectedLifeEvent={selectedLifeEvent}
        availableLifeEvents={availableLifeEvents}
        dependentsData={dependentsData}
        gmcPolicyData={gmcPolicyData}
        lifeEventPolicySources={lifeEventPolicySources}
        onLifeEventSelect={onLifeEventSelect}
        onDependentSelection={onDependentSelection}
        uploadedDocuments={uploadedDocuments}
        onUploadedDocumentsChange={onUploadedDocumentsChange}
        getSelectedLifeEventData={getSelectedLifeEventData}
        submissionMeta={submissionMeta}
      />
    );
  }

  return null;
};

export default LifeEventsSteps;
