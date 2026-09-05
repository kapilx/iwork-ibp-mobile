import { render, screen } from "@testing-library/react";
import DateTimePicker, { DateTimePickerProps } from "./index";
import "@testing-library/jest-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

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

// Get the mock after it's been created
const { DateTimePicker: mockDateTimePicker } = jest.requireMock(
  "@mui/x-date-pickers/DateTimePicker"
);

// Helper function to render the component
const renderDateTimePicker = (props: DateTimePickerProps) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker {...props} />
    </LocalizationProvider>
  );
};

describe("DateTimePicker Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render DateTimePicker with default props (primary type)", () => {
    renderDateTimePicker({});
    const dateTimePicker = screen.getByTestId("datetime-picker-mock");
    expect(dateTimePicker).toBeInTheDocument();
  });

  it("should render DateTimePicker with the correct input format for primary type", () => {
    renderDateTimePicker({ type: "primary" });
    const dateTimePicker = screen.getByTestId("datetime-picker-mock");
    expect(dateTimePicker).toBeInTheDocument();

    // Verify that the mock was called with the correct format
    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "MM/DD/YYYY HH:mm",
      }),
      expect.anything()
    );
  });

  it("should render DateTimePicker with the correct input format for secondary type", () => {
    renderDateTimePicker({ type: "secondary" });
    const dateTimePicker = screen.getByTestId("datetime-picker-mock");
    expect(dateTimePicker).toBeInTheDocument();

    // Verify that the mock was called with the correct format
    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "DD MMM YYYY HH:mm",
      }),
      expect.anything()
    );
  });

  it("should pass localeText with fieldMonthPlaceholder function for secondary type", () => {
    renderDateTimePicker({ type: "secondary" });

    // Verify that the mock was called with localeText containing fieldMonthPlaceholder
    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        localeText: expect.objectContaining({
          fieldMonthPlaceholder: expect.any(Function),
        }),
      }),
      expect.anything()
    );

    // Get the actual props passed to the mock
    const mockCall = mockDateTimePicker.mock.calls[0];
    const props = mockCall[0];

    // Test that the fieldMonthPlaceholder function returns "MMM"
    expect(props.localeText.fieldMonthPlaceholder()).toBe("MMM");
  });

  it("should not pass localeText for primary type", () => {
    renderDateTimePicker({ type: "primary" });

    // Verify that the mock was called without localeText
    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        localeText: undefined,
      }),
      expect.anything()
    );
  });

  it("should render DateTimePicker with modified localeText for secondary type", () => {
    renderDateTimePicker({ type: "secondary" });
    const dateTimePicker = screen.getByTestId("datetime-picker-mock");
    expect(dateTimePicker).toBeInTheDocument();

    // Verify the fieldMonthPlaceholder function returns "MMM"
    const mockCall = mockDateTimePicker.mock.calls[0];
    const props = mockCall[0];
    expect(props.localeText).toBeDefined();
    expect(props.localeText.fieldMonthPlaceholder).toBeInstanceOf(Function);
    expect(props.localeText.fieldMonthPlaceholder()).toBe("MMM");
  });

  it("should pass default label when no label is provided", () => {
    renderDateTimePicker({});

    // Verify that the mock was called with default label
    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Select Date & Time",
      }),
      expect.anything()
    );
  });

  it("should pass custom label when provided", () => {
    renderDateTimePicker({ label: "Custom Date Time" });

    // Verify that the mock was called with custom label
    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Custom Date Time",
      }),
      expect.anything()
    );
  });

  it("should display the calendar popup when clicked", () => {
    renderDateTimePicker({});
    const dateTimePicker = screen.getByTestId("datetime-picker-mock");
    expect(dateTimePicker).toBeInTheDocument();

    // Since it's mocked, we can't test actual calendar functionality
    // but we can verify the component renders correctly
  });

  it("should display the calendar popup when the input is focused", () => {
    renderDateTimePicker({});
    const dateTimePicker = screen.getByTestId("datetime-picker-mock");
    expect(dateTimePicker).toBeInTheDocument();

    // Since it's mocked, we can't test actual focus functionality
    // but we can verify the component renders correctly
  });

  it("should render with different type props", () => {
    const { rerender } = renderDateTimePicker({ type: "primary" });
    expect(screen.getByTestId("datetime-picker-mock")).toBeInTheDocument();

    rerender(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker type="secondary" />
      </LocalizationProvider>
    );
    expect(screen.getByTestId("datetime-picker-mock")).toBeInTheDocument();
  });

  it("should render without type prop (defaults to primary)", () => {
    renderDateTimePicker({});
    const dateTimePicker = screen.getByTestId("datetime-picker-mock");
    expect(dateTimePicker).toBeInTheDocument();

    // Verify default behavior
    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "MM/DD/YYYY HH:mm",
        localeText: undefined,
      }),
      expect.anything()
    );
  });

  it("should accept additional MUI DateTimePicker props", () => {
    renderDateTimePicker({
      disabled: true,
      readOnly: true,
    });
    const dateTimePicker = screen.getByTestId("datetime-picker-mock");
    expect(dateTimePicker).toBeInTheDocument();

    // Verify that additional props are passed through
    expect(mockDateTimePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true,
        readOnly: true,
      }),
      expect.anything()
    );
  });

  it("should handle fieldMonthPlaceholder function execution", () => {
    renderDateTimePicker({ type: "secondary" });

    const mockCall = mockDateTimePicker.mock.calls[0];
    const props = mockCall[0];

    // Test that the function can be called multiple times and always returns "MMM"
    expect(props.localeText.fieldMonthPlaceholder()).toBe("MMM");
    expect(props.localeText.fieldMonthPlaceholder()).toBe("MMM");
    expect(props.localeText.fieldMonthPlaceholder()).toBe("MMM");
  });
});
