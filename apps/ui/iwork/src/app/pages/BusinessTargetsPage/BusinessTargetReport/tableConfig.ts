import { formatCurrencyByLocalization } from "@ui/ui-lib";

// Business Target report columns. SBU / Vertical shapes mirror the BizDone
// Enhanced company columns (sbuName / verticalName getters); Team Member,
// Month and Target complete the five-column report the backend returns.
const textFormatter = ({ value }: any) =>
  value !== null && value !== undefined && value !== "" ? value : "--";

// The backend returns the raw enum ("SO_POLICY"); render it readably. Kept
// generic rather than reusing ENTITY_TYPE_OPTIONS because that list covers only
// 3 of the 14 BUSINESS_TARGET_ENTITY_TYPE values, and with no Entity type filter
// applied the report can surface any of them.
const entityTypeFormatter = ({ value }: any) =>
  value
    ? String(value)
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "--";

export const getColumns = (localization: any) => [
  {
    headerName: "Team Member",
    field: "teamMember",
    tooltipField: "teamMember",
    headerTooltip: "Team Member",
    minWidth: 200,
    flex: 1,
    valueFormatter: textFormatter,
  },
  {
    headerName: "SBU",
    field: "sbu",
    tooltipField: "sbu",
    headerTooltip: "SBU",
    minWidth: 180,
    flex: 1,
    valueFormatter: textFormatter,
  },
  {
    headerName: "Vertical",
    field: "vertical",
    tooltipField: "vertical",
    headerTooltip: "Vertical",
    minWidth: 180,
    flex: 1,
    valueFormatter: textFormatter,
  },
  {
    headerName: "Entity Type",
    field: "entityType",
    tooltipField: "entityType",
    headerTooltip: "Entity Type",
    minWidth: 160,
    flex: 1,
    valueFormatter: entityTypeFormatter,
  },
  {
    headerName: "Month",
    field: "month",
    tooltipField: "month",
    headerTooltip: "Month",
    width: 140,
    valueFormatter: textFormatter,
  },
  {
    headerName: "Target",
    field: "target",
    headerTooltip: "Target",
    width: 180,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined && value !== ""
        ? formatCurrencyByLocalization(Number(value), localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    // Renderer is registered as "ActionButton" on the Table's components map,
    // matching the other listings. Pinned right so it stays reachable when the
    // grid scrolls horizontally.
    headerName: "Actions",
    field: "actions",
    headerTooltip: "Actions",
    cellRenderer: "ActionButton",
    pinned: "right" as const,
    width: 100,
    sortable: false,
    filter: false,
    disableSort: true,
  },
];
