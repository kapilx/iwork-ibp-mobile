import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import { Step } from "./types";
import ProgressWizard from ".";
import { theme } from "@ui/ui-lib/styles";

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("ProgressWizard Component", () => {
  const steps: Step[] = [
    { id: "a", label: "Step A", status: "default", message: "Hello A" },
    { id: "b", label: "Step B", status: "default" },
    { id: "c", label: "Step C", status: "default", message: "Hello C" },
  ];

  const onStepChange = jest.fn();

  beforeEach(() => {
    onStepChange.mockClear();
  });

  it("renders wizard container and header elements", () => {
    renderWithTheme(
      <ProgressWizard
        steps={steps}
        activeStep={0}
        completedSteps={[]}
        totalFields={5}
        fieldsFilled={1}
        onStepChange={onStepChange}
      />
    );

    expect(screen.getByTestId("progress-wizard")).toBeInTheDocument();
    expect(screen.getByTestId("progress-text")).toHaveTextContent("20%");
    expect(screen.getByTestId("message-text")).toHaveTextContent("Hello A");
  });

  it("renders all step items and connectors", () => {
    renderWithTheme(
      <ProgressWizard
        steps={steps}
        activeStep={1}
        completedSteps={[0]}
        totalFields={5}
        fieldsFilled={3}
      />
    );

    // Three step items
    steps.forEach((_, idx) => {
      expect(screen.getByTestId(`step-item-${idx}`)).toBeInTheDocument();
      expect(screen.getByTestId(`step-icon-${idx}`)).toBeInTheDocument();
      expect(screen.getByTestId(`step-label-${idx}`)).toHaveTextContent(
        steps[idx].label
      );
    });
    // Two connectors
    [0, 1].forEach((idx) => {
      expect(screen.getByTestId(`step-connector-${idx}`)).toBeInTheDocument();
      // connector progress width based on completedSteps
      const progress = screen.getByTestId("step-connector-progress-0");
      // when idx===0 => width 100%, idx===1 => width 0%
      if (idx === 0) expect(progress).toHaveStyle("width: 100%");
    });
  });

  it("calls onStepChange when clicking a completed or active step", () => {
    renderWithTheme(
      <ProgressWizard
        steps={steps}
        activeStep={1}
        completedSteps={[0]}
        totalFields={5}
        fieldsFilled={2}
        onStepChange={onStepChange}
      />
    );

    // Step 0 is completed => clickable
    fireEvent.click(screen.getByTestId("step-icon-0"));
    expect(onStepChange).toHaveBeenCalledWith(0);

    // Step 1 is active => clickable
    fireEvent.click(screen.getByTestId("step-icon-1"));
    expect(onStepChange).toHaveBeenCalledWith(1);

    // Step 2 is neither completed nor active => not clickable (no call)
    fireEvent.click(screen.getByTestId("step-icon-2"));
    expect(onStepChange).toHaveBeenCalledTimes(2);
  });

  it("limits progress to 100%", () => {
    renderWithTheme(
      <ProgressWizard
        steps={steps}
        activeStep={2}
        completedSteps={[0, 1]}
        totalFields={5}
        fieldsFilled={10}
      />
    );
    expect(screen.getByTestId("progress-text")).toHaveTextContent("100%");
  });

  it("hides message after 5 seconds", async () => {
    jest.useFakeTimers();
    renderWithTheme(
      <ProgressWizard
        steps={steps}
        activeStep={0}
        completedSteps={[]}
        totalFields={5}
        fieldsFilled={1}
      />
    );
    expect(screen.getByTestId("message-text")).toHaveTextContent("Hello A");
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await waitFor(() => {
      expect(screen.queryByTestId("message-text")).not.toBeInTheDocument();
    });
    jest.useRealTimers();
  });
});
