import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import LookUpCoverDetailsHeader from "./index";
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

describe("LookUpCoverDetailsHeader Component", () => {
  const renderWithTheme = (props = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <LookUpCoverDetailsHeader {...props} />
      </ThemeProvider>
    );

  it("renders COVER_DETAILS and COMPARE text", () => {
    renderWithTheme();
    expect(screen.getByText(/Cover Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Compare/i)).toBeInTheDocument();
  });

  it("renders BASIC_COVERS when isBasicCoverVisible is true", () => {
    renderWithTheme({ isBasicCoverVisible: true });
    expect(screen.getByText(/Basic Covers/i)).toBeInTheDocument();
  });

  it("does not render BASIC_COVERS when isBasicCoverVisible is false", () => {
    renderWithTheme({ isBasicCoverVisible: false });
    expect(screen.queryByText(/Basic Covers/i)).not.toBeInTheDocument();
  });

  it("renders Refresh icon and text when showRefresh is true", () => {
    renderWithTheme({ showRefresh: true });
    expect(screen.getByAltText("RefreshIcon")).toBeInTheDocument();
    expect(screen.getByText(/Refresh/i)).toBeInTheDocument();
  });

  it("does not render Refresh icon and text when showRefresh is false", () => {
    renderWithTheme({ showRefresh: false });
    expect(screen.queryByAltText("RefreshIcon")).not.toBeInTheDocument();
    expect(screen.queryByText(/Refresh/i)).not.toBeInTheDocument();
  });

  it("always renders Compare icon and text", () => {
    renderWithTheme({ showRefresh: false });
    expect(screen.getByAltText("CompareIcon")).toBeInTheDocument();
    expect(screen.getByText(/Compare/i)).toBeInTheDocument();
  });
});
