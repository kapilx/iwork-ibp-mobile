import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InsurerPage from "./index";
import "@testing-library/jest-dom";
import { BACK, CREATE_INSURER } from "../../constants";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("../../components/InsurerTable", () => () => <div>InsurerTable Component</div>);

describe("InsurerPage Component", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => mockNavigate,
    }));
  });

  it("should render the component correctly", () => {
    render(
      <MemoryRouter>
        <InsurerPage />
      </MemoryRouter>
    );

    expect(screen.findByText(CREATE_INSURER)).toBeTruthy();
    expect(screen.getByText("InsurerTable Component")).toBeInTheDocument();
  });

  it("should display 'Manage Insurers' text", () => {
    render(
      <MemoryRouter>
        <InsurerPage />
      </MemoryRouter>
    );
  
    // Validate the presence of the "Manage Insurers" text
    expect(screen.findByText(/Manage Insurers/i)).toBeTruthy();
  });

  it("should render the InsurerTable component", () => {
    render(
      <MemoryRouter>
        <InsurerPage />
      </MemoryRouter>
    );

    expect(screen.findByText("InsurerTable Component")).toBeTruthy();
  });
});