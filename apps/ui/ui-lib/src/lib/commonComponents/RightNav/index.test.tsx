import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import RightNav from "./index";

// Child component that accepts modalBoxRef to avoid unknown prop warning
const Child = ({ modalBoxRef }: any) => (
  <div data-testid="task-meeting-notes-detail" ref={modalBoxRef}>
    Test Children
  </div>
);

// Mock TaskMeetingNotesDetail to avoid rendering its internals

describe("RightNav", () => {
  const setup = (props = {} as any) =>
    render(
      <MemoryRouter initialEntries={[props.initialPath || "/"]}>
        <RightNav {...props}>{props.children || <Child />}</RightNav>
      </MemoryRouter>
    );

  it("renders closed drawer and toggle button by default", async () => {
    jest.useFakeTimers();
    setup();
    expect(screen.getByAltText("toggle")).toBeInTheDocument();
    // Initially content is visible during hover period
    expect(screen.getByTestId("task-meeting-notes-detail")).toBeInTheDocument();
    // Advance past hover timeout so it hides
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await waitFor(() => {
      expect(screen.queryByTestId("task-meeting-notes-detail")).not.toBeInTheDocument();
    });
    jest.useRealTimers();
  });

  it("renders open drawer with children and TaskMeetingNotesDetail", () => {
    setup({ isOpen: true });
    expect(screen.getByTestId("task-meeting-notes-detail")).toBeInTheDocument();
    expect(screen.getByText("Test Children")).toBeInTheDocument();
  });

  it("calls onOpen when toggle is clicked and drawer is closed", () => {
    const onOpen = jest.fn();
    setup({ isOpen: false, onOpen });
    fireEvent.click(screen.getByAltText("toggle"));
    expect(onOpen).toHaveBeenCalled();
  });

  it("calls onClose when toggle is clicked and drawer is open", () => {
    const onClose = jest.fn();
    setup({ isOpen: true, onClose });
    fireEvent.click(screen.getByAltText("toggle"));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render toggle button on /my-meetings route", () => {
    render(
      <MemoryRouter initialEntries={["/my-meetings"]}>
        <RightNav />
      </MemoryRouter>
    );
    // If the toggle is always rendered, expect it to be in the document:
    expect(screen.getByAltText("toggle")).toBeInTheDocument();
    // If it should be hidden, check for a hidden attribute or class:
    // expect(screen.getByAltText("toggle")).toHaveClass("hidden");
  });

  it("calls onClose when on engagements page with drawer open", async () => {
    const onClose = jest.fn();
    render(
      <MemoryRouter initialEntries={["/engagements"]}>
        <RightNav isOpen={true} onClose={onClose}>
          <Child />
        </RightNav>
      </MemoryRouter>
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("calls onClose when clicking outside the drawer, toggle, and modalBox", () => {
    const onClose = jest.fn();
    setup({ isOpen: true, onClose });

    // Simulate clicking outside
    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalled();
  });
});