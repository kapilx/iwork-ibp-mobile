// Shared constants for the Insurer Rewards feature.

// Period-type toggle values (match backend query contract).
export const PERIOD_TYPE = {
    BUSINESS_MONTH: "BUSINESS_MONTH",
    INCOME_MONTH: "INCOME_MONTH",
} as const;

export type PeriodType = (typeof PERIOD_TYPE)[keyof typeof PERIOD_TYPE];

// Reward category lookup keys (lookup_data.lookUpKey). Phase 1: only Generic
// selectable; Specific reserved for a future phase (BR-001).
export const REWARD_CATEGORY_KEY = {
    GENERIC: "GENERIC",
    SPECIFIC: "SPECIFIC",
} as const;

// Display + month-grouping format used across the listing and details views.
export const MONTH_LABEL_FORMAT = "MMM YYYY"; // e.g. "Apr 2026"
export const BUSINESS_MONTH_VALUE_FORMAT = "YYYY-MM-01"; // e.g. "2026-04-01"

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Generates the 12 business-month options (Apr–Mar) for a given FY start year.
// startYear=2026 → Apr 2026 .. Mar 2027.
export const generateBusinessMonthOptions = (startYear: number): { label: string; value: string }[] => {
    const opts: { label: string; value: string }[] = [];
    // Apr–Dec of startYear
    for (let m = 3; m <= 11; m++) {
        const mm = String(m + 1).padStart(2, "0");
        opts.push({ label: `${MONTH_NAMES[m]} ${startYear}`, value: `${startYear}-${mm}-01` });
    }
    // Jan–Mar of startYear + 1
    for (let m = 0; m <= 2; m++) {
        const mm = String(m + 1).padStart(2, "0");
        opts.push({ label: `${MONTH_NAMES[m]} ${startYear + 1}`, value: `${startYear + 1}-${mm}-01` });
    }
    return opts;
};

// Current financial-year start year based on today (Apr–Mar FY).
// e.g. any date in Apr 2026 .. Mar 2027 -> 2026.
export const getCurrentFinancialYearStart = (): number => {
    const today = new Date();
    return today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
};

// Returns the first and last date of a financial year as ISO strings.
export const getFYDateRange = (startYear: number): { from: string; to: string } => ({
    from: `${startYear}-04-01`,
    to: `${startYear + 1}-03-31`,
});

// Phase-1 default (FY 2026-27). Kept for backwards-compat; prefer generateBusinessMonthOptions.
export const BUSINESS_MONTH_OPTIONS = generateBusinessMonthOptions(2026);
