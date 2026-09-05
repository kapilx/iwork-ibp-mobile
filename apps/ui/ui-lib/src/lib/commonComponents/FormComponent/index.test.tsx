import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import DynamicForm from "./index";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock FormFieldRenderer to just render a div with testid
jest.mock("./FormFieldRenderer", () => (props: any) => (
  <div data-testid={`mock-field-${props.field.type}`} {...props} />
));

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

describe("DynamicForm", () => {
  const formConfig = [
    { type: "text", name: "field1", key: "field1", label: "Field 1" },
    {
      type: "select",
      name: "field2",
      key: "field2",
      label: "Field 2",
      componentProps: { options: ["A", "B"] },
    },
    { type: "checkbox", name: "field3", key: "field3", label: "Field 3" },
    {
      type: "daterange",
      name: "dateRange",
      key: "dateRange",
      label: "Date Range",
      fromName: "fromDate",
      toName: "toDate",
    },
    {
      type: "text",
      name: "hiddenField",
      key: "hiddenField",
      label: "Hidden Field",
      showField: () => false,
    },
  ];

  const defaultValues = {
    field1: "default text",
    field2: "A",
    field3: true,
    fromDate: "2025-01-01",
    toDate: "2025-01-31",
  };

  const renderWithFormProvider = (ui: React.ReactElement) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm();
      return <FormProvider {...methods}>{children}</FormProvider>;
    };
    return render(ui, { wrapper: Wrapper });
  };

  it("renders all visible fields", () => {
    renderWithFormProvider(
      <DynamicForm formConfig={formConfig} defaultValues={defaultValues} />
    );
    expect(screen.getByTestId("mock-field-text")).toBeInTheDocument();
    expect(screen.getByTestId("mock-field-select")).toBeInTheDocument();
    expect(screen.getByTestId("mock-field-checkbox")).toBeInTheDocument();
    expect(screen.getByTestId("mock-field-daterange")).toBeInTheDocument();
    expect(
      screen.queryByTestId("mock-field-hiddenField")
    ).not.toBeInTheDocument();
  });

  it("calls formMethods prop with methods", () => {
    const formMethodsMock = jest.fn();
    renderWithFormProvider(
      <DynamicForm formConfig={formConfig} formMethods={formMethodsMock} />
    );
    expect(formMethodsMock).toHaveBeenCalled();
  });

  it("resets form when shouldReset is true", () => {
    const { rerender } = renderWithFormProvider(
      <DynamicForm
        formConfig={formConfig}
        defaultValues={defaultValues}
        shouldReset={false}
      />
    );
    rerender(
      <DynamicForm
        formConfig={formConfig}
        defaultValues={{ ...defaultValues, field1: "changed" }}
        shouldReset={true}
      />
    );
    expect(screen.getByTestId("mock-field-text")).toBeInTheDocument();
  });

  it("renders correct grid columns", () => {
    const config = [
      { type: "text", name: "col5", key: "col5", label: "Col5", gridColumn: 5 },
      { type: "text", name: "col9", key: "col9", label: "Col9", gridColumn: 9 },
      {
        type: "text",
        name: "col12",
        key: "col12",
        label: "Col12",
        gridColumn: 12,
      },
    ];
    renderWithFormProvider(<DynamicForm formConfig={config} />);
    expect(screen.getByTestId("form-field-text-col5")).toBeInTheDocument();
    expect(screen.getByTestId("form-field-text-col9")).toBeInTheDocument();
    expect(screen.getByTestId("form-field-text-col12")).toBeInTheDocument();
  });

  it("should call preventDefault and stopPropagation on form submit", () => {
    // Render the form
    renderWithFormProvider(<DynamicForm formConfig={formConfig} />);

    // Get the form element by its testid
    const form = screen.getByTestId("mock-field-text").closest("form");
    if (!form) {
      throw new Error("Form element not found");
    }

    // Spy on the form's native event methods
    const preventDefaultSpy = jest.spyOn(Event.prototype, "preventDefault");
    const stopPropagationSpy = jest.spyOn(Event.prototype, "stopPropagation");

    // Trigger the submit event
    fireEvent.submit(form);

    // Assert both functions were called
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();

    preventDefaultSpy.mockRestore();
    stopPropagationSpy.mockRestore();
  });
});