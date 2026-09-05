import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";

export const ClaimsCornerContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(18.75, 0, 0),
  width: "100%",
  maxWidth: "1286px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(18.75, 3, 0),
    boxSizing: "border-box",
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(15, 2, 0),
    gap: theme.spacing(3),
  },
}));

export const PolicyCard = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
}));

export const HeaderSection = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  marginBottom: theme.spacing(3),
  "@media (max-width: 768px)": {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(3),
  },
}));

export const HeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(0.5),
  cursor: "pointer",
}));

export const Heading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const TabsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  alignItems: "center",
  borderBottom: `1px solid ${theme.palette.border.main}`,
  flexWrap: "wrap",
}));
export const ClaimsCornerImage = styled("img")(({ theme }) => ({
}));

export const PolicyHeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  padding: theme.spacing(4, 0),
  paddingTop: "0px",
  width: "100%",
}));

export const PolicyBadge = styled(Box)<{ gradient?: string }>(({ theme, gradient }) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: gradient || "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.common.white,
  flexShrink: 0,
}));

export const PolicyName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
}));

export const TabItem = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ theme, active }) => ({
  textTransform: "none",
  padding: theme.spacing(1, 0),
  minWidth: "max-content",
  fontWeight: active
    ? theme.typography.fontWeights.semiBold
    : theme.typography.fontWeights.medium,
  color: active
    ? theme.palette.text.deepOrangeColor
    : theme.palette.text.LightDark,
  borderBottom: active
    ? `3px solid ${theme.palette.text.deepOrangeColor}`
    : "3px solid transparent",
  borderRadius: 0,
  "&:hover": {
    background: "transparent",
    color: theme.palette.text.deepOrangeColor,
  },
}));

export const Section = styled(Box)(({ theme }) => ({
  width: "100%",
  marginTop:"12px"
}));

export const SectionHeader = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  marginBottom: theme.spacing(3),
}));

export const NoDataText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
  padding: theme.spacing(4),
  border: `1px dashed ${theme.palette.border.main}`,
  borderRadius: theme.spacing(2),
}));

export const LifeEventCard = styled(Box)(({ theme }) => ({
  width: "100%",
  borderRadius: theme.spacing(4),
  background: "#ACAFFC",
  border: `1px solid ${theme.palette.border.main}`,
  display: "flex",
  marginBottom: theme.spacing(10),
  flexDirection: "row",
  position: "relative",
  overflow: "hidden",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    marginBottom: theme.spacing(5),
  },
}));

export const LifeEventImage = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  display: "flex",
  alignItems: "flex-end",
  zIndex: 2,
  "& img": {
    top: 647,
    maxWidth: "100%",
    height: "auto",
  },
  "@media (max-width: 768px)": {
    justifyContent: "center",
    "& img": {
      maxHeight: 180,
      objectFit: "contain",
    },
  },
}));

export const LifeEventDesign = styled(Box)(({ theme }) => ({
  backgroundColor:
    "linear-gradient(90deg, rgba(243,240,255,1) 0%, rgba(238,236,255,1) 100%)",
  position: "absolute",
  right: 0,
  top: 70,
  bottom: 0,
  display: "flex",
  alignItems: "center",
  zIndex: 1,
  opacity: 0.2, // same as screenshot
  "& img": {
    height: "100%",
    width: "auto",
    objectFit: "cover",
  },
}));

export const LifeEventContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  zIndex: 2,
  paddingTop: theme.spacing(16.75),
  [theme.breakpoints.down("md")]: {
    paddingTop: theme.spacing(8),
  },
  "@media (max-width: 768px)": {
    paddingTop: theme.spacing(4),
    padding: theme.spacing(4),
  },
}));

export const LifeEventTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.neutral.dark,
  paddingBottom: theme.spacing(2.5),
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const LifeEventDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "22px",
  color: theme.palette.text.LightDark,
  maxWidth: "635px",
  paddingBottom: theme.spacing(7.5),
  "@media (max-width: 768px)": {
    maxWidth: "100%",
    fontSize: theme.typography.fontSizes.sm,
    paddingBottom: theme.spacing(4),
  },
}));

