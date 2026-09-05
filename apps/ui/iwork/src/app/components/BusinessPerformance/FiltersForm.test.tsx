import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FiltersForm from "./FiltersForm";
import { theme } from "@ui/ui-lib";
import React from "react";

// Mock the DynamicForm component
const mockFormMethods = {
  watch: jest.fn((callback: any) => ({ unsubscribe: jest.fn() })),
  reset: jest.fn(),
  getValues: jest.fn(() => ({})),
};

jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  Button: ({ label, onClick, variantType, sx, ...props }: any) => (
    <button onClick={onClick} data-testid={`button-${variantType}`} {...props}>
      {label}
    </button>
  ),
  DynamicForm: jest.fn(
    ({ formConfig, defaultValues, formMethods, sx }: any) => {
      // Call formMethods callback with mock methods when component is rendered
      if (formMethods) {
        formMethods(mockFormMethods);
      }

      return (
        <div data-testid="dynamic-form">
          {formConfig?.map((field: any) => (
            <div key={field.key} data-testid={`field-${field.key}`}>
              <label>{field.label}</label>
            </div>
          ))}
        </div>
      );
    }
  ),
  getSessionStorageData: jest.fn(() => ({
    userId: "test-user-123",
    username: "testuser",
  })),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock the configuration imports
jest.mock("./businessPerformanceConfig", () => ({
  businessPerformanceFilterConfig: [
    {
      key: "organisationId",
      name: "organisationId",
      label: "Organisation",
      type: "select",
      gridColumn: 2.2,
    },
    {
      key: "financialYear",
      name: "financialYear",
      label: "Financial Year",
      type: "select",
      gridColumn: 2.2,
    },
    {
      key: "quarter",
      name: "quarter",
      label: "Quarter",
      type: "select",
      gridColumn: 2.2,
    },
    {
      key: "month",
      name: "month",
      label: "Month",
      type: "select",
      options: [],
      gridColumn: 2.2,
    },
    {
      key: "userId",
      name: "userId",
      label: "Owner",
      type: "treeSelect",
      gridColumn: 2.2,
    },
    {
      key: "owner",
      name: "owner",
      label: "Owner",
      type: "select",
      gridColumn: 2.2,
    },
  ],
  getAllMonths: jest.fn(() => [
    { value: "all", label: "All" },
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "April", label: "April" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "July", label: "July" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "October", label: "October" },
    { value: "November", label: "November" },
    { value: "December", label: "December" },
  ]),
  getMonthsForQuarter: jest.fn((quarter: string) => {
    const quarterMonths = {
      Q1: [
        { value: "April", label: "April" },
        { value: "May", label: "May" },
        { value: "June", label: "June" },
      ],
      Q2: [
        { value: "July", label: "July" },
        { value: "August", label: "August" },
        { value: "September", label: "September" },
      ],
      Q3: [
        { value: "October", label: "October" },
        { value: "November", label: "November" },
        { value: "December", label: "December" },
      ],
      Q4: [
        { value: "January", label: "January" },
        { value: "February", label: "February" },
        { value: "March", label: "March" },
      ],
    };
    return quarterMonths[quarter as keyof typeof quarterMonths] || [];
  }),
}));

jest.mock("../../constants", () => ({
  ALL_VALUE: "all",
}));

