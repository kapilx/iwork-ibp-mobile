import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import AddressSection from "./index";
import { theme } from "@ui/ui-lib";

// Mock the AddressCard component
jest.mock("../AddressCard", () => {
  return function MockAddressCard({ data, ...props }: any) {
    return (
      <div data-testid="address-card" {...props}>
        <div data-testid="location">{data.location}</div>
        <div data-testid="address">{data.address}</div>
        <div data-testid="mobile">{data.mobile}</div>
        <div data-testid="landline">{data.landline}</div>
        <div data-testid="email">{data.email}</div>
      </div>
    );
  };
});

jest.mock("@ui/ui-lib", () => {
  const actual = jest.requireActual("@ui/ui-lib"); 
  return {
    ...actual,
    NOT_AVAILABLE: "N/A", 
  };
});

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));


describe("AddressSection Component", () => {
  const renderWithTheme = (props: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <AddressSection {...props} />
      </ThemeProvider>
    );
  };

  const mockCompanyAddresses = [
    {
      id: 1,
      isPrimary: true,
      address: {
        address1: "123 Main Street",
        address2: "Suite 100",
        area: "Downtown",
        pinCode: "12345",
        phoneNumber: "+1-555-123-4567",
        alternatePhoneNumber: "+1-555-987-6543",
        email: "info@company.com",
        cityId: { name: "New York" },
        stateId: { name: "NY" },
        addressType: { lookUpValue: "Head Office" },
      },
    },
    {
      id: 2,
      isPrimary: false,
      address1: "456 Oak Avenue",
      area: "Uptown",
      pinCode: "67890",
      phoneNumber: "+1-555-111-2222",
      email: "branch@company.com",
      cityId: { name: "Los Angeles" },
      stateId: { name: "CA" },
      addressType: { lookUpValue: "Branch Office" },
    },
  ];

  it("renders the address section container", () => {
    renderWithTheme({ companyAddresses: mockCompanyAddresses });
    const sectionContainer = screen.getByTestId("company-address-section");
    expect(sectionContainer).toBeInTheDocument();
  });

  it("renders address data from nested address object", () => {
    renderWithTheme({ companyAddresses: [mockCompanyAddresses[0]] });

    expect(screen.getByTestId("location")).toHaveTextContent(
      "New York, Head Office"
    );
    expect(screen.getByTestId("address")).toHaveTextContent(
      "123 Main Street, Suite 100, Downtown, New York, NY, 12345"
    );
    expect(screen.getByTestId("mobile")).toHaveTextContent("+1-555-123-4567");
    expect(screen.getByTestId("landline")).toHaveTextContent("+1-555-987-6543");
    expect(screen.getByTestId("email")).toHaveTextContent("info@company.com");
  });

  it("renders address data from direct properties", () => {
    renderWithTheme({ companyAddresses: [mockCompanyAddresses[1]] });

    expect(screen.getByTestId("location")).toHaveTextContent(
      "Los Angeles, Branch Office"
    );
    expect(screen.getByTestId("address")).toHaveTextContent(
      "456 Oak Avenue, Uptown, Los Angeles, CA, 67890"
    );
    expect(screen.getByTestId("mobile")).toHaveTextContent("+1-555-111-2222");
    expect(screen.getByTestId("landline")).toHaveTextContent("N/A");
    expect(screen.getByTestId("email")).toHaveTextContent("branch@company.com");
  });

  it("handles missing optional address fields", () => {
    const minimalAddress = {
      id: 3,
      isPrimary: false,
      address: {
        address1: "Basic Street",
        cityId: { name: "Miami" },
        addressType: { lookUpValue: "Office" },
      },
    };

    renderWithTheme({ companyAddresses: [minimalAddress] });

    expect(screen.getByTestId("location")).toHaveTextContent("Miami, Office");
    expect(screen.getByTestId("address")).toHaveTextContent(
      "Basic Street, Miami"
    );
    expect(screen.getByTestId("mobile")).toHaveTextContent("N/A");
    expect(screen.getByTestId("landline")).toHaveTextContent("N/A");
    expect(screen.getByTestId("email")).toHaveTextContent("N/A");
  });

  it("handles completely missing address data with fallbacks", () => {
    const emptyAddress = {
      id: 4,
      isPrimary: false,
      address: {},
    };

    renderWithTheme({ companyAddresses: [emptyAddress] });

    expect(screen.getByTestId("location")).toHaveTextContent("N/A, N/A");
    expect(screen.getByTestId("address")).toHaveTextContent("");
    expect(screen.getByTestId("mobile")).toHaveTextContent("N/A");
    expect(screen.getByTestId("landline")).toHaveTextContent("N/A");
    expect(screen.getByTestId("email")).toHaveTextContent("N/A");
  });

  it("constructs full address correctly with all fields", () => {
    const fullAddress = {
      id: 5,
      isPrimary: true,
      address: {
        address1: "123 First St",
        address2: "Apt 2B",
        area: "Central District",
        cityId: { name: "Chicago" },
        stateId: { name: "IL" },
        pinCode: "60601",
      },
    };

    renderWithTheme({ companyAddresses: [fullAddress] });

    expect(screen.getByTestId("address")).toHaveTextContent(
      "123 First St, Apt 2B, Central District, Chicago, IL, 60601"
    );
  });

  it("constructs full address correctly with partial fields", () => {
    const partialAddress = {
      id: 6,
      isPrimary: false,
      address: {
        address1: "789 Second Ave",
        cityId: { name: "Phoenix" },
        pinCode: "85001",
      },
    };

    renderWithTheme({ companyAddresses: [partialAddress] });

    expect(screen.getByTestId("address")).toHaveTextContent(
      "789 Second Ave, Phoenix, 85001"
    );
  });

  it("handles empty companyAddresses array", () => {
    renderWithTheme({ companyAddresses: [] });

    const sectionContainer = screen.getByTestId("company-address-section");
    expect(sectionContainer).toBeInTheDocument();
    expect(sectionContainer).toBeEmptyDOMElement();
  });

  it("handles missing cityId and addressType gracefully", () => {
    const addressWithMissingData = {
      id: 7,
      isPrimary: false,
      address: {
        address1: "Some Street",
        phoneNumber: "123-456-7890",
        email: "test@example.com",
      },
    };

    renderWithTheme({ companyAddresses: [addressWithMissingData] });

    expect(screen.getByTestId("location")).toHaveTextContent("N/A, N/A");
    expect(screen.getByTestId("mobile")).toHaveTextContent("123-456-7890");
    expect(screen.getByTestId("email")).toHaveTextContent("test@example.com");
  });

  it("handles special characters and long text in address fields", () => {
    const specialCharAddress = {
      id: 8,
      isPrimary: false,
      address: {
        address1: "123 Main St. & Co., Suite #100",
        address2: "Floor 2, Bldg A-1",
        area: "Tech Park (Phase-II)",
        cityId: { name: "São Paulo" },
        stateId: { name: "SP" },
        pinCode: "01234-567",
        phoneNumber: "+55 (11) 1234-5678",
        email: "contact+info@company.co.uk",
        addressType: { lookUpValue: "R&D Center" },
      },
    };

    renderWithTheme({ companyAddresses: [specialCharAddress] });

    expect(screen.getByTestId("location")).toHaveTextContent(
      "São Paulo, R&D Center"
    );
    expect(screen.getByTestId("address")).toHaveTextContent(
      "123 Main St. & Co., Suite #100, Floor 2, Bldg A-1, Tech Park (Phase-II), São Paulo, SP, 01234-567"
    );
    expect(screen.getByTestId("mobile")).toHaveTextContent(
      "+55 (11) 1234-5678"
    );
    expect(screen.getByTestId("email")).toHaveTextContent(
      "contact+info@company.co.uk"
    );
  });
});
