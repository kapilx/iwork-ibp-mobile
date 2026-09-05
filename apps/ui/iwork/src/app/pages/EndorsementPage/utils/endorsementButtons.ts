// utils/endorsementButtons.ts

import { ENDORSEMENT_STEP_KEYS } from "../../../constants";

interface StepMeta {
  isCurrentStep?: boolean;
  isCompleted?: boolean;
  stepOrder?: number;
}

export const isSendButtonDisabled = (meta: StepMeta): boolean => {
  if (!meta) return true;
  const { isCurrentStep, isCompleted } = meta;
  const isDraft = !isCurrentStep && !isCompleted;
  return isDraft;
};

export const isNextButtonDisabled = (
  stepKey: string | undefined,
  meta: StepMeta,
  endorsementStepsData: Record<string, any>,
  isEndorsementPending: boolean,
  sentToInsurerMap: Record<string, boolean>,
  creationFlowConfig: any,
  endorsementStats?: { notStartedCount?: number; inProgressCount?: number },
  treatClientConfirmationAsTpa?: boolean
): boolean => {
  if (!stepKey) return true;
  if (!meta) return true;

  const { isCurrentStep, isCompleted, stepOrder } = meta;
  const isDraft = !isCurrentStep && !isCompleted;

  // Rule 1: draft state
  if (isDraft) return true;

  // Rule 2: enrollment status - disable if there are employees who haven't completed enrollment
  const notStarted = endorsementStats?.notStartedCount || 0;
  const inProgress = endorsementStats?.inProgressCount || 0;
  if (notStarted + inProgress > 0 || notStarted > 0 || inProgress > 0) {
    return true;
  }

  // Rule 3: endorsementRequestReceived and pending
  if (
    stepKey === ENDORSEMENT_STEP_KEYS.ENDORSEMENT_REQUEST_RECEIVED &&
    isEndorsementPending
  ) {
    return true;
  }

  // Rule 3a: TPA ID Upload step (or client confirmation when TPA is skipped)
  if (
    (stepKey === ENDORSEMENT_STEP_KEYS.TPA_ID_UPLOAD ||
      (treatClientConfirmationAsTpa &&
        stepKey === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION)) &&
    isEndorsementPending
  ) {
    return true;
  }

  // Rule 3b: requires send action
  if (
    [
      ENDORSEMENT_STEP_KEYS.SEND_ENDORSEMENT_TO_INSURER,
      ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION,
    ].includes(stepKey) &&
    !(treatClientConfirmationAsTpa &&
      stepKey === ENDORSEMENT_STEP_KEYS.CLIENT_CONFIRMATION) &&
    !sentToInsurerMap[stepKey]
  ) {
    return true;
  }

  // Rule 4 & 5: completed states
  const firstTwoCompleted = [1, 2].every((order) =>
    Object.values(endorsementStepsData || {}).some(
      (s: any) => s?.stepOrder === order && s?.isCompleted
    )
  );

  // Rule 4 & 5:
  // - For steps with order > 2: disable if completed.
  // - For first two steps: disable only if BOTH step 1 & 2 are completed.

  if (!isCurrentStep && isCompleted) {
    if (stepOrder && stepOrder > 2) return true;
    if (stepOrder && stepOrder <= 2 && firstTwoCompleted) return true;
  }

  // Rule 6: last step completed
  if (
    stepOrder &&
    stepOrder === creationFlowConfig?.stepperConfig.length &&
    isCompleted
  ) {
    return true;
  }

  return false;
};
