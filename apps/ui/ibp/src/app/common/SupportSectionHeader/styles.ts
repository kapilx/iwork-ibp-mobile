import { styled, Box, Typography } from "@mui/material";

export const SupportSectionHeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  alignItems: "center",
  borderBottom: "1px solid #0000001A",
  paddingBottom: theme.spacing(3),
  gap:theme.spacing(4.25),
}));



export const SupportSectionHeaderImage = styled("img")(({ theme }) => ({
  maxWidth:"60px",
  maxHeight:"60px",
}));

export const SupportSectionHeaderText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xxl,
  lineHeight: "100%",
  letterSpacing: "0px",
  color: theme.palette.text.primary,
}));