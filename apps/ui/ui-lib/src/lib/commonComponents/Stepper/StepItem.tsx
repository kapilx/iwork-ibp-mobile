import React from "react";
import {
  CustomActiveIconContainer,
  DefaultIncompleteIcon,
  InnerDot,
  MiddleRing,
  OuterRing,
  StepItemContainer,
  StepItemIcon,
  StepItemIconContainer,
  StepItemLabel,
  StyledCompletedIcon,
  StyledIncompleteIcon,
} from "./styles";
import { StepItemProps, StepStatus } from "./types";

export const StepItem: React.FC<StepItemProps> = ({
  label,
  index,
  status,
  onClick,
  validateStep,
}) => {
  const isClickable = validateStep(index);

  const customActiveIcon = () => (
    <CustomActiveIconContainer>
      {/* Outer ring */}
      <OuterRing />

      {/* Middle ring */}
      <MiddleRing />

      {/* Inner dot */}
      <InnerDot />
    </CustomActiveIconContainer>
  );

  const getIcon = (): JSX.Element => {
    switch (status) {
      case StepStatus.ACTIVE:
        return customActiveIcon();
      case StepStatus.COMPLETE:
        return <StyledCompletedIcon />;
      case StepStatus.INCOMPLETE:
        return <StyledIncompleteIcon />;
      default:
        return <DefaultIncompleteIcon />;
    }
  };

  return (
    <StepItemContainer data-testid={`step-item-${index}`}>
      <StepItemIconContainer data-testid={`step-icon-container-${index}`}>
        <StepItemIcon
          onClick={isClickable ? onClick : undefined}
          isClickable={isClickable} // Pass dynamic prop
          data-testid={`step-icon-${index}`}
        >
          {getIcon()}
        </StepItemIcon>
      </StepItemIconContainer>
      <StepItemLabel
        isActive={status === StepStatus.ACTIVE} // Pass dynamic prop
        data-testid={`step-label-${index}`}
      >
        {label}
      </StepItemLabel>
    </StepItemContainer>
  );
};
