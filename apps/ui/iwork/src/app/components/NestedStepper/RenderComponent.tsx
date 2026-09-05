import { colors } from "@ui/ui-lib";
import SuccessImg from "../../assets/svgs/done.svg";
import RightChevron from "../../assets/svgs/right-arrow-icon.svg";
import { Step, StepItem } from "./config";
import {
  CheckboxLabel,
  CheckboxWrapper,
  DefaultVariantHeaderContainer,
  Dot,
  EmptyCircle,
  IconsContainer,
  RotatableArrow,
  StepHeader,
  StepTitle,
  StyledCheckbox,
  SuccessCircle,
  Tick,
  TimeIcon,
} from "./styles";
import successGreenIcon from "../../assets/svgs/mark-as-complete-tick-after.svg"
export enum StateEnum {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
}

interface AccordianVariantProps extends Step {
  state: StateEnum;
  onClick?: () => void;
  isOpen?: boolean;
  hasActiveChild?: boolean;
}

const AccordianVariant: React.FC<AccordianVariantProps> = ({
  state,
  items,
  title,
  onClick,
  isOpen = false,
  hasActiveChild = false,
}) => {
  // For accordion components, only show active state if a child is actually selected
  const displayState = hasActiveChild ? StateEnum.ACTIVE : StateEnum.DRAFT;
  
  // Check if all sub-items are completed to show the green tick
  const allSubItemsCompleted = items && items.length > 0 
    ? items.every(item => item.stepState === StateEnum.COMPLETED)
    : state === StateEnum.COMPLETED;
  
  return (
    <StepHeader onClick={onClick}>
      <StepTitle state={displayState}>{title}</StepTitle>
      <IconsContainer>
        {allSubItemsCompleted && <img src={successGreenIcon} alt="success" />}
        {items && items.length > 0 && !allSubItemsCompleted && (
          <RotatableArrow src={RightChevron} alt="Expand" isOpen={isOpen} />
        )}
      </IconsContainer>
    </StepHeader>
  );
};

const DefaultVariant: React.FC<AccordianVariantProps> = ({
  state,
  title,
  onClick,
}) => (
  <DefaultVariantHeaderContainer onClick={onClick} state={state}>
    <IconsContainer>
      {state === StateEnum.COMPLETED ? (
        <SuccessCircle src={SuccessImg} alt="Success" />
      ) : state === StateEnum.ACTIVE ? (
        <TimeIcon />
      ) : (
        <EmptyCircle />
      )}
    </IconsContainer>
    <StepTitle state={state}>{title}</StepTitle>
  </DefaultVariantHeaderContainer>
);

export const renderComponent = (
  componentKey: string,
  step: Step,
  state: StateEnum,
  onClick: () => void,
  isOpen?: boolean,
  hasActiveChild?: boolean
): JSX.Element => {
  // Show DefaultVariant if items is empty or not present
  if (!step.items || step.items.length === 0) {
    return <DefaultVariant {...step} state={state} onClick={onClick} />;
  }
  switch (componentKey) {
    case "accordianComponent":
      return (
        <AccordianVariant
          {...step}
          state={state}
          onClick={onClick}
          isOpen={isOpen}
          hasActiveChild={hasActiveChild}
        />
      );
    // Add more cases for other componentKeys as needed
    default:
      return <DefaultVariant {...step} state={state} onClick={onClick} />;
  }
};

export const renderStepContent = (
  item: StepItem,
  active: boolean,
  onClick: () => void
): JSX.Element => {
  switch (item.componentKey) {
    case "primary":
      return (
        <DefaultVariantHeaderContainer onClick={onClick} state={item.stepState} active={active}>
          <IconsContainer>
            {item.stepState === StateEnum.COMPLETED ? (
              <SuccessCircle src={SuccessImg} alt="Success" />
            ) : item.stepState === StateEnum.ACTIVE ? (
              <TimeIcon />
            ) : (
              <EmptyCircle />
            )}
          </IconsContainer>
          <StepTitle state={item.stepState}>{item.label}</StepTitle>
        </DefaultVariantHeaderContainer>
      );
    case "text":
      return (
        <CheckboxWrapper active={active}>
          <CheckboxLabel state={item.stepState} onClick={onClick}>
            {item.label}
          </CheckboxLabel>
        </CheckboxWrapper>
      );
    case "dot":
      return (
        <CheckboxWrapper active={active}>
          <Dot
            color={
              item.stepState === StateEnum.COMPLETED
                ? colors.border.primary
                : item.color || "#000"
            }
          />
          <CheckboxLabel state={item.stepState} onClick={onClick}>
            {item.label}
          </CheckboxLabel>
        </CheckboxWrapper>
      );
    case "checkbox":
    default:
      return (
        <CheckboxWrapper active={active}>
          <StyledCheckbox
            type="checkbox"
            checked={item.stepState === StateEnum.COMPLETED}
            readOnly
          />
          <CheckboxLabel state={item.stepState} onClick={onClick}>
            {item.label}
          </CheckboxLabel>
        </CheckboxWrapper>
      );
  }
};
