import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import ToggleButton, { ToggleButtonProps } from "./index";
import { theme } from "@ui/ui-lib/styles";

describe("ToggleButton Component", () => {
  const mockOnChange = jest.fn();

  const defaultProps: ToggleButtonProps = {
    value: "list",
    onChange: mockOnChange,
    listView: "list-icon.svg",
    listViewActive: "list-icon-active.svg",
    calendarView: "calendar-icon.svg",
    calendarViewActive: "calendar-icon-active.svg",
  };

  const renderWithTheme = (props: Partial<ToggleButtonProps> = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <ToggleButton {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders toggle container with both buttons", () => {
    renderWithTheme();

    expect(screen.getByTestId("toggle-container")).toBeInTheDocument();
    expect(screen.getByLabelText("Calendar View")).toBeInTheDocument();
    expect(screen.getByLabelText("List View")).toBeInTheDocument();
  });

  it("renders with default aria labels", () => {
    renderWithTheme();

    expect(screen.getByLabelText("Calendar View")).toBeInTheDocument();
    expect(screen.getByLabelText("List View")).toBeInTheDocument();
  });

  it("renders with custom aria labels", () => {
    renderWithTheme({
      ariaLabelList: "Custom List View",
      ariaLabelCalendar: "Custom Calendar View",
    });

    expect(screen.getByLabelText("Custom Calendar View")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom List View")).toBeInTheDocument();
  });

  it("displays correct icons when list view is active", () => {
    renderWithTheme({ value: "list" });

    const calendarIcon = screen.getByAltText("Calendar View");
    const listIcon = screen.getByAltText("List View");

    expect(calendarIcon).toHaveAttribute("src", "calendar-icon.svg");
    expect(listIcon).toHaveAttribute("src", "list-icon-active.svg");
  });

  it("displays correct icons when calendar view is active", () => {
    renderWithTheme({ value: "calendar" });

    const calendarIcon = screen.getByAltText("Calendar View");
    const listIcon = screen.getByAltText("List View");

    expect(calendarIcon).toHaveAttribute("src", "calendar-icon-active.svg");
    expect(listIcon).toHaveAttribute("src", "list-icon.svg");
  });

  it("calls onChange with 'calendar' when calendar button is clicked", () => {
    renderWithTheme({ value: "list" });

    const calendarButton = screen.getByLabelText("Calendar View");
    fireEvent.click(calendarButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith("calendar");
  });

  it("calls onChange with 'list' when list button is clicked", () => {
    renderWithTheme({ value: "calendar" });

    const listButton = screen.getByLabelText("List View");
    fireEvent.click(listButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith("list");
  });

  it("applies correct alt attributes to icons", () => {
    renderWithTheme();

    expect(screen.getByAltText("Calendar View")).toBeInTheDocument();
    expect(screen.getByAltText("List View")).toBeInTheDocument();
  });

  it("renders icons with correct dimensions", () => {
    renderWithTheme();

    const calendarIcon = screen.getByAltText("Calendar View");
    const listIcon = screen.getByAltText("List View");

    expect(calendarIcon).toHaveStyle({ width: "24px", height: "24px" });
    expect(listIcon).toHaveStyle({ width: "24px", height: "24px" });
  });

  it("accepts custom width prop", () => {
    renderWithTheme({ width: 200 });

    const toggleContainer = screen.getByTestId("toggle-container");
    expect(toggleContainer).toBeInTheDocument();
  });

  it("accepts custom width as string", () => {
    renderWithTheme({ width: "300px" });

    const toggleContainer = screen.getByTestId("toggle-container");
    expect(toggleContainer).toBeInTheDocument();
  });

  it("maintains accessibility with keyboard navigation", () => {
    renderWithTheme();

    const calendarButton = screen.getByLabelText("Calendar View");
    const listButton = screen.getByLabelText("List View");

    // Both buttons should be focusable
    expect(calendarButton).toHaveAttribute("tabindex", "0");
    expect(listButton).toHaveAttribute("tabindex", "0");
  });

  it("handles rapid clicks correctly", () => {
    renderWithTheme({ value: "list" });

    const calendarButton = screen.getByLabelText("Calendar View");

    // Click multiple times rapidly
    fireEvent.click(calendarButton);
    fireEvent.click(calendarButton);
    fireEvent.click(calendarButton);

    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenCalledWith("calendar");
  });

  it("switches between states correctly", () => {
    const { rerender } = renderWithTheme({ value: "list" });

    // Initially list is active
    expect(screen.getByAltText("List View")).toHaveAttribute(
      "src",
      "list-icon-active.svg"
    );
    expect(screen.getByAltText("Calendar View")).toHaveAttribute(
      "src",
      "calendar-icon.svg"
    );

    // Re-render with calendar active
    rerender(
      <ThemeProvider theme={theme}>
        <ToggleButton {...defaultProps} value="calendar" />
      </ThemeProvider>
    );

    expect(screen.getByAltText("Calendar View")).toHaveAttribute(
      "src",
      "calendar-icon-active.svg"
    );
    expect(screen.getByAltText("List View")).toHaveAttribute(
      "src",
      "list-icon.svg"
    );
  });

  it("provides correct button roles", () => {
    renderWithTheme();

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);

    buttons.forEach((button) => {
      expect(button).toBeInTheDocument();
    });
  });

  it("handles edge case with different icon sets", () => {
    const customProps = {
      listView: "custom-list.svg",
      listViewActive: "custom-list-active.svg",
      calendarView: "custom-calendar.svg",
      calendarViewActive: "custom-calendar-active.svg",
    };

    renderWithTheme({ ...customProps, value: "list" });

    expect(screen.getByAltText("List View")).toHaveAttribute(
      "src",
      "custom-list-active.svg"
    );
    expect(screen.getByAltText("Calendar View")).toHaveAttribute(
      "src",
      "custom-calendar.svg"
    );
  });
});
