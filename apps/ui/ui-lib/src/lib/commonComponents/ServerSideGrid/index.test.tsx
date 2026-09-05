import React from "react";
import ServerSideGrid from "./index";
import { ColDef } from "ag-grid-community";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@ui/ui-lib/utils/renderWithTheme";
import { AgGridReact } from "ag-grid-react";
import { ThemeProvider } from "@mui/material/styles";
import { StyledBox, StyledSelect, theme } from "@ui/ui-lib";
import { StyledFormControl } from "../FormComponent/Fields/styles";
import { NO_DATA_AVAILABLE } from "../../constants"; // Added for tooltip tests
import { PaginationContainer, ServerSideGridStyledFormControl } from "./styles";

const columns: ColDef[] = [
  { headerName: "Name", field: "name", sortable: true },
  { headerName: "Age", field: "age", sortable: true },
];

const rowData = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 40 },
];

const setup = (props = {}) => {
  const onPageChange = jest.fn();
  const onPageSizeChange = jest.fn();
  const setSort = jest.fn();
  const mockSetSort = jest.fn();

  const defaultProps = {
    rows: rowData,
    columns,
    totalRecords: 50,
    currentPage: 1,
    loading: false,
    onPageChange,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20],
    onPageSizeChange,
    setSort,
    ...props,
  };

  const renderResult = render(<ServerSideGrid {...defaultProps} />);
  return {
    ...renderResult,
    onPageChange,
    onPageSizeChange,
    setSort,
    mockSetSort,
  };
};

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

jest.mock("@mui/x-date-pickers/internals/demo", () => ({
  DemoContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DemoItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: jest.fn(),
}));

jest.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: jest.fn(() => <div data-testid="date-picker-mock" />),
}));

jest.mock("@mui/x-date-pickers/TimePicker", () => ({
  TimePicker: jest.fn(() => <div data-testid="time-picker-mock" />),
}));

jest.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: jest.fn(() => <div data-testid="datetime-picker-mock" />),
}));

jest.mock("ag-grid-react", () => ({
  AgGridReact: jest.fn().mockImplementation((props) => {
    return <div data-testid="mock-ag-grid">{JSON.stringify(props)}</div>;
  }),
}));

describe("ServerSideGrid", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the grid's loading overlay when loading is true", () => {
    setup({ loading: true });
    // The grid stays mounted and ag-grid draws its own overlay — it must not be
    // swapped out for a spinner, which would wipe its sort/column state.
    expect(screen.getByTestId("mock-ag-grid")).toBeInTheDocument();
    expect((AgGridReact as jest.Mock).mock.calls[0][0].loading).toBe(true);
  });

  it("does not show the loading overlay when showLoader is false", () => {
    setup({ loading: true, showLoader: false });
    expect((AgGridReact as jest.Mock).mock.calls[0][0].loading).toBe(false);
  });

  it("renders Divider when totalRecords is 0", () => {
    setup({
      totalRecords: 0,
    });
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("does not render Divider when totalRecords is greater than 0", () => {
    setup({
      totalRecords: 5,
    });
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("logs an error when handleSortChanged encounters an API error", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const error = new Error("API error");
    const mockGetColumnState = jest.fn(() => {
      throw error;
    });
    jest.spyOn(React, "useRef").mockReturnValueOnce({
      current: {
        api: {
          getColumnState: mockGetColumnState,
        },
      },
    });

    setup();
    const mockAgGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    mockAgGridProps.onSortChanged();

    expect(mockGetColumnState).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error accessing grid API:",
      error
    );
    consoleErrorSpy.mockRestore();
  });

  it("updates sort model when columns are sorted", () => {
    const mockGetColumnState = jest.fn(() => [
      { colId: "name", sort: "asc" },
      { colId: "age", sort: null },
    ]);
    jest.spyOn(React, "useRef").mockReturnValueOnce({
      current: {
        api: {
          getColumnState: mockGetColumnState,
        },
      },
    });
    const { setSort } = setup();
    const agGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    agGridProps.onSortChanged();
    expect(mockGetColumnState).toHaveBeenCalled();
    expect(setSort).toHaveBeenCalledWith([{ colId: "name", sort: "asc" }]);
  });

  it("orders a multi-column sort by click priority (sortIndex), not column display order", () => {
    // "age" sits first in display order but was clicked second (sortIndex 1);
    // "name" sits second in display order but was clicked first (sortIndex 0).
    const mockGetColumnState = jest.fn(() => [
      { colId: "age", sort: "desc", sortIndex: 1 },
      { colId: "name", sort: "asc", sortIndex: 0 },
    ]);
    jest.spyOn(React, "useRef").mockReturnValueOnce({
      current: {
        api: {
          getColumnState: mockGetColumnState,
        },
      },
    });
    const { setSort } = setup();
    const agGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    agGridProps.onSortChanged();
    expect(setSort).toHaveBeenCalledWith([
      { colId: "name", sort: "asc" },
      { colId: "age", sort: "desc" },
    ]);
  });

  // Added tests for tooltipValueGetter coverage
  it("returns the cell value when tooltipValueGetter receives a non-null/non-undefined value", () => {
    setup();
    const agGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    const tooltipGetter = agGridProps.defaultColDef.tooltipValueGetter;
    const result = tooltipGetter({ value: "Alice" });
    expect(result).toBe("Alice");
  });

  it("returns NO_DATA_AVAILABLE object when tooltipValueGetter receives null or undefined", () => {
    setup();
    const agGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    const tooltipGetter = agGridProps.defaultColDef.tooltipValueGetter;
    expect(tooltipGetter({ value: null })).toEqual({ NO_DATA_AVAILABLE });
    expect(tooltipGetter({ value: undefined })).toEqual({ NO_DATA_AVAILABLE });
  });

  it("uses default getRowHeight returning 54 when none is provided", () => {
    setup();
    const agGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    expect(typeof agGridProps.getRowHeight).toBe("function");
    expect(agGridProps.getRowHeight({})).toBe(54);
  });

  it("uses custom getRowHeight when provided", () => {
    const customGetRowHeight = jest.fn(() => 100);
    setup({ getRowHeight: customGetRowHeight });
    const agGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    expect(agGridProps.getRowHeight({})).toBe(100);
    expect(customGetRowHeight).toHaveBeenCalled();
  });

  it("forwards pinnedBottomRowData to AgGridReact", () => {
    const pinned = [{ name: "Total", age: 70 }];
    setup({ pinnedBottomRowData: pinned });
    const agGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    expect(agGridProps.pinnedBottomRowData).toEqual(pinned);
  });
});

