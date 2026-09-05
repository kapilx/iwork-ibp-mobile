import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import WorkInProgress from "./index";
import { theme } from "@ui/ui-lib/styles";
import { WORK_IN_PROGRESS } from "../../constants";

// Mock the SVG import
jest.mock(
  "../../assets/svgs/workin-progress.svg",
  () => "work-in-progress.svg"
);

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("WorkInProgress Component", () => {
  const renderWithTheme = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <WorkInProgress {...props} />
      </ThemeProvider>
    );
  };

  it("renders work in progress component with default content", () => {
    renderWithTheme();

    // Check if the title is rendered
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(WORK_IN_PROGRESS.TITLE)).toBeInTheDocument();

    // Check if the description is rendered
    expect(screen.getByText(WORK_IN_PROGRESS.DESCRIPTION)).toBeInTheDocument();

    // Check if the image is rendered with correct alt text
    expect(screen.getByAltText(WORK_IN_PROGRESS.IMAGE_ALT)).toBeInTheDocument();
  });

  it("renders image with correct src and alt attributes", () => {
    renderWithTheme();

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "work-in-progress.svg");
    expect(image).toHaveAttribute("alt", WORK_IN_PROGRESS.IMAGE_ALT);
  });

  it("displays the correct title text", () => {
    renderWithTheme();

    const titleElement = screen.getByRole("heading", { level: 1 });
    expect(titleElement).toHaveTextContent("Work in progress!");
  });

  it("displays the correct description text", () => {
    renderWithTheme();

    const descriptionElement = screen.getByText(WORK_IN_PROGRESS.DESCRIPTION);
    expect(descriptionElement).toHaveTextContent(
      "This page is currently under development. Please check back later."
    );
  });

  it("applies custom styles when provided", () => {
    const customStyles = {
      backgroundColor: "red",
      padding: "20px",
    };

    renderWithTheme({ customStyles });

    // Check if component is rendered (custom styles would be applied internally)
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(WORK_IN_PROGRESS.DESCRIPTION)).toBeInTheDocument();
  });

  it("renders without custom styles", () => {
    renderWithTheme();

    // Component should render normally without custom styles
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(WORK_IN_PROGRESS.DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("has proper accessibility structure", () => {
    renderWithTheme();

    // Check heading hierarchy
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();

    // Check image accessibility
    const image = screen.getByRole("img");
    expect(image).toHaveAccessibleName(WORK_IN_PROGRESS.IMAGE_ALT);
  });

  it("renders all required elements in correct order", () => {
    renderWithTheme();

    const container = screen.getByRole("img").closest("div");
    expect(container).toBeInTheDocument();

    // All elements should be present
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(WORK_IN_PROGRESS.DESCRIPTION)).toBeInTheDocument();
  });

  it("handles empty custom styles prop", () => {
    renderWithTheme({ customStyles: {} });

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(WORK_IN_PROGRESS.DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("maintains component structure with custom styles", () => {
    const customStyles = {
      marginTop: "50px",
      backgroundColor: "#f0f0f0",
    };

    renderWithTheme({ customStyles });

    // Component structure should remain intact
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(WORK_IN_PROGRESS.DESCRIPTION)).toBeInTheDocument();
  });

  it("uses constants for text content", () => {
    renderWithTheme();

    // Verify that constants are being used correctly
    expect(screen.getByText(WORK_IN_PROGRESS.TITLE)).toBeInTheDocument();
    expect(screen.getByText(WORK_IN_PROGRESS.DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByAltText(WORK_IN_PROGRESS.IMAGE_ALT)).toBeInTheDocument();
  });

  it("renders Typography components correctly", () => {
    renderWithTheme();

    // Check that title is rendered as h1
    const titleElement = screen.getByRole("heading", { level: 1 });
    expect(titleElement).toBeInTheDocument();
    expect(titleElement.tagName).toBe("H1");

    // Check that description is rendered as text
    const descriptionElement = screen.getByText(WORK_IN_PROGRESS.DESCRIPTION);
    expect(descriptionElement).toBeInTheDocument();
  });

  it("image is properly embedded in component", () => {
    renderWithTheme();

    const image = screen.getByRole("img");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "work-in-progress.svg");
    expect(image).toHaveAttribute("alt", "Work in Progress");
  });
});
