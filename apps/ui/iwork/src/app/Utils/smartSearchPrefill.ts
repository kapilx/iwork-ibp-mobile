import { getCurrentFinancialYearDefault } from "@ui/ui-lib";
import { ACTIVE } from "../constants";

type SmartSearchValues = Record<string, any>;

/**
 * Fills the Financial Year with the current FY only when the given values have
 * none, so a saved view / server config that sets it still wins. Used to seed
 * the FY default on opportunity listings (load + reset).
 */
export const withCurrentFinancialYearDefault = (
  values?: SmartSearchValues,
): SmartSearchValues =>
  values?.financialYear
    ? values
    : { ...(values || {}), financialYear: getCurrentFinancialYearDefault() };

/** True when the given smart-search values carry a non-empty `state` selection. */
export const hasStatusSelection = (values?: SmartSearchValues): boolean => {
  const state = (values || {}).state;
  return Array.isArray(state) ? state.length > 0 : Boolean(state);
};

export const withActiveLostStatusDefault = (
  values?: SmartSearchValues,
  userHasSavedStatus = false,
): SmartSearchValues =>
  userHasSavedStatus
    ? (values as SmartSearchValues)
    : { ...(values || {}), state: [ACTIVE] };

const extractStartYear = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const direct = Number(trimmed);
    if (Number.isFinite(direct)) {
      return direct;
    }

    const yearMatch = trimmed.match(/\d{4}/);
    if (yearMatch?.[0]) {
      const matchedYear = Number(yearMatch[0]);
      if (Number.isFinite(matchedYear)) {
        return matchedYear;
      }
    }
  }

  return null;
};

export const getFinancialYearRange = (
  financialYear: unknown,
): { from: string; to: string } | null => {
  const yearValue =
    typeof financialYear === "object" && financialYear !== null
      ? (financialYear as { value?: string | number; label?: string }).value ??
        (financialYear as { value?: string | number; label?: string }).label
      : financialYear;

  const startYear = extractStartYear(yearValue);
  if (!Number.isFinite(startYear)) return null;

  return {
    from: `${startYear}-04-01`,
    to: `${startYear + 1}-03-31`,
  };
};

export const ensureFromToFromFinancialYear = (
  values?: SmartSearchValues,
): SmartSearchValues | undefined => {
  if (!values) return values;

  const hasFromToRange = Boolean(values.from) && Boolean(values.to);
  if (hasFromToRange || !values.financialYear) {
    return values;
  }

  const fyRange = getFinancialYearRange(values.financialYear);
  if (!fyRange) return values;

  return {
    ...values,
    from: fyRange.from,
    to: fyRange.to,
  };
};

// Escapes regex metacharacters so a dynamic key can't alter the pattern (ReDoS / injection).
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getSearchFilterValue = (
  encodedSearch: string | null,
  key: string,
): string | null => {
  if (!encodedSearch) return null;
  const decodedSearch = decodeURIComponent(encodedSearch);
  const match = decodedSearch.match(
    new RegExp(`${escapeRegExp(key)}:\\[([^\\]]*)\\]`),
  );
  if (!match?.[1]) return null;
  return match[1];
};
