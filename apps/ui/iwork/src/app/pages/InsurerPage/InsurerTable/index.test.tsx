import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import InsurerListing from "./index";
import { useTableController } from "@ui/ui-lib";
import { useNavigate } from "react-router-dom";

// Mock hooks and navigation
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useTableController: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockSetCurrentPage = jest.fn();
const mockSetPageSize = jest.fn();
const mockSetSearchTerm = jest.fn();

const mockTableController = () => ({
  rowData: [
    {
      id: 1,
      insurerName: "Insurer A",
      displayName: "Insurer A Display",
      companyType: "Life",
      website: "www.insurera.com",
      isLife: true,
      companyTag: "Tag A",
      remarks: "Remark A",
      createdBy: "Admin",
      updatedBy: "Admin",
      createdAt: "2025-01-01",
      updatedAt: "2025-01-02",
    },
  ],
  totalRows: 1,
  currentPage: 1,
  loading: false,
  setCurrentPage: mockSetCurrentPage,
  pageSize: 10,
  setPageSize: mockSetPageSize,
  PAGE_SIZE_OPTIONS: [5, 10, 20],
  searchTerm: "",
  setSearchTerm: mockSetSearchTerm,
});

// Mock implementation with dynamic state
(useTableController as jest.Mock).mockImplementation(() =>
  mockTableController()
);
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

describe("InsurerTable Component", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the table with correct columns", () => {
    renderWithRouter(<InsurerListing />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Insurer Name")).toBeInTheDocument();
    expect(screen.getByText("Display Name")).toBeInTheDocument();
    expect(screen.getByText("Company Type")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("Is Life")).toBeInTheDocument();
    expect(screen.getByText("Company Tag")).toBeInTheDocument();
    expect(screen.getByText("Remarks")).toBeInTheDocument();
    expect(screen.getByText("Created By")).toBeInTheDocument();
    expect(screen.getByText("Updated By")).toBeInTheDocument();
    expect(screen.getByText("Created At")).toBeInTheDocument();
    expect(screen.getByText("Updated At")).toBeInTheDocument();
  });

  it("renders the correct number of rows based on data", () => {
    renderWithRouter(<InsurerListing />);
    expect(screen.getByText("Insurer A Display")).toBeInTheDocument();
  });

  it("updates the page size when a new page size is selected", () => {
    renderWithRouter(<InsurerListing />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "5" }));

    expect(mockSetPageSize).toHaveBeenCalledWith(5);
    expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
  });

  it("changes the current page when pagination is clicked", () => {
    (useTableController as jest.Mock).mockImplementation(() => ({
      ...mockTableController(),
      totalRows: 15,
    }));

    renderWithRouter(<InsurerListing />);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
  });

  it("navigates to insurer details page on row click", async () => {
    renderWithRouter(<InsurerListing />);

    const rowElement = screen.getByRole("row", { name: /insurer a display/i });
    await userEvent.click(rowElement);

    expect(mockNavigate).toHaveBeenCalledWith("/insurers/1");
  });

  it("updates the search term when typing in the search box", () => {
    renderWithRouter(<InsurerListing />);

    const searchBox = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchBox, { target: { value: "Test Search" } });

    expect(mockSetSearchTerm).toHaveBeenCalledWith("Test Search");
  });
});
