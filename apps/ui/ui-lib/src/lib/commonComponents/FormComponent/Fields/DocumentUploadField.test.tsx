import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import DocumentUploadField, { UploadFieldProps } from "./DocumentUploadField";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../../styles/Theme";
import { UploadDropZone, UploadIcon, UploadInstruction } from "./styles";
import { fireEvent } from "@testing-library/react";

jest.mock("../../../constants/endPoints", () => ({
  endPoints: {
    lookUpByName: jest.fn(() => "mocked-endpoint"),
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
jest.mock("./FileField", () =>
  jest.fn(({ onFileUploaded }) => {
    // Expose a button to simulate file upload for testing
    return (
      <div data-testid="file-field">
        <button
          data-testid="simulate-upload"
          onClick={() =>
            onFileUploaded({ id: "unique-file-id", fileName: "test.pdf" })
          }
        >
          Upload File
        </button>
      </div>
    );
  })
);

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    LinearProgress: () => (
      <div role="progressbar" data-testid="linear-progress">
        Loading...
      </div>
    ),
  };
});

jest.mock("./SelectField", () =>
  jest.fn(({ field }) => (
    <div data-testid="select-field">
      {(field?.required || field?.componentProps?.required) && (
        <span data-testid="required-indicator">*</span>
      )}
    </div>
  ))
);

jest.mock("../../DisplayUploadedFile", () =>
  jest.fn(({ file, onReplace }) => (
    <div data-testid="uploaded-file">
      {file?.fileUpload?.fileName}
      <button
        data-testid="replace-file-button"
        onClick={() =>
          onReplace(file.fileUpload?.id, {
            fileUpload: {
              id: file.fileUpload?.id,
              fileName: "new-replaced.pdf",
            },
          })
        }
      >
        Replace File
      </button>
    </div>
  ))
);

jest.mock("./TextField", () => jest.fn(() => <div data-testid="text-field" />));
jest.mock("../../../hooks/useMutation", () => ({
  useApiMutation: () => ({ mutate: jest.fn() }),
}));
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
}));

// Mock the useSelector to return mock state
const mockUseSelector = jest.mocked(require("react-redux").useSelector);
beforeEach(() => {
  mockUseSelector.mockImplementation((selector) => {
    const mockState = {
      user: {
        resolvedLookupIds: {
          DOCUMENT_TYPE: 101,
          FILE_TYPE: 102,
          // Add more mock lookup IDs as needed for tests
        },
      },
    };
    return selector(mockState);
  });
});
jest.mock("react-router-dom", () => ({ useLocation: () => ({}) }));

