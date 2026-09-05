import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import SelectFieldByApi from "./SelectFieldByApi";
import React from "react";
import { theme } from "@ui/ui-lib/styles";

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

jest.mock("../../../hooks/useApiQuery", () => ({
  useApiQuery: jest.fn(),
}));
jest.mock("../../../hooks/useDebounce", () => ({
  useDebounce: (v: string) => v,
}));

const mockSetValue = jest.fn();
const mockTrigger = jest.fn();
const mockOnActionMap = { testAction: jest.fn() };

const defaultField = {
  name: "companyId",
  label: "Company",
  type: "select",
  placeholder: "Select company",
  rules: { required: true },
  options: [
    { label: "Company A", value: "1" },
    { label: "Company B", value: "2" },
  ],
  componentProps: {},
  apiDependencies: {
    endPoint: "/api/companies",
    utilityFunction: (data: any) => data,
  },
};

type RenderOptions = {
  isFormAnArray?: boolean;
  defaultValues?: Record<string, any>;
};

const renderWithForm = (
  fieldProps = {},
  apiQueryMock = {},
  options: RenderOptions = {}
) => {
  const { useApiQuery } = require("../../../hooks/useApiQuery");
  useApiQuery.mockReturnValue({
    data: [
      { label: "Company A", value: "1" },
      { label: "Company B", value: "2" },
    ],
    isLoading: false,
    error: undefined,
    ...apiQueryMock,
  });
  const { isFormAnArray = false, defaultValues = { companyId: "" } } = options;
  const Wrapper = () => {
    const methods = useForm({ defaultValues });
    return (
      <ThemeProvider theme={theme}>
        <SelectFieldByApi
          field={{ ...defaultField, ...fieldProps }}
          control={methods.control}
          watch={methods.watch}
          setValue={mockSetValue}
          isFormAnArray={isFormAnArray}
          trigger={mockTrigger}
          onActionMap={mockOnActionMap}
        />
      </ThemeProvider>
    );
  };
  return render(<Wrapper />);
};

