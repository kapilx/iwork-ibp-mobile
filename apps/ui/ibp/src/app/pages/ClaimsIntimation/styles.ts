import { styled, Box, Typography } from "@mui/material";

export const ClaimsIntemationBanner = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "135px",
  marginTop: theme.spacing(13.25),
  background: "linear-gradient(100.91deg, #1F79D4 21.94%, #3EA0F1 71.2%)",
}));

export const ClaimsIntimationWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  flexDirection: "column",
  maxWidth: "1085px",
  margin: "0 auto",
  width: "100%",
}));
export const ClaimsRecentRequestContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(15),
}));
export const ClaimRequestHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  letterSpacing: "0px",
  marginTop: theme.spacing(10),
}));
export const ClaimsIntimationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  maxWidth: "1086px",
  width: "100%",
  backgroundColor: theme.palette.common.white,
  padding: theme.spacing(5, 8),
}));

export const ClaimsIntimationFormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const ClaimsIntimationNote = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.mediumGrey,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));
