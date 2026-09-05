import { Box, styled } from "@mui/material";

export const ClaimsTableContainer = styled(Box)(({ theme }) => ({
  ".clickable-cell": {
    cursor: "pointer",
  },
  padding: theme.spacing(7.5, 5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(8),
  height: "calc(100vh - 55px)",
}));

export const ClaimsTitleContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
}));
