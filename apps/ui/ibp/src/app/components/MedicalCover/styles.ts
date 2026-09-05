import { Box, Typography, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ibpTheme as theme } from "@ui/ui-lib";

export const PolicyContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  paddingLeft: theme.spacing(18.75),
  paddingRight: theme.spacing(18.75),
  borderRadius: theme.shape.borderRadius,
  position: "relative",
  margin: "0 auto",
  width: "100%",
  maxWidth: "1366px",
}));

export const PolicyHeaderWrapper = styled(Box)(({ theme }) => ({
  paddingBottom: theme.spacing(3.5),
  // maxWidth: "1366px",
  margin: "0 auto",
}));

export const PolicyHeading = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography,
  fontWeight: theme.typography.fontWeights.medium,
  marginTop: theme.spacing(7),
  fontSize: theme.typography.fontSizes.xll,
  lineHeight: "100%",
  letterSpacing: 0,
  color: theme.palette.text.primary,
}));

export const PolicyMainHeading = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  marginTop: theme.spacing(7),
  marginBottom: theme.spacing(2),
  fontSize: theme.typography.fontSizes.xll,
  lineHeight: "100%",
  letterSpacing: 0,
  color: theme.palette.text.primary,
  marginLeft: theme.spacing(10),
}));
export const PolicyTextBlock = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "1215px",
  marginRight: theme.spacing(59.25),
  height: "329px",
  position: "relative",
  background: "linear-gradient(277.2deg, #FFBCC4 7.6%, #FFE3CF 97.3%)",
  borderRadius: theme.spacing(2.5),
  paddingLeft: theme.spacing(7.75),
  marginBottom: theme.spacing(10),

  "& .MuiButton-root": {
    width: "130px",
    height: "36px",
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

export const PolicySubtext = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontweight: theme.typography.fontWeights.regular,
  lineHeight: 1.5,
  color: theme.palette.text.primary,
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(5),
}));

export const PolicyList = styled("ul")(({ theme }) => ({
  listStyle: "none",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "32px",
  padding: 0, // Reset all padding
  // paddingLeft: theme.spacing(3.75),
  margin: 0,
}));

export const PolicyListItem = styled("li")(({ theme }) => ({
  position: "relative",
  paddingLeft: theme.spacing(3),
  "&::before": {
    content: '""',
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: 4,
    height: 4,
    borderRadius: "50%",
    backgroundColor: theme.palette.primary.main,
  },
}));

export const PolicyImageWrapper = styled(Box)({
  position: "absolute",
  right: 0,
  top: "50%",
  width: "40%",
});

export const PolicyImage = styled("img")({
  position: "absolute",
  width: "357px",
  height: "262px",
  top: theme.spacing(-29.5),
  right: "14%",
});

export const EnrollSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  paddingTop: "25px",
  gap: theme.spacing(5.5),
}));

export const DividerLine = styled(Divider)(({ theme }) => ({
  height: 35,
  width: 0,
  backgroundColor: theme.palette.neutral.dark,
  alignSelf: "center",
}));

export const EndTime = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const Icon = styled("img")({
  width: 16,
  height: 18,
});

export const EndTimeText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
}));

export const DogImage = styled("img")(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(6),
  left: `calc(100% + ${theme.spacing(2.25)})`,
  zIndex: 1,
  width: "auto",
  height: "auto",
}));

export const DogOverlayImage = styled("img")(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(5.5),
  right: "-237px",
  zIndex: "-1",
}));

export const LinesImage = styled("img")(({ theme }) => ({
  position: "absolute",
  top: "-1.7%",
  left: "480px",
  width: "auto",
  height: "auto",
}));