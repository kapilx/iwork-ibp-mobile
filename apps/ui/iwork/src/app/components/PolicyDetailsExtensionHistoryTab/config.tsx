import { ColDef } from "ag-grid-community";
import { formatDate } from "@ui/ui-lib/utils/DateFormat";

export const extensionHistoryColumns: ColDef[] = [
  {
    field: "createdAt",
    headerName: "Date",
    headerTooltip: "Date",
    tooltipField: "createdAt",
    flex: 1,
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
  },
  {
    field: "policyId",
    headerName: "IIRM Policy No.",
    headerTooltip: "IIRM Policy No.",
    tooltipField: "policyId",
    flex: 1,
    valueFormatter: ({ value }) => (value !== null && value !== undefined ? value : "--"),
  },
  {
    field: "endorsementType",
    headerName: "Type",
    headerTooltip: "Type",
    tooltipField: "endorsementType",
    flex: 1,
    valueFormatter: ({ value }) => (value !== null && value !== undefined ? value : "--"),
  },
  {
    field: "previousPolicyToDate",
    headerName: "Previous End Date",
    headerTooltip: "Previous End Date",
    tooltipField: "previousPolicyToDate",
    flex: 1,
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
  },
  {
    field: "extensionDate",
    headerName: "New End Date",
    headerTooltip: "New End Date",
    tooltipField: "extensionDate",
    flex: 1,
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
  },
  {
    field: "status",
    headerName: "Status",
    headerTooltip: "Status",
    tooltipField: "status",
    flex: 1,
    valueFormatter: ({ value }) => {
      if (!value) return "--";
      return value === "in-progress" ? "In Progress" : "Completed";
    },
  },
  {
    field: "remarks",
    headerName: "Remarks",
    headerTooltip: "Remarks",
    tooltipField: "remarks",
    flex: 1,
    valueFormatter: ({ value }) => (value !== null && value !== undefined ? value : "--"),
  },
];
