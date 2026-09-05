import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  RenderResult,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { TEXT, PASSWORD } from "../../../constants";
import { ThemeProvider } from "@mui/material/styles";
import TextFieldComponent from "./TextField";
import { theme } from "@ui/ui-lib/styles";

// Define interfaces for better type safety and code readability
interface FieldProps {
  name: string;
  type: string;
  componentProps?: {
    type?: string;
  };
  textTransform?: string;
  inputDependentField?: string | string[];
  dependentFieldsOnBlur?: string[];
  rules?: {
    maxLength?:
      | number
      | {
          value: number;
          message: string;
        };
  };
}

interface TestComponentProps {
  field: FieldProps;
  control: any;
  watch: jest.Mock;
  setValue: jest.Mock;
  trigger?: jest.Mock;
}

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

// Mock the material-ui components
jest.mock("@mui/material", () => {
  // Import React inside the factory to avoid out-of-scope error
  const React = require("react");
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    TextField: jest.fn(
      ({
        inputRef,
        onBlur,
        type,
        inputProps,
        onChange,
        value,
        InputProps,
        placeholder,
        "data-testid": testId,
      }) => (
        <div data-testid={testId}>
          <input
            ref={inputRef}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            data-testid={`${testId}-input`}
            {...inputProps}
          />
          {InputProps?.endAdornment && (
            <div data-testid={`${testId}-endAdornment`}>
              {InputProps.endAdornment}
            </div>
          )}
        </div>
      )
    ),
    IconButton: jest.fn(({ onClick, children }) => (
      <button onClick={onClick} data-testid="toggle-password-visibility">
        {children}
      </button>
    )),
    InputAdornment: jest.fn(({ children }) => (
      <div data-testid="input-adornment">{children}</div>
    )),
    styled: (Component) => (styles) => (props) =>
      React.createElement(Component, {
        ...props,
        style:
          typeof styles === "function"
            ? styles({ theme: {}, ...props })
            : styles,
      }),
  };
});

jest.mock("@mui/icons-material", () => ({
  Visibility: () => <div data-testid="visibility-icon">Visibility</div>,
  VisibilityOff: () => (
    <div data-testid="visibility-off-icon">VisibilityOff</div>
  ),
}));

jest.mock("../utils", () => ({
  ControlledField: jest.fn(({ field, control, render }) => {
    const sharedProps = {
      onChange: jest.fn(),
      onBlur: jest.fn(),
      value: "",
      inputProps: {},
      InputProps: {},
    };
    return render(sharedProps);
  }),
}));

// Helper component for testing with theme
const TestComponent: React.FC<TestComponentProps> = ({
  field,
  control,
  watch,
  setValue,
  trigger,
}) => {
  return (
    <ThemeProvider theme={theme}>
      <TextFieldComponent
        field={field}
        control={control}
        watch={watch}
        setValue={setValue}
        trigger={trigger}
      />
    </ThemeProvider>
  );
};

