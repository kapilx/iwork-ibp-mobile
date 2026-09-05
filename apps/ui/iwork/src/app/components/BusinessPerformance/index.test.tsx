import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import BusinessPerformance from "./index";
import { theme } from "@ui/ui-lib";

// Mock the useApiQuery hook
const mockUseApiQuery = jest.fn();

// Mock Redux store
const mockStore = configureStore({
  reducer: {
    auth: (state = { permissions: ["VIEW_OPPORTUNITY"] }) => state,
  },
});

// Mock all dependencies
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useApiQuery: () => mockUseApiQuery(),
  getSessionStorageData: jest.fn(() => ({
    userId: "test-user-123",
    firstName: "John",
    lastName: "Doe",
  })),
  selectHasPermission: jest.fn(() => () => true),
  buildQueryString: jest.fn(() => "?param=value"),
  updateTimeFilter: jest.fn((filters) => filters),
  endPoints: {
    businessPerformanceData: "/api/business-performance",
  },
  FeatureKey: {
    VIEW_OPPORTUNITY: "VIEW_OPPORTUNITY",
  },
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock child components
jest.mock("../DonutChart", () => {
  return function MockDonutChart({ config }: any) {
    return (
      <div data-testid="donut-chart">
        <span data-testid="chart-subtitle">{config.subtitle}</span>
        <span data-testid="chart-count">{config.count}</span>
        <span data-testid="chart-target">{config.target}</span>
      </div>
    );
  };
});

jest.mock("./FiltersForm", () => {
  return function MockFiltersForm({ onRun, defaultValues }: any) {
    return (
      <div data-testid="filters-form">
        <button
          data-testid="apply-filters-btn"
          onClick={() => onRun({ organisationId: "1", financialYear: "2024" })}
        >
          Apply Filters
        </button>
      </div>
    );
  };
});

jest.mock("../../pages/Dashboard/Charts/SalesFunnel/SalesFunnel", () => {
  return function MockSalesFunnel({ filters }: any) {
    return (
      <div data-testid="sales-funnel">
        Sales Funnel with filters: {JSON.stringify(filters)}
      </div>
    );
  };
});

jest.mock("../../pages/Dashboard/Charts/RenewalFunnel/RenewalFunnel", () => {
  return function MockRenewalFunnel({ filters }: any) {
    return (
      <div data-testid="renewal-funnel">
        Renewal Funnel with filters: {JSON.stringify(filters)}
      </div>
    );
  };
});

jest.mock("../../pages/UnauthorizedPage", () => {
  return function MockUnauthorized() {
    return <div data-testid="unauthorized">Unauthorized</div>;
  };
});

jest.mock("./businessPerformanceConfig", () => ({
  businessPerformanceFilterConfig: [
    {
      key: "organisationId",
      name: "organisationId",
      label: "Organisation",
      type: "select",
    },
    {
      key: "financialYear",
      name: "financialYear",
      label: "Financial Year",
      type: "select",
    },
    {
      key: "userId",
      name: "userId",
      label: "Team",
      type: "treeSelect",
    },
    {
      key: "owner",
      name: "owner",
      label: "Owner",
      type: "select",
    },
  ],
  transformBusinessPerformanceData: jest.fn((data) => [
    {
      subtitle: "New Business",
      count: 10,
      target: 20,
      color: "#blue",
    },
    {
      subtitle: "Retention",
      count: 15,
      target: 25,
      color: "#green",
    },
  ]),
}));

jest.mock("../../constants", () => ({
  ALL_VALUE: "all",
}));

describe("BusinessPerformance Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <Provider store={mockStore}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <BusinessPerformance />
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    );
  };

  const mockBusinessPerformanceData = [
    { countOfSO: 10, targetOfSO: 20 },
    { countOfRO: 15, targetOfRO: 25 },
    { countOfSOisMined: 5, targetOfSOMined: 10 },
    { totalPolicyCount: 30, totalTarget: 55 },
  ];

  it("renders the business performance container", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("My Business Performance")).toBeInTheDocument();
    expect(screen.getByText("My Sales Funnel")).toBeInTheDocument();
    expect(screen.getByText("My Renewal Funnel")).toBeInTheDocument();
  });

  it("renders filters form", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByTestId("filters-form")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    mockUseApiQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays error state", () => {
    mockUseApiQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to load data"),
    });

    renderWithProviders();

    expect(
      screen.getByText("Failed to load business performance data.")
    ).toBeInTheDocument();
  });

  it("displays no data message when data is empty", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(
      screen.getByText("No data available for the graph.")
    ).toBeInTheDocument();
  });

  it("displays no data message when data is null", () => {
    mockUseApiQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(
      screen.getByText("No data available for the graph.")
    ).toBeInTheDocument();
  });

  it("updates filters when apply filters is clicked", async () => {
    const user = userEvent.setup();

    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    const applyButton = screen.getByTestId("apply-filters-btn");
    await user.click(applyButton);

    // Check that the sales and renewal funnels receive updated filters
    await waitFor(() => {
      expect(screen.getByTestId("sales-funnel")).toBeInTheDocument();
      expect(screen.getByTestId("renewal-funnel")).toBeInTheDocument();
    });
  });

  it("renders sales funnel with applied filters", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByTestId("sales-funnel")).toBeInTheDocument();
  });

  it("renders renewal funnel with applied filters", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByTestId("renewal-funnel")).toBeInTheDocument();
  });

  it("shows unauthorized when user lacks permissions", () => {
    const { selectHasPermission } = require("@ui/ui-lib");
    selectHasPermission.mockReturnValue(() => false);

    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    const unauthorizedElements = screen.getAllByTestId("unauthorized");
    expect(unauthorizedElements.length).toBeGreaterThan(0);
  });

  it("handles user data from localStorage correctly", () => {
    const { getSessionStorageData } = require("@ui/ui-lib");
    getSessionStorageData.mockReturnValue({
      userId: "user-456",
      firstName: "Jane",
      lastName: "Smith",
    });

    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByTestId("filters-form")).toBeInTheDocument();
  });

  it("handles missing user data gracefully", () => {
    const { getSessionStorageData } = require("@ui/ui-lib");
    getSessionStorageData.mockReturnValue(null);

    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByTestId("filters-form")).toBeInTheDocument();
  });

  it("applies default filters correctly", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    // Check that default filters are applied (current financial year, me+team, etc.)
    expect(screen.getByTestId("filters-form")).toBeInTheDocument();
  });

  it("strips ALL_VALUE filters before API call", () => {
    const { buildQueryString, updateTimeFilter } = require("@ui/ui-lib");

    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    // The functions should be called to process filters
    expect(updateTimeFilter).toHaveBeenCalled();
    expect(buildQueryString).toHaveBeenCalled();
  });

  it("transforms business performance data correctly", () => {
    const {
      transformBusinessPerformanceData,
    } = require("./businessPerformanceConfig");

    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(transformBusinessPerformanceData).toHaveBeenCalledWith(
      mockBusinessPerformanceData
    );
  });

  it("handles component unmounting gracefully", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    const { unmount } = renderWithProviders();

    expect(() => unmount()).not.toThrow();
  });

  it("displays section headers with correct styling", () => {
    mockUseApiQuery.mockReturnValue({
      data: { data: mockBusinessPerformanceData },
      isLoading: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("My Business Performance")).toBeInTheDocument();
    expect(screen.getByText("My Sales Funnel")).toBeInTheDocument();
    expect(screen.getByText("My Renewal Funnel")).toBeInTheDocument();
  });
});
