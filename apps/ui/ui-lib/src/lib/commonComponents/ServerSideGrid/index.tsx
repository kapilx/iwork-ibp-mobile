import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import { AgGridReact as AgGridReactType } from "ag-grid-react";
import { CircularProgress, Divider } from "@mui/material";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  AllCommunityModule,
  ClientSideRowModelModule,
  ColDef,
  ModuleRegistry,
  provideGlobalGridOptions,
} from "ag-grid-community";
import { GridContainer, StyledAgGridWrapper, Wrapper } from "./styles";
import { memo, useRef } from "react";
import { NO_DATA_AVAILABLE, TABLE_HEIGHT } from "../../constants";
import sort from "../../assets/svgs/sort.svg";

// Register only the required module
ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface ServerSideGridProps<T extends object> extends AgGridReactProps<T> {
  totalRecords: number;
  currentPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  pageSize: number;
  rows: T[];
  columns: ColDef<T>[];
  height?: number;
  pageSizeOptions: number[];
  onPageSizeChange: (pageSize: number) => void;
  setSort?: React.Dispatch<
    React.SetStateAction<{ colId: string; sort: "asc" | "desc" }[]>
  >;
  getRowHeight?: (params: any) => number;
  domLayout?: "normal" | "autoHeight";
  pinnedBottomRowData?: T[];
  showLoader?: boolean;
  emptyDataMessage?: string;
  getRowClass?: (params: any) => string | string[] | undefined;
}

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({
  theme: "legacy",
});

type SortDirection = "asc" | "desc";

// The app's own loader (same MUI CircularProgress as Layout's full-page overlay
// and as this component used to render), supplied to ag-grid as its loading
// overlay so the grid stays mounted while still looking like the rest of the
// app. Module scope: ag-grid treats the overlay component as @initial, so a new
// reference each render would not be picked up anyway.
const GridLoadingOverlay = () => <CircularProgress />;

const customIcons = {
  sortUnSort: `<img src="${sort}" alt="sort"/>`,
};

const ServerSideGrid = <T extends object>({
  rows,
  totalRecords,
  currentPage,
  loading,
  onPageChange,
  columns,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  setSort,
  height = TABLE_HEIGHT,
  domLayout = "normal",
  getRowHeight,
  pinnedBottomRowData,
  showLoader = true,
  emptyDataMessage,
  getRowClass,
  ...rest
}: ServerSideGridProps<T>) => {
  const gridRef = useRef<AgGridReactType<T>>(null);

  const handleSortChanged = () => {
    if (gridRef.current?.api) {
      try {
        const columnStates = gridRef.current.api.getColumnState();
        // getColumnState() returns columns in left-to-right display order, not
        // click order. sortIndex is ag-grid's own record of multi-sort click
        // priority (0 = clicked first) — sort by it here so the array we send
        // upstream reflects the user's actual priority, not column position.
        const sortModel = columnStates
          .filter((col) => col.sort)
          .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
          .map((col) => ({
            colId: col.colId,
            sort: col.sort as SortDirection,
          }));

        setSort(sortModel);
      } catch (error) {
        console.error("Error accessing grid API:", error);
      }
    }
  };

  return (
    <GridContainer data-testid="ServerSideGrid" className="ag-theme-alpine">
      <Wrapper>
        <StyledAgGridWrapper
          height={domLayout === "autoHeight" ? undefined : height}
        >
          <AgGridReact<T>
            ref={gridRef}
            columnDefs={columns}
            rowData={rows}
            pinnedBottomRowData={pinnedBottomRowData}
            domLayout={domLayout}
            rowModelType="clientSide"
            modules={[ClientSideRowModelModule]}
            loading={showLoader && loading}
            loadingOverlayComponent={GridLoadingOverlay}
            localeText={{
              noRowsToShow: emptyDataMessage || "No data to show",
            }}
            getRowClass={getRowClass}
            {...rest}
            enableBrowserTooltips={true}
            suppressMovableColumns={true}
            onSortChanged={handleSortChanged}
            multiSortKey="ctrl"
            icons={customIcons} // Pass custom icons here
            unSortIcon="true"
            defaultColDef={{
              comparator: () => 0,
              tooltipValueGetter: (params) => {
                return params.value !== null && params.value !== undefined
                  ? params.value
                  : { NO_DATA_AVAILABLE };
              },
            }}
            getRowHeight={getRowHeight ?? (() => 54)}
          />
        </StyledAgGridWrapper>
        {totalRecords === 0 && <Divider />}
      </Wrapper>
    </GridContainer>
  );
};

// memo() erases the generic signature (it types the result as
// ComponentType<ServerSideGridProps<unknown>>), so the cast restores the
// original generic call shape for callers.
export default memo(ServerSideGrid) as typeof ServerSideGrid;
