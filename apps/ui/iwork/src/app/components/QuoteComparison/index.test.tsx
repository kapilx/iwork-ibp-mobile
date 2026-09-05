import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import QuoteComparisonCard from "./index"; // Adjust import path if needed

// Mocks
jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  Checkbox: ({ label, isChecked, onChange }: any) => (
    <input
      type="checkbox"
      data-testid={`checkbox-${label}`}
      checked={isChecked}
      onChange={onChange}
    />
  ),
  ChipRenderer: ({ value }: any) => <div data-testid="chip">{value}</div>,
}));

jest.mock("../OpportunityProgressStepper/opportunityCardTypes", () => ({
  OpportunityCompanyTypeStyleMap: {},
  OpportunitycrmLeadStyleMap: {},
}));

jest.mock(
  "../OpportunityProgressStepper/OpportunityProgessHeader/styles",
  () => ({
    ChipContainer: ({ children }: any) => (
      <div data-testid="chip-container">{children}</div>
    ),
    OpportunityStepperCompanyName: ({ children }: any) => <h3>{children}</h3>,
    CompanyTypeTypography: ({ children }: any) => <span>{children}</span>,
    LabelStyles: ({ children }: any) => <span>{children}</span>,
  })
);

jest.mock("./styles", () => ({
  CommonTypography: ({ children }: any) => <span>{children}</span>,
  ComparisonPrimarySection: ({ children }: any) => <div>{children}</div>,
  ComparisonSecondarySection: ({ children }: any) => <div>{children}</div>,
  QuoteComparisonMainContainer: ({ children }: any) => <div>{children}</div>,
  VersionContainer: ({ children, onClick }: any) => (
    <div data-testid="version-container" onClick={onClick}>
      {children}
    </div>
  ),
  VersionDetailsContainer: ({ children, className }: any) => (
    <div data-testid="version-details" className={className}>
      {children}
    </div>
  ),
  VersionTypography: ({ children }: any) => <p>{children}</p>,
}));

jest.mock("../Header/styles", () => ({
  DividerLine: () => <hr data-testid="divider" />,
}));

jest.mock("../../constants", () => ({
  NO_QUOTES_AVAILABLE: "No Quotes Available",
}));

