import { Box, Typography, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ibpTheme as theme } from "@ui/ui-lib";

export const InsuranceContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  paddingLeft: theme.spacing(18.75),
  paddingRight: theme.spacing(18.75),
  borderRadius: theme.shape.borderRadius,
  position: "relative",
  maxWidth: "1366px",
  width: "100%",
  margin: "0 auto",
  paddingTop: theme.spacing(12.5),
}));

export const InsuranceTextBlock = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "1215px",
  height: "219px",
  position: "relative",
  background:  theme.palette.summaryCards[9].bg,
  borderRadius: theme.spacing(4),
  paddingLeft: theme.spacing(7.75),
  border: `0.5px solid ${theme.palette.border.main}`,

  "& .MuiButton-root": {
    width: "230px",
    height: "40px",
    border: "none",
    borderRadius: theme.spacing(40),
    // background: "transparent !important",
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
    lineHeight: "100%",
    color: theme.palette.text.LightDark,
  },
}));

export const InsuranceHeading = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography,
  fontWeight: theme.typography.fontWeights.medium,
  marginTop: theme.spacing(7.5),
  fontSize: theme.typography.fontSizes.xxll,
  lineHeight: "100%",
  letterSpacing: 0,
  color: theme.palette.text.primary,
}));

export const InsuranceSubtext = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontweight: theme.typography.fontWeights.regular,
  lineHeight: 1.5,
  color: theme.palette.text.primary,
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(5),
  maxWidth: 586,
}));

export const LinesImage = styled("img")(({ theme }) => ({
  position: "absolute",
  top: "-3%",
  left: "460px",
  width: "auto",
  height: "auto",
}));

export const InsuranceImageWrapper = styled(Box)({
  position: "absolute",
  right: 0,
  top: "50%",
  width: "40%",
});

export const InsuranceImage = styled("img")({
  position: "absolute",
  width: "183px",
  height: "167px",
  top: theme.spacing(-13.75),
  right: "18%",
});
