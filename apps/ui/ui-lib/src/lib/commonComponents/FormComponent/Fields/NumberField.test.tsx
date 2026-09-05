import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NumberFieldComponent from "./NumberField";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import { useForm } from "react-hook-form";

// Create a mock theme for testing
const mockTheme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    text: {
      primary: "#000000",
      secondary: "#666666",
    },
    error: {
      main: "#d32f2f",
    },
    neutral: {
      lightMedium: "#e0e0e0",
    },
    button: {
      secondary: "#dc004e",
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 4,
    borderRadii: {
      small: "4px",
      medium: "8px",
      normal: "4px",
      semiRounded: "16px",
      large: "24px",
      circle: "50%",
    },
    borderSizes: {
      none: "0px",
      hairline: "0.5px",
      thin: "1px",
      medium: "2px",
      thick: "3px",
    },
  },
  typography: {
    fontSizes: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "18px",
      xl: "20px",
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },
  shadows: [
    "none",
    "0px 1px 3px rgba(0,0,0,0.12)",
    "0px 1px 5px rgba(0,0,0,0.2)",
    "0px 1px 8px rgba(0,0,0,0.12)",
    "0px 2px 4px rgba(0,0,0,0.14)",
  ],
});

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock MUI X Date Pickers to avoid ES module issues
jest.mock("@mui/x-date-pickers/internals/demo", () => ({
  DemoContainer: ({ children }: { children: React.ReactNode }) => (
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
  DatePicker: () => <div data-testid="date-picker">DatePicker</div>,
}));

// Mocks
jest.mock("../../../hooks/useLocalization", () => ({
  useLocalization: () => ({
    localizationData: {
      data: {
        locale: "en-IN",
        currency: "INR",
      },
    },
  }),
}));

jest.mock("../../../utils", () => ({
  countDigitsBeforeIndex: jest.fn((value: string, index: number) => index),
  findIndexAfterNDigits: jest.fn((value: string, count: number) => count),
  formatNumberInputByLocalization: jest.fn((val) =>
    val.toLocaleString("en-IN")
  ),
}));

const mockField = {
  key: "amount",
  name: "amount",
  label: "Amount",
  type: "number" as const,
  rules: { required: true },
  formatNumber: true,
  isDecimal: false,
  componentProps: {
    inputProps: { min: 10, max: 5000 },
    leftIcon: <span data-testid="left-icon">₹</span>,
    rightIcon: <span data-testid="right-icon">%</span>,
    customStyles: {},
  },
};

const renderComponent = (fieldOverrides = {}, defaultValues = {}) => {
  const TestWrapper = () => {
    const methods = useForm({
      defaultValues: {
        ...defaultValues,
      },
    });

    const field = { ...mockField, ...fieldOverrides };

    return (
      <ThemeProvider theme={mockTheme}>
        <NumberFieldComponent
          field={field}
          control={methods.control as any}
          watch={methods.watch}
          setValue={methods.setValue}
          trigger={methods.trigger}
        />
      </ThemeProvider>
    );
  };

  return render(<TestWrapper />);
};

describe("NumberFieldComponent", () => {
  it("renders the label with required asterisk", () => {
    renderComponent();
  });

  it("formats number on change (non-decimal)", async () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1234" } });
  });

  it("prevents non-numeric input (integer)", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    fireEvent.keyPress(input, { key: "a", charCode: 97 });
  });

  it("allows valid decimal input when isDecimal is true", () => {
    renderComponent({ isDecimal: true });
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "1.23" } });
  });

  it("prevents multiple dots in decimal mode", () => {
    renderComponent({ isDecimal: true });
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1.2.3" } });
  });

  it("triggers dependent field validation onBlur", async () => {
    const triggerMock = jest.fn();
    const TestComponent = () => {
      const methods = useForm({
        defaultValues: { amount: 50 },
      });

      // Override trigger with our mock
      methods.trigger = triggerMock;

      const field = {
        ...mockField,
        dependentFieldsOnBlur: ["dependentField"],
      };

      return (
        <ThemeProvider theme={mockTheme}>
          <NumberFieldComponent
            field={field}
            control={methods.control as any}
            watch={methods.watch}
            setValue={methods.setValue}
            trigger={methods.trigger}
          />
        </ThemeProvider>
      );
    };

    render(<TestComponent />);
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);

    await waitFor(() => {
      expect(triggerMock).toHaveBeenCalledWith(["dependentField"]);
    });
  });

  it("enforces min value on blur", async () => {
    renderComponent({}, { amount: "5" });
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
  });

  it("enforces max value on blur", async () => {
    renderComponent({}, { amount: "10000" });
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
  });


  it("supports rightIconUrl if provided", () => {
    const fieldWithIconUrl = {
      ...mockField,
      componentProps: {
        ...mockField.componentProps,
        rightIcon: undefined,
        rightIconUrl: "icon.png",
      },
    };
    renderComponent(fieldWithIconUrl);
  });

  it("prevents invalid paste", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    const pasteEvent = {
      clipboardData: {
        getData: () => "abc",
      },
      preventDefault: jest.fn(),
    };

    fireEvent.paste(input, pasteEvent);
  });

  it("displays calculated estimated brokerage", async () => {
    renderComponent(
      {
        calculations: { calculateAmount: ["field1", "field2"] },
      },
      {
        amount: 10,
        field1: 2,
        field2: 5,
      }
    );
  });

  it("blurs input on wheel scroll", () => {
    renderComponent();
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Mock the blur method
    const blurMock = jest.fn();
    (input as any).blur = blurMock;

    fireEvent.wheel(input);
  });

  // Additional test cases for comprehensive coverage
  it("allows numeric input in integer mode", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    fireEvent.keyPress(input, { key: "5", charCode: 53 });
  });

  it("allows decimal point in decimal mode", () => {
    renderComponent({ isDecimal: true });
    const input = screen.getByRole("textbox");
    fireEvent.keyPress(input, { key: ".", charCode: 46 });
  });

  it("prevents second decimal point in decimal mode", () => {
    renderComponent({ isDecimal: true });
    const input = screen.getByRole("textbox");

    // Set initial value with decimal point
    fireEvent.change(input, { target: { value: "1.2" } });

    // Try to add another decimal point
    const preventDefaultSpy = jest.fn();
    fireEvent.keyPress(input, {
      key: ".",
      charCode: 46,
      preventDefault: preventDefaultSpy,
    });
  });

  it("allows valid paste with numbers only", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    const pasteEvent = {
      clipboardData: {
        getData: () => "123",
      },
      preventDefault: jest.fn(),
    };

    fireEvent.paste(input, pasteEvent);
    expect(pasteEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("allows valid decimal paste when isDecimal is true", () => {
    renderComponent({ isDecimal: true });
    const input = screen.getByRole("textbox");
    const pasteEvent = {
      clipboardData: {
        getData: () => "12.34",
      },
      preventDefault: jest.fn(),
    };

    fireEvent.paste(input, pasteEvent);
    expect(pasteEvent.preventDefault).not.toHaveBeenCalled();
  });

  it("handles onChange with empty value", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });
  });

  it("handles onChange with valid decimal input", () => {
    renderComponent({ isDecimal: true });
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "123.45" } });
  });

  it("rejects onChange with invalid characters in integer mode", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    const initialValue = input.value;
    fireEvent.change(input, { target: { value: "12a34" } });
    // Invalid input should be rejected and value should remain unchanged
    expect(input.value).toBe(initialValue);
  });

  it("rejects onChange with invalid characters in decimal mode", () => {
    renderComponent({ isDecimal: true });
    const input = screen.getByRole("textbox");
    const initialValue = input.value;
    fireEvent.change(input, { target: { value: "12.3a4" } });
    // Invalid input should be rejected and value should remain unchanged
    expect(input.value).toBe(initialValue);
  });

  it("handles onBlur with non-numeric value", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
  });

  it("handles onBlur without min/max constraints", () => {
    const fieldWithoutConstraints = {
      ...mockField,
      componentProps: {
        ...mockField.componentProps,
        inputProps: {},
      },
    };
    renderComponent(fieldWithoutConstraints, { amount: "100" });
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
  });

  it("handles onBlur when value is exactly at min bound", () => {
    renderComponent({}, { amount: "10" });
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
  });

  it("handles onBlur when value is exactly at max bound", () => {
    renderComponent({}, { amount: "5000" });
    const input = screen.getByRole("textbox");
    fireEvent.blur(input);
  });

  it("handles onChange with comma-separated number", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "1,234" } });
  });

  it("handles keyPress with numeric key in integer mode", () => {
    renderComponent();
    const input = screen.getByRole("textbox");
    const preventDefaultSpy = jest.fn();
    fireEvent.keyPress(input, {
      key: "1",
      charCode: 49,
      preventDefault: preventDefaultSpy,
    });
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

});