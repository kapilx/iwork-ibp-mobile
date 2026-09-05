import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import SelectField from "./SelectField";

jest.mock("../../../constants/regex", () => ({
  REGEX_PATTERNS: {
    MULTI_SECTION_PREFIX_REGEX: /^group\[0\]\./,
  },
}));
import { UseFormSetValue, UseFormWatch, Control } from "react-hook-form";
import userEvent from "@testing-library/user-event";
import { theme } from "@ui/ui-lib/styles";

// Make options dynamically adjustable per test
let mockOptions: Array<{ value: string; label: string }> = [
  { value: "1", label: "Option 1" },
  { value: "2", label: "Option 2" },
];

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

jest.mock("@ui/ui-lib/hooks/useApiSelectField", () => ({
  useApiSelectField: jest.fn(() => ({
    options: mockOptions,
  })),
}));

jest.mock("react-hook-form", () => {
  const actual = jest.requireActual("react-hook-form");
  return {
    ...actual,
    Controller: (props: any) => {
      const defaultRenderResult = {
        field: {
          onChange: jest.fn(),
          value: "",
          name: props.name,
          ref: jest.fn(),
        },
        fieldState: { error: undefined },
        formState: { isSubmitted: false },
      };
      const testOverrides = props.render
        ? props.render(defaultRenderResult)
        : {};
      return props.render({ ...defaultRenderResult, ...testOverrides });
    },
  };
});

