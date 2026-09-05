import { Box, Divider, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const CurrencyInputStyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const CurrencyInputStyledDivider = styled(Divider)(({ theme }) => ({
  paddingRight: theme.spacing(2),
}));

export const CurrencyInputStyledTypography = styled(Typography, {
  shouldForwardProp: (prop: string) => prop !== "error",
})<{ error?: boolean }>(({ theme, error }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: error
    ? `${theme.palette.text.error} !important`
    : `${theme.palette.text.labelColor} !important`,
}));
