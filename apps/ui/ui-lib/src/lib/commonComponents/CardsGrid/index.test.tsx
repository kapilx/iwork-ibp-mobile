import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CardGrid from "./index";

// Mock useNavigate ONCE at the top
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock dependencies
jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));
jest.mock("../Button", () => (props: any) => (
  <button onClick={props.onClick}>{props.label}</button>
));
jest.mock("../ContactCard", () => ({ contact }: any) => (
  <div data-testid="contact-card">{contact.name}</div>
));
jest.mock("../ContactCardPolicy", () => ({ contact }: any) => (
  <div data-testid="contact-card-policy">{contact.name}</div>
));
jest.mock("../ImageText", () => (props: any) => (
  <div>{props.sectionTitle}</div>
));
jest.mock("./styles", () => ({
  CardsGridContainer: (props: any) => <div {...props}>{props.children}</div>,
  TitleContainer: (props: any) => <div {...props}>{props.children}</div>,
  GridItem: (props: any) => <div {...props}>{props.children}</div>,
  NoDataText: (props: any) => <div {...props}>{props.children}</div>,
}));

const mockContacts = [
  { name: "John Doe", email: "john@example.com" },
  { name: "Jane Smith", email: "jane@example.com" },
];

describe("CardGrid Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props: any) =>
    render(
      <BrowserRouter>
        <CardGrid {...props} />
      </BrowserRouter>
    );

  it("renders contacts when provided", () => {
    renderComponent({ contacts: mockContacts, companyName: "TestCo" });
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getAllByTestId("contact-card")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /add contact/i })
    ).toBeInTheDocument();
  });

  it("renders policy contact cards when policyDetails is true", () => {
    renderComponent({
      contacts: mockContacts,
      companyName: "TestCo",
      policyDetails: true,
    });
    expect(screen.getAllByTestId("contact-card-policy")).toHaveLength(2);
  });

  it("hides Add Contact button when hideAddContact is true", () => {
    renderComponent({
      contacts: mockContacts,
      companyName: "TestCo",
      hideAddContact: true,
    });
    expect(
      screen.queryByRole("button", { name: /add contact/i })
    ).not.toBeInTheDocument();
  });

  it("renders displayName if provided", () => {
    renderComponent({
      contacts: mockContacts,
      companyName: "TestCo",
      displayName: "Custom Name",
    });
    expect(screen.getByText("Custom Name")).toBeInTheDocument();
  });

  it("calls navigate with correct url for contactVariant 'tpa'", () => {
    renderComponent({
      contacts: mockContacts,
      companyName: "TestCo",
      companyId: "123",
      contactVariant: "tpa",
    });
    const button = screen.getByRole("button", { name: /add contact/i });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith(
      "/tpa/contact/new",
      expect.anything()
    );
  });

  it("calls navigate with correct url for contactVariant 'insurer'", () => {
    renderComponent({
      contacts: mockContacts,
      companyName: "TestCo",
      companyId: "123",
      contactVariant: "insurer",
    });
    const button = screen.getByRole("button", { name: /add contact/i });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith(
      "/insurer/contact/new",
      expect.anything()
    );
  });

  it("renders with undefined optional props", () => {
    renderComponent({
      contacts: mockContacts,
      companyName: "TestCo",
      companyId: undefined,
      hideAddContact: undefined,
      policyDetails: undefined,
      displayName: undefined,
      contactVariant: undefined,
    });
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getAllByTestId("contact-card")).toHaveLength(2);
  });
});
