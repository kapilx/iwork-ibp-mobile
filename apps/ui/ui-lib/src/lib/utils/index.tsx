import { REGEX_PATTERNS } from "../constants/regex";
import { CurrencyDisplayMode } from "../constants/currencyDisplayMode";
import { RcTreeNode } from "../commonComponents/FormComponent/Fields/TreeSelect";
import type { MasterUserResponse } from "./masterUserDataUtility";
import { setToastMessage, store } from "../redux";
import { GENERIC_ERROR, UNAUTHORIZED_ERROR } from "../constants";
export * from "./procesaApiFormConfig";
export * from "./DateFormat";
export * from "./richTextUtils";
export * from "./renderWithTheme";
export * from "./getFileIcon";
export * from "./breadCrumbUtils";
export * from "./sanitizeHtml";
export * from "./sanitizeUrl";
export * from "./password-validation.util";
export { apiRequest } from "./apiRequest";
export { nl2sqlChatbotApiRequest } from "./nl2sqlChatbotApiRequest";
export { masterUserDataUtilityFunction } from "./masterUserDataUtility";
export type { MasterUserResponse } from "./masterUserDataUtility";
export { normalizePayload } from "./dataMappingUtils";
export { default as mapGetDataToFormData } from "./dataMappingUtils";
export { localizeFields } from "./fieldLocalizationUtil";
export { axiosInstance } from "./axiosInterceptors";
export { getOrCreateClientScopeId } from "./clientScope";
export { useInactivityTimeout } from "./sessionTimeout";
export * from "./captcha.config";
export { parseCurl } from "./curlParser.util";
export type { ParsedCurl, PayloadFormat } from "./curlParser.util";
export { CaptchaComponent } from "../commonComponents/Captcha";
export { CurrencyDisplayMode } from "../constants/currencyDisplayMode";

export interface MasterApiResponse {
  data: {
    data: MasterData[];
  };
}

export interface MasterData {
  id: number;
  name: string;
  firstName: string;
  value: string;
}

export const masterDataUtilityFunction = (response: MasterApiResponse) => {
  const masterData = response?.data?.data ?? [];
  return masterData.map(({ id, name }) => ({
    value: id,
    label: name,
  }));
};

export const masterDataUtilitySearchFunction = (
  response: MasterApiResponse,
) => {
  const masterData = response?.data?.data ?? [];
  return masterData.map(({ id, name }) => ({
    value: name,
    label: name,
  }));
};

export const masterDataUtilityCitySearchFunction = (
  response: MasterApiResponse,
) => {
  const masterData = response?.data?.data ?? [];
  return masterData.map(({ id, name }) => ({
    value: id,
    label: name,
  }));
};

export const distinctStringUtilityFunction = (response: any) => {
  const items: string[] = response?.data?.data ?? [];
  return items.map((item) => ({ value: item, label: item }));
};

export const masterDataBranchUtilityFunction = (
  response: MasterApiResponse,
) => {
  const masterData = response?.data?.data ?? [];
  return masterData.map(({ id, name }) => ({
    value: id,
    label: name,
  }));
};

export const masterDataUtilitySearchWithIdFunction = (
  response: MasterApiResponse,
) => {
  const masterData = response?.data?.data ?? [];
  return masterData.map(({ id, name }) => ({
    value: id,
    label: name,
  }));
};

export const masterCurrencyDataUtilityFunction = (
  response: MasterApiResponse,
) => {
  const masterData = response?.data?.data ?? [];
  return masterData.map(({ id, value }) => ({
    value: id,
    label: value,
  }));
};

export const handleApiError = (error: unknown): void => {
  if (
    error?.response?.data?.status === 401 ||
    error?.response?.status === 401 ||
    error?.status === 401 ||
    error?.response?.data?.statusCode === 401
  ) {
    const message = error?.response?.data?.message || UNAUTHORIZED_ERROR;
    store.dispatch(setToastMessage(message));
  } else {
    store.dispatch(
      setToastMessage(error?.response?.data?.message || GENERIC_ERROR),
    );
    console.error(
      "Unexpected error:",
      (error as any)?.response?.data?.message || "Unknown error occurred.",
    );
  }
};

