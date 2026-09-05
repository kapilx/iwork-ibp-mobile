import {
  masterDataUtilityFunction,
  masterDataUtilitySearchFunction,
  masterUserDataUtilityFunction,
  handleApiError,
} from "./index";
import { UNAUTHORIZED } from "../constants";

describe("Utility Functions", () => {
  describe("masterDataUtilityFunction", () => {
    it("should map API response to value-label pairs", () => {
      const mockResponse = {
        data: {
          data: [
            { id: 1, name: "Option 1" },
            { id: 2, name: "Option 2" },
          ],
        },
      };

      const result = masterDataUtilityFunction(mockResponse);
      expect(result).toEqual([
        { value: 1, label: "Option 1" },
        { value: 2, label: "Option 2" },
      ]);
    });

    it("should return an empty array if response data is undefined", () => {
      const mockResponse = { data: { data: undefined } };
      const result = masterDataUtilityFunction(mockResponse);
      expect(result).toEqual([]);
    });
  });

  describe("masterDataUtilitySearchFunction", () => {
    it("should map API response to value-label pairs using name as both value and label", () => {
      const mockResponse = {
        data: {
          data: [
            { id: 1, name: "Option 1" },
            { id: 2, name: "Option 2" },
          ],
        },
      };

      const result = masterDataUtilitySearchFunction(mockResponse);
      expect(result).toEqual([
        { value: "Option 1", label: "Option 1" },
        { value: "Option 2", label: "Option 2" },
      ]);
    });

    it("should return an empty array if response data is undefined", () => {
      const mockResponse = { data: { data: undefined } };
      const result = masterDataUtilitySearchFunction(mockResponse);
      expect(result).toEqual([]);
    });
  });

  describe("masterUserDataUtilityFunction", () => {
    it("should map API response to value-label pairs using userId and firstName", () => {
      const mockResponse = {
        data: {
          data: [
            { userId: 101, firstName: "John" },
            { userId: 102, firstName: "Doe" },
          ],
        },
      };

      const result = masterUserDataUtilityFunction(mockResponse);
      expect(result).toEqual([
        { value: 101, label: "John" },
        { value: 102, label: "Doe" },
      ]);
    });

    it("should return an empty array if response data is undefined", () => {
      const mockResponse = { data: { data: undefined } };
      const result = masterUserDataUtilityFunction(mockResponse);
      expect(result).toEqual([]);
    });
  });

  describe("handleLogout", () => {
    const originalLocation = window.location;

    beforeAll(() => {
      delete (window as any).location;
      window.location = { href: "" } as any;
    });

    afterAll(() => {
      window.location = originalLocation;
    });

    it("should remove user from sessionStorage and redirect to login on 401 error", () => {
      const mockError = {
        response: {
          data: {
            statusCode: 401,
            error: UNAUTHORIZED,
          },
        },
      };

      sessionStorage.setItem("user", JSON.stringify({ token: "test-token" }));
      handleApiError(mockError);

      expect(sessionStorage.getItem("user")).toBeNull();
      expect(window.location.href).toBe("/login");
    });

    it("should log an error message for non-401 errors", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const mockError = {
        response: {
          data: {
            statusCode: 500,
            message: "Internal Server Error",
          },
        },
      };

      handleApiError(mockError);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unexpected error:",
        "Internal Server Error"
      );

      consoleSpy.mockRestore();
    });

    it("should log a default error message if error data is undefined", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const mockError = {};

      handleApiError(mockError);

      expect(consoleSpy).toBeTruthy();

      consoleSpy.mockRestore();
    });
  });
});
