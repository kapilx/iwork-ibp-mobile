import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Drawer from "./index.js";

describe("CommonDrawer", () => {
  const setup = (props = {}) => {
    const defaultProps = {
      open: true,
      onClose: jest.fn(),
      title: "Test Drawer",
      anchor: "right" as "right" | "left" | "top" | "bottom",
      children: <div data-testid="drawer-content">Drawer Content</div>,
      ...props,
    };

    render(<Drawer {...defaultProps} />);
    return defaultProps;
  };

  test("renders drawer with title and children", () => {
    setup();

    expect(screen.getByText("Test Drawer")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-content")).toBeInTheDocument();
  });

  test("calls onClose when close button is clicked", () => {
    const { onClose } = setup();

    const closeButton = screen.getByLabelText("close");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("does not render when open is false", () => {
    setup({ open: false });

    expect(screen.queryByText("Test Drawer")).not.toBeInTheDocument();
  });
});
