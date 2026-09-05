jest.mock("../../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
  },
}));

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DisplayUploadedFile, { DocumentUploadProps } from "./index";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import userEvent from "@testing-library/user-event";

const theme = createTheme({
  typography: {
    fontSizes: {
      sm: "0.875rem",
      md: "1rem",
      lg: "1.25rem",
      xs: "0.75rem",
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
});

const createMockStore = () => ({
  getState: jest.fn(() => ({})),
  subscribe: jest.fn(() => jest.fn()),
  dispatch: jest.fn(),
});

jest.mock("../../assets/svgs/pdf-icon.svg", () => "pdf-icon.svg");
jest.mock("../../assets/svgs/doc-icon.svg", () => "doc-icon.svg");
jest.mock("../../assets/svgs/excel-icon.svg", () => "excel-icon.svg");
jest.mock("../../assets/svgs/powerPoint-icon.svg", () => "powerPoint-icon.svg");
jest.mock("../../assets/svgs/video-icon.svg", () => "video-icon.svg");
jest.mock("../../assets/svgs/download-icon.svg", () => "download-icon.svg");
jest.mock("../../assets/svgs/refresh-icon.svg", () => "refresh-icon.svg");
jest.mock("../../assets/svgs/trash-icon.svg", () => "trash-icon.svg");

jest.mock("../../hooks/useFileUpload", () => ({
  useFileUpload: jest.fn(),
}));

jest.mock("../../hooks/useApiQuery", () => ({
  useApiQuery: jest.fn(),
}));

jest.mock("../../utils/apiRequest", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("../../redux/slice", () => ({
  setToastMessage: jest.fn(),
}));

const defaultFile = {
  fileUpload: {
    id: "file-1",
    fileName: "test.pdf",
  },
  documentType: "1",
  documentName: "Test Document",
  companyType: "TypeA",
  companyId: "Company1",
};

const renderComponent = (props?: Partial<DocumentUploadProps>) => {
  const store = createMockStore();
  return {
    ...render(
      <Provider store={store as any}>
        <ThemeProvider theme={theme}>
          <DisplayUploadedFile
            file={defaultFile}
            onReplace={jest.fn()}
            onDelete={jest.fn()}
            {...props}
          />
        </ThemeProvider>
      </Provider>
    ),
    store,
  };
};

describe("DisplayUploadedFile", () => {
  const mockUseFileUpload = require("../../hooks/useFileUpload").useFileUpload;
  const mockUseApiQuery = require("../../hooks/useApiQuery").useApiQuery;
  const mockApiRequest = require("../../utils/apiRequest").apiRequest;
  const mockSetToastMessage = require("../../redux/slice").setToastMessage;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFileUpload.mockReturnValue({
      handleFileUpload: jest
        .fn()
        .mockImplementation((_file, _type, _id, _docType, cb) => {
          setTimeout(() => {
            cb({ id: "new-file-id", fileName: "newfile.pdf" });
          }, 0);
        }),
      uploadedFile: null,
      loading: false,
    });

    mockUseApiQuery.mockReturnValue({
      data: {
        data: [
          { id: "1", lookUpName: "PDF", lookUpValue: "PDF", lookUpkey: "pdf" },
          { id: "2", lookUpName: "DOC", lookUpValue: "DOC", lookUpkey: "doc" },
        ],
      },
      isLoading: false,
    });

    mockApiRequest.mockResolvedValue({
      data: new Blob(["test"], { type: "application/pdf" }),
      headers: { "content-disposition": 'attachment; filename="test.pdf"' },
    });

    mockSetToastMessage.mockReturnValue({
      type: "SET_TOAST",
      payload: "message",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders file name and document type", () => {
    renderComponent();
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  it("shows toast when HTML error page is returned in blob", async () => {
    const blob = new Blob(["<html>Error</html>"], { type: "text/html" });
    blob.text = jest.fn().mockResolvedValue("<html>Error</html>");

    mockApiRequest.mockResolvedValueOnce({
      data: blob,
      headers: {},
    });

    const { store } = renderComponent();
    fireEvent.click(screen.getByAltText("download"));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SET_TOAST",
        })
      );
    });
  });

  it("downloads file when content-disposition is in headers.get()", async () => {
    const blob = new Blob(["test"], { type: "application/pdf" });
    blob.text = jest.fn().mockResolvedValue("not html");

    const mockCreateObjectURL = jest.fn(() => "blob:fake-url");
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = jest.fn();

    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const appendSpy = jest.spyOn(document.body, "appendChild");
    const removeSpy = jest.spyOn(document.body, "removeChild");

    mockApiRequest.mockResolvedValueOnce({
      data: blob,
      headers: {
        get: () => 'attachment; filename="fetched.pdf"',
      },
    });

    renderComponent();
    fireEvent.click(screen.getByAltText("download"));

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });

    clickSpy.mockRestore();
  });

  it("downloads file when content-disposition is in headers object", async () => {
    const blob = new Blob(["test"], { type: "application/pdf" });
    blob.text = jest.fn().mockResolvedValue("not html");

    const mockCreateObjectURL = jest.fn(() => "blob:fake-url");
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = jest.fn();

    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const appendSpy = jest.spyOn(document.body, "appendChild");
    const removeSpy = jest.spyOn(document.body, "removeChild");

    mockApiRequest.mockResolvedValueOnce({
      data: blob,
      headers: {
        "content-disposition": 'attachment; filename="custom-name.pdf"',
      },
    });

    renderComponent();
    fireEvent.click(screen.getByAltText("download"));

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });

    clickSpy.mockRestore();
  });

  it("renders icons", () => {
    renderComponent();
    expect(screen.getByAltText("download")).toBeInTheDocument();
    expect(screen.getByAltText("refresh")).toBeInTheDocument();
    expect(screen.getByAltText("thrash")).toBeInTheDocument();
  });

  it("calls onDelete when trash icon is clicked", () => {
    const onDelete = jest.fn();
    renderComponent({ onDelete });

    fireEvent.click(screen.getByAltText("thrash"));
    expect(onDelete).toHaveBeenCalledWith("file-1");
  });

  it("calls onReplace when a file is selected", async () => {
    const onReplace = jest.fn();
    const mockHandleFileUpload = jest
      .fn()
      .mockImplementation((_file, _type, _id, _docType, cb) => {
        setTimeout(() => {
          cb({ id: "new-file-id", fileName: "newfile.pdf" });
        }, 0);
      });

    mockUseFileUpload.mockReturnValue({
      handleFileUpload: mockHandleFileUpload,
      uploadedFile: null,
      loading: false,
    });

    renderComponent({ onReplace });

    const input = screen.getByLabelText(/select new file/i);
    const file = new File(["content"], "newfile.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockHandleFileUpload).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(onReplace).toHaveBeenCalledWith(
          "file-1",
          expect.objectContaining({
            fileUpload: expect.objectContaining({ fileName: "newfile.pdf" }),
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it("disables actions when disableAllFields is true", () => {
    renderComponent({ disableAllFields: true });
    expect(screen.queryByAltText("refresh")).not.toBeInTheDocument();
    expect(screen.queryByAltText("thrash")).not.toBeInTheDocument();
  });

  it("hides dropdown when hideDropdown is true", () => {
    renderComponent({ hideDropdown: true });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders correct icon for different file types", () => {
    const testFiles = [
      ["file.pdf", "pdf-icon.svg"],
      ["file.doc", "doc-icon.svg"],
      ["file.xls", "excel-icon.svg"],
      ["file.ppt", "powerPoint-icon.svg"],
      ["file.mp4", "video-icon.svg"],
    ];

    testFiles.forEach(([fileName, expectedIcon]) => {
      const { unmount } = renderComponent({
        file: { ...defaultFile, fileUpload: { id: "id", fileName } },
      });

      expect(screen.getByAltText("file type")).toHaveAttribute(
        "src",
        expectedIcon
      );

      unmount();
    });
  });

  it("handles download error gracefully", async () => {
    mockApiRequest.mockRejectedValueOnce(new Error("Download failed"));

    const { store } = renderComponent();

    fireEvent.click(screen.getByAltText("download"));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SET_TOAST",
        })
      );
    });
  });

});
