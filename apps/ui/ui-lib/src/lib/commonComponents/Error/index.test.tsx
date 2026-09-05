import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import "@testing-library/jest-dom";

// Mock `useRouteError`
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useRouteError: () => new Error("Test error message"), // Mocking an error
  useNavigate: jest.fn(),
}));

describe("ErrorBoundary Component", () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  test("renders error message correctly", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary />
      </MemoryRouter>
    );

    expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error message/i)).toBeInTheDocument();
  });

  test("navigates back when 'Go Back' button is clicked", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Go Back/i));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test("navigates to home when 'Return Home' button is clicked", () => {
    render(
      <MemoryRouter>
        <ErrorBoundary />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Return Home/i));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
