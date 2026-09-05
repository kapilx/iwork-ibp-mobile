import { render, screen, fireEvent } from "@testing-library/react";
import DatePicker, { DatePickerProps } from "./index";
import "@testing-library/jest-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Helper function to render the component
const renderDatePicker = (props: DatePickerProps) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker {...props} />
    </LocalizationProvider>,
  );
};

describe("DatePicker Component", () => {
  it("should render DatePicker with default props (primary type)", () => {
    renderDatePicker({});
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  it("should render DatePicker with the correct input format for primary type", () => {
    renderDatePicker({ type: "primary" });
    const input = screen.getByRole("textbox");
    // Check if the input format is DD/MM/YYYY
    expect(input).toHaveAttribute("placeholder", "DD/MM/YYYY");
  });

  it("should render DatePicker with the correct input format for secondary type", () => {
    renderDatePicker({ type: "secondary" });
    const input = screen.getByRole("textbox");
    // Check if the input format is DD MMM YYYY
    expect(input).toHaveAttribute("placeholder", "DD MMM YYYY");
  });

  it("should render DatePicker with modified localeText for secondary type", () => {
    renderDatePicker({ type: "secondary" });
    // Check if localeText modification is applied
    const monthPlaceholder = screen.getByText((_, element) => {
      const inputElement = element as HTMLInputElement;
      return (
        inputElement.tagName.toLowerCase() === "input" &&
        inputElement.placeholder.includes("MMM")
      );
    });
    expect(monthPlaceholder).toBeInTheDocument();
  });

  it("should display the calendar popup when clicked", async () => {
    renderDatePicker({});

    // Get the input element and click it to open the calendar
    const input = screen.getByRole("textbox");
    fireEvent.click(input);

    // Check if the calendar button or popup appears (adjust based on actual DOM)
    const calendarButton = await screen.findByRole("button", {
      name: /choose date/i,
    });
    expect(calendarButton).toBeInTheDocument();
  });

  it("should display the calendar popup when the input is focused", async () => {
    renderDatePicker({});

    // Get the input element and focus it to open the calendar
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);

    // Check if the calendar button or popup appears (adjust based on actual DOM)
    const calendarButton = await screen.findByRole("button", {
      name: /choose date/i,
    });
    expect(calendarButton).toBeInTheDocument();
  });
});