describe("QuoteComparisonCard", () => {
  const defaultProps = {
    selectedInsurers: ["RFP"],
    setSelectedInsurers: jest.fn(),
    dynamicInsurers: ["Insurer A", "Insurer B"],
    versionData: {
      data: [
        {
          brokingSlipName: "Slip 1",
          owner: "Owner 1",
          opportunityType: "Retail",
        },
        {
          brokingSlipName: "Slip 2",
          owner: "Owner 2",
          opportunityType: "Wholesale",
        },
      ],
    },
    selectedVersionIndex: 0,
    setSelectedVersionIndex: jest.fn(),
    isQuoteNotAvailable: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the selected version's details", () => {
    render(<QuoteComparisonCard {...defaultProps} />);
    expect(screen.getByText("Slip 1")).toBeInTheDocument();
    expect(screen.getByText("Owner 1")).toBeInTheDocument();
    expect(screen.getByText("Retail")).toBeInTheDocument();
  });

  it("renders checkboxes for activity types", () => {
    render(<QuoteComparisonCard {...defaultProps} />);
    expect(screen.getByTestId("checkbox-RFP")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-Broking Slip")).toBeInTheDocument();
  });

  it("renders checkboxes for dynamic insurers", () => {
    render(<QuoteComparisonCard {...defaultProps} />);
    expect(screen.getByTestId("checkbox-Insurer A")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-Insurer B")).toBeInTheDocument();
  });

  it("calls setSelectedVersionIndex when version is clicked", () => {
    render(<QuoteComparisonCard {...defaultProps} selectedVersionIndex={1} />);
    fireEvent.click(screen.getByTestId("version-container"));
    expect(defaultProps.setSelectedVersionIndex).toHaveBeenCalledWith(0);
  });

  it("calls setSelectedInsurers when insurer checkbox is clicked", () => {
    render(<QuoteComparisonCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("checkbox-Insurer A"));
    expect(defaultProps.setSelectedInsurers).toHaveBeenCalled();
  });

  it("calls setSelectedInsurers when activity checkbox is clicked", () => {
    render(<QuoteComparisonCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("checkbox-Broking Slip"));
    expect(defaultProps.setSelectedInsurers).toHaveBeenCalled();
  });

  it("displays 'No Quotes Available' message if applicable", () => {
    render(
      <QuoteComparisonCard {...defaultProps} isQuoteNotAvailable={true} />
    );
    expect(screen.getByText("No Quotes Available")).toBeInTheDocument();
  });
});

describe("QuoteComparisonCard - handleCheckboxChange logic", () => {
  const baseProps = {
    selectedInsurers: ["RFP", "Broking Slip", "Insurer A"],
    setSelectedInsurers: jest.fn(),
    dynamicInsurers: ["Insurer A", "Insurer B"],
    versionData: {
      data: [
        {
          brokingSlipName: "Slip 1",
          owner: "Owner 1",
          opportunityType: "Retail",
        },
      ],
    },
    selectedVersionIndex: 0,
    setSelectedVersionIndex: jest.fn(),
    isQuoteNotAvailable: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes insurer from selectedInsurers when unchecking (filter logic)", () => {
    render(<QuoteComparisonCard {...baseProps} />);

    // Click on "Insurer A" checkbox to uncheck it (it's already in selectedInsurers)
    fireEvent.click(screen.getByTestId("checkbox-Insurer A"));

    // Should call setSelectedInsurers with "Insurer A" filtered out
    expect(baseProps.setSelectedInsurers).toHaveBeenCalledWith([
      "RFP",
      "Broking Slip",
    ]);
  });

  it("removes activity type from selectedInsurers when unchecking", () => {
    render(<QuoteComparisonCard {...baseProps} />);

    // Click on "RFP" checkbox to uncheck it (it's already in selectedInsurers)
    fireEvent.click(screen.getByTestId("checkbox-RFP"));

    // Should call setSelectedInsurers with "RFP" filtered out
    expect(baseProps.setSelectedInsurers).toHaveBeenCalledWith([
      "Broking Slip",
      "Insurer A",
    ]);
  });

  it("adds insurer to selectedInsurers when checking (spread logic)", () => {
    const propsWithoutInsurerB = {
      ...baseProps,
      selectedInsurers: ["RFP", "Broking Slip"],
    };
    render(<QuoteComparisonCard {...propsWithoutInsurerB} />);

    // Click on "Insurer B" checkbox to check it (it's not in selectedInsurers)
    fireEvent.click(screen.getByTestId("checkbox-Insurer B"));

    // Should call setSelectedInsurers with "Insurer B" added
    expect(propsWithoutInsurerB.setSelectedInsurers).toHaveBeenCalledWith([
      "RFP",
      "Broking Slip",
      "Insurer B",
    ]);
  });

  it("filters out the exact insurer that was clicked", () => {
    const propsWithSimilarNames = {
      ...baseProps,
      selectedInsurers: ["RFP", "Insurer", "Insurer A", "Insurer AA"],
      dynamicInsurers: ["Insurer", "Insurer A", "Insurer AA"],
    };
    render(<QuoteComparisonCard {...propsWithSimilarNames} />);

    // Click on "Insurer A" specifically
    fireEvent.click(screen.getByTestId("checkbox-Insurer A"));

    // Should only remove "Insurer A", not "Insurer" or "Insurer AA"
    expect(propsWithSimilarNames.setSelectedInsurers).toHaveBeenCalledWith([
      "RFP",
      "Insurer",
      "Insurer AA",
    ]);
  });
});
