import { Button } from "@ui/ui-lib";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(8),
  width: "97%",
  overflowX: "hidden",
  [theme.breakpoints.between("sm", "lg")]: {
    padding: theme.spacing(4),
    gap: theme.spacing(4),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    gap: theme.spacing(3),
  },
}));

interface DashboardTopSpacerProps {
  height: string;
}

export const DashboardTopSpacer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "height",
})<DashboardTopSpacerProps>(({ height }) => ({
  height,
}));

export const DashboardBannerCardsWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "1366px",
  margin: `${theme.spacing(4)} auto 0`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  padding: theme.spacing(0, 20),
  [theme.breakpoints.between("sm", "lg")]: {
    padding: theme.spacing(0, 6),
    gap: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 2),
    gap: theme.spacing(2),
    margin: `${theme.spacing(2)} auto 0`,
  },
}));
// Banner main wrapper
export const DashboardBannerWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  backgroundColor: theme.palette.background.LightOrange,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: theme.spacing(2.5),
  paddingBottom: theme.spacing(3.75),
  paddingRight: theme.spacing(9.5),
  borderRadius: theme.shape.borderRadius,
  height: 150,
  margin: `${theme.spacing(10)} ${theme.spacing(19)} ${theme.spacing(
    12.5,
  )} ${theme.spacing(18.5)}`,
  [theme.breakpoints.between("sm", "lg")]: {
    margin: theme.spacing(4, 0),
    paddingRight: theme.spacing(4),
    height: "auto",
    minHeight: 120,
  },
  [theme.breakpoints.down("sm")]: {
    margin: theme.spacing(2, 0),
    padding: theme.spacing(2),
    flexDirection: "column",
    alignItems: "flex-start",
    height: "auto",
    gap: theme.spacing(2),
  },
}));

// Left content section
export const DashboardLeftContent = styled(Box)(({ theme }) => ({
  zIndex: 2,
  color: theme.palette.text.primary,
  maxWidth: 214,
}));

export const DashboardLeftContentContainer = styled(Typography)(
  ({ theme }) => ({
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.regular,
    fontSize: theme.typography.fontSizes.xl,
    lineHeight: theme.spacing(7.5),
    letterSpacing: "0px",
    color: theme.palette.text.primary,
  }),
);

export const DashboardOfferImage = styled("img")(({ theme }) => ({
  zIndex: 2,
}));

export const DashboardOfferContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(7),
  zIndex: 2,
}));

export const DashboardMiddleYogaImage = styled("img")(({ theme }) => ({
  position: "absolute",
  top: "6%",
  left: "30%",
  zIndex: 1,
}));

export const DashboardRightContent = styled(Box)(({ theme }) => ({
  maxWidth: 235,
}));

export const DashboardRightContentContainer = styled(Typography)(
  ({ theme }) => ({
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.regular,
    fontSize: theme.typography.fontSizes.md,
    lineHeight: theme.spacing(5),
    letterSpacing: "0px",
    color: theme.palette.text.primary,
  }),
);

export const DashboardRightImage = styled("img")(({ theme }) => ({
  maxHeight: "100%",
  objectFit: "contain",
  zIndex: 2,
}));

export const DashboardRightSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(13),
}));

export const DashboardSectionWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.SeashellPeach,
  borderRadius: theme.shape.borderRadius,
  paddingBottom: theme.spacing(3.75),
  paddingLeft: theme.spacing(18.5),
  width: "100%",
  maxWidth: "1366px",
  margin: "0 auto",
  alignItems: "center",
  [theme.breakpoints.between("sm", "lg")]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
  [theme.breakpoints.down("sm")]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(3),
  },
}));
export const DashboardCloudWrapper = styled("img")(({ theme }) => ({
  position: "absolute",
  top: -50,
  left: 30,
  zIndex: 1,
}));

