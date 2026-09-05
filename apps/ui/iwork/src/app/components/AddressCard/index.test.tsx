import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import AddressCard from "./index";

// Mock assets and styles
jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));
jest.mock("../../assets/svgs/location-icon.svg", () => "location-icon.svg");
jest.mock("../../assets/svgs/phone-icon.svg", () => "phone-icon.svg");
jest.mock("../../assets/svgs/mail-icon.svg", () => "mail-icon.svg");
jest.mock("../../assets/svgs/mobile-icon.svg", () => "mobile-icon.svg");
jest.mock("../../assets/pngs/map.png", () => "map.png");
jest.mock("./styles", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  Header: ({ children }: any) => <div data-testid="header">{children}</div>,
  AddressContent: ({ children }: any) => (
    <div data-testid="address-content">{children}</div>
  ),
  AddressContactDetails: ({ children }: any) => (
    <div data-testid="contact-details">{children}</div>
  ),
  InfoRow: ({ children }: any) => <div data-testid="info-row">{children}</div>,
  MapLink: ({ children, ...props }: any) => (
    <a data-testid="map-link" {...props}>
      {children}
    </a>
  ),
  MapImage: (props: any) => <img data-testid="map-image" {...props} />,
}));
// IMPORTANT: Do a partial mock so that styled, Box, Typography etc. remain intact
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  };
});
jest.mock("../../constants", () => ({
  GOOGLE_MAPS_LINK: "https://maps.google.com/?q=",
}));

const mockData = {
  location: "Test Location",
  address: "123 Main St, City",
  mobile: "1234567890",
  landline: "0987654321",
  email: "test@example.com",
};

describe("AddressCard", () => {
  it("renders all main fields", () => {
    render(<AddressCard data={mockData} />);
    expect(screen.getByTestId("header")).toHaveTextContent("Test Location");
    expect(screen.getByTestId("address-content")).toHaveTextContent(
      "123 Main St, City"
    );
    expect(screen.getByTestId("contact-details")).toBeInTheDocument();
    expect(screen.getAllByTestId("info-row")[0]).toHaveTextContent(
      "1234567890"
    );
    expect(screen.getAllByTestId("info-row")[1]).toHaveTextContent(
      "0987654321"
    );
    expect(screen.getAllByTestId("info-row")[2]).toHaveTextContent(
      "test@example.com"
    );
  });

  it("renders all icons and map image", () => {
    render(<AddressCard data={mockData} />);
    expect(screen.getByAltText("Location")).toHaveAttribute(
      "src",
      "location-icon.svg"
    );
    expect(screen.getByAltText("Mobile")).toHaveAttribute(
      "src",
      "phone-icon.svg"
    );
    expect(screen.getByAltText("Landline")).toHaveAttribute(
      "src",
      "mobile-icon.svg"
    );
    expect(screen.getByAltText("Email")).toHaveAttribute(
      "src",
      "mail-icon.svg"
    );
    expect(screen.getByAltText("Map")).toHaveAttribute("src", "map.png");
  });

  it("tooltip displays address", () => {
    render(<AddressCard data={mockData} />);
    expect(screen.getByTestId("tooltip")).toHaveTextContent(
      "123 Main St, City"
    );
  });

  it("map link has correct href and attributes", () => {
    render(<AddressCard data={mockData} />);
    const mapLink = screen.getByTestId("map-link");
    expect(mapLink).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent(mockData.address))
    );
    expect(mapLink).toHaveAttribute("target", "_blank");
    expect(mapLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("handles missing/empty data gracefully", () => {
    const emptyData = {
      location: "",
      address: "",
      mobile: "",
      landline: "",
      email: "",
    };
    render(<AddressCard data={emptyData} />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("address-content")).toBeInTheDocument();
    expect(screen.getByTestId("contact-details")).toBeInTheDocument();
  });
});
