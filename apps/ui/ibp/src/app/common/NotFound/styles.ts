import { Box, styled, Typography } from "@mui/material";

export const NotFoundContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  height: "100%",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(4),
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.default,
  justifyContent: "center",
}));

export const NotFoundMainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
}));

export const NotFoundText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.primary,
}));  
