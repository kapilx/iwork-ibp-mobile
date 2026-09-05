import { Box, styled, Typography } from "@mui/material";

export const UnauthorizedContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "center",
  marginTop: theme.spacing(11),
  width: "100%",
  // height: "100%",
}));

export const UnauthorizedImage = styled("img")({
  height: "auto",
  width: "100%",
});

export const UnauthorizedTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.grey,
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(2),
}));

export const UnauthorizedText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.sm,
  maxWidth: "551px",
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "20px",
  textAlign: "center",
  color: theme.palette.neutral.mediumDark,
}));
