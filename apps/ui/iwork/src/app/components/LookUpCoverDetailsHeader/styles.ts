import { Box, styled } from "@mui/material";

export const QuoteCoverDetailsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: theme.spacing(3),
}));
