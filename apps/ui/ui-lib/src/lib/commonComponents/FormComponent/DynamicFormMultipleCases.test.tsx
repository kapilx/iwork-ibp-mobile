import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import DynamicFormMultipleCases from "./DynamicFormMultipleCases";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock FormFieldRenderer as a jest mock so we can inspect call arguments.
jest.mock("./FormFieldRenderer", () => {
  const mock = jest.fn((props: any) => (
    <div data-testid={`mock-field-${props.field.type}`} />
  ));
  return mock; // default export
});
import FormFieldRenderer from "./FormFieldRenderer"; // after mock so it's the mocked function

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

const renderWithFormProvider = (ui: React.ReactElement) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm();
    return <FormProvider {...methods}>{children}</FormProvider>;
  };
  return render(ui, { wrapper: Wrapper });
};

describe("DynamicFormMultipleCases", () => {
  it("renders with custom styles", () => {
    const formConfig = [
      { type: "text", name: "field1", key: "field1", label: "Field 1" },
    ];
    renderWithFormProvider(
      <DynamicFormMultipleCases
        formConfig={formConfig}
        sx={{ background: "red" }}
      />
    );
    // Ensures our mocked field rendered.
    expect(screen.getByTestId("mock-field-text")).toBeInTheDocument();
  });

  it("sets fromName and toName with prefix for range picker fields", () => {
    const formConfig = [
      {
        type: "daterange", // Use your actual enum if needed
        name: "dateRange",
        key: "dateRange",
        label: "Date Range",
        fromName: "fromDate",
        toName: "toDate",
        componentProps: {},
      },
    ];
    renderWithFormProvider(
      <DynamicFormMultipleCases formConfig={formConfig} prefix="sectionB" />
    );
    // Ensure mock component rendered
    expect(screen.getByTestId("mock-field-daterange")).toBeInTheDocument();
    const mockFn = FormFieldRenderer as unknown as jest.Mock;
    expect(mockFn).toHaveBeenCalled();
    const passedProps = mockFn.mock.calls.find(
      (call) => call[0]?.field?.type === "daterange"
    )?.[0];
    expect(passedProps).toBeTruthy();
    expect(passedProps.field.fromName).toBe("sectionB.fromDate");
    expect(passedProps.field.toName).toBe("sectionB.toDate");
  });
});
