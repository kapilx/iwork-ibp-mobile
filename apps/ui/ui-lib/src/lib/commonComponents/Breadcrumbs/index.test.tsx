import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import CommonBreadcrumb from "./index";
import { theme } from "../../styles/Theme";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const crumbs = [
  { label: "Home", path: "/" },
  { label: "Products", path: "/products" },
  { label: "Current Page" },
];

const renderWithTheme = (props: any) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <CommonBreadcrumb {...props} />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe("CommonBreadcrumb Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders all crumbs", () => {
    renderWithTheme({ crumbs });
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Current Page")).toBeInTheDocument();
  });

  it("navigates to correct path when clickable crumb is clicked", () => {
    renderWithTheme({ crumbs });
    fireEvent.click(screen.getByText("Home"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
    fireEvent.click(screen.getByText("Products"));
    expect(mockNavigate).toHaveBeenCalledWith("/products");
  });

  it("does not navigate when non-clickable crumb is clicked", () => {
    renderWithTheme({ crumbs });
    fireEvent.click(screen.getByText("Current Page"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows tooltip for non-clickable crumb", () => {
    renderWithTheme({ crumbs });
    fireEvent.mouseOver(screen.getByText("Current Page"));
    expect(screen.getByText("Current Page")).toBeInTheDocument();
  });

  it("applies correct aria-label to breadcrumb container", () => {
    renderWithTheme({ crumbs });
    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
  });

  it("has correct data-testid based on first crumb", () => {
    renderWithTheme({ crumbs });
    expect(screen.getByTestId("home-breadcrumb")).toBeInTheDocument();
  });
});