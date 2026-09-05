import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../styles/Theme";
import Calendar, { getChipColorFromLabel } from "./index";
import dayjs from "dayjs";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Helper to render with MUI theme
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("getChipColorFromLabel", () => {
  it("should return a color from theme chips for a given label", () => {
    const label = "Test Label";
    const color = getChipColorFromLabel(label, 0);
    expect(Object.values(theme.palette.chips || {})).toContain(color);
  });

  it("should cycle through chip colors based on index", () => {
    const label = "Test Label";
    const chipColors = Object.values(theme.palette.chips || {});

    if (chipColors.length > 0) {
      const color1 = getChipColorFromLabel(label, 0);
      const color2 = getChipColorFromLabel(label, 1);
      
      expect(color1).toBe(chipColors[0]);
      expect(color2).toBe(chipColors[1 % chipColors.length]);
    }
  });

  it("should return primary color when no chips are available", () => {
    const originalPalette = theme.palette;
    (theme as any).palette.chips = undefined;

    const color = getChipColorFromLabel("Test", 0);
    expect(color).toBe(theme.palette.primary.main);

    theme.palette = originalPalette;
  });
});

describe("Calendar Component", () => {
  const mockRows = [
    { label: "Activity 1", date: dayjs("2023-05-15") },
    { label: "Activity 2", date: dayjs("2023-05-15") },
    { label: "Activity 3", date: dayjs("2023-05-20") },
  ];

  const mockLabelColorMap = {
    "Activity 1": "#ff0000",
    "Activity 2": "#00ff00",
    "Activity 3": "#0000ff",
  };

  it("should render without crashing", () => {
    renderWithTheme(
      <Calendar rows={[]} selectedDate={dayjs()} onChange={() => {}} />
    );
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });
  
  it("should handle null dates in rows gracefully", () => {
    const rowsWithNull = [...mockRows, { label: "Null Activity", date: null }];

    renderWithTheme(
      <Calendar
        rows={rowsWithNull}
        selectedDate={dayjs("2023-05-01")}
        onChange={() => {}}
        labelColorMap={mockLabelColorMap}
      />
    );

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });
});
