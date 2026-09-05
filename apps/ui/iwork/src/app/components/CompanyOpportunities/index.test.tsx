import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import CompanySalesOpportunities, { CompanyData } from "./index";
import { opportunityColumns, setLocalizationConfig } from "./config";
import { theme } from "@ui/ui-lib";
import { CellClickedEvent } from "ag-grid-community";

// Mock the ui-lib components
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useTableController: jest.fn(),
  formatCurrencyByLocalization: jest.fn((value, localization) => {
    if (localization?.currency === "USD") {
      return `$${value.toLocaleString()}`;
    }
    return `₹${value.toLocaleString()}`;
  }),
  Table: jest.fn(({ onCellClicked, rowData }) => (
    <div data-testid="mock-table">
      {rowData?.map((row: any, index: number) => (
        <div key={index} data-testid={`table-row-${index}`}>
          <button
            onClick={() =>
              onCellClicked({
                data: row,
                colDef: { field: "policyType.value" },
                value: row.policyType?.value,
              } as CellClickedEvent)
            }
            data-testid={`cell-${index}`}
          >
            {row.policyType?.value}
          </button>
          <span>{row.expiryDate}</span>
          <span>{row.sumInsured}</span>
        </div>
      ))}
    </div>
  )),
  Button: jest.fn(({ children, onClick, variantType }) => (
    <button
      data-testid="mock-button"
      onClick={onClick}
      data-variant={variantType}
    >
      {children}
    </button>
  )),
  ImageText: jest.fn(({ sectionTitle }) => (
    <div data-testid="mock-image-text">{sectionTitle}</div>
  )),
  AccordionTitles: {
    COMPANY_SELECTION: "COMPANY_SELECTION",
    CONTACT_SELECTION: "CONTACT_SELECTION",
  },
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    opportunityUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "123" }),
  useLocation: () => ({
    state: {
      existingState: "value",
    },
    pathname: "/companies/123",
  }),
}));

// Mock store configuration
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      root: (state = initialState) => state,
    },
    preloadedState: { root: initialState },
  });
};

