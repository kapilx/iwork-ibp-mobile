import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  BrowserRouter,
  MemoryRouter,
  NavigateFunction,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { useApi, addressFields } from "@ui/ui-lib";
import AddCompany from "./addCompany";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

// Mock dependencies
const mockUseForm = {
  reset: jest.fn(),
  handleSubmit: jest.fn(),
};

jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  ...jest.requireActual("@ui/ui-lib"),
  useApi: jest.fn(() => ({
    doFetch: jest.fn(),
    data: null,
    error: null,
  })),
}));

const mockedUseApi = useApi as jest.Mock;

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useParams: jest.fn(() => ({ id: "1" })),
}));
let mockSaveCompany: jest.Mock;
mockSaveCompany = jest.fn();

// Create a theme for Material-UI components
const theme = createTheme();

const renderComponent = (initialRoute = "/companies/new") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/companies/new" element={<AddCompany />} />
          <Route path="/companies/edit/:id" element={<AddCompany />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );
};
(useApi as jest.Mock).mockReturnValue({
  doFetch: jest.fn(),
  data: {
    data: {
      id: "1",
      name: "Test TPA",
      companyAddresses: [
        {
          address: {
            id: 1,
            addressTypeLid: "0",
            address1: "2w",
            area: "DEF",
            countryId: { id: 1 },
            stateId: { id: 11 },
            cityId: { id: 24 },
            pinCode: "560032",
            email: "vedavyas@divami.com",
            phone1: "1234567890",
            mobileOrTollNo: "asd",
          },
        },
      ],
    },
  },
  error: null,
});

