import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@ui/ui-lib/styles/Theme";

const renderWithTheme = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "queries">
) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>, options);
};

export * from "@testing-library/react";
export { renderWithTheme as render };