export const formatIndianCurrency = (num: number): string => {
  return new Intl.NumberFormat("en-IN").format(num);
};
export const formatIndianCurrencyWithDecimals = (
  value?: number | null,
): string => {
  if (value == null || isNaN(value)) return "--";

  const hasDecimals = value % 1 !== 0;

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });
};

export interface LocalizationConfig {
  currencyCode?: string;
  currencyFormat?: string;
  numberFormat?: string;
  phoneNumberFormat?: string;
  faxFormat?: string;
  mobileFormat?: string;
  pincodeFormat?: string;
  taxLabel?: string;
}

// Returns the country's tax label (e.g. "VAT" for Sri Lanka) instead of a
// hardcoded "GST" — use this anywhere a tax breakdown line is displayed.
// Falls back to "GST" if localization hasn't loaded yet or the country has
// no tax_label configured.
export const getTaxLabel = (localization?: LocalizationConfig): string =>
  localization?.taxLabel || "GST";

/**
 * Number format keys and patterns understood by the frontend.
 * Use these constants while wiring the backend localization API.
 */
export const NUMBER_FORMAT_PATTERNS = {
  /** Indian number system pattern e.g. 12,34,56,789.00 */
  indian: "#,##,###.##",
  /** International number system pattern e.g. 123,456,789.00 */
  international: "#,###,###.##",
} as const;

export type NumberFormatKey = keyof typeof NUMBER_FORMAT_PATTERNS;

const CURRENCY_DISPLAY_MODES = new Set<string>(
  Object.values(CurrencyDisplayMode),
);

const normalizeCurrencyDisplayMode = (
  mode?: string | null,
): CurrencyDisplayMode => {
  const normalized = String(mode || "").toUpperCase();
  if (CURRENCY_DISPLAY_MODES.has(normalized)) {
    return normalized as CurrencyDisplayMode;
  }
  return CurrencyDisplayMode.INDIAN;
};

// Returns undefined when the user has never chosen a mode, so callers can fall
// back to country config instead of assuming INDIAN.
const getCurrencyDisplayModeFromStore = (): CurrencyDisplayMode | undefined => {
  const state = store.getState() as any;
  const stored = state?.user?.currencyDisplayMode;
  return stored ? normalizeCurrencyDisplayMode(stored) : undefined;
};

/**
 * Modes that pin every compacted value to a single unit instead of auto-tiering
 * by magnitude. Absent from this map => auto-tiered (INDIAN / INTERNATIONAL).
 */
const FIXED_UNIT_BY_MODE: Partial<
  Record<CurrencyDisplayMode, { divisor: number; suffix: string }>
> = {
  [CurrencyDisplayMode.LAKHS]: { divisor: 1e5, suffix: "L" },
  [CurrencyDisplayMode.CRORES]: { divisor: 1e7, suffix: "Cr" },
};

/**
 * A pinned unit is a user choice rather than a country trait, so it is read
 * from the mode alone and never from `localization.numberFormat`.
 */
export const resolveFixedUnit = (
  mode?: CurrencyDisplayMode,
): { divisor: number; suffix: string } | undefined => {
  const effectiveMode = mode ?? getCurrencyDisplayModeFromStore();
  return effectiveMode ? FIXED_UNIT_BY_MODE[effectiveMode] : undefined;
};

