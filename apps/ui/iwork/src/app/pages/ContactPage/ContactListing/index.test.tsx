import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import ContactTable from "./index";
import {useTableController} from "@ui/ui-lib";
import { useNavigate } from "react-router-dom";

// Mock hooks and navigation
jest.mock("@ui/ui-lib");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockSetCurrentPage = jest.fn();
const mockSetPageSize = jest.fn();

// State tracking variables
let mockSearchTerm = "";
const mockSetSearchTerm = jest.fn((newTerm) => {
  mockSearchTerm = newTerm;
});

const mockTableController = () => ({
  rowData: [
    {
      id: 1,
      displayName: "John Doe",
      firstName: "John",
      lastName: "Doe",
      emailId: "john.doe@example.com",
      phone: "+1234567890",
      remarks: "Test Contact",
      address: [{ address1: "123 Main St" }],
      department: "Sales",
      designation: "Manager",
    },
    {
      id: 2,
      displayName: "Jane Smith",
      firstName: "Jane",
      lastName: "Smith",
      emailId: "jane.smith@example.com",
      phone: "+0987654321",
      remarks: "Test Contact 2",
      address: [{ address1: "456 Elm St" }],
      department: "HR",
      designation: "Executive",
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

// Mock implementation with dynamic state
(useTableController as jest.Mock).mockImplementation(() =>
  mockTableController()
);
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

describe("ContactTable Component", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  beforeEach(() => {
    // Reset all mocks and state before each test
    mockSearchTerm = "";
    jest.clearAllMocks();
  });

  it("renders the table with correct columns", () => {
    renderWithRouter(<ContactTable />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Display Name")).toBeInTheDocument();
    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Last Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Remarks")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByText("Designation")).toBeInTheDocument();
  });

  it("renders the correct number of rows based on data", () => {
    renderWithRouter(<ContactTable />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("updates the page size when a new page size is selected", () => {
    renderWithRouter(<ContactTable />);

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "5" }));

    expect(mockSetPageSize).toHaveBeenCalledWith(5);
    expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
  });

  it("changes the current page when pagination is clicked", () => {
    // Mock more data to enable pagination
    (useTableController as jest.Mock).mockImplementation(() => ({
      ...mockTableController(),
      totalRows: 15,
    }));

    renderWithRouter(<ContactTable />);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
  });

  it("navigates to contact details page on row click", async () => {
    renderWithRouter(<ContactTable />);

    const rowElement = screen.getByRole("row", { name: /john doe/i });
    await userEvent.click(rowElement);

    expect(mockNavigate).toHaveBeenCalledWith("/contact/1");
  });
});
