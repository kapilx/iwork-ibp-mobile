import {
  formatNumberByLocalization,
  formatNumberShort,
  LocalizationConfig,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

export const brokerageToCollect = (
  localization?: LocalizationConfig
): ColDef[] => [
  {
    headerName: "Insurer Name",
    field: "insurerName",
    tooltipField: "insurerName",
    headerTooltip: "Insurer Name",
    minWidth: 200,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "left-aligned-cell",
  },
  {
    headerName: "Current Month",
    field: "currentMonth",
    headerTooltip: "Current Month",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberShort(value, localization)
        : "--",
    cellClass: (params) =>
      !params.node.rowPinned
        ? "right-aligned-clickable-cell"
        : "right-aligned-cell",
    headerClass: "right-aligned-header",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
  },
  {
    headerName: "Last Month",
    field: "lastMonth",
    headerTooltip: "Last Month",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberShort(value, localization)
        : "--",
    cellClass: (params) =>
      !params.node.rowPinned
        ? "right-aligned-clickable-cell"
        : "right-aligned-cell",
    headerClass: "right-aligned-header",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
  },
  {
    headerName: "Prior to that",
    field: "priorToThat",
    headerTooltip: "Prior to that",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberShort(value, localization)
        : "--",
    cellClass: (params) =>
      !params.node.rowPinned
        ? "right-aligned-clickable-cell"
        : "right-aligned-cell",
    headerClass: "right-aligned-header",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
  },
  {
    headerName: "Total",
    field: "total",
    headerTooltip: "Total",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberShort(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
  },
];
