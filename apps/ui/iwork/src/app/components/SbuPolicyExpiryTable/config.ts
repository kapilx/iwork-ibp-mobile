import { ColDef } from "ag-grid-community";
import { formatNumberByLocalization } from "@ui/ui-lib";
import { POLICY_EXPIRY_BUCKET_LABELS } from "./constants";
import { PolicyExpiryBySbuRow, PolicyExpiryTableRow } from "./types";

export const buildColumns = (loading: boolean): ColDef[] => [
  {
    headerName: "SBU",
    field: "sbuName",
    minWidth: 200,
    pinned: "left" as const,
    sortable: false,
  },
  ...(loading
    ? []
    : POLICY_EXPIRY_BUCKET_LABELS.map((label) => ({
        headerName: label,
        field: label,
        flex: 1,
        sortable: false,
        valueFormatter: ({ value }: { value: number }) =>
          value !== null && value !== undefined
            ? formatNumberByLocalization(value)
            : "--",
        tooltipValueGetter: ({ value }: { value: number }) =>
          value !== null && value !== undefined
            ? formatNumberByLocalization(value)
            : "--",
        cellClass: (params: { node: { rowPinned?: boolean } }) =>
          params.node.rowPinned
            ? "right-aligned-cell"
            : "right-aligned-clickable-cell",
        headerClass: "right-aligned-header",
      }))),
];

export const buildRowData = (
  rows: PolicyExpiryBySbuRow[],
): PolicyExpiryTableRow[] =>
  rows.map((row) => {
    const obj: PolicyExpiryTableRow = { sbuId: row.sbuId, sbuName: row.sbuName };
    // Default every bucket to 0 so SBUs with no counts still render 0, not blank
    POLICY_EXPIRY_BUCKET_LABELS.forEach((label) => {
      obj[label] = 0;
    });
    row.policyExpiryTimeline.forEach(({ label, count }) => {
      obj[label] = count;
    });
    return obj;
  });

export const buildTotalRow = (
  allRows: PolicyExpiryTableRow[],
): PolicyExpiryTableRow => {
  const totalRow: PolicyExpiryTableRow = { sbuId: 0, sbuName: "Total" };
  POLICY_EXPIRY_BUCKET_LABELS.forEach((label) => {
    totalRow[label] = allRows.reduce(
      (acc, row) => acc + (Number(row[label]) || 0),
      0,
    );
  });
  return totalRow;
};
