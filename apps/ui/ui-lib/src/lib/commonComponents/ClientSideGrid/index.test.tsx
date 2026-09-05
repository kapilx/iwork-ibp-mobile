import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommonAGGrid from "./index";
import { ColDef } from "ag-grid-community";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React from "react";

// ✅ Mock theme to avoid MUI style errors (like theme.shape.borderRadii.semiRounded)
const theme = createTheme({
  typography: {
    fontFamily: "Arial",
    fontSizes: { sm: 14 },
    fontWeights: { regular: 400, semiBold: 600 },
  },
  palette: {
    neutral: { dark: "#333" },
    text: { primary: "#000" },
    background: { tableHeader: "#f0f0f0" },
  },
  shape: {
    borderRadii: {
      semiRounded: "8px",
    },
  },
  spacing: (...args: number[]) => args.map((n) => `${n * 4}px`).join(" "),
});

const rowData = [
  { id: 1, name: "John Doe", age: 28 },
  { id: 2, name: "Jane Doe", age: 32 },
];

const columnDefs: ColDef[] = [
  { field: "name", headerName: "Name", width: 150 },
  { field: "age", headerName: "Age", width: 100 },
];

// ✅ Helper render function with ThemeProvider
const renderWithTheme = (ui: React.ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("CommonAGGrid Component", () => {
  it("renders correctly with required props", () => {
    const { container } = renderWithTheme(
      <CommonAGGrid
        rowData={rowData}
        columnDefs={columnDefs}
        paginationPageSize={5}
        paginationPageSizeSelector={[5, 10, 20]}
        height={400}
      />
    );

    expect(container.querySelector(".ag-root-wrapper")).toBeInTheDocument();
  });

  it("renders pagination rows", async () => {
    renderWithTheme(
      <CommonAGGrid
        rowData={rowData}
        columnDefs={columnDefs}
        pagination
        paginationPageSize={5}
        paginationPageSizeSelector={[5, 10, 20]}
        height={400}
      />
    );

    // Wait for AG Grid to render rows
    await waitFor(() =>
      expect(screen.getAllByRole("row")).toHaveLength(rowData.length + 1)
    ); // 1 header + 2 data rows

    expect(screen.getByTestId("ClientSideGrid")).toBeInTheDocument();
  });

  it("renders with external page size selector (mocked)", async () => {
    renderWithTheme(
      <>
        <label htmlFor="page-size-selector">Mock Page Size</label>
        <select id="page-size-selector" aria-label="Mock Page Size">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
        <CommonAGGrid
          rowData={rowData}
          columnDefs={columnDefs}
          pagination
          paginationPageSize={5}
          paginationPageSizeSelector={[5, 10, 20]}
          height={400}
        />
      </>
    );

    const dropdown = screen.getByLabelText("Mock Page Size");
    expect(dropdown).toBeInTheDocument();

    await userEvent.selectOptions(dropdown, "10");
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  it("renders with empty rowData", () => {
    renderWithTheme(
      <CommonAGGrid
        rowData={[]}
        columnDefs={columnDefs}
        paginationPageSize={5}
        paginationPageSizeSelector={[5, 10, 20]}
        height={400}
      />
    );
    // Should still render header row
    expect(screen.getAllByRole("row").length).toBe(1);
  });

  it("renders with empty columnDefs", () => {
    renderWithTheme(
      <CommonAGGrid
        rowData={rowData}
        columnDefs={[]}
        paginationPageSize={5}
        paginationPageSizeSelector={[5, 10, 20]}
        height={400}
      />
    );
    // Should render grid container
    expect(screen.getByTestId("ClientSideGrid")).toBeInTheDocument();
  });
});