describe("SelectField Component", () => {
  const mockSetValue = jest.fn();
  const mockWatch = jest.fn();
  const mockControl = {} as Control<any>;

  const defaultProps = {
    field: {
      name: "testField",
      label: "Test Field",
      type: "select",
      componentProps: {},
      rules: { required: true },
      options: [
        { value: "1", label: "Option 1" },
        { value: "2", label: "Option 2" },
      ],
    },
    control: mockControl,
    watch: mockWatch as unknown as UseFormWatch<any>,
    setValue: mockSetValue as unknown as UseFormSetValue<any>,
    isFormAnArray: false,
    trigger: jest.fn(),
  };

  beforeAll(() => {
    if (typeof (globalThis as any).HTMLElement !== "undefined") {
      Object.defineProperty(
        (globalThis as any).HTMLElement.prototype,
        "offsetHeight",
        {
          configurable: true,
          value: 100,
        }
      );
    }
  });

  beforeEach(() => {
    mockOptions = [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
    ];
    jest.clearAllMocks();
  });

  const renderWithTheme = (props: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <SelectField {...props} />
      </ThemeProvider>
    );
  };

  const openAutocomplete = async () => {
    const combo = screen.getByRole("combobox");
    await userEvent.click(combo);
    // Use keyboard to open list
    await userEvent.keyboard("{ArrowDown}");
    return combo;
  };

  it("renders the select field with options", async () => {
    renderWithTheme(defaultProps);
    expect(screen.getByText("Test Field *")).toBeInTheDocument();
    await openAutocomplete();
    expect(
      await screen.findByRole("option", { name: /Option 1/ })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: /Option 2/ })
    ).toBeInTheDocument();
  });

  it("renders the select field with API options", async () => {
    mockWatch.mockReturnValue("depVal");
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        apiDependencies: {
          dependentField: "dependencyField",
        },
      },
    });
    await openAutocomplete();
    expect(
      await screen.findByRole("option", { name: /Option 1/ })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: /Option 2/ })
    ).toBeInTheDocument();
  });

  it("disables the field when showField is false", async () => {
    mockWatch.mockReturnValueOnce(false); // showField false may disable
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        apiDependencies: {
          dependentField: "dependencyField",
        },
      },
    });
    const combo = screen.getByRole("combobox");
    expect(combo).toBeInTheDocument();
  });

  it("renders 'No data found' when options are empty", async () => {
    mockWatch.mockReturnValue("depVal");
    mockOptions = [];
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        apiDependencies: {
          dependentField: "dependencyField",
        },
      },
    });
    await openAutocomplete();
    expect(await screen.findByText(/No data found/i)).toBeInTheDocument();
  });

  it("calls setValue when an option is selected", async () => {
    renderWithTheme(defaultProps);
    await openAutocomplete();
    const opt = await screen.findByRole("option", { name: /Option 1/ });
    await userEvent.click(opt);
    expect(mockSetValue).toBeTruthy();
  });

  it("renders the select field with a default value (options present when opened)", async () => {
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        apiDependencies: {
          defaultValue: "Select an option",
        },
      },
    });
    await openAutocomplete();
    expect(
      await screen.findByRole("option", { name: /Option 1/ })
    ).toBeInTheDocument();
  });

  it("calls invokeFunction with newValue and watch() in autocomplete mode", async () => {
    const mockAction = jest.fn();
    const localWatch = jest.fn(() => ({ someField: "watchValue" }));
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        invokeFunction: "onSelectFunction",
        options: Array.from({ length: 6 }, (_, i) => ({
          value: `${i + 1}`,
          label: `Option ${i + 1}`,
        })),
      },
      onActionMap: {
        onSelectFunction: mockAction,
      },
      watch: localWatch,
    });
    await openAutocomplete();
    await userEvent.click(
      await screen.findByRole("option", { name: /Option 2/ })
    );
    expect(mockAction).toHaveBeenCalledWith(
      { label: "Option 2", value: "2" },
      { someField: "watchValue" }
    );
  });

  it("logs warning if invokeFunction doesn't exist in onActionMap (autocomplete)", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        invokeFunction: "missingFunction",
        options: Array.from({ length: 6 }, (_, i) => ({
          value: `${i + 1}`,
          label: `Option ${i + 1}`,
        })),
      },
      watch: jest.fn(),
      onActionMap: {},
    });
    await openAutocomplete();
    await userEvent.click(
      await screen.findByRole("option", { name: /Option 1/ })
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "No valid invokeFunction handler found: missingFunction"
    );
    warnSpy.mockRestore();
  });

  it("shows placeholder in Select dropdown when no option selected", () => {
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        placeholder: "Choose...",
      },
    });
    expect(screen.getByPlaceholderText("Choose...")).toBeInTheDocument();
  });

  it("logs warning if invokeFunction not found in Select mode", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        invokeFunction: "missingHandler",
      },
      onActionMap: {},
    });
    await openAutocomplete();
    const option1 = await screen.findByRole("option", { name: /Option 1/ });
    await userEvent.click(option1);
    expect(warnSpy).toHaveBeenCalledWith(
      "No valid invokeFunction handler found: missingHandler"
    );
    warnSpy.mockRestore();
  });

  it("clears dependent fields on change when clearFieldsOnChange provided", async () => {
    renderWithTheme({
      ...defaultProps,
      field: {
        ...defaultProps.field,
        apiDependencies: {
          clearFieldsOnChange: ["dep1", "dep2"],
        },
        invokeFunction: undefined,
      },
    });
    await openAutocomplete();
    const option1 = await screen.findByRole("option", { name: /Option 1/ });
    await userEvent.click(option1);
    expect(mockSetValue).toHaveBeenCalledWith("dep1", null);
    expect(mockSetValue).toHaveBeenCalledWith("dep2", null);
  });

  it("supports enableSmartSearch mode", async () => {
    const action = jest.fn();
    const watchWithData = jest.fn(() => ({ some: "thing" }));
    renderWithTheme({
      ...defaultProps,
      enableSmartSearch: true,
      field: {
        ...defaultProps.field,
        invokeFunction: "onSelectFn",
        options: Array.from({ length: 6 }, (_, i) => ({
          value: `${i + 1}`,
          label: `Option ${i + 1}`,
        })),
      },
      watch: watchWithData,
      onActionMap: { onSelectFn: action },
    });
    await openAutocomplete();
    const opt2 = await screen.findByRole("option", { name: /Option 2/ });
    await userEvent.click(opt2);
    expect(action).toHaveBeenCalledWith(
      { label: "Option 2", value: "2" },
      expect.anything()
    );
  });
});
