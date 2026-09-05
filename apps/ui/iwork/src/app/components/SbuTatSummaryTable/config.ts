import { ColDef } from "ag-grid-community";
import { formatNumberByLocalization } from "@ui/ui-lib";
import { SbuTableRow, TatSbuSection } from "./types";

const numberValueFormatter = ({ value }: { value: number }) =>
  value !== null && value !== undefined
    ? formatNumberByLocalization(value)
    : "--";

export const buildColumns = (bucketLabels: string[]): ColDef[] => [
  {
    headerName: "SBU",
    field: "sbuName",
    minWidth: 200,
    pinned: "left" as const,
    // rowData is entirely prop-driven, no live paginated fetch backs this
    // table — matching the sibling SbuPolicyExpiryTable, which already sets
    // sortable:false on all its columns.
    sortable: false,
  },
  ...bucketLabels.map((label) => ({
    headerName: label,
    field: label,
    flex: 1,
    valueFormatter: numberValueFormatter,
    tooltipValueGetter: numberValueFormatter,
    cellClass: (params: { node: { rowPinned?: boolean } }) =>
      params.node.rowPinned
        ? "right-aligned-cell"
        : "right-aligned-clickable-cell",
    headerClass: "right-aligned-header",
    sortable: false,
  })),
  {
    headerName: "Total",
    field: "total",
    flex: 1,
    valueFormatter: numberValueFormatter,
    tooltipValueGetter: numberValueFormatter,
    // Total is a non-clickable summary column — only the bucket columns drill
    // down, so it never gets the clickable (blue link) cell styling.
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    sortable: false,
  },
];

export const buildRowData = (section: TatSbuSection): SbuTableRow[] =>
  section.rows.map((row) => {
    const rowObj: SbuTableRow = {
      sbuId: row.sbuId,
      sbuName: row.sbuName,
      total: row.totalCount,
    };
    section.bucketLabels.forEach((label, idx) => {
      rowObj[label] = row.buckets[idx] ?? 0;
    });
    return rowObj;
  });

export const buildTotalRow = (section: TatSbuSection): SbuTableRow => {
  const totalRow: SbuTableRow = { sbuId: 0, sbuName: "Total", total: 0 };
  section.bucketLabels.forEach((label, idx) => {
    totalRow[label] = section.rows.reduce(
      (sum, row) => sum + (row.buckets[idx] ?? 0),
      0,
    );
  });
  totalRow.total = section.rows.reduce((sum, row) => sum + row.totalCount, 0);
  return totalRow;
};
