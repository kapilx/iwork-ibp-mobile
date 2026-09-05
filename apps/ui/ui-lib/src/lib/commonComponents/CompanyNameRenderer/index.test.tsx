import React from "react";
import CompanyNameRenderer from "./index";
import type { IRowNode } from "ag-grid-community";
import type { ICellRendererParams } from "ag-grid-community";
import { render, screen } from "@ui/ui-lib/utils/renderWithTheme";

// Utility: Create a minimal mock of ICellRendererParams
const createParams = (
  data: any,
  nameField = "name",
  subTextField = "subText"
): ICellRendererParams => {
  return {
    data,
    nameField,
    subTextField,
    value: "",
    valueFormatted: "",
    node: {} as IRowNode,
    eGridCell: document.createElement("div"),
    eParentOfValue: document.createElement("div"),
    registerRowDragger: () => {},
    setTooltip: () => {},
    colDef: undefined,
    column: undefined,
    getValue: undefined,
    setValue: undefined,
    formatValue: undefined,
    refreshCell: undefined,
    fullWidth: false,
    pinned: null,
    context: undefined,
    api: undefined,
    columnApi: undefined,
  };
};

describe("CompanyNameRenderer", () => {
  it("renders name and subText correctly", () => {
    const params = createParams({ name: "Acme Corp", subText: "Technology" });
    render(<CompanyNameRenderer {...params} />);

    expect(screen.getByTestId("companyName")).toHaveTextContent("Acme Corp");
    expect(screen.getByTestId("industry")).toHaveTextContent("Technology");
  });

  it("renders nested name and subText fields correctly", () => {
    const data = {
      company: {
        name: "Nested Co",
        details: {
          industry: "Finance",
        },
      },
    };

    const params = createParams(
      data,
      "company.name",
      "company.details.industry"
    );
    render(<CompanyNameRenderer {...params} />);

    expect(screen.getByTestId("companyName")).toHaveTextContent("Nested Co");
    expect(screen.getByTestId("industry")).toHaveTextContent("Finance");
  });

  it("renders '--' when name or subText are missing", () => {
    const params = createParams({});
    render(<CompanyNameRenderer {...params} />);

    expect(screen.getByTestId("companyName")).toHaveTextContent("--");
    expect(screen.getByTestId("industry")).toHaveTextContent("--");
  });

  it("does not render subText if it is falsy", () => {
    const params = createParams({ name: "Only Name", subText: "" });
    render(<CompanyNameRenderer {...params} />);

    expect(screen.getByTestId("companyName")).toHaveTextContent("Only Name");
    expect(screen.queryByTestId("industry")).not.toBeInTheDocument();
  });

  it("renders fallback when field paths are invalid", () => {
    const data = { irrelevant: "value" };
    const params = createParams(data, "invalid.name", "invalid.subText");
    render(<CompanyNameRenderer {...params} />);

    expect(screen.getByTestId("companyName")).toHaveTextContent("--");
    expect(screen.getByTestId("industry")).toHaveTextContent("--");
  });
});
