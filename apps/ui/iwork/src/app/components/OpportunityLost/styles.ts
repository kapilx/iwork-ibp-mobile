import { Box, styled } from "@mui/material";

export const FormContainerStyles = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  padding: theme.spacing(2),
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: "16px",
}));
