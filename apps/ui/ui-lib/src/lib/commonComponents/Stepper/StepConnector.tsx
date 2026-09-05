import React from "react";
import { StepConnectorContainer, StepConnectorProgress } from "./styles";
import { StepConnectorProps } from "./types";

export const StepConnector: React.FC<StepConnectorProps> = ({
  completed,
  index,
}) => {
  return (
    <StepConnectorContainer data-testid={`step-connector-${index}`}>
      <StepConnectorProgress
        data-testid={`step-connector-progress-${index}`}
        width={completed ? "100%" : "0%"}
      />
    </StepConnectorContainer>
  );
};