export const LifeEventButton = styled(Button)(({ theme }) => ({
  alignSelf: "flex-start",
  textTransform: "none",
  padding: theme.spacing(1.5, 2.5),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  background: "transparent",
  color: theme.palette.neutral.dark,
  border: `1px solid ${theme.palette.neutral.dark}`,
  borderRadius: theme.spacing(2),
  width: "max-content",
  "&:disabled": {
    cursor: "not-allowed",
  },
}));
export const FormButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: theme.spacing(2),
  position: "relative",
  top: theme.spacing(2),
  "@media (max-width: 768px)": {
    width: "100%",
    top: 0,
  },
}));
export const CancelButton = styled(Button)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  textTransform: "none",
  padding: theme.spacing(2.5, 10),
  borderRadius: theme.spacing(2),
  color: theme.palette.background.DarkBlue,
  borderColor: theme.palette.background.DarkBlue,
  "&:hover": {
    background: "transparent",
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(1.5, 4),
    fontSize: theme.typography.fontSizes.sm,
    flex: 1,
  },
}));
export const SubmitButton = styled(Button)(({ theme }) => ({
  background: theme.palette.background.DarkBlue,
  color: theme.palette.common.white,
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.md,
  textTransform: "none",
  padding: theme.spacing(2.5, 10),
  borderRadius: theme.spacing(2),
  "@media (max-width: 768px)": {
    padding: theme.spacing(1.5, 4),
    fontSize: theme.typography.fontSizes.sm,
    flex: 1,
  },

  "&.Mui-disabled": {
    background: "#ccc",
    color: "#666",
    cursor: "not-allowed",
  },
}));
export const LifeArrowIcon = styled("img")(({ theme }) => ({
}));
export const LifeEventContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "center",
  cursor: "pointer",
    "&:hover": {
    opacity: 0.7,
  },
}));
export const AddOnsGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(10),
  flexWrap: "wrap",
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(5),
  },
  "@media (max-width: 768px)": {
    gap: theme.spacing(3),
    flexDirection: "column",
  },
}));

export const AddOnCardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  paddingLeft: theme.spacing(2.25),
}));
export const ParentImg = styled("img")(({ theme }) => ({
  width: 43,
  height: 48,
}));
export const Titlecontainer = styled(Box)(({ theme }) => ({}));

export const AddOnCard = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  border: `0.5px solid ${theme.palette.border.borderGray}`,
  boxShadow: "0px 4px 14px 0px #EFE6E399",
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  width: "623px",
  [theme.breakpoints.down("md")]: {
    width: "100%",
    boxSizing: "border-box",
  },
}));

export const DetailsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(12.5),
  padding: theme.spacing(5, 0, 0, 2.25),
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(6),
  },
  "@media (max-width: 768px)": {
    gap: theme.spacing(4),
    flexWrap: "wrap",
    padding: theme.spacing(3, 0, 0, 0),
  },
}));

export const AddOnTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.ternary,
}));

export const AddOnSubTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.LightDark,
}));

export const AddOnAmountRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const AddOnLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.LightDark,
}));

export const InnerSectionHeader = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  maxWidth: "106px",
}));

export const PremiumSummaryCard = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(4),
  border: `0.5px solid ${theme.palette.border.borderGray}`,
  padding: theme.spacing(4),
  position: "relative",
  overflow: "hidden",
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(15),
  [theme.breakpoints.down("md")]: {
    gap: theme.spacing(8),
    flexWrap: "wrap",
  },
  "@media (max-width: 768px)": {
    flexDirection: "column",
    gap: theme.spacing(4),
  },
}));

export const PremiumImageContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  right: 30,
  width: "55%",
  height: "100%",

  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.25,
  },
}));

export const PremiumRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexWrap: "wrap",
}));

export const PremiumValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
}));
export const SubTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
}));
export const NoPageContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(15),
}));
