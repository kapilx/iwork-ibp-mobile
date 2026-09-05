import { renderHook, act } from "@testing-library/react";
import Axios from "axios";
import useApi from "./useApi";
import { handleApiError } from "../utils";

// Mock the handleApiError function
const mockHandleApiError = handleApiError as jest.MockedFunction<
  typeof handleApiError
>;

jest.mock("../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
  },
}));

jest.mock("axios", () => {
  const actualAxios = jest.requireActual("axios");
  // Create a shared mock for HTTP methods
  const mockMethods = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    ...actualAxios,
    default: {
      create: jest.fn(() => mockMethods),
      ...mockMethods,
    },
  };
});
jest.mock("../utils", () => ({
  handleLogout: jest.fn(),
  handleApiError: jest.fn(),
}));

// Patch: Provide direct mock functions for Axios HTTP methods for test compatibility
const mockedAxios = Axios as any as jest.Mocked<typeof Axios>;

describe("useApi Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock sessionStorage for test environment if not present
    if (typeof (global as any).sessionStorage === "undefined") {
      (global as any).sessionStorage = {
        clear: jest.fn(),
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
    }
    (global as any).sessionStorage.clear();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useApi());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should perform a successful GET request", async () => {
    const mockResponse = { data: { message: "Success" } };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.doFetch("/api/test");
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      // Wait for the fetch to complete
    });

    expect(mockedAxios.get).toHaveBeenCalledWith("/api/test", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Authorization header is set by axios interceptor, not by useApi
      },
    });
    expect(result.current.data).toEqual(mockResponse.data);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should perform a successful POST request", async () => {
    const mockResponse = { data: { message: "Created" } };
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.doFetch("/api/test", {
        method: "POST",
        data: { name: "Test" },
      });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      // Wait for the fetch to complete
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/test",
      { name: "Test" },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Authorization header is set by axios interceptor, not by useApi
        },
      }
    );
    expect(result.current.data).toEqual(mockResponse.data);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle API errors", async () => {
    const mockError = {
      response: { data: { message: "Error occurred" } },
    };
    mockedAxios.get.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.doFetch("/api/test");
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      // Wait for the fetch to complete
    });

    expect(mockedAxios.get).toHaveBeenCalledWith("/api/test", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Authorization header is set by axios interceptor, not by useApi
      },
    });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(mockError.response.data);
    expect(result.current.loading).toBe(false);
    expect(mockHandleApiError).toHaveBeenCalledWith(mockError);
  });

  it("should handle missing token gracefully", async () => {
    const mockResponse = { data: { message: "Success" } };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.doFetch("/api/test");
    });

    await act(async () => {
      // Wait for the fetch to complete
    });

    expect(mockedAxios.get).toHaveBeenCalledWith("/api/test", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Authorization header is set by axios interceptor, not by useApi
      },
    });
    expect(result.current.data).toEqual(mockResponse.data);
  });

  it("should handle a DELETE request", async () => {
    const mockResponse = { data: { message: "Deleted" } };
    mockedAxios.delete.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.doFetch("/api/test", {
        method: "DELETE",
        data: { id: 1 },
      });
    });

    await act(async () => {
      // Wait for the fetch to complete
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith("/api/test", {
      data: { id: 1 },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Authorization header is set by axios interceptor, not by useApi
      },
    });
    expect(result.current.data).toEqual(mockResponse.data);
  });

  it("should handle a PUT request", async () => {
    const mockResponse = { data: { message: "Updated" } };
    mockedAxios.put.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useApi());

    act(() => {
      result.current.doFetch("/api/test", {
        method: "PUT",
        data: { name: "Updated Name" },
      });
    });

    await act(async () => {
      // Wait for the fetch to complete
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(
      "/api/test",
      { name: "Updated Name" },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Authorization header is set by axios interceptor, not by useApi
        },
      }
    );
    expect(result.current.data).toEqual(mockResponse.data);
  });
});
