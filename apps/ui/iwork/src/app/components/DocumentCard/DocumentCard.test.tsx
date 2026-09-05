import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import DocumentCard from "./index";
import { theme } from "@ui/ui-lib";
import { KnowledgeDocument } from "../../pages/KnowledgeCentral/types";

// Mocks
jest.mock("@ui/ui-lib", () => {
  const actual = jest.requireActual("@ui/ui-lib");
  return {
    ...actual,
    getFileIcon: jest.fn(() => <div data-testid="file-icon">ICON</div>),
  };
});

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);

const mockDoc: KnowledgeDocument = {
  documentId: 1,
  title: "Sample Document",
  createdAt: "2024-05-01T12:00:00Z",
  accessCount: 42,
  extension: "pdf",
  summary: "Sample summary tooltip",
  tags: ["HR", "Finance", "Legal"],
};

describe("DocumentCard Component", () => {
  const onAccess = jest.fn();
  const onClick = jest.fn();
  const onEdit = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the document title and meta info", () => {
    renderWithTheme(<DocumentCard doc={mockDoc} onAccess={onAccess} />);
    expect(screen.getByText("Sample Document")).toBeInTheDocument();
    expect(screen.getByText("01 May 2024")).toBeInTheDocument();
    expect(screen.getByText("42 views")).toBeInTheDocument();
  });

  it("displays icon returned from getFileIcon", () => {
    renderWithTheme(<DocumentCard doc={mockDoc} onAccess={onAccess} />);
    expect(screen.getByTestId("file-icon")).toBeInTheDocument();
  });

  it("calls onAccess when download icon is clicked", async () => {
    renderWithTheme(<DocumentCard doc={mockDoc} onAccess={onAccess} />);

    fireEvent.mouseEnter(screen.getByText("Sample Document"));
    const downloadIcon = await screen.findByAltText("Download");
    fireEvent.click(downloadIcon);
    expect(onAccess).toHaveBeenCalledWith(1);
  });

  it("calls onClick when card is clicked", () => {
    renderWithTheme(
      <DocumentCard doc={mockDoc} onAccess={onAccess} onClick={onClick} />
    );
    fireEvent.click(screen.getByText("Sample Document"));
    expect(onClick).toHaveBeenCalledWith(mockDoc);
  });

  it("renders tags and +N more label correctly", () => {
    renderWithTheme(<DocumentCard doc={mockDoc} onAccess={onAccess} />);
    expect(screen.getByText("HR")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("shows edit icon only on hover if canEdit is true", async () => {
    renderWithTheme(
      <DocumentCard doc={mockDoc} onAccess={onAccess} onEdit={onEdit} canEdit />
    );

    // Initially hidden
    expect(screen.queryByAltText("Edit")).not.toBeInTheDocument();

    // Hover to show
    fireEvent.mouseEnter(screen.getByText("Sample Document"));
    const editIcon = await screen.findByAltText("Edit");
    expect(editIcon).toBeInTheDocument();

    fireEvent.click(editIcon);
    expect(onEdit).toHaveBeenCalledWith(mockDoc);
  });

  it("does not throw error if optional props are omitted", () => {
    expect(() =>
      renderWithTheme(<DocumentCard doc={mockDoc} onAccess={onAccess} />)
    ).not.toThrow();
  });

  it("displays N/A when createdAt is missing", () => {
    const docWithoutDate = { ...mockDoc, createdAt: undefined };
    renderWithTheme(<DocumentCard doc={docWithoutDate} onAccess={onAccess} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders without tags if tags array is empty", () => {
    const docWithoutTags = { ...mockDoc, tags: [] };
    renderWithTheme(<DocumentCard doc={docWithoutTags} onAccess={onAccess} />);
    expect(screen.queryByText("HR")).not.toBeInTheDocument();
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });
});