const resolveEffectiveNumberFormat = (
  localization?: LocalizationConfig,
  mode?: CurrencyDisplayMode,
): string => {
  // An explicitly chosen mode wins. Country auto-detection already happens once
  // at app mount (ComponentMount infers from /localization and persists it), so
  // re-deriving it here would silently override whatever the user picked.
  // INDIAN, LAKHS and CRORES all group the Indian way (12,34,567); only
  // INTERNATIONAL switches the grouping.
  const effectiveMode = mode ?? getCurrencyDisplayModeFromStore();
  if (effectiveMode) {
    return effectiveMode === CurrencyDisplayMode.INTERNATIONAL
      ? NUMBER_FORMAT_PATTERNS.international
      : NUMBER_FORMAT_PATTERNS.indian;
  }

  // No mode set (e.g. the ibp app, which never seeds one) — fall back to the
  // country's configured format so non-India deployments still group correctly.
  if (localization?.numberFormat) return localization.numberFormat;
  return NUMBER_FORMAT_PATTERNS.indian;
};

// Exported so the country-inference at app mount classifies a numberFormat the
// exact same way the formatters do. Two separate classifiers would let an
// inferred mode disagree with the pattern it was derived from.
export const isIndianNumberFormat = (numberFormat?: string): boolean => {
  const normalized = String(numberFormat || "").toLowerCase();
  const cleaned = normalized.replace(/[^#,]/g, "");

  return (
    normalized === NUMBER_FORMAT_PATTERNS.indian.toLowerCase() ||
    normalized.includes("indian") ||
    cleaned.includes(",##,")
  );
};

export const parseRegexString = (pattern?: string): RegExp | undefined => {
  if (!pattern) return undefined;
  try {
    const trimmed = pattern.trim();
    const match = trimmed.match(/^\/(.*)\/(.*)$/);
    if (match) {
      return new RegExp(match[1], match[2]);
    }
    return new RegExp(trimmed.replace(/^\/(.*)\/$/, "$1"));
  } catch {
    console.warn("Invalid regex pattern from localization", pattern);
    return undefined;
  }
};

export const applyRegexLocalization = (
  localization?: LocalizationConfig,
): void => {
  if (!localization) return;
  const phone = parseRegexString(localization.phoneNumberFormat);
  if (phone) REGEX_PATTERNS.PHONE = phone;

  const fax = parseRegexString(localization.faxFormat);
  if (fax) REGEX_PATTERNS.FAX = fax;

  const mobile = parseRegexString(localization.mobileFormat);
  if (mobile) REGEX_PATTERNS.MOBILE = mobile;

  const pin = parseRegexString(localization.pincodeFormat);
  if (pin) REGEX_PATTERNS.PIN_CODE = pin;
};

const resolveLocale = (numberFormat?: string): string => {
  if (!numberFormat) return "en-IN";
  const format = numberFormat.toLowerCase();

  // Keyword support
  if (
    format === NUMBER_FORMAT_PATTERNS.international.toLowerCase() ||
    format.includes("international") ||
    format.includes("us")
  ) {
    return "en-US";
  }
  if (
    format === NUMBER_FORMAT_PATTERNS.indian.toLowerCase() ||
    format.includes("indian") ||
    format.includes("in")
  ) {
    return "en-IN";
  }

  // Pattern detection
  const cleaned = format.replace(/[^#,]/g, "");
  if (cleaned.startsWith("#,##") || cleaned.includes(",##,")) {
    return "en-IN";
  }
  if (cleaned.startsWith("#,###") || cleaned.includes(",###")) {
    return "en-US";
  }

  return "en-IN";
};

// Rounding a tiny negative amount (e.g. -0.05) down to the display precision
// yields "-0" / "-0.00", which reads as a real debit. Once the rounded value is
// zero the sign carries no information, so drop it.
// Callers are typed `number` but the guards upstream only reject null/NaN, and
// `isNaN("123")` is false — so numeric strings from untyped API payloads reach
// here. They used to be tolerated because Intl.NumberFormat accepts them; keep
// that contract by coercing rather than calling toFixed on a string.
const stripNegativeZero = (value: number, fractionDigits: number): number => {
  const numeric = Number(value);
  return Number(numeric.toFixed(fractionDigits)) === 0 ? 0 : numeric;
};

// Shared "no meaningful rounding" precision for hover/exact-value display —
// KPI cards and any helper building their own composite value string should
// use this instead of a one-off maxFractionDigits so every card's hover value
// is truly unrounded, consistently.
export const FULL_PRECISION_FRACTION_DIGITS = 20;

export const formatCurrencyByLocalization = (
  value?: number | null,
  localization?: LocalizationConfig,
  maxFractionDigits: number = 0,
): string => {
  if (value == null || isNaN(value)) return "--";
  value = stripNegativeZero(value, maxFractionDigits);

  const locale = resolveLocale(resolveEffectiveNumberFormat(localization));
  const currency = localization?.currencyCode || "INR";

  let formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);

  // const match = formatted.match(/^(\D{1,4})([\s\u00A0]?)([\d,\.]+)/);
  // if (match) {
  //   const [, symbol, , rest] = match;
  //   formatted = `${symbol.trim()} ${rest}`;
  // }
  // if (match) {
  //   const [, , , rest] = match;
  //   formatted = `${rest}`;
  // }
  const match = formatted.match(/(-)?[\D\u00A0]*([\d.,]+)/);
  if (match) {
    const [, negative, rest] = match;
    formatted = `${negative || ""}${rest}`;
  }
  return formatted;
};

export const formatNumberByLocalization = (
  value?: number | null,
  localization?: LocalizationConfig,
  maxFractionDigits: number = 0,
  minFractionDigits: number = 0,
): string => {
  if (value == null || isNaN(value)) return "--";
  const locale = resolveLocale(resolveEffectiveNumberFormat(localization));
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(stripNegativeZero(value, maxFractionDigits));
};

// Returns the country's currency symbol (localization.currencyFormat, e.g. "Rs"
// for Sri Lanka, "₹" for India) with a trailing space when it's a word-based
// abbreviation rather than a single glyph symbol — use this anywhere a raw
// symbol needs to be prefixed onto a manually-formatted amount (e.g. compact
// "1.50L" notation). Falls back to "₹" only if localization hasn't loaded yet.
export const getCurrencySymbolPrefix = (
  localization?: LocalizationConfig,
): string => {
  const symbol = localization?.currencyFormat || "₹";
  return /[a-zA-Z]/.test(symbol) ? `${symbol} ` : symbol;
};

// Prefixes the country's actual currency symbol (localization.currencyFormat,
// e.g. "Rs" for Sri Lanka, "₹" for India) instead of a hardcoded "₹" — use this
// anywhere a currency amount is displayed with a symbol. Falls back to "₹" only
// if localization data hasn't loaded yet.
export const formatAmountWithCurrency = (
  value?: number | null,
  localization?: LocalizationConfig,
  maxFractionDigits: number = 0,
  minFractionDigits: number = 0,
): string => {
  if (value == null || isNaN(value)) return "--";
  return `${getCurrencySymbolPrefix(localization)}${formatNumberByLocalization(
    value,
    localization,
    maxFractionDigits,
    minFractionDigits,
  )}`;
};

export const formatNumberInputByLocalization = (
  value?: number | null,
  localization?: LocalizationConfig,
  maxFractionDigits: number = 2,
  forceMinFractionDigits: number = 0,
): string => {
  if (value == null || isNaN(value)) return "";

  const locale = resolveLocale(resolveEffectiveNumberFormat(localization));

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: forceMinFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
};

export const getSessionStorageData = (key: string) => {
  try {
    const data = sessionStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse sessionStorage data", error);
    return null;
  }
};

export const findPathToItem = (
  items: TreeViewBaseItem[],
  targetId: string,
): string[] => {
  const path: string[] = [];
  const traverse = (
    nodes: TreeViewBaseItem[],
    currentPath: string[],
  ): boolean => {
    for (const node of nodes) {
      const newPath = [...currentPath, node.id];
      if (node.id === targetId) {
        path.push(...newPath);
        return true;
      }
      if (node.children && traverse(node.children, newPath)) {
        return true;
      }
    }
    return false;
  };
  traverse(items, []);
  return path.slice(0, -1);
};

export const convertToTreeData = (data: any[]): RcTreeNode[] => {
  const nodeMap: Record<string, RcTreeNode> = {};
  const roots: RcTreeNode[] = [];

  data.forEach((item) => {
    const label =
      item.lastName && item.lastName.trim() !== ""
        ? `${item.firstName} ${item.lastName}`
        : item.firstName;
    nodeMap[item.userId] = {
      key: String(item.userId),
      title: label,
      children: [],
    };
  });

  data.forEach((item) => {
    if (
      item.reportingUserId &&
      nodeMap[item.reportingUserId] &&
      item.reportingUserId !== item.userId
    ) {
      nodeMap[item.reportingUserId].children!.push(nodeMap[item.userId]);
    } else {
      roots.push(nodeMap[item.userId]);
    }
  });

  return roots;
};

export const findMatchingPaths = (
  searchTerm: string | any,
  treeData: any,
): Set<string> => {
  const matchingPaths = new Set<string>();

  // Ensure searchTerm is a string and not null/undefined
  const searchString = String(searchTerm || "").trim();

  const searchInTree = (nodes: RcTreeNode[], path: string[] = []): void => {
    for (const node of nodes) {
      const currentPath = [...path, node.key];

      // Check if current node matches search term
      if (
        searchString &&
        node.title.toLowerCase().includes(searchString.toLowerCase())
      ) {
        // Add all parent keys to ensure path is visible
        currentPath.forEach((key) => matchingPaths.add(key));
      }

      // Recursively search children
      if (node.children?.length) {
        searchInTree(node.children, currentPath);
      }
    }
  };

  if (searchString) {
    searchInTree(treeData);
  }

  return matchingPaths;
};

export const countDigitsBeforeIndex = (str: string, index: number): number => {
  return str.slice(0, index).replace(/\D/g, "").length;
};

export const findIndexAfterNDigits = (
  formatted: string,
  digitCount: number,
): number => {
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) count++;
    if (count === digitCount) return i + 1;
  }
  return formatted.length;
};

export const parseNumberInput = (
  value?: string | number | null,
): number | null => {
  if (value === null || value === undefined || value === "") return null;

  const sanitized = String(value).replace(/,/g, "").trim();
  const num = Number(sanitized);
  return Number.isNaN(num) ? null : num;
};

export const parseNumbersDeep = (data: any): any => {
  if (Array.isArray(data)) return data.map(parseNumbersDeep);
  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, parseNumbersDeep(v)]),
    );
  }
  if (typeof data === "string" || typeof data === "number") {
    const parsed = parseNumberInput(data);
    return parsed === null ? data : parsed;
  }
  return data;
};

