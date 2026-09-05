import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useParams } from "react-router-dom";
import { useApi, endPoints } from "@ui/ui-lib";
import CompanyDetails from ".";
import "@testing-library/jest-dom";

// ✅ Mock useNavigate globally
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: jest.fn(),
}));

// ✅ Mock useApi globally
jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  ...jest.requireActual("@ui/ui-lib"),
  useApi: jest.fn(),
}));

describe("CompanyDetails Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders 'No data available' when companyData is null", () => {
    (useParams as jest.Mock).mockReturnValue({ id: undefined });
    (useApi as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      doFetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <CompanyDetails />
      </MemoryRouter>
    );

    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  test("calls API when companyId is present", () => {
    const mockDoFetch = jest.fn();
    (useParams as jest.Mock).mockReturnValue({ id: "2" });

    (useApi as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      doFetch: mockDoFetch,
    });

    render(
      <MemoryRouter>
        <CompanyDetails />
      </MemoryRouter>
    );

    // ✅ Ensure API call is made with correct endpoint
    expect(mockDoFetch).toHaveBeenCalledTimes(1);
    expect(mockDoFetch).toHaveBeenCalledWith(endPoints.companyById(2));
  });

  test("renders company details when API data is available", async () => {
    const mockCompanyData = {
      name: "Tech Corp",
      industry: "Software",
      employees: 500,
      details: {
        founded: "2000",
        revenue: "50M",
      },
      companyAddresses: [
        {
          address: {
            street: "123 Tech Street",
            city: "San Francisco",
            state: "CA",
            country: { name: "USA" },
          },
        },
      ],
    };

    (useParams as jest.Mock).mockReturnValue({ id: "2" });

    (useApi as jest.Mock).mockReturnValue({
      data: { data: mockCompanyData },
      loading: false,
      doFetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <CompanyDetails />
      </MemoryRouter>
    );

    // ✅ Ensure company data is displayed correctly
    expect(screen.getByText("name:")).toBeInTheDocument();
    expect(screen.getByText("Tech Corp")).toBeInTheDocument();
    expect(screen.getByText("industry:")).toBeInTheDocument();
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("employees:")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();

    // ✅ Ensure nested details are displayed correctly
    expect(screen.getByText("founded:")).toBeInTheDocument();
    expect(screen.getByText("2000")).toBeInTheDocument();
    expect(screen.getByText("revenue:")).toBeInTheDocument();
    expect(screen.getByText("50M")).toBeInTheDocument();

    // ✅ Ensure addresses are displayed correctly
    expect(screen.getByText("Address 1:")).toBeInTheDocument();
    expect(screen.getByText("street:")).toBeInTheDocument();
    expect(screen.getByText("123 Tech Street")).toBeInTheDocument();
    expect(screen.getByText("city:")).toBeInTheDocument();
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
    expect(screen.getByText("state:")).toBeInTheDocument();
    expect(screen.getByText("CA")).toBeInTheDocument();
    expect(screen.getByText("country:")).toBeInTheDocument();
    expect(screen.getByText("USA")).toBeInTheDocument();
  });

  test("navigates to edit company page when edit button is clicked", () => {
    const mockCompanyData = {
      name: "Tech Corp",
      industry: "Software",
    };

    (useParams as jest.Mock).mockReturnValue({ id: "2" });

    (useApi as jest.Mock).mockReturnValue({
      data: { data: mockCompanyData },
      loading: false,
      doFetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <CompanyDetails />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Update Company/i));

    // ✅ Ensure navigation occurs correctly
    expect(mockNavigate).toHaveBeenCalledWith("/companies/2/edit");
  });

  test("does not call API when companyId is missing", () => {
    const mockDoFetch = jest.fn();

    (useParams as jest.Mock).mockReturnValue({ id: undefined });

    (useApi as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      doFetch: mockDoFetch,
    });

    render(
      <MemoryRouter>
        <CompanyDetails />
      </MemoryRouter>
    );

    // ✅ Ensure API is not called if there's no company ID
    expect(mockDoFetch).not.toHaveBeenCalled();
  });
});
