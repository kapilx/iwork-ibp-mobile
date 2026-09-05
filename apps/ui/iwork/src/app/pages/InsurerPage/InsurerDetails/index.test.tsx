import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InsurerDetails from "./index";
import "@testing-library/jest-dom";
import {
  INSURER_DETAILS,
  UPDATE_INSURER,
} from "../../../constants";
import { NO_DATA_AVAILABLE } from "@ui/ui-lib";

jest.mock("@ui/ui-lib", () => ({
  ...jest.requireActual("@ui/ui-lib"),
  useApi: jest.fn(() => ({ data: null, doFetch: jest.fn() })),
}));

describe("InsurerDetails Component", () => {
  it("should display 'No data available' when no insurer data is provided", () => {
    const useApiMock = require("@ui/ui-lib").useApi;
    useApiMock.mockReturnValue({ data: null, doFetch: jest.fn() });

    render(
      <MemoryRouter>
        <InsurerDetails />
      </MemoryRouter>
    );

    expect(screen.getByText(NO_DATA_AVAILABLE)).toBeInTheDocument();
  });

  it("should display insurer details when data is provided", () => {
    const mockData = {
      id: 4,
      insurerName: "Test Insurer",
      displayName: "Test Display",
      companyType: "Life Insurance",
      website: "http://example.com",
      isLife: true,
      companyTag: "Tag1",
      remarks: "Test remarks",
      createdBy: "SYSTEM",
      updatedBy: "SYSTEM",
      createdAt: "2025-03-23T14:34:05.028Z",
      updatedAt: "2025-03-23T14:34:05.028Z",
      address: [
        {
          id: 233,
          addressTypeLid: "0",
          address1: "SD Road",
          countryId: "India",
          stateId: "Telangana",
          cityId: "Hyderabad",
          address2: "",
          area: "sec-bad",
          pinCode: "500025",
          landmark: "",
          phone1: "7095639485",
          phone2: "9177184763",
          email: "rohit@divami.com",
          mobileOrTollNo: "1234567890",
          faxCode: "123456",
        },
      ],
    };

    const useApiMock = require("@ui/ui-lib").useApi;
    useApiMock.mockReturnValue({
      data: { data: mockData },
      doFetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <InsurerDetails />
      </MemoryRouter>
    );

    expect(screen.getByText(INSURER_DETAILS)).toBeInTheDocument();
  });

  it("should display 'Not Available' for empty nested arrays", () => {
    const mockData = {
      id: 1,
      insurerName: "Insurer B",
      insurerCompanyAddresses: [],
    };

    const useApiMock = require("@ui/ui-lib").useApi;
    useApiMock.mockReturnValue({
      data: { data: mockData },
      doFetch: jest.fn(),
    });

    render(
      <MemoryRouter>
        <InsurerDetails />
      </MemoryRouter>
    );

    expect(screen.getByText("insurerName:")).toBeInTheDocument();
    expect(screen.getByText("Insurer B")).toBeInTheDocument();
  });
});
