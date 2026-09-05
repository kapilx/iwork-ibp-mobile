import { Box, styled } from "@mui/material";

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(6),
  marginTop: theme.spacing(4),
}));
