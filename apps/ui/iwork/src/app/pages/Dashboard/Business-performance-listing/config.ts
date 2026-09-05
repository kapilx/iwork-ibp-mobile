import {
  formatCurrencyByLocalization,
  formatLargeCurrency,
  formatNumberByLocalization,
  LocalizationConfig,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import { Value } from "../../../components/CompanyProfileKPICard/styles";

export const conditionalCurrencyFormatter = (
  params: any,
  localization?: LocalizationConfig
) => {
  const { value, api, node } = params;
  if (value === null || value === undefined) return "--";

  if (node?.rowPinned) return formatCurrencyByLocalization(value);
  const displayedCount = api?.getDisplayedRowCount?.() ?? 0;
  const isLast3 = (node?.rowIndex ?? 0) >= displayedCount - 3;

  if (isLast3) {
    const n = Number(value);
    if (!isFinite(n)) return "--";
    return `${n.toFixed(2)}%`;
  }
  return formatLargeCurrency(value, localization);
};
export const conditionalTooltipFormatter = (params: any) => {
  const { value, api, node } = params;
  if (value === null || value === undefined) return "--";

  // pinned rows → show full comma-separated number
  if (node?.rowPinned) return formatNumberByLocalization(value);

  const displayedCount = api?.getDisplayedRowCount?.() ?? 0;
  const isLast3 = (node?.rowIndex ?? 0) >= displayedCount - 3;

  if (isLast3) {
    // percentage rows: keep % with 2 decimals
    const s = String(value).trim();
    if (s.endsWith("%")) return s; // already a percent string
    const n = Number(s);
    if (!Number.isFinite(n)) return "--";
    return `${n.toFixed(2)}%`;
  }

  // currency rows: comma-separated full number (no currency symbol per your ask)
  return formatNumberByLocalization(value);
};

export const getColumns = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "",
    field: "label",
    headerTooltip: "Row label",
    disableSort: true,
    valueFormatter: ({ value }) => value ?? "--",
    // pinned: "left",
  },
  {
    headerName: "ANNUAL",
    field: "annual",
    headerTooltip: "Annual",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "APR",
    field: "april",
    headerTooltip: "APR",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "MAY",
    field: "may",
    headerTooltip: "MAY",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "JUN",
    field: "june",
    headerTooltip: "JUN",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "QTR 1",
    field: "q1",
    headerTooltip: "QTR 1",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "JUL",
    field: "july",

    headerTooltip: "JUL",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "AUG",
    field: "august",
    headerTooltip: "AUG",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "SEP",
    field: "september",
    headerTooltip: "SEP",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "QTR 2",
    field: "q2",
    headerTooltip: "QTR 2",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "OCT",
    field: "october",
    headerTooltip: "OCT",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "NOV",
    field: "november",
    headerTooltip: "NOV",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "DEC",
    field: "december",
    headerTooltip: "DEC",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "QTR 3",
    field: "q3",
    headerTooltip: "QTR 3",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "JAN",
    field: "january",
    headerTooltip: "JAN",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "FEB",
    field: "february",
    headerTooltip: "FEB",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "MAR",
    field: "march",
    headerTooltip: "MAR",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
  {
    headerName: "QTR 4",
    field: "q4",
    headerTooltip: "QTR 4",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    // Pivoted month/quarter matrix: one row per metric (Target/Achieved/
    // etc), one column per month — "sort by April" has no coherent meaning
    // across metric rows. setSort is also a no-op on this page (index.tsx),
    // so this was showing a misleading, fully decorative sort arrow.
    disableSort: true,
    valueFormatter: (params: any) =>
      conditionalCurrencyFormatter({ ...params, localization }),
  },
];

export const businessPerformanceBreadcrumbs = (
  businessPerformanceValues: any
) => [
  {
    label: "Dashboard",
    path: "/dashboard",
    state: { filters: businessPerformanceValues },
  },
  { label: "Business performance - Breakup" },
];

export const onCellClickFilterNavighationMap = {
  april: {
    month: { value: "April", label: "April" },
    quarter: {
      value: "Q1",
      label: "Q1",
    },
  },
  may: {
    month: { value: "May", label: "May" },
    quarter: { value: "Q1", label: "Q1" },
  },
  june: {
    month: { value: "June", label: "June" },
    quarter: { value: "Q1", label: "Q1" },
  },
  july: {
    month: { value: "July", label: "July" },
    quarter: { value: "Q2", label: "Q2" },
  },
  august: {
    month: { value: "August", label: "August" },
    quarter: { value: "Q2", label: "Q2" },
  },
  september: {
    month: { value: "September", label: "September" },
    quarter: { value: "Q2", label: "Q2" },
  },
  october: {
    month: { value: "October", label: "October" },
    quarter: { value: "Q3", label: "Q3" },
  },
  november: {
    month: { value: "November", label: "November" },
    quarter: { value: "Q3", label: "Q3" },
  },
  december: {
    month: { value: "December", label: "December" },
    quarter: { value: "Q3", label: "Q3" },
  },
  january: {
    month: { value: "January", label: "January" },
    quarter: { value: "Q4", label: "Q4" },
  },
  february: {
    month: { value: "February", label: "February" },
    quarter: { value: "Q4", label: "Q4" },
  },
  march: {
    month: { value: "March", label: "March" },
    quarter: { value: "Q4", label: "Q4" },
  },

  q1: {
    quarter: { value: "Q1", label: "Q1" },
    month: { value: "ALL", label: "ALL" },
  },
  q2: {
    quarter: { value: "Q2", label: "Q2" },
    month: { value: "ALL", label: "ALL" },
  },
  q3: {
    quarter: { value: "Q3", label: "Q3" },
    month: { value: "ALL", label: "ALL" },
  },
  q4: {
    quarter: { value: "Q4", label: "Q4" },
    month: { value: "ALL", label: "ALL" },
  },
};

