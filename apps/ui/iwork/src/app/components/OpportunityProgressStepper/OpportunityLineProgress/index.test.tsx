import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import ProgressBar from "./index";
import { theme } from "@ui/ui-lib";

// Mock constants and utils
jest.mock("../../../constants/index.js", () => ({
  COMPLETED: "Completed",
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  formatDate: jest.fn((date: string) => `Formatted(${date})`),
}));

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);

describe("ProgressBar Component", () => {
  const props = {
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    progress: 70,
  };

  it("renders start and end dates", () => {
    renderWithTheme(<ProgressBar {...props} />);
    expect(screen.getByText("Formatted(2024-01-01)")).toBeInTheDocument();
    expect(screen.getByText("Formatted(2024-12-31)")).toBeInTheDocument();
  });

  it("displays correct progress percentage and label", () => {
    renderWithTheme(<ProgressBar {...props} />);
    expect(screen.getByText("70% Completed")).toBeInTheDocument();
  });

  it("renders correctly when progress is 0%", () => {
    renderWithTheme(<ProgressBar {...props} progress={0} />);
    expect(screen.getByText("0% Completed")).toBeInTheDocument();
  });

  it("renders correctly when progress is 100%", () => {
    renderWithTheme(<ProgressBar {...props} progress={100} />);
    expect(screen.getByText("100% Completed")).toBeInTheDocument();
  });
});
