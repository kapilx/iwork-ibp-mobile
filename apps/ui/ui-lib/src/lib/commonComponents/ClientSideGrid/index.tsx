import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  ColDef,
  GridOptions,
  ClientSideRowModelModule,
  ModuleRegistry,
  AllCommunityModule,
  provideGlobalGridOptions,
} from "ag-grid-community";
import { ClientSideGridContainer } from "./styles";
import { StyledAgGridWrapper } from "../ServerSideGrid/styles";

ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions({
  theme: "legacy",
});

interface AGGridProps<T extends object> extends Partial<GridOptions<T>> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  pagination?: boolean;
  paginationPageSize: number;
  paginationPageSizeSelector: number[];
  height: number;
  width?: string | number;
  emptyDataMessage?: string;
}

const CommonAGGrid = <T extends object>({
  rowData,
  columnDefs,
  pagination = true,
  paginationPageSize,
  paginationPageSizeSelector,
  height,
  rowHeight,
  emptyDataMessage,
  width = "100%",
  ...rest
}: AGGridProps<T>) => {
  return (
    <ClientSideGridContainer
      data-testid="ClientSideGrid"
      className="ag-theme-alpine"
    >
      <StyledAgGridWrapper height={height}>
        <AgGridReact<T>
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={pagination}
          domLayout="normal"
          paginationPageSize={paginationPageSize}
          paginationPageSizeSelector={paginationPageSizeSelector}
          modules={[ClientSideRowModelModule]}
          rowModelType="clientSide"
          suppressMovableColumns={true}
          localeText={{
            noRowsToShow: emptyDataMessage || "No data to show",
          }}
          {...rest}
          defaultColDef={{
            resizable: true,
            filter: true,
          }}
          rowHeight={rowHeight}
        />
      </StyledAgGridWrapper>
    </ClientSideGridContainer>
  );
};

export default CommonAGGrid;
