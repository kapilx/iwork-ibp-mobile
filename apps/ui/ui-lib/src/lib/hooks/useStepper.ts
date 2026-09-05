import { useState, useMemo } from "react";
import {
  Step,
  StepStatus,
  StepStatusType,
} from "../commonComponents/Stepper/types";
import { useNavigate, useParams } from "react-router-dom";
// import { Step, StepStatus, StepStatusType } from "../common/Stepper/types";

export const useStepper = (initialSteps: Step[]) => {
  const [activeStep, setActiveStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<StepStatusType[]>(
    initialSteps.map(() => StepStatus.DEFAULT)
  );
  const navigate = useNavigate();
  const { id: opportunityId } = useParams();
  const completedSteps = useMemo(
    () =>
      stepStatuses.reduce(
        (acc: number[], status, index) =>
          status !== StepStatus.DEFAULT && StepStatus.ACTIVE
            ? [...acc, index]
            : acc,
        []
      ),
    [stepStatuses]
  );

  const steps = useMemo(
    () =>
      initialSteps.map((step, index) => ({
        ...step,
        status: index === activeStep ? StepStatus.ACTIVE : stepStatuses[index],
      })),
    [activeStep, stepStatuses, initialSteps]
  );

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      navigate(`/opportunities/${opportunityId}`);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep((prev) => prev - 1);
  };

  const updateStepStatus = (stepIndex: number, isComplete: boolean = true) => {
    //here isComplete is the validation result of no of fields filled in the cureent step to total no of fields present in the current step
    setStepStatuses((prev) =>
      prev.map((status, idx) =>
        idx === stepIndex
          ? isComplete
            ? StepStatus.COMPLETE
            : StepStatus.INCOMPLETE
          : status
      )
    );
  };

  //In edit mode all the steps are marked as complete
  const updateAllStepsStatusToComplete = () => {
    setStepStatuses((prev) => {
      return prev.map((s) => StepStatus.COMPLETE);
    });
  };

  return {
    activeStep,
    steps,
    completedSteps,
    stepStatuses,
    handleNext,
    handleBack,
    updateStepStatus,
    setActiveStep,
    updateAllStepsStatusToComplete,
  };
};