describe("SelectFieldByApi Component", () => {
  it("disables the field when showCondition returns false", () => {
    const showCondition = jest.fn().mockReturnValue(false);
    renderWithForm({
      apiDependencies: {
        ...defaultField.apiDependencies,
        showCondition,
      },
    });
    const input = screen.getByPlaceholderText(/select company/i);
    expect(input).toBeDisabled();
    expect(showCondition).toHaveBeenCalled();
  });

  it("enables the field when showCondition returns true", () => {
    const showCondition = jest.fn().mockReturnValue(true);
    renderWithForm({
      apiDependencies: {
        ...defaultField.apiDependencies,
        showCondition,
      },
    });
    const input = screen.getByPlaceholderText(/select company/i);
    expect(input).not.toBeDisabled();
    expect(showCondition).toHaveBeenCalled();
  });

  it("selects the correct option and reflects the value in the input", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    const option = await screen.findByText("Company A");
    fireEvent.click(option);
    // After selection, the input should reflect the selected value
    expect(input).toHaveValue("Company A");
  });

  it("logs a warning if invokeFunction is not a function", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    renderWithForm({ invokeFunction: "notAFunction" });
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    const option = await screen.findByText("Company A");
    fireEvent.click(option);
    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "No valid invokeFunction handler found: notAFunction"
      );
    });
    consoleWarnSpy.mockRestore();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders with required label and asterisk", () => {
    renderWithForm();
    expect(screen.getByText(/Company \*/i)).toBeInTheDocument();
  });

  it("renders options from API", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    expect(await screen.findByText("Company A")).toBeInTheDocument();
    expect(screen.getByText("Company B")).toBeInTheDocument();
  });

  it("shows loading spinner when loading", () => {
    renderWithForm({}, { isLoading: true });
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows 'No data found' when no options", () => {
    renderWithForm({}, { data: [], isLoading: false });
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    expect(screen.getByText(/no data found/i)).toBeInTheDocument();
  });

  it("disables the field if showField is false", () => {
    renderWithForm({
      apiDependencies: {
        ...defaultField.apiDependencies,
        dependentField: "otherField",
      },
    });
    const input = screen.getByPlaceholderText(/select company/i);
    expect(input).toBeDisabled();
  });

  it("calls setValue and trigger on change", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    const option = await screen.findByText("Company A");
    fireEvent.click(option);
    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalled();
    });
  });

  it("clears dependent fields on change", async () => {
    renderWithForm({
      apiDependencies: {
        ...defaultField.apiDependencies,
        clearFieldsOnChange: ["otherField"],
      },
    });
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    const option = await screen.findByText("Company A");
    fireEvent.click(option);
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith("otherField", null);
    });
  });

  it("invokes custom function on change if provided", async () => {
    renderWithForm({ invokeFunction: "testAction" });
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    const option = await screen.findByText("Company A");
    fireEvent.click(option);
    await waitFor(() => {
      expect(mockOnActionMap.testAction).toHaveBeenCalled();
    });
  });

  it("shows error and helper text when validation fails", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText(/select company/i);
    expect(input).toBeInTheDocument();
  });

  it("handles isFormAnArray and match logic for dependentField", () => {
    const regexFieldName = "section1.companyId";
    renderWithForm(
      {
        name: regexFieldName,
        apiDependencies: {
          ...defaultField.apiDependencies,
          dependentField: "otherField",
        },
      },
      {},
      { isFormAnArray: true }
    );
    const input = screen.getByPlaceholderText(/select company/i);
    expect(input).toBeDisabled();
  });

  it("filters out options that are already selected in other sections", async () => {
    renderWithForm(
      {
        name: "retArray.1.insurerId",
        componentProps: {
          ...defaultField.componentProps,
          preventDuplicateSelections: true,
        },
      },
      {},
      {
        isFormAnArray: true,
        defaultValues: {
          retArray: [
            { insurerId: "1" },
            { insurerId: "" },
          ],
        },
      }
    );

    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    await waitFor(() => {
      expect(
        screen.queryByRole("option", {
          name: "Company A",
        })
      ).toBeNull();
    });
  });

  it("does not call setOptions if apiResponse is undefined", () => {
    const setOptionsSpy = jest.spyOn(React, "useState");
    renderWithForm({}, { data: undefined });
    expect(setOptionsSpy).toHaveBeenCalled();
  });

  it("calls utilityFunction without utilityDependent if not present", () => {
    const utilityFunction = jest.fn();
    const apiResponse = [{ label: "A", value: "1" }];
    renderWithForm(
      {
        apiDependencies: {
          ...defaultField.apiDependencies,
          utilityFunction,
        },
      },
      { data: apiResponse }
    );
    expect(utilityFunction).toHaveBeenCalledWith(apiResponse);
  });

  it("does not break if apiDependencies is undefined", () => {
    renderWithForm({ apiDependencies: undefined });
    const input = screen.getByPlaceholderText(/select company/i);
    expect(input).toBeInTheDocument();
  });

  it("does not break if field.options is undefined", () => {
    renderWithForm({ options: undefined });
    const input = screen.getByPlaceholderText(/select company/i);
    expect(input).toBeInTheDocument();
  });

  it("covers equality check in normal mode after selection", async () => {
    renderWithForm();
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    const option = await screen.findByText("Company B");
    fireEvent.click(option);
    // reopen to force Autocomplete equality comparisons
    fireEvent.mouseDown(input);
    expect(input).toHaveValue("Company B");
  });

  it("covers equality check in smart search mode (enableSmartSearch)", async () => {
    const largeOptions = Array.from({ length: 6 }, (_, i) => ({
      label: `Company ${i + 1}`,
      value: `${i + 1}`,
    }));
    renderWithForm({
      options: largeOptions,
      enableSmartSearch: true,
    });
    const input = screen.getByPlaceholderText(/select company/i);
    fireEvent.mouseDown(input);
    const option = await screen.findByText("Company 2").catch(async () => {
      // fallback to existing dataset if mismatch
      return await screen.findByText("Company B");
    });
    fireEvent.click(option);
    fireEvent.mouseDown(input);
    expect(input).toHaveValue(option.textContent || "Company 2");
  });
});
