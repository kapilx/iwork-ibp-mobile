import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import OpportunityProgressHeader from "./index";
import { theme } from "@ui/ui-lib";

// Mocks
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  formatDate: jest.fn((date) => `Formatted(${date})`),
  formatCurrencyByLocalization: jest.fn((val) => `₹${val}`),
  useLocalization: jest.fn(() => ({
    localizationData: {
      data: {
        locale: "en-IN",
      },
    },
  })),
  ChipRenderer: ({ value }: any) => (
    <div data-testid="chip">{typeof value === "string" ? value : "CHIP"}</div>
  ),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

jest.mock(
  "../../../assets/svgs/opportunity-won-icon.svg",
  () => "won-icon.svg"
);
jest.mock(
  "../../../assets/svgs/opportunity-lost-icon.svg",
  () => "lost-icon.svg"
);
jest.mock(
  "../../../assets/svgs/opportunity-open-icon.svg",
  () => "open-icon.svg"
);

// Helpers
const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);

const baseProps = {
  opportunityDetails: {
    companyName: "Test Company",
    priority: "high",
    crmLead: "John Doe",
    opportunityType: "New",
    policyType: "Health",
    expiryDate: "2024-09-15",
    opportunityStatus: "Open",
    premium: 10000,
    brokerage: 1500,
  },
};

describe("OpportunityProgressHeader Component", () => {
  it("displays chips for priority and crm lead", () => {
    renderWithTheme(<OpportunityProgressHeader {...baseProps} />);
    const chips = screen.getAllByTestId("chip");
    expect(chips.length).toBeGreaterThanOrEqual(2);
  });

  it("shows 'Open' status by default with correct icon", () => {
    renderWithTheme(<OpportunityProgressHeader {...baseProps} />);
    expect(screen.getByAltText("Opportunity Open")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("shows 'Lost' status and correct icon when isOpportunityLost is true", () => {
    renderWithTheme(
      <OpportunityProgressHeader {...baseProps} isOpportunityLost />
    );
    expect(screen.getByAltText("Opportunity Lost")).toBeInTheDocument();
    expect(screen.getByText("Lost")).toBeInTheDocument();
  });

  it("shows 'Won' status and correct icon when isOpportunityWon is true", () => {
    renderWithTheme(
      <OpportunityProgressHeader {...baseProps} isOpportunityWon />
    );
    expect(screen.getByAltText("Opportunity Won")).toBeInTheDocument();
    expect(screen.getByText("Won")).toBeInTheDocument();
  });

  it("shows 'Work In Progress' when isOptyWorkInProgress is true", () => {
    renderWithTheme(
      <OpportunityProgressHeader {...baseProps} isOptyWorkInProgress />
    );
    expect(screen.getByAltText("Opportunity WIP")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders premium and brokerage correctly", () => {
    renderWithTheme(<OpportunityProgressHeader {...baseProps} />);
    expect(screen.getByText("₹10000")).toBeInTheDocument();
    expect(screen.getByText("₹1500")).toBeInTheDocument();
  });
});
