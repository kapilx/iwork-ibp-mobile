import React from "react";
import { Box, Tooltip } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import {
  StepContainer,
  StepCircle,
  StepConnectorLine,
  StepLabel,
} from "./styles";

interface StepData {
  key: string;
  label: string;
}

interface CustomStepperProps {
  currentStep: number; // index of the current orange step
  onCurrentStepClick: (stepKey: string, data: any) => void;
  rowData: any; // full row data
  variant?: "default" | "primary" | "secondary";
}

const CustomStepper: React.FC<CustomStepperProps> = ({
  currentStep,
  onCurrentStepClick,
  rowData,
  variant = "default",
}) => {
  const steps: StepData[] = [
    { key: "upload_employee", label: "Send End." },
    { key: "insurer_ack", label: "Insurer Ack." },
    { key: "upload_tpa_ids", label: "Upload TPA Ids" },
    { key: "final_review", label: "Client Confirmation" },
  ];

  if (currentStep === steps.length - 1) {
    currentStep = steps.length;
  }

  return (
    <StepContainer>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isUpcoming = index > currentStep;

        const showLabel =
          variant === "default" || (variant === "primary" && isActive);

        const shouldShowTooltip =
          variant === "primary" || variant === "secondary";
        const tooltipTitle = step.label;

        const circleContent = isCompleted ? (
          <CheckIcon />
        ) : isActive ? (
          <Box className="inner-circle" />
        ) : null;

        const labelComponent = showLabel ? (
          <StepLabel isActive={isActive} isCompleted={isCompleted}>
            {step.label}
          </StepLabel>
        ) : null;

        const content = (
          <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
            <StepCircle
              isCompleted={isCompleted}
              isActive={isActive}
              isUpcoming={isUpcoming}
              onClick={
                isActive
                  ? () => onCurrentStepClick(step.key, rowData)
                  : undefined
              }
            >
              {circleContent}
            </StepCircle>
            {labelComponent}
          </Box>
        );

        return (
          <React.Fragment key={step.key}>
            {shouldShowTooltip && !showLabel ? (
              <Tooltip title={tooltipTitle}>{content}</Tooltip>
            ) : (
              content
            )}

            {index !== steps.length - 1 && (
              <StepConnectorLine isCompleted={isCompleted} />
            )}
          </React.Fragment>
        );
      })}
    </StepContainer>
  );
};

export default CustomStepper;
