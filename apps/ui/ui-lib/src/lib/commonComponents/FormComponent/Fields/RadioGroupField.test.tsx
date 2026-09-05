import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RadioGroupField from "./RadioGroupField";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../styles/Theme"; 

//  Shared mock render props
let mockRenderProps: any = {
  name: "testRadioGroup",
  value: "",
  onChange: jest.fn(),
  onBlur: jest.fn(),
  error: false,
  helperText: "",
  label: "Test Group Label",
};

//  Render helper with MUI theme
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

//  Mock ControlledField to inject mockRenderProps
jest.mock("../utils", () => ({
  ControlledField: ({ render }: any) => render(mockRenderProps),
}));

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

describe("RadioGroupField", () => {
  const options = [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
  ];

  beforeEach(() => {
    mockRenderProps = {
      name: "testRadioGroup",
      value: "",
      onChange: jest.fn(),
      onBlur: jest.fn(),
      error: false,
      helperText: "",
      label: "Test Group Label",
    };
  });

  it("renders radio group with options", () => {
    renderWithTheme(
      <RadioGroupField
        field={{ name: "testRadioGroup", label: "Test Group Label", options }}
        control={{}}
      />
    );

    expect(screen.getByLabelText("Test Group Label")).toBeInTheDocument();
    expect(screen.getByLabelText("Yes")).toBeInTheDocument();
    expect(screen.getByLabelText("No")).toBeInTheDocument();
  });

  it("calls onChange with correct string value", () => {
    renderWithTheme(
      <RadioGroupField
        field={{ name: "testRadioGroup", label: "Test Group Label", options }}
        control={{}}
      />
    );

    fireEvent.click(screen.getByLabelText("Yes"));
    expect(mockRenderProps.onChange).toHaveBeenCalledWith("true");

    fireEvent.click(screen.getByLabelText("No"));
    expect(mockRenderProps.onChange).toHaveBeenCalledWith("false");
  });

  it("displays helper text on validation error", () => {
    mockRenderProps.error = true;
    mockRenderProps.helperText = "Selection required";

    renderWithTheme(
      <RadioGroupField
        field={{ name: "testRadioGroup", label: "Test Group Label", options }}
        control={{}}
      />
    );

    expect(screen.getByText("Selection required")).toBeInTheDocument();
  });

  it("renders without label when not provided", () => {
    mockRenderProps.label = "";

    renderWithTheme(
      <RadioGroupField
        field={{ name: "testRadioGroup", options }}
        control={{}}
      />
    );

    expect(screen.queryByText("Test Group Label")).not.toBeInTheDocument();
  });

  it("marks the correct radio as checked based on value", () => {
    mockRenderProps.value = "true";

    renderWithTheme(
      <RadioGroupField
        field={{ name: "testRadioGroup", label: "Test Group Label", options }}
        control={{}}
      />
    );

    const yesRadio = screen.getByLabelText("Yes") as HTMLInputElement;
    const noRadio = screen.getByLabelText("No") as HTMLInputElement;

    expect(yesRadio.checked).toBe(true);
    expect(noRadio.checked).toBe(false);
  });

  it("renders custom variant radio buttons", () => {
    renderWithTheme(
      <RadioGroupField
        field={{
          name: "testRadioGroup",
          label: "Test Group Label",
          options,
          variant: "custom",
        }}
        control={{}}
      />
    );

    expect(screen.getByLabelText("Yes")).toBeInTheDocument();
    expect(screen.getByLabelText("No")).toBeInTheDocument();
  });

  it("renders nothing if options are not provided", () => {
    renderWithTheme(
      <RadioGroupField
        field={{ name: "testRadioGroup", label: "Test Group Label" }}
        control={{}}
      />
    );

    const group = screen.getByRole("radiogroup");
    expect(group.childElementCount).toBe(0);
  });

  it("checks the correct custom radio input based on value", () => {
    mockRenderProps.value = "false";

    renderWithTheme(
      <RadioGroupField
        field={{
          name: "testRadioGroup",
          label: "Test Group Label",
          options,
          variant: "custom",
        }}
        control={{}}
      />
    );

    const yesRadio = screen.getByLabelText("Yes") as HTMLInputElement;
    const noRadio = screen.getByLabelText("No") as HTMLInputElement;

    expect(yesRadio.checked).toBe(false);
    expect(noRadio.checked).toBe(true);
  });
});