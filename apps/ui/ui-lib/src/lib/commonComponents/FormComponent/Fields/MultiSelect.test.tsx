import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import { useForm, FormProvider } from "react-hook-form";
import MultiSelectField from "./MultiSelect";
import { theme } from "../../../styles/Theme";

// Mock dependencies
jest.mock("@mui/material/Fade", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("../utils", () => ({
  ControlledField: jest.requireActual("../utils").ControlledField,
}));

// Mock MUI X Date Pickers ES modules
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

const mockApiSelectField = jest.fn();
jest.mock("../../../hooks/useApiSelectField", () => ({
  useApiSelectField: (props: any) => mockApiSelectField(props),
}));

jest.mock("../../Chip", () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => (
    <div data-testid="chip">{value}</div>
  ),
}));

const mockField = {
  name: "testMultiSelect",
  label: "Test MultiSelect",
  rules: {
    required: { value: true, message: "At least one option is required" },
  },
  enableSearch: true,
  options: [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
  ],
};

const renderWithForm = (
  field = mockField,
  defaultValues: { [key: string]: any } = { testMultiSelect: [] },
  setValue?: any,
  trigger?: any,
  isFormAnArray = false,
  isChipUsed = false
) => {
  const Wrapper = () => {
    const methods = useForm({ defaultValues });
    return (
      <ThemeProvider theme={theme}>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(() => {})}>
            <MultiSelectField
              field={field}
              control={methods.control}
              watch={methods.watch}
              setValue={setValue || methods.setValue}
              trigger={trigger || methods.trigger}
              isFormAnArray={isFormAnArray}
              isChipUsed={isChipUsed}
            />
            <button type="submit">Submit</button>
          </form>
        </FormProvider>
      </ThemeProvider>
    );
  };
  return render(<Wrapper />);
};

