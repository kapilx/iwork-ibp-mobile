import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { CellClickedEvent } from "ag-grid-community";
import { Button, Table } from "@ui/ui-lib";
import useTableController from "@ui/ui-lib/hooks/useTableController";
import {
  RowData,
  hasRowError,
  getErrorCellStyle,
  EMPLOYEE_TABLE_COLUMNS,
  DUMMY_EMPLOYEE_DATA,
} from "./config";
import ErrorCellRenderer from "./ErrorCellRenderer";
import { useDispatch } from "react-redux";
import { setToastMessage } from "@ui/iwork/redux/slice";
import { GENERIC_ERROR, GO_BACK, POLICY_DASHBOARD } from "../../../constants";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { BottomContainer } from "./styles";

// Constants
const ERROR_TEXT_COLOR = "#ffcdd2";

const UploadedEmployeeData: React.FC = () => {
  const dispatch = useDispatch();
  // Helper functions
  const getRowStyle = (params: any) =>
    hasRowError(params.data) ? { backgroundColor: ERROR_TEXT_COLOR } : {};

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSort,
  } = useTableController({
    // endpoint: endPoints.allCompanies,
  });

  const handleCellClicked = (event: CellClickedEvent): void => {};

  // Use DUMMY_EMPLOYEE_DATA directly if rowData is empty or undefined
  const displayData = useMemo(() => {
    if (rowData && rowData.length > 0) return rowData;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return DUMMY_EMPLOYEE_DATA.slice(start, end);
  }, [rowData, currentPage, pageSize]);
  const displayTotalRows =
    totalRows > 0 ? totalRows : DUMMY_EMPLOYEE_DATA.length;

  return (
    <div style={{ padding: "20px" }}>
      <Typography sx={{ marginBottom: "16px" }}>
        {POLICY_DASHBOARD.CONFIGURE_POLICY_TABLE_MESSAGE}
      </Typography>

      <Table
        columns={EMPLOYEE_TABLE_COLUMNS}
        rowData={displayData}
        totalRows={displayTotalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={handleCellClicked}
        setSort={setSort}
        gridOptions={{
          getRowStyle: getRowStyle,
        }}
        components={{ ErrorCellRenderer }}
      />

      {/* Error Summary and Action Buttons */}
      <BottomContainer>
        <div>
          ⚠️{" "}
          <span
            style={{ color: "#d32f2f", fontWeight: "500", fontSize: "14px" }}
          >
            {displayData?.filter(hasRowError).length ?? 0} error record
            {displayData?.filter(hasRowError).length !== 1 && "s"}
          </span>{" "}
          are found out of {displayData?.length ?? 0} in the processed data
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
          <Button variantType="secondary">{GO_BACK}</Button>
          <Button variantType="secondary">
            {POLICY_DASHBOARD.IMPORT_ANYWAY}
          </Button>
          <Button variantType="primary">{POLICY_DASHBOARD.FIX_MAPPING}</Button>
        </div>
      </BottomContainer>
    </div>
  );
};

export default UploadedEmployeeData;
