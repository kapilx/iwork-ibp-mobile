import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./index";
import "@testing-library/jest-dom";
import { useNavigate } from "react-router-dom";

// Mock `useNavigate`
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("LandingPage Component", () => {
  it("should display the landing page title", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Landing page")).toBeInTheDocument();
  });

  it("should have Employee and Company buttons", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /employee/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /company/i })
    ).toBeInTheDocument();
  });

  it("should navigate to the correct routes on button clicks", () => {
    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Click the "Employee" button
    fireEvent.click(screen.getByRole("button", { name: /employee/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/employee");

    // Click the "Company" button
    fireEvent.click(screen.getByRole("button", { name: /company/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/companies");

    // Click the "Contact" button
    fireEvent.click(screen.getByRole("button", { name: /Contact/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/contact");

    // Click the "Insurer" button
    fireEvent.click(screen.getByRole("button", { name: /Insurer/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/insurers");

    // Click the "TPA" button
    fireEvent.click(screen.getByRole("button", { name: /TPA/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/tpa");
  });
});
