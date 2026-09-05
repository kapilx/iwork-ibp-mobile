import { Box, styled, Typography } from "@mui/material";

export const QuoteComparisonMainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
}));

export const VersionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "104px",
  width: "40px",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  overflow: "hidden",
  cursor: "pointer",
}));

export const VersionTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.primary,
  transform: "rotate(270deg)",
  whiteSpace: "nowrap",
  display: "block",
  width: "104px",
  textAlign: "center",
}));
export const VersionDetailsContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#F1E2FD",
  display: "flex",
  flexDirection: "column",
  height: "104px",
  width: "100%",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));

export const ComparisonPrimarySection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  gap: theme.spacing(6),
  padding: theme.spacing(3),
}));

export const ComparisonSecondarySection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  gap: theme.spacing(6),
  padding: theme.spacing(3),
}));

export const CommonTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.primary,
  fontWeight: 400,
}));
