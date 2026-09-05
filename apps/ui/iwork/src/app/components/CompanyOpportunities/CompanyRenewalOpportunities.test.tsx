import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import CompanyRenewalOpportunities from "./CompanyRenewalOpportunities";
import { theme } from "@ui/ui-lib";
import { CellClickedEvent } from "ag-grid-community";

// Mock the ui-lib components
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useTableController: jest.fn(),
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

describe("CompanyRenewalOpportunities Component", () => {
  let queryClient: QueryClient;
  let mockStore: any;
  let mockTableController: any;

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

    mockStore = createMockStore();

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
    renderWithProviders(<CompanyRenewalOpportunities />);

    expect(screen.getByTestId("mock-table")).toBeInTheDocument();
  });

  it("renders opportunities table with correct data", () => {
    renderWithProviders(<CompanyRenewalOpportunities />);

    expect(screen.getByTestId("table-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("table-row-1")).toBeInTheDocument();
    expect(screen.getByText("Health Insurance")).toBeInTheDocument();
    expect(screen.getByText("Motor Insurance")).toBeInTheDocument();
    expect(screen.getByText("2024-12-31")).toBeInTheDocument();
    expect(screen.getByText("2024-11-30")).toBeInTheDocument();
  });

  it("calls useTableController with correct parameters", () => {
    renderWithProviders(<CompanyRenewalOpportunities />);

    expect(require("@ui/ui-lib").useTableController).toHaveBeenCalledWith({
      endpoint: "http://localhost:3000/opportunity/company/123",
      customPathParam: "type=RO",
      onError: expect.any(Function),
    });
  });

  it("handles cell clicks and navigates to opportunity details", () => {
    renderWithProviders(<CompanyRenewalOpportunities />);

    const cellButton = screen.getByTestId("cell-0");
    fireEvent.click(cellButton);

    expect(mockNavigate).toHaveBeenCalledWith("/opportunities/OPP-001");
  });

  it("handles cell clicks for different opportunity IDs", () => {
    renderWithProviders(<CompanyRenewalOpportunities />);

    const cellButton = screen.getByTestId("cell-1");
    fireEvent.click(cellButton);

    expect(mockNavigate).toHaveBeenCalledWith("/opportunities/OPP-002");
  });

  it("handles error state by dispatching showError action", () => {
    renderWithProviders(<CompanyRenewalOpportunities />);

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

  it("handles loading state correctly", () => {
    mockTableController.loading = true;
    require("@ui/ui-lib").useTableController.mockReturnValue(
      mockTableController
    );

    renderWithProviders(<CompanyRenewalOpportunities />);

    expect(screen.getByTestId("mock-table")).toBeInTheDocument();
  });

  it("handles empty data state", () => {
    mockTableController.rowData = [];
    mockTableController.totalRows = 0;
    require("@ui/ui-lib").useTableController.mockReturnValue(
      mockTableController
    );

    renderWithProviders(<CompanyRenewalOpportunities />);

    expect(screen.getByTestId("mock-table")).toBeInTheDocument();
    expect(screen.queryByTestId("table-row-0")).not.toBeInTheDocument();
  });

  it("passes correct props to Table component", () => {
    const { Table } = require("@ui/ui-lib");

    renderWithProviders(<CompanyRenewalOpportunities />);

    expect(Table).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.any(Array),
        rowData: mockTableController.rowData,
        totalRows: mockTableController.totalRows,
        currentPage: mockTableController.currentPage,
        loading: mockTableController.loading,
        setCurrentPage: mockTableController.setCurrentPage,
        pageSize: mockTableController.pageSize,
        pageSizeOptions: mockTableController.PAGE_SIZE_OPTIONS,
        setPageSize: mockTableController.setPageSize,
        onCellClicked: expect.any(Function),
        setSort: mockTableController.setSort,
        title: "",
        onPrimaryActionClick: expect.any(Function),
      }),
      {}
    );
  });

  it("sets up columns with correct configuration", () => {
    const { Table } = require("@ui/ui-lib");

    renderWithProviders(<CompanyRenewalOpportunities />);

    const tableProps = Table.mock.calls[0][0];
    const columns = tableProps.columns;

    expect(columns).toHaveLength(4);
    expect(columns[0]).toEqual(
      expect.objectContaining({
        field: "policyType.value",
        headerName: "Policy type",
      })
    );
    expect(columns[1]).toEqual(
      expect.objectContaining({
        field: "expiryDate",
        headerName: "Expiry date",
      })
    );
    expect(columns[2]).toEqual(
      expect.objectContaining({
        field: "sumInsured",
        headerName: "Sum insured",
      })
    );
    expect(columns[3]).toEqual(
      expect.objectContaining({
        field: "estimatedBrokerage",
        headerName: "Brokerage",
      })
    );
  });

  it("handles different company IDs from params", () => {
    jest
      .spyOn(require("react-router-dom"), "useParams")
      .mockReturnValue({ id: "456" });

    renderWithProviders(<CompanyRenewalOpportunities />);

    expect(require("@ui/ui-lib").useTableController).toHaveBeenCalledWith({
      endpoint: "http://localhost:3000/opportunity/company/456",
      customPathParam: "type=RO",
      onError: expect.any(Function),
    });
  });

  it("maintains table state correctly", () => {
    renderWithProviders(<CompanyRenewalOpportunities />);

    expect(mockTableController.setPageSize).not.toHaveBeenCalled();
    expect(mockTableController.setCurrentPage).not.toHaveBeenCalled();
    expect(mockTableController.setSort).not.toHaveBeenCalled();
    expect(mockTableController.setSmartSearch).not.toHaveBeenCalled();
  });
});
