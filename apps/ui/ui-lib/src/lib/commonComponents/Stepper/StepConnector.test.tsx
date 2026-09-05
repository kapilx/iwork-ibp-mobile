import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StepConnector } from "./StepConnector";
import { ThemeProvider } from "styled-components";
import { theme } from "@ui/ui-lib/styles/Theme";

describe("StepConnector Component", () => {
  it("renders the StepConnector component", () => {
    render(
      <ThemeProvider theme={theme}>
        <StepConnector completed={false} index={0} />
      </ThemeProvider>
    );

    // Check if the container is rendered
    expect(screen.getByTestId("step-connector-0")).toBeInTheDocument();

    // Check if the progress bar is rendered
    expect(screen.getByTestId("step-connector-progress-0")).toBeInTheDocument();
  });

  it("applies 100% width when completed is true", () => {
    render(
      <ThemeProvider theme={theme}>
        <StepConnector completed={true} index={1} />
      </ThemeProvider>
    );

    const progressBar = screen.getByTestId("step-connector-progress-1");
    expect(progressBar).toHaveStyle("width: 100%");
  });

  it("applies 0% width when completed is false", () => {
    render(
      <ThemeProvider theme={theme}>
        <StepConnector completed={false} index={2} />
      </ThemeProvider>
    );

    const progressBar = screen.getByTestId("step-connector-progress-2");
    expect(progressBar).toHaveStyle("width: 0%");
  });
});
