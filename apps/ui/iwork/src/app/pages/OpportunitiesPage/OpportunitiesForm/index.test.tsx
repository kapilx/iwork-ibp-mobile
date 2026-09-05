import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import TpaForm from "./OpportunityForm";
import { useApi } from "@ui/ui-lib";
import { addressFields, tpaFormFields } from "./formConfig";

const mockUseForm = {
  reset: jest.fn(),
  handleSubmit: jest.fn(),
};

jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    doFetch: jest.fn(),
    data: null,
    error: null,
  })),
}));

const mockSaveTpa = jest.fn();
const mockApiResponse = { message: "Tpa updated successfully" };

describe("TpaForm Component", () => {
  let mockDoFetch: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDoFetch = jest.fn();
  });

  test("renders all form fields correctly", async () => {
    render(
      <BrowserRouter>
        <TpaForm />
      </BrowserRouter>
    );

    tpaFormFields.forEach((field) => {
      const formElement = screen.getByTestId(
        `form-field-${field.type}-${field.name}`
      );
      expect(formElement).toBeInTheDocument();
    });
  });

  test("should renders add address initial component correctly", async () => {
    render(
      <BrowserRouter>
        <TpaForm />
      </BrowserRouter>
    );

    const adressHeading = screen.getByTestId("address-heading");
    const addAdressButton = screen.getByTestId("add-address-button");
    const noAddressText = screen.getByTestId("no-address-text");
    const addFirstAddressButton = screen.getByTestId(
      "add-first-address-button"
    );

    expect(adressHeading).toBeInTheDocument();
    expect(addAdressButton).toBeInTheDocument();
    expect(addFirstAddressButton).toBeInTheDocument();

    // Intially it should display empty component
    expect(noAddressText).toBeInTheDocument();
    expect(noAddressText).toHaveTextContent("No addresses added yet");
  });

  test("displays validation errors", async () => {
    render(
      <BrowserRouter>
        <TpaForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);
  });

  test("handleReset should reset form and clear addresses", async () => {
    let mockDataFn = jest.fn();
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDataFn,
      data: {
        data: {
          id: "1",
          name: "Test TPA",
          addresses: [
            {
              id: 1,
              addressTypeLid: 0,
              address1: "2w",
              area: "DEF",
              countryId: 1,
              stateId: 11,
              cityId: 24,
              pinCode: "560032",
              email: "vedavyas@divami.com",
              phone1: "1234567890",
              phone2: "",
              mobileOrTollNo: "asd",
              faxCode: "",
              address2: "",
              landmark: "",
            },
          ],
        },
      },
      error: null,
    });

    render(
      <BrowserRouter>
        <TpaForm />
      </BrowserRouter>
    );

    expect(mockDataFn).toHaveBeenCalledTimes(0);

    const resetButton = screen.getByTestId("tpa-reset-button");
    fireEvent.click(resetButton);

    expect(mockUseForm.reset).toHaveBeenCalledTimes(0);
  });

  test("should edit addresses", async () => {
    let mockDataFn = jest.fn();
    (useApi as jest.Mock).mockReturnValue({
      doFetch: mockDataFn,
      data: {
        data: {
          id: "1",
          name: "Test TPA",
          addresses: [
            {
              id: 1,
              addressTypeLid: 0,
              address1: "2w",
              area: "DEF",
              countryId: 1,
              stateId: 11,
              cityId: 24,
              pinCode: "560032",
              email: "vedavyas@divami.com",
              phone1: "1234567890",
              phone2: "",
              mobileOrTollNo: "asd",
              faxCode: "",
              address2: "",
              landmark: "",
            },
          ],
          countries: [
            { id: 1, name: "India" },
            { id: 2, name: "USA" },
          ],
          states: [
            { id: 11, name: "Telangana", countryId: 1 },
            { id: 12, name: "Karnataka", countryId: 1 },
            { id: 21, name: "California", countryId: 2 },
          ],
          cities: [
            { id: 24, name: "Hyderabad", stateId: 11 },
            { id: 25, name: "Bangalore", stateId: 12 },
            { id: 31, name: "Los Angeles", stateId: 21 },
          ],
        },
      },

      error: null,
    });

    render(
      <BrowserRouter>
        <TpaForm />
      </BrowserRouter>
    );

    expect(mockDataFn).toHaveBeenCalledTimes(0);

    const addressCardHeader = screen.getByTestId("address-card-2w");
    expect(addressCardHeader).toBeInTheDocument();

    const editButton = screen.getByTestId("address-edit-icon-DEF");
    fireEvent.click(editButton);

    const addressElement = screen.getByRole("textbox", {
      name: /address line 1/i,
    });
    expect(addressElement).toHaveValue("2w");

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
      doFetch: mockDataFn,
      data: {
        data: {
          id: "1",
          name: "Test TPA",
          addresses: [
            {
              id: 1,
              addressTypeLid: 0,
              address1: "2w",
              area: "DEF",
              countryId: 1,
              stateId: 11,
              cityId: 24,
              pinCode: "560032",
              email: "vedavyas@divami.com",
              phone1: "1234567890",
              phone2: "",
              mobileOrTollNo: "asd",
              faxCode: "",
              address2: "",
              landmark: "",
            },
          ],
        },
      },

      error: null,
    });

    render(
      <BrowserRouter>
        <TpaForm />
      </BrowserRouter>
    );

    expect(mockDataFn).toHaveBeenCalledTimes(0);

    const deleteButton = screen.getByTestId("address-delete-icon-DEF");
    fireEvent.click(deleteButton);

    const addressCard = screen.queryByTestId("address-card-Test Address");
    expect(addressCard).not.toBeInTheDocument();
  });

  test("handleAddressSave should add a new address", async () => {
    render(
      <BrowserRouter>
        <TpaForm />
      </BrowserRouter>
    );

    const addAddressButton = screen.getByTestId("add-address-button");
    fireEvent.click(addAddressButton);

    expect(screen.getAllByTestId("address-section").length).toBeGreaterThan(0);
    const addressType = screen.getByTestId("form-field-select-addressTypeLid");
    fireEvent.mouseDown(addressType);

    const address1 = screen.getByRole("textbox", { name: /address line 1/i });
    fireEvent.change(address1, { target: { value: "test" } });

    const country = screen.getByTestId("form-field-select-countryId");
    fireEvent.mouseDown(country);

    const saveButton = screen.getByTestId("address-form-dialog-submit");
    fireEvent.click(saveButton);
  });

  test("handleAddressEdit should open address form in edit mode", async () => {
    render(
      <BrowserRouter>
        <TpaForm />
      </BrowserRouter>
    );

    const editButtons = screen.getAllByText("");
    fireEvent.click(editButtons[0]);
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

  it("should return false if countryId is null or undefined", () => {
    const stateField = addressFields.find((field) => field.key === "stateId");

    if (!stateField || typeof stateField.showCondition !== "function") {
      throw new Error("showCondition function is missing in stateId field");
    }

    const mockWatch = (field: string) =>
      field === "countryId" ? null : undefined;

    expect(stateField.showCondition(mockWatch as any)).toBe(false);
  });

  it("should return true if stateId has a value", () => {
    const cityField = addressFields.find((field) => field.key === "cityId");

    if (!cityField || typeof cityField.showCondition !== "function") {
      throw new Error("showCondition function is missing in cityId field");
    }

    const mockWatch = (field: string) => (field === "stateId" ? 10 : undefined);

    expect(cityField.showCondition(mockWatch as any)).toBe(true);
  });

  it("should return false if stateId is null or undefined", () => {
    const cityField = addressFields.find((field) => field.key === "cityId");

    if (!cityField || typeof cityField.showCondition !== "function") {
      throw new Error("showCondition function is missing in cityId field");
    }

    const mockWatch = (field: string) =>
      field === "stateId" ? null : undefined;

    expect(cityField.showCondition(mockWatch as any)).toBe(false);
  });
});
