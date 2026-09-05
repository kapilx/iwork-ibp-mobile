import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { GenericFormDialog } from "./index";
import { theme } from "@ui/ui-lib/styles";

jest.mock("../../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
    featureFlag: {
      FF_IWORK_POLICY_LISTING: true,
    },
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
jest.mock("../FormComponent", () => ({
  __esModule: true,
  default: ({ formMethods, defaultValues, formConfig }: any) => {
    const React = require("react");
    const { useForm } = require("react-hook-form");

    const methods = useForm({ defaultValues });

    React.useEffect(() => {
      if (formMethods) {
        formMethods(methods);
      }
    }, [formMethods]);

    return (
      <form onSubmit={methods.handleSubmit((data: any) => {})}>
        <div data-testid="dynamic-form-mock" />
        <input {...methods.register("name")} data-testid="name-input" />
      </form>
    );
  },
}));

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  title: "Test Dialog",
  fields: [],
  defaultValues: { name: "" },
};

const renderWithTheme = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <GenericFormDialog {...defaultProps} {...props} />
    </ThemeProvider>
  );

describe("GenericFormDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders actions", () => {
    renderWithTheme();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    renderWithTheme();
    const closeButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders with custom maxWidth and fullWidth", () => {
    renderWithTheme({ maxWidth: "md", fullWidth: false });
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
  });

  it("sets form values from initialData when dialog opens", async () => {
    const initialData = { name: "Test", age: 25 };

    renderWithTheme({ initialData });

    // Wait for the form to be populated with initial data
    await waitFor(() => {
      const nameInput = screen.getByTestId("name-input") as HTMLInputElement;
      expect(nameInput.value).toBe("Test");
    });
  });

  it("resets form when initialData is not provided", async () => {
    renderWithTheme({ initialData: undefined });

    // Wait for the form to be rendered and reset to default values
    await waitFor(() => {
      const nameInput = screen.getByTestId("name-input") as HTMLInputElement;
      expect(nameInput.value).toBe("");
    });
  });

  it("calls onSave and onClose on submit", async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();

    renderWithTheme({ onSave, onClose });

    // First, fill in the form with some data
    const nameInput = screen.getByTestId("name-input");
    fireEvent.change(nameInput, { target: { value: "submitted" } });

    // Wait for the form to be ready
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    });

    // Click the submit button
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    // Wait for the onSave to be called with the form data
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ name: "submitted" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("renders UPDATE button when initialData is provided", () => {
    renderWithTheme({ initialData: { name: "Existing" } });
    expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument();
  });
});