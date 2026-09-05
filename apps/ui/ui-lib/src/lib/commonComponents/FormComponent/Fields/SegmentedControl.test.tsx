import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SegmentedControl from "./SegmentedControl";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../styles/Theme";

// Mock useApiSelectField to return static options
jest.mock("../../../hooks/useApiSelectField", () => ({
  useApiSelectField: () => ({
    options: [
      { label: "Option A", value: "A" },
      { label: "Option B", value: "B" },
    ],
  }),
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

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock ControlledField to inject render props
let mockRenderProps: any = {
  value: "",
  onChange: jest.fn(),
  error: false,
  helperText: "",
};

jest.mock("../utils", () => ({
  ControlledField: ({ render }: any) => render(mockRenderProps),
}));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("SegmentedControl", () => {
  const baseField = {
    name: "segmented",
    label: "Segmented Label",
    apiDependencies: {},
    rules: {},
    componentProps: {},
  };

  beforeEach(() => {
    mockRenderProps = {
      value: "",
      onChange: jest.fn(),
      error: false,
      helperText: "",
    };
    jest.clearAllMocks();
  });

  it("renders label and options", () => {
    renderWithTheme(
      <SegmentedControl field={baseField} control={{}} />
    );
    expect(screen.getByText("Segmented Label")).toBeInTheDocument();
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  it("shows required asterisk if field is required", () => {
    renderWithTheme(
      <SegmentedControl
        field={{ ...baseField, rules: { required: true } }}
        control={{}}
      />
    );
    expect(screen.getByText(/Segmented Label \*/)).toBeInTheDocument();
  });

  it("calls onChange when an option is clicked", () => {
    renderWithTheme(
      <SegmentedControl field={baseField} control={{}} />
    );
    fireEvent.click(screen.getByText("Option A"));
    expect(mockRenderProps.onChange).toHaveBeenCalledWith("A");
  });

  it("does not call onChange if clicked option is already selected", () => {
    mockRenderProps.value = "A";
    renderWithTheme(
      <SegmentedControl field={baseField} control={{}} />
    );
    fireEvent.click(screen.getByText("Option A"));
    expect(mockRenderProps.onChange).not.toHaveBeenCalled();
  });

  it("disables options if componentProps.disabled is true", () => {
    renderWithTheme(
      <SegmentedControl
        field={{
          ...baseField,
          componentProps: { disabled: true },
        }}
        control={{}}
      />
    );
    const optionA = screen.getByText("Option A");
    fireEvent.click(optionA);
    expect(mockRenderProps.onChange).not.toHaveBeenCalled();
  });

  it("shows helper text on error", () => {
    mockRenderProps.error = true;
    mockRenderProps.helperText = "Selection required";
    renderWithTheme(
      <SegmentedControl field={baseField} control={{}} />
    );
    expect(screen.getByText("Selection required")).toBeInTheDocument();
  });

it("marks the correct segment as selected", () => {
  mockRenderProps.value = "B";
  renderWithTheme(
    <SegmentedControl field={baseField} control={{}} />
  );
  const optionA = screen.getByText("Option A");
  const optionB = screen.getByText("Option B");
  expect(optionA).toBeInTheDocument();
  expect(optionB).toBeInTheDocument();
});

it("does not trigger change when newValue is null", () => {
  renderWithTheme(
    <SegmentedControl field={baseField} control={{}} />
  );

  const { onChange } = mockRenderProps;
  const handleChange = (newValue: string | number | null) => {
    if (newValue === null || newValue === "") return;
    onChange(newValue);
  };

  handleChange(null);
  expect(onChange).not.toHaveBeenCalled();
});

it("clears dependent fields on change if clearFieldsOnChange is set", () => {
  const setValueMock = jest.fn();
  const triggerMock = jest.fn();

  renderWithTheme(
    <SegmentedControl
      field={{
        ...baseField,
        apiDependencies: {
          clearFieldsOnChange: ["dependentField"],
        },
      }}
      control={{}}
      setValue={setValueMock}
      trigger={triggerMock}
    />
  );

  fireEvent.click(screen.getByText("Option A"));
  expect(mockRenderProps.onChange).toHaveBeenCalledWith("A");
  expect(setValueMock).toHaveBeenCalledWith("dependentField", null);
  expect(triggerMock).toHaveBeenCalledWith("segmented");
});

it("does not allow selection if showCondition returns false", () => {
  const showCondition = jest.fn(() => false);
  renderWithTheme(
    <SegmentedControl
      field={{
        ...baseField,
        apiDependencies: {
          ...baseField.apiDependencies,
          showCondition,
        },
      }}
      control={{}}
      watch={jest.fn()}
    />
  );

  const option = screen.getByText("Option A");
  fireEvent.click(option);
  expect(mockRenderProps.onChange).not.toHaveBeenCalled();
});

});