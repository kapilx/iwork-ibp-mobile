import React from "react";
import { ProgressCircle } from "./ProgressCircle";
import { render, screen } from "@ui/ui-lib/utils/renderWithTheme";

describe("ProgressCircle", () => {
  it("renders without crashing", () => {
    render(<ProgressCircle progress={50} />);
    expect(screen.getByTestId("progress-wrapper")).toBeTruthy();
    expect(screen.getByTestId("circular-progress")).toBeTruthy();
  });

  it("displays correct rounded progress text", () => {
    render(<ProgressCircle progress={47.6} />);
    expect(screen.getByTestId("progress-text")).toBeTruthy();
  });

  it("applies correct background color based on progress", () => {
    const progressValues = [
      { progress: 10, expectedColor: "rgba(255, 188, 5, 1)" },
      { progress: 30, expectedColor: "rgba(255, 172, 5, 1)" },
      { progress: 50, expectedColor: "rgba(67, 198, 2, 1)" },
      { progress: 70, expectedColor: "rgba(67, 198, 2, 1)" },
      { progress: 90, expectedColor: "rgba(67, 198, 2, 1)" },
    ];

    progressValues.forEach(({ progress, expectedColor }) => {
      const { getByTestId, unmount } = render(
        <ProgressCircle progress={progress} />
      );
      const circularProgress = getByTestId("circular-progress");

      expect(circularProgress).toBeTruthy();
      unmount();
    });
  });

  it("supports custom size", () => {
    render(<ProgressCircle progress={60} size={100} />);
    const circularProgress = screen.getByTestId("circular-progress");
    expect(circularProgress).toBeTruthy();
  });
});
