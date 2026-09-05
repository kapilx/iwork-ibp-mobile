import { Box, styled, Typography } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(6, 2),
  width: "100%",
  maxWidth: "1366px",
  margin: "0 auto",
  marginTop:"10%",
  height: "calc(100vh - 150px)",
  justifyContent: "center",

  "& .MuiButton-root": {
    border: "1px solid #2E2E2E",
    borderRadius: theme.spacing(40),
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
    lineHeight: "100%",
    color: theme.palette.text.LightDark,
  },
}));

export const TitleWrapper = styled(Box)(({ theme }) => ({
  maxWidth: 806,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(5),
  marginBottom: theme.spacing(13.75),
}));

export const Icon = styled("div")(({ theme }) => ({
  width: 99.58,
  height: 84,
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "34px",
  maxWidth: "680px",
  color: theme.palette.text.lightDark,
}));

export const FeaturesTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.lightDark,
  marginBottom: theme.spacing(6.25),
}));

export const FeaturesGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, 270px)",
  gap: theme.spacing(7.5),
  marginBottom: theme.spacing(10),
  justifyContent: "center",
}));

export const FeatureCard = styled(Box)(({ theme }) => ({
  background: "linear-gradient(332.35deg, #FFBCC4 -0.87%, #FFD8BB 108.17%)",
  width: "270px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 16,
  padding: theme.spacing(7.5, 2.25),
  color: theme.palette.text.primary,
  boxShadow: "0px 16px 24px 0px #FBE0D7",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  textAlign: "center",
}));

export const Description = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "28px",
  color: theme.palette.text.primary,
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: "195px",
  width: "100%",
}));