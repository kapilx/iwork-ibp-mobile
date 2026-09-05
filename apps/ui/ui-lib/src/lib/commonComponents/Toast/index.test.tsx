import { render, screen } from "@testing-library/react";
import ToastMessage from "./index";
import "@testing-library/jest-dom";

jest.mock("@ui/ui-lib/environment", () => ({
  environment: {
    featureFlag: {},
    apiUrl: "http://localhost:3000",
    production: false,
  },
}));

describe("ToastMessage", () => {
  it("should render the Snackbar when open is true", () => {
    render(
      <ToastMessage
        open={true}
        vertical="top"
        horizontal="center"
        message="Test Message"
      />
    );

    const snackbar = screen.getByTestId("snackbar");
    expect(snackbar).toBeInTheDocument();
    expect(snackbar).toHaveTextContent("Test Message");
  });

  it("should call onClose with correct arguments when Alert is closed", () => {
    const onClose = jest.fn();
    render(
      <ToastMessage
        open={true}
        vertical="top"
        horizontal="center"
        message="Close Test"
        onClose={onClose}
      />
    );
    const alert = screen.getByRole("alert");
    // Simulate close event
    alert.querySelector("button")?.click();
    // The Alert's close button should trigger onClose with (event, "timeout")
    expect(onClose).toHaveBeenCalled();
    // Optionally check the second argument
    const callArgs = onClose.mock.calls[0];
    expect(callArgs[1]).toBe("timeout");
  });

  it("should not render the Snackbar when open is false", () => {
    render(
      <ToastMessage
        open={false}
        vertical="top"
        horizontal="center"
        message="Test Message"
      />
    );

    const snackbar = screen.queryByTestId("snackbar");
    expect(snackbar).not.toBeInTheDocument();
  });

  it("should open and display message when open is toggled to true", () => {
    const { rerender } = render(
      <ToastMessage
        open={false}
        vertical="top"
        horizontal="center"
        message="Test Message"
      />
    );

    let snackbar = screen.queryByTestId("snackbar");
    expect(snackbar).not.toBeInTheDocument();

    rerender(
      <ToastMessage
        open={true}
        vertical="top"
        horizontal="center"
        message="Test Message"
      />
    );

    snackbar = screen.getByTestId("snackbar");
    expect(snackbar).toBeInTheDocument();
    expect(snackbar).toHaveTextContent("Test Message");
  });

  it("should apply correct anchorOrigin based on vertical and horizontal props when open is true", () => {
    render(
      <ToastMessage
        open={true}
        vertical="bottom"
        horizontal="right"
        message="Test Message"
      />
    );

    const snackbar = screen.getByTestId("snackbar");

    const anchorOrigin = snackbar.closest('[role="presentation"]'); // MUI Snackbar's root div
    expect(anchorOrigin).toHaveClass("MuiSnackbar-anchorOriginBottomRight");
    expect(anchorOrigin).toHaveClass("MuiSnackbar-anchorOriginBottomRight");
  });

  it("should render correctly with default props and open is true", () => {
    render(
      <ToastMessage
        open={true}
        vertical="top"
        horizontal="right"
        message="Default Props Message"
      />
    );

    const snackbar = screen.getByTestId("snackbar");
    expect(snackbar).toHaveTextContent("Default Props Message");
    const anchorOrigin = snackbar.closest('[role="presentation"]');
    expect(anchorOrigin).toHaveClass("MuiSnackbar-anchorOriginTopRight");
    expect(anchorOrigin).toHaveClass("MuiSnackbar-anchorOriginTopRight");
  });
});
