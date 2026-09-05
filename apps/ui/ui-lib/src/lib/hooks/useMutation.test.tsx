import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import * as api from "../utils/apiRequest";
import { useApiMutation } from "./useMutation";

jest.mock("../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
  },
}));

jest.mock("../utils/apiRequest");
const mockApiRequest = api.apiRequest as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useApiMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("successfully executes a POST mutation", async () => {
    const mockResponse = { message: "Created" };
    mockApiRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useApiMutation({}), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      endpoint: "/api/users",
      method: "POST",
      data: { name: "John" },
    });

    await waitFor(() => result.current.isSuccess);

    expect(api.apiRequest).toHaveBeenCalledWith("/api/users", {
      method: "POST",
      data: { name: "John" },
      headers: undefined,
    });
    expect(result.current.data).toEqual(mockResponse);
  });

  it("successfully executes a PUT mutation", async () => {
    const mockResponse = { message: "Updated" };
    mockApiRequest.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useApiMutation({}), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      endpoint: "/api/users/1",
      method: "PUT",
      data: { name: "Jane" },
    });

    await waitFor(() => result.current.isSuccess);

    expect(api.apiRequest).toHaveBeenCalledWith("/api/users/1", {
      method: "PUT",
      data: { name: "Jane" },
      headers: undefined,
    });
    expect(result.current.data).toEqual(mockResponse);
  });

  it("handles API errors properly", async () => {
    const mockError = new Error("Update failed");
    mockApiRequest.mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiMutation({}), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      endpoint: "/api/users/1",
      method: "PUT",
      data: { name: "Jane" },
    });

    await waitFor(() => result.current.isError);

    expect(api.apiRequest).toHaveBeenCalled();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe("Update failed");
  });

  it("passes custom headers to apiRequest", async () => {
    const mockResponse = { message: "Deleted" };
    mockApiRequest.mockResolvedValue(mockResponse);

    const customHeaders = {
      Authorization: "Bearer token",
    };

    const { result } = renderHook(
      () => useApiMutation({ headers: customHeaders }),
      {
        wrapper: createWrapper(),
      }
    );

    result.current.mutate({
      endpoint: "/api/users/1",
      method: "DELETE",
      data: {},
    });

    await waitFor(() => result.current.isSuccess);

    expect(api.apiRequest).toHaveBeenCalledWith("/api/users/1", {
      method: "DELETE",
      data: {},
      headers: customHeaders,
    });
    expect(result.current.data).toEqual(mockResponse);
  });
});
