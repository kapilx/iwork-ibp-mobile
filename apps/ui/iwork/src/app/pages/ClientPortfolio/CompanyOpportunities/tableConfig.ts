import {
  DATE_FORMATS,
  formatCurrencyByLocalization,
  formatDate,
  LocalizationConfig,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

// Columns for the client-portfolio drill-down RO / SO opportunity lists.
// RO additionally shows a clickable policy number (navigates to the ref policy).
export const getColumns = (
  type: "RO" | "SO",
  localization?: LocalizationConfig
): ColDef[] => [
  {
    headerName: type === "RO" ? "RO id" : "SO id",
    field: "opportunityId",
    tooltipField: "opportunityId",
    headerTooltip: type === "RO" ? "RO id" : "SO id",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }: { value: unknown }) =>
      value != null ? String(value) : "--",
    pinned: "left" as const,
  },
  ...(type === "RO"
    ? [
        {
          headerName: "Policy number",
          field: "policyId",
          tooltipField: "policyId",
          headerTooltip: "Policy number",
          cellClass: "clickable-cell",
          valueFormatter: ({ value }: { value: unknown }) =>
            value != null ? String(value) : "--",
          pinned: "left" as const,
        },
      ]
    : []),
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType",
    headerTooltip: "Policy type",
    valueFormatter: ({ value }) => (value != null ? value : "--"),
  },
  {
    headerName: "Premium",
    field: "premium",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value != null ? formatCurrencyByLocalization(value, localization) : "--",
    disableSort: true,
  },
  {
    headerName: "Sum insured",
    field: "sumInsured",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value != null ? formatCurrencyByLocalization(value, localization) : "--",
  },
  {
    headerName: "Status",
    field: "state",
    tooltipField: "state",
    headerTooltip: "Status",
    valueFormatter: ({ value }) => (value != null ? value : "--"),
  },
  {
    headerName: type === "RO" ? "Expiry date" : "Expected close",
    field: "expiryDate",
    valueFormatter: ({ value }) =>
      value ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR) : "--",
  },
  {
    headerName: "Assigned to",
    field: "assignedTo",
    tooltipField: "assignedTo",
    headerTooltip: "Assigned to",
    valueFormatter: ({ value }) => (value != null ? value : "--"),
  },
];