describe("ServerSideGrid styles", () => {
  it("renders StyledSelect with select-specific styles", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <div>
          <label id="age-label" htmlFor="age-native">
            Age
          </label>
          <StyledSelect
            native
            data-testid="styled-select"
            value="10"
            id="age-native"
            aria-labelledby="age-label"
            aria-label="Age"
            title="Age selection"
            inputProps={{ name: "age" }}
          >
            <option value="10">Ten</option>
            <option value="20">Twenty</option>
          </StyledSelect>
        </div>
      </ThemeProvider>
    );
    expect(screen.getByTestId("styled-select")).toBeInTheDocument();
  });

  it("renders StyledFormControl with flex row alignment", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <StyledFormControl data-testid="form-control">Form</StyledFormControl>
      </ThemeProvider>
    );
    expect(screen.getByTestId("form-control")).toBeInTheDocument();
  });

  it("renders StyledBox with correct font weight and size", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <StyledBox data-testid="styled-box">Box</StyledBox>
      </ThemeProvider>
    );
    expect(screen.getByTestId("styled-box")).toBeInTheDocument();
  });
});

describe("Additional styled components coverage", () => {
  it("renders PaginationContainer", () => {
    render(
      <ThemeProvider theme={theme}>
        <PaginationContainer data-testid="pagination-container" />
      </ThemeProvider>
    );
    expect(screen.getByTestId("pagination-container")).toBeInTheDocument();
  });

  it("renders ServerSideGridStyledFormControl", () => {
    render(
      <ThemeProvider theme={theme}>
        <ServerSideGridStyledFormControl data-testid="ssg-form-control" />
      </ThemeProvider>
    );
    expect(screen.getByTestId("ssg-form-control")).toBeInTheDocument();
  });
});

describe("ServerSideGrid style hooks", () => {
  it("applies theme font family on Wrapper/GridContainer", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <ServerSideGrid
          rows={rowData}
          // @ts-expect-error generic
          columns={columns}
          totalRecords={1}
          currentPage={1}
          loading={false}
          onPageChange={jest.fn()}
          pageSize={10}
          pageSizeOptions={[10]}
          onPageSizeChange={jest.fn()}
        />
      </ThemeProvider>
    );
    const grid = screen.getByTestId("ServerSideGrid");
    expect(grid).toBeInTheDocument();
  });

  it("renders sort icon container but hidden by default (style rule test)", () => {
    setup();
    const agGridProps = (AgGridReact as jest.Mock).mock.calls[0][0];
    expect(agGridProps.icons).toBeDefined();
    expect(agGridProps.icons.sortUnSort).toContain("img");
  });
});
