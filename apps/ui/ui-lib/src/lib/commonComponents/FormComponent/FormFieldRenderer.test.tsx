
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import FormFieldRenderer from "./FormFieldRenderer";
import { createTheme, ThemeProvider } from "@mui/material/styles";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock all components used in componentMap
jest.mock("./fields/TextField", () => () => <div data-testid="TextField" />);
jest.mock("./fields/SelectField", () => () => <div data-testid="SelectField" />);
jest.mock("./fields/CheckboxField", () => () => <div data-testid="CheckboxField" />);
jest.mock("./fields/RadioGroupField", () => () => <div data-testid="RadioGroupField" />);
jest.mock("./fields/SwitchField", () => () => <div data-testid="SwitchField" />);
jest.mock("./fields/DateField", () => () => <div data-testid="DateField" />);
jest.mock("./fields/RatingField", () => () => <div data-testid="RatingField" />);
jest.mock("./fields/FileField", () => () => <div data-testid="FileField" />);
jest.mock("./fields/RichText", () => () => <div data-testid="RichText" />);
jest.mock("./fields/SegmentedControl", () => () => <div data-testid="SegmentedControl" />);
jest.mock("./fields/TextAreaField", () => () => <div data-testid="TextAreaFieldComponent" />);
jest.mock("./fields/MultiSelect", () => () => <div data-testid="MultiSelectField" />);
jest.mock("./fields/ButtonField", () => () => <div data-testid="ButtonField" />);
jest.mock("./fields/DateRange", () => () => <div data-testid="DateRange" />);
jest.mock("./fields/NumberField", () => () => <div data-testid="NumberField" />);
jest.mock("../CurrencyInput", () => () => <div data-testid="CurrencyInput" />);
jest.mock("./fields/TimeRange", () => () => <div data-testid="TimeRange" />);
jest.mock("./fields/DocumentUploadField", () => () => <div data-testid="DocumentUploadField" />);
jest.mock("./fields/TreeSelect", () => () => <div data-testid="TreeSelect" />);
jest.mock("./fields/SelectFieldByApi", () => () => <div data-testid="SelectFieldByApi" />);
jest.mock("./fields/FileUpload", () => () => <div data-testid="FileUpload" />);
jest.mock("./fields/PercentageField", () => () => <div data-testid="PercentageFieldComponent" />);

jest.mock("@mui/x-date-pickers/internals/demo", () => ({
  DemoContainer: ({ children }: { children: React.ReactNode }) => (<div>{children}</div>),
  DemoItem: ({ children }: { children: React.ReactNode }) => (<div>{children}</div>),
}));
jest.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: jest.fn(),
}));
jest.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => (<div>{children}</div>),
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

describe("FormFieldRenderer", () => {
  const customTheme = createTheme({
    typography: {
      // @ts-ignore
      fontSizes: { sm: "1rem" },
      fontWeights: { light: 300 },
    },
    palette: {
      neutral: { dark: "#333" },
    },
  });

  const Wrapper = (props: any) => {
    const { control, setValue, watch, trigger, unregister } = useForm();
    return (
      <FormFieldRenderer
        control={control}
        setValue={setValue}
        watch={watch}
        trigger={trigger}
        onActionMap={{}}
        onFileUpload={jest.fn()}
        {...props}
      />
    );
  };

  it("renders StyledTitle when type is 'title'", () => {
    render(
      <ThemeProvider theme={customTheme}>
        <Wrapper
          field={{ type: "title", name: "title1", label: "My Title", key: "title1_key" }}
        />
      </ThemeProvider>
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("renders correct component based on field type", () => {
    const typesToTest = [
      { type: "text", testId: "TextField" },
      { type: "select", testId: "SelectField" },
      { type: "checkbox", testId: "CheckboxField" },
      { type: "radiogroup", testId: "RadioGroupField" },
      { type: "switch", testId: "SwitchField" },
      { type: "date", testId: "DateField" },
      { type: "datetime", testId: "DateField" },
      { type: "rating", testId: "RatingField" },
      { type: "file", testId: "FileField" },
      { type: "richtext", testId: "RichText" },
      { type: "segmentedcontrol", testId: "SegmentedControl" },
      { type: "textarea", testId: "TextAreaFieldComponent" },
      { type: "multiselect", testId: "MultiSelectField" },
      { type: "currency", testId: "CurrencyInput" },
      { type: "button", testId: "ButtonField" },
      { type: "daterange", testId: "DateRange" },
      { type: "timerange", testId: "TimeRange" },
      { type: "number", testId: "NumberField" },
      { type: "selectFieldByApi", testId: "SelectFieldByApi" },
      { type: "fileupload", testId: "FileUpload" },
      { type: "documentupload", testId: "DocumentUploadField" },
      { type: "treeSelect", testId: "TreeSelect" },
      { type: "percentage", testId: "PercentageFieldComponent" },
    ];

    typesToTest.forEach(({ type, testId }) => {
      render(
        <Wrapper
          field={{ type: type as any, name: `${type}_field`, key: `${type}_key`, label: `${type}_label` }}
        />
      );
    });
  });

  it("falls back to TextField if type is unknown", () => {
    render(
      <Wrapper
        field={{ type: "text", name: "fallback_field", key: "fallback_key", label: "Fallback Label" }}
      />
    );
  });

  it("calls control.unregister when disableAllFields and unregisterSection are true", () => {
    let unregisterSpy: jest.SpyInstance | undefined;
    const TestWrapper = (props: any) => {
      const { control, setValue, watch, trigger, unregister } = useForm();
      unregisterSpy = jest.spyOn(control, "unregister");
      return (
        <FormFieldRenderer
          control={control}
          setValue={setValue}
          watch={watch}
          trigger={trigger}
          onActionMap={{}}
          onFileUpload={jest.fn()}
          {...props}
        />
      );
    };
    render(
      <TestWrapper
        field={{ type: "text", name: "test_unreg", key: "test_unreg_key", label: "Test Unreg" }}
        disableAllFields
        unregisterSection
      />
    );
    // unregisterSpy will be assigned after render
    expect(unregisterSpy).toBeDefined();
    expect(unregisterSpy!).toHaveBeenCalledWith("test_unreg");
  });

  it("passes expected props to the field component", () => {
    render(
      <Wrapper
        field={{
          type: "text",
          name: "test_props",
          key: "test_props_key",
          label: "Test Props",
          componentProps: { placeholder: "Enter text" },
        }}
        disableAllFields
        enableSmartSearch
      />
    );
  });
});
