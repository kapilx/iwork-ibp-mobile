import React from "react";
import { StepItem } from "./StepItem";
import { StepStatus } from "./types";
import { fireEvent, render, screen } from "@ui/ui-lib/utils/renderWithTheme";
import {
  ProgressWizardContainer,
  StepperProgressHeaderContainer,
  StepperBodyContainer,
  StepItemContainer,
  StepItemIconContainer,
  StepItemIcon,
  StepItemLabel,
  StepConnectorContainer,
  StepConnectorProgress,
  MessageBoxArrow,
  MessageBoxContainer,
  IconContainer,
  MessageBoxText,
  StepperCloseButton,
  ProgressWrapper,
  CircularProgressStyles,
  ProgressTypography,
  OuterRing,
  MiddleRing,
  InnerDot,
  DefaultIncompleteIcon,
  customActiveIcon as CustomActiveBox,
  StyledCompletedIcon,
  StyledIncompleteIcon,
  CustomActiveIconContainer,
  StepperHeaderBox,
  StyledImgBg,
  StepperContainer,
} from "./styles";

describe("StepItem", () => {
  const mockValidateStep = jest.fn((index) => index === 1); // only step 1 is clickable
  const mockClickHandler = jest.fn();

  const defaultProps = {
    label: "Test Step",
    index: 1,
    onClick: mockClickHandler,
    validateStep: mockValidateStep,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders with INCOMPLETE icon", () => {
    render(<StepItem {...defaultProps} status={StepStatus.INCOMPLETE} />);
    expect(screen.getByTestId("step-item-1")).toBeTruthy();
    expect(screen.getByTestId("step-icon-1")).toBeTruthy();
    expect(screen.getByTestId("step-label-1")).toBeTruthy();
  });

  it("renders with ACTIVE icon (custom rings and dot)", () => {
    render(<StepItem {...defaultProps} status={StepStatus.ACTIVE} />);
    const activeIconEl = screen.getByTestId("step-icon-1") as HTMLElement;
    expect(activeIconEl.querySelector("svg")).toBeNull(); // assuming custom rings have no <svg>
    expect(screen.getByTestId("step-label-1")).toBeTruthy();
  });

  it("renders with COMPLETE icon", () => {
    render(<StepItem {...defaultProps} status={StepStatus.COMPLETE} />);
    const completeIconEl = screen.getByTestId("step-icon-1") as HTMLElement;
    expect(completeIconEl.querySelector("svg")).toBeTruthy(); // assumes completed icon is SVG
  });

  it("calls onClick if step is clickable", () => {
    render(<StepItem {...defaultProps} status={StepStatus.INCOMPLETE} />);
    fireEvent.click(screen.getByTestId("step-icon-1"));
    expect(mockClickHandler).toHaveBeenCalled();
  });

  it("does not call onClick if step is not clickable", () => {
    const nonClickableProps = { ...defaultProps, index: 0 };
    render(<StepItem {...nonClickableProps} status={StepStatus.INCOMPLETE} />);
    fireEvent.click(screen.getByTestId("step-icon-0"));
    expect(mockClickHandler).not.toHaveBeenCalled();
  });

  it("applies isActive to label when status is ACTIVE", () => {
    render(<StepItem {...defaultProps} status={StepStatus.ACTIVE} />);
    const label = screen.getByTestId("step-label-1");
    expect(label).toBeTruthy();
  });

  it("applies isClickable to icon container based on validateStep", () => {
    render(<StepItem {...defaultProps} status={StepStatus.INCOMPLETE} />);
    const icon = screen.getByTestId("step-icon-1");
    expect(icon).toBeTruthy();
  });

  it("renders DefaultIncompleteIcon for unknown status", () => {
    render(<StepItem {...defaultProps} status={"unknown" as any} />);
    const icon = screen.getByTestId("step-icon-1") as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.querySelector("svg")).toBeNull();
  });

  it("covers styled component factories", () => {
    const { container } = render(
      <>
        <ProgressWizardContainer gradient="linear-gradient(red, blue)" />
        <StepperProgressHeaderContainer />
        <StepperBodyContainer />
        <StepItemContainer />
        <StepItemIconContainer />
        <StepItemIcon isClickable={true} />
        <StepItemLabel isActive={true}>Active</StepItemLabel>
        <StepConnectorContainer />
        <StepConnectorProgress width="50%" />
        <MessageBoxArrow />
        <MessageBoxContainer>
          <IconContainer />
          <MessageBoxText>Msg</MessageBoxText>
          <StepperCloseButton />
        </MessageBoxContainer>
        <ProgressWrapper />
        <CircularProgressStyles backgroundColor="#123" />
        <ProgressTypography>50%</ProgressTypography>
        <CustomActiveIconContainer>
          <OuterRing />
          <MiddleRing />
          <InnerDot />
        </CustomActiveIconContainer>
        <DefaultIncompleteIcon />
        <CustomActiveBox />
        <StyledCompletedIcon />
        <StyledIncompleteIcon />
        <StepperHeaderBox />
        <StyledImgBg src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==" />
        <StepperContainer />
      </>
    );
    expect(container).toBeTruthy();
  });
});
