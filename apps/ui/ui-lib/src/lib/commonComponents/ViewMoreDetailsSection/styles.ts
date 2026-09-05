import { Box, styled, Typography } from "@mui/material";

export const ViewMoreContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(8),
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(4),
  },
}));

export const CommonLabelTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.disabled,
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const CommonValueTypography = styled(Typography)<{ hasClick?: boolean }>(
  ({ theme, hasClick }) => ({
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: hasClick
      ? theme.typography.fontWeights.regular
      : theme.typography.fontWeights.semiBold,
    color: hasClick
      ? theme.palette.button.secondary
      : theme.palette.text.primary,
    cursor: hasClick ? "pointer" : "line",
    textDecoration: hasClick ? "underline" : "none",
    [theme.breakpoints.down("sm")]: {
      fontSize: theme.typography.fontSizes.xs,
    },
  })
);

export const LabelValueHolder = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
    flexDirection: "column",
  },
}));