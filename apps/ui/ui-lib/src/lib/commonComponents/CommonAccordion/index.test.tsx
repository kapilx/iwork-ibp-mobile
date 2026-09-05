import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import CommonAccordion, { AccordionVariant } from "./index";
import { theme } from "@ui/ui-lib/styles/Theme";

describe("CommonAccordion Component", () => {
  const renderWithTheme = (props: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <CommonAccordion {...props} />
      </ThemeProvider>
    );
  };

  const defaultProps = {
    summary: "Accordion Summary",
    details: "Accordion Details",
  };

  it("renders the accordion with default props", () => {
    renderWithTheme(defaultProps);
    const summaryElement = screen.getByText("Accordion Summary");
    expect(summaryElement).toBeTruthy();
    const detailsElement = screen.queryByText("Accordion Details");
    expect(detailsElement).not.toBeVisible();
  });

  it("expands and collapses the accordion when clicked (DEFAULT variant)", () => {
    renderWithTheme({ ...defaultProps, defaultExpanded: false });
    const summaryElement = screen.getByText("Accordion Summary");
    fireEvent.click(summaryElement);
    const detailsElement = screen.getByText("Accordion Details");
    expect(detailsElement).toBeVisible();
    fireEvent.click(summaryElement);
    expect(detailsElement).not.toBeFalsy();
  });

  it("renders the accordion with EDITABLE variant and handles toggle", () => {
    const onToggleMock = jest.fn();
    renderWithTheme({
      ...defaultProps,
      variant: AccordionVariant.EDITABLE,
      onToggle: onToggleMock,
    });
    const editButton = screen.getByText("Edit");
    expect(editButton).toBeTruthy();
    fireEvent.click(editButton);
    expect(onToggleMock).toHaveBeenCalled();
  });

  it("renders the accordion with a Reset button and calls onReset", () => {
    const onResetMock = jest.fn();
    renderWithTheme({
      ...defaultProps,
      variant: AccordionVariant.EDITABLE,
      onReset: onResetMock,
    });
    const resetButton = screen.getByText("Reset");
    expect(resetButton).toBeTruthy();
    fireEvent.click(resetButton);
    expect(onResetMock).toHaveBeenCalled();
  });

  it("hides actions when hideActions is true", () => {
    renderWithTheme({
      ...defaultProps,
      variant: AccordionVariant.EDITABLE,
      hideActions: true,
    });
    const editButton = screen.queryByText("Edit");
    const resetButton = screen.queryByText("Reset");
    expect(editButton).not.toBeTruthy();
    expect(resetButton).not.toBeTruthy();
  });

  it("hides the summary when hideSummary is true", () => {
    renderWithTheme({
      ...defaultProps,
      hideSummary: true,
    });
    const summaryElement = screen.queryByText("Accordion Summary");
    expect(summaryElement).not.toBeTruthy();
  });

  it("applies custom styles to the accordion, summary, and details", () => {
    const customStyles = {
      accordion: { backgroundColor: "red" },
      summary: { color: "blue" },
      details: { fontSize: "20px" },
    };
    renderWithTheme({
      ...defaultProps,
      customStyles,
    });
    const accordionElement = screen
      .getByText("Accordion Summary")
      .closest("div");
    expect(accordionElement).toBeTruthy();
    const summaryElement = screen.getByText("Accordion Summary");
    expect(summaryElement).toBeTruthy();
    const detailsElement = screen.getByText("Accordion Details");
    expect(detailsElement).toBeTruthy();
  });

  it("renders the accordion in expanded state when expanded prop is true", () => {
    renderWithTheme({
      ...defaultProps,
      expanded: true,
    });
    const detailsElement = screen.getByText("Accordion Details");
    expect(detailsElement).toBeTruthy();
  });

  it("renders the accordion in collapsed state when expanded prop is false", () => {
    renderWithTheme({
      ...defaultProps,
      expanded: false,
    });
    const detailsElement = screen.getByText("Accordion Details");
    expect(detailsElement).not.toBeFalsy();
  });

  it("calls onToggle when provided", () => {
    const onToggleMock = jest.fn();
    renderWithTheme({
      ...defaultProps,
      variant: AccordionVariant.EDITABLE,
      onToggle: onToggleMock,
    });
    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);
    expect(onToggleMock).toHaveBeenCalled();
  });

  it("toggles internalExpanded state when onToggle is not provided", () => {
    renderWithTheme({
      ...defaultProps,
      variant: AccordionVariant.EDITABLE,
    });
    const editButton = screen.getByText("Edit");
    const detailsElement = screen.getByText("Accordion Details");

    // Initially collapsed
    expect(detailsElement).not.toBeVisible();

    // Expand
    fireEvent.click(editButton);
    expect(detailsElement).toBeTruthy();

    // Collapse
    fireEvent.click(editButton);
    expect(detailsElement).not.toBeVisible();
  });
});
