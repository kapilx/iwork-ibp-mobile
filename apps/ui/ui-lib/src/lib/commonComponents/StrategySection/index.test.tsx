import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
// Mock CommonDetailsSection to avoid dependency on its internal logic
jest.mock("../CommonDetailsSection", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="company-profile">Mocked CommonDetailsSection</div>
  ),
}));

import StrategySection from ".";
import { theme } from "@ui/ui-lib/styles";

const renderWithTheme = (props: any) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <StrategySection {...props} />
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe("StrategySection Component", () => {
  const mockProfile = [
    {
      thumbnails: [
        { url: "https://example.com/image1.jpg" },
        { url: "https://example.com/image2.jpg" },
      ],
    },
  ];
  const mockData = {
    website: "https://company.com",
    companyName: "Test Company",
  };

  it("renders CommonDetailsSection with correct props", () => {
    renderWithTheme({ profile: mockProfile, data: mockData });
    const detailsSection = screen.getByTestId("company-profile");
    expect(detailsSection).toBeInTheDocument();
  });

  it("renders ThumbnailContainer with thumbnails and website", () => {
    renderWithTheme({ profile: mockProfile, data: mockData });
    // Check for at least one thumbnail image
    const img = screen.getAllByRole("img");
    expect(img.length).toBeGreaterThan(0);
    // Check for the website link
    const link = screen.getByRole("link", { name: /thumbnail/i });
    expect(link).toHaveAttribute("href", mockData.website);
  });

  it("handles missing thumbnails gracefully", () => {
    renderWithTheme({ profile: [{}], data: mockData });
    // Should not throw, and CommonDetailsSection should still render
    expect(screen.getByTestId("company-profile")).toBeInTheDocument();
  });

  it("handles missing website and companyName gracefully", () => {
    renderWithTheme({ profile: mockProfile, data: {} });
    expect(screen.getByTestId("company-profile")).toBeInTheDocument();
  });
});
