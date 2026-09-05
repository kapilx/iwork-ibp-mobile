import "@testing-library/jest-dom";

import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";
import { useLocation, useNavigate } from "react-router-dom";
import CreateCompany, { EntryType } from "./";
// Common constants
import {
  useApiQuery,
  useDebounce,
  theme,
  AccordionTitles,
} from "@ui/ui-lib";

// Mock environment to avoid import.meta.env
jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  ...jest.requireActual("@ui/ui-lib"),
  environment: { apiBaseUrl: "http://localhost" },
  useDebounce: jest.fn(),
  useApiQuery: jest.fn(),
  TreeNodeContainer: ({ data, onSelectNode }) => (
    <div>
      {data.map((node) => (
        <button
          key={node.id}
          data-testid={`tree-node-${node.label}`}
          onClick={() => onSelectNode(node)}
        >
          {node.label}
        </button>
      ))}
    </div>
  ),
  endPoints: {
    companyHierarchy: "/company/company-hierarchy?page=1&limit=1000",
  },
}));

// Mock MUI theme

// Setup mocks
jest.mock("react-router-dom", () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

// Helper to wrap component
const renderWithProviders = (
  locationState = {},
  entry: EntryType = "company"
) => {
  const mockLocation = { state: { ...locationState, pageTitle: entry } };
  (useLocation as jest.Mock).mockReturnValue(mockLocation);
  const mockNavigate = jest.fn();
  (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

  return {
    navigate: mockNavigate,
    ...render(
      <ThemeProvider theme={theme}>
        <CreateCompany />
      </ThemeProvider>
    ),
  };
};

describe("CreateCompany Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default API returns empty list to avoid undefined
    (useApiQuery as jest.Mock).mockReturnValue({
      data: { data: { data: [] } },
    });
    // Debounce returns value immediately
    (useDebounce as jest.Mock).mockImplementation((value) => value);
  });

  test("renders default titles for company entry", () => {
    renderWithProviders();
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      /create a company/i
    );
  });

  test("renders contact titles based on entry", () => {
    renderWithProviders({}, "contact");
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      /Let us help you create a contact/i
    );
  });

  test("shows no-data image and message when searchTerm yields no results", async () => {
    (useApiQuery as jest.Mock).mockReturnValue({
      data: { data: { data: [] } },
    });
    renderWithProviders();

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByAltText("no data")).toBeInTheDocument();
  });

  test("renders tree nodes and handles selection", async () => {
    const companies = [
      { id: "1", companyName: "Alpha", childCompanies: [] },
      { id: "2", companyName: "Beta", childCompanies: [] },
    ];
    (useApiQuery as jest.Mock).mockReturnValue({
      data: { data: { data: companies } },
    });

    const { navigate } = renderWithProviders();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Alpha" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const nodeBtn = await screen.findByTestId("tree-node-Alpha");
    expect(nodeBtn).toBeInTheDocument();

    fireEvent.click(nodeBtn);
    expect(navigate).toHaveBeenCalledWith(
      "/create2",
      expect.objectContaining({
        state: expect.objectContaining({
          [AccordionTitles.COMPANY_SELECTION]: { id: "1", label: "Alpha" },
        }),
      })
    );
  });

  test("create button is disabled when name matches existing company", async () => {
    const companies = [{ id: "1", companyName: "MatchMe", childCompanies: [] }];
    (useApiQuery as jest.Mock).mockReturnValue({
      data: { data: { data: companies } },
    });

    renderWithProviders();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "MatchMe" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
  });

  test("create button enabled and navigates to creation", async () => {
    const companies = [{ id: "1", companyName: "Other", childCompanies: [] }];
    (useApiQuery as jest.Mock).mockReturnValue({
      data: { data: { data: companies } },
    });

    const { navigate } = renderWithProviders();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "UniqueName" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const createBtn = await screen.findByRole("button", { name: /create/i });
    expect(createBtn).toBeEnabled();
    fireEvent.click(createBtn);
    expect(navigate).toHaveBeenCalledWith("/companies/new", expect.any(Object));
  });

  test("cancel button navigates to origin or root", () => {
    const origin = "/dashboard";
    const { navigate } = renderWithProviders({ originPath: origin });
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(navigate).toHaveBeenCalledWith(origin);
  });

  test("renders file upload sections", () => {
    (useApiQuery as jest.Mock).mockReturnValue({
      data: { data: { data: [] } },
    });
    renderWithProviders();
    expect(
      screen.getAllByText(/Click to upload/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("textbox").length).toBeGreaterThanOrEqual(1);
  });
});
