import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import CustomModal, { ButtonInfo } from "./index";
import { theme } from "@ui/ui-lib/styles";

jest.mock("../Button", () => ({
  __esModule: true,
  default: ({ label, onClick, variantType, sizeType }: any) => (
    <button onClick={onClick} data-variant={variantType} data-size={sizeType}>
      {label}
    </button>
  ),
}));
jest.mock("../../assets/svgs/close-icon.svg", () => "close-icon.svg");

describe("CustomModal", () => {
  const defaultProps = {
    open: true,
    handleClose: jest.fn(),
    children: <div>Modal Content</div>,
    heading: "Test Modal",
    buttons: [] as ButtonInfo[],
  };

  const renderWithTheme = (props = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <CustomModal {...defaultProps} {...props} />
      </ThemeProvider>
    );

  it("renders modal with heading, children, and close icon", () => {
    renderWithTheme();
    expect(screen.getByTestId("modal-section-content")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
    expect(screen.getByAltText("close")).toBeInTheDocument();
  });

  it("calls handleClose when close icon is clicked", () => {
    renderWithTheme();
    fireEvent.click(screen.getByAltText("close"));
    expect(defaultProps.handleClose).toHaveBeenCalled();
  });

  it("renders all buttons and calls onClick", () => {
    const onClick1 = jest.fn();
    const onClick2 = jest.fn();
    const buttons = [
      { label: "OK", onClick: onClick1, variant: "primary" },
      { label: "Cancel", onClick: onClick2, variant: "secondary" },
    ];
    renderWithTheme({ buttons });
    const okButton = screen.getByRole("button", { name: /ok/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    expect(okButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(okButton);
    fireEvent.click(cancelButton);
    expect(onClick1).toHaveBeenCalled();
    expect(onClick2).toHaveBeenCalled();
  });

  it("does not render modal when open is false", () => {
    renderWithTheme({ open: false });
    expect(
      screen.queryByTestId("modal-section-content")
    ).not.toBeInTheDocument();
  });

  it("attaches modalBoxRef if provided", () => {
    const ref = { current: null } as any;
    renderWithTheme({ modalBoxRef: ref });
    expect(screen.getByTestId("modal-section-content")).toBeInTheDocument();
  });
});
