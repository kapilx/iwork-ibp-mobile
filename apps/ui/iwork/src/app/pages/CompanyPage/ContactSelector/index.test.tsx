// ContactSelector.test.tsx
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { theme, useApiQuery } from "@ui/ui-lib";
import { useLocation, useNavigate } from "react-router-dom";
import ContactSelector from "./";

// Mocks
jest.mock("react-router-dom", () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  ...jest.requireActual("@ui/ui-lib"),
  useApiQuery: jest.fn(),
  CheckBox: ({ label, isChecked, onChange }) => (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          data-testid="checkbox"
        />
        {label}
      </label>
    </div>
  ),
  endPoints: {
    companyDetailsById: (id: number) => `/company/details/${id}`,
  },
}));

const mockRender = (state = {}, contactList = []) => {
  (useLocation as jest.Mock).mockReturnValue({ state });
  const navigate = jest.fn();
  (useNavigate as jest.Mock).mockReturnValue(navigate);

  (useApiQuery as jest.Mock).mockReturnValue({
    data: {
      data: {
        contacts: contactList,
      },
    },
  });

  render(
    <ThemeProvider theme={theme}>
      <ContactSelector />
    </ThemeProvider>
  );

  return { navigate };
};

describe("ContactSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders title and subtitle for created company", () => {
    mockRender({
      isCreated: true,
      cta: "company",
      COMPANY_SELECTION: { id: 1, label: "Test Co" },
    });

    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      /created successfully/i
    );
    expect(screen.getByText(/Add another contact/i)).toBeInTheDocument();
  });

  test("displays no-data image when no contacts available", () => {
    mockRender({
      cta: "opportunity",
      COMPANY_SELECTION: { id: 1, label: "Test Co" },
    });

    expect(screen.getByAltText(/no data/i)).toBeInTheDocument();
  });

  test("renders contacts and handles checkbox toggle", () => {
    mockRender(
      {
        cta: "contact",
        COMPANY_SELECTION: { id: 1, label: "Test Co" },
        newContactIds: [101],
      },
      [
        { id: 101, displayName: "John Doe" },
        { id: 102, displayName: "Jane" },
      ]
    );

    expect(screen.getAllByTestId("checkbox")).toHaveLength(2);
  });

  test("calls navigate on back, cancel, add contact, and proceed", () => {
    const { navigate } = mockRender(
      {
        cta: "opportunity",
        originPath: "/dashboard",
        COMPANY_SELECTION: { id: 1, label: "Test Co" },
      },
      [{ id: 1, displayName: "Alice" }]
    );

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(navigate).toHaveBeenCalledWith("/create", expect.any(Object));

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(navigate).toHaveBeenCalledWith("/dashboard");

    fireEvent.click(
      screen.getByRole("button", { name: /add another contact/i })
    );
    expect(navigate).toHaveBeenCalledWith("/contact/new", expect.any(Object));

    // Select a contact
    fireEvent.click(screen.getByTestId("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /proceed to opportunity/i })
    );
    expect(navigate).toHaveBeenCalledWith(
      "/opportunities/new",
      expect.any(Object)
    );
  });

  test("disables proceed button if no contacts are selected", () => {
    mockRender(
      {
        cta: "opportunity",
        COMPANY_SELECTION: { id: 1, label: "Test Co" },
      },
      [{ id: 1, displayName: "Alice" }]
    );

    expect(
      screen.getByRole("button", { name: /proceed to opportunity/i })
    ).toBeDisabled();
  });
});
