import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileSection from "./index";
import "@testing-library/jest-dom";

// Mock child components
jest.mock("../CardBackground/styles", () => ({
  CardBackground: ({ children }: any) => (
    <div data-testid="card-background">{children}</div>
  ),
}));

jest.mock("../CommonDetailsSection", () => ({
  __esModule: true,
  default: ({ sections, data }: any) => (
    <div data-testid="company-profile">
      {sections?.length > 0 && data?.companyName}
    </div>
  ),
}));

jest.mock("../ThumbnailContainer", () => ({
  __esModule: true,
  default: ({ thumbnails, website, companyName }: any) => (
    <div data-testid="thumbnail-container">
      {thumbnails?.length} - {website} - {companyName}
    </div>
  ),
}));

describe("ProfileSection", () => {
  const mockProfile = [
    {
      thumbnails: ["thumb1.jpg", "thumb2.jpg"],
    },
  ];

  const mockCompanyData = {
    companyName: "Test Company",
    website: "https://test.com",
  };

  it("renders ProfileSection with all components", () => {
    render(
      <ProfileSection profile={mockProfile} companyData={mockCompanyData} />
    );

    expect(screen.getByTestId("company-profile")).toBeInTheDocument();
    expect(screen.getByTestId("thumbnail-container")).toBeInTheDocument();
    expect(screen.getByTestId("card-background")).toBeInTheDocument();
  });

  it("renders without website (no ThumbnailContainer)", () => {
    const companyDataWithoutWebsite = { ...mockCompanyData, website: null };
    render(
      <ProfileSection
        profile={mockProfile}
        companyData={companyDataWithoutWebsite}
      />
    );

    expect(screen.getByTestId("company-profile")).toBeInTheDocument();
    expect(screen.queryByTestId("thumbnail-container")).not.toBeInTheDocument();
  });

  it("handles missing thumbnails safely", () => {
    const mockProfileMissingThumb = [{}];
    render(
      <ProfileSection
        profile={mockProfileMissingThumb}
        companyData={mockCompanyData}
      />
    );

    expect(screen.getByTestId("company-profile")).toBeInTheDocument();
    expect(screen.getByTestId("thumbnail-container")).toBeInTheDocument();
  });

  it("handles null companyData gracefully", () => {
    render(<ProfileSection profile={mockProfile} companyData={{}} />);

    expect(screen.getByTestId("company-profile")).toBeInTheDocument();
    expect(screen.queryByTestId("thumbnail-container")).not.toBeInTheDocument();
  });
});
