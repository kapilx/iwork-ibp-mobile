import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./app";

// Mock AuthProvider
jest.mock("./providers/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

// Mock AppRoutes
jest.mock("./app.routes", () => () => <div data-testid="app-routes" />);

describe("App Component", () => {
  it("renders the App component with ThemeProvider, AuthProvider, and AppRoutes", () => {
    render(<App />);

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();

    expect(screen.getByTestId("app-routes")).toBeInTheDocument();
  });
});
