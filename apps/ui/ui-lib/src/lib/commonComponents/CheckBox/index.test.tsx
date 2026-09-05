import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Checkbox from ".";
import { ThemeProvider } from "@mui/material";
import { theme } from "@ui/ui-lib/styles/Theme";

describe("CustomCheckbox", () => {
  const setup = (props = {}) => {
    const defaultProps = {
      isChecked: false,
      onChange: jest.fn(),
      label: "Test Checkbox",
      ...props,
    };

    render(
      <ThemeProvider theme={theme}>
        <Checkbox {...defaultProps} />
      </ThemeProvider>
    );
    return defaultProps;
  };

  test("renders the checkbox with label", () => {
    setup();

    expect(screen.getByTestId("common-checkbox-container")).toBeInTheDocument();
    expect(screen.getByTestId("common-checkbox-label")).toHaveTextContent(
      "Test Checkbox"
    );
    expect(screen.getByTestId("common-checkbox-input")).toBeInTheDocument();
  });

  test("checkbox should reflect initial checked state", () => {
    setup({ isChecked: true });

    const checkbox = screen.getByTestId(
      "common-checkbox-input"
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  test("calls onChange and updates internal state on click", () => {
    const { onChange } = setup({ isChecked: false });

    const checkbox = screen.getByTestId(
      "common-checkbox-input"
    ) as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(checkbox.checked).toBe(true);
  });
});
