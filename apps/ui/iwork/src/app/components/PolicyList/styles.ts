import { Box, styled, Typography } from "@mui/material";
import { maxHeaderSize } from "http";

export const TitleContainer = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

export const PolicyListContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  // padding: theme.spacing(7.5, 5),

  ".clickable-cell": {
    cursor: "pointer",
  },
  ".titleContainer": {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  ".searchContainer": {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  ".right-aligned-cell": {
    textAlign: "right",
  },
  ".edit-button": {
    padding: theme.spacing(2.5, 3),
    minWidth: "auto",
    backgroundColor: theme.palette.common.white,
    maxHeight: "36px",
  },
}));

export const ActionsCell = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(3),
  opacity: 0,
  transition: "opacity 0.2s ease",
  ".ag-row:hover &": {
    opacity: 1,
  },
}));
