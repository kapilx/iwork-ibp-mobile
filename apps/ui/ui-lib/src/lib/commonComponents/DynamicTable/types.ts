import React from "react";

// T represents the type of data in each row
export interface TableColumn<T = any> {
  field: string; // Key or path to the data in the row object (e.g., "firstName" or "user.name")
  headerName: string; // Display name for the column header
  flex?: number; // Optional: for flex-grow behavior if the row is a flex container
  width?: string | number; // Optional: for setting a specific column width
  // Optional: for custom rendering of a cell's content
  renderCell?: (value: any, row: T, column: TableColumn<T>) => React.ReactNode;
}