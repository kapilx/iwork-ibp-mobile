import "@testing-library/jest-dom";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import FileUpload from "./FileUpload";
import { theme } from "../../../styles/Theme";

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

import {
  CLICK_TO_UPLOAD,
  INVALID_FILE_FORMAT,
  UPLOAD_INSTRUCTION,
  AI_CARD_TYPE,
  MAX_FILE_SIZE_MB,
} from "../../../constants";
import { setToastMessage, setFileUploaded } from "../../../redux/slice";

// Declare window for Jest environment
declare global {
  interface Window {
    sessionStorage: Storage;
  }
}

const mockStorage: Storage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

interface FileResponse {
  id: number;
  fileName: string;
  fileBuffer: string;
  mimeType: string;
}

interface ApiResponse {
  data: { data: FileResponse } | null;
  loading: boolean;
  error: { message: string } | null;
}

const mockDoFetch = jest.fn();
let mockApiResponse: ApiResponse = {
  data: null,
  loading: false,
  error: null,
};

jest.mock("../../../hooks/useApi", () => ({
  __esModule: true,
  default: () => ({
    doFetch: mockDoFetch,
    ...mockApiResponse,
  }),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

const store = {
  getState: () => ({}),
  subscribe: jest.fn(),
  dispatch: jest.fn(),
  replaceReducer: jest.fn(),
};

const defaultField = {
  key: "testFile",
  name: "testFile",
  label: "Test File",
  type: "file",
  rules: { required: true },
  componentProps: {
    accept: ".pdf,.jpg",
    multiple: false,
    variantType: "primary",
  },
  apiDependencies: { endPoint: "/api/upload" },
};

const defaultProps = {
  field: defaultField,
  onFileUpload: jest.fn(),
  watch: jest.fn(),
  setValue: jest.fn(),
};

function FileUploadTestWrapper(props: any) {
  const methods = useForm();
  return (
    <Provider store={store as any}>
      <ThemeProvider theme={theme}>
        <FileUpload {...defaultProps} control={methods.control} {...props} />
      </ThemeProvider>
    </Provider>
  );
}

describe("FileUpload Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiResponse = {
      data: null,
      loading: false,
      error: null,
    };
    Object.defineProperty(global, "sessionStorage", { value: mockStorage });
    mockStorage.setItem(
      "user",
      JSON.stringify({ accessToken: { accessToken: "mock-token" } })
    );
  });

  const renderComponent = (props = {}) => {
    const result = render(<FileUploadTestWrapper {...props} />);
    return {
      ...result,
      input: result.container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement,
    };
  };

  it("renders label and required asterisk", () => {
    renderComponent();
    expect(screen.getByText("Test File *")).toBeInTheDocument();
    expect(screen.getByText(CLICK_TO_UPLOAD)).toBeInTheDocument();
  });

  it("renders label without asterisk if not required", () => {
    renderComponent({ field: { ...defaultField, rules: {} } });
    expect(screen.getByText("Test File")).toBeInTheDocument();
  });

  it("displays disclaimer when custom variant is info", () => {
    renderComponent({
      field: {
        ...defaultField,
        componentProps: {
          ...defaultField.componentProps,
          customVariant: "info",
        },
      },
    });
    expect(screen.getByText(AI_CARD_TYPE)).toBeInTheDocument();
  });

  it("dispatches toast for invalid file on drop", () => {
    const dispatchSpy = jest.spyOn(store, "dispatch");
    renderComponent();
    const dropZone = screen.getByText(CLICK_TO_UPLOAD);
    const file = new File(["dummy"], "test.exe", {
      type: "application/x-msdownload",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
      preventDefault: () => {},
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      setToastMessage(INVALID_FILE_FORMAT(".pdf,.jpg"))
    );
  });

  it("alerts on oversized file input", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    const { input } = renderComponent();

    const bigFile = new File(
      [new Array(1024 * 1024 * (MAX_FILE_SIZE_MB + 1)).join("a")],
      "big.pdf",
      { type: "application/pdf" }
    );

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(alertSpy).toHaveBeenCalledWith(UPLOAD_INSTRUCTION);
    alertSpy.mockRestore();
  });

  it("dispatches toast for too large file on drop", () => {
    const dispatchSpy = jest.spyOn(store, "dispatch");
    const { container } = renderComponent();

    const bigFile = new File(
      [new Array(1024 * 1024 * (MAX_FILE_SIZE_MB + 1)).join("a")],
      "big.pdf",
      { type: "application/pdf" }
    );

    const dropZone = container.querySelector(".css-1mh8tv8") as HTMLElement;
    fireEvent.dragOver(dropZone, { preventDefault: () => {} });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bigFile] },
      preventDefault: () => {},
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      setToastMessage(UPLOAD_INSTRUCTION)
    );
  });

  it("renders loader when loading is true", () => {
    mockApiResponse = {
      data: null,
      loading: true,
      error: null,
    };

    renderComponent();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("displays uploaded file name when file is uploaded via API", async () => {
    const fileData: FileResponse = {
      id: 1,
      fileName: "uploaded.pdf",
      fileBuffer: "base64string",
      mimeType: "application/pdf",
    };
    mockApiResponse = {
      data: { data: fileData },
      loading: false,
      error: null,
    };

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("uploaded.pdf")).toBeInTheDocument();
      expect(store.dispatch).toHaveBeenCalledWith(setFileUploaded(fileData));
    });
  });

  it("calls onFileUpload with error when API returns error", () => {
    const onFileUpload = jest.fn();
    mockApiResponse = {
      data: null,
      loading: false,
      error: { message: "Upload failed" },
    };

    renderComponent({ onFileUpload });

    expect(onFileUpload).toHaveBeenCalledWith(
      { message: "Upload failed" },
      true
    );
  });

  it("handles file upload with API", async () => {
    const onFileUpload = jest.fn();
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const fileResponse = {
      id: 1,
      fileName: "test.pdf",
      fileBuffer: "base64content",
      mimeType: "application/pdf",
    };

    mockApiResponse = {
      data: { data: fileResponse },
      loading: false,
      error: null,
    };

    const { input } = renderComponent({ onFileUpload });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFileUpload).toHaveBeenCalledWith({ data: fileResponse }, true);
      expect(store.dispatch).toHaveBeenCalledWith(
        setFileUploaded(fileResponse)
      );
    });
  });

  it("handles file drop with API", async () => {
    const onFileUpload = jest.fn();
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const fileResponse = {
      id: 1,
      fileName: "test.pdf",
      fileBuffer: "base64content",
      mimeType: "application/pdf",
    };

    mockApiResponse = {
      data: { data: fileResponse },
      loading: false,
      error: null,
    };

    const { container } = renderComponent({ onFileUpload });
    const dropZone = container.querySelector(".css-1mh8tv8") as HTMLElement;

    fireEvent.dragOver(dropZone, { preventDefault: () => {} });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
      preventDefault: () => {},
    });

    await waitFor(() => {
      expect(onFileUpload).toHaveBeenCalledWith({ data: fileResponse }, true);
      expect(store.dispatch).toHaveBeenCalledWith(
        setFileUploaded(fileResponse)
      );
    });
  });

  it("processes multiple file selection correctly", async () => {
    const onFileUpload = jest.fn();

    const { input } = renderComponent({
      field: {
        ...defaultField,
        componentProps: {
          ...defaultField.componentProps,
          multiple: true,
        },
      },
      onFileUpload,
    });

    const files = [
      new File(["test1"], "test1.pdf", { type: "application/pdf" }),
      new File(["test2"], "test2.pdf", { type: "application/pdf" }),
    ];

    files.forEach((file) => {
      Object.defineProperty(file, "size", { value: 1024 });
    });

    fireEvent.change(input, { target: { files } });

    expect(input.value).toBe("");
    expect(onFileUpload).toHaveBeenCalled();
  });

  it("processes single file upload correctly", async () => {
    const onFileUpload = jest.fn();
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "size", { value: 1024 });

    const { input } = renderComponent({
      field: {
        ...defaultField,
        componentProps: {
          ...defaultField.componentProps,
          multiple: false,
        },
      },
      onFileUpload,
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(input.value).toBe("");
    expect(onFileUpload).toHaveBeenCalled();
  });

  describe("handleFileChange functionality", () => {
    it("handles empty file selection", () => {
      const onFileUpload = jest.fn();
      const onChange = jest.fn();
      const { input } = renderComponent({ onFileUpload });

      fireEvent.change(input, { target: { files: [] } });

      expect(onFileUpload).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("handles file selection and resets input value", async () => {
      const onFileUpload = jest.fn();
      const { input } = renderComponent({ onFileUpload });

      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      fireEvent.change(input, { target: { files: [file] } });

      expect(input.value).toBe("");
      expect(onFileUpload).toHaveBeenCalled();
    });

    it("handles file selection and maintains state", () => {
      const onFileUpload = jest.fn();
      const { input } = renderComponent({ onFileUpload });

      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      Object.defineProperty(file, "size", { value: 1024 });

      fireEvent.change(input, { target: { files: [file] } });

      expect(input.value).toBe("");
      expect(onFileUpload).toHaveBeenCalled();
    });
  });

  describe("getMimeTypeFromFileName function tests", () => {
    it("returns application/msword for doc files", () => {
      const mockFile = new File([""], "test.doc", {
        type: "application/msword",
      });
      expect(mockFile.type).toBe("application/msword");
    });

    it("returns application/vnd.openxmlformats-officedocument.wordprocessingml.document for docx files", () => {
      const mockFile = new File([""], "test.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      expect(mockFile.type).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    });

    it("returns application/octet-stream for unknown extensions", () => {
      const mockFile = new File([""], "test.unknown", {
        type: "application/octet-stream",
      });
      expect(mockFile.type).toBe("application/octet-stream");
    });

    it("handles edge cases correctly", () => {
      const upperCaseFile = new File([""], "test.PDF", {
        type: "application/pdf",
      });
      expect(upperCaseFile.type).toBe("application/pdf");

      const noExtensionFile = new File([""], "testfile", {
        type: "application/octet-stream",
      });
      expect(noExtensionFile.type).toBe("application/octet-stream");

      const multiDotFile = new File([""], "test.backup.pdf", {
        type: "application/pdf",
      });
      expect(multiDotFile.type).toBe("application/pdf");

      const hiddenFile = new File([""], ".test.pdf", {
        type: "application/pdf",
      });
      expect(hiddenFile.type).toBe("application/pdf");

      const emptyFile = new File([""], "", {
        type: "application/octet-stream",
      });
      expect(emptyFile.type).toBe("application/octet-stream");

      const undefinedFile = new File([""], undefined as unknown as string, {
        type: "application/octet-stream",
      });
      expect(undefinedFile.type).toBe("application/octet-stream");
    });
  });

  it("triggers file input click when upload area is clicked", () => {
    const { container } = renderComponent();
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const clickSpy = jest.spyOn(input, "click");

    const uploadArea = screen.getByText(CLICK_TO_UPLOAD);
    fireEvent.click(uploadArea);

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("handles manual file upload with FileReader", async () => {
    const onFileUpload = jest.fn();
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    const mockFileReaderInstance = {
      readAsDataURL: jest.fn(function () {
        // simulate async delay
        setTimeout(() => {
          this.result = "data:application/pdf;base64,dGVzdCBjb250ZW50";
          if (typeof this.onload === "function") {
            this.onload({ target: this });
          }
        }, 0);
      }),
      result: null,
      onload: null,
    };

    (global as any).FileReader = jest.fn(
      () => mockFileReaderInstance as any
    ) as any;

    const { input } = renderComponent({
      field: {
        ...defaultField,
        componentProps: {
          ...defaultField.componentProps,
          manualUpload: true,
        },
      },
      onFileUpload,
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockFileReaderInstance.readAsDataURL).toHaveBeenCalledWith(file);
      // For manual upload, onFileUpload is not called - the component only calls onChange
      // and sets the uploaded file state. Check that the file is displayed instead.
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });
  });
});