export const parseStringsDeep = (obj: any, stringFieldNames: string[]): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => parseStringsDeep(item, stringFieldNames));
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        stringFieldNames.includes(key) && value !== null && value !== undefined
          ? String(value)
          : parseStringsDeep(value, stringFieldNames),
      ]),
    );
  }
  return obj;
};

export const activityDataUtilityFunction = (response: MasterUserResponse) => {
  const masterData = response?.data ?? [];
  return masterData.map(({ id, name }) => ({
    value: name,
    label: name,
  }));
};

export const masterDataOpportunityStateDetails = (
  response: MasterApiResponse,
): { value: string; label: string }[] => {
  const masterData = response?.data ?? [];
  return masterData.map(({ name }) => ({
    value: name,
    label: name,
  }));
};

// Utility to format heading: first word as-is, rest as lowercased sentence
export const caseConvertor = (heading: string = ""): string => {
  if (!heading.trim()) return "";
  const [firstWord, ...rest] = heading.split(" ");
  return [firstWord, rest.join(" ").toLowerCase()].filter(Boolean).join(" ");
};

export const buildQueryString = (
  params: Record<string, any>,
  startWithQuestionMark: boolean = true,
): string => {
  const query = Object.entries(params)
    .filter(([key, value]) => {
      // Remove undefined, null, empty, or "ALL" values
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "ALL" ||
        value === 0
      )
        return false;
      // Multiselect fields hold [] when nothing is picked
      if (Array.isArray(value)) return value.length > 0;
      // If value is an object with a 'value' property, check that
      if (value && typeof value === "object" && "value" in value) {
        return (
          value.value !== undefined &&
          value.value !== null &&
          value.value !== "" &&
          value.value !== "ALL"
        );
      }
      return true;
    })
    .map(([key, value]) => {
      // Multiselect: send the option values as CSV, unwrapping {value,label}
      if (Array.isArray(value)) {
        const csv = value
          .map((v: any) =>
            v && typeof v === "object" && "value" in v ? v.value : v,
          )
          .join(",");
        return `${encodeURIComponent(key)}=${encodeURIComponent(csv)}`;
      }
      if (value && typeof value === "object" && "value" in value) {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value.value)}`;
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");
  return query ? `${startWithQuestionMark ? "?" : "&"}${query}` : "";
};

export const buildQueryStringWithLabels = (
  params: Record<string, any>,
  startWithQuestionMark: boolean = true,
): string => {
  const query = Object.entries(params)
    .filter(([key, value]) => {
      // Remove undefined, null, empty, or "ALL" values
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "ALL" ||
        value === 0
      )
        return false;
      // If value is an object with a 'label' property, check that
      if (value && typeof value === "object" && "label" in value) {
        return (
          value.label !== undefined &&
          value.label !== null &&
          value.label !== "" &&
          value.label !== "ALL"
        );
      }
      return true;
    })
    .map(([key, value]) => {
      if (value && typeof value === "object" && "label" in value) {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value.label)}`;
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");
  return query ? `${startWithQuestionMark ? "?" : "&"}${query}` : "";
};

