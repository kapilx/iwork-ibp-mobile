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

  describe("installed-PWA relaunch persistence (localStorage mirror)", () => {
    // jsdom keeps one `window` (and its sessionStorage/localStorage instances)
    // alive for the whole test file even across jest.resetModules(), unlike a
    // real browser where a fresh page load recreates everything. Restoring the
    // true native Storage methods here (they were never touched — the mirror
    // patch only ever shadows them as instance-level own-properties) before
    // resetting modules accurately simulates a genuinely fresh page load/app
    // relaunch instead of double-wrapping an already-patched instance.
    function simulateFreshPageLoad() {
      const proto = Object.getPrototypeOf(window.sessionStorage);
      window.sessionStorage.setItem = proto.setItem.bind(window.sessionStorage);
      window.sessionStorage.removeItem = proto.removeItem.bind(window.sessionStorage);
      window.sessionStorage.clear = proto.clear.bind(window.sessionStorage);
      delete (window.sessionStorage as any).__ibpAuthMirrorInstalled;
      jest.resetModules();
    }

    it("mirrors an IBP session written to sessionStorage into localStorage", async () => {
      await setupAxiosInstance();
      const ibpUser = JSON.stringify({ portal: "IBP", userId: 1 });

      sessionStorage.setItem("user", ibpUser);

      expect(localStorage.getItem("user")).toBe(ibpUser);
    });

    it("mirrors an HR_PORTAL session too", async () => {
      await setupAxiosInstance();
      const hrUser = JSON.stringify({ portal: "HR_PORTAL", userId: 2 });

      sessionStorage.setItem("user", hrUser);

      expect(localStorage.getItem("user")).toBe(hrUser);
    });

    it("does not mirror sessions without a recognized portal marker (e.g. iWork)", async () => {
      await setupAxiosInstance();
      const iworkUser = JSON.stringify({ userId: 3 });

      sessionStorage.setItem("user", iworkUser);

      expect(localStorage.getItem("user")).toBeNull();
    });

    it("clears the localStorage mirror when sessionStorage's user key is removed", async () => {
      await setupAxiosInstance();
      sessionStorage.setItem("user", JSON.stringify({ portal: "IBP", userId: 1 }));
      expect(localStorage.getItem("user")).not.toBeNull();

      sessionStorage.removeItem("user");

      expect(localStorage.getItem("user")).toBeNull();
    });

    it("clears the localStorage mirror on sessionStorage.clear()", async () => {
      await setupAxiosInstance();
      sessionStorage.setItem("user", JSON.stringify({ portal: "IBP", userId: 1 }));
      expect(localStorage.getItem("user")).not.toBeNull();

      sessionStorage.clear();

      expect(localStorage.getItem("user")).toBeNull();
    });

    it("rehydrates sessionStorage from a mirrored IBP session on a fresh module load", async () => {
      const ibpUser = JSON.stringify({ portal: "IBP", userId: 42 });
      // Simulate an installed PWA relaunch: sessionStorage is empty (fresh top-level
      // browsing context) but the localStorage mirror from the previous session remains.
      localStorage.setItem("user", ibpUser);
      expect(sessionStorage.getItem("user")).toBeNull();

      simulateFreshPageLoad();
      await setupAxiosInstance();

      expect(sessionStorage.getItem("user")).toBe(ibpUser);
    });

    it("does not rehydrate a mirrored session that lacks a recognized portal marker", async () => {
      localStorage.setItem("user", JSON.stringify({ userId: 99 }));

      simulateFreshPageLoad();
      await setupAxiosInstance();

      expect(sessionStorage.getItem("user")).toBeNull();
    });
  });
});
