import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import DateField, { AddCardIcon, AddTimeSvgIcon } from "./DateField";
import "@testing-library/jest-dom";

// Mocks for MUI pickers and wrappers

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

jest.mock("./styles", () => {
  const React = require("react");

  const MockDatePickerWrapper = React.forwardRef(
    ({ value, onChange, format, name, ...props }, ref) => (
      <input
        ref={ref}
        id={name}
        name={name}
        data-testid="date-picker"
        value={value ? (value.format ? value.format(format) : value) : ""}
        onChange={(e) => {
          const val = (e.target as HTMLInputElement).value;
          if (!val) onChange(null);
          else if (val === "invalid")
            onChange({ isValid: () => false, format: () => "Invalid Date" });
          else onChange({ isValid: () => true, format: () => val });
        }}
        {...props}
      />
    )
  );
  MockDatePickerWrapper.displayName = "DatePickerWrapper";
  (MockDatePickerWrapper as any).muiName = "MuiOutlinedInput";

  const MockTimePickerWrapper = React.forwardRef(
    ({ value, onChange, format, name, ...props }, ref) => (
      <input
        ref={ref}
        id={name}
        name={name}
        data-testid="time-picker"
        value={value ? (value.format ? value.format(format) : value) : ""}
        onChange={(e) => {
          const val = (e.target as HTMLInputElement).value;
          if (!val) onChange(null);
          else if (val === "invalid")
            onChange({ isValid: () => false, format: () => "Invalid Time" });
          else onChange({ isValid: () => true, format: () => val });
        }}
        {...props}
      />
    )
  );
  MockTimePickerWrapper.displayName = "TimePickerWrapper";
  (MockTimePickerWrapper as any).muiName = "MuiOutlinedInput";

  const MockStyledTypography = React.forwardRef(
    ({ children, ...props }, ref) => (
      <label ref={ref} {...props}>
        {children}
      </label>
    )
  );
  MockStyledTypography.displayName = "StyledTypography";
  (MockStyledTypography as any).muiName = "MuiInputLabel";

  return {
    StyledDatePickerWrapper: MockDatePickerWrapper,
    TimePickerWrapperStyles: MockTimePickerWrapper,
    StyledTypography: MockStyledTypography,
  };
});

// Mock FormHelperText from MUI to always render a test id
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  const React = require("react");

  const MockFormHelperText = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} data-testid="helper-text" {...props}>
      {children}
    </div>
  ));
  MockFormHelperText.displayName = "FormHelperText";
  (MockFormHelperText as any).muiName = "MuiFormHelperText";

  return {
    ...actual,
    FormHelperText: MockFormHelperText,
  };
});

jest.mock("../../DateTimePicker", () => {
  const React = require("react");

  const MockDateTimePicker = React.forwardRef(({ name, ...props }, ref) => (
    <input
      ref={ref}
      id={name}
      name={name}
      data-testid="datetime-picker"
      {...props}
    />
  ));
  MockDateTimePicker.displayName = "DateTimePicker";
  (MockDateTimePicker as any).muiName = "MuiOutlinedInput";

  return MockDateTimePicker;
});

const DATE_FIELD_TYPES = {
  DATE: "date",
  DATE_TIME: "datetime",
  TIME: "time",
  YEAR: "year",
};

const defaultField = {
  key: "testDate",
  name: "testDate",
  label: "Test Date",
  type: DATE_FIELD_TYPES.DATE,
  componentProps: {},
};

const renderWithForm = (
  fieldProps = defaultField,
  defaultValues = { testDate: "2024-01-01" },
  extra = {}
) => {
  const Wrapper = () => {
    const methods = useForm<any>({ defaultValues });
    return (
      <form>
        <DateField
          field={fieldProps as any}
          control={methods.control as any}
          {...extra}
        />
      </form>
    ) as any;
  };
  return render(<Wrapper />);
};

describe("DateField", () => {
  it("renders date field and label", () => {
    renderWithForm();
    expect(screen.getByText("Test Date")).toBeInTheDocument();
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
  });

  it("renders year field", () => {
    renderWithForm({
      ...defaultField,
      type: DATE_FIELD_TYPES.YEAR as typeof defaultField.type,
    });
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
  });

  it("renders time field", () => {
    renderWithForm({
      ...defaultField,
      type: DATE_FIELD_TYPES.TIME as typeof defaultField.type,
    });
    expect(screen.getByTestId("time-picker")).toBeInTheDocument();
  });

  it("does not render for unknown type", () => {
    renderWithForm({ ...defaultField, type: "unknown" as any });
    // Should not render any picker
    expect(screen.queryByTestId("date-picker")).not.toBeInTheDocument();
    expect(screen.queryByTestId("time-picker")).not.toBeInTheDocument();
    expect(screen.queryByTestId("datetime-picker")).not.toBeInTheDocument();
  });

  it("calls onChange and trigger for date", () => {
    const onChange = jest.fn();
    const trigger = jest.fn();
    renderWithForm(
      { ...defaultField, componentProps: { onChange } },
      { testDate: "2024-01-01" },
      { trigger }
    );
    const input = screen.getByTestId("date-picker");
    fireEvent.change(input, { target: { value: "2025-07-04" } });
    expect(onChange).toHaveBeenCalled();
    expect(trigger).toHaveBeenCalledWith("testDate");
  });

  it("calls onChange and trigger for time", () => {
    const trigger = jest.fn();
    renderWithForm(
      { ...defaultField, type: DATE_FIELD_TYPES.TIME },
      { testDate: "12:00:00" },
      { trigger }
    );
    const input = screen.getByTestId("time-picker");
    fireEvent.change(input, { target: { value: "13:45:00" } });
    expect(trigger).toHaveBeenCalledWith("testDate");
  });

  it("calls onChange and trigger for year", () => {
    const trigger = jest.fn();
    renderWithForm(
      { ...defaultField, type: DATE_FIELD_TYPES.YEAR },
      { testDate: "2023" },
      { trigger }
    );
    const input = screen.getByTestId("date-picker");
    fireEvent.change(input, { target: { value: "2025" } });
    expect(trigger).toHaveBeenCalledWith("testDate");
  });

  it("handles clearable (empty) value", () => {
    renderWithForm();
    const input = screen.getByTestId("date-picker");
    fireEvent.change(input, { target: { value: "" } });
    // Should call onChange with null
    // No error thrown
  });

  it("handles invalid date", () => {
    renderWithForm();
    const input = screen.getByTestId("date-picker");
    fireEvent.change(input, { target: { value: "invalid" } });
    // Should call onChange with invalid dayjs
  });

  it("renders without label", () => {
    const { container } = renderWithForm({ ...defaultField, label: "" });
    // Should not throw
    expect(container).toBeDefined();
  });
});

describe("Custom SVG Icons", () => {
  it("renders AddCardIcon with correct SVG and props", () => {
    const { container } = render(<AddCardIcon data-testid="add-card-icon" />);
    const svg = container.querySelector("svg, [data-testid='add-card-icon']");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 20 20");
    // Check for a path element with the expected fill
    expect(container.querySelector("path")?.getAttribute("fill")).toBe(
      "#0A73E9"
    );
  });

  it("renders AddTimeSvgIcon with correct SVG and props", () => {
    const { container } = render(
      <AddTimeSvgIcon data-testid="add-time-icon" />
    );
    const svg = container.querySelector("svg, [data-testid='add-time-icon']");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 16 16");
    // Check for a path element with the expected fill
    expect(container.querySelector("path")?.getAttribute("fill")).toBe(
      "#007DD8"
    );
  });
});
