import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import {
  BrowserRouter as Router,
  MemoryRouter,
  useParams,
} from "react-router-dom";
import { useApi, endPoints } from "@ui/ui-lib";
import EmployeeDetails from ".";
import "@testing-library/jest-dom";

// Mock useNavigate globally
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: jest.fn(),
}));

// Mock useApi globally
jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  ...jest.requireActual("@ui/ui-lib"),
  useApi: jest.fn(),
}));

describe("EmployeeDetails Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders 'No data available' when employeeData is null", () => {
    (useParams as jest.Mock).mockReturnValue({ id: undefined });
    (useApi as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      doFetch: jest.fn(),
    });

    render(
      <Router>
        <EmployeeDetails />
      </Router>
    );

    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  test("calls API when employeeId is present", async () => {
    const mockDoFetch = jest.fn();

    // Mock useParams to return an employee ID
    (useParams as jest.Mock).mockReturnValue({ id: "1" });

    (useApi as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      doFetch: mockDoFetch,
    });

    render(
      <MemoryRouter initialEntries={["/employee/1"]}>
        <EmployeeDetails />
      </MemoryRouter>
    );

    // Ensure doFetch is called with the correct endpoint (ignore missing method)
    expect(mockDoFetch).toHaveBeenCalledTimes(1);
    expect(mockDoFetch).toHaveBeenCalledWith(endPoints.employeeById(1));
  });

  test("renders employee details when API data is available", async () => {
    const mockEmployeeData = {
      name: "John Doe",
      position: "Software Engineer",
      department: "Engineering",
    };

    (useParams as jest.Mock).mockReturnValue({ id: "1" });

    (useApi as jest.Mock).mockReturnValue({
      data: { data: mockEmployeeData },
      loading: false,
      doFetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <EmployeeDetails />
      </MemoryRouter>
    );

    // Ensure data is displayed
    expect(screen.getByText("name:")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("position:")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("department:")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  test("navigates to edit employee page when edit button is clicked", () => {
    const mockEmployeeData = {
      name: "John Doe",
      position: "Software Engineer",
    };

    (useParams as jest.Mock).mockReturnValue({ id: "1" });

    (useApi as jest.Mock).mockReturnValue({
      data: { data: mockEmployeeData },
      loading: false,
      doFetch: jest.fn(),
    });

    render(
      <Router>
        <EmployeeDetails />
      </Router>
    );

    fireEvent.click(screen.getByText(/Edit Employee/i));

    // Ensure correct navigation occurs with the employee ID
    expect(mockNavigate).toHaveBeenCalledWith("/employee/1/edit");
  });

  test("does not call API when employeeId is missing", () => {
    const mockDoFetch = jest.fn();

    (useParams as jest.Mock).mockReturnValue({ id: undefined });

    (useApi as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      doFetch: mockDoFetch,
    });

    render(
      <MemoryRouter>
        <EmployeeDetails />
      </MemoryRouter>
    );

    // Ensure API is not called when there's no employee ID
    expect(mockDoFetch).not.toHaveBeenCalled();
  });
});
