import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // <-- Add this import
import RichTextRenderer from "./index";

describe("RichTextRenderer", () => {

  it("renders nothing when htmlContent is an empty string", () => {
    const { container } = render(<RichTextRenderer htmlContent="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when htmlContent is undefined", () => {
    // @ts-expect-error: Testing undefined prop
    const { container } = render(<RichTextRenderer />);
    expect(container.firstChild).toBeNull();
  });

  it("sets inner HTML using dangerouslySetInnerHTML", () => {
    const html = '<span data-testid="custom-span">Test</span>';
    render(<RichTextRenderer htmlContent={html} />);
    expect(screen.getByTestId("custom-span")).toBeInTheDocument();
    expect(screen.getByTestId("custom-span").textContent).toBe("Test");
  });
});
