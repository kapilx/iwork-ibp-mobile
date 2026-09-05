import { ColDef } from "ag-grid-community";

export interface DesiredConfig {
  name: string;
  index: number;
  hide: boolean;
}

/**
 * Reorders columns based on desired configuration
 * @param columns - Array of column objects with 'field' property
 * @param desiredConfig - Array of desired configuration with 'name', 'index', and 'hide' properties
 * @returns Reordered columns array based on desired config indices
 */
export const reorderColumnsByDesiredConfig = (
  columns: ColDef[],
  desiredConfig: DesiredConfig[]
): ColDef[] => {
  if (desiredConfig.length === 0) return columns;

  // Create a map for quick lookup of columns by field name
  const columnMap = new Map<string, ColDef>();

  columns.forEach((column) => {
    if (typeof column.field === "string") {
      columnMap.set(column.field, column);
    }
  });

  // Sort desired config by index to maintain order
  const sortedDesiredConfig = [...desiredConfig].sort(
    (a, b) => a.index - b.index
  );

  // Build reordered columns array
  const reorderedColumns: ColDef[] = [];

  sortedDesiredConfig.forEach((config) => {
    const matchingColumn = columnMap.get(config.name);
    if (matchingColumn) {
      // Add hide property based on desired config
      const columnWithHideProperty = {
        ...matchingColumn,
        hide: config?.hide ?? false,
      };
      reorderedColumns.push(columnWithHideProperty);
      // Remove from map to track processed columns
      columnMap.delete(config.name);
    }
  });

  // Add any remaining columns that weren't in the desired config
  // (in case there are columns not specified in desired config)
  columnMap.forEach((column) => {
    reorderedColumns.push(column);
  });

  return reorderedColumns;
};

export interface VisibleColumnExport {
  key: string;
  label: string;
}

// Filter the columns that are selected in table settings
export const getVisibleColumnsForExport = (
  columns: ColDef[]
): VisibleColumnExport[] =>
  columns
    .filter((column) => !column.hide && typeof column.field === "string")
    .map((column) => ({
      key: column.field as string,
      label:
        typeof column.headerName === "string"
          ? column.headerName
          : (column.field as string),
    }));
