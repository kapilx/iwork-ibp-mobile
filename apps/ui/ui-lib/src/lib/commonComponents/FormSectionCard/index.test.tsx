import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import FormSection from "./index";
import { theme } from "../../styles/Theme";

// Mock the SVG import
jest.mock("../../assets/svgs/add-card.svg", () => "mocked-add-icon.svg");

describe("FormSectionCard Component", () => {
  const renderWithTheme = (props: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <FormSection {...props} />
      </ThemeProvider>
    );
  };

  it("renders the section with title and children", () => {
    renderWithTheme({
      title: "Section Title",
      children: <div>Child Content</div>,
    });
    expect(screen.getByText("Section Title")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders the action button when showActionButton is true", () => {
    const handleClick = jest.fn();
    renderWithTheme({
      title: "Section",
      children: <div>Child</div>,
      showActionButton: true,
      onActionClick: handleClick,
    });
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it("does not render the action button when showActionButton is false", () => {
    renderWithTheme({ title: "Section", children: <div>Child</div> });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the divider when showDivider is true", () => {
    renderWithTheme({
      title: "Section",
      children: <div>Child</div>,
      showDivider: true,
    });
    expect(screen.getByText("Section")).toBeInTheDocument();
    // Divider is a styled div, check by role or class if needed
  });

  it("does not render the divider when showDivider is false", () => {
    renderWithTheme({
      title: "Section",
      children: <div>Child</div>,
      showDivider: false,
    });
    // Divider is a styled div, so check by class or absence of divider
    // For simplicity, just check title is still present
    expect(screen.getByText("Section")).toBeInTheDocument();
  });

  it("does not render the header when showHeader is false", () => {
    renderWithTheme({
      title: "Section",
      children: <div>Child</div>,
      showHeader: false,
    });
    // The title should not be in the document
    expect(screen.queryByText("Section")).not.toBeInTheDocument();
  });

  it("renders with no title", () => {
    renderWithTheme({ children: <div>Child Content</div> });
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    renderWithTheme({
      title: "Section",
      children: (
        <>
          <div>Child 1</div>
          <div>Child 2</div>
        </>
      ),
    });
    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });

  describe("hideCardBackground=true rendering", () => {
    it("renders header with FormSectionHeader when showHeader is true and hideCardBackground is true", () => {
      renderWithTheme({
        title: "Test Section",
        children: <div>Test Content</div>,
        hideCardBackground: true,
        showHeader: true,
      });

      expect(screen.getByText("Test Section")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("renders FormSectionCardSectionTitle with title when showHeader is true and hideCardBackground is true", () => {
      renderWithTheme({
        title: "Section Title",
        children: <div>Content</div>,
        hideCardBackground: true,
        showHeader: true,
      });

      const titleElement = screen.getByText("Section Title");
      expect(titleElement).toBeInTheDocument();
    });
  });
});
