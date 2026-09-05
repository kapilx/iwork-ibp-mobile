import Axios from "axios";
import { apiRequest } from "./apiRequest.ts";

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(global, "sessionStorage", { value: sessionStorageMock });
import { apiRequest } from "./index.js";
import { endPoints } from "@ui/ui-lib/constants/endPoints";

jest.mock("axios");
jest.mock(".", () => ({
  handleLogout: jest.fn(),
}));

const mockedAxios = Axios as jest.Mocked<typeof Axios>;

describe("apiRequest Utility Function", () => {
  const mockToken = "mockAccessToken";
  const mockUrl = "https://mockapi.com/resource";
  const mockData = { key: "value" };

  beforeEach(() => {
    sessionStorage.setItem(
      "user",
      JSON.stringify({ accessToken: { accessToken: mockToken } })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it("should make a GET request and return data", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const response = await apiRequest(mockUrl);

    expect(mockedAxios.get).toHaveBeenCalledWith(mockUrl, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      },
      responseType: undefined,
    });
    expect(response).toEqual(mockData);
  });

  it("should make a POST request and return data", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: mockData });

    const response = await apiRequest(mockUrl, {
      method: "POST",
      data: mockData,
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(mockUrl, mockData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      },
      responseType: undefined,
    });
    expect(response).toEqual(mockData);
  });

  it("should merge custom headers with defaults", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: mockData });

    const response = await apiRequest(mockUrl, {
      method: "POST",
      data: mockData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(mockUrl, mockData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      },
      responseType: undefined,
    });
    expect(response).toEqual(mockData);
  });

  it("should omit default Content-Type when sending FormData without header", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: mockData });

    const formData = new FormData();
    formData.append("test", "value");

    const response = await apiRequest(mockUrl, {
      method: "POST",
      data: formData,
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(mockUrl, formData, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      },
      responseType: undefined,
    });
    expect(response).toEqual(mockData);
  });

  it("should make a PUT request and return data", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: mockData });

    const response = await apiRequest(mockUrl, {
      method: "PUT",
      data: mockData,
    });

    expect(mockedAxios.put).toHaveBeenCalledWith(mockUrl, mockData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      },
      responseType: undefined,
    });
    expect(response).toEqual(mockData);
  });

  it("should make a DELETE request and return data", async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: mockData });

    const response = await apiRequest(mockUrl, {
      method: "DELETE",
      data: mockData,
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith(mockUrl, {
      data: mockData,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      },
      responseType: undefined,
    });
    expect(response).toEqual(mockData);
  });

  it("should handle errors and call handleLogout for non-userDetails endpoints", async () => {
    const mockError = {
      request: { responseURL: "https://mockapi.com/resource" },
      response: { data: { message: "Error occurred" } },
    };
    mockedAxios.get.mockRejectedValueOnce(mockError);

    await expect(apiRequest(mockUrl)).rejects.toEqual({
      message: "Error occurred",
    });
    expect(apiRequest).toHaveBeenCalledWith(mockError);
  });

  it("should not call handleLogout for userDetails endpoint errors", async () => {
    const mockError = {
      request: { responseURL: endPoints.userDetails },
      response: { data: { message: "Error occurred" } },
    };
    mockedAxios.get.mockRejectedValueOnce(mockError);

    await expect(apiRequest(mockUrl)).rejects.toEqual({
      message: "Error occurred",
    });
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("should throw a default error message if no response data is available", async () => {
    const mockError = {
      request: { responseURL: "https://mockapi.com/resource" },
      response: null,
    };
    mockedAxios.get.mockRejectedValueOnce(mockError);

    await expect(apiRequest(mockUrl)).rejects.toEqual({
      message: "Something went wrong",
    });
    expect(apiRequest).toHaveBeenCalledWith(mockError);
  });

  it("should handle missing token gracefully", async () => {
    sessionStorage.clear();
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const response = await apiRequest(mockUrl);

    expect(mockedAxios.get).toHaveBeenCalledWith(mockUrl, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer null",
      },
      responseType: undefined,
    });
    expect(response).toEqual(mockData);
  });

  it("should return full response when responseType is provided", async () => {
    const blob = new Blob(["test"], { type: "text/plain" });
    const mockResponse = {
      data: blob,
      headers: {},
      status: 200,
      statusText: "OK",
      config: {},
    } as any;
    mockedAxios.get.mockResolvedValueOnce(mockResponse);

    const response = await apiRequest(mockUrl, { responseType: "blob" });

    expect(mockedAxios.get).toHaveBeenCalledWith(mockUrl, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${mockToken}`,
      },
      responseType: "blob",
    });
    expect(response).toEqual(mockResponse);
  });
});