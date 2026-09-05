import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import SimpleTreeView from "./index";
import { COMPANY_STATUS } from "../../constants/enum";
import { theme } from "@ui/ui-lib/styles";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("SimpleTreeView", () => {
  const mockOnSelectNode = jest.fn();
  const baseNode = {
    id: "1",
    label: "Parent Company",
    country: "US",
    status: COMPANY_STATUS.ACTIVE,
    children: [],
  };
  const inactiveNode = {
    id: "2",
    label: "Inactive Company",
    country: "IN",
    status: COMPANY_STATUS.INACTIVE,
    children: [],
  };
  const childNode = {
    id: "3",
    label: "Child Company",
    country: "UK",
    status: COMPANY_STATUS.ACTIVE,
    children: [],
  };
  const treeData = [
    {
      ...baseNode,
      children: [childNode, inactiveNode],
    },
  ];
  const matchedCompanyResult = {} as any;
  const debouncedName = "Parent";

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper to render with router and theme context
  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </MemoryRouter>
    );

  it("renders all nodes and children", () => {
    renderWithProviders(
      <SimpleTreeView
        data={treeData}
        onSelectNode={mockOnSelectNode}
        selectedTreeNode={null}
        debouncedName={debouncedName}
        matchedCompanyResult={matchedCompanyResult}
      />
    );
    expect(screen.getByText(/Parent Company\s*,\s*US/)).toBeInTheDocument();
    expect(screen.getByText(/Child Company\s*,\s*UK/)).toBeInTheDocument();
    expect(screen.getByText(/Inactive Company\s*,\s*IN/)).toBeInTheDocument();
  });

  it("calls onSelectNode when active node label is clicked", () => {
    renderWithProviders(
      <SimpleTreeView
        data={treeData}
        onSelectNode={mockOnSelectNode}
        selectedTreeNode={null}
        debouncedName={debouncedName}
        matchedCompanyResult={matchedCompanyResult}
      />
    );
    fireEvent.click(screen.getByText(/Parent Company\s*,\s*US/));
    expect(mockOnSelectNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" })
    );
  });

  it("does not call onSelectNode when inactive node label is clicked", () => {
    renderWithProviders(
      <SimpleTreeView
        data={treeData}
        onSelectNode={mockOnSelectNode}
        selectedTreeNode={null}
        debouncedName={debouncedName}
        matchedCompanyResult={matchedCompanyResult}
      />
    );
    fireEvent.click(screen.getByText(/Inactive Company\s*,\s*IN/));
    expect(mockOnSelectNode).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: "2" })
    );
  });

  it("applies 'selected' class to selected node label", () => {
    renderWithProviders(
      <SimpleTreeView
        data={treeData}
        onSelectNode={mockOnSelectNode}
        selectedTreeNode={baseNode}
        debouncedName={debouncedName}
        matchedCompanyResult={matchedCompanyResult}
      />
    );
    const label = screen.getByText(/Parent Company\s*,\s*US/);
    expect((label as Element).classList.contains("selected")).toBe(true);
  });
});
