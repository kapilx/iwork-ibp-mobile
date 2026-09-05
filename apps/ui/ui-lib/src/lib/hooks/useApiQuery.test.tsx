import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import * as api from "../utils/apiRequest.js";
import { useApiQuery } from "./useApiQuery.js";
import { setLoading } from "../redux";

// Mock the setLoading action
const mockSetLoading = setLoading as jest.MockedFunction<typeof setLoading>;

jest.mock("../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
  },
}));

jest.mock("../utils/apiRequest");

// Mock Redux actions
jest.mock("../redux", () => ({
  setLoading: jest.fn((loading) => ({ type: "setLoading", payload: loading })),
}));

// Mock Redux store
const mockDispatch = jest.fn();
const mockStore = configureStore({
  reducer: {
    // Add a simple reducer for testing
    loading: (state = { isLoading: false }, action) => {
      switch (action.type) {
        case "setLoading":
          return { ...state, isLoading: action.payload };
        default:
          return state;
      }
    },
  },
});

// Mock useDispatch to return our mock function
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }): JSX.Element => (
    <Provider store={mockStore}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
};

describe("useApiQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
  });

  it("fetches and returns data correctly", async () => {
    const mockResponse = {
      message: "Success",
      data: [{ id: 1, name: "John" }],
    };
    (api.apiRequest as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useApiQuery({
          url: "/api/users",
          queryKey: ["users"],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => result.current.data !== undefined);

    expect(api.apiRequest).toHaveBeenCalledWith("/api/users", {
      data: undefined,
      headers: undefined,
    });
    expect(result.current.data).toEqual(mockResponse);
  });

  it("does not fetch if enabled is false", async () => {
    const { result } = renderHook(
      () =>
        useApiQuery({
          url: "/api/disabled",
          queryKey: ["disabled"],
          enabled: false,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(api.apiRequest).not.toHaveBeenCalled();
  });

  it("passes data and headers correctly to apiRequest", async () => {
    const mockResponse = { message: "Success" };
    (api.apiRequest as jest.Mock).mockResolvedValue(mockResponse);

    const mockData = { id: 123 };
    const mockHeaders = { Authorization: "Bearer token" };

    const { result } = renderHook(
      () =>
        useApiQuery({
          url: "/api/with-headers",
          queryKey: ["with-headers"],
          data: mockData,
          headers: mockHeaders,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => result.current.data !== undefined);

    expect(api.apiRequest).toHaveBeenCalledWith("/api/with-headers", {
      data: mockData,
      headers: mockHeaders,
    });
  });

  it("dispatches setLoading when shouldShowLoader is true", async () => {
    const mockResponse = { message: "Success", data: [] };
    (api.apiRequest as jest.Mock).mockResolvedValue(mockResponse);

    renderHook(
      () =>
        useApiQuery({
          url: "/api/loading-test",
          queryKey: ["loading-test"],
          shouldShowLoader: true,
        }),
      { wrapper: createWrapper() }
    );

    // Wait for the loading state to be dispatched
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "setLoading",
          payload: expect.any(Boolean),
        })
      );
    });

    // Verify setLoading was called with loading state
    expect(mockSetLoading).toHaveBeenCalledWith(expect.any(Boolean));
  });

  it("does not dispatch setLoading when shouldShowLoader is false", async () => {
    const mockResponse = { message: "Success", data: [] };
    (api.apiRequest as jest.Mock).mockResolvedValue(mockResponse);

    renderHook(
      () =>
        useApiQuery({
          url: "/api/no-loading-test",
          queryKey: ["no-loading-test"],
          shouldShowLoader: false,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(api.apiRequest).toHaveBeenCalled();
    });

    // Verify setLoading was not called
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "setLoading",
      })
    );
  });

  it("does not dispatch setLoading when shouldShowLoader is not provided (defaults to false)", async () => {
    const mockResponse = { message: "Success", data: [] };
    (api.apiRequest as jest.Mock).mockResolvedValue(mockResponse);

    renderHook(
      () =>
        useApiQuery({
          url: "/api/default-loading-test",
          queryKey: ["default-loading-test"],
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(api.apiRequest).toHaveBeenCalled();
    });

    // Verify setLoading was not called since shouldShowLoader defaults to false
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: "setLoading",
      })
    );
  });
});
