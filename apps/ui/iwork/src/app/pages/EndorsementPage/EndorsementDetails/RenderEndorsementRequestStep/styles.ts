import { Box, styled, Typography } from "@mui/material";

// Refresh status + button wrapper (replaces inline styles)
export const RefreshWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  marginTop: theme.spacing(2),
}));

export const RefreshControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const RefreshStatusText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#c57e1cff",
}));

export const RefreshSpinner = styled("img")(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
  width: 18,
  height: 18,
  animation: "spin 1.8s linear infinite",
  "@keyframes spin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(-360deg)" },
  },
}));

export const RefreshHeaderTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const RefreshContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginRight: theme.spacing(2.5),
  gap: theme.spacing(1.5),
  boxShadow: theme.shadows[7],
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
}));

export const LoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  flex: 1,
  minHeight: 200, // fallback height when parent has no height yet
  padding: theme.spacing(4),
  "& > *": {
    flexShrink: 0,
  },
}));
export const TableContainer = styled(Box)(({ theme }) => ({
  position: "relative",
}));

export const FileNameWrapper = styled("span")(({ theme }) => ({
  color: theme.palette.primary.main,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const DownloadIcon = styled("img")(({ theme }) => ({
  paddingRight: theme.spacing(0.5),
}));