describe("DocumentUploadField", () => {
  const defaultField: import("../types").FormFieldConfig = {
    key: "documents",
    name: "documents",
    label: "Upload Documents",
    type: "file",
    componentProps: {},
  };

  const renderWithForm = (props: Partial<UploadFieldProps> = {}) => {
    const Wrapper = () => {
      const methods = useForm<{ documents: any[] }>({
        defaultValues: { documents: [] },
      });
      return (
        <ThemeProvider theme={theme}>
          <FormProvider {...methods}>
            <DocumentUploadField
              field={defaultField}
              control={methods.control as any}
              watch={methods.watch}
              setValue={methods.setValue}
              isFormAnArray={false}
              trigger={jest.fn()}
              companyType="testCompany"
              disableAllFields={false}
              {...props}
              documents={props.documents !== undefined ? props.documents : []}
            />
          </FormProvider>
        </ThemeProvider>
      );
    };
    return render(<Wrapper />);
  };

  it("renders the main container and label", () => {
    renderWithForm();
    expect(screen.getByText("Upload Documents")).toBeInTheDocument();
    expect(screen.getByTestId("file-field")).toBeInTheDocument();
  });

  it("renders the select field when dropdown is not hidden", () => {
    renderWithForm({ field: { ...defaultField, hideDropdown: false } });
    expect(screen.getByTestId("select-field")).toBeInTheDocument();
  });

  it("does not render the select field when dropdown is hidden", () => {
    renderWithForm({ field: { ...defaultField, hideDropdown: true } });
    expect(screen.queryByTestId("select-field")).not.toBeInTheDocument();
  });

  it("renders uploaded files if provided", () => {
    const documents = [
      {
        documentId: 1,
        documentTypeLid: 101,
        documentName: "Doc1",
        fileName: "file1.pdf",
        fileBuffer: "buffer1",
        fileUpload: { id: 1, fileName: "file1.pdf", fileBuffer: "buffer1" },
      },
      {
        documentId: 2,
        documentTypeLid: 102,
        documentName: "Doc2",
        fileName: "file2.pdf",
        fileBuffer: "buffer2",
        fileUpload: { id: 2, fileName: "file2.pdf", fileBuffer: "buffer2" },
      },
    ];
    renderWithForm({ documents });
    expect(screen.getAllByTestId("uploaded-file")).toHaveLength(2);
    expect(screen.getByText("file1.pdf")).toBeInTheDocument();
    expect(screen.getByText("file2.pdf")).toBeInTheDocument();
  });

  it("renders the text field when selectedDocumentType is 407", () => {
    const watch = jest.fn();
    watch.mockImplementation((cb) => {
      if (typeof cb === "function") {
        cb({ documentType: 407 }, { name: "documentType", type: "change" });
        return { unsubscribe: () => {} };
      }
      return cb === "documentType" ? 407 : undefined;
    });
    watch.mockImplementationOnce((name) =>
      name === "documentType" ? 407 : undefined
    );
    renderWithForm({ watch });
    expect(screen.getByTestId("text-field")).toBeInTheDocument();
  });

  it("skips processing file if documentId is missing", () => {
    // Mock console.warn to silence or check the warning
    const warnMock = jest.spyOn(console, "warn").mockImplementation(() => {});

    // Render the component with necessary props
    renderWithForm();

    // Get the FileField mock and call its onFileUploaded prop with a file missing id
    const FileFieldMock = require("./FileField");
    // Find the last call to FileField and get its props
    const lastCall =
      FileFieldMock.mock.calls[FileFieldMock.mock.calls.length - 1];
    const props = lastCall ? lastCall[0] : {};
    // Simulate uploading a file with missing id
    if (props && typeof props.onFileUploaded === "function") {
      props.onFileUploaded({ fileName: "test.pdf" });
    }

    expect(warnMock).toHaveBeenCalledWith(
      "File skipped due to missing documentId:",
      expect.any(Object)
    );

    warnMock.mockRestore();
  });

  it("calls setUploadedFiles updater when onFileUploaded is called with valid file", () => {
    renderWithForm();

    // Click the button inside the mocked FileField to simulate file upload
    const uploadButton = screen.getByTestId("simulate-upload");
    fireEvent.click(uploadButton);

    // Now the uploaded file should be rendered by DisplayUploadedFile mock
    const uploadedFile = screen.getByTestId("uploaded-file");
    expect(uploadedFile).toBeInTheDocument();
    expect(uploadedFile).toHaveTextContent("test.pdf");
  });

  describe("DocumentUploadField - setUploadedFiles updater branch coverage", () => {
    it("covers prev.forEach block when uploading a new unique file", async () => {
      // Initial documents simulating already uploaded files
      const initialDocuments = [
        {
          documentId: 1,
          documentTypeLid: 101,
          documentName: "Doc1",
          fileUpload: { id: 1, fileName: "file1.pdf" },
        },
      ];

      renderWithForm({ documents: initialDocuments });

      // Manually call onFileUploaded with a new unique file
      const FileFieldMock = require("./FileField");
      const lastCall =
        FileFieldMock.mock.calls[FileFieldMock.mock.calls.length - 1];
      const props = lastCall ? lastCall[0] : {};
      if (props && typeof props.onFileUploaded === "function") {
        props.onFileUploaded({ id: 2, fileName: "newfile.pdf" });
      }

      // After upload, both old and new files should be rendered
      await waitFor(() => {
        const uploadedFiles = screen.getAllByTestId("uploaded-file");
        const fileNames = uploadedFiles.map((el) =>
          (el as any).textContent?.replace("Replace File", "").trim()
        );
        expect(fileNames).toEqual(
          expect.arrayContaining(["file1.pdf", "newfile.pdf"])
        );
      });
    });
  });

  it("replaces existing file when handleReplaceFile is triggered", () => {
    const initialDocuments = [
      {
        documentId: 1,
        documentTypeLid: 101,
        documentName: "Doc1",
        fileUpload: { id: "old-file-id", fileName: "old-file.pdf" },
      },
    ];

    renderWithForm({ documents: initialDocuments });

    // Old file name should be rendered initially
    expect(screen.getByText("old-file.pdf")).toBeInTheDocument();

    // Simulate replace
    const replaceButton = screen.getByTestId("replace-file-button");
    fireEvent.click(replaceButton);

    // Old file should be replaced with new name
    expect(screen.queryByText("old-file.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("new-replaced.pdf")).toBeInTheDocument();
  });

  it("calls setSelectedDocType and setValue on StyledSelectBox blur when documentType is present", () => {
    const setValue = jest.fn();
    const watch = jest.fn();

    // Simulate watch returning a documentType value for direct calls
    watch.mockImplementation((nameOrCb) => {
      if (typeof nameOrCb === "function") {
        // Simulate subscription
        return { unsubscribe: jest.fn() };
      }
      return nameOrCb === "documentType" ? 123 : undefined;
    });

    renderWithForm({ setValue, watch });

    // Find the select field's parent (StyledSelectBox) and trigger blur
    const selectField = screen.getByTestId("select-field");
    const styledSelectBox = (selectField as any).parentElement;
    expect(styledSelectBox).toBeTruthy();

    // Fire blur event
    styledSelectBox && fireEvent.blur(styledSelectBox);

    // setValue should be called with the documentType value
    expect(setValue).toHaveBeenCalledWith("documentType", 123);
  });

  it("removes file from uploadedFiles and calls setValue on successful delete", () => {
    // Arrange
    const setValue = jest.fn();
    const mutate = jest.fn((_, { onSuccess }) => onSuccess());
    jest
      .spyOn(require("../../../hooks/useMutation"), "useApiMutation")
      .mockReturnValue({ mutate });

    const initialDocuments = [
      {
        documentId: 1,
        documentTypeLid: 101,
        documentName: "Doc1",
        fileUpload: { id: 1, fileName: "file1.pdf" },
      },
      {
        documentId: 2,
        documentTypeLid: 102,
        documentName: "Doc2",
        fileUpload: { id: 2, fileName: "file2.pdf" },
      },
    ];

    renderWithForm({ setValue, documents: initialDocuments });

    // Simulate delete by calling the onDelete prop of the first DisplayUploadedFile
    const DisplayUploadedFileMock = require("../../DisplayUploadedFile");
    const lastCall = DisplayUploadedFileMock.mock.calls[0];
    const props = lastCall ? lastCall[0] : {};
    if (props && typeof props.onDelete === "function") {
      props.onDelete(1); // delete file with id 1
    }

    // setValue should be called with the updated array containing the remaining file (robust match)
    expect(setValue).toHaveBeenCalledWith(
      "documents",
      expect.arrayContaining([
        expect.objectContaining({
          fileUpload: { id: 2, fileName: "file2.pdf" },
          documentName: "Doc2",
          documentType: 102,
        }),
      ])
    );
  });

  it("filters out documents with missing/null documentId and skips duplicates in propDocuments", () => {
    const setValue = jest.fn();
    const documents = [
      {
        documentId: 1,
        documentTypeLid: 101,
        documentName: "Doc1",
        fileName: "file1.pdf",
        fileBuffer: "buffer1",
        fileUpload: { id: 1, fileName: "file1.pdf", fileBuffer: "buffer1" },
      },
      {
        documentId: 1, // duplicate
        documentTypeLid: 101,
        documentName: "Doc1-dup",
        fileName: "file1-dup.pdf",
        fileBuffer: "buffer1dup",
        fileUpload: {
          id: 1,
          fileName: "file1-dup.pdf",
          fileBuffer: "buffer1dup",
        },
      },
      {
        documentId: null,
        documentTypeLid: 102,
        documentName: "DocNull",
        fileName: "file-null.pdf",
        fileBuffer: "bufferNull",
        fileUpload: {
          id: null,
          fileName: "file-null.pdf",
          fileBuffer: "bufferNull",
        },
      },
      {
        // documentId undefined
        documentTypeLid: 103,
        documentName: "DocUndef",
        fileName: "file-undef.pdf",
        fileBuffer: "bufferUndef",
        fileUpload: {
          id: undefined,
          fileName: "file-undef.pdf",
          fileBuffer: "bufferUndef",
        },
      },
      {
        documentId: 2,
        documentTypeLid: 104,
        documentName: "Doc2",
        fileName: "file2.pdf",
        fileBuffer: "buffer2",
        fileUpload: { id: 2, fileName: "file2.pdf", fileBuffer: "buffer2" },
      },
    ];

    renderWithForm({ setValue, documents });

    // Only two unique, valid files should be rendered
    const uploadedFiles = screen.getAllByTestId("uploaded-file");
    expect(uploadedFiles).toHaveLength(2);
    // Should contain file1.pdf (not the duplicate or null/undefined)
    expect(screen.getByText("file1.pdf")).toBeInTheDocument();
    expect(screen.getByText("file2.pdf")).toBeInTheDocument();
    // Should NOT contain file1-dup.pdf, file-null.pdf, or file-undef.pdf
    expect(screen.queryByText("file1-dup.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("file-null.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("file-undef.pdf")).not.toBeInTheDocument();
  });
});
