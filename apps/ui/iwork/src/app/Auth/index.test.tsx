import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { ProtectedRoute } from "./protectedRoute";
import "@testing-library/jest-dom";

jest.mock("../providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../components/Header", () => () => <div>Mock Header</div>);

describe("ProtectedRoute Component", () => {
  test("shows loading state when loading is true", () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: true });

    render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("redirects to /login when user is not authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("renders Header when user is authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { name: "Test User" },
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>
    );

    expect(screen.getByText("Mock Header")).toBeInTheDocument();
  });
});
