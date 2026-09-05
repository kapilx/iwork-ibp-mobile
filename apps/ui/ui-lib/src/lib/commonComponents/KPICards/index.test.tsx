import "@testing-library/jest-dom";
import {
  fireEvent,
  NUMBER_FORMAT_PATTERNS,
  render,
  screen,
  theme,
  formatLargeNumber
} from "@ui/ui-lib";
import React from "react";
import KPICards, { KPI } from "./index";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

jest.mock("@mui/x-date-pickers/internals/demo", () => ({
  DemoContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DemoItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: jest.fn(),
}));
jest.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: jest.fn(() => <div data-testid="date-picker-mock" />),
}));
jest.mock("@mui/x-date-pickers/TimePicker", () => ({
  TimePicker: jest.fn(() => <div data-testid="time-picker-mock" />),
}));
jest.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: jest.fn(() => <div data-testid="datetime-picker-mock" />),
}));

describe("KPICards component", () => {
  const mockData = [
    {
      title: "Sales",
      count: 10000000,
      percentage: 75,
      backgroundColor: "#fff",
      textColor: "#000",
      isFloatable: true,
    },
    {
      title: "Revenue",
      count: 500000,
      percentage: 50,
      backgroundColor: "#eee",
      textColor: "#111",
      isFloatable: false,
    },
    {
      title: "Growth",
      count: NaN,
      percentage: 0,
      backgroundColor: "#ddd",
      textColor: "#222",
      isFloatable: true,
    },
    {
      title: "Conversions",
      count: 2500,
      percentage: 10,
      backgroundColor: "", // triggers gradient fallback
      textColor: "#333",
      isFloatable: true,
    },
  ];

  it("toggles activeIndex on card click", () => {
    render(<KPICards data={mockData} />);
    const salesCard = screen.getByTestId("sales-card");
    fireEvent.click(salesCard);
    // No visible change, but click should not throw
    fireEvent.click(salesCard);
  });

  it("returns '--' for NaN and non-finite numbers", () => {
    expect(formatLargeNumber(NaN)).toBe("--");
    expect(formatLargeNumber(Infinity)).toBe("--");
    expect(formatLargeNumber(-Infinity)).toBe("--");
  });

  it("applies default gradient if none provided", () => {
    render(<KPICards data={mockData} />);
    const conversionsCard = screen.getByTestId("conversions-card");
    const expectedStart = theme.palette.gradients.purple.start;
    const expectedEnd = theme.palette.gradients.purple.end;
    expect(conversionsCard).toHaveStyle(
      `background: linear-gradient(135deg, ${expectedStart} 0%, ${expectedEnd} 100%)`
    );
  });

  it("formats International numbers correctly", () => {
    expect(formatLargeNumber(1e18, NUMBER_FORMAT_PATTERNS.international)).toBe(
      "1.00 Qn"
    );
    expect(formatLargeNumber(1e15, NUMBER_FORMAT_PATTERNS.international)).toBe(
      "1.00 Q"
    );
    expect(formatLargeNumber(1e12, NUMBER_FORMAT_PATTERNS.international)).toBe(
      "1.00 T"
    );
    expect(formatLargeNumber(1e9, NUMBER_FORMAT_PATTERNS.international)).toBe(
      "1.00 B"
    );
    expect(formatLargeNumber(1e6, NUMBER_FORMAT_PATTERNS.international)).toBe(
      "1.00 M"
    );
    expect(formatLargeNumber(1200, NUMBER_FORMAT_PATTERNS.international)).toBe(
      "1.20 K"
    );
    expect(formatLargeNumber(999, NUMBER_FORMAT_PATTERNS.international)).toBe(
      "999.00"
    );
  });
});
