// NOTE: search/sort query-string parsing lives in
// libs/service-lib/src/lib/utils/helper.utils.ts (mapSearchParams,
// mapSortParams) — that's the version actually wired up across services.
// This file previously had a second, unused set of near-identical parsers
// (parseSearchParams/parseSortParams); removed to avoid the two diverging.

export const convertSafeStringToInteger = (value: string | number) => {
  if (typeof value === "number") {
    // Return finite numbers (accept decimals too)
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    let updatedValue = value.trim().replaceAll(",", "").replaceAll(" ", "");
    // Check if it's a valid number string (integer or decimal, positive or negative)
    if (/^-?\d+(\.\d+)?$/.test(updatedValue)) {
      const num = Number(updatedValue);
      return Number.isFinite(num) ? num : null;
    }
  }
  
  return null;
};
