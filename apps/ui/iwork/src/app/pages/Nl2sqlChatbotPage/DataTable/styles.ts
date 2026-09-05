import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const EmptyStateContainer = styled(Box)(({ theme }) => ({
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9CA3AF",
  fontSize: "16px",
  fontWeight: 500,
})) as typeof Box;

export const createEmptyStateWithHeight = (height: number) => ({
  height: `${height}px`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9CA3AF",
  fontSize: "16px",
  fontWeight: 500,
});

export const DataTableContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  "& .ag-theme-alpine": {
    width: "100%",
    "& .ag-header": {
      backgroundColor: "#F3F7FF",
      borderBottom: "2px solid #E3F0FF",
      minHeight: "60px",
    },
    "& .ag-header-cell": {
      backgroundColor: "#F3F7FF",
      borderRight: "1px solid #E3F0FF",
      fontWeight: "600",
      fontSize: "16px",
      color: "#1E2861",
      padding: "16px 20px",
      minHeight: "60px",
      display: "flex",
      alignItems: "center",
      "&:hover": {
        backgroundColor: "#E3F0FF",
      },
    },
    "& .ag-header-cell-label": {
      fontWeight: "600",
      color: "#1E2861",
      fontSize: "16px",
    },
    "& .ag-header-cell-text": {
      fontWeight: "600",
      color: "#1E2861",
      fontSize: "16px",
    },
    "& .ag-sort-indicator-icon": {
      color: "#338CE5",
    },
    "& .ag-header-cell-sorted-asc .ag-sort-indicator-icon": {
      color: "#338CE5",
    },
    "& .ag-header-cell-sorted-desc .ag-sort-indicator-icon": {
      color: "#338CE5",
    },
    "& .ag-header-row": {
      minHeight: "60px",
    },
    "& .ag-header-cell-menu-button": {
      color: "#338CE5",
    },
    "& .ag-header-cell-menu-button:hover": {
      backgroundColor: "#E3F0FF",
    },
    "& .ag-filter-icon": {
      color: "#338CE5",
    },
    "& .ag-header-cell-filtered .ag-filter-icon": {
      color: "#FFBF00",
    },
  },
  "& .ag-root-wrapper": {
    width: "100%",
  },
  "& .ag-body-viewport": {
    width: "100%",
  },
  "& .ag-center-cols-container": {
    width: "100%",
  },
  "& .ag-header-viewport": {
    width: "100%",
  },
})) as typeof Box;
