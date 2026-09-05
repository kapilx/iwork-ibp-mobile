import { Box, IconButton, Typography, styled } from "@mui/material";

export const DrawerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(2, 0),
  margin: theme.spacing(0, 0, 0, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const DrawerContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const DrawerTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.primary.main,
}));

export const DrawerSubTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.primary.main,
  marginTop: theme.spacing(0.5),
}));

export const DrawerCloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.primary,
}));
