import { ColDef } from "ag-grid-community";
import { renderListInCell } from ".";

// This table's rowData is the hardcoded policyDefinationData below, not the
// live-fetched rowData from this component's useTableController call — so
// even though that hook does a real paginated/sortable fetch in the
// background, the rendered rows never reflect it. Every column is
// disableSort here for that reason; if the rowData wiring is ever fixed to
// use the hook's live data instead, this should be revisited.
export const policyDefinationColumns: ColDef[] = [
  {
    headerName: "Display name",
    field: "displayName",
    tooltipField: "displayName",
    headerTooltip: "Display name",
    flex: 1,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    disableSort: true,
  },
  {
    headerName: "Configuration",
    field: "configuration",
    tooltipField: "configuration",
    headerTooltip: "Configuration",
    flex: 1,
    cellRenderer: ({ value }) => renderListInCell(value),
    disableSort: true,
  },
  {
    headerName: "Min",
    field: "Min",
    tooltipField: "Min",
    headerTooltip: "Min",
    flex: 1,
    cellRenderer: ({ value }) => renderListInCell(value),
    disableSort: true,
  },
  {
    headerName: "Max",
    field: "Max",
    tooltipField: "Max",
    headerTooltip: "Max",
    flex: 1,
    cellRenderer: ({ value }) => renderListInCell(value),
    disableSort: true,
  },
  {
    headerName: "Total",
    field: "total",
    tooltipField: "total",
    headerTooltip: "Total",
    flex: 1,
    cellRenderer: ({ value }) => renderListInCell(value),
    disableSort: true,
  },
];


export const policyDefinationData=[
    {
        displayName:"Relationship",
        configuration:["Relationship", "Father"],
        Min: [1,3],
        Max:[5,10],
        total: [6,13]
    },
    {
        displayName:"Relationship",
        configuration:["Relationship", "Father"],
        Min: [1,3],
        Max:[5,10],
        total: [6,13]
    },
    {
        displayName: "Age Band",
        configuration: ["Less than 40", "More than 40", "More than 40", "More than 40", "More than 40", "More than 40"],
        Min: [18, 40, 40, 40, 40, 40],
        Max: [40, 85, 85, 85, 85, 85],
        total: [null, null, null, null, null, null]
      },
    {
        displayName:"Relationship",
        configuration:["Relationship", "Father"],
        Min: [1,3],
        Max:[5,10],
        total: [6,13]
    },
]