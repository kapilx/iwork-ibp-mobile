import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import EmployeeListing from ".";
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
let mockSearchTerm = "";
const mockSetSearchTerm = jest.fn((newTerm) => {
  mockSearchTerm = newTerm;
});

const mockTableController = () => ({
  rowData: [
    {
      employeeId: 1,
      firstName: "John",
      lastName: "Doe",
      emailId: "john.doe@example.com",
      mobile: "1234567890",
      loginName: "johndoe",
      roleId: 1,
      locationId: 2,
      verticalId: 3,
      departmentId: 4,
      designationId: 5,
      reportingUserId: 6,
      iirmEmpId: 7,
      iworkRoleId: 8,
    },
    {
      employeeId: 2,
      firstName: "Jane",
      lastName: "Smith",
      emailId: "jane.smith@example.com",
      mobile: "9876543210",
      loginName: "janesmith",
      roleId: 2,
      locationId: 3,
      verticalId: 4,
      departmentId: 5,
      designationId: 6,
      reportingUserId: 7,
      iirmEmpId: 8,
      iworkRoleId: 9,
    },
  ],
  totalRows: 2,
  currentPage: 1,
  loading: false,
  setCurrentPage: mockSetCurrentPage,
  pageSize: 10,
  setPageSize: mockSetPageSize,
  PAGE_SIZE_OPTIONS: [5, 10, 20],
  searchTerm: mockSearchTerm,
  setSearchTerm: mockSetSearchTerm,
});

(useTableController as jest.Mock).mockImplementation(() => mockTableController());
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

describe("EmployeeTable Component", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    mockSearchTerm = "";
    jest.clearAllMocks();
  });

  it("renders the table with correct columns", () => {
    renderWithRouter(<EmployeeListing />);
    expect(screen.getByText("Employee Id")).toBeInTheDocument();
  });

  it("renders the correct number of rows based on data", () => {
    renderWithRouter(<EmployeeListing />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("updates the page size when a new page size is selected", () => {
    renderWithRouter(<EmployeeListing />);

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

    renderWithRouter(<EmployeeListing />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
  });

  it("navigates to employee details page on row click", async () => {
    renderWithRouter(<EmployeeListing />);

    const rowElement = screen.getByText("John Doe");
    await userEvent.click(rowElement);

    expect(mockNavigate).toHaveBeenCalledWith("/employee/1");
  });
  it("renders the search input with the correct placeholder", () => {
    renderWithRouter(<EmployeeListing />);
    const searchInput = screen.getByPlaceholderText("Search...");
    expect(searchInput).toBeInTheDocument();
  });
  it("calls setSearchTerm when typing in the search input", () => {
    renderWithRouter(<EmployeeListing />);
    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "Jane" } });
    expect(mockSetSearchTerm).toHaveBeenCalledWith("Jane");
  });

  it("renders the correct number of rows after changing the page size", () => {
    renderWithRouter(<EmployeeListing />);
  
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "5" }));
  
    expect(mockSetPageSize).toHaveBeenCalledWith(5);
    expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
  });

  it("handles row click correctly and navigates to the correct employee details page", async () => {
    renderWithRouter(<EmployeeListing />);
    const rowElement = screen.getByText("Jane Smith");
    await userEvent.click(rowElement);
    expect(mockNavigate).toHaveBeenCalledWith("/employee/2");
  });
  
  it("renders the correct pagination controls", () => {
    renderWithRouter(<EmployeeListing />);
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
  });
  
  it("renders the correct page size options in the dropdown", () => {
    renderWithRouter(<EmployeeListing />);
    fireEvent.mouseDown(screen.getByRole("combobox"));
    mockTableController().PAGE_SIZE_OPTIONS.forEach((option) => {
      expect(screen.getByRole("option", { name: `${option}` })).toBeInTheDocument();
    });
  });
});