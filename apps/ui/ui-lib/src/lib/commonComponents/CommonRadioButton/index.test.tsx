import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RadioButton from "./index";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../../styles/Theme";
import "@testing-library/jest-dom";

const renderWithTheme = (props: any) => {
  return render(
    <ThemeProvider theme={theme}>
      <RadioButton {...props} />
    </ThemeProvider>
  );
};

describe("CommonRadioButton Component", () => {
  it("renders the radio button with label", () => {
    renderWithTheme({ label: "Option 1", value: "1" });
    expect(screen.getByLabelText("Option 1")).toBeInTheDocument();
  });

  it("applies custom styles to container, label, and radio", () => {
    renderWithTheme({
      label: "Styled Option",
      value: "2",
      customStyles: {
        container: { background: "red" },
        label: { color: "blue" },
        radio: { border: "1px solid green" },
      },
    });
    expect(screen.getByLabelText("Styled Option")).toBeInTheDocument();
  });

  it("renders as checked when checked prop is true", () => {
    renderWithTheme({ label: "Checked", value: "3", checked: true });
    const radio = screen.getByLabelText("Checked");
    expect(radio).toBeChecked();
  });

  it("calls onChange when clicked", async () => {
    const onChange = jest.fn();
    renderWithTheme({ label: "Clickable", value: "4", onChange });
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Clickable"));
    expect(onChange).toHaveBeenCalled();
  });

  it("renders error and helper text when error is present", () => {
    renderWithTheme({
      label: "With Error",
      value: "5",
      error: "Error!",
      helperText: "This is required",
    });
    expect(screen.getByTestId("form-helper-text")).toBeInTheDocument();
    expect(screen.getByText("This is required")).toBeInTheDocument();
  });

  it("renders error text if helperText is not provided", () => {
    renderWithTheme({ label: "With Error Only", value: "6", error: "Error!" });
    expect(screen.getByTestId("form-helper-text")).toBeInTheDocument();
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  it("renders with numeric value", () => {
    renderWithTheme({ label: "Numeric", value: 123 });
    expect(screen.getByLabelText("Numeric")).toBeInTheDocument();
  });
});

describe("CommonRadioButton - Theme Styles Application", () => {
  it("applies correct styles when radio is checked", () => {
    const { container } = renderWithTheme({
      label: "Styled",
      value: "1",
      checked: true,
    });
    const radio = screen.getByLabelText("Styled");
    expect(radio).toBeChecked();

    const svgIcon = (container as any).querySelector(".MuiSvgIcon-root");
    expect(svgIcon).toHaveStyle(
      `border-radius: ${theme.shape.borderRadii.circle}`
    );
  });

  it("has the MuiSvgIcon-root class for the icon", () => {
    const { container } = renderWithTheme({ label: "Hoverable", value: "2" });
    const svgIcon = container.querySelector(".MuiSvgIcon-root");
    expect(svgIcon).toBeInTheDocument();
  });

  it("uses theme.palette.secondary.selected color for checked radio", () => {
    const { container } = renderWithTheme({
      label: "Selected Color",
      value: "3",
      checked: true,
    });
    const radio = screen.getByLabelText("Selected Color");

    expect(radio).toBeChecked();

    const styledRadio = (container as any).querySelector(
      ".MuiRadio-root.Mui-checked"
    );
    expect(styledRadio).toHaveStyle(
      `color: ${theme.palette.secondary.selected}`
    );
  });
});

describe("Theme Style Unit Tests (spacing and transitions)", () => {
  it("theme.spacing utility returns correct values", () => {
    expect(theme.spacing(1)).toBe("4px");
    expect(theme.spacing(2)).toBe("8px");
    expect(theme.spacing(3)).toBe("12px");
  });

  it("verifies transitions object functions", () => {
    expect(theme.transitions.duration.shortest).toBeDefined();
    expect(theme.transitions.duration.standard).toBeDefined();
    expect(theme.transitions.easing.easeInOut).toBe(
      "cubic-bezier(0.4, 0, 0.2, 1)"
    );
  });

  it("creates a simple transition string", () => {
    const transition = theme.transitions.create("opacity");
    expect(transition).toContain("opacity");
  });

  it("creates transition with custom options", () => {
    const transition = theme.transitions.create(["opacity", "transform"], {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.easeOut,
      delay: 150,
    });
    expect(transition).toContain("opacity");
    expect(transition).toContain("transform");
    expect(transition).toContain("225ms");
    expect(transition).toContain("150ms");
  });

  it("returns auto height duration for various heights", () => {
    const duration1 = theme.transitions.getAutoHeightDuration(0);
    const duration2 = theme.transitions.getAutoHeightDuration(24);
    const duration3 = theme.transitions.getAutoHeightDuration(1000);

    expect(typeof duration1).toBe("number");
    expect(duration2).toBeGreaterThan(0);
    expect(duration3).toBeGreaterThan(duration2);
  });
});
