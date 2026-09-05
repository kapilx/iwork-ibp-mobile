import React from "react";
import CompanyListing from "./index";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  useTableController,
  useFormWatcher,
} from "@ui/ui-lib";

jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  ...jest.requireActual("@ui/ui-lib"),
  useTableController: jest.fn(),
  useFormWatcher: jest.fn(),
  SmartSearch: (props: any) => (
    <div data-testid="smart-search">
      SmartSearch Component
      <button onClick={() => props.onReset()}>Reset</button>
    </div>
  ),
}));
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));
jest.mock("@ui/ui-lib", () => (props: any) => (
  <div data-testid="kpi-cards">KPICards Component</div>
));
jest.mock("@ui/ui-lib", () => (props: any) => (
  <div data-testid="table">
    Table Component
    <button data-testid="primary-action" onClick={props.onPrimaryActionClick}>
      {props.primaryActionLabel}
    </button>
    <button
      data-testid="cell-click"
      onClick={() =>
        props.onCellClicked({
          colDef: { field: "companyName" },
          data: { companyId: "123" },
        })
      }
    >
      Cell Click
    </button>
  </div>
));

describe("CompanyListing", () => {
  const mockNavigate = jest.fn();
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    (useTableController as jest.Mock).mockReturnValue({
      rowData: [{ companyId: "1", companyName: "TestCo" }],
      totalRows: 1,
      currentPage: 1,
      loading: false,
      setCurrentPage: jest.fn(),
      pageSize: 10,
      setPageSize: jest.fn(),
      PAGE_SIZE_OPTIONS: [10, 20, 50],
      searchTerm: "",
      setSearchTerm: jest.fn(),
      overallData: {},
      setSort: jest.fn(),
      setSmartSearch: jest.fn(),
      error: null,
    });

    (useFormWatcher as jest.Mock).mockReturnValue({
      selectedValues: {},
      handleReset: jest.fn(),
    });
  });

  it("renders without crashing and shows key components", () => {
    render(<CompanyListing />);

    expect(screen.getByText("Manage Company")).toBeInTheDocument();
    expect(screen.getByTestId("smart-search")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-cards")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByTestId("primary-action")).toHaveTextContent(
      "Create Company"
    );
  });

  it("navigates to /create with state when primary action clicked", () => {
    render(<CompanyListing />);
    const primaryActionBtn = screen.getByTestId("primary-action");
    fireEvent.click(primaryActionBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/create", {
      state: { pageTitle: "company", cta: "createCompany" },
    });
  });

  it("navigates to company details on table cell click if column is companyName", () => {
    render(<CompanyListing />);
    const cellClickBtn = screen.getByTestId("cell-click");
    fireEvent.click(cellClickBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/companies/123");
  });

  it("dispatches toast message on error", () => {
    const error = {
      response: { data: { message: "Some API error" } },
    };
    (useTableController as jest.Mock).mockReturnValueOnce({
      rowData: [],
      totalRows: 0,
      currentPage: 1,
      loading: false,
      setCurrentPage: jest.fn(),
      pageSize: 10,
      setPageSize: jest.fn(),
      PAGE_SIZE_OPTIONS: [10, 20, 50],
      searchTerm: "",
      setSearchTerm: jest.fn(),
      overallData: {},
      setSort: jest.fn(),
      setSmartSearch: jest.fn(),
      error,
    });

    render(<CompanyListing />);

    // Because useTableController calls onError internally and dispatches
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "slice/setToastMessage",
      payload: "Some API error",
    });
  });

  it("calls setSmartSearch when selectedValues from useFormWatcher change", () => {
    const setSmartSearchMock = jest.fn();
    const selectedValues = { companyName: "TestCo" };

    (useFormWatcher as jest.Mock).mockReturnValue({
      selectedValues,
      handleReset: jest.fn(),
    });

    (useTableController as jest.Mock).mockReturnValue({
      rowData: [],
      totalRows: 0,
      currentPage: 1,
      loading: false,
      setCurrentPage: jest.fn(),
      pageSize: 10,
      setPageSize: jest.fn(),
      PAGE_SIZE_OPTIONS: [10, 20, 50],
      searchTerm: "",
      setSearchTerm: jest.fn(),
      overallData: {},
      setSort: jest.fn(),
      setSmartSearch: setSmartSearchMock,
      error: null,
    });

    const { rerender } = render(<CompanyListing />);

    // We rerender to trigger useEffect with new selectedValues
    rerender(<CompanyListing />);

    expect(setSmartSearchMock).toHaveBeenCalledWith(selectedValues);
  });
});