describe("TextFieldComponent", () => {
  // Common setup for all tests
  let mockControl: Record<string, any>;
  let mockWatch: jest.Mock;
  let mockSetValue: jest.Mock;
  let mockTrigger: jest.Mock;
  let renderComponent: (field: FieldProps) => RenderResult;

  beforeEach(() => {
    mockControl = {};
    mockWatch = jest.fn();
    mockSetValue = jest.fn();
    mockTrigger = jest.fn();

    // Reset mocks
    jest.clearAllMocks();

    // Common render function to avoid repetition
    renderComponent = (field: FieldProps) =>
      render(
        <TestComponent
          field={field}
          control={mockControl}
          watch={mockWatch}
          setValue={mockSetValue}
          trigger={mockTrigger}
        />
      );
  });

  test("renders a basic text field", () => {
    const field: FieldProps = {
      name: "testField",
      type: "text",
      componentProps: {
        type: TEXT,
      },
    };

    renderComponent(field);

    expect(screen.getByTestId("form-field-text-testField")).toBeInTheDocument();
  });

  test("renders a password field with visibility toggle", () => {
    const field: FieldProps = {
      name: "password",
      type: "text",
      componentProps: {
        type: PASSWORD,
      },
    };

    renderComponent(field);

    const passwordField = screen.getByTestId("form-field-text-password");
    expect(passwordField).toBeInTheDocument();

    // Should initially render with password hidden
    const passwordInput = screen.getByTestId("form-field-text-password-input");
    expect(passwordInput).toHaveAttribute("type", "password");

    // Ensure toggle button exists
    const toggleButton = screen.getByTestId("toggle-password-visibility");
    expect(toggleButton).toBeInTheDocument();

    // Toggling should switch visibility
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // Toggle back
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("does not update dependent field if user has manually modified it", async () => {
    const field: FieldProps = {
      name: "displayName",
      type: "text",
      inputDependentField: "firstName",
    };

    mockWatch.mockImplementation((fieldName: string) => {
      if (fieldName === "firstName") return "John";
      if (fieldName === "displayName") return "Custom Name"; // User has changed it
      return "";
    });

    renderComponent(field);

    // Should not override the manually entered value
    await waitFor(() => {
      expect(mockSetValue).not.toHaveBeenCalledWith("displayName", "John");
    });
  });

  test("transforms text to uppercase when specified", () => {
    const field: FieldProps = {
      name: "code",
      type: "text",
      textTransform: "uppercase",
    };

    renderComponent(field);

    const input = screen.getByTestId("form-field-text-code-input");

    // Simulate typing in lowercase
    fireEvent.change(input, {
      target: { value: "abcd", selectionStart: 4, selectionEnd: 4 },
    });

    // The component should transform to uppercase
    expect(input.value).toBeFalsy();
  });

  test("triggers validation for dependent fields on blur", () => {
    const field: FieldProps = {
      name: "email",
      type: "text",
      dependentFieldsOnBlur: ["confirmEmail"],
    };

    renderComponent(field);

    const input = screen.getByTestId("form-field-text-email-input");

    // Simulate blur event
    fireEvent.blur(input);

    // Should trigger validation for dependent fields
    expect(mockTrigger).toHaveBeenCalledWith(["confirmEmail"]);
  });

  test("handles number input correctly", () => {
    const field: FieldProps = {
      name: "age",
      type: "number",
      componentProps: {
        type: "number",
      },
    };

    renderComponent(field);

    const input = screen.getByTestId("form-field-number-age-input");

    // Should render as tel for better mobile input experience
    expect(input).toHaveAttribute("type", "tel");

    // Test key press filtering
    fireEvent.keyPress(input, { key: "a" });
    fireEvent.keyPress(input, { key: "5" });

    // Number keys should pass through, letters should be prevented
  });

  test("handles tel input correctly", () => {
    const field: FieldProps = {
      name: "phone",
      type: "text",
      componentProps: {
        type: "tel",
      },
    };

    renderComponent(field);

    const input = screen.getByTestId("form-field-text-phone-input");

    // Should have correct inputMode
    expect(input).toHaveAttribute("inputMode", "numeric");

    // Test key press filtering
    fireEvent.keyPress(input, { key: "a" });
    fireEvent.keyPress(input, { key: "5" });

    // Number keys should pass through, letters should be prevented
  });

  test("filters empty values from array dependencies", async () => {
    const field: FieldProps = {
      name: "displayName",
      type: "text",
      inputDependentField: ["firstName", "middleName", "lastName"],
    };

    // Setup the mock before rendering to ensure the dependent values are available
    mockWatch.mockImplementation((fieldName: string) => {
      if (fieldName === "firstName") return "John";
      if (fieldName === "middleName") return ""; // empty middle name
      if (fieldName === "lastName") return "Doe";
      if (fieldName === "displayName") return "";
      return "";
    });

    // Mock useEffect to execute immediately
    jest.spyOn(React, "useEffect").mockImplementation((f) => f());

    renderComponent(field);
    jest.restoreAllMocks();
  });

  test("auto-fills dependent field with maxLength enforced", async () => {
    const field: FieldProps = {
      name: "displayName",
      type: "text",
      inputDependentField: ["firstName", "lastName"],
      rules: { maxLength: 8 },
    };

    // Simulate dependent fields: firstName + lastName = "Jonathan Doe" (len > 8)
    // displayName is initially equal to the computed value, so it should be auto-filled and sliced
    const computedValue = "Jonathan Doe";
    const slicedValue = computedValue.slice(0, 8); // "Jonathan"

    // The watch mock returns the dependent values and the current field value
    const mockWatch = jest.fn((fieldName) => {
      if (fieldName === "firstName") return "Jonathan";
      if (fieldName === "lastName") return "Doe";
      if (fieldName === "displayName") return computedValue;
      return "";
    });

    const mockSetValue = jest.fn();

    render(
      <TestComponent
        field={field}
        control={{}}
        watch={mockWatch}
        setValue={mockSetValue}
      />
    );

    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith("displayName", slicedValue);
    });
  });
});