/** Financial year (April–March) that contains a "YYYY-MM-DD" date. */
const financialYearStartOf = (isoDate?: string | null) => {
  if (!isoDate) return undefined;
  const year = Number(isoDate.slice(0, 4));
  const monthIndex = Number(isoDate.slice(5, 7)) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return undefined;
  return monthIndex <= 2 ? year - 1 : year;
};

export const onCellClickFilterNavighationMapForOpportunity = (
  financialYear: { label: string; value: string } | null,
  field?: string,
  pickedRange?: { from?: string | null; to?: string | null }
) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth();

  const customFrom = pickedRange?.from || "";
  const customTo = pickedRange?.to || "";

  const [labelStart, labelEnd] = (financialYear?.label ?? "").split("-");

  // `"".split("-")` yields `[""]`, so with no financialYear labelStart is an
  // empty string — NOT nullish — and the old `??` let it through, emitting
  // "-04-01".
  //
  // Year fallback prefers the FY containing the user's own From date: picking
  // From/To CLEARS financialYear (businessPerformanceConfig `from`/`to`
  // fields), so it is the only period signal that survives the hop. Both ends
  // come off the same anchor, otherwise a From date outside the current FY
  // yields a straddling two-year window on the yearEnd-based columns.
  const anchorStart =
    financialYearStartOf(customFrom) ??
    (month <= 2 ? currentYear - 1 : currentYear);

  const yearStart = labelStart || anchorStart.toString();
  const yearEnd = labelEnd || (anchorStart + 1).toString();

  const dateMap: Record<
    string,
    {
      from: string;
      to: string;
      month: {
        value: string;
        label: string;
      } | null;
      financialYear?: { label: string; value: string } | null;
    }
  > = {
    // "Annual" is the whole-filter column, so a user-picked range IS the
    // period — forward both ends verbatim rather than widening back out to a
    // full FY. Month/quarter columns below stay FY-derived: the column itself
    // names the sub-period, the anchor above just supplies the year.
    annual: {
      from: customFrom || `${yearStart}-04-01`,
      to: customTo || `${yearEnd}-03-31`,
      month: null,
      financialYear: financialYear || null,
    },
    april: {
      from: `${yearStart}-04-01`,
      to: `${yearStart}-04-30`,
      month: { value: "April", label: "April" },
      financialYear: null,
    },
    may: {
      from: `${yearStart}-05-01`,
      to: `${yearStart}-05-31`,
      month: { value: "May", label: "May" },
      financialYear: null,
    },
    june: {
      from: `${yearStart}-06-01`,
      to: `${yearStart}-06-30`,
      month: { value: "June", label: "June" },
      financialYear: null,
    },
    july: {
      from: `${yearStart}-07-01`,
      to: `${yearStart}-07-31`,
      month: { value: "July", label: "July" },
      financialYear: null,
    },
    august: {
      from: `${yearStart}-08-01`,
      to: `${yearStart}-08-31`,
      month: { value: "August", label: "August" },
      financialYear: null,
    },
    september: {
      from: `${yearStart}-09-01`,
      to: `${yearStart}-09-30`,
      month: { value: "September", label: "September" },
      financialYear: null,
    },
    october: {
      from: `${yearStart}-10-01`,
      to: `${yearStart}-10-31`,
      month: { value: "October", label: "October" },
      financialYear: null,
    },
    november: {
      from: `${yearStart}-11-01`,
      to: `${yearStart}-11-30`,
      month: { value: "November", label: "November" },
      financialYear: null,
    },
    december: {
      from: `${yearStart}-12-01`,
      to: `${yearStart}-12-31`,
      month: { value: "December", label: "December" },
      financialYear: null,
    },
    january: {
      from: `${yearEnd}-01-01`,
      to: `${yearEnd}-01-31`,
      month: { value: "January", label: "January" },
      financialYear: null,
    },
    february: {
      from: `${yearEnd}-02-01`,
      to: `${yearEnd}-02-28`,
      month: { value: "February", label: "February" },
      financialYear: null,
    },
    march: {
      from: `${yearEnd}-03-01`,
      to: `${yearEnd}-03-31`,
      month: { value: "March", label: "March" },
      financialYear: null,
    },
    q1: {
      from: `${yearStart}-04-01`,
      to: `${yearStart}-06-30`,
      month: null,
      financialYear: null,
    },
    q2: {
      from: `${yearStart}-07-01`,
      to: `${yearStart}-09-30`,
      month: null,
      financialYear: null,
    },
    q3: {
      from: `${yearStart}-10-01`,
      to: `${yearStart}-12-31`,
      month: null,
      financialYear: null,
    },
    q4: {
      from: `${yearEnd}-01-01`,
      to: `${yearEnd}-03-31`,
      month: null,
      financialYear: null,
    },
  };

  return field ? dateMap[field] : null;
};