// export const formatNumberShort = (num: number): string => {
//   if (num >= 1e7) {
//     return (num / 1e7).toFixed(1).replace(/\.0$/, "") + "Cr";
//   } else if (num >= 1e5) {
//     return (num / 1e5).toFixed(1).replace(/\.0$/, "") + "L";
//   } else if (num >= 1e3) {
//     return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
//   } else {
//     return num % 1 === 0 ? num.toString() : num.toFixed(0).toString();
//   }
// };

export const formatNumberShort = (
  num: number | string,
  localization?: LocalizationConfig,
  mode?: CurrencyDisplayMode,
): string => {
  const n = typeof num === "string" ? Number(num) : num;
  if (!Number.isFinite(n)) return "--";

  const effectiveNumberFormat = resolveEffectiveNumberFormat(localization);
  const locale = resolveLocale(effectiveNumberFormat);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const compact = (value: number) =>
    new Intl.NumberFormat(locale).format(Number(value.toFixed(1)));

  // Fixed-unit modes short-circuit the magnitude tiers entirely: no floor, so
  // 5,000 renders as 0.1L rather than falling through to the plain-number tail.
  const fixedUnit = resolveFixedUnit(mode);
  if (fixedUnit) {
    return `${sign}${compact(abs / fixedUnit.divisor)}${fixedUnit.suffix}`;
  }

  if (isIndianNumberFormat(effectiveNumberFormat)) {
    if (abs >= 1e7) return `${sign}${compact(abs / 1e7)}Cr`;
    if (abs >= 1e5) return `${sign}${compact(abs / 1e5)}L`;
    if (abs >= 1e3) return `${sign}${compact(abs / 1e3)}K`;
    return new Intl.NumberFormat(locale).format(parseFloat(n.toFixed(2)));
  }

  // Short-scale number names (K/M/B/T/Q), not SI prefixes — mixing the two
  // would read peta/exa in the middle of a currency ladder.
  if (abs >= 1e18) return `${sign}${compact(abs / 1e18)}Qn`;
  if (abs >= 1e15) return `${sign}${compact(abs / 1e15)}Q`;
  if (abs >= 1e12) return `${sign}${compact(abs / 1e12)}T`;
  if (abs >= 1e9) return `${sign}${compact(abs / 1e9)}B`;
  if (abs >= 1e6) return `${sign}${compact(abs / 1e6)}M`;
  if (abs >= 1e3) return `${sign}${compact(abs / 1e3)}K`;
  return new Intl.NumberFormat(locale).format(parseFloat(n.toFixed(2)));
};

