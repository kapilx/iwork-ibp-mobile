import { EntityMetadata } from "typeorm";

/**
 * Returns a select options object for TypeORM that includes all columns except the specified excluded ones
 * @param metadata - Entity metadata from TypeORM repository
 * @param excludedColumns - Array of column names to exclude (defaults to standard audit columns)
 * @returns Record of column names mapped to boolean (true) for inclusion in query results
 */
export function getSelectableColumns(
  metadata: EntityMetadata,
  excludedColumns: string[] = [
    "createdAt",
    "updatedAt",
    "deletedAt",
    "deletedBy",
    "createdBy",
    "updatedBy",
    "password",
  ]
): Record<string, boolean> {
  const columnsToSelect: Record<string, boolean> = {};

  metadata.columns.forEach((column) => {
    const columnName = column.propertyName;
    if (!excludedColumns.includes(columnName)) {
      columnsToSelect[columnName] = true;
    }
  });

  return columnsToSelect;
}
