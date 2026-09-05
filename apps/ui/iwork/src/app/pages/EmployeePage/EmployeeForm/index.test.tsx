import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { useApi } from "@ui/ui-lib";
import { useNavigate, useParams } from "react-router-dom";
import EmployeeForm from "./addEmployee";

// Mock hooks
jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useApi: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

const mockNavigate = jest.fn();
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

describe("EmployeeForm Component", () => {
  const mockDoFetch = jest.fn();
  const mockSaveEmployee = jest.fn();
  const mockApiResponse = {
    status: 200,
    message: "Employee updated successfully",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: undefined }); // Default: Add mode
    (useApi as jest.Mock).mockReturnValue({ doFetch: mockDoFetch, data: null });
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it("renders EmployeeForm in Add mode", () => {
    renderWithRouter(<EmployeeForm />);
    expect(screen.getByText("Add Employee")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("renders EmployeeForm in Edit mode and loads employee data", async () => {
    (useParams as jest.Mock).mockReturnValue({ id: "1" }); // Simulate Edit mode
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: {
        data: { firstName: "John", lastName: "Doe", mobile: "+911234567890" },
      },
    });

    renderWithRouter(<EmployeeForm />);

    await waitFor(() =>
      expect(screen.getByText("Edit Employee")).toBeInTheDocument()
    );
    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1234567890")).toBeInTheDocument(); // Mobile should not have +91
  });

  it("shows validation error when required fields are empty", async () => {
    renderWithRouter(<EmployeeForm />);

    fireEvent.click(screen.getByTestId("submit-button"));

    expect(
      await screen.findByText("First name is required")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Last name is required")
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Please enter a valid phone number (e.g., +1234567890)"
      )
    ).toBeInTheDocument();
  });

  it("resets form when Reset button is clicked", async () => {
    renderWithRouter(<EmployeeForm />);
    fireEvent.change(screen.getByPlaceholderText("Enter your first name"), {
      target: { value: "John" },
    });

    fireEvent.click(screen.getByTestId("Reset-button"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter your first name")).toHaveValue(
        ""
      );
    });
  });

  it("displays toast message on successful submission", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockSaveEmployee,
      data: mockApiResponse,
    });

    renderWithRouter(<EmployeeForm />);
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(
        screen.getByText("Employee updated successfully")
      ).toBeInTheDocument();
    });
  });

  it("shows validation error if mobile number is empty", async () => {
    renderWithRouter(<EmployeeForm />);

    // Submit without entering phone number
    fireEvent.click(screen.getByTestId("submit-button"));

    // Check for required field validation
    expect(
      await screen.findByText(
        "Please enter a valid phone number (e.g., +1234567890)"
      )
    ).toBeInTheDocument();
  });

  test("should not display error for valid phone number", async () => {
    render(<EmployeeForm />);

    // Get the phone input field
    const phoneInput = screen.getByPlaceholderText("Enter your phone");

    // Simulate typing an invalid phone number
    fireEvent.change(phoneInput, { target: { value: "123" } });

    fireEvent.click(screen.getByTestId("submit-button"));

    expect(
      await screen.queryByText(
        "Please enter a valid phone number (e.g., +1234567890)"
      )
    ).not.toBeInTheDocument();
  });

  test("Displays error for invalid firstName", async () => {
    render(<EmployeeForm />);

    // Get the phone input field
    const firstName = screen.getByPlaceholderText("Enter your first name");
    // Simulate typing an invalid phone number
    fireEvent.change(firstName, { target: { value: "1" } });

    fireEvent.click(screen.getByTestId("submit-button"));

    expect(
      await screen.findByText("Minimum 3 characters required")
    ).toBeInTheDocument();
  });

  test("should not display error for valid firstName", async () => {
    render(<EmployeeForm />);

    // Get the phone input field
    const firstName = screen.getByPlaceholderText("Enter your first name");
    // Simulate typing an invalid phone number
    fireEvent.change(firstName, { target: { value: "1234" } });

    fireEvent.click(screen.getByTestId("submit-button"));

    expect(
      await screen.queryByText("Minimum 3 characters required")
    ).not.toBeInTheDocument();
  });

  test("Displays error for invalid email", async () => {
    render(<EmployeeForm />);

    // Get the phone input field
    const firstName = screen.getByPlaceholderText("Enter your email");
    // Simulate typing an invalid phone number
    fireEvent.change(firstName, { target: { value: "saiga" } });

    fireEvent.click(screen.getByTestId("submit-button"));

    expect(
      await screen.findByText("Please enter a valid email address")
    ).toBeInTheDocument();
  });

  test("should not display error for valid email", async () => {
    render(<EmployeeForm />);

    // Get the phone input field
    const firstName = screen.getByPlaceholderText("Enter your email");
    // Simulate typing an invalid phone number
    fireEvent.change(firstName, {
      target: { value: "saigangadhar470@gmail.com" },
    });

    fireEvent.click(screen.getByTestId("submit-button"));

    expect(
      await screen.queryByText("Minimum 3 characters required")
    ).not.toBeInTheDocument();
  });
});
