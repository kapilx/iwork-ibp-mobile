import "@testing-library/jest-dom";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import TimePicker, { TimePickerProps } from "./index";
import { ThemeProvider, createTheme } from "@mui/material/styles";

describe("TimePicker", () => {
  const mockOnChange = jest.fn();

  const defaultProps: TimePickerProps = {
    value: null,
    onChange: mockOnChange,
    label: "Select Time",
    placeholder: "Pick a time",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme({
      typography: {
        fontSizes: {
          md: "1rem",
        },
      },
      shape: {
        borderRadius: 4,
      },
    } as any); 
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  it("calls onChange when a time is selected", () => {
    const { container } = renderWithTheme(<TimePicker {...defaultProps} />);
    fireEvent.click(screen.getByPlaceholderText("Pick a time"));
    const options = (container as any).querySelectorAll("[data-time]");
    fireEvent.click(options[0]);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("auto selects next slot if autoSelectNextSlot is true and value is null", () => {
    renderWithTheme(
      <TimePicker {...defaultProps} autoSelectNextSlot={true} value={null} />
    );
    expect(mockOnChange).toHaveBeenCalled();
  });

  it("scrolls selected time into view when dropdown opens with a value", async () => {
    const mockScroll = jest.fn();
    HTMLElement.prototype.scrollIntoView = mockScroll;
    const value = dayjs("2025-07-14T10:15:00");
    renderWithTheme(<TimePicker {...defaultProps} value={value} />);
    fireEvent.click(screen.getByPlaceholderText("Pick a time"));
    await waitFor(() => {
      expect(mockScroll).toHaveBeenCalled();
    });
  });
  it("closes dropdown when clicking outside the component", () => {
  const { container } = renderWithTheme(<TimePicker {...defaultProps} />);
  fireEvent.click(screen.getByPlaceholderText("Pick a time"));
  expect((container as any).querySelectorAll("[data-time]").length).toBeGreaterThan(0);
  fireEvent.mouseDown(document.body);
  expect((container as any).querySelectorAll("[data-time]").length).toBe(0);
});
});
