import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginBanner from "./index";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@ui/ui-lib";

// Mock the environment module to avoid import.meta parsing issues
jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("LoginBanner Component", () => {
  const renderWithTheme = () =>
    render(
      <ThemeProvider theme={theme}>
        <LoginBanner />
      </ThemeProvider>
    );

  it("renders main title and presence text", () => {
    renderWithTheme();
    expect(
      screen.getByText(/TRUSTED INSURANCE BROKING PARTNER/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Presence:/i)).toBeInTheDocument();
  });

  it("renders all service cards", () => {
    renderWithTheme();
    const serviceTitles = [
      "Property Insurance",
      "Project Insurance",
      "Health Insurance",
      "Liability & Speciality",
      "Fire Insurance",
      "Motor Insurance",
    ];
    serviceTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("renders all stats counters", () => {
    renderWithTheme();
    const statLabels = ["Workforce", "Corporate Clients", "Key Locations"];
    statLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders all value items", () => {
    renderWithTheme();
    const valueLabels = [
      "Absolute Professionalism",
      "Unparalleled Reliability",
      "Unwavering Integrity",
      "Ethical Commitment",
      "100% Transparency",
    ]; // Replace with actual labels from LoginConfig
    valueLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders banner carousel and navigates banners", () => {
    renderWithTheme();
    // Check for the first banner title
    expect(screen.getByText(/Our Mission/i)).toBeInTheDocument();
    // Simulate carousel navigation
    const nextBtn = screen.getByLabelText("Next banner");
    fireEvent.click(nextBtn);
    // Check for the next banner title
    expect(screen.getByText(/Our Expertise/i)).toBeInTheDocument();
  });
});
