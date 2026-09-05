import {
  formatCurrencyByLocalization,
  formatNumberByLocalization,
  LocalizationConfig,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

export const myFollowUp = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "Activity name",
    field: "activityName",
    tooltipField: "activityName",
    headerTooltip: "Activity name",
    minWidth: 200,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },

  {
    headerName: "30 Days",
    field: "next30",
    headerTooltip: "30 Days",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: (params) => {
      return !params.node.rowPinned
        ? "right-aligned-clickable-cell"
        : "right-aligned-cell";
    },
    headerClass: "right-aligned-header",
  },

  {
    headerName: "60 Days",
    field: "next60",
    headerTooltip: "60 Days",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: (params) => {
      return !params.node.rowPinned
        ? "right-aligned-clickable-cell"
        : "right-aligned-cell";
    },
    headerClass: "right-aligned-header",
  },
  {
    headerName: "90 Days",
    field: "next90",
    headerTooltip: "90 Days",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    headerClass: "right-aligned-header",
    cellClass: (params) => {
      return !params.node.rowPinned
        ? "right-aligned-clickable-cell"
        : "right-aligned-cell";
    },
  },

  {
    headerName: "Beyond 90 Days",
    field: "beyond90",
    headerTooltip: "Beyond 90 Days",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: (params) => {
      return !params.node.rowPinned
        ? "right-aligned-clickable-cell"
        : "right-aligned-cell";
    },
    headerClass: "right-aligned-header",
  }
].map((col) => ({ ...col, sortable: false }));
