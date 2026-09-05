import { Box, styled } from "@mui/material";

export const TableWrapper = styled(Box)(() => ({
  "& .right-aligned-clickable-cell": {
    cursor: "pointer",
    color: "#1976d2",
    textDecoration: "underline",
    textAlign: "right",
  },
}));
