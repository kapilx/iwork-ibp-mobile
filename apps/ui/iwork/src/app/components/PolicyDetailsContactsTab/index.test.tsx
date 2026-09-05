import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import PolicyDetailsContactsTab from "./index";
import { theme } from "@ui/ui-lib";

// Consolidated mock for @ui/ui-lib - preserve actual exports, only mock what's needed
jest.mock("@ui/ui-lib", () => {
  const actual = jest.requireActual("@ui/ui-lib");
  return {
    ...actual,
    useApiQuery: jest.fn(),
    caseConvertor: (str: string) => str,
  };
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ id: "123" }),
  useNavigate: () => jest.fn(),
}));

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

const mockUseApiQuery = require("@ui/ui-lib").useApiQuery;

const values = { companyName: "Test Company", companyId: 1 };

describe("PolicyDetailsContactsTab Component", () => {
  const renderWithTheme = (props = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <PolicyDetailsContactsTab {...values} {...props} />
      </ThemeProvider>
    );

  it("shows loading state", () => {
    mockUseApiQuery.mockReturnValue({ isLoading: true });
    renderWithTheme();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows no contacts found when all lists are empty", () => {
    mockUseApiQuery.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          contacts: {
            tpaContacts: { list: [] },
            insurerContacts: { list: [] },
            coInsurerContacts: { list: [] },
            companyContacts: { list: [] },
          },
        },
      },
    });
    renderWithTheme();
    expect(screen.getByText("No Contacts found!")).toBeInTheDocument();
  });

  it("renders TPA contacts when present", () => {
    mockUseApiQuery.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          contacts: {
            tpaContacts: {
              list: [{ name: "TPA Contact" }],
              displayName: "TPA",
            },
            insurerContacts: { list: [] },
            coInsurerContacts: { list: [] },
            companyContacts: { list: [] },
          },
        },
      },
    });
    renderWithTheme();
    expect(screen.getByText("TPA")).toBeInTheDocument();
  });

  it("renders Insurer contacts when present", () => {
    mockUseApiQuery.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          contacts: {
            tpaContacts: { list: [] },
            insurerContacts: {
              list: [{ name: "Insurer Contact" }],
              displayName: "Insurer",
            },
            coInsurerContacts: { list: [] },
            companyContacts: { list: [] },
          },
        },
      },
    });
    renderWithTheme();
    expect(screen.getByText("Insurer")).toBeInTheDocument();
  });

  it("renders Co-Insurer contacts when present", () => {
    mockUseApiQuery.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          contacts: {
            tpaContacts: { list: [] },
            insurerContacts: { list: [] },
            coInsurerContacts: {
              list: [{ name: "CoInsurer Contact" }],
              displayName: "CoInsurer",
            },
            companyContacts: { list: [] },
          },
        },
      },
    });
    renderWithTheme();
    expect(screen.getByText("CoInsurer")).toBeInTheDocument();
  });

  it("renders Company contacts when present", () => {
    mockUseApiQuery.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          contacts: {
            tpaContacts: { list: [] },
            insurerContacts: { list: [] },
            coInsurerContacts: { list: [] },
            companyContacts: {
              list: [{ name: "Company Contact" }],
              displayName: "Company",
            },
          },
        },
      },
    });
    renderWithTheme();
    expect(screen.getByText("Company")).toBeInTheDocument();
  });
});
