import React, { useMemo, useState, memo, useCallback } from "react";
import { ColDef, CellClickedEvent } from "ag-grid-community";
import { Table } from "@ui/ui-lib";
import {
  EmptyStateContainer,
  createEmptyStateWithHeight,
  DataTableContainer,
} from "./styles";

export interface DataTableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface DataTableConfig {
  title?: string;
  height?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  enableSelection?: boolean;
  enableExport?: boolean;
}

interface DataTableProps {
  data: DataTableData;
  config?: DataTableConfig;
}

const DataTable: React.FC<DataTableProps> = memo(({ data, config = {} }) => {
  const {
    title,
    height = 400,
    enableSorting = true,
    enableFiltering = true,
    pageSize = 10,
  } = config;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [loading] = useState(false);
  const [sort, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>(
    []
  );
  const [columnOrder, setColumnOrder] = useState<any[]>([]);

  const allRowData = useMemo(() => {
    return data.rows.map((row, index) => {
      const rowObj: any = { id: index };
      data.headers.forEach((header, colIndex) => {
        const value = row[colIndex];
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          value === " "
        ) {
          rowObj[header] = "N/A";
        } else {
          rowObj[header] = value;
        }
      });
      return rowObj;
    });
  }, [data]);

  const effectivePageSize = useMemo(() => {
    const totalEntries = allRowData.length;
    return Math.min(pageSizeState, totalEntries || 1);
  }, [pageSizeState, allRowData.length]);

  const sortedData = useMemo(() => {
    if (sort.length === 0) return allRowData;

    return [...allRowData].sort((a, b) => {
      for (const sortItem of sort) {
        const { colId, sort: sortDirection } = sortItem;
        const aValue = a[colId];
        const bValue = b[colId];

        const aIsNA =
          aValue === "N/A" ||
          aValue === null ||
          aValue === undefined ||
          aValue === "";
        const bIsNA =
          bValue === "N/A" ||
          bValue === null ||
          bValue === undefined ||
          bValue === "";

        if (aIsNA && !bIsNA) return 1;
        if (!aIsNA && bIsNA) return -1;
        if (aIsNA && bIsNA) return 0;

        if (typeof aValue === "number" && typeof bValue === "number") {
          const result = aValue - bValue;
          return sortDirection === "asc" ? result : -result;
        }

        const aStr = String(aValue || "");
        const bStr = String(bValue || "");
        const result = aStr.localeCompare(bStr);
        return sortDirection === "asc" ? result : -result;
      }
      return 0;
    });
  }, [allRowData, sort]);

  const rowData = useMemo(() => {
    const startIndex = (currentPage - 1) * effectivePageSize;
    const endIndex = startIndex + effectivePageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, effectivePageSize]);

  const columns: ColDef[] = useMemo(() => {
    return data.headers.map((header) => {
      const headerLength = header.length;
      const calculatedMinWidth = Math.max(150, headerLength * 10 + 50);

      return {
        field: header,
        headerName: header,
        sortable: enableSorting,
        filter: enableFiltering,
        resizable: true,
        flex: 1,
        minWidth: calculatedMinWidth,
        headerClass: "no-text-overflow",
        valueFormatter: (params: any) => {
          const value = params.value;

          if (
            value === null ||
            value === undefined ||
            value === "" ||
            value === " "
          ) {
            return "N/A";
          }

          if (typeof value === "number") {
            return value.toLocaleString();
          }
          if (typeof value === "string" && value.includes("$")) {
            return value;
          }
          return value;
        },
        tooltipValueGetter: (params: any) => {
          const value = params.value;
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            value === " "
          ) {
            return "N/A";
          }
          return String(value);
        },
        tooltipField: header,
      };
    });
  }, [data.headers, enableSorting, enableFiltering]);

  const finalColumns = useMemo(() => {
    return columnOrder.length > 0 ? columnOrder : columns;
  }, [columns, columnOrder]);

  const PAGE_SIZE_OPTIONS = useMemo(() => {
    const allOptions = [5, 10, 25, 50, 100];
    const totalEntries = allRowData.length;
    const filteredOptions = allOptions.filter(
      (option) => option <= totalEntries
    );

    if (filteredOptions.length === 0) {
      return [5];
    }

    if (totalEntries > 0 && !filteredOptions.includes(totalEntries)) {
      filteredOptions.push(totalEntries);
      filteredOptions.sort((a, b) => a - b);
    }

    return filteredOptions;
  }, [allRowData.length]);

  const onCellClicked = useCallback((event: CellClickedEvent) => {}, []);

  const handleSortChange = useCallback(
    (
      newSort: React.SetStateAction<{ colId: string; sort: "asc" | "desc" }[]>
    ) => {
      setSort(newSort);
      setCurrentPage(1);
    },
    []
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: React.SetStateAction<number>) => {
      setPageSizeState(newPageSize);
      setCurrentPage(1);
    },
    []
  );

  if (!data || !data.headers || !data.rows || data.rows.length === 0) {
    return (
      <EmptyStateContainer sx={createEmptyStateWithHeight(height)}>
        No data available
      </EmptyStateContainer>
    );
  }

  return (
    <DataTableContainer>
      <Table
        enableSaveView={false}
        displaySettingsButton={false}
        columns={finalColumns}
        rowData={rowData}
        totalRows={sortedData.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={effectivePageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={handlePageSizeChange}
        onCellClicked={onCellClicked}
        setSort={handleSortChange}
        title={title}
        height={height}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey="nl2sql-datatable"
      />
    </DataTableContainer>
  );
});

export default DataTable;
