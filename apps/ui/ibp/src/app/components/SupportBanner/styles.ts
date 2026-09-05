import { styled, Box, Typography } from "@mui/material";

export const SupportBannerContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "withHeaderOffset",
})<{ withHeaderOffset?: boolean }>(({ theme, withHeaderOffset = true }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(4),
  marginTop: withHeaderOffset ? theme.spacing(14.5) : theme.spacing(2),
  // paddingBottom: theme.spacing(13.75),
  background: theme.palette.background.DarkBlue,
  width: "100%",
  position: "relative",
}));

export const SupportBannerHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.common.white,
  textAlign: "center",
}));
export const SupportBannerTextContainer = styled(Typography)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  paddingBottom: theme.spacing(2.5),
}));
export const SupportBannerDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.common.white,
  textAlign: "center",
  maxWidth: "600px",
}));
export const SupportBannerImage = styled("img")(() => ({
  position: "absolute",
  top: "41.5%",
  right: "0px",
}));

export const SearchInputContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.common.white,
  padding: theme.spacing(3.75),
  border: `1px solid ${theme.palette.neutral.dark}`,
  boxShadow: "0px 4px 4px 0px #00000026",
  width: "100%",
  maxWidth: "850px",
  marginTop: theme.spacing(6),
  borderRadius: theme.spacing(3),
}));

export const SearchInput = styled("input")(({ theme }) => ({
  border: "none",
  outline: "none",
  fontSize: theme.typography.fontSizes.md,
  width: "100%",
  color: theme.palette.text.primary,
  "&::placeholder": {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.text.tertiary,
    letterSpacing: "0px",
    fontFamily: theme.typography.fontFamily,
    opacity: 0.6,
  },
}));
