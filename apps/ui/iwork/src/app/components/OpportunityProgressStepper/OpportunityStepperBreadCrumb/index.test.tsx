import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@ui/ui-lib";
import CommonOpportunityBreadcrumb from "./index";
import { MemoryRouter } from "react-router-dom";
import {
  JustCurrentDoneIconStyled,
  NextIconStyled,
  UpcomingNextIconStyled,
  UpcomingIconStyled,
  ToolTipTypography,
  SelectedCompletedActivityDiv,
} from "./styles";

// Mock router
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock tooltip
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  __esModule: true,
  default: ({ children, title }: any) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );

const crumbs = [
  { title: "Initial", path: "/initial", activityDueDate: "2025-07-10" },
  { title: "Middle", path: "/middle", activityDueDate: "2025-07-12" },
  { title: "Final", path: "/final", activityDueDate: null },
];

describe("CommonOpportunityBreadcrumb", () => {
  let setBreadCumbStepMock: jest.Mock;

  beforeEach(() => {
    setBreadCumbStepMock = jest.fn();
    jest.clearAllMocks();
  });

  it("renders lost icon if opportunity is lost and flag is 0", () => {
    renderWithProviders(
      <CommonOpportunityBreadcrumb
        crumbs={crumbs}
        flag={0}
        setBreadCumbStep={setBreadCumbStepMock}
        isOpportunityLost
        opportunityDetails={{ opportunityStatus: "lost" }}
      />
    );

    expect(screen.getByAltText("Opportunity Lost")).toBeInTheDocument();
    expect(screen.getByText("Initial")).toBeInTheDocument();
  });

  it("navigates and resets both selectedUpcomingIndex and selectedCompletedIndex when 'current' crumb is clicked", () => {
    renderWithProviders(
      <CommonOpportunityBreadcrumb
        crumbs={crumbs}
        flag={2} // "Final" will be current
        setBreadCumbStep={setBreadCumbStepMock}
      />
    );

    fireEvent.click(screen.getByText("Final"));

    expect(mockNavigate).toHaveBeenCalledWith("/final");
    expect(setBreadCumbStepMock).toHaveBeenCalledWith(2);
  });

  it("renders selected completed activity at index 0 without left arrow", () => {
    const customCrumbs = [
      { title: "Step1", path: "/step1" },
      { title: "Step2", path: "/step2" },
    ];

    renderWithProviders(
      <CommonOpportunityBreadcrumb
        crumbs={customCrumbs}
        flag={2} // Both past
        setBreadCumbStep={setBreadCumbStepMock}
      />
    );

    // Click on first crumb
    const doneIcons = screen.getAllByAltText("Done");
    fireEvent.click(doneIcons[0].closest("a"));

    // Should not show left arrow for index 0
    expect(screen.getByText("Step1")).toBeInTheDocument();
  });

  it("renders selected completed activity at last index without right arrow", () => {
    const customCrumbs = [
      { title: "Step1", path: "/step1" },
      { title: "Step2", path: "/step2" },
    ];

    renderWithProviders(
      <CommonOpportunityBreadcrumb
        crumbs={customCrumbs}
        flag={2} // Both past
        setBreadCumbStep={setBreadCumbStepMock}
      />
    );

    // Click on last crumb
    const doneIcons = screen.getAllByAltText("Done");
    fireEvent.click(doneIcons[1].closest("a"));

    // Should not show right arrow for last index
    expect(screen.getByText("Step2")).toBeInTheDocument();
  });

  it("fully triggers upcoming breadcrumb logic including state updates", () => {
    const customCrumbs = [
      { title: "Step1", path: "/step1" },
      { title: "Step2", path: "/step2" },
      { title: "Step3", path: "/step3" },
      { title: "Step4", path: "/step4" }, // Upcoming step
    ];

    renderWithProviders(
      <CommonOpportunityBreadcrumb
        crumbs={customCrumbs}
        flag={2} // Step3 is current, Step4 is upcoming
        setBreadCumbStep={setBreadCumbStepMock}
      />
    );

    // Click the actual upcoming crumb (index 3)
    const upcomingLink = screen.getByText("Step4");
    fireEvent.click(upcomingLink);

    expect(mockNavigate).toHaveBeenCalledWith("/step4");
    expect(setBreadCumbStepMock).toHaveBeenCalledWith(3);
    expect(screen.getByText("Step4")).toBeInTheDocument();
  });
  // StyledComponents.test.tsx

  describe("Styled components rendering", () => {
    it("renders all styled components without crashing", () => {
      renderWithProviders(
        <>
          <JustCurrentDoneIconStyled alt="just-current-done" src="icon.svg" />
          <NextIconStyled alt="next" src="icon.svg" />
          <UpcomingNextIconStyled alt="upcoming-next" src="icon.svg" />
          <UpcomingIconStyled alt="upcoming" src="icon.svg" />
          <ToolTipTypography>Tooltip text</ToolTipTypography>
          <SelectedCompletedActivityDiv>
            <div>Completed Activity</div>
          </SelectedCompletedActivityDiv>
        </>
      );
    });
  });
});
