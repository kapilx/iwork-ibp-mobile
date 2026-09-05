import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import ContactCardPolicy, { PolicyContactInfo } from "./index";
import { theme } from "../../styles/Theme";
import { MemoryRouter } from "react-router";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("ContactCardPolicy Component", () => {
  const baseContact: PolicyContactInfo = {
    id: 1,
    displayName: "Jane Doe",
    communicationDetails: [
      {
        id: 1,
        communicationType: "phone",
        communicationDetails: "+1234567890",
        isPrimary: true,
      },
      {
        id: 2,
        communicationType: "map",
        communicationDetails: "123 Main St, City",
        isPrimary: true,
      },
    ],
    location: "New York",
  };

  const renderWithTheme = (props: {
    contact: PolicyContactInfo;
    typeOfContact?: "insurer" | "tpa" | "company";
  }) =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ContactCardPolicy {...props} />
        </MemoryRouter>
      </ThemeProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the contact display name", () => {
    renderWithTheme({ contact: baseContact });
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the primary phone", () => {
    renderWithTheme({ contact: baseContact });
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
  });

  it("renders the address", () => {
    renderWithTheme({ contact: baseContact });
    expect(screen.getByText("123 Main St, City")).toBeInTheDocument();
  });

  it("renders the location in the footer", () => {
    renderWithTheme({ contact: baseContact });
    expect(screen.getByText("New York")).toBeInTheDocument();
  });

  it("renders '-' if phone, address, or location is missing", () => {
    const missingFields: PolicyContactInfo = {
      id: 2,
      displayName: "No Info",
      communicationDetails: [],
      location: undefined,
    };
    renderWithTheme({ contact: missingFields });
    // There are two '-' for phone and address, and one for location
    expect(screen.getAllByText("-")).toHaveLength(3);
  });

  it("renders multiple communication types if present", () => {
    const contact: PolicyContactInfo = {
      ...baseContact,
      communicationDetails: [
        {
          id: 1,
          communicationType: "phone",
          communicationDetails: "+1234567890",
          isPrimary: true,
        },
        {
          id: 2,
          communicationType: "email",
          communicationDetails: "jane@example.com",
          isPrimary: false,
        },
        {
          id: 3,
          communicationType: "map",
          communicationDetails: "123 Main St, City",
          isPrimary: true,
        },
      ],
    };
    renderWithTheme({ contact });
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
    expect(screen.getByText("123 Main St, City")).toBeInTheDocument();
  });

  it("renders only primary communication details if multiple marked primary", () => {
    const contact: PolicyContactInfo = {
      ...baseContact,
      communicationDetails: [
        {
          id: 1,
          communicationType: "phone",
          communicationDetails: "+1111111111",
          isPrimary: true,
        },
        {
          id: 2,
          communicationType: "phone",
          communicationDetails: "+2222222222",
          isPrimary: true,
        },
      ],
    };
    renderWithTheme({ contact });
    expect(screen.getByText("+1111111111")).toBeInTheDocument();
  });

  // Navigation onClick Tests
  describe("Navigation onClick functionality", () => {
    it("navigates to company contact route when typeOfContact is 'company'", () => {
      renderWithTheme({ contact: baseContact, typeOfContact: "company" });

      const contactName = screen.getByText("Jane Doe");
      fireEvent.click(contactName);

      expect(mockNavigate).toHaveBeenCalledWith("/contact/1");
    });

    it("navigates to insurer contact route when typeOfContact is 'insurer'", () => {
      renderWithTheme({ contact: baseContact, typeOfContact: "insurer" });

      const contactName = screen.getByText("Jane Doe");
      fireEvent.click(contactName);

      expect(mockNavigate).toHaveBeenCalledWith("/insurer/contact/1");
    });

    it("navigates to tpa contact route when typeOfContact is 'tpa'", () => {
      renderWithTheme({ contact: baseContact, typeOfContact: "tpa" });

      const contactName = screen.getByText("Jane Doe");
      fireEvent.click(contactName);

      expect(mockNavigate).toHaveBeenCalledWith("/tpa/contact/1");
    });

    it("navigates to company contact route when typeOfContact is not specified (defaults to 'company')", () => {
      renderWithTheme({ contact: baseContact });

      const contactName = screen.getByText("Jane Doe");
      fireEvent.click(contactName);

      expect(mockNavigate).toHaveBeenCalledWith("/contact/1");
    });

    it("does not navigate when contact.id is undefined", () => {
      const contactWithoutId: PolicyContactInfo = {
        ...baseContact,
        id: undefined as any, // Force undefined for testing
      };

      renderWithTheme({ contact: contactWithoutId, typeOfContact: "company" });

      const contactName = screen.getByText("Jane Doe");
      fireEvent.click(contactName);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("does not navigate when contact.id is null", () => {
      const contactWithNullId: PolicyContactInfo = {
        ...baseContact,
        id: null as any, // Force null for testing
      };

      renderWithTheme({ contact: contactWithNullId, typeOfContact: "company" });

      const contactName = screen.getByText("Jane Doe");
      fireEvent.click(contactName);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("contact name is clickable and has proper title attribute", () => {
      renderWithTheme({ contact: baseContact });

      const contactName = screen.getByText("Jane Doe");
      expect(contactName).toHaveAttribute("title", "Jane Doe");
      expect(contactName).toBeInTheDocument();
    });
  });
});