describe("FiltersForm Component", () => {
  let queryClient: QueryClient;
  const mockOnRun = jest.fn();

  const defaultProps = {
    onRun: mockOnRun,
    defaultValues: {
      organisationId: "1",
      financialYear: "2024",
      quarter: "all",
      month: "all",
      userId: "test-user-123",
      owner: "me+team",
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
    mockFormMethods.getValues.mockReturnValue(defaultProps.defaultValues);
  });

  const renderWithTheme = (props = defaultProps) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <FiltersForm {...props} />
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  it("renders the filters form container", () => {
    renderWithTheme();

    expect(screen.getByTestId("dynamic-form")).toBeInTheDocument();
  });

  it("renders all filter fields correctly", () => {
    renderWithTheme();

    expect(screen.getByTestId("field-organisationId")).toBeInTheDocument();
    expect(screen.getByTestId("field-financialYear")).toBeInTheDocument();
    expect(screen.getByTestId("field-quarter")).toBeInTheDocument();
    expect(screen.getByTestId("field-month")).toBeInTheDocument();
    expect(screen.getByTestId("field-userId")).toBeInTheDocument();
    expect(screen.getByTestId("field-owner")).toBeInTheDocument();
  });

  it("displays correct field labels", () => {
    renderWithTheme();

    expect(screen.getByText("Organisation")).toBeInTheDocument();
    expect(screen.getByText("Financial Year")).toBeInTheDocument();
    expect(screen.getByText("Quarter")).toBeInTheDocument();
    expect(screen.getByText("Month")).toBeInTheDocument();
    expect(screen.getByText("Team (Hierarchy)")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("renders Reset and Run buttons", () => {
    renderWithTheme();

    expect(screen.getByTestId("button-secondary")).toBeInTheDocument();
    expect(screen.getByTestId("button-primary")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
    expect(screen.getByText("Run")).toBeInTheDocument();
  });

  it("calls onRun with form values when Run button is clicked", async () => {
    const user = userEvent.setup();
    renderWithTheme();

    const runButton = screen.getByTestId("button-primary");
    await user.click(runButton);

    expect(mockOnRun).toHaveBeenCalledWith(defaultProps.defaultValues);
  });

  it("resets form and calls onRun when Reset button is clicked", async () => {
    const user = userEvent.setup();
    renderWithTheme();

    const resetButton = screen.getByTestId("button-secondary");
    await user.click(resetButton);

    expect(mockFormMethods.reset).toHaveBeenCalled();
    expect(mockOnRun).toHaveBeenCalled();
  });

  it("handles default values correctly", () => {
    const customDefaultValues = {
      organisationId: "2",
      financialYear: "2023",
      quarter: "Q1",
      month: "January",
      userId: "custom-user-456",
      owner: "me",
    };

    renderWithTheme({
      onRun: mockOnRun,
      defaultValues: customDefaultValues,
    });

    expect(screen.getByTestId("dynamic-form")).toBeInTheDocument();
  });

  it("handles empty default values", () => {
    renderWithTheme({
      onRun: mockOnRun,
      defaultValues: {} as any,
    });

    expect(screen.getByTestId("dynamic-form")).toBeInTheDocument();
  });

  it("applies correct Grid layout structure", () => {
    const { container } = renderWithTheme();

    const gridContainers = (container as any).querySelectorAll(
      ".MuiGrid-container"
    );
    expect(gridContainers.length).toBeGreaterThan(0);
  });

  it("handles form methods setup correctly", async () => {
    renderWithTheme();

    await waitFor(() => {
      expect(mockFormMethods.watch).toHaveBeenCalled();
    });
  });

  it("handles quarter selection and month filtering", async () => {
    renderWithTheme();

    // The form should setup the watch subscription
    expect(mockFormMethods.watch).toHaveBeenCalled();
  });

  it("filters months based on selected quarter - Q1", () => {
    let watchCallback: (values: any) => void;

    // Mock the watch function to capture the callback
    mockFormMethods.watch.mockImplementation((callback) => {
      watchCallback = callback;
      return { unsubscribe: jest.fn() };
    });

    const { getMonthsForQuarter } = require("./businessPerformanceConfig");

    renderWithTheme();

    // Simulate quarter Q1 selection
    const mockValues = { quarter: "Q1" };
    watchCallback!(mockValues);

    expect(getMonthsForQuarter).toHaveBeenCalledWith("Q1");
  });

  it("filters months based on selected quarter - Q2", () => {
    let watchCallback: (values: any) => void;

    mockFormMethods.watch.mockImplementation((callback) => {
      watchCallback = callback;
      return { unsubscribe: jest.fn() };
    });

    const { getMonthsForQuarter } = require("./businessPerformanceConfig");

    renderWithTheme();

    // Simulate quarter Q2 selection
    const mockValues = { quarter: "Q2" };
    watchCallback!(mockValues);

    expect(getMonthsForQuarter).toHaveBeenCalledWith("Q2");
  });

  it("filters months based on selected quarter - Q3", () => {
    let watchCallback: (values: any) => void;

    mockFormMethods.watch.mockImplementation((callback) => {
      watchCallback = callback;
      return { unsubscribe: jest.fn() };
    });

    const { getMonthsForQuarter } = require("./businessPerformanceConfig");

    renderWithTheme();

    // Simulate quarter Q3 selection
    const mockValues = { quarter: "Q3" };
    watchCallback!(mockValues);

    expect(getMonthsForQuarter).toHaveBeenCalledWith("Q3");
  });

  it("handles user data from sessionStorage", () => {
    const { getSessionStorageData } = require("@ui/ui-lib");
    getSessionStorageData.mockReturnValue({
      userId: "test-user-456",
      username: "testuser2",
    });

    renderWithTheme();

    expect(screen.getByTestId("dynamic-form")).toBeInTheDocument();
  });

  it("handles missing user data gracefully", () => {
    const { getSessionStorageData } = require("@ui/ui-lib");
    getSessionStorageData.mockReturnValue(null);

    renderWithTheme();

    expect(screen.getByTestId("dynamic-form")).toBeInTheDocument();
  });

  it("handles form submission with different values", async () => {
    const user = userEvent.setup();
    const customValues = {
      organisationId: "3",
      financialYear: "2025",
      quarter: "Q2",
    };

    mockFormMethods.getValues.mockReturnValue(customValues);
    renderWithTheme();

    const runButton = screen.getByTestId("button-primary");
    await user.click(runButton);

    expect(mockOnRun).toHaveBeenCalledWith(customValues);
  });

  it("handles reset with current financial year default", async () => {
    const user = userEvent.setup();

    renderWithTheme();

    const resetButton = screen.getByTestId("button-secondary");
    await user.click(resetButton);

    expect(mockFormMethods.reset).toHaveBeenCalled();
    expect(mockOnRun).toHaveBeenCalled();
  });
});