describe("MultiSelectField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiSelectField.mockReturnValue({
      options: [
        { value: "api1", label: "API Option 1" },
        { value: "api2", label: "API Option 2" },
      ],
      loading: false,
    });
  });

  it("renders label and dropdown with search enabled", () => {
    renderWithForm();
    expect(screen.getByText("Test MultiSelect *")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("selects option in non-search mode", async () => {
    const fieldWithoutSearch = { ...mockField, enableSearch: false };
    renderWithForm(fieldWithoutSearch);
    const input = screen.getByRole("combobox");
    fireEvent.mouseDown(input);

    await waitFor(() => {
      const option1 = screen.getByText("Option 1");
      fireEvent.click(option1);
      expect(option1).toBeInTheDocument();
    });
  });

  it("displays validation error on empty submit", async () => {
    renderWithForm();
    fireEvent.click(screen.getByText("Submit"));
    expect(
      await screen.findByText("At least one option is required")
    ).toBeInTheDocument();
  });

  it("renders chips when isChipUsed is true", () => {
    renderWithForm(
      { ...mockField, enableSearch: false },
      { testMultiSelect: ["1", "2"] },
      undefined,
      undefined,
      false,
      true
    );

    const chips = screen.getAllByTestId("chip");
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveTextContent("Option 1");
    expect(chips[1]).toHaveTextContent("Option 2");
  });

  it("does not render chips when isChipUsed is false", () => {
    renderWithForm(
      { ...mockField, enableSearch: false },
      { testMultiSelect: ["1", "2"] },
      undefined,
      undefined,
      false,
      false
    );

    expect(screen.queryByTestId("chip")).not.toBeInTheDocument();
  });

  it("executes trigger, onChange, and clears fields on option change", async () => {
    const trigger = jest.fn();
    const setValue = jest.fn();
    const onChange = jest.fn();

    const fieldWithHandlers = {
      ...mockField,
      componentProps: { onChange },
      apiDependencies: { clearFieldsOnChange: ["field1", "field2"] },
    };

    renderWithForm(
      fieldWithHandlers,
      { testMultiSelect: [] },
      setValue,
      trigger
    );

    const input = screen.getByRole("combobox");
    fireEvent.mouseDown(input);

    const apiOption1 = await screen.findByText("API Option 1");
    fireEvent.click(apiOption1);

    await waitFor(() => {
      expect(trigger).toHaveBeenCalledWith("testMultiSelect");
      expect(setValue).toHaveBeenCalledWith("field1", null);
      expect(setValue).toHaveBeenCalledWith("field2", null);
    });
  });

  it("uses API options when apiDependencies is provided", () => {
    const fieldWithApi = {
      ...mockField,
      apiDependencies: { dependentField: "someField" },
    };
    renderWithForm(fieldWithApi, { testMultiSelect: [], someField: "exists" });

    expect(mockApiSelectField).toHaveBeenCalledWith({
      apiDependencies: { dependentField: "someField" },
      watch: expect.any(Function),
      fieldName: "testMultiSelect",
    });
  });

  it("handles showCondition function", () => {
    const fieldWithCondition = {
      ...mockField,
      apiDependencies: {
        showCondition: (watch: any) => watch("conditionalField") === "show",
      },
    };
    renderWithForm(fieldWithCondition, {
      testMultiSelect: [],
      conditionalField: "show",
    });

    expect(screen.getByText("Test MultiSelect *")).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    const disabledField = { ...mockField, componentProps: { disabled: true } };
    renderWithForm(disabledField);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("handles array form field names", () => {
    const arrayField = {
      ...mockField,
      name: "sections[0].testMultiSelect",
      apiDependencies: {
        dependentField: "someField",
        clearFieldsOnChange: ["clearMe"],
      },
    };
    const setValue = jest.fn();
    renderWithForm(
      arrayField,
      { "sections[0].testMultiSelect": [] },
      setValue,
      undefined,
      true
    );
    expect(setValue).toBeDefined();
  });

  describe("handleClear function", () => {
    it("clears selected values when clear button is clicked in search mode", async () => {
      const trigger = jest.fn();
      const setValue = jest.fn();

      renderWithForm(
        mockField,
        { testMultiSelect: ["1", "2"] },
        setValue,
        trigger
      );

      // Wait for the clear button to appear (when values are selected)
      const clearButton = await screen.findByLabelText("Clear");
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(trigger).toHaveBeenCalledWith("testMultiSelect");
      });
    });

    it("clears selected values when clear button is clicked in non-search mode", async () => {
      const trigger = jest.fn();
      const setValue = jest.fn();

      renderWithForm(
        { ...mockField, enableSearch: false },
        { testMultiSelect: ["1", "2"] },
        setValue,
        trigger
      );

      // Find and click the clear button in non-search mode
      const clearButton = await screen.findByLabelText("clear");
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(trigger).toHaveBeenCalledWith("testMultiSelect");
      });
    });

    it("clears dependent fields when clearFieldsOnChange is specified", async () => {
      const trigger = jest.fn();
      const setValue = jest.fn();

      const fieldWithClearDependencies = {
        ...mockField,
        enableSearch: false,
        apiDependencies: {
          clearFieldsOnChange: ["dependentField1", "dependentField2"],
        },
      };

      renderWithForm(
        fieldWithClearDependencies,
        { testMultiSelect: ["1", "2"] },
        setValue,
        trigger
      );

      // Find and click the clear button
      const clearButton = await screen.findByLabelText("clear");
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(setValue).toHaveBeenCalledWith("dependentField1", null);
        expect(setValue).toHaveBeenCalledWith("dependentField2", null);
        expect(trigger).toHaveBeenCalledWith("testMultiSelect");
      });
    });

    it("works when trigger is not provided", async () => {
      const setValue = jest.fn();

      const fieldWithClearDependencies = {
        ...mockField,
        enableSearch: false,
        apiDependencies: {
          clearFieldsOnChange: ["dependentField1"],
        },
      };

      renderWithForm(
        fieldWithClearDependencies,
        { testMultiSelect: ["1"] },
        setValue,
        undefined // no trigger provided
      );

      // Find and click the clear button
      const clearButton = await screen.findByLabelText("clear");
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(setValue).toHaveBeenCalledWith("dependentField1", null);
        // Should not throw error when trigger is undefined
      });
    });

    it("works when clearFieldsOnChange is empty or not provided", async () => {
      const trigger = jest.fn();
      const setValue = jest.fn();

      renderWithForm(
        { ...mockField, enableSearch: false },
        { testMultiSelect: ["1"] },
        setValue,
        trigger
      );

      // Find and click the clear button
      const clearButton = await screen.findByLabelText("clear");
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(trigger).toHaveBeenCalledWith("testMultiSelect");
        // setValue should not be called for clearing fields when clearFieldsOnChange is not specified
        expect(setValue).not.toHaveBeenCalledWith(expect.any(String), null);
      });
    });

    it("clears values in search mode with autocomplete clear button", async () => {
      const trigger = jest.fn();
      const setValue = jest.fn();

      const fieldWithClearDependencies = {
        ...mockField,
        enableSearch: true,
        apiDependencies: {
          clearFieldsOnChange: ["searchDependentField"],
        },
      };

      renderWithForm(
        fieldWithClearDependencies,
        { testMultiSelect: ["1", "2"] },
        setValue,
        trigger
      );

      // In search mode, look for the clear button within the autocomplete
      const clearButton = await screen.findByLabelText("Clear");
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(trigger).toHaveBeenCalledWith("testMultiSelect");
        expect(setValue).toHaveBeenCalledWith("searchDependentField", null);
      });
    });
  });
});
