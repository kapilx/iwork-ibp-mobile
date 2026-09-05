import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import {useApi} from "@ui/ui-lib";
import "@testing-library/jest-dom";

import type { AxiosResponse } from "axios";
import ContactDetails from ".";

declare const document: Document;
jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  default: jest.fn() as jest.Mock<
    () => {
      data: AxiosResponse<any, any> | null;
      loading: boolean;
      error: unknown;
      doFetch: (
        url: string,
        options?: {
          method?: string;
          headers?: Record<string, string>;
          body?: string;
        }
      ) => void;
    }
  >,
}));

// Mock ReusableForm component
jest.mock("@ui/ui-lib", () => ({
  __esModule: true,
  default: ({
    onSubmit,
    fields,
  }: {
    onSubmit: (data: any) => void;
    fields: any;
  }) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit({
        street: "123 New St",
        city: "San Francisco",
        zip: "94101",
      });
    };

    return (
      <form onSubmit={handleSubmit}>
        <label htmlFor="street">Street</label>
        <input id="street" name="street" aria-label="street" defaultValue="" />

        <label htmlFor="city">City</label>
        <input id="city" name="city" aria-label="city" defaultValue="" />

        <label htmlFor="zip">Zip</label>
        <input id="zip" name="zip" aria-label="zip" defaultValue="" />

        <button type="submit">Submit</button>
      </form>
    );
  },
}));

describe("ContactDetails Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders no data available message when contactData is null", () => {
    (useApi as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      doFetch: jest.fn(),
    });
    render(
      <Router>
        <ContactDetails />
      </Router>
    );

    expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
  });

  test("renders contact details when contactData is available", async () => {
    const mockData = {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
      address: [
        {
          street: "123 Main St",
          city: "New York",
          zip: "10001",
        },
      ],
    };

    (useApi as jest.Mock).mockReturnValue({
      data: { data: mockData },
      loading: false,
      doFetch: jest.fn(),
    });

    render(
      <Router>
        <ContactDetails />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText("name:")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("email:")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();

      // Use more specific queries for the address section
      const addressLabel = screen
        .getAllByText(/address/i)
        .find((element: HTMLElement) => element.textContent === "address:");
      expect(addressLabel).toBeInTheDocument();

      expect(screen.getByText("Address 1:")).toBeInTheDocument();
      expect(screen.getByText("street:")).toBeInTheDocument();
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
    });
  });

  test("renders 'Not Available' when no addresses exist", async () => {
    const mockData = {
      name: "Jane Doe",
      address: [],
    };

    (useApi as jest.Mock).mockReturnValue({
      data: { data: mockData },
      loading: false,
      doFetch: jest.fn(),
    });

    render(
      <Router>
        <ContactDetails />
      </Router>
    );

    await waitFor(() => {
      // Find the specific address label to avoid ambiguity
      const addressLabels = screen.getAllByText(/address/i);
      const addressLabel = addressLabels.find(
        (element: HTMLElement) => element.textContent === "address:"
      );
      expect(addressLabel).toBeInTheDocument();

      // Check for N/A text
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });
});
