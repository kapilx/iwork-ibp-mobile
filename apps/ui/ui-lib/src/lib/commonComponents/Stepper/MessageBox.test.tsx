import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MessageBox } from "./MessageBox";

describe("MessageBox Component", () => {
  const mockOnClose = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the MessageBox component with the provided message", () => {
    render(<MessageBox message="Test Message" onClose={mockOnClose} />);

    // Check if the container is rendered
    expect(screen.getByTestId("message-box-container")).toBeInTheDocument();

    // Check if the message text is displayed
    expect(screen.getByTestId("message-text")).toHaveTextContent("Test Message");

    // Check if the background image is rendered
    expect(screen.getByAltText("Mail")).toBeInTheDocument();

    // Check if the info icon is rendered
    expect(screen.getByAltText("Info")).toBeInTheDocument();
  });

  it("renders the close button when onClose is provided", () => {
    render(<MessageBox message="Test Message" onClose={mockOnClose} />);

    // Check if the close button is rendered
    const closeButton = screen.findByRole("button", { name: /close message/i });
    expect(closeButton).toBeTruthy();
  });

  it("does not render the close button when onClose is not provided", () => {
    render(<MessageBox message="Test Message" />);

    // Check if the close button is not rendered
    expect(screen.queryByRole("button", { name: /close message/i })).not.toBeInTheDocument();
  });

  it("calls the onClose function when the close button is clicked", () => {
    render(<MessageBox message="Test Message" onClose={mockOnClose} />);

    // Click the close button
    const closeButton = screen.findByRole("button", { name: /close message/i });

    // Check if the onClose function is called
    expect(mockOnClose).toBeTruthy();
  });
});