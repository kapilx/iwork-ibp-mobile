import { Box } from "@mui/material";
import React from "react";
import { Step } from "./config";
import {
  renderComponent,
  renderStepContent,
  StateEnum,
} from "./RenderComponent";
import { Container, Header, Layout, StepContent, StepWrapper } from "./styles";

interface NestedStepperProps {
  steps: Step[];
  openSteps: string[];
  selectedKey: string | null;
  handleStepHeaderClick: (stepKey: string) => void;
  handleItemClick: (itemKey: string) => void;
  title?: string;
  activeStepIndex: number;
  setActiveStepIndex: React.Dispatch<React.SetStateAction<number>>;
  currentStep: number;
  currentStepDataFromApi: any;
}

const NestedStepper: React.FC<NestedStepperProps> = ({
  steps,
  openSteps,
  selectedKey,
  handleStepHeaderClick,
  handleItemClick,
  title = "Process Steps",
  activeStepIndex,
  setActiveStepIndex,
  currentStep,
  currentStepDataFromApi,
}) => {
  const activeStep =
    currentStep >= 1 && !currentStepDataFromApi?.isCompleted
      ? currentStep - 1
      : Array.isArray(steps) && steps.length > 0
      ? !currentStepDataFromApi?.isCompleted &&
        steps.findLastIndex(
          (step: Step) => step.stepState === StateEnum.COMPLETED
        ) + 1
      : 0;

  return (
    <Layout>
      <Container data-testid="nested-stepper-container">
        <Header>{title}</Header>
        <Box>
          {steps?.map((step, index) => {
            const isOpen = openSteps.includes(step.key);
            const hasActiveChild = selectedKey
              ? step.items?.some((item) => item.key === selectedKey) || false
              : false;
            return (
              <StepWrapper
                onClick={() => {
                  setActiveStepIndex(index);
                }}
                key={step.key}
                componentKey={step.componentKey}
                active={activeStepIndex === index && activeStepIndex >= 0}
                data-testid="step-wrapper"
              >
                {renderComponent(
                  step.componentKey ?? "",
                  step,
                  activeStep === index ? StateEnum.ACTIVE : step.stepState,
                  () => handleStepHeaderClick(step.key),
                  isOpen,
                  hasActiveChild
                )}
                {isOpen && step.items && step.items.length > 0 && (
                  <StepContent>
                    {step.items.map((item) => (
                      <React.Fragment key={item.key}>
                        {renderStepContent(item, selectedKey === item.key, () =>
                          handleItemClick(item.key)
                        )}
                      </React.Fragment>
                    ))}
                  </StepContent>
                )}
              </StepWrapper>
            );
          })}
        </Box>
      </Container>
    </Layout>
  );
};

export default NestedStepper;
