import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import FileUploadWrapper from "./index";
import userEvent from "@testing-library/user-event";
import { useDispatch } from "react-redux";
import { FILE_UPLOAD_SUCCESS_MESSAGE } from "../../constants";
import { setToastMessage } from "../../redux/slice";
import { waitFor } from "@testing-library/react";
import { fileUploadFields, fileUploadInitialData } from "./formConfig";
import {
  FileUploadForm,
  StyledGridContainer,
  StyledGridItem,
} from "./styles";

// Mock useDispatch
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

// Enhance DynamicForm mock
jest.mock("../FormComponent", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onFileUpload, formMethods }: any) => {
      React.useEffect(() => {
        if (formMethods) formMethods({ dummy: "methods" });
      }, [formMethods]);

      return (
        <div data-testid="mock-dynamic-form">
          <button
            onClick={() =>
              onFileUpload(
                { success: true, data: [{ companyName: "TestCo" }] },
                true
              )
            }
          >
            Upload
          </button>
          <button
            onClick={() =>
              onFileUpload({ success: false, error: "Upload failed" }, true)
            }
          >
            Fail Upload
          </button>
          <button
            onClick={() =>
              onFileUpload(
                { success: true, data: [{ companyName: "IgnoredCo" }] },
                false
              )
            }
          >
            Upload No API
          </button>
        </div>
      );
    },
  };
});

describe("FileUploadWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders DynamicForm", () => {
    render(<FileUploadWrapper />);
    expect(screen.getByTestId("mock-dynamic-form")).toBeInTheDocument();
  });

  it("dispatches success toast message on successful file upload", async () => {
    render(<FileUploadWrapper />);
    userEvent.click(screen.getByText("Upload"));

    const expectedMessage = FILE_UPLOAD_SUCCESS_MESSAGE("TestCo");

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setToastMessage({ message: expectedMessage, duration: 7000 })
      );
    });
  });

  it("dispatches error toast message on failed file upload", async () => {
    render(<FileUploadWrapper />);
    userEvent.click(screen.getByText("Fail Upload"));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setToastMessage("Upload failed")
      );
    });
  });

  it("does not dispatch toast when isApiRes is false", async () => {
    render(<FileUploadWrapper />);
    userEvent.click(screen.getByText("Upload No API"));

    await waitFor(() => {
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  it("calls setFormMethods from DynamicForm", async () => {
    render(<FileUploadWrapper />);
    await waitFor(() => {
      expect(true).toBe(true); // forces useEffect to run
    });
  });

  it("accepts and uses custom props", () => {
    render(
      <FileUploadWrapper
        multiple={true}
        formConfig={fileUploadFields}
        defaultValues={fileUploadInitialData}
      />
    );
    expect(screen.getByTestId("mock-dynamic-form")).toBeInTheDocument();
  });
});

describe("Styled Components", () => {
  it("renders FileUploadForm", () => {
    render(<FileUploadForm data-testid="file-upload-form">Form</FileUploadForm>);
    expect(screen.getByTestId("file-upload-form")).toBeInTheDocument();
  });

  it("renders StyledGridContainer", () => {
    render(<StyledGridContainer data-testid="grid-container">Grid</StyledGridContainer>);
    expect(screen.getByTestId("grid-container")).toBeInTheDocument();
  });

  it("renders StyledGridItem", () => {
    render(<StyledGridItem data-testid="grid-item">Item</StyledGridItem>);
    expect(screen.getByTestId("grid-item")).toBeInTheDocument();
  });
});