// Mock react-redux dispatch
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("CompanySalesOpportunities Component", () => {
  let queryClient: QueryClient;
  let mockTableController: any;
  let mockCompanyData: CompanyData;

  const renderWithProviders = (
    component: React.ReactElement,
    storeState = {}
  ) => {
    const store = createMockStore(storeState);

    return render(
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter>{component}</MemoryRouter>
          </QueryClientProvider>
        </Provider>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockCompanyData = {
      companyId: 123,
      companyName: "Test Company",
      displayName: "Test Company Display",
    };

    mockTableController = {
      pageSize: 10,
      setPageSize: jest.fn(),
      currentPage: 1,
      setCurrentPage: jest.fn(),
      loading: false,
      rowData: [
        {
          id: "1",
          opportunityId: "OPP-001",
          policyType: { value: "Health Insurance" },
          expiryDate: "2024-12-31",
          sumInsured: 50000,
          estimatedBrokerage: 5000,
        },
        {
          id: "2",
          opportunityId: "OPP-002",
          policyType: { value: "Motor Insurance" },
          expiryDate: "2024-11-30",
          sumInsured: 75000,
          estimatedBrokerage: 7500,
        },
      ],
      totalRows: 2,
      searchTerm: "",
      setSearchTerm: jest.fn(),
      PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
      overallData: {
        data: [
          {
            id: "1",
            opportunityId: "OPP-001",
            policyType: { value: "Health Insurance" },
            expiryDate: "2024-12-31",
            sumInsured: 50000,
            estimatedBrokerage: 5000,
          },
          {
            id: "2",
            opportunityId: "OPP-002",
            policyType: { value: "Motor Insurance" },
            expiryDate: "2024-11-30",
            sumInsured: 75000,
            estimatedBrokerage: 7500,
          },
        ],
        count: 2,
      },
      setSort: jest.fn(),
      setSmartSearch: jest.fn(),
      error: null,
    };

    // Mock useTableController
    require("@ui/ui-lib").useTableController.mockReturnValue(
      mockTableController
    );

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("renders the component with default props", () => {
    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="opportunities"
      />
    );

    expect(screen.getByTestId("mock-table")).toBeInTheDocument();
    expect(screen.getByTestId("mock-button")).toBeInTheDocument();
    expect(screen.getByTestId("mock-image-text")).toBeInTheDocument();
  });

  it("renders opportunities table with correct data", () => {
    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="opportunities"
      />
    );

    expect(screen.getByTestId("table-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("table-row-1")).toBeInTheDocument();
    expect(screen.getByText("Health Insurance")).toBeInTheDocument();
    expect(screen.getByText("Motor Insurance")).toBeInTheDocument();
    expect(screen.getByText("2024-12-31")).toBeInTheDocument();
    expect(screen.getByText("2024-11-30")).toBeInTheDocument();
  });

  it("calls useTableController with correct parameters", () => {
    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="opportunities"
      />
    );

    expect(require("@ui/ui-lib").useTableController).toHaveBeenCalledWith({
      endpoint: "http://localhost:3000/opportunity/company/123",
      customPathParam: "excludeWon=true",
      onError: expect.any(Function),
    });
  });

  it("displays section title without count when no data", () => {
    mockTableController.totalRows = 0;
    mockTableController.rowData = [];
    require("@ui/ui-lib").useTableController.mockReturnValue(
      mockTableController
    );

    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="opportunities"
      />
    );

    expect(screen.getByText("Opportunities")).toBeInTheDocument();
  });

  it("renders Add opportunity button with correct variant", () => {
    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="opportunities"
      />
    );

    const button = screen.getByTestId("mock-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-variant", "secondary");
    expect(button).toHaveTextContent("Add opportunity");
  });

  it("handles cell clicks and navigates to opportunity details", () => {
    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="opportunities"
      />
    );

    const cellButton = screen.getByTestId("cell-0");
    fireEvent.click(cellButton);

    expect(mockNavigate).toHaveBeenCalledWith("/opportunities/OPP-001");
  });

  it("handles cell clicks for different opportunity IDs", () => {
    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="opportunities"
      />
    );

    const cellButton = screen.getByTestId("cell-1");
    fireEvent.click(cellButton);

    expect(mockNavigate).toHaveBeenCalledWith("/opportunities/OPP-002");
  });

  it("handles Add opportunity button click with correct navigation state", () => {
    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="test-tab"
      />
    );

    const addButton = screen.getByTestId("mock-button");
    fireEvent.click(addButton);

    expect(mockNavigate).toHaveBeenCalledWith("/create2", {
      state: {
        existingState: "value",
        COMPANY_SELECTION: {
          companyName: "Test Company",
          id: 123,
          label: "Test Company",
        },
        searchedString: "Test Company",
        isCreated: false,
        pathname: "CONTACT_SELECTION",
        originPath: "/companies/123",
        activeTabKey: "test-tab",
      },
    });
  });

  it("uses displayName when companyName is not available", () => {
    const companyDataWithDisplayName = {
      companyId: 456,
      displayName: "Display Name Only",
    };

    renderWithProviders(
      <CompanySalesOpportunities
        companyData={companyDataWithDisplayName}
        activeTabKey="test-tab"
      />
    );

    const addButton = screen.getByTestId("mock-button");
    fireEvent.click(addButton);

    expect(mockNavigate).toHaveBeenCalledWith("/create2", {
      state: expect.objectContaining({
        COMPANY_SELECTION: {
          companyName: "Display Name Only",
          id: 456,
          label: "Display Name Only",
        },
        searchedString: "Display Name Only",
      }),
    });
  });

  it("handles error state by dispatching setToastMessage action", () => {
    renderWithProviders(
      <CompanySalesOpportunities
        companyData={mockCompanyData}
        activeTabKey="opportunities"
      />
    );

    // Get the onError function from useTableController call
    const onErrorFunction =
      require("@ui/ui-lib").useTableController.mock.calls[0][0].onError;

    // Simulate an error
    const testError = {
      response: {
        data: {
          message: "Test error message",
        },
      },
    };
    onErrorFunction(testError);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining("setToastMessage"),
        payload: "Test error message",
      })
    );
  });

  describe("Column Value Formatters", () => {
    beforeEach(() => {
      // Reset localization before each test
      setLocalizationConfig(undefined);
    });

    it("formats currency values using formatCurrencyByLocalization for sumInsured", () => {
      const sumInsuredColumn = opportunityColumns.find(
        (col) => col.field === "sumInsured"
      );
      const formatter = sumInsuredColumn?.valueFormatter as (params: {
        value: any;
      }) => string;

      // Test with valid numeric value
      const result = formatter({ value: 50000 });
      expect(result).toBe("₹50,000");
      expect(
        require("@ui/ui-lib").formatCurrencyByLocalization
      ).toHaveBeenCalledWith(50000, undefined);
    });

    it("formats currency values using formatCurrencyByLocalization for estimatedBrokerage", () => {
      const brokerageColumn = opportunityColumns.find(
        (col) => col.field === "estimatedBrokerage"
      );
      const formatter = brokerageColumn?.valueFormatter as (params: {
        value: any;
      }) => string;

      // Test with valid numeric value
      const result = formatter({ value: 7500 });
      expect(result).toBe("₹7,500");
      expect(
        require("@ui/ui-lib").formatCurrencyByLocalization
      ).toHaveBeenCalledWith(7500, undefined);
    });

    it("returns '--' for null values in currency columns", () => {
      const sumInsuredColumn = opportunityColumns.find(
        (col) => col.field === "sumInsured"
      );
      const formatter = sumInsuredColumn?.valueFormatter as (params: {
        value: any;
      }) => string;

      const result = formatter({ value: null });
      expect(result).toBe("--");
      expect(
        require("@ui/ui-lib").formatCurrencyByLocalization
      ).not.toHaveBeenCalled();
    });

    it("returns '--' for undefined values in currency columns", () => {
      const brokerageColumn = opportunityColumns.find(
        (col) => col.field === "estimatedBrokerage"
      );
      const formatter = brokerageColumn?.valueFormatter as (params: {
        value: any;
      }) => string;

      const result = formatter({ value: undefined });
      expect(result).toBe("--");
      expect(
        require("@ui/ui-lib").formatCurrencyByLocalization
      ).not.toHaveBeenCalled();
    });
  });
});
