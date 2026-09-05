import {
  CompanyNameRenderer,
  formatCurrencyByLocalization,
  formatDate,
  LocalizationConfig,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import { ActionsRenderer } from "./actionsRenderer";

export const columns = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "Policy name",
    field: "policyName",
    tooltipField: "policyName",
    headerTooltip: "Policy name",
    cellClass: "clickable-cell",
    width: 220,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType",
    headerTooltip: "Policy type",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "Start date",
    field: "startDate",
    headerTooltip: "Start date",
    width: 140,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "End date",
    field: "endDate",
    headerTooltip: "End date",
    width: 140,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "Premium (WON)",
    field: "premium",
    headerTooltip: "Premium (WON)",
    width: 150,
    valueFormatter: ({ value }) =>
      formatCurrencyByLocalization(value, localization) ?? "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "Brokerage",
    field: "brokerage",
    headerTooltip: "Brokerage",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "",
    field: "actions",
    headerTooltip: "Actions",
    cellRenderer: ActionsRenderer, // should render Configure and Add Endorsement buttons
    width: 340,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    sortable: false,
    filter: false,
    hide: false,
  },
];

export const policyData = [
  {
    policyName: "12223344",
    policyType: "GMC",
    startDate: "30 Apr, 2025",
    endDate: "30 Apr, 2025",
    premium: "--",
    brokerage: "--",
  },
  {
    policyName: "34567889",
    policyType: "Fire",
    startDate: "30 Jun, 2025",
    endDate: "30 Jun, 2025",
    premium: "--",
    brokerage: "--",
  },
  {
    policyName: "23456078",
    policyType: "GPA",
    startDate: "01 May, 2025",
    endDate: "01 May, 2025",
    premium: "--",
    brokerage: "--",
  },
  {
    policyName: "15153780",
    policyType: "GTL",
    startDate: "01 Aug, 2026",
    endDate: "01 Aug, 2026",
    premium: "--",
    brokerage: "--",
  },
];
