import { useApi, theme } from "@ui/ui-lib";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import PasswordResetMail from "./index";
import { ThemeProvider } from "@mui/material/styles";

jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useApi: jest.fn(),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

jest.mock("rehype-raw", () => ({}));
jest.mock("react-markdown", () => ({}));

const mockDoFetch = jest.fn();

describe("PasswordResetMail Component", () => {
  beforeEach(() => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: null,
    });
    jest.clearAllMocks();
  });

  const renderWithRouter = () =>
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PasswordResetMail />
        </BrowserRouter>
      </ThemeProvider>
    );

  it("renders email input field", () => {
    renderWithRouter();
    expect(
      screen.getByPlaceholderText("Enter your email address")
    ).toBeInTheDocument();
  });

  it("shows success message and changes button text on successful api call", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: { message: "success" },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("success")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Resend/i }),
      ).toBeInTheDocument();
    });
  });

  it("submits form when Enter key is pressed in LoginContainer", async () => {
    renderWithRouter();
    const emailInput = screen.getByPlaceholderText("Enter your email address");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    // Find LoginContainer by its text and go up to the parent div
    const loginContainer = emailInput.closest("form")?.parentElement;
    // Fallback: use document.querySelector if needed
    const container =
      loginContainer || document.querySelector("[tabindex='0']");
    fireEvent.keyDown(container, { key: "Enter", code: "Enter", charCode: 13 });
    await waitFor(() => {
      expect(mockDoFetch).toHaveBeenCalled();
    });
  });

  it("shows error message when error is present", async () => {
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: null,
      error: { message: "Something went wrong" },
    });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });
});
