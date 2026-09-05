import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { TableColumn } from "./types";

interface DynamicTableProps<T> {
  rows: T[];
  columns: TableColumn<T>[];
  disableRowActions?: boolean;
  // You could add more props like:
  // isLoading?: boolean;
  // onRowClick?: (row: T) => void;
  // emptyStateMessage?: string;
  sx?: object; // Allow passing custom styles to the Paper container
}

// Helper function to safely get nested values from an object using a dot-notation string path
const getNestedValue = (obj: any, path: string): any => {
  if (!path || typeof path !== 'string') return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

const DynamicTable = <T extends Record<string, any>>({
  rows,
  columns,
  disableRowActions = false,
  sx, // Accept sx prop
}: DynamicTableProps<T>) => {

  return (
    <TableContainer component={Paper} sx={{ marginTop: 2, ...sx }}> {/* Apply sx prop here */}
      <Table stickyHeader aria-label="dynamic table" sx={{ minHeight: (rows && rows.length > 0) ? undefined : sx?.minHeight }}> {/* Apply minHeight to the Table itself only if empty */}
        <TableHead sx={{ "& .MuiTableCell-head": { fontWeight: "bold", backgroundColor: (theme) => theme.palette.grey[200] } }}>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.field}
                style={{ width: column.width }}
                sx={{ flex: column.flex }} // For flex behavior if TableRow is display:flex
              >
                {column.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        {rows && rows.length > 0 ? (
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow hover key={row.id || rowIndex}> {/* Prefer using a unique row.id if available */}
                {columns.map((column) => {
                  const cellValue = getNestedValue(row, column.field);
                  return (
                    <TableCell key={`${column.field}-${row.id || rowIndex}`} sx={{ flex: column.flex, width: column.width }}>
                      {column.renderCell
                        ? column.renderCell(cellValue, row, column)
                        : (cellValue !== undefined && cellValue !== null ? String(cellValue) : "N/A")}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        ) : (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length + (disableRowActions ? 0 : 1)} align="center" sx={{ py: 5 }}>
                <Typography variant="body2">No data to display.</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        )}
      </Table>
    </TableContainer>
  );
};

export default DynamicTable;