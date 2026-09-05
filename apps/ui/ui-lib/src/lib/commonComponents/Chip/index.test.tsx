import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import ChipRenderer, { ChipRendererProps } from "./";
import { theme } from "@ui/ui-lib/styles/Theme";

describe("ChipRenderer Component", () => {
  const renderWithTheme = (props: ChipRendererProps) => {
    return render(
      <ThemeProvider theme={theme}>
        <ChipRenderer {...props} />
      </ThemeProvider>
    );
  };

  it("renders the chip with normal variant", () => {
    renderWithTheme({ value: "Test Value" });
    const chipElement = screen.getByText("Test Value");
    expect(chipElement).toBeInTheDocument();
  });

  it("renders the chip with the 'withDot' variant", () => {
    renderWithTheme({
      value: "Test Value",
      variant: "withDot",
      styleMap: {
        test: { dotColor: "red" },
      },
    });
    const dotElement = screen.findByRole("presentation");
    expect(dotElement).toBeTruthy();
    const chipElement = screen.getByText("Test Value");
    expect(chipElement).toBeInTheDocument();
  });

  it("renders the chip with the 'withImage' variant", () => {
    renderWithTheme({
      value: "Test Value",
      variant: "withImage",
      styleMap: {
        test: { imageSrc: "test-image.png" },
      },
    });
    const imageElement = screen.getByRole("img");
    expect(imageElement).toHaveAttribute("src", "test-image.png");
    const chipElement = screen.getByText("Test Value");
    expect(chipElement).toBeInTheDocument();
  });

  it("renders the chip with a label prefix", () => {
    renderWithTheme({
      value: "Test Value",
      labelPrefix: "Prefix:",
    });
    const prefixElement = screen.findByText("Prefix:");
    expect(prefixElement).toBeTruthy();
    const chipElement = screen.getByText("Test Value");
    expect(chipElement).toBeInTheDocument();
  });

  it("renders the chip with a custom label class", () => {
    renderWithTheme({
      value: "Test Value",
      labelClass: "custom-class",
    });
    const chipElement = screen.getByText("Test Value");
    expect(chipElement).toBeTruthy();
  });

  it("renders the chip with default styles when no styleMap is provided", () => {
    renderWithTheme({ value: "Test Value" });
    const chipElement = screen.getByText("Test Value");
    expect(chipElement).toBeTruthy();
  });

  it("renders '--' when value is not provided", () => {
    renderWithTheme({ value: "" });
    const placeholderElement = screen.getByText("--");
    expect(placeholderElement).toBeInTheDocument();
  });

  it("renders the chip with a custom size", () => {
    renderWithTheme({
      value: "Test Value",
      size: "medium",
    });
    const chipElement = screen.getByText("Test Value");
    expect(chipElement).toBeInTheDocument();
  });

  it("renders the chip with a custom image source", () => {
    renderWithTheme({
      value: "Test Value",
      variant: "withImage",
      imageSrc: "custom-image.png",
    });
    const imageElement = screen.getByRole("img");
    expect(imageElement).toHaveAttribute("src", "custom-image.png");
  });
});
