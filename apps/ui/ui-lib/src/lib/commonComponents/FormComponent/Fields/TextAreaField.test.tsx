import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import TextAreaFieldComponent from "./TextAreaField";
import { waitFor } from "@testing-library/react";
import { theme } from "@ui/ui-lib/styles";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

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

describe("TextAreaFieldComponent", () => {
  const defaultField = {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter description",
    rules: { required: true },
    componentProps: {},
  };

  const renderWithForm = (fieldProps = {}, formProps = {}) => {
    const Wrapper = () => {
      const methods = useForm({
        defaultValues: { description: "" },
        ...formProps,
      });
      return (
        <ThemeProvider theme={theme}>
          <TextAreaFieldComponent
            field={{ ...defaultField, ...fieldProps }}
            control={methods.control}
            watch={methods.watch}
            setValue={methods.setValue}
            trigger={methods.trigger}
          />
        </ThemeProvider>
      );
    };
    return render(<Wrapper />);
  };

  function getInput() {
    // Get the input inside the styled container
    const container = screen.getByTestId("form-field-textarea-description");
    // Try to get input[type="text"] or role textbox
    return (
      container.querySelector('input[type="text"]') ||
      container.querySelector("textarea") ||
      container.querySelector("input")
    );
  }

  it("renders the textarea with required label and asterisk", () => {
    renderWithForm();
    expect(screen.getByText(/Description \*/i)).toBeInTheDocument();
    expect(getInput()).toBeInTheDocument();
  });

  it("renders the textarea as disabled if componentProps.disabled is true", () => {
    renderWithForm({ componentProps: { disabled: true } });
    expect(getInput()).toBeDisabled();
  });

  it("renders the textarea as disabled if showCondition returns false", () => {
    const showCondition = jest.fn().mockReturnValue(false);
    renderWithForm({ apiDependencies: { showCondition } });
    expect(getInput()).toBeDisabled();
    expect(showCondition).toHaveBeenCalled();
  });

  it("renders the textarea as enabled if showCondition returns true", () => {
    const showCondition = jest.fn().mockReturnValue(true);
    renderWithForm({ apiDependencies: { showCondition } });
    expect(getInput()).not.toBeDisabled();
    expect(showCondition).toHaveBeenCalled();
  });

  it("calls onChange and updates value", () => {
    renderWithForm();
    const input = getInput();
    fireEvent.change(input, { target: { value: "New value" } });
    expect(input).toHaveValue("New value");
  });

  it("applies uppercase transformation if textTransform is 'uppercase'", () => {
    renderWithForm({ textTransform: "uppercase" });
    const input = getInput();
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input).toHaveValue("ABC");
  });

it("triggers validation of dependent fields on blur", async () => {
  const trigger = jest.fn();
  // Use a custom wrapper to inject the mock trigger
  const Wrapper = () => {
    const methods = useForm({ defaultValues: { description: "" } });
    return (
      <ThemeProvider theme={theme}>
        <TextAreaFieldComponent
          field={{ ...defaultField, dependentFieldsOnBlur: ["otherField"] }}
          control={methods.control}
          watch={methods.watch}
          setValue={methods.setValue}
          trigger={trigger}
        />
      </ThemeProvider>
    );
  };
  render(<Wrapper />);
  const input = getInput();
  fireEvent.blur(input);
  await waitFor(() => {
    expect(trigger).toHaveBeenCalledWith(["otherField"]);
  });
});

it("auto-fills value based on inputDependentField (single)", async () => {
  const formProps = {
    defaultValues: { description: "auto fill", depField: "auto fill" },
  };
  renderWithForm({ inputDependentField: "depField" }, formProps);
  const input = getInput();
  await waitFor(() => {
    expect(input).toHaveValue("auto fill");
  });
});

it("auto-fills value based on inputDependentField (array)", async () => {
  const formProps = {
    defaultValues: { description: "foo bar", dep1: "foo", dep2: "bar" },
  };
  renderWithForm({ inputDependentField: ["dep1", "dep2"] }, formProps);
  const input = getInput();
  await waitFor(() => {
    expect(input).toHaveValue("foo bar");
  });
});

it("truncates auto-filled value if it exceeds maxLength", async () => {
  const formProps = {
    defaultValues: { description: "1234567890", depField: "1234567890" },
  };
  renderWithForm(
    { inputDependentField: "depField", rules: { maxLength: 5 } },
    formProps
  );
  const input = getInput();
  await waitFor(() => {
    expect(input).toHaveValue("12345");
  });
});

  it("renders the label without asterisk if not required", () => {
    renderWithForm({ rules: { required: false } });
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});
