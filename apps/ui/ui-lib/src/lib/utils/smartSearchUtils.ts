import { getCurrentFinancialYearDefault } from "../constants";

// Moved here from ../commonComponents/SmartSearch (a UI component file) — that
// import pulled the entire SmartSearch component tree (and everything it in
// turn imports: FormComponent, FormFieldRenderer, CurrencyInput,
// useLocalization, useApiQuery, and transitively the root ui-lib barrel) into
// what should be a small pure-utility module, closing a large circular
// dependency back into redux/store.ts. This is a pure, dependency-free
// function, safe to own here directly instead of importing it.
export const addPeriodToDate = (startDate: Date, periodLabel: string): Date => {
  const result = new Date(startDate);
  const lower = periodLabel.toLowerCase();
  const regex = /(\d+)\s*(month|year|day)/i;
  const match = lower.match(regex);

  if (!match) return result;

  const number = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "month":
      result.setMonth(result.getMonth() + number);
      break;
    case "year":
      result.setFullYear(result.getFullYear() + number);
      break;
    case "day":
      result.setDate(result.getDate() + number);
      break;
    default:
      break;
  }
  result.setDate(result.getDate() - 1);

  return result;
};

const monthMap: Record<string, number> = {
  ALL: 0,
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

// Owner (ownerId) always defaults to the logged-in user, never the value the
// backend has stored on the saved/system preference. Reads the session user
// the same way the rest of the app does (sessionStorage "user").
const sessionOwner = (): { value: string; label: string } | null => {
  try {
    const u = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (!u?.userId) return null;
    const label = [u.firstName, u.lastName?.trim()].filter(Boolean).join(" ");
    return { value: String(u.userId), label };
  } catch {
    return null;
  }
};

export const normalizeSmartSearchValues = (
  smartSearchValues: Record<string, any>,
  isUserConfig: boolean
): Record<string, any> => {
  const updatedValues: Record<string, any> = {};
  const currentFY = getCurrentFinancialYearDefault();
  const owner = sessionOwner();

  Object.entries(smartSearchValues || {}).forEach(([entityKey, filters]) => {
    // For system config, auto-update any outdated financialYear to the current FY
    if (!isUserConfig && filters?.financialYear?.value) {
      const savedYear = parseInt(filters.financialYear.value, 10);
      const currentFYYear = parseInt(currentFY.value, 10);
      if (savedYear < currentFYYear) {
        filters = {
          ...filters,
          financialYear: currentFY,
          from: "",
          to: "",
        };
      }
    }

    if (Object.keys(filters)?.length === 0) {
      updatedValues[entityKey] = isUserConfig ? undefined : {};
      return;
    }

    if (
      entityKey === "DASHBOARD" ||
      entityKey === "BIZ_DONE_REPORT" ||
      entityKey === "LOCALIZATION_PREFERENCE"
    ) {
      updatedValues[entityKey] = { ...filters };
      return;
    }

    let newFrom = filters.from || "";
    let newTo = filters.to || "";

    const { period, financialYear, month } = filters;
    if (!period && !financialYear) {
      updatedValues[entityKey] = {
        ...filters,
        from: filters.from,
        to: filters.to,
      };
      return;
    }

    let newPeriod = filters.period || null;
    let newFinancialYear = filters.financialYear || null;

    // Case 1: If period exists
    if (period && period.label) {
      const baseFrom = new Date();
      const computedTo = addPeriodToDate(baseFrom, period.label);

      newFrom = baseFrom.toISOString().split("T")[0];
      newTo = computedTo.toISOString().split("T")[0];

      // clear financialYear if period exists
      newFinancialYear = null;
    }
    // Case 2: If financial year exists and month is empty
    else if (financialYear && financialYear.value && !month) {
      let startYear = parseInt(financialYear.value);
      let endYear = startYear + 1;

      const fyStart = new Date(`${startYear}-04-01`);
      const fyEnd = new Date(`${endYear}-03-31`);

      newFrom = fyStart.toISOString().split("T")[0];
      newTo = fyEnd.toISOString().split("T")[0];

      // clear period if financialYear exists
      newPeriod = null;
    }
    // Case 3: If month exists
    else if (financialYear && financialYear.value && month && month.label) {
      const year = parseInt(financialYear.value);
      const selectedMonth = monthMap[month.value];

      if (selectedMonth === 0) {
        // "All" → full FY
        const fyStart = new Date(`${year}-04-01`);
        const fyEnd = new Date(`${year + 1}-03-31`);

        newFrom = fyStart.toISOString().split("T")[0];
        newTo = fyEnd.toISOString().split("T")[0];
      } else {
        const paddedMonth = selectedMonth.toString().padStart(2, "0");
        const startDate = new Date(`${year}-${paddedMonth}-01`);
        const endDate = new Date(year, selectedMonth, 0 + 1); // last day of month

        newFrom = startDate.toISOString().split("T")[0];
        newTo = endDate.toISOString().split("T")[0];
      }

      // clear period if financialYear exists with month
      newPeriod = null;
    }

    updatedValues[entityKey] = {
      ...filters,
      from: newFrom,
      to: newTo,
      period: newPeriod,
      financialYear: newFinancialYear,
    };
  });

  // Owner picker (`ownerId`) always seeds to the logged-in user, never the
  // stored value. Leaves the `owner` view-by toggle alone.
  // ponytail: only rewrites when the config already carries ownerId; configs
  // that omit it still seed empty — add per-screen seeding if that's not enough.
  if (owner) {
    Object.keys(updatedValues).forEach((k) => {
      const f = updatedValues[k];
      if (f && typeof f === "object" && "ownerId" in f) {
        updatedValues[k] = { ...f, ownerId: owner };
      }
    });
  }

  return updatedValues;
};
