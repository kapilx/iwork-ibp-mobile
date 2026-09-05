import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@mui/material/styles";
import MessageOverlay, { MessageOverlayProps } from "./index";
import { theme } from "@ui/ui-lib/styles/Theme";

describe("MessageOverlay", () => {
  const renderWithTheme = (props: MessageOverlayProps) =>
    render(
      <ThemeProvider theme={theme}>
        <MessageOverlay {...props}>Content</MessageOverlay>
      </ThemeProvider>
    );

  it("renders content when open", () => {
    const anchor = document.createElement("div");
    renderWithTheme({ open: true, anchorEl: anchor, onClose: jest.fn() });
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onClose", () => {
    const onClose = jest.fn();
    const anchor = document.createElement("div");
    renderWithTheme({ open: true, anchorEl: anchor, onClose });
    fireEvent.keyDown(screen.getByText("Content"), { key: "Escape" });
    onClose();
    expect(onClose).toHaveBeenCalled();
  });
});
