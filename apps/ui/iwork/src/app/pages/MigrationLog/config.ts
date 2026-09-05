import { formatDateTimeDDMMYYYY } from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

export const EVENT_TYPE_LABELS: Record<string, string> = {
  policy_create: "Policy Create",
  policy_update: "Policy Update",
  policy_missed: "Policy Missed Company",
  policy_disable: "Policy Disable",
  company_create: "Company Create",
};

export const getColumns = (): ColDef[] => [
  {
    headerName: "Executed At",
    field: "executedAt",
    headerTooltip: "When this migration run was recorded",
    pinned: "left",
    minWidth: 190,
    valueFormatter: ({ value }) => (value ? formatDateTimeDDMMYYYY(value) : "--"),
    tooltipValueGetter: ({ value }) => (value ? formatDateTimeDDMMYYYY(value) : "--"),
  },
  {
    headerName: "System",
    field: "system",
    headerTooltip: "System/service that wrote this log entry",
    minWidth: 160,
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Event Type",
    field: "eventType",
    headerTooltip: "Migration phase",
    cellRenderer: "ChipRenderer",
    minWidth: 200,
    cellRendererParams: {
      variant: "withDot",
      styleMap: {
        policy_create: { color: "#43a047" },
        policy_update: { color: "#1e88e5" },
        policy_missed: { color: "#fb8c00" },
        policy_disable: { color: "#e53935" },
        company_create: { color: "#8e24aa" },
      },
      bordercolor: "#2e2c2cff",
    },
    valueFormatter: ({ value }) => EVENT_TYPE_LABELS[value] ?? value ?? "--",
    tooltipValueGetter: ({ value }) => EVENT_TYPE_LABELS[value] ?? value ?? "--",
  },
  {
    headerName: "Migration Run ID",
    field: "migrationRunId",
    tooltipField: "migrationRunId",
    headerTooltip: "Migration Run ID",
    minWidth: 220,
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Success Count",
    field: "successCount",
    headerTooltip: "Records successfully created/updated",
    minWidth: 140,
    valueFormatter: ({ value }) => value ?? 0,
  },
  {
    headerName: "Error Count",
    field: "errorCount",
    headerTooltip: "Records that failed validation",
    minWidth: 130,
    valueFormatter: ({ value }) => value ?? 0,
  },
  {
    headerName: "Success Log",
    field: "successLogUrl",
    headerTooltip: "Download this run's success CSV",
    minWidth: 320,
    disableSort: true,
    cellRenderer: "DownloadLinkRenderer",
  },
  {
    headerName: "Error Log",
    field: "errorLogUrl",
    headerTooltip: "Download this run's error CSV",
    minWidth: 320,
    disableSort: true,
    cellRenderer: "DownloadLinkRenderer",
  },
];
