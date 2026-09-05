import {
  DATE_FORMATS,
  formatCurrencyByLocalization,
  formatDate,
  formatNumberByLocalization,
  formatNumberShort,
  LocalizationConfig,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

export const getColumns = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "Policy number",
    field: "policyNumber",
    tooltipField: "policyNumber",
    headerTooltip: "Policy number",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    pinned: "left",
  },
  {
    headerName: "Company name",
    field: "companyName",
    tooltipField: "companyName",
    headerTooltip: "Company name",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    pinned: "left",
  },
  {
    headerName: "Contact",
    field: "contact",
    disableSort: true,
    tooltipField: "contact",
    headerTooltip: "Contact",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType",
    headerTooltip: "Policy type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    width: 130,
  },
  {
    headerName: "Sum insured",
    field: "sumInsured",
    headerTooltip: "Sum insured",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    width: 130,
  },
  {
    headerName: "Premium",
    field: "premium",
    headerTooltip: "Premium",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    width: 130,
  },
  {
    headerName: "Brokerage",
    field: "brokerage",
    headerTooltip: "Brokerage",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    width: 130,
  },
  {
    headerName: "Policy from",
    field: "policyFrom",
    headerTooltip: "Policy from",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
  },
  {
    headerName: "Policy to",
    field: "policyTo",
    headerTooltip: "Policy to",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
  },
  {
    headerName: "Account manager",
    field: "accountManager",
    tooltipField: "accountManager",
    headerTooltip: "Account manager",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  // {
  //   headerName: "Action",
  //   field: "action",
  //   headerTooltip: "Action",
  //   cellRenderer: "ActionButton",
  //   width: 250,
  //   tooltipValueGetter: () => null,
  // },
];