export const updateTimeFilter = (
  filters: Record<string, string | number>,
): Record<string, string | number> => {
  const updated = { ...filters };

  const quarter = filters.quarter;
  const month = filters.month;

  // Set timeFilter based on priority
  if (month && month !== "ALL") {
    updated.timeFilter = month;
    delete updated.quarter; // remove quarter if month is selected
  } else if (quarter && quarter !== "ALL") {
    updated.timeFilter = quarter;
    delete updated.quarter; // still remove quarter after moving to timeFilter
  } else {
    delete updated.timeFilter;
    delete updated.quarter;
  }

  delete updated.month; // always remove month from query params

  return updated;
};

export enum AccordionTitles {
  COMPANY_SELECTION = "Company Selection",
  CONTACT_SELECTION = "Contact Selection",
  OPPORTUNITY_SELECTION = "Opportunity Selection",
}

export const buildAddressLine1 = (addr: any): string => {
  const parts = [];

  if (addr.plotNumber) {
    parts.push(`Plot No. ${addr.plotNumber}`);
  }

  if (addr.doorNumber) {
    parts.push(`Door No. ${addr.doorNumber}`);
  }

  if (addr.buildingName) {
    parts.push(`Building Name ${addr.buildingName}`);
  }

  if (addr.street) {
    parts.push(`Street ${addr.street}`);
  }

  return parts.join(", ");
};

