import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { environment } from "../environment";
import { getOrCreateClientScopeId } from "./clientScope";

// ✅ Store keys
const STORAGE_KEY = "user";
const SESSION_REVOKED_CODE = "SESSION_REVOKED";
const AUTH_VERSION_MISMATCH_CODE = "AUTH_VERSION_MISMATCH";
const SESSION_REVOKED_STORAGE_KEY = "auth:session-revoked";
const SESSION_REVOKED_SHOWN_KEY = "auth:session-revoked-shown";
const SESSION_REVOKED_MESSAGE_KEY = "auth:session-revoked-message";
const SESSION_EXPIRED_MESSAGE_KEY = "auth:session-expired-message";
const SESSION_EXPIRED_MESSAGE = "Session expired. Please login to continue.";
const SESSION_REVOKED_MESSAGE =
  "You were signed out because your account was used to sign in from another browser.";
const AUTH_VERSION_MISMATCH_MESSAGE =
  "You were signed out because your account roles or permissions were changed.";
const DEFAULT_ACCESS_REFRESH_BUFFER_SEC = 300;
const IBP_ACCESS_REFRESH_BUFFER_SEC = 60;
const IBP_REFRESH_REFRESH_BUFFER_SEC = 30;
const IBP_KEEPALIVE_INTERVAL_MS = 10000;
const IBP_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
];

// 🔒 Decode a JWT token and return exp timestamp
function isTokenExpiringSoon(token: string, bufferInSec = 300): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp - now <= bufferInSec;
  } catch {
    return true; // Treat as expired if decoding fails
  }
}

function getStoredUserData() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function getSessionTimeoutMsFromAccessToken(accessToken?: string): number | null {
  if (!accessToken) return null;
  try {
    const decoded = jwtDecode<{ iat?: number; exp?: number }>(accessToken);
    if (!decoded?.iat || !decoded?.exp || decoded.exp <= decoded.iat) {
      return null;
    }
    return (decoded.exp - decoded.iat) * 1000;
  } catch {
    return null;
  }
}

function isIbpSession(user: unknown): boolean {
  return (
    typeof user === "object" &&
    user !== null &&
    (user as { portal?: string }).portal === "IBP"
  );
}

// Returns true for sessions originating from this application (IBP or HR Portal).
// iWork and other apps do NOT set these portal markers, so they are excluded.
function isKnownPortalSession(user: unknown): boolean {
  if (typeof user !== "object" || user === null) return false;
  const portal = (user as { portal?: string }).portal;
  return portal === "IBP" || portal === "HR_PORTAL";
}

function setStoredTokens(accessToken: string, refreshToken?: string) {
  const user = getStoredUserData() || {};
  user.accessToken = {
    accessToken,
    refreshToken: refreshToken ?? user?.accessToken?.refreshToken ?? "",
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function logoutUser(options?: { reason?: "expired" | "logout" }): void {
  if (options?.reason === "expired") {
    localStorage.setItem(SESSION_EXPIRED_MESSAGE_KEY, SESSION_EXPIRED_MESSAGE);
  }
  sessionStorage.clear(); // also clears the localStorage mirror, see the patched clear() below
  localStorage.removeItem(STORAGE_KEY); // belt-and-suspenders in case the mirror patch isn't installed
  window.location.href = "/landing";
}

function shouldShowRevokedMessage(): boolean {
  const lastShown = localStorage.getItem(SESSION_REVOKED_SHOWN_KEY);
  if (!lastShown) return true;
  const timestamp = Number(lastShown);
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > 15000;
}

// Reads the session ID (sid) embedded in the current window's JWT.
// Each browser window has its own sessionStorage, so this returns the session
// that is active in this specific window — not any other window.
function getCurrentSessionId(): string | null {
  try {
    const user = getStoredUserData();
    const accessToken = user?.accessToken?.accessToken;
    if (!accessToken) return null;
    const decoded = jwtDecode<{ sid?: string }>(accessToken);
    return decoded?.sid ?? null;
  } catch {
    return null;
  }
}

function handleSessionRevoked(
  message = SESSION_REVOKED_MESSAGE,
  broadcast = true
): void {
  if (broadcast) {
    if (environment.featureFlag.FF_IWORK_SINGLE_SESSION) {
      // Single-session flag ON: broadcast the session ID alongside the timestamp
      // so other browser windows can compare and skip logout if it's not their session.
      const sessionId = getCurrentSessionId();
      localStorage.setItem(
        SESSION_REVOKED_STORAGE_KEY,
        JSON.stringify({ revokedAt: Date.now(), sessionId })
      );
    } else {
      // Single-session flag OFF: use the original plain timestamp format.
      localStorage.setItem(SESSION_REVOKED_STORAGE_KEY, Date.now().toString());
    }
    localStorage.setItem(SESSION_REVOKED_MESSAGE_KEY, message);
  }
  if (shouldShowRevokedMessage()) {
    localStorage.setItem(SESSION_REVOKED_SHOWN_KEY, Date.now().toString());
  }
  logoutUser();
}

async function refreshAccessToken(
  refreshToken: string,
  user: unknown,
  accessToken?: string
): Promise<{ accessToken: string; refreshToken?: string }> {
  try {
    // HR_PORTAL (CRM) sessions refresh via the same IBP endpoint as IBP sessions.
    const refreshEndpoint = isKnownPortalSession(user)
      ? endPoints.ibpRefreshToken
      : endPoints.refreshToken;
    const response = await axios.post(
      refreshEndpoint,
      {
        refreshToken,
      },
      {
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          "X-Refresh-Token": refreshToken,
          ...(accessToken ? { "X-Access-Token": accessToken } : {}),
        },
      }
    );

    const newAccessToken = response?.data?.data?.accessToken;
    const newRefreshToken = response?.data?.data?.refreshToken;

    if (!newAccessToken) {
      throw new Error("Invalid refresh response");
    }

    setStoredTokens(newAccessToken, newRefreshToken);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    logoutUser({ reason: isKnownPortalSession(user) ? "expired" : "logout" });
    throw err;
  }
}

// ✅ Axios instance WITHOUT baseURL (monorepo safe)
export const axiosInstance = axios.create();

let isRefreshing = false;
let refreshPromise: Promise<{
  accessToken: string;
  refreshToken?: string;
}> | null = null;

axiosInstance.interceptors.request.use(async (config) => {
  // Add client scope only when single-session is enabled.
  if (environment.featureFlag.FF_IWORK_SINGLE_SESSION) {
    const clientScopeId = getOrCreateClientScopeId();
    if (clientScopeId) {
      config.headers = config.headers || {};
      config.headers["X-Client-Scope"] = clientScopeId;
    }
  }
  const user = getStoredUserData();
  const accessToken = user?.accessToken?.accessToken;
  const refreshToken = user?.accessToken?.refreshToken;

  if (user?.userId || user?.id) {
    config.headers = config.headers || {};
    config.headers["userid"] = String(user?.userId || user?.id);
  }

  if (!accessToken || !refreshToken) {
    // No refresh token (HR_PORTAL/CRM session): proactively logout if the access
    // token has actually expired rather than letting the request fail with a 401.
    // Guarded by isKnownPortalSession so iWork and other apps are not affected.
    if (accessToken && isKnownPortalSession(user) && isTokenExpiringSoon(accessToken, 0)) {
      logoutUser({ reason: "expired" });
      return Promise.reject("Session expired");
    }
    return config;
  }

  // HR_PORTAL (CRM) sessions share the same inactivity/refresh logic as IBP sessions.
  const ibpSession = isKnownPortalSession(user);
  const sessionTimeoutMs = getSessionTimeoutMsFromAccessToken(accessToken);
  const tokenIatMs = decodeTokenIatMs(accessToken);
  const inactivityStartAt = tokenIatMs
    ? Math.max(ibpLastActivityAt, tokenIatMs)
    : ibpLastActivityAt;
  const inactiveForMs = Date.now() - inactivityStartAt;

  // If idle for longer than the token's own lifetime, logout without a refresh call.
  if (
    ibpSession &&
    sessionTimeoutMs &&
    inactiveForMs >= sessionTimeoutMs
  ) {
    logoutUser({ reason: "expired" });
    return Promise.reject("Session expired due to inactivity");
  }

  const refreshTokenExpiringSoon = isTokenExpiringSoon(refreshToken, 60);
  const accessTokenExpiringSoon = isTokenExpiringSoon(
    accessToken,
    ibpSession ? IBP_ACCESS_REFRESH_BUFFER_SEC : DEFAULT_ACCESS_REFRESH_BUFFER_SEC
  );
  const ibpRefreshTokenExpiringSoon = isTokenExpiringSoon(
    refreshToken,
    IBP_REFRESH_REFRESH_BUFFER_SEC
  );

  // Keep existing behavior for non-IBP apps.
  if (!ibpSession && refreshTokenExpiringSoon) {
    logoutUser();
    return Promise.reject("Session expired");
  }

  // Refresh when access token is close to expiry.
  // For IBP, also refresh when refresh token is close so the session can slide while active.
  if (
    accessTokenExpiringSoon ||
    (ibpSession && ibpRefreshTokenExpiringSoon)
  ) {
    if (!isRefreshing) {
      isRefreshing = true;

      refreshPromise = refreshAccessToken(refreshToken, user, accessToken)
        .then((tokens) => {
          isRefreshing = false;
          return tokens;
        })
        .catch((err) => {
          isRefreshing = false;
          throw err;
        });
    }

    try {
      const refreshInFlight = refreshPromise;
      if (!refreshInFlight) {
        return Promise.reject("Refresh session unavailable");
      }
      const refreshed = await refreshInFlight;

      if (config.headers) {
        config.headers.Authorization = `Bearer ${refreshed.accessToken}`;
      } else {
        config.headers = {
          Authorization: `Bearer ${refreshed.accessToken}`,
        };
      }
    } catch (err) {
      return Promise.reject(err);
    }
  } else {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const responseCode =
      error?.response?.data?.code ||
      error?.response?.data?.message?.code ||
      error?.response?.data?.error?.code;

    // 401 on an HR_PORTAL/IBP session with no refresh token = CRM token expired.
    // Log out gracefully instead of leaving the user on a broken page with failed APIs.
    // iWork and other apps are not affected (they don't set portal: "HR_PORTAL"/"IBP").
    if (status === 401) {
      const user = getStoredUserData();
      const hasRefreshToken = Boolean(user?.accessToken?.refreshToken);
      if (!hasRefreshToken && isKnownPortalSession(user)) {
        logoutUser({ reason: "expired" });
        return Promise.reject(error);
      }
    }

    // Handle auth version mismatch (role/permission changes)
    if (responseCode === AUTH_VERSION_MISMATCH_CODE) {
      const responseMessageRaw =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        AUTH_VERSION_MISMATCH_MESSAGE;
      const responseMessage =
        typeof responseMessageRaw === "string"
          ? responseMessageRaw
          : responseMessageRaw?.message || AUTH_VERSION_MISMATCH_MESSAGE;
      handleSessionRevoked(responseMessage);
      return Promise.reject(error);
    }

    // Session-revoked handling is only enabled with the feature flag.
    if (!environment.featureFlag.FF_IWORK_SINGLE_SESSION) {
      return Promise.reject(error);
    }

    if (responseCode === SESSION_REVOKED_CODE) {
      const responseMessageRaw =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        SESSION_REVOKED_MESSAGE;
      const responseMessage =
        typeof responseMessageRaw === "string"
          ? responseMessageRaw
          : responseMessageRaw?.message || SESSION_REVOKED_MESSAGE;
      handleSessionRevoked(responseMessage);
    }
    return Promise.reject(error);
  }
);

if (typeof window !== "undefined") {
  // The storage event fires in all windows of the same browser that share localStorage.
  // Without the session ID check below, logging out browser 1 would also log out browser 2,
  // because both listen to the same localStorage key.
  window.addEventListener("storage", (event) => {
    // Sync forced-logout across tabs only when enabled.
    if (!environment.featureFlag.FF_IWORK_SINGLE_SESSION) return;
    if (event.key === SESSION_REVOKED_STORAGE_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        const revokedSessionId = data?.sessionId;
        const currentSessionId = getCurrentSessionId();
        // The broadcast includes the session ID that was revoked (browser 1's session).
        // This window reads its own session ID from sessionStorage (browser 2's session).
        // If they are different, this revocation is not for this window — skip logout.
        // If they match (e.g. browser 1 had two tabs open), both tabs should logout.
        if (
          revokedSessionId &&
          currentSessionId &&
          revokedSessionId !== currentSessionId
        ) {
          return;
        }
      } catch {
        // Fallback: broadcast value is not JSON (legacy format) — proceed with logout to be safe.
      }
      handleSessionRevoked(undefined, false);
    }
  });
}

// --- Installed-PWA relaunch persistence (IBP / HR_PORTAL sessions only) ---
//
// The rest of this app (~90 call sites across ~55 files) reads/writes the
// auth payload via `sessionStorage.getItem/setItem/removeItem("user")`
// directly, not through this module's helpers — rewriting every one of those
// call sites to use a different storage location would be a large, hard-to-
// verify change for very little benefit. Instead, sessionStorage stays the
// single source every existing call site already uses unchanged, and this
// block transparently mirrors the "user" key to localStorage so the session
// survives an installed PWA being closed and relaunched (a fresh top-level
// browsing context normally starts with empty sessionStorage).
//
// Only IBP/HR_PORTAL sessions are ever mirrored — iWork and any other app
// sharing this file keep their original sessionStorage-only behavior with
// zero change, since isKnownPortalSession() gates every mirror/rehydrate.
if (typeof window !== "undefined" && !(window.sessionStorage as any).__ibpAuthMirrorInstalled) {
  (window.sessionStorage as any).__ibpAuthMirrorInstalled = true;

  const nativeSessionSetItem = window.sessionStorage.setItem.bind(window.sessionStorage);
  const nativeSessionRemoveItem = window.sessionStorage.removeItem.bind(window.sessionStorage);
  const nativeSessionClear = window.sessionStorage.clear.bind(window.sessionStorage);

  // Rehydrate once, before any other code on this page has a chance to read
  // sessionStorage (this runs as an ordinary module-level side effect, same as
  // the storage-event listener below, so it executes before React ever mounts).
  try {
    if (!window.sessionStorage.getItem(STORAGE_KEY)) {
      const mirrored = window.localStorage.getItem(STORAGE_KEY);
      if (mirrored && isKnownPortalSession(JSON.parse(mirrored))) {
        nativeSessionSetItem(STORAGE_KEY, mirrored);
      }
    }
  } catch {
    // Corrupt mirrored value — ignore; the user will simply need to log in again.
  }

  window.sessionStorage.setItem = (key: string, value: string) => {
    nativeSessionSetItem(key, value);
    if (key !== STORAGE_KEY) return;
    try {
      if (isKnownPortalSession(JSON.parse(value))) {
        window.localStorage.setItem(STORAGE_KEY, value);
      }
    } catch {
      // Not JSON — nothing to mirror.
    }
  };

  window.sessionStorage.removeItem = (key: string) => {
    nativeSessionRemoveItem(key);
    if (key === STORAGE_KEY) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  window.sessionStorage.clear = () => {
    nativeSessionClear();
    window.localStorage.removeItem(STORAGE_KEY);
  };
}

export default axiosInstance;

function decodeTokenExp(token?: string): number | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    return decoded?.exp ?? null;
  } catch {
    return null;
  }
}