export const DashboardBirdWrapper = styled("img")(({ theme }) => ({
  position: "absolute",
  top: -48,
  left: 60,
  zIndex: 2,
}));
export const DashboardBottomCloudWrapper = styled("img")(({ theme }) => ({
  position: "absolute",
  top: 139,
  left: 480,
  zIndex: 2,
}));
export const DashboardTopCloudWrapper = styled("img")(({ theme }) => ({
  position: "absolute",
  top: -35,
  right: 370,
  zIndex: 2,
}));
export const DashboardRightCloudWrapper = styled("img")(({ theme }) => ({
  position: "absolute",
  top: 4,
  right: -68,
  zIndex: 2,
}));

export const DashboardWelcomeText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xl,
  lineHeight: "100%",
  letterSpacing: "0px",
  marginBottom: theme.spacing(6),
  color: theme.palette.text.LightDark,
  [theme.breakpoints.between("sm", "lg")]: {
    fontSize: theme.typography.fontSizes.lg,
    marginBottom: theme.spacing(4),
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.md,
    marginBottom: theme.spacing(3),
  },
}));

export const DashboardSearchBox = styled(Box)(({ theme }) => ({
  position: "relative",
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "15px",
  padding: `${theme.spacing(5)} ${theme.spacing(5)} ${theme.spacing(
    4.5,
  )} ${theme.spacing(5.5)}`,
  marginBottom: theme.spacing(7.5),
  display: "flex",
  alignItems: "center",
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  [theme.breakpoints.between("sm", "lg")]: {
    padding: theme.spacing(3, 3, 3, 3.5),
    marginBottom: theme.spacing(4),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2, 2.5),
    marginBottom: theme.spacing(3),
    borderRadius: "10px",
  },
}));

export const DashboardSearchInput = styled("input")(({ theme }) => ({
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
  padding: 0,
  "&::placeholder": {
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.regular,
    fontSize: theme.typography.fontSizes.lg,
    lineHeight: theme.spacing(5),
    letterSpacing: "0%",
    color: theme.palette.text.StrokeGrey,
    opacity: 1,
  },
}));

export const DashboardSearchIconWrapper = styled("div")(({ theme }) => ({
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: theme.spacing(1),
}));

export const DashboardActionsGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  width: "100%",
  columnGap: "50px",
  rowGap: theme.spacing(3),
  [theme.breakpoints.between("sm", "lg")]: {
    columnGap: "32px",
  },
  [theme.breakpoints.down("sm")]: {
    columnGap: "20px",
    rowGap: theme.spacing(2),
  },
}));

export const DashboardActionItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: 85,
  cursor: "pointer",
  textAlign: "center",
  "&:nth-child(2)": {
    maxWidth: 150,
  },
}));

export const DashboardActionIcon = styled("img")(({ theme }) => ({
  width: 70,
  height: 70,
}));

export const DashboardActionLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.lg,
  lineHeight: theme.spacing(5.5),
  letterSpacing: "0%",
  color: theme.palette.text.LightDark,
  textAlign: "center",
}));
export const DashboardBottomImagesWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  borderBottom: `0.5px solid ${theme.palette.border.lightGray}`,
  marginRight: theme.spacing(11.25),
  marginTop: "-24px",
}));

export const BannerLeftImage = styled("img")(({ theme }) => ({
  minWidth: 200,
}));
export const BottomOverlayRightDecoration = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  gap: theme.spacing(3),
  marginBottom: "-1px",
}));
export const BannerRightSectionFirstImage = styled("img")(({ theme }) => ({
  minWidth: 30,
}));
export const BannerRightSectionSecondImage = styled("img")(({ theme }) => ({
  minWidth: 140,
}));

// Policies section wrapper
export const DashboardPoliciesSection = styled(Box)(({ theme }) => ({
  // margin: theme.spacing(0, 5),
  // padding: theme.spacing(2.5, 0),
}));
export const DashboardLoader = styled(Box)(({ theme }) => ({
  height: "100vh",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export const ButtonWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(2),
}));
export const ButtonContainer = styled(Button)(({ theme }) => ({
  background: "#093F84 !important",
}));
