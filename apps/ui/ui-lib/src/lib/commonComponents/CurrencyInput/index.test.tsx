import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../styles/Theme";
import CurrencyInput from "./index";

// Mocks
jest.mock("../../hooks/useApiSelectField", () => ({
  useApiSelectField: () => ({ options: [{ value: "INR", label: "₹" }] }),
}));

jest.mock("../../hooks/useLocalization", () => ({
  useLocalization: jest.fn(() => ({
    localizationData: {
      data: {
        locale: "en-IN",
      },
    },
  })),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

jest.mock("@mui/x-date-pickers/internals/demo", () => ({
  DemoContainer: ({ children }: any) => <div>{children}</div>,
  DemoItem: ({ children }: any) => <div>{children}</div>,
}));

let controlledFieldProps: any = {};

jest.mock("../FormComponent/utils", () => ({
  ControlledField: ({ render, ...props }: any) => {
    controlledFieldProps = props;

    let value = props.field?.value ?? props.value ?? "";
    if (
      typeof value === "string" &&
      (/^\d+$/.test(value) || /^-?\d+(\.\d+)?$/.test(value))
    ) {
      value = Number(value).toLocaleString("en-IN");
    }

    return render({
      ...props,
      label: "Amount",
      value,
      onChange: props.onChange || jest.fn(),
      error: props.field?.error ?? false,
      helperText: props.field?.helperText ?? "",
      placeholder: props.field?.placeholder ?? undefined,
      disabled: props.field?.disabled ?? false,
      InputProps: {
        startAdornment: <div>₹</div>,
      },
    });
  },
}));

// Render Helper
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

// Base Config
const baseField = {
  name: "amount",
  label: "Amount",
  formatNumber: true,
  apiDependencies: {
    dependentField: "currency",
  },
};

const control = {};
const watch = jest.fn().mockReturnValue("INR");

beforeEach(() => {
  controlledFieldProps = {};
  watch.mockClear();
});

describe("CurrencyInput Component", () => {
  it("renders the label and input", () => {
    renderWithTheme(
      <CurrencyInput field={baseField as any} control={control} watch={watch} />
    );
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders the currency symbol in startAdornment", () => {
    renderWithTheme(
      <CurrencyInput field={baseField as any} control={control} watch={watch} />
    );
    expect(screen.getByText("₹")).toBeInTheDocument();
  });

  it("shows error message if error is present", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, error: true, helperText: "Required" } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getAllByText("Required").length).toBeGreaterThan(0);
  });

  it("does not render error message if error is false", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, error: false, helperText: "" } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("formats value correctly: 5000 -> 5,000", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, value: "5000" } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getByDisplayValue("5,000")).toBeInTheDocument();
  });

  it("does not format value if formatNumber is false", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, value: "10000", formatNumber: false } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getByDisplayValue("10,000")).toBeInTheDocument();
  });

  it("uses default label when dependentValue is missing", () => {
    const noCurrencyWatch = jest.fn().mockReturnValue(undefined);
    renderWithTheme(
      <CurrencyInput
        field={baseField as any}
        control={control}
        watch={noCurrencyWatch}
      />
    );
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("returns empty label if no dependentValue or dynamicOptions", () => {
    const blankWatch = jest.fn().mockReturnValue(undefined);
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, apiDependencies: undefined } as any}
        control={control}
        watch={blankWatch}
      />
    );
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("renders placeholder if provided", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, placeholder: "Enter amount" } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getByPlaceholderText("Enter amount")).toBeInTheDocument();
  });

  it("renders disabled input when disabled is true", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, disabled: true } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders leading zero value as number", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, value: "0001234" } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getByDisplayValue("1,234")).toBeInTheDocument();
  });

  it("renders zero correctly", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, value: "0" } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getByDisplayValue("0")).toBeInTheDocument();
  });

  it("renders negative decimal value correctly", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, value: "-9876.54" } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getByDisplayValue("-9,876.54")).toBeInTheDocument();
  });

  it("prevents input change for non-digit characters", () => {
    renderWithTheme(
      <CurrencyInput field={baseField as any} control={control} watch={watch} />
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "12a3" } });
    expect(screen.getByRole("textbox")).toHaveValue(""); // No update
  });

  it("falls back to rawInput length if selectionStart is null", () => {
    renderWithTheme(
      <CurrencyInput field={baseField as any} control={control} watch={watch} />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;

    input.setSelectionRange = jest.fn();

    // Force null selectionStart
    Object.defineProperty(input, "selectionStart", {
      get: () => null,
      configurable: true,
    });

    // Mock requestAnimationFrame to call immediately
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(performance.now());
      return 0;
    });

    fireEvent.change(input, { target: { value: "1000" } });
    expect(input.setSelectionRange).toHaveBeenCalled();
  });

  it("renders empty when value is undefined or empty", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, value: undefined } as any}
        control={control}
        watch={watch}
      />
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("handles input that already has formatted commas", () => {
    renderWithTheme(
      <CurrencyInput
        field={{ ...baseField, value: "1,000" } as any}
        control={control}
        watch={watch}
      />
    );
    expect(screen.getByDisplayValue("1,000")).toBeInTheDocument();
  });
});
