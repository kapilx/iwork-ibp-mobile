import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommonTooltip from "./index";

describe("CommonTooltip Component", () => {
  const tooltipTitle = "Tooltip content";
  const tooltipChildText = "Hover me";

  it("renders the tooltip child without crashing", () => {
    render(
      <CommonTooltip title={tooltipTitle}>
        <button>{tooltipChildText}</button>
      </CommonTooltip>
    );
    expect(screen.getByText(tooltipChildText)).toBeInTheDocument();
  });

  it("shows the tooltip on hover", async () => {
    render(
      <CommonTooltip title={tooltipTitle}>
        <button>{tooltipChildText}</button>
      </CommonTooltip>
    );
    const user = userEvent.setup();
    await user.hover(screen.getByText(tooltipChildText));
    expect(await screen.findByText(tooltipTitle)).toBeInTheDocument();
  });

  it("applies custom tooltipSx styles", async () => {
    const customSx = { backgroundColor: "rgb(255, 0, 0)" };
    render(
      <CommonTooltip title={tooltipTitle} tooltipSx={customSx}>
        <button>{tooltipChildText}</button>
      </CommonTooltip>
    );
    const user = userEvent.setup();
    await user.hover(screen.getByText(tooltipChildText));
    const tooltip = await screen.findByText(tooltipTitle);
    // Style assertion (backgroundColor)
    // The style may be applied to the tooltip element itself
    expect(tooltip).toHaveStyle("background-color: rgb(255, 0, 0)");
  });

  it("renders with arrow prop", async () => {
    render(
      <CommonTooltip title={tooltipTitle} arrow>
        <button>{tooltipChildText}</button>
      </CommonTooltip>
    );
    const user = userEvent.setup();
    await user.hover(screen.getByText(tooltipChildText));
    expect(await screen.findByText(tooltipTitle)).toBeInTheDocument();
    // MUI adds a class for arrow, but we just check tooltip appears
  });

  // Skipped: React will not throw at runtime for missing required props, TypeScript will catch at compile time.
});
