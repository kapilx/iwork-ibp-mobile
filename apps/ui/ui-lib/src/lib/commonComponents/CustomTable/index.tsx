import { useState, useMemo } from "react";
import {
  ColDef,
  GridOptions,
  ClientSideRowModelModule,
} from "ag-grid-community";
import { CustomTableGridContainer, CustomTableWrapper } from "./styles";
import { AgGridReact } from "ag-grid-react";
import Pagination from "../Pagination";
import { MenuItem, Divider, SelectChangeEvent } from "@mui/material";
import { TABLE_HEIGHT } from "../../constants";
import {
  PaginationContainer,
  StyledAgGridWrapper,
  StyledBox,
  ServerSideGridStyledFormControl,
  StyledSelect,
} from "../ServerSideGrid/styles";

interface AGGridProps<T extends object> extends Partial<GridOptions<T>> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  height?: number;
  width?: string | number;
}

const CustomTable = <T extends object>({
  rowData,
  columnDefs,
  height = TABLE_HEIGHT,
  width = "100%",
  ...rest
}: AGGridProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return rowData?.slice(startIndex, endIndex);
  }, [rowData, currentPage, pageSize]);

  return (
    <>
      <CustomTableGridContainer
        data-testid="ServerSideGrid"
        className="ag-theme-alpine"
      >
        <CustomTableWrapper>
          <StyledAgGridWrapper height={height}>
            {/* {loading && <Loader data-testid="loader" />} */}
            <AgGridReact<T>
              rowData={paginatedData} // Render only paginated data
              columnDefs={columnDefs}
              domLayout="normal"
              modules={[ClientSideRowModelModule]}
              rowModelType="clientSide"
              enableBrowserTooltips={true}
              suppressMovableColumns={true}
              {...rest}
              localeText={{
                noRowsToShow: rowData?.length === 0 ? "No Data To Show" : "",
              }}
              rowHeight={58}
              defaultColDef={{
                resizable: false,
              }}
            />
          </StyledAgGridWrapper>
          {rowData?.length === 0 && <Divider />}
        </CustomTableWrapper>
      </CustomTableGridContainer>
      <PaginationContainer>
        <ServerSideGridStyledFormControl
          variant="outlined"
          size="small"
          data-testid="pagination-entries-info"
        >
          <StyledBox>Showing </StyledBox>
          <StyledSelect
            value={pageSize}
            inputProps={{ "aria-label": "Page size" }}
            onChange={(event: SelectChangeEvent<unknown>) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
            }}
            role="listbox"
            data-testid="page-size"
            MenuProps={{
              anchorOrigin: {
                vertical: "top",
                horizontal: "left",
              },
              transformOrigin: {
                vertical: "bottom",
                horizontal: "left",
              },
            }}
          >
            {[5, 10, 20, 30].map((size: number) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </StyledSelect>
          <StyledBox>of {rowData.length} entries</StyledBox>
        </ServerSideGridStyledFormControl>

        <Pagination
          totalRecords={rowData.length} // Total rows for pagination
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          data-testid={"pagination-pages-info"}
        />
      </PaginationContainer>
    </>
  );
};

export default CustomTable;
