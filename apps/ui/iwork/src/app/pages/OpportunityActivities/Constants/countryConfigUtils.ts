const normalizeCountryName = (value?: string): string =>
  (value || "").toLowerCase().replace(/\s+/g, "");

const getCountryNameFromStorage = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const storedUser = window.sessionStorage.getItem("user");
    if (!storedUser) {
      return undefined;
    }

    const parsedUser = JSON.parse(storedUser);
    return parsedUser?.country?.name;
  } catch (_error) {
    return undefined;
  }
};

/**
 * Returns a config based on the logged-in user's country (read from local storage).
 * Falls back to the provided default config when the country is unavailable or unmatched.
 */
export const getCountrySpecificConfig = <T>(
  defaultConfig: T,
  countryConfigMap: Record<string, T>
): T => {
  const countryName = getCountryNameFromStorage();

  if (!countryName) {
    return defaultConfig;
  }

  const normalizedCountry = normalizeCountryName(countryName);

  const matchedEntry = Object.entries(countryConfigMap).find(
    ([country]) => normalizeCountryName(country) === normalizedCountry
  );

  return matchedEntry ? matchedEntry[1] : defaultConfig;
};
