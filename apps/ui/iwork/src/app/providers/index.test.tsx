import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthProvider";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { apiRequest, endPoints } from "@ui/ui-lib";

// Mock the mutation function and capture the config
const mockMutate = jest.fn();
let capturedConfig: any = {};

jest.mock("@ui/ui-lib", () => ({
  apiRequest: jest.fn(() => Promise.resolve()),
  endPoints: {
    logout: "/api/logout",
  },
  HTTP_METHODS: {
    POST: "POST",
  },
  useApiMutation: jest.fn((params) => {
    capturedConfig = params.config; // Capture the config for testing
    return {
      mutate: mockMutate,
      isLoading: false,
      error: null,
    };
  }),
  resetPermissions: jest.fn(() => ({ type: "RESET_PERMISSIONS" })),
}));

// Mock ALERT_MESSAGES
jest.mock("../constants", () => ({
  ALERT_MESSAGES: {
    GENERIC_ERROR: "Something went wrong",
  },
}));

const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// @ts-ignore
Object.defineProperty(globalThis, "sessionStorage", { value: mockSessionStorage });

// Test Component to use AuthProvider
const TestComponent = () => {
  const { user, loading, signIn, signOut } = useAuth();

  return (
    <div>
      {loading && <p data-testid="loading">{"Loading..."}</p>}
      <p data-testid="user">{user ? JSON.stringify(user) : "No User"}</p>
      <button onClick={() => signIn({ token: "test-token" })}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

// Helper function to render with all required providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Create a minimal Redux store for testing
  const mockStore = configureStore({
    reducer: {
      // Add a minimal reducer to prevent errors
      test: (state = {}, action) => state,
    },
  });

  return render(
    <Provider store={mockStore}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </Provider>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllMocks();
    mockMutate.mockClear();
    capturedConfig = {};
  });

  test("should load user from sessionStorage if available", async () => {
    mockSessionStorage.setItem("user", "stored-user");

    renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("stored-user");
    });
  });

  test("should sign in and update user in sessionStorage", async () => {
    renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Sign In").click();
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify({ token: "test-token" })
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(
        JSON.stringify({ token: "test-token" })
      );
    });
  });

  test("should sign out and remove user from sessionStorage", async () => {
    mockSessionStorage.setItem("user", "test-user");

    renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Sign Out").click();
    });

    // Verify the mutation was called with correct parameters
    expect(mockMutate).toHaveBeenCalledWith({
      endpoint: endPoints.logout,
      method: "POST",
      data: {},
    });
  });

  describe("useApiMutation callbacks", () => {
    test("onSuccess should handle successful logout response", async () => {
      // Set up initial user state
      mockSessionStorage.setItem("user", JSON.stringify({ token: "test-token" }));

      const { resetPermissions } = require("@ui/ui-lib");
      const mockDispatch = jest.fn();
      const mockQueryClientClear = jest.fn();

      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify the config was captured
      expect(capturedConfig.onSuccess).toBeDefined();
      expect(capturedConfig.onError).toBeDefined();

      // Mock console.log to verify it's called
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Simulate successful response
      const mockResponse = { message: "Logout successful" };

      // Call the onSuccess callback directly to test its behavior
      act(() => {
        capturedConfig.onSuccess(mockResponse);
      });

      // Verify the onSuccess callback behavior
      expect(consoleSpy).toHaveBeenCalledWith(
        "Sign-in successful:",
        mockResponse
      );
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("user");

      // Wait for state updates
      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("No User");
      });

      consoleSpy.mockRestore();
    });

    test("onError should handle error with message array", () => {
      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Mock console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Simulate error with message array
      const mockError = {
        message: ["First error message", "Second error message"],
      };

      // Call the onError callback directly
      act(() => {
        capturedConfig.onError(mockError);
      });

      // Verify the first error message is used
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error during sign-in:",
        "First error message"
      );

      consoleErrorSpy.mockRestore();
    });

    test("onError should handle error with string message", () => {
      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Mock console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Simulate error with string message
      const mockError = {
        message: "Single error message",
      };

      // Call the onError callback directly
      act(() => {
        capturedConfig.onError(mockError);
      });

      // Verify the string message is used
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error during sign-in:",
        "Single error message"
      );

      consoleErrorSpy.mockRestore();
    });

    test("onError should use generic error message when no message provided", () => {
      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Mock console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Simulate error without message
      const mockError = {};

      // Call the onError callback directly
      act(() => {
        capturedConfig.onError(mockError);
      });

      // Verify the generic error message is used
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error during sign-in:",
        "Something went wrong"
      );

      consoleErrorSpy.mockRestore();
    });

    test("onError should handle null/undefined error", () => {
      renderWithProviders(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Mock console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Call the onError callback with null
      act(() => {
        capturedConfig.onError(null);
      });

      // Verify the generic error message is used
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error during sign-in:",
        "Something went wrong"
      );

      consoleErrorSpy.mockRestore();
    });
  });
});