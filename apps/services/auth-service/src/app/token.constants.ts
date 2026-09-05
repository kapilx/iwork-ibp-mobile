import { ENV } from "../../../service-lib/src/lib/environment";

const parseSessionTimeout = (): string | null => {
  const minutes = Number(ENV.SESSION_TIMEOUT_MINUTES);
  if (!Number.isNaN(minutes) && minutes > 0) {
    return `${minutes}m`;
  }
  return null;
};

export const getAccessTokenExpiry = (): string => {
  return parseSessionTimeout() || (ENV.JWT_EXPIRATION as string) || "4h";
};
