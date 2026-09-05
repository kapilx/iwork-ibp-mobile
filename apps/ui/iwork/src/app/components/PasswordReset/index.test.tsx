import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import PasswordReset from "./index";
import { theme, useApi, useApiQuery } from "@ui/ui-lib";
import "@testing-library/jest-dom";

jest.mock("rehype-raw", () => ({}));
jest.mock("react-markdown", () => (props: any) => <div>{props.children}</div>);
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("token=mocktoken")],
    useLocation: () => ({ pathname: "/reset-password", search: "" }),
    MemoryRouter: actual.MemoryRouter,
  };
});
jest.mock("@ui/ui-lib", () => {
  const actual = jest.requireActual("@ui/ui-lib");
  return {
    ...actual,
    useApi: jest.fn(),
    useApiQuery: jest.fn(),
  };
});

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

const mockDoFetch = jest.fn();

describe("PasswordReset Component", () => {
  beforeEach(() => {
    // By default, mock a valid token so the form is rendered
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: { message: "Token valid" },
      error: null,
    });
    (useApiQuery as jest.Mock).mockReturnValue({});
    jest.clearAllMocks();
  });

  const renderWithRouter = () =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/reset-password"]}>
          <PasswordReset />
        </MemoryRouter>
      </ThemeProvider>
    );

  it("calls doFetch with correct data when valid", async () => {
    renderWithRouter();
    let newPassword, confirmPassword;
    try {
      newPassword = screen.getByLabelText(/enter new password/i);
    } catch {
      newPassword = screen
        .getAllByPlaceholderText(/enter new password/i)
        .find((input) => (input as any).name === "newPassword");
    }
    try {
      confirmPassword = screen.getByLabelText(/re-enter new password/i);
    } catch {
      confirmPassword = screen
        .getAllByPlaceholderText(/re-enter new password/i)
        .find((input) => (input as any).name === "confirmPassword");
    }
    fireEvent.change(newPassword, { target: { value: "Test@1234" } });
    fireEvent.change(confirmPassword, { target: { value: "Test@1234" } });
    const submitBtn = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(mockDoFetch).toHaveBeenCalledWith(
        expect.stringContaining("/employee/password-reset"),
        expect.objectContaining({
          method: "POST",
          data: { token: "mocktoken", password: "Test@1234" },
        })
      );
    });
  });

  it("shows toast and navigates on invalid/expired token", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: { message: "Invalid or expired token" },
      error: null,
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Invalid or expired token")).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("shows toast and navigates on password update success", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: { message: "Password updated successfully" },
      error: null,
    });
    renderWithRouter();
    await waitFor(() => {
      expect(
        screen.getByText("Password updated successfully")
      ).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("shows toast and navigates on API error", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: null,
      error: { message: "API error" },
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("API error")).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("shows error message when useApiQuery onError is triggered", async () => {
    let called = false;
    (useApiQuery as jest.Mock).mockImplementation(({ config }) => {
      if (!called && config && typeof config.onError === "function") {
        config.onError();
        called = true;
      }
      return {};
    });
    renderWithRouter();
    expect(screen.getByText("Invalid or expired link")).toBeInTheDocument();
  });

  it("submits form on Enter key press", async () => {
    renderWithRouter();

    const newPasswordInput = screen
      .getAllByPlaceholderText(/enter new password/i)
      .find((input) => (input as any).name === "newPassword");
    const confirmPasswordInput = screen
      .getAllByPlaceholderText(/re-enter new password/i)
      .find((input) => (input as any).name === "confirmPassword");

    fireEvent.change(newPasswordInput!, {
      target: { value: "Test@1234" },
    });
    fireEvent.change(confirmPasswordInput!, {
      target: { value: "Test@1234" },
    });

    const container = screen.getByTestId("login-container");
    fireEvent.keyDown(container, { key: "Enter", code: "Enter", charCode: 13 });

    await waitFor(() => {
      expect(mockDoFetch).toHaveBeenCalledWith(
        expect.stringContaining("/employee/password-reset"),
        expect.objectContaining({
          method: "POST",
          data: { token: "mocktoken", password: "Test@1234" },
        })
      );
    });
  });
});
