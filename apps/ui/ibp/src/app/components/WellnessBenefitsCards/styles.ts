import { Box, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";

interface CardProps {
  bgcolor: string;
  expanded?: boolean;
  bgimage?: string;
}
export const WellnessBenefitsCardsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 18.75, 10),
  maxWidth: "1366px",
  margin: "0 auto",
}));
export const CardsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(7.5),
  // padding: theme.spacing(7.5),
  maxWidth: "1280px",
  margin: "0 auto",
}));
export const ContainerTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(5),
}));

export const CardItem = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "bgcolor" && prop !== "expanded" && prop !== "bgimage",
})<CardProps>(({ theme, bgcolor, expanded, bgimage }) => ({
  flex: expanded ? 2 : 1,
  backgroundColor: bgcolor,
  backgroundImage: bgimage ? `url(${bgimage})` : "none", // Set background image if provided
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundPosition: "center",
  borderRadius: theme.spacing(4),
  color: theme.palette.text.secondary,
  display: "flex",
  flexDirection: "column",
  padding: expanded ? theme.spacing(3) : theme.spacing(6),
  paddingRight: expanded ? theme.spacing(6) : 0,
  position: "relative",
  overflow: "hidden",
  transition: "all 0.3s ease",
  height: "338px",
  maxWidth: expanded ? "100%" : 219,
}));

export const CardContent = styled(Box)<{ expanded?: boolean }>(
  ({ expanded }) => ({
    display: "flex",
    flexDirection: expanded ? "row" : "column",
    height: "100%",
    width: "100%",
  })
);

export const CardImageContainer = styled(Box)<{ expanded?: boolean }>(
  ({ expanded }) => ({
    display: expanded ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    width: expanded ? "40%" : 0,
    height: "100%",
  })
);

export const CardTextContainer = styled(Box)<{ expanded?: boolean }>(
  ({ expanded }) => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    width: expanded ? "60%" : "100%",
    height: "100%",
    marginLeft: expanded ? 24 : 0,
    marginTop: expanded ? 18 : 0,
    maxWidth: "335px",
    position: "relative",
  })
);
export const CardTitle = styled(Typography)<{ expanded?: boolean }>(
  ({ theme, expanded }) => ({
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.medium,
    fontSize: theme.typography.fontSizes.xll,
    lineHeight: "100%",
    letterSpacing: "0px",
    marginBottom: expanded ? theme.spacing(1.5) : theme.spacing(3),
    color: theme.palette.text.secondary,
  })
);

export const WellnessCardFeatures = styled("ul")(({ theme }) => ({
  listStyle: "none",
  padding: 0,
  margin: theme.spacing(6, 0),
}));
export const WellnessFeatureItem = styled("li")(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
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
    backgroundColor: theme.palette.background.paper,
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    marginRight: theme.spacing(2), // control spacing
  },
}));
export const CardSubTitle = styled(Typography)<{ expanded?: boolean }>(
  ({ theme, expanded }) => ({
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.regular,
    fontFamily: theme.typography.fontFamily,
    lineHeight: "105%",
    letterSpacing: "0px",
    color: theme.palette.text.secondary,
    marginRight: expanded ? 0 : theme.spacing(4),
  })
);
export const ExpandArrowImage = styled("img")({
  position: "absolute",
  bottom: "1%",
  right: "12%",
});
export const CardDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  marginTop: theme.spacing(1),
  fontWeight: theme.typography.fontWeights.regular,
  fontFamily: theme.typography.fontFamily,
  lineHeight: "20px",
  letterSpacing: "0px",
  marginBottom: theme.spacing(8),
}));

export const EnrollButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontsize: theme.typography.fontSizes.sm,
  lineHeight: "100%",
  letterSpacing: "0px",
  border: `1px solid ${theme.palette.text.secondary}`,
  borderRadius: theme.spacing(4),
  textTransform: "none",
  padding: theme.spacing(3, 7),
  alignSelf: "flex-start",
  cursor: "pointer",
}));

export const DateCircle = styled(Box)(({ theme }) => ({
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  bottom: theme.spacing(8),
  right: theme.spacing(8),
  backgroundColor: theme.palette.text.secondary,
  borderRadius: "50%",
  padding: theme.spacing(5, 0),
  textAlign: "center",
  width: "80px",
  height: "80px",
  minWidth: 50,
  ".date-main": {
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.medium,
    fontSize: theme.typography.fontSizes.xl,
    letterSpacing: "0px",
    lineHeight: "24px",
    textTransform: "capitalize",
    color: theme.palette.text.LightDark,
  },
  ".date-year": {
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.medium,
    fontSize: theme.typography.fontSizes.md,
    lineHeight: "20px",
    color: theme.palette.text.LightDark,
    letterSpacing: "0px",
  },
}));

export const IllustrationImage = styled("img")(({ theme }) => ({
  position: "absolute",
  left: theme.spacing(2),
  bottom: theme.spacing(2),
}));
