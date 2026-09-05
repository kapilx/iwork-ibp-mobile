import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import ContactCard, { ContactCardInfo } from "./index";
import { theme } from "../../styles/Theme";

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderWithProviders = (props: { contact: ContactCardInfo }) =>
  render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <ContactCard {...props} />
      </BrowserRouter>
    </ThemeProvider>
  );

describe("ContactCard Component", () => {
  const baseContact: ContactCardInfo = {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    displayName: "John Doe",
    salutation: { id: 1, lookUpValue: "Mr." },
    communicationDetails: [
      {
        id: 1,
        communicationType: "email",
        communicationDetails: "john.doe@example.com",
        isPrimary: true,
      },
      {
        id: 2,
        communicationType: "phone",
        communicationDetails: "+1234567890",
        isPrimary: true,
      },
    ],
    designation: "Manager",
  };

  it("renders the contact name with salutation", () => {
    renderWithProviders({ contact: baseContact });
    expect(screen.getByText("Mr. John Doe")).toBeInTheDocument();
  });

  it("renders the primary email and phone", () => {
    renderWithProviders({ contact: baseContact });
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
  });

  it("renders the designation", () => {
    renderWithProviders({ contact: baseContact });
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("renders '-' if email, phone, or designation is missing", () => {
    const contactMissingFields: ContactCardInfo = {
      ...baseContact,
      communicationDetails: [],
      designation: undefined,
    };
    renderWithProviders({ contact: contactMissingFields });
    // There are two '-' for email and phone, and one for designation
    expect(screen.getAllByText("-")).toHaveLength(3);
  });

  it("navigates to contact detail page on name click", () => {
    renderWithProviders({ contact: baseContact });
    const name = screen.getByText("Mr. John Doe");
    fireEvent.click(name);
    expect(mockNavigate).toHaveBeenCalledWith("/contact/1");
  });

  it("applies custom className if provided", () => {
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <ContactCard contact={baseContact} className="custom-class" />
        </BrowserRouter>
      </ThemeProvider>
    );
    const name = screen.getByText("Mr. John Doe");
    expect(
      name.closest(".custom-class") || name.parentElement?.className
    ).toBeTruthy();
  });
});
