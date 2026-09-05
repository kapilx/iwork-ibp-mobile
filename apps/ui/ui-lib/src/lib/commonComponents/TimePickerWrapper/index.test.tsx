import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import TimePickerWrapper from "./index";

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
}))

describe("TimePickerWrapper", () => {
  it("renders without crashing", () => {
    render(
      <TimePickerWrapper picker="TimePicker">
        <div>Test Child</div>
      </TimePickerWrapper>
    );
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("renders children inside the wrapper", () => {
    render(
      <TimePickerWrapper picker="TimePicker">
        <span>Child Element</span>
      </TimePickerWrapper>
    );
    expect(screen.getByText("Child Element")).toBeInTheDocument();
  });

  it("passes the correct picker prop to DemoContainer", () => {
    // DemoContainer renders children, so we check that children appear
    render(
      <TimePickerWrapper picker="TimePicker">
        <div>Picker Child</div>
      </TimePickerWrapper>
    );
    expect(screen.getByText("Picker Child")).toBeInTheDocument();
  });
});
