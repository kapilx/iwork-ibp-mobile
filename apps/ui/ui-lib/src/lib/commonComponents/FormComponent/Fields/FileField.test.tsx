import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import FileField from "./FileField";
import { theme } from "../../../styles/Theme";
import "@testing-library/jest-dom";
import { setToastMessage } from "../../../redux/slice";

//  Mock constants
jest.mock("../../../constants", () => ({
  CLICK_TO_UPLOAD: "Click to upload",
  DRAG_AND_DROP: " or drag and drop",
  PLEASE_SELECT_DOCUMENT_TYPE: "Please select document type",
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Mock Redux useDispatch
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

// Initial mock for useFileUpload (empty response)
jest.mock("../../../hooks/useFileUpload.js", () => ({
  useFileUpload: () => ({
    fileUploadResponse: { data: null },
    handleFileChange: jest.fn(),
    loading: false,
    handleFileUpload: jest.fn(),
  }),
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
//  ControlledField mock
let mockRenderProps: any = {
  name: "testFileUpload",
  value: "",
  onChange: jest.fn(),
  onBlur: jest.fn(),
  error: false,
  helperText: "",
  label: "Upload",
};
jest.mock("../utils", () => ({
  ControlledField: ({ render }: any) => render(mockRenderProps),
}));

//  Utility render with theme
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("FileField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenderProps = {
      name: "testFileUpload",
      value: "",
      onChange: jest.fn(),
      onBlur: jest.fn(),
      error: false,
      helperText: "",
      label: "Upload",
    };
  });

  it("renders the upload area with instructions", () => {
    renderWithTheme(
      <FileField
        field={{ name: "file", componentProps: {} }}
        control={{} as any}
        selectedDocumentType="PAN"
      />
    );

    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/or drag and drop/i)).toBeInTheDocument();
  });

  it("triggers dispatch if document type is not selected on click", () => {
    renderWithTheme(
      <FileField
        field={{ name: "file", componentProps: {} }}
        control={{} as any}
        selectedDocumentType=""
      />
    );

    fireEvent.click(screen.getByText(/Click to upload/i));
    expect(mockDispatch).toHaveBeenCalledWith(setToastMessage("Please select document type"));
  });

  it("renders file input and triggers file input click", () => {
    renderWithTheme(
      <FileField
        field={{ name: "file", componentProps: {} }}
        control={{} as any}
        selectedDocumentType="AADHAR"
      />
    );

    const dropZone = screen.getByText(/Click to upload/i).closest("div")!;
    fireEvent.click(dropZone);

    // File input is hidden, so we just confirm no dispatch for missing doc type
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("prevents drop without selected document type", () => {
    renderWithTheme(
      <FileField
        field={{ name: "file", componentProps: {} }}
        control={{} as any}
        selectedDocumentType=""
      />
    );

    fireEvent.drop(screen.getByText(/Click to upload/i).closest("div")!, {
      dataTransfer: {
        files: [new File(["test"], "file.pdf", { type: "application/pdf" })],
      },
    });

    expect(mockDispatch).toHaveBeenCalledWith(setToastMessage("Please select document type"));
  });

  it("allows file drop when document type is selected", () => {
    renderWithTheme(
      <FileField
        field={{ name: "file", componentProps: {} }}
        control={{} as any}
        selectedDocumentType="AADHAR"
      />
    );

    fireEvent.drop(screen.getByText(/Click to upload/i).closest("div")!, {
      dataTransfer: {
        files: [new File(["dummy"], "test-file.txt", { type: "text/plain" })],
      },
    });

    expect(mockDispatch).not.toHaveBeenCalledWith(setToastMessage("Please select document type"));
  });

  it("triggers onChange and onFileUploaded when file upload response updates", () => {
    //  Override useFileUpload with actual upload response
    jest.mocked(require("../../../hooks/useFileUpload.js")).useFileUpload = () => ({
      fileUploadResponse: { data: { name: "uploaded.pdf" } },
      handleFileChange: jest.fn(),
      loading: false,
      handleFileUpload: jest.fn(),
    });

    const onFileUploaded = jest.fn();
    mockRenderProps.onChange = jest.fn();

    const { rerender } = renderWithTheme(
      <FileField
        field={{ name: "file", componentProps: {} }}
        control={{} as any}
        selectedDocumentType="AADHAR"
        onFileUploaded={onFileUploaded}
      />
    );

    //  Simulate update (triggering useEffect logic)
    rerender(
      <ThemeProvider theme={theme}>
        <FileField
          field={{ name: "file", componentProps: {} }}
          control={{} as any}
          selectedDocumentType="AADHAR"
          onFileUploaded={onFileUploaded}
        />
      </ThemeProvider>
    );

    expect(mockRenderProps.onChange).toHaveBeenCalledWith({ name: "uploaded.pdf" });
    expect(onFileUploaded).toHaveBeenCalledWith({ name: "uploaded.pdf" });
  });

  it("renders a custom upload icon if provided", () => {
  const customIcon = "custom-icon.svg";
  renderWithTheme(
    <FileField
      field={{
        name: "file",
        UploadIcon: customIcon,
        componentProps: {},
      }}
      control={{} as any}
      selectedDocumentType="AADHAR"
    />
  );

  const img = screen.getByRole("img");
  expect(img).toHaveAttribute("src", customIcon);
});

it("calls onUploadingChange with loading state", () => {
  const onUploadingChange = jest.fn();

  jest.mocked(require("../../../hooks/useFileUpload.js")).useFileUpload = () => ({
    fileUploadResponse: { data: null },
    handleFileChange: jest.fn(),
    loading: true,
    handleFileUpload: jest.fn(),
  });

  renderWithTheme(
    <FileField
      field={{ name: "file", componentProps: {} }}
      control={{} as any}
      selectedDocumentType="AADHAR"
      onUploadingChange={onUploadingChange}
    />
  );

  expect(onUploadingChange).toHaveBeenCalledWith(true);
});

it("allows multiple file selection when componentProps.multiple is true", () => {
  const { container } = renderWithTheme(
    <FileField
      field={{
        name: "multiFile",
        componentProps: { multiple: true },
      }}
      control={{} as any}
      selectedDocumentType="AADHAR"
    />
  );

  const input = container.querySelector('input[type="file"]');
  expect(input).toHaveAttribute("multiple");
});

it("allows upload without document type if requireDocumentType is false", () => {
  renderWithTheme(
    <FileField
      field={{
        name: "file",
        componentProps: { requireDocumentType: false },
      }}
      control={{} as any}
      selectedDocumentType=""
    />
  );

  const dropZone = screen.getByText(/Click to upload/i).closest("div")!;
  fireEvent.click(dropZone);

  // Should NOT trigger toast message
  expect(mockDispatch).not.toHaveBeenCalledWith(setToastMessage("Please select document type"));
});

it("sets correct accept attribute on input field", () => {
  const { container } = renderWithTheme(
    <FileField
      field={{
        name: "file",
        componentProps: { accept: ".pdf" },
      }}
      control={{} as any}
      selectedDocumentType="AADHAR"
    />
  );

  const input = container.querySelector('input[type="file"]');
  expect(input).toHaveAttribute("accept", ".pdf");
});
it("sets correct accept attribute on input field", () => {
  const { container } = renderWithTheme(
    <FileField
      field={{
        name: "file",
        componentProps: { accept: ".pdf" },
      }}
      control={{} as any}
      selectedDocumentType="AADHAR"
    />
  );

  const input = container.querySelector('input[type="file"]');
  expect(input).toHaveAttribute("accept", ".pdf");
});

it("renders with custom variant when provided", () => {
  renderWithTheme(
    <FileField
      field={{
        name: "file",
        componentProps: { customVariant: "outlined" },
      }}
      control={{} as any}
      selectedDocumentType="AADHAR"
    />
  );

  // Assuming customVariant sets a class or attribute, adjust this accordingly
  const styledSpan = screen.getByText(/Click to upload/i).closest("span");
  expect(styledSpan).toBeInTheDocument();
});

it("prevents file change and shows toast if document type is required but not selected", () => {
  const mockHandleFileChange = jest.fn();

  jest.mocked(require("../../../hooks/useFileUpload.js")).useFileUpload = () => ({
    fileUploadResponse: { data: null },
    handleFileChange: mockHandleFileChange,
    loading: false,
    handleFileUpload: jest.fn(),
  });

  const { container } = renderWithTheme(
    <FileField
      field={{
        name: "file",
        componentProps: { requireDocumentType: true },
      }}
      control={{} as any}
      selectedDocumentType="" // Missing doc type
    />
  );

  const input = container.querySelector('input[type="file"]')!;
  fireEvent.change(input, {
    target: {
      files: [new File(["dummy"], "file.txt", { type: "text/plain" })],
    },
  });

  expect(mockDispatch).toHaveBeenCalledWith(setToastMessage("Please select document type"));
  expect(mockHandleFileChange).not.toHaveBeenCalled();
});

});