function decodeTokenIatMs(token?: string): number | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<{ iat?: number }>(token);
    return decoded?.iat ? decoded.iat * 1000 : null;
  } catch {
    return null;
  }
}

let ibpLastActivityAt = Date.now();

if (typeof window !== "undefined") {
  IBP_ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(
      eventName,
      () => {
        ibpLastActivityAt = Date.now();
      },
      { passive: true }
    );
  });

  window.setInterval(async () => {
    const user = getStoredUserData();
    if (!isKnownPortalSession(user)) return;

    const accessToken = user?.accessToken?.accessToken;
    const refreshToken = user?.accessToken?.refreshToken;
    if (!accessToken || !refreshToken) return;

    const sessionTimeoutMs = getSessionTimeoutMsFromAccessToken(accessToken);
    if (!sessionTimeoutMs) return;

    const tokenIatMs = decodeTokenIatMs(accessToken);
    const inactivityStartAt = tokenIatMs
      ? Math.max(ibpLastActivityAt, tokenIatMs)
      : ibpLastActivityAt;
    const inactiveForMs = Date.now() - inactivityStartAt;
    if (inactiveForMs >= sessionTimeoutMs) return;

    const exp = decodeTokenExp(accessToken);
    const now = Math.floor(Date.now() / 1000);
    const shouldRefresh = !exp || exp - now <= IBP_ACCESS_REFRESH_BUFFER_SEC;
    if (!shouldRefresh || isRefreshing || refreshPromise) return;

    isRefreshing = true;
    refreshPromise = refreshAccessToken(refreshToken, user, accessToken)
      .then((tokens) => {
        isRefreshing = false;
        return tokens;
      })
      .catch((err) => {
        isRefreshing = false;
        throw err;
      });

    try {
      await refreshPromise;
    } catch {
      // logout is already handled in refreshAccessToken
    } finally {
      refreshPromise = null;
    }
  }, IBP_KEEPALIVE_INTERVAL_MS);
}
