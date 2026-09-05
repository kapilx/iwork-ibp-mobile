import axios from "axios";
import { endPoints } from "@ui/ui-lib/constants/endPoints";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const toBase64Url = (payload: object) =>
  Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const setupAxiosInstance = async () => {
  (import.meta as any).env = {
    ...(import.meta as any).env,
    VITE_FF_IWORK_SINGLE_SESSION: "true",
  };
  const responseHandlers: Array<{
    fulfilled?: (value: any) => any;
    rejected?: (error: any) => any;
  }> = [];
  const axiosMockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn((handler) => {
          return handler;
        }),
      },
      response: {
        handlers: responseHandlers,
        use: jest.fn((fulfilled, rejected) => {
          responseHandlers.push({ fulfilled, rejected });
          return responseHandlers.length - 1;
        }),
      },
    },
  };
  mockedAxios.create.mockReturnValue(axiosMockInstance as any);
  const module = await import("./axiosInterceptors");
  return module.default as typeof axiosMockInstance;
};

describe("axiosInterceptors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    (window as any).alert = jest.fn();
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("adds access token and client scope to request headers", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = `header.${toBase64Url({ exp: futureExp })}.sig`;
    const refreshToken = `header.${toBase64Url({ exp: futureExp })}.sig`;
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        accessToken: { accessToken, refreshToken },
      })
    );
    const axiosInstance = await setupAxiosInstance();

    const requestHandler =
      (axiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];
    const config = await requestHandler({ headers: {} });

    expect(config.headers).toEqual(
      expect.objectContaining({
        Authorization: `Bearer ${accessToken}`,
        "X-Client-Scope": expect.any(String),
      })
    );
  });

  it("refreshes access token when nearing expiry", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const nearExp = Math.floor(Date.now() / 1000) + 100;
    const accessToken = `header.${toBase64Url({ exp: nearExp })}.sig`;
    const refreshToken = `header.${toBase64Url({ exp: futureExp })}.sig`;
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        accessToken: { accessToken, refreshToken },
      })
    );
    const axiosInstance = await setupAxiosInstance();
    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { accessToken: "new-token" } },
    });

    const requestHandler =
      (axiosInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];
    await requestHandler({ headers: {} });

    expect(mockedAxios.post).toHaveBeenCalledWith(endPoints.refreshToken, {
      refreshToken,
    });
  });

  it("handles session revoked responses with logout and message", async () => {
    const axiosInstance = await setupAxiosInstance();
    const error = {
      response: {
        data: {
          code: "SESSION_REVOKED",
          message: "Session ended due to a new login.",
        },
      },
    };

    // Simulate response interceptor manually
    const rejected = axiosInstance.interceptors.response.handlers[0].rejected;
    await rejected(error);

    expect(localStorage.getItem("auth:session-revoked")).toBeTruthy();
    expect(localStorage.getItem("auth:session-revoked-message")).toBe(
      "Session ended due to a new login."
    );
    expect(window.location.href).toBe("/login");
  });
});
