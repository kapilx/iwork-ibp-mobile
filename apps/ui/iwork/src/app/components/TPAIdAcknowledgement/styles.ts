import { Box, styled } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: theme.spacing(5, 0, 5, 0),
  // height: "calc(100vh - 60px)",
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(5),
  marginTop: theme.spacing(6),
}));
