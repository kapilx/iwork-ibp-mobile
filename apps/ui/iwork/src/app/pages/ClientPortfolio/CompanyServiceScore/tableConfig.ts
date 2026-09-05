import { colors, formatMonth } from "@ui/ui-lib";
import { format } from "date-fns";

export const Indicator = {
  green: {
    backgroundColor: "#4CAF50",
    color: colors.text.secondary,
  },
  amber: {
    backgroundColor: "#FF9800",
    color: colors.text.secondary,
  },
  red: {
    backgroundColor: "#F44336",
    color: colors.text.secondary,
  },
};
export const indicatorStyleMap = {
  green: {
    backgroundColor: "#E8F5E9",
    color: colors.text.primary,
    dotColor: "#4CAF50",
  },
  yellow: {
    backgroundColor: "#FFFDE7",
    color: colors.text.primary,
    dotColor: "#FFEB3B",
  },
  red: {
    backgroundColor: "#FFEBEE",
    color: colors.text.primary,
    dotColor: "#F44336",
  },
  orange: {
    backgroundColor: "#FF710426",
    color: colors.text.primary,
    dotColor: "#FF7104",
  },
};
export const rowData = [
  {
    month: "January 2024",
    marksScored: 92,
    totalMarks: 100,
    scoredPercent: "92%",
    indicator: "GREEN",
    action: "View Details",
    id: 1,
  },
  {
    month: "February 2024",
    marksScored: 78,
    totalMarks: 100,
    scoredPercent: "78%",
    indicator: "AMBER",
    action: "View Details",
    id: 2,
  },
  {
    month: "March 2024",
    marksScored: 65,
    totalMarks: 100,
    scoredPercent: "65%",
    indicator: "RED",
    action: "View Details",
    id: 3,
  },
  {
    month: "April 2024",
    marksScored: 89,
    totalMarks: 100,
    scoredPercent: "89%",
    indicator: "GREEN",
    action: "View Details",
    id: 4,
  },
  {
    month: "April 2024",
    marksScored: 89,
    totalMarks: 100,
    scoredPercent: "89%",
    indicator: "GREEN",
    action: "View Details",
    id: 5,
  },
  {
    month: "April 2024",
    marksScored: 89,
    totalMarks: 100,
    scoredPercent: "89%",
    indicator: "GREEN",
    action: "View Details",
    id: 6,
  },
];

export const columnDefs = [
  {
    headerName: "Month",
    field: "month",
    tooltipField: "month",
    headerTooltip: "Month",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatMonth(value) : "--",
    pinned: "left",
    // rowData is entirely prop-driven, no live paginated fetch backs this
    // table, and ServerSideGrid neutralizes client-side sorting — clicking
    // this header would show an arrow but never actually reorder anything.
    disableSort: true,
  },
  {
    headerName: "Marks scored",
    field: "marksScored",
    tooltipField: "marksScored",
    headerTooltip: "Marks scored",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
  {
    headerName: "Total marks",
    field: "totalMarks",
    tooltipField: "totalMarks",
    headerTooltip: "Total marks",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
  {
    headerName: "Scored %",
    field: "percentage",
    headerTooltip: "Scored %",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? Number(value).toFixed(2) + "%"
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? Number(value).toFixed(2) + "%"
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
  {
    headerName: "Indicator",
    field: "indicator",
    tooltipField: "indicator",
    headerTooltip: "Indicator",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: indicatorStyleMap,
      variant: "normal",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    disableSort: true,
  },
  {
    headerName: "Actions",
    field: "actions",
    tooltipField: "actions",
    headerTooltip: "Actions",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellRenderer: "ActionButton",
    flex: 1,
    minWidth: 250,
    disableSort: true,
  },
];
