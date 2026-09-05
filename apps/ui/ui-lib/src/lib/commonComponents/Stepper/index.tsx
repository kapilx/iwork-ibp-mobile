import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { MessageBox } from "./MessageBox";
import { ProgressCircle } from "./ProgressCircle";
import { StepConnector } from "./StepConnector";
import { StepItem } from "./StepItem";
import {
  ProgressWizardContainer,
  StepperBodyContainer,
  StepperContainer,
  StepperHeaderBox,
  StepperProgressHeaderContainer,
} from "./styles";
import { ProgressWizardProps } from "./types";

// Define types for our component
const gradients = [
  "linear-gradient(90deg, #FF7104 0%, #EC6A06 100%)",
  "linear-gradient(90deg, #FF7104 0%, #FFBC05 100%)",
  "linear-gradient(90deg, #FFBC05 48.94%, #8BCC00 72.6%)",
  "linear-gradient(90deg, #8BCC00 0%, #02BE08 100%)",
  "linear-gradient(90deg, #43C602 0%, #06A70C 100%)",
];

// Get appropriate gradient based on progress
const getGradientByProgress = (progress: number): string => {
  if (progress < 20) return gradients[0];
  if (progress < 40) return gradients[1];
  if (progress < 60) return gradients[2];
  if (progress < 80) return gradients[3];
  return gradients[4]; // For progress >= 80
};

export const ProgressWizard: React.FC<ProgressWizardProps> = ({
  steps,
  activeStep,
  completedSteps,
  gradient,
  onStepChange,
  totalFields,
  fieldsFilled,
}) => {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (steps[activeStep]?.message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 5000); // Hide after 5 seconds
      return () => clearTimeout(timer); // Cleanup timer on unmount or step change
    }
  }, [activeStep, steps]);

  const progress =
    totalFields > 0
      ? Math.min(Math.max((fieldsFilled / totalFields) * 100, 0), 100)
      : 0;

  // Get the appropriate gradient based on progress
  const currentGradient = gradient || getGradientByProgress(progress);

  // Function to validate if a step can be navigated to
  const validateStep = (stepIndex: number) => {
    return stepIndex <= activeStep || completedSteps.includes(stepIndex);
  };
  return (
    <StepperContainer>
      <ProgressWizardContainer
        gradient={currentGradient}
        data-testid="progress-wizard"
      >
        <StepperProgressHeaderContainer>
          <Box>{/* Empty box to maintain layout */}</Box>
          <StepperHeaderBox>
            <ProgressCircle
              progress={Math.round(progress)}
              data-testid="progress-circle"
            />
          </StepperHeaderBox>
        </StepperProgressHeaderContainer>

        <StepperBodyContainer>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <StepItem
                label={step.label}
                index={index}
                status={step.status}
                onClick={() => validateStep(index) && onStepChange?.(index)}
                validateStep={validateStep}
                data-testid={`step-item-${index}`}
              />
              {index < steps.length - 1 && (
                <StepConnector
                  completed={completedSteps.includes(index)}
                  index={index}
                />
              )}
            </React.Fragment>
          ))}
        </StepperBodyContainer>
      </ProgressWizardContainer>
      {showMessage && steps[activeStep]?.message && (
        <MessageBox
          message={steps[activeStep].message}
          data-testid="message-box"
          onClose={() => setShowMessage(false)}
        />
      )}
    </StepperContainer>
  );
};

export default ProgressWizard;
