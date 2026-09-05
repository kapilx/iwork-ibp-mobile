import { LOGIN_FIELDS, useApi } from "@ui/ui-lib";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import SignIn from "./index";
import { SIGN_IN } from "../../constants";
import { useAuth } from "../../providers/AuthProvider";

jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useApi: jest.fn(),
}));

jest.mock("../../providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockSignIn = jest.fn();
const mockDoFetch = jest.fn();

jest.mock("react-router-dom", () => {
  const actualModule = jest.requireActual("react-router-dom");
  return {
    ...actualModule,
    useNavigate: () => mockNavigate,
  };
});

describe("SignIn Component", () => {
  beforeEach(() => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: null,
    });

    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
    });

    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    jest.clearAllMocks();
  });

  const renderWithRouter = () =>
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>,
    );

  it("renders sign-in form with title and fields", () => {
    renderWithRouter();

    // Check title
    expect(screen.getByText(SIGN_IN)).toBeInTheDocument();

    // Check input fields
    LOGIN_FIELDS.forEach((field) => {
      expect(screen.getByLabelText(field.label)).toBeInTheDocument();
    });
  });

  it("shows forgot password link", () => {
    renderWithRouter();
    expect(
      screen.getByRole("link", { name: /forgot password\?/i }),
    ).toBeInTheDocument();
  });

  it("updates input values correctly", () => {
    renderWithRouter();

    const emailInput = screen.getByLabelText("email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Test@1234" } });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("Test@1234");
  });

  it("shows error message on failed login", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: { status: { statusCode: 400 }, message: "Invalid Credentials" },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Invalid Credentials")).toBeInTheDocument();
    });
  });

  it("renders toast message on successful login and calls signIn", async () => {
    const mockToken = "mock-auth-token";

    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: {
        status: { statusCode: 200 },
        message: "Login Successful",
        data: { accessToken: { accessToken: mockToken } },
      },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Login Successful")).toBeInTheDocument();
      expect(mockSignIn).toHaveBeenCalledWith(mockToken);
    });
  });

  it("closes the toast message when clicked", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: { status: { statusCode: 400 }, message: "Invalid Credentials" },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Invalid Credentials")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => {
      expect(screen.queryByText("Invalid Credentials")).not.toBeInTheDocument();
    });
  });

  it("renders error message when API call fails with no response", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: { status: { statusCode: 500 }, message: "No Server Response" },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("No Server Response")).toBeInTheDocument();
    });
  });

  it("does not call signIn if login fails", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: { status: { statusCode: 401 }, message: "Unauthorized" },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
