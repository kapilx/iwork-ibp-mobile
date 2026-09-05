import React, { useMemo } from "react";
import { Table } from "@ui/ui-lib";
import { CellClickedEvent } from "ag-grid-community";
import { buildColumns, buildRowData, buildTotalRow } from "./config";
import { TableWrapper } from "./styles";
import { PolicyExpiryBySbuRow } from "./types";
import { POLICY_EXPIRY_BUCKET_LABELS } from "./constants";
import { TableSkeleton } from "../DashboardSkeletons";

interface SbuPolicyExpiryTableProps {
  rows: PolicyExpiryBySbuRow[] | undefined;
  isLoading: boolean;
  onBucketClick?: (row: PolicyExpiryBySbuRow, bucketLabel?: string) => void;
  // When true every bucket column renders "--" — business month doesn't apply
  // to this widget, so it shows a not-applicable state instead of stale counts.
  showNotApplicablePlaceholder?: boolean;
}

const SbuPolicyExpiryTable: React.FC<SbuPolicyExpiryTableProps> = ({
  rows,
  isLoading,
  onBucketClick,
  showNotApplicablePlaceholder = false,
}) => {
  const baseColumns = buildColumns(isLoading);
  const columns = useMemo(() => {
    if (!showNotApplicablePlaceholder) return baseColumns;
    return baseColumns.map((col) =>
      col.field === "sbuName"
        ? col
        : { ...col, valueFormatter: () => "--", cellClass: "right-aligned-cell" }
    );
  }, [baseColumns, showNotApplicablePlaceholder]);
  const allRowData = isLoading ? [] : buildRowData(rows ?? []);
  const summaryRowData = isLoading ? [] : [buildTotalRow(allRowData)];

  // Placed after the hooks above so the hook order stays stable across renders.
  // While loading, buildColumns() drops every bucket column, so the grid would
  // otherwise collapse to a single empty column behind a spinner — the skeleton
  // keeps the section at its loaded width.
  if (isLoading) {
    return (
      <TableWrapper>
        <TableSkeleton rows={5} cols={1 + POLICY_EXPIRY_BUCKET_LABELS.length} />
      </TableWrapper>
    );
  }

  const handleCellClicked = (event: CellClickedEvent) => {
    if (
      showNotApplicablePlaceholder ||
      !onBucketClick ||
      !event.data ||
      event.colDef.field === "sbuName"
    ) {
      return;
    }

    const clickedRow = rows?.find((row) => row.sbuId === event.data.sbuId);
    const field = event.colDef.field;
    const value = Number(event.value ?? 0);

    if (!clickedRow || value <= 0) {
      return;
    }

    onBucketClick(clickedRow, field);
  };

  return (
    <TableWrapper>
      <Table
        columns={columns}
        rowData={allRowData}
        summaryRowData={summaryRowData}
        freezeLastRow
        totalRows={allRowData.length}
        currentPage={1}
        setCurrentPage={() => undefined}
        loading={isLoading}
        pageSize={allRowData.length || 1}
        pageSizeOptions={[]}
        setPageSize={() => undefined}
        onCellClicked={handleCellClicked}
        onPrimaryActionClick={() => undefined}
        setSort={() => undefined}
        components={{}}
        domLayout="autoHeight"
        hidePagination
        displaySettingsButton={false}
        enableSaveView={false}
      />
    </TableWrapper>
  );
};

export default SbuPolicyExpiryTable;
