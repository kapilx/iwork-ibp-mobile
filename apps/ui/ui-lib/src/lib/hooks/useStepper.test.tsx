import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { useStepper } from "./useStepper";
import { Step } from "../commonComponents/Stepper/types";

// Mock React Router hooks
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock steps for testing
const mockSteps: Step[] = [
  { id: "step1", label: "Step 1", status: "default" },
  { id: "step2", label: "Step 2", status: "default" },
  { id: "step3", label: "Step 3", status: "default" },
];

// Wrapper component to provide Router context
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <MemoryRouter initialEntries={["/opportunities/123"]}>
      {children}
    </MemoryRouter>
  );
};

// Test component to use the hook
const TestComponent: React.FC<{ initialSteps: Step[] }> = ({
  initialSteps,
}) => {
  const {
    activeStep,
    steps,
    completedSteps,
    handleNext,
    handleBack,
    updateStepStatus,
    setActiveStep,
    stepStatuses,
    updateAllStepsStatusToComplete,
  } = useStepper(initialSteps);

  // const [currentStepStatus, setCurrentStepStatus] = useState<string>("");

  const handleUpdateStatus = (stepIndex: number, isComplete: boolean) => {
    updateStepStatus(stepIndex, isComplete);
  };

  return (
    <div>
      <div data-testid="active-step">Active Step: {activeStep}</div>
      <div data-testid="completed-steps">
        Completed Steps: {completedSteps.join(", ")}
      </div>
      <button data-testid="next-button" onClick={handleNext}>
        Next
      </button>
      <button data-testid="back-button" onClick={handleBack}>
        Back
      </button>
      <button
        data-testid="update-status-button"
        onClick={() => handleUpdateStatus(activeStep, true)}
      >
        Mark Current Step Complete
      </button>
      <button
        data-testid="set-active-step-button"
        onClick={() => setActiveStep(2)}
      >
        Set Active Step to 2
      </button>
      <div data-testid="current-step-status">
        Current Step Status: {stepStatuses.join(",")}
      </div>
      <button
        data-testid="complete-all-button"
        onClick={updateAllStepsStatusToComplete}
      >
        Complete All
      </button>
    </div>
  );
};

describe("useStepper Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock return values
    mockUseParams.mockReturnValue({ id: "123" });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<RouterWrapper>{component}</RouterWrapper>);
  };

  it("should initialize with default values", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    expect(screen.getByTestId("active-step")).toHaveTextContent(
      "Active Step: 0"
    );

    expect(screen.getByTestId("completed-steps")).toHaveTextContent(
      "Completed Steps:"
    );
  });

  it("should move to the next step when handleNext is called", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    fireEvent.click(screen.getByTestId("next-button"));

    expect(screen.getByTestId("active-step")).toHaveTextContent(
      "Active Step: 1"
    );
  });

  it("should not move beyond the last step when handleNext is called", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    fireEvent.click(screen.getByTestId("next-button"));
    fireEvent.click(screen.getByTestId("next-button"));
    fireEvent.click(screen.getByTestId("next-button")); // Attempt to go beyond the last step

    expect(screen.getByTestId("active-step")).toHaveTextContent(
      "Active Step: 2"
    );
  });

  it("should navigate to opportunities page when handleNext is called on last step", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    // Move to the last step
    fireEvent.click(screen.getByTestId("next-button"));
    fireEvent.click(screen.getByTestId("next-button"));

    // Verify we're on the last step
    expect(screen.getByTestId("active-step")).toHaveTextContent(
      "Active Step: 2"
    );

    // Click next again - should trigger navigation
    fireEvent.click(screen.getByTestId("next-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/opportunities/123");
  });

  it("should move to the previous step when handleBack is called", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    fireEvent.click(screen.getByTestId("next-button")); // Move to step 1
    fireEvent.click(screen.getByTestId("back-button")); // Move back to step 0

    expect(screen.getByTestId("active-step")).toHaveTextContent(
      "Active Step: 0"
    );
  });

  it("should not move before the first step when handleBack is called", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    fireEvent.click(screen.getByTestId("back-button")); // Attempt to go before the first step

    expect(screen.getByTestId("active-step")).toHaveTextContent(
      "Active Step: 0"
    );
  });

  it("should update step status correctly with updateStepStatus", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    fireEvent.click(screen.getByTestId("update-status-button"));

    expect(screen.getByTestId("current-step-status")).toHaveTextContent(
      "Current Step Status: complete"
    );
  });

  it("should correctly calculate completedSteps", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    fireEvent.click(screen.getByTestId("update-status-button"));

    expect(screen.getByTestId("completed-steps")).toHaveTextContent(
      "Completed Steps: 0"
    );
  });

  it("should allow setting the active step directly with setActiveStep", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    fireEvent.click(screen.getByTestId("set-active-step-button"));

    expect(screen.getByTestId("active-step")).toHaveTextContent(
      "Active Step: 2"
    );
  });

  it("should mark all steps as complete when updateAllStepsStatusToComplete is called", () => {
    renderWithRouter(<TestComponent initialSteps={mockSteps} />);

    fireEvent.click(screen.getByTestId("complete-all-button"));

    expect(screen.getByTestId("current-step-status")).toHaveTextContent(
      "Current Step Status: complete,complete,complete"
    );
  });
});
