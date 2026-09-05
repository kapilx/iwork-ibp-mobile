// "2025-2026" for any date inside FY 2025-26 (Apr 1 2025 .. Mar 31 2026).
// Stored on policy.financial_year / endorsement.financial_year, derived from
// dateOfIncome. UTC getters on purpose: getDateRange builds its FY boundaries
// with Date.UTC, so the label and the filter ranges agree on where April starts.
export const financialYearLabel = (
  dateOfIncome?: Date | string | null
): string | null => {
  if (!dateOfIncome) return null;
  const d = dateOfIncome instanceof Date ? dateOfIncome : new Date(dateOfIncome);
  if (Number.isNaN(d.getTime())) return null;
  // Jan-Mar belong to the FY that started the previous April.
  const startYear =
    d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
};

// Get the date range based on the filter and financial year
export const getDateRange = (
  filter?: string,
  financialYear?: number,
  tillDate = false,
  // When true, the current quarter is NOT clipped to "today" — the full
  // quarter span is returned. Needed where targets (which are set for future
  // months) must be summed for the whole quarter, not just up to today.
  fullPeriod = false
): { start?: Date; end?: Date } => {
  const now = new Date();
  const fiscalYearStartYear =
    financialYear ??
    (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1);

  // "__ALL__" is the UI sentinel for "all quarters" — same window as FullYear
  if (!filter || filter === "FullYear" || filter === "__ALL__") {
    const start = new Date(Date.UTC(fiscalYearStartYear, 3, 1, 0, 0, 0, 0)); // April 1, UTC
    const end = new Date(
      Date.UTC(fiscalYearStartYear + 1, 2, 31, 23, 59, 59, 999)
    ); // March 31, UTC
    return { start, end: tillDate ? now : end };
  }

  const months: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  const quarterMap: Record<string, { month: number; yearOffset: number }> = {
    Q1: { month: 3, yearOffset: 0 },
    Q2: { month: 6, yearOffset: 0 },
    Q3: { month: 9, yearOffset: 0 },
    Q4: { month: 0, yearOffset: 1 },
  };

  if (quarterMap[filter]) {
    const { month, yearOffset } = quarterMap[filter];
    const year = fiscalYearStartYear + yearOffset;
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const nextQuarterStart = new Date(Date.UTC(year, month + 3, 1, 0, 0, 0, 0));
    // Use midnight of the last day of the quarter to avoid timezone
    // conversions pushing the date into the next month when converted to
    // local time (e.g. Jul 1 instead of Jun 30). Consumers that require an
    // inclusive end can adjust accordingly.
    const end = new Date(Date.UTC(year, month + 3, 0, 0, 0, 0, 0));
    const isCurrentQuarter = now >= start && now < nextQuarterStart;
    return { start, end: !fullPeriod && isCurrentQuarter ? now : end };
  }

  const monthIndex = months[filter];
  if (monthIndex !== undefined) {
    const year = monthIndex < 3 ? fiscalYearStartYear + 1 : fiscalYearStartYear;
    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
    // Similar to the quarter logic, use midnight to prevent timezone
    // offsets from rolling the date into the following month when
    // represented in local time.
    const end = new Date(Date.UTC(year, monthIndex + 1, 0, 0, 0, 0, 0));
    // const isCurrentMonth =
    //   now.getUTCMonth() === monthIndex && now.getUTCFullYear() === year;
    // return { start, end: isCurrentMonth ? now : end };
    return { start, end: end };
  }

  return {};
};
// Get the date range based on the filter and financial year with out timestamps
export const getDateRangeWithoutTimestamp = (
  filter?: string,
  financialYear?: number,
  tillDate = false
): { start?: Date; end?: Date } => {
  const now = new Date();
  const fiscalYearStartYear =
    financialYear ??
    (now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1);

  // "__ALL__" is the UI sentinel for "all quarters" — same window as FullYear
  if (!filter || filter === "FullYear" || filter === "__ALL__") {
    const start = new Date(Date.UTC(fiscalYearStartYear, 3, 1, 0)); // April 1, UTC
    const end = new Date(Date.UTC(fiscalYearStartYear + 1, 2, 31)); // March 31, UTC
    return { start, end: tillDate ? now : end };
  }

  const months: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  const quarterMap: Record<string, { month: number; yearOffset: number }> = {
    Q1: { month: 3, yearOffset: 0 },
    Q2: { month: 6, yearOffset: 0 },
    Q3: { month: 9, yearOffset: 0 },
    Q4: { month: 0, yearOffset: 1 },
  };

  if (quarterMap[filter]) {
    const { month, yearOffset } = quarterMap[filter];
    const year = fiscalYearStartYear + yearOffset;
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const nextQuarterStart = new Date(Date.UTC(year, month + 3, 1, 0, 0, 0, 0));
    // Use midnight of the last day of the quarter to avoid timezone
    // conversions pushing the date into the next month when converted to
    // local time (e.g. Jul 1 instead of Jun 30). Consumers that require an
    // inclusive end can adjust accordingly.
    const end = new Date(Date.UTC(year, month + 3, 0, 0, 0, 0, 0));
    const isCurrentQuarter = now >= start && now < nextQuarterStart;
    return { start, end: isCurrentQuarter ? now : end };
  }

  const monthIndex = months[filter];
  if (monthIndex !== undefined) {
    const year = monthIndex < 3 ? fiscalYearStartYear + 1 : fiscalYearStartYear;
    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
    // Similar to the quarter logic, use midnight to prevent timezone
    // offsets from rolling the date into the following month when
    // represented in local time.
    const end = new Date(Date.UTC(year, monthIndex + 1, 0, 0, 0, 0, 0));
    // const isCurrentMonth =
    //   now.getUTCMonth() === monthIndex && now.getUTCFullYear() === year;
    // return { start, end: isCurrentMonth ? now : end };
    return { start, end: end };
  }

  return {};
};