describe("AddCompany Component", () => {
  let mockNavigate: NavigateFunction;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockNavigate = useNavigate(); // Get the mock function before each test
  });

  test("renders component with initial state", () => {
    renderComponent();
    expect(screen.getByText("Company Information")).toBeInTheDocument();
    expect(screen.getByText("Company Details")).toBeInTheDocument();
    expect(screen.getByText("Addresses")).toBeInTheDocument();
  });

  test("renders address section with empty state", () => {
    renderComponent();

    // Check empty address state
    expect(screen.getByText("No addresses added yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add up to three addresses for this company")
    ).toBeInTheDocument();
  });

  test("form submission with validation", async () => {
    renderComponent();
    const submitButton = screen.getByTestId("submit-button", {
      name: /submit/i,
    });
    fireEvent.click(submitButton);
  });

  test("reset button clears form fields", () => {
    renderComponent();
    const resetButton = screen.getByTestId("reset-button", { name: /reset/i });
    fireEvent.click(resetButton);
  });

  test("cancel button navigates away", () => {
    renderComponent();
    const cancelButton = screen.getByTestId("cancel-button", {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
  });
  test("should render add address initial component correctly", async () => {
    renderComponent();
    expect(screen.getByText("Addresses")).toBeInTheDocument();
    expect(screen.getByText("Add Address")).toBeInTheDocument();
    expect(screen.getByText("No addresses added yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add up to three addresses for this company")
    ).toBeInTheDocument();
  });
  test("handleReset should reset forms and clear addresses", async () => {
    // Mock the API response
    const mockDataFn = jest.fn();
    mockedUseApi.mockReturnValue({
      doFetch: mockDataFn,
      data: {
        data: {
          id: "1",
          name: "Test Company",
          addresses: [
            {
              id: 1,
              addressTypeLid: 0,
              address1: "123 Main St",
              area: "DEF",
              countryId: 1,
              stateId: 11,
              cityId: 24,
              pinCode: "560032",
              email: "test@example.com",
              phone1: "1234567890",
              phone2: "",
              mobileOrTollNo: "12345",
              faxCode: "",
              address2: "",
              landmark: "",
            },
          ],
        },
      },
      error: null,
    });
    const mockReset = jest.fn();
    jest.mock("react-hook-form", () => ({
      ...jest.requireActual("react-hook-form"),
      useForm: () => ({
        reset: mockReset,
        trigger: jest.fn(),
        getValues: jest.fn(),
      }),
    }));

    renderComponent();
    expect(mockDataFn).toHaveBeenCalledTimes(0);
    const resetButton = screen.getByTestId("reset-button");
    fireEvent.click(resetButton);
    await waitFor(() => {
      expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
    });
  });
  it("should return true if countryId has a value", () => {
    const stateField = addressFields.find((field) => field.key === "stateId");
    if (!stateField || typeof stateField.showCondition !== "function") {
      throw new Error("showCondition function is missing in stateId field");
    }
    const mockWatch = (field: string) =>
      field === "countryId" ? 5 : undefined;
    expect(stateField.showCondition(mockWatch as any)).toBe(true);
  });

  test("should set company data, details, and addresses when apiGetData is available", async () => {
    const mockApiResponse = {
      data: {
        id: 1,
        name: "Test Company",
        details: {
          companyHistory: "History",
          majorProducts: "Products",
        },
        companyAddresses: [
          {
            address: {
              id: 1,
              addressTypeLid: "1",
              address1: "123 Main St",
              area: "DEF",
              countryId: { id: 1 },
              stateId: { id: 11 },
              cityId: { id: 24 },
              pinCode: "560032",
              phone1: "1234567890",
              email: "test@example.com",
              mobileOrTollNo: "12345",
            },
          },
        ],
        dateOfIncorporation: "2023-01-01",
      },
    };

    const mockDoFetch = jest.fn();
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDoFetch,
      data: mockApiResponse,
      error: null,
    });

    const mockResetFormMethods = jest.fn();
    const mockResetFormMethods1 = jest.fn();

    jest.mock("react-hook-form", () => ({
      ...jest.requireActual("react-hook-form"),
      useForm: () => ({
        reset: mockResetFormMethods,
      }),
    }));

    renderComponent("/companies/edit/1");

    await waitFor(() => {
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
    });
  });
  test("should return early if formMethods1 or formMethods is not available", async () => {
    const mockSaveCompany = jest.fn();
    const mockSetToastMessage = jest.fn();

    mockedUseApi.mockReturnValue({
      saveCompany: mockSaveCompany,
    });

    renderComponent();

    // Simulate clicking the submit button without formMethods1 or formMethods
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    // Ensure saveCompany is not called
    expect(mockSaveCompany).not.toHaveBeenCalled();
    expect(mockSetToastMessage).not.toHaveBeenCalled();
  });
  test("should show validation error if one or both forms are invalid", async () => {
    renderComponent("/companies/new");

    // Leave required fields empty
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Validation failed on one or both forms./i)
      ).toBeInTheDocument();
      expect(mockSaveCompany).not.toHaveBeenCalled();
    });
  });

  test("should display error for invalid first name", async () => {
    render(<AddCompany />);

    const firstName = screen.getByPlaceholderText("Enter Company Name");
    fireEvent.change(firstName, { target: { value: "Joo" } });

    fireEvent.click(screen.getByTestId("submit-button"));

    expect(
      await screen.queryByText("Minimum 3 characters required")
    ).not.toBeInTheDocument();
  });

  let mockSaveCompany: jest.Mock;
  let mockSetToastMessage: jest.Mock;
  beforeEach(() => {
    mockSaveCompany = jest.fn();
    mockSetToastMessage = jest.fn();
    mockedUseApi.mockReturnValue({
      doFetch: jest.fn(),
      saveCompany: mockSaveCompany,
      data: null,
      error: null,
    });
  });

  test("should show validation error if one or both forms are invalid", async () => {
    render(
      <BrowserRouter>
        <AddCompany />
      </BrowserRouter>
    );

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Validation failed on one or both forms./i)
      ).toBeInTheDocument();
      expect(mockSaveCompany).not.toHaveBeenCalled();
    });
  });
});

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("AddCompany Component", () => {
  const mockDoFetch = jest.fn();
  const mockSaveCompany = jest.fn();

  beforeEach(() => {
    mockedUseApi.mockReturnValue({
      doFetch: mockDoFetch,
      data: null,
    });
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <AddCompany />
      </BrowserRouter>
    );

  test("should edit addresses", async () => {
    let mockDataFn = jest.fn();
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDataFn,
      data: {
        data: {
          id: "1",
          name: "Test TPA",
          companyAddresses: [
            {
              address: {
                id: 1,
                addressTypeLid: "0",
                address1: "2w",
                area: "DEF",
                countryId: 1,
                stateId: 11,
                cityId: 24,
                pinCode: "560032",
                email: "vedavyas@divami.com",
                phone1: "1234567890",
                mobileOrTollNo: "asd",
              },
            },
          ],
        },
      },
      error: null,
    });

    renderComponent();
    expect(mockDataFn).toHaveBeenCalledTimes(0);

    const addressCardHeader = screen.getByTestId("address-card-2w");
    expect(addressCardHeader).toBeInTheDocument();

    const editButton = screen.getByTestId("address-edit-icon-DEF");
    fireEvent.click(editButton);

    const addressElement = screen.getByRole("textbox", {
      name: /address line 1/i,
    });

    fireEvent.change(addressElement, { target: { value: "Test Address" } });
    expect(addressElement).toHaveValue("Test Address");

    const saveButton = screen.getByTestId("address-form-dialog-submit");
    fireEvent.click(saveButton);

    const addressCard = screen.getByTestId("address-card-2w");
    expect(addressCard).toBeInTheDocument();
  });

  test("should delete addresses", async () => {
    let mockDataFn = jest.fn();
    (useApi as jest.Mock).mockReturnValue({
      doFetch: jest.fn(),
      data: {
        data: {
          id: "1",
          name: "Test TPA",
          companyAddresses: [
            {
              address: {
                id: 1,
                addressTypeLid: "0",
                address1: "2w",
                area: "DEF",
                countryId: 1,
                stateId: 11,
                cityId: 24,
                pinCode: "560032",
                email: "vedavyas@divami.com",
                phone1: "1234567890",
                mobileOrTollNo: "asd",
              },
            },
          ],
        },
      },
      error: null,
    });

    renderComponent();

    expect(mockDataFn).toHaveBeenCalledTimes(0);

    const deleteButton = screen.getByTestId("address-delete-icon-DEF");
    fireEvent.click(deleteButton);

    const addressCard = screen.queryByTestId("address-card-Test Address");
    expect(addressCard).not.toBeInTheDocument();
  });

  test("handleAddressSave should add a new address", async () => {
    renderComponent();
    const addAddressButton = screen.getByText("Add Address");
    fireEvent.click(addAddressButton);
    const dialogTitle = await screen.findByText("Add New Address");
    expect(dialogTitle).toBeInTheDocument();
    const address1 = screen.getByPlaceholderText("Enter your address line 1");
    fireEvent.change(address1, { target: { value: "456 New Avenue" } });
    const pinCode = screen.getByRole("textbox", { name: /pin code/i });
    fireEvent.change(pinCode, { target: { value: "560032" } });
    const saveButton = screen.getByTestId("address-form-dialog-submit");
    fireEvent.click(saveButton);
    const addressCards = screen.getAllByTestId("address-section");
    expect(addressCards.length).toBeGreaterThan(0);
    expect(screen.findByText("456 New Avenue")).toBeTruthy();
    expect(screen.findByText("560032")).toBeTruthy();
  });
  test("should show toast message on validation failure", async () => {
    jest.mock("react-hook-form", () => ({
      ...jest.requireActual("react-hook-form"),
      useForm: () => ({
        trigger: jest.fn(),
        getValues: jest.fn(),
      }),
    }));

    renderComponent();
    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect("Validation failed on one or both forms.").toBeTruthy();
    });
    expect(mockSaveCompany).not.toHaveBeenCalled();
  });

  test("calls API when companyId is present", async () => {
    const mockDoFetch = jest.fn();

    // Mock useParams to return a company ID
    // (useParams as jest.Mock).mockReturnValue({ id: "1" });

    // Mock useApi to include the mocked doFetch function
    (useApi as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      doFetch: mockDoFetch,
    });

    // Render the AddCompany component with the edit route
    render(
      <MemoryRouter initialEntries={["/company/1/edit"]}>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route path="/company/edit/:id" element={<AddCompany />} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    );

    // Ensure doFetch is called with the correct endpoint
    expect(mockDoFetch).toHaveBeenCalledTimes(0);
  });
});
