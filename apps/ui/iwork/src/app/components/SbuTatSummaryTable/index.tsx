import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Table, BUSINESS_PERFORMANCE } from "@ui/ui-lib";
import { CellClickedEvent } from "ag-grid-community";
import { TableWrapper, TatSectionWrapper } from "./styles";
import { SubSectionHeader } from "../../pages/Dashboard/styles";
import {
  SBU_TABLE_BASE_HEIGHT,
  SBU_TABLE_MIN_HEIGHT,
  SBU_TABLE_PAGE_SIZE_OPTIONS,
  SBU_TABLE_ROW_HEIGHT,
} from "./constants";
import { buildColumns, buildRowData, buildTotalRow } from "./config";
import { TatSectionKey, TatSbuRow, TatSbuSection, TatSummaryBySbuData } from "./types";
import { TableSkeleton } from "../DashboardSkeletons";

// Bucket labels arrive with the data, so the first-load skeleton can't count them.
// Both sections always render SBU + 4 TAT buckets (<3 / <7 / <14 / >14 days) + Total.
const TAT_SKELETON_COLS = 6;

interface SbuTatSummaryTableProps {
  data: TatSummaryBySbuData | undefined;
  isLoading: boolean;
  onBucketClick?: (
    sectionTitle: TatSectionKey,
    row: TatSbuRow,
    bucketLabel?: string
  ) => void;
  // When true the claims section shows "--" for all values — the current
  // filters (e.g. businessMonth) don't apply to claims data.
  showClaimsNotApplicablePlaceholder?: boolean;
}

const SectionTable: React.FC<{
  sectionKey: TatSectionKey;
  section: TatSbuSection;
  isLoading: boolean;
  onBucketClick?: (
    sectionTitle: TatSectionKey,
    row: TatSbuRow,
    bucketLabel?: string
  ) => void;
  showNotApplicablePlaceholder?: boolean;
}> = ({ sectionKey, section, isLoading, onBucketClick, showNotApplicablePlaceholder = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const baseCols = buildColumns(isLoading ? [] : section.bucketLabels);
  const columns = useMemo(() => {
    if (!showNotApplicablePlaceholder) return baseCols;
    return baseCols.map((col) =>
      col.field === "sbuName"
        ? col
        : { ...col, valueFormatter: () => "--", cellClass: "right-aligned-cell" }
    );
  }, [baseCols, showNotApplicablePlaceholder]);
  const allRowData = isLoading ? [] : buildRowData(section);
  const summaryRowData = isLoading ? [] : [buildTotalRow(section)];

  // Apply pagination to the data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRowData = allRowData.slice(startIndex, endIndex);

  const handleCellClicked = (event: CellClickedEvent) => {
    // Total is a summary column — not a drilldown. Only the bucket columns
    // (and never the SBU name) navigate.
    if (
      !onBucketClick ||
      !event.data ||
      event.colDef.field === "sbuName" ||
      event.colDef.field === "total"
    ) {
      return;
    }

    const clickedRow = section.rows.find(
      (row) => row.sbuId === event.data.sbuId
    );
    const field = event.colDef.field;
    const value = Number(event.value ?? 0);

    if (!clickedRow || value <= 0) {
      return;
    }

    onBucketClick(sectionKey, clickedRow, field);
  };

  // After the hooks above so the hook order stays stable. While loading the
  // parent passes an empty section, so buildColumns() yields just the SBU column
  // and the grid renders a spinner over a "0 entries" footer. The skeleton keeps
  // the section at its loaded width instead.
  if (isLoading) {
    return (
      <TableWrapper>
        <TableSkeleton rows={5} cols={TAT_SKELETON_COLS} />
      </TableWrapper>
    );
  }

  return (
    <TableWrapper>
      <Table
        columns={columns}
        rowData={paginatedRowData}
        summaryRowData={summaryRowData}
        freezeLastRow
        totalRows={allRowData.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={isLoading}
        pageSize={pageSize}
        pageSizeOptions={SBU_TABLE_PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={handleCellClicked}
        onPrimaryActionClick={() => undefined}
        setSort={() => undefined}
        components={{}}
        height={Math.max(
          SBU_TABLE_MIN_HEIGHT,
          Math.min(pageSize, paginatedRowData.length) * SBU_TABLE_ROW_HEIGHT +
            SBU_TABLE_BASE_HEIGHT
        )}
        displaySettingsButton={false}
        enableSaveView={false}
      />
    </TableWrapper>
  );
};

const SbuTatSummaryTable: React.FC<SbuTatSummaryTableProps> = ({
  data,
  isLoading,
  onBucketClick,
  showClaimsNotApplicablePlaceholder = false,
}) => {
  if (!isLoading && !data) {
    return (
      <Box>
        <SectionTable
          sectionKey={TatSectionKey.ENDORSEMENTS}
          section={{ bucketLabels: [], rows: [] }}
          isLoading={false}
        />
        <SectionTable
          sectionKey={TatSectionKey.CLAIMS}
          section={{ bucketLabels: [], rows: [] }}
          isLoading={false}
        />
      </Box>
    );
  }

  const endorsements = data?.endorsements;
  const claims = data?.claims;

  return (
    <Box>
      {/* Endorsement TAT Section */}
      <TatSectionWrapper>
        <SectionTable
          sectionKey={TatSectionKey.ENDORSEMENTS}
          section={endorsements ?? { bucketLabels: [], rows: [] }}
          isLoading={isLoading}
          onBucketClick={onBucketClick}
        />
      </TatSectionWrapper>

      {/* Claims TAT Section */}
      <TatSectionWrapper>
        <SubSectionHeader border={true}>
          {BUSINESS_PERFORMANCE.LABELS.CLAIMS_TAT_BY_SBU}
        </SubSectionHeader>
        <SectionTable
          sectionKey={TatSectionKey.CLAIMS}
          section={claims ?? { bucketLabels: [], rows: [] }}
          isLoading={isLoading}
          onBucketClick={showClaimsNotApplicablePlaceholder ? undefined : onBucketClick}
          showNotApplicablePlaceholder={showClaimsNotApplicablePlaceholder}
        />
      </TatSectionWrapper>
    </Box>
  );
};

export default SbuTatSummaryTable;
