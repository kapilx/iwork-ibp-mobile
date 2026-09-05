// Biz Done Report Enhanced reuses the original page's columns, KPI mapping,
// and field builders verbatim — only the filter layout (toolbar/drawer split
// via OrgFinancialFilter) differs, so nothing here is redefined.
export * from "../../BizDownReportPage/BizDownReportListing/tableConfig";

import { formatCurrencyByLocalization } from "@ui/ui-lib";

// Companies table (entityType=companySummary) for the portfolio-style flow:
// company rows first, View details expands that company's policy records
// below. Row keys come from the companySummary localization field config
// (camelCase labels — see calculateTotals in policy-report.ts), so currency
// getters fall back across the label variants an org config may carry.
const currencyFormatter =
  (localization: any) =>
  ({ value }: any) =>
    value !== null && value !== undefined && value !== ""
      ? formatCurrencyByLocalization(Number(value), localization)
      : "--";

export const getCompanyColumns = (localization: any) => [
  {
    headerName: "Customer Name",
    field: "customerName",
    tooltipField: "customerName",
    headerTooltip: "Customer Name",
    minWidth: 220,
    flex: 1,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "clickable-cell",
  },
  // {
  //   headerName: "Gross Premium",
  //   field: "grossPremium",
  //   headerTooltip: "Gross Premium",
  //   width: 160,
  //   valueFormatter: currencyFormatter(localization),
  //   disableSort: true,
  // },
  {
    headerName: "Basic Premium",
    field: "netPremium",
    headerTooltip: "Basic Premium",
    width: 160,
    valueFormatter: currencyFormatter(localization),
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Basic Brokerage Amount",
    field: "commissionAmount",
    headerTooltip: "Basic Brokerage Amount",
    width: 170,
    valueGetter: ({ data }: any) =>
      data?.brokerageAmount ??
      data?.commissionAmount ??
      data?.totalBrokerageAmount ??
      data?.basicBrokerageAmount ??
      null,
    valueFormatter: currencyFormatter(localization),
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  // {
  //   headerName: "Premium Collected",
  //   field: "premiumCollected",
  //   headerTooltip: "Premium Collected",
  //   width: 170,
  //   valueFormatter: currencyFormatter(localization),
  //   disableSort: true,
  // },
  {
    headerName: "Brokerage Collected",
    field: "brokerageCollected",
    headerTooltip: "Brokerage Collected",
    width: 175,
    valueGetter: ({ data }: any) =>
      data?.brokerageCollected ?? data?.brokeragecollected ?? null,
    valueFormatter: currencyFormatter(localization),
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "IIRM Organisation",
    field: "iirmOrganisation",
    tooltipField: "iirmOrganisation",
    headerTooltip: "IIRM Organisation",
    width: 160,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined ? value : "--",
  },
  // A company spanning multiple SBUs/verticals produces one row per
  // company×org×sbu×vertical combination (see the companySummary grain in
  // policy-report.ts). These two columns make those rows read as distinct
  // slices instead of apparent duplicates.
  {
    headerName: "SBU",
    field: "sbuName",
    tooltipField: "sbuName",
    headerTooltip: "SBU",
    width: 160,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Vertical",
    field: "verticalName",
    tooltipField: "verticalName",
    headerTooltip: "Vertical",
    width: 160,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Actions",
    field: "actions",
    headerTooltip: "Actions",
    // Actions holds no row value, so ServerSideGrid's global
    // defaultColDef.tooltipValueGetter falls through to its no-data branch and
    // renders "[object Object]". Return "" to suppress the cell tooltip.
    tooltipValueGetter: () => "",
    cellRenderer: "ActionButton",
    minWidth: 160,
    disableSort: true,
  },
];
