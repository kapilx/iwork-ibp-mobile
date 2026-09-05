import { Box, styled, Typography } from "@mui/material";

export const Container = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),

  ".highlighted-field": {
    display: "flex",
    flexDirection: "column !important",
  },
  ".clickable-cell": {
    cursor: "pointer",
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const DrawerContentWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 80px)",
  overflow: "hidden",
}));

export const DrawerScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  paddingBottom: theme.spacing(2),
}));

export const DrawerFooter = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  zIndex: 10,
}));

export const RecordCount = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.regular,
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