export const formatLargeNumber = (
  num: number,
  numberFormat: string = NUMBER_FORMAT_PATTERNS.indian,
  mode?: CurrencyDisplayMode,
): string => {
  if (!isFinite(num) || isNaN(num)) return "--";
  const absNum = Math.abs(num);
  const locale = resolveLocale(numberFormat);
  // Scaling to a large unit makes small amounts round to zero, so the sign has
  // to be dropped after the divide rather than on the raw input. The compacted
  // mantissa (e.g. the "1,095.71" in "1,095.71 Cr") also still needs comma
  // grouping once it exceeds 999 — a plain toFixed(2) never adds commas.
  const scaled = (divisor: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(stripNegativeZero(num / divisor, 2));

  // A pinned unit can't be expressed as a numberFormat pattern, so it is read
  // from the mode (or the store) and takes precedence over the tiered branches.
  const fixedUnit = resolveFixedUnit(mode);
  if (fixedUnit) {
    return `${scaled(fixedUnit.divisor)} ${fixedUnit.suffix}`;
  }

  if (isIndianNumberFormat(numberFormat)) {
    if (absNum >= 1e7) return `${scaled(1e7)} Cr`;
    if (absNum >= 1e5) return `${scaled(1e5)} L`;
    if (absNum >= 1e3) return `${scaled(1e3)} K`;
  } else {
    // International
    // Short-scale number names (K/M/B/T/Q), matching formatNumberShort.
    if (absNum >= 1e18) return `${scaled(1e18)} Qn`;
    if (absNum >= 1e15) return `${scaled(1e15)} Q`;
    if (absNum >= 1e12) return `${scaled(1e12)} T`;
    if (absNum >= 1e9) return `${scaled(1e9)} B`;
    if (absNum >= 1e6) return `${scaled(1e6)} M`;
    if (absNum >= 1e3) return `${scaled(1e3)} K`;
  }

  return scaled(1);
};

export const formatLargeCurrency = (
  value?: number | null,
  localization?: LocalizationConfig,
  mode?: CurrencyDisplayMode,
): string => {
  // const currencySymbol = formatCurrencyByLocalization(0, localization)
  //   .replace(/[\d,.]/g, "")
  //   .trim();
  if (value == null || isNaN(value)) return "--";
  // return `${currencySymbol} ${formatLargeNumber(
  //   value,
  //   localization?.numberFormat
  // )}`;
  return ` ${formatLargeNumber(
    value,
    resolveEffectiveNumberFormat(localization),
    mode,
  )}`;
};

export const getDateRange = (key: string) => {
  const today = new Date();
  const to = new Date(today);
  const from = new Date(today);

  switch (key) {
    case "next30":
      // 0 to 30 days ago (matches SQL: <= 30)
      from.setDate(today.getDate() - 30);
      to.setDate(today.getDate());
      break;

    case "next60":
      // 31 to 60 days ago (matches SQL: > 30 AND <= 60)
      from.setDate(today.getDate() - 60);
      to.setDate(today.getDate() - 31);
      break;

    case "next90":
      // 61 to 90 days ago (matches SQL: > 60 AND <= 90)
      from.setDate(today.getDate() - 90);
      to.setDate(today.getDate() - 61);
      break;

    case "beyond90":
      // 91+ days ago (matches SQL: > 90)
      from.setFullYear(1900, 0, 1);
      to.setDate(today.getDate() - 91);
      break;

    default:
      throw new Error("Invalid key provided");
  }

  const format = (d: Date) => d.toISOString().split("T")[0];

  return {
    from: format(from),
    to: format(to),
  };
};

export const limitPercentageDecimals: React.FormEventHandler<
  HTMLInputElement | HTMLTextAreaElement
> = (event) => {
  const { value } = event.currentTarget;
  const [integerPart = "", decimalPart = ""] = value.split(".");

  if (decimalPart.length > 4) {
    event.currentTarget.value = `${integerPart}.${decimalPart.slice(0, 4)}`;
  }
};

const isPlainObject = (value: any) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isEmptyRowObject = (obj: any) => {
  if (!isPlainObject(obj)) return false;

  // Object is empty ONLY if it has NO meaningful values
  return !Object.values(obj).some((val) => {
    if (Array.isArray(val)) return val.length > 0;

    // KEEP 0, false, valid numbers
    return val !== null && val !== undefined && val !== "";
  });
};

export const cleanEmptyArrayRows = (data: any): any => {
  if (Array.isArray(data)) {
    // Clean each item first, then drop empty row objects
    const cleaned = data
      .map((item) => cleanEmptyArrayRows(item))
      .filter((item) => !isEmptyRowObject(item));

    return cleaned;
  }

  if (isPlainObject(data)) {
    const result: any = {};
    Object.entries(data).forEach(([key, value]) => {
      result[key] = cleanEmptyArrayRows(value);
    });

    return result;
  }
  return data;
};

export const withPercentageClamp = (
  componentProps: Record<string, unknown> = {},
) => ({
  ...componentProps,
  inputProps: {
    ...(componentProps as Record<string, unknown>).inputProps,
    onInput: limitPercentageDecimals,
  },
});

export const sanitizeRestForInsurerDetails = (data: any): any => {
  if (data?.insurerDetails) {
    const sanitizedInsurerDetails = data.insurerDetails.map((detail: any) => {
      const { insurerName, ...remainingDetail } = detail;
      return remainingDetail;
    });

    return {
      ...data,
      insurerDetails: sanitizedInsurerDetails,
    };
  }

  return data; // fallback
};

export const maskMobileNumber = (mobile: string): string => {
  if (!mobile || mobile.length < 4) return mobile;
  const first = mobile.charAt(0);
  const lastTwo = mobile.slice(-2);
  const middle = "*".repeat(mobile.length - 3);
  return `${first}${middle}${lastTwo}`;
};

export const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return email;
  const [username, domain] = email.split("@");
  if (username.length <= 2) return email;
  const visibleChars = Math.min(2, username.length - 1);
  const maskedUsername =
    username.substring(0, visibleChars) +
    "*".repeat(username.length - visibleChars);
  return `${maskedUsername}@${domain}`;
};
