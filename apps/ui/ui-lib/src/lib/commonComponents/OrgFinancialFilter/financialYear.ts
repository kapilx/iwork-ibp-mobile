// Indian financial year helpers (FY runs Apr 1 – Mar 31). Used to prefill the
// period selector from the current date and to resolve a FY/quarter/month
// selection into an expiryDate range the backend filters on.

import {
  generateYearOptions,
  getCurrentFinancialYearDefault,
  getMonthsForQuarter,
} from "../../constants";
import { TimelineValue } from "./types";

// Current FY start year (Apr–Mar) via the shared app helper, so this page and
// the rest of the app agree on "which FY is current".
const currentFyStartYear = (): number =>
  Number(getCurrentFinancialYearDefault().value);

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

// FY month order starting at April, derived from the same getMonthsForQuarter
// every smart-search quarter/month field uses — so this page can never drift
// from the rest of the app on "which months are in Q2".
const FY_MONTH_NAMES = QUARTERS.flatMap((q) =>
  getMonthsForQuarter(q as "Q1" | "Q2" | "Q3" | "Q4").map((m) => m.value)
);
export const FY_MONTHS = FY_MONTH_NAMES;

// Quarter → the three FY month indexes it covers (0 = April … 11 = March),
// derived positionally from the same source (each quarter contributes 3
// consecutive FY months in order).
const QUARTER_MONTHS: Record<string, number[]> = Object.fromEntries(
  QUARTERS.map((q, i) => [q, [i * 3, i * 3 + 1, i * 3 + 2]])
);

// Current quarter label from a date.
const currentQuarter = (d: Date): string => {
  const fyIndex = (d.getMonth() + 9) % 12; // shift so April → 0
  return QUARTERS[Math.floor(fyIndex / 3)];
};

// Matches the app-wide FY label convention (getCurrentFinancialYearDefault,
// generateYearOptions, etc.): "2026-2027", no "FY" prefix.
export const fyLabel = (startYear: number): string =>
  `${startYear}-${startYear + 1}`;

// The FY start years to offer. Delegates to the app-wide
// generateYearOptions so the period popover shows exactly the same years as
// every other FY dropdown (current FY down to environment.financialStartYear) —
// this used to hardcode "current + 3 back", which is why Enhanced pages were
// the only screens still offering 2023-2024.
export const financialYearOptions = (_now?: Date): number[] =>
  generateYearOptions().map((o) => Number(o.value));

// Default timeline = current FY + current quarter (matches the header chip).
export const defaultTimeline = (now: Date): TimelineValue => ({
  financialYear: currentFyStartYear(),
  quarter: currentQuarter(now),
  month: "",
  fromDate: "",
  toDate: "",
});

// Short label for the header button, e.g. "2026-2027 · Q2".
// "YYYY-MM-DD" -> "DD/MM/YYYY"; returns the input unchanged if it doesn't match.
const toDisplayDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : isoDate;
};

export const summarizeTimeline = (t: TimelineValue): string => {
  if (isBusinessMonthMode(t)) {
    const months = t.businessMonths ?? [];
    if (!months.length && t.fromDate && t.toDate)
      return `${toDisplayDate(t.fromDate)} – ${toDisplayDate(t.toDate)}`;
    const parts = [fyLabel(t.financialYear)];
    if (months.length === 1) parts.push(months[0]);
    else if (months.length > 1)
      parts.push(`${months[0]} +${months.length - 1}`);
    return parts.join(" · ");
  }
  // Picking a month now prefills From/To with that month's span, so dates
  // alone no longer imply a custom range. Prefer the quarter/month label when
  // one is set; a genuine custom range clears both, so it still lands here.
  if (t.fromDate && t.toDate && !t.month && !t.quarter)
    return `${toDisplayDate(t.fromDate)} – ${toDisplayDate(t.toDate)}`;
  const parts = [fyLabel(t.financialYear)];
  if (t.month) parts.push(t.month);
  else if (t.quarter) parts.push(t.quarter);
  return parts.join(" · ");
};

const iso = (y: number, m0: number, d: number): string =>
  `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Calendar (year, monthIndex0) for an FY month position (0 = April of startYear,
// 9 = January of startYear+1).
const calendarFor = (startYear: number, fyPos: number): [number, number] => {
  const calMonth0 = (fyPos + 3) % 12;
  const year = fyPos <= 8 ? startYear : startYear + 1;
  return [year, calMonth0];
};

const lastDay = (year: number, month0: number): number =>
  new Date(year, month0 + 1, 0).getDate();

// Business-month mode is opt-in per page; an absent periodMode is income mode,
// which is what every page other than Biz Done Enhanced (and every saved view
// written before the toggle existed) carries.
export const isBusinessMonthMode = (t: TimelineValue): boolean =>
  t.periodMode === "businessMonth";

// Earliest → latest selected business month, as one contiguous span. Mirrors
// deriveBusinessMonthDateRange on the classic Biz Done page, but expressed in
// FY month positions so it reuses calendarFor/lastDay instead of redoing the
// Apr–Dec / Jan–Mar year split.
export const businessMonthRange = (
  financialYear: number,
  businessMonths: string[] | undefined
): { from: string; to: string } | null => {
  const positions = (businessMonths ?? [])
    .map((m) => FY_MONTH_NAMES.indexOf(m))
    .filter((p) => p >= 0)
    .sort((a, b) => a - b);
  if (!positions.length) return null;
  const [sy, sm] = calendarFor(financialYear, positions[0]);
  const [ey, em] = calendarFor(financialYear, positions[positions.length - 1]);
  return { from: iso(sy, sm, 1), to: iso(ey, em, lastDay(ey, em)) };
};

// Resolve a timeline into an expiryDate {from, to} range (YYYY-MM-DD). Explicit
// dates win; then month; then quarter; else the whole FY. `financialYear` is
// only populated in the whole-FY case, so callers can send it alongside
// from/to the same way the non-Enhanced listing pages do when a bare FY
// (no quarter/month/custom range) is selected.
export const timelineToRange = (
  t: TimelineValue
): { from?: string; to?: string; financialYear?: number } => {
  if (t.fromDate || t.toDate) return { from: t.fromDate, to: t.toDate };

  // Business mode replaces quarter/month with the business-month span. With
  // nothing picked it falls through to the whole-FY branch below, same as an
  // untouched income-mode timeline.
  if (isBusinessMonthMode(t)) {
    const range = businessMonthRange(t.financialYear, t.businessMonths);
    return (
      range ?? {
        from: iso(t.financialYear, 3, 1),
        to: iso(t.financialYear + 1, 2, 31),
        financialYear: t.financialYear,
      }
    );
  }

  if (t.month) {
    const fyPos = FY_MONTH_NAMES.indexOf(t.month);
    if (fyPos >= 0) {
      const [y, m0] = calendarFor(t.financialYear, fyPos);
      return { from: iso(y, m0, 1), to: iso(y, m0, lastDay(y, m0)) };
    }
  }

  if (t.quarter && QUARTER_MONTHS[t.quarter]) {
    const months = QUARTER_MONTHS[t.quarter];
    const [sy, sm] = calendarFor(t.financialYear, months[0]);
    const [ey, em] = calendarFor(t.financialYear, months[2]);
    return { from: iso(sy, sm, 1), to: iso(ey, em, lastDay(ey, em)) };
  }

  // Whole FY: Apr 1 (startYear) – Mar 31 (startYear + 1).
  return {
    from: iso(t.financialYear, 3, 1),
    to: iso(t.financialYear + 1, 2, 31),
    financialYear: t.financialYear,
  };
};
