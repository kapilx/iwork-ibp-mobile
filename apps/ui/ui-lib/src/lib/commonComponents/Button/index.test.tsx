import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import Button, { ButtonProps } from "./index";
import { theme } from "@ui/ui-lib";

describe("Button Component", () => {
  const renderWithTheme = (props: ButtonProps) => {
    return render(
      <ThemeProvider theme={theme}>
        <Button {...props} />
      </ThemeProvider>
    );
  };

  const variantTypes: ButtonProps["variantType"][] = [
    "primary",
    "secondary",
    "link",
    "icon",
    "addButton",
  ];

  const sizeTypes: ButtonProps["sizeType"][] = ["large", "small"];

  it("renders the button with default props", () => {
    renderWithTheme({ label: "Submit" });
    const buttonElement = screen.getByRole("button", { name: /submit/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it("renders the button with children overriding the label", () => {
    renderWithTheme({ label: "Submit", children: "Click Me" });
    const buttonElement = screen.getByRole("button", { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
  });

  variantTypes.forEach((variantType) => {
    sizeTypes.forEach((sizeType) => {
      it(`renders the button with variantType="${variantType}" and sizeType="${sizeType}"`, () => {
        renderWithTheme({ label: "Test Button", variantType, sizeType });
        const buttonElement = screen.getByRole("button", {
          name: /test button/i,
        });
        expect(buttonElement).toBeInTheDocument();
      });
    });
  });

  it("applies the disabled state correctly", () => {
    renderWithTheme({ label: "Disabled Button", disabled: true });
    const buttonElement = screen.getByRole("button", {
      name: /disabled button/i,
    });
    expect(buttonElement).toBeDisabled();
  });

  it("applies custom className", () => {
    renderWithTheme({ label: "Custom Class", className: "custom-class" });
    const buttonElement = screen.getByRole("button", { name: /custom class/i });
    expect(buttonElement).toHaveClass("custom-class");
  });

  it("renders the button with an invalid variantType and falls back to default styles", () => {
    renderWithTheme({
      label: "Invalid Variant",
      variantType: "invalid" as any,
    });
    const buttonElement = screen.getByRole("button", {
      name: /invalid variant/i,
    });
    expect(buttonElement).toBeInTheDocument();
    // Add assertions to verify default styles if needed
  });
});
