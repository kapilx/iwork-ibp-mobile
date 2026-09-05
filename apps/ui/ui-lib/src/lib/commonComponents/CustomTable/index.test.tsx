import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import CustomTable from "./index";

// Mock styled components from CustomTable styles
jest.mock("./styles", () => ({
  CustomTableGridContainer: (props: any) => (
    <div data-testid="grid-container" className={props.className}>
      {props.children}
    </div>
  ),
  CustomTableWrapper: (props: any) => (
    <div data-testid="wrapper">{props.children}</div>
  ),
}));

// Mock ag-grid dependencies
jest.mock("ag-grid-community", () => ({
  ClientSideRowModelModule: {},
}));

jest.mock("ag-grid-react", () => ({
  AgGridReact: jest.fn(() => <div data-testid="ag-grid-mock" />),
}));

// Mock Pagination component
jest.mock("../Pagination", () => (props: any) => (
  <div data-testid="pagination-mock">Pagination</div>
));

// Mock ServerSideGrid styles
jest.mock("../ServerSideGrid/styles", () => ({
  PaginationContainer: (props: any) => (
    <div data-testid="pagination-container">{props.children}</div>
  ),
  StyledAgGridWrapper: (props: any) => (
    <div data-testid="ag-grid-wrapper" style={{ height: props.height }}>
      {props.children}
    </div>
  ),
  StyledBox: (props: any) => <span>{props.children}</span>,
  ServerSideGridStyledFormControl: (props: any) => (
    <div data-testid="form-control">{props.children}</div>
  ),
  StyledSelect: (props: any) => (
    <select
      data-testid="page-size"
      value={props.value}
      onChange={props.onChange}
      role={props.role}
    >
      <option value="5">5</option>
      <option value="10">10</option>
      <option value="20">20</option>
      <option value="30">30</option>
    </select>
  ),
}));

// Mock Material-UI components
jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  MenuItem: (props: any) => (
    <option value={props.value}>{props.children}</option>
  ),
  Divider: () => <hr data-testid="divider" />,
}));

// Mock constants
jest.mock("../../constants", () => ({
  TABLE_HEIGHT: 471,
}));

const mockRowData = [
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
  { id: 3, name: "Item 3" },
];

const mockColumnDefs = [
  { field: "id", headerName: "ID" },
  { field: "name", headerName: "Name" },
];

describe("CustomTable Component", () => {
  it("renders grid and pagination", () => {
    render(
      <CustomTable rowData={mockRowData} columnDefs={mockColumnDefs as any} />
    );
    expect(screen.getByTestId("grid-container")).toBeInTheDocument();
    expect(screen.getByTestId("ag-grid-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("ag-grid-mock")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-container")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-mock")).toBeInTheDocument();
  });

  it("shows correct entries info", () => {
    render(
      <CustomTable rowData={mockRowData} columnDefs={mockColumnDefs as any} />
    );
    expect(screen.getByText(/of 3 entries/)).toBeInTheDocument();
  });

  it("shows divider when no data", () => {
    render(<CustomTable rowData={[]} columnDefs={mockColumnDefs as any} />);
    expect(screen.getByTestId("divider")).toBeInTheDocument();
  });

  it("does not show divider when data exists", () => {
    render(
      <CustomTable rowData={mockRowData} columnDefs={mockColumnDefs as any} />
    );
    expect(screen.queryByTestId("divider")).not.toBeInTheDocument();
  });

  it("changes page size when select changes", () => {
    render(
      <CustomTable rowData={mockRowData} columnDefs={mockColumnDefs as any} />
    );
    const select = screen.getByTestId("page-size");
    fireEvent.change(select, { target: { value: "20" } });
    expect(select).toHaveValue("20");
  });

  it("renders with custom height and width", () => {
    render(
      <CustomTable
        rowData={mockRowData}
        columnDefs={mockColumnDefs as any}
        height={500}
        width="80%"
      />
    );
    expect(screen.getByTestId("grid-container")).toBeInTheDocument();
    const agGridWrapper = screen.getByTestId("ag-grid-wrapper");
    expect(agGridWrapper).toHaveStyle({ height: "500px" });
  });

  it("handles pagination correctly", () => {
    const largeRowData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    render(
      <CustomTable rowData={largeRowData} columnDefs={mockColumnDefs as any} />
    );

    expect(screen.getByText(/of 25 entries/)).toBeInTheDocument();
    expect(screen.getByTestId("pagination-mock")).toBeInTheDocument();
  });

  it("displays correct page size options", () => {
    render(
      <CustomTable rowData={mockRowData} columnDefs={mockColumnDefs as any} />
    );

    const select = screen.getByTestId("page-size");
    const options = select.querySelectorAll("option");

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveValue("5");
    expect(options[1]).toHaveValue("10");
    expect(options[2]).toHaveValue("20");
    expect(options[3]).toHaveValue("30");
  });
});
