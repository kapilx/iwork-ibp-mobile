import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";

export const WellnessContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(9, 18),
  width: "100%",
  maxWidth: "1366px",
  alignItems: "center",
  margin: "0 auto",
}));
export const WellnessWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
}));
export const WellnessTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(5),
}));

export const WellnessCardWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "stretch",
  gap: theme.spacing(7.5),
  width: "100%",
  "& > div:nth-of-type(3) ul": {
    marginLeft: theme.spacing(5), // adjust as needed
  },
}));
export const WellnessCardContainer = styled(Box)<{ background: string }>(
  ({ theme, background }) => ({
    background,
    borderRadius: theme.shape.borderRadii.large,
    padding: theme.spacing(6),
    textAlign: "center",
    maxWidth: 385,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    height: "100%", // Take full height of parent
    border: `0.5px solid ${theme.palette.text.StrokeGrey}`,
  })
);

export const WellnessCardIcon = styled("img")({
  width: 45,
  height: 45,
});

export const WellnessCardTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.xl,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.LightDark,
}));

export const WellnessCardDescription = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.LightDark,
  textAlign: "center",
  maxWidth: 282,
}));

export const WellnessCardFeatures = styled("ul")(({ theme }) => ({
  listStyle: "none",
  padding: 0,
  margin: theme.spacing(6, 0),
  flex: 1, // Take up available space
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
}));

export const WellnessFeatureItem = styled("li")(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.LightDark,
  lineHeight: "22px",
  textAlign: "left",
  position: "relative",
  paddingLeft: theme.spacing(2.5),
  "&::before": {
    content: '""',
    display: "inline-block",
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    backgroundColor: theme.palette.primary.main,
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    marginRight: theme.spacing(2), // control spacing
  },
}));

export const WellnessButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(40),
  padding: theme.spacing(2, 6),
  border: `1px solid ${theme.palette.text.LightDark}`,
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.LightDark,
  cursor: "pointer",
  whiteSpace: "nowrap",
}));
