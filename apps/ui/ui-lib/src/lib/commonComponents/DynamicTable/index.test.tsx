import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import DynamicTable from "./index";

describe("DynamicTable Component", () => {
  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name" },
    { field: "info.age", headerName: "Age" },
    {
      field: "custom",
      headerName: "Custom",
      renderCell: (value, row) => (
        <span data-testid="custom-cell">{row.name.length}</span>
      ),
    },
  ];

  const rows = [
    { id: 1, name: "Alice", info: { age: 30 } },
    { id: 2, name: "Bob", info: { age: 25 } },
  ];

  it("renders table with rows and columns", () => {
    render(<DynamicTable rows={rows} columns={columns} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("renders custom cell using renderCell", () => {
    render(<DynamicTable rows={rows} columns={columns} />);
    const customCells = screen.getAllByTestId("custom-cell");
    expect(customCells[0]).toHaveTextContent("5"); // Alice has 5 letters
    expect(customCells[1]).toHaveTextContent("3"); // Bob has 3 letters
  });

  it("renders empty state when no rows", () => {
    render(<DynamicTable rows={[]} columns={columns} />);
    expect(screen.getByText("No data to display.")).toBeInTheDocument();
  });

  it("applies custom sx styles to Paper container", () => {
    render(
      <DynamicTable
        rows={rows}
        columns={columns}
        sx={{ backgroundColor: "rgb(240, 240, 240)" }}
      />
    );
    // The Paper container is the first element with role="table"
    const table = screen.getByRole("table");
    expect(table.parentElement).toHaveStyle(
      "background-color: rgb(240, 240, 240)"
    );
  });

  it("renders N/A for missing values", () => {
    const columnsWithMissing = [
      { field: "id", headerName: "ID" },
      { field: "missing", headerName: "Missing" },
    ];
    render(<DynamicTable rows={rows} columns={columnsWithMissing} />);
    expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
  });
});
