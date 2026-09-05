import {
  Box,
  Card,
  Typography,
  CardContent,
  Button,
  TableContainer,
  IconButton,
} from "@mui/material";
import { keyframes, styled } from "@mui/material/styles";
import { LifeEventFlowType } from "./constants";
import { spacing } from "@mui/system";
import { color } from "echarts";

const getFlowPalette = (theme: any, flowType: LifeEventFlowType) => ({
  light: flowType === "addition" ? "#c0d5f6" : "#FFEDEE",
  main:
    flowType === "addition"
      ? "#308EE4"
      : theme.palette.error.main,
  border: flowType === "addition" ? "#308EE4" : "#FFD9DD",
  contrastText:
    flowType === "addition"
      ? theme.palette.primary.contrastText
      : theme.palette.error.contrastText,
});

export const LifeEventsMainContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(9),
  maxWidth: 1920,
  width: "100%",
  margin: "0px auto",
  minHeight: "100vh",
  position: "relative",
  maxWidth: "1366px",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -1,
   },
}));

export const MainTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
}));
export const LifeEventsHeaderSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  width: "100%",
  padding: theme.spacing(5.25, 9),
  background: `linear-gradient(94.26deg, #1B5092 0%, #266AB7 36.89%, #1675BC 61.3%, #197087 109.99%)`,

  boxSizing: "border-box",
  marginTop: theme.spacing(13.5),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
    gap: theme.spacing(2),
  },
}));

export const LifeEventsHeaderIcon = styled("img")(({ theme }) => ({
  width: 56,
  height: 56,
  display: "block",
  flexShrink: 0,
  [theme.breakpoints.down("sm")]: {
    width: 36,
    height: 36,
  },
}));

export const LifeEventsHeaderText = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
}));

export const LifeEventsHeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.common.white,
  marginBottom: theme.spacing(0.5),
}));

export const LifeEventsHeaderSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: "rgba(255, 255, 255, 0.9)",
  fontWeight: theme.typography.fontWeights.regular,
}));

export const LifeEventsMainTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(3),
  lineHeight: 1.2,
}));

export const LifeEventsMainSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.tertiary,
  maxWidth: 760,
  margin: "0 auto",
  lineHeight: 1.55,
  opacity: 0.6,
}));

export const LifeEventsFlowCard = styled(Card)<{ flowType: LifeEventFlowType }>(
  ({ theme, flowType }) => {
    const palette = getFlowPalette(theme, flowType);

    return {
      width: 290,
      height: 193,
      borderRadius: 8,
      boxShadow: "0 5px 10px 0 #0000001A",
      border: `1px solid ${theme.palette.background.paper}`,
      cursor: "pointer",
      transition:
        "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      background:
        "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
      overflow: "hidden",
      position: "relative",
      "&:hover": {
        transform: "translateY(-4px)",
        border: `1px solid ${palette.main}`,
      },
    };
  }
);

export const DisabledLifeEventsFlowCard = styled(LifeEventsFlowCard)(
  ({ theme }) => ({
    background: "#EBEBEB",
    cursor: "not-allowed",
    pointerEvents: "auto",
    "& .MuiCardContent-root": {
      opacity: 0.6,
    },
    "&:hover": {
      transform: "none",
      border: `1px solid ${theme.palette.border.gray}`,
    },
  })
);

export const NotEligibleBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  right: 0,
  backgroundColor: theme.palette.background.paper,
  color: "#222222B5",
  padding: theme.spacing(2.5, 2),
  borderRadius: "0px 8px 0px 8px",
  whiteSpace: "nowrap",
  zIndex: 1,
  height: "37px",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  boxShadow: "0px 2px 4px 0px #00000040",
}));

export const LifeEventsFlowCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2.75, 2.75, 0),
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textAlign: "left",
  height: "100%",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2.5, 2.5, 2),
  },
  '&:last-child': {
    paddingBottom: 0,
  },
}));

export const LifeEventsFlowIconContainer = styled(Box)<{
  flowType: LifeEventFlowType;
}>(({ theme, flowType }) => {
  const palette = getFlowPalette(theme, flowType);

  return {
    width: theme.spacing(20),
    height: theme.spacing(20),
    borderRadius: theme.spacing(4.5),display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing(5),"& .MuiSvgIcon-root": {
      fontSize: theme.typography.fontSizes.xlg,
      color: palette.contrastText,
    },
    "& img": {
      width: "100%",
      height: "auto",
      display: "block",
    },
  };
});

export const LifeEventsCardBody = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.75),
}));

export const LifeEventsFlowTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: 0,
  color: "#2E2E2E",
  lineHeight: 1.2,
}));

export const LifeEventsFlowDescription = styled(Typography)(({ theme }) => ({
  color: "#696565",
  marginBottom: 0,
  flex: 1,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const LifeEventsCardFooter = styled(Box)(({ theme }) => ({
  width: "100%",
  marginTop: "auto",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
}));

export const LifeEventsCardIllustration = styled(Box)(({ theme }) => ({
  // width: 160,
  // height: 200,
  flexShrink: 0,
  alignSelf: "flex-end",
  marginTop: `-${theme.spacing(6.25)}`,
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "bottom",
    display: "block",
  },
}));

export const LifeEventsCardActionButton = styled(Button)(({ theme }) => ({
  width: 30,
  minWidth: 30,
  height: 30,
  borderRadius: 4,
  backgroundColor: "#0E3F8A",
  color: theme.palette.common.white,
  boxShadow: "none",
  textTransform: "none",
  padding: 0,
  marginBottom: theme.spacing(6),
  marginRight: theme.spacing(3.5),
  flexShrink: 0,
  "& .MuiSvgIcon-root": {
    fontSize: 22,
  },
  "&:hover": {
    backgroundColor: "#0A3575",
  },
  "&.Mui-disabled": {
    backgroundColor: "#0E3F8A",
    color: theme.palette.common.white,
  },
}));

export const LifeEventsCommonReasonsSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  width: "100%",
}));

export const LifeEventsCommonReasonsTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const LifeEventsCarouselContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  boxSizing: "border-box",
}));

export const LifeEventsCarouselViewport = styled(Box)(({ theme }) => ({
  overflowX: "hidden",
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(3),
  scrollBehavior: "smooth",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
  [theme.breakpoints.down("sm")]: {
    paddingLeft: theme.spacing(5),
    paddingRight: theme.spacing(5),
    marginLeft: `-${theme.spacing(5)}`,
    marginRight: `-${theme.spacing(5)}`,
  },
}));

export const LifeEventsCarouselTrack = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4),
  width: "max-content",
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
}));

export const LifeEventsCarouselNavButton = styled(Button)<{
  side: "left" | "right";
}>(({ theme, side }) => ({
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  [side]: 0,
  minWidth: 0,
  width: 50,
  height: 50,
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.common.white,
  color: theme.palette.primary.dark,
  boxShadow: "0px 10px 30px rgba(15, 23, 42, 0.18)",
  border: `1px solid ${theme.palette.grey[200]}`,
  zIndex: 2,
  "& .MuiSvgIcon-root": {
    fontSize: theme.typography.fontSizes.xl,
  },
  "&:hover": {
    backgroundColor: theme.palette.common.white,
    boxShadow: "0px 0px 24px 0px #00000073",
  },
  "&.Mui-disabled": {
    opacity: 0,
    pointerEvents: "none",
  },
}));

export const LifeEventsReasonTags = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  gap: theme.spacing(2),
}));

export const LifeEventsReasonTag = styled(Box)<{ variant: LifeEventFlowType }>(
  ({ theme, variant }) => {
    const palette = getFlowPalette(theme, variant);

    return {
      display: "inline-flex",
      alignItems: "center",
      padding: `${theme.spacing(1)} ${theme.spacing(2.25)}`,
      borderRadius: theme.spacing(4),
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.medium,
      backgroundColor: variant === "addition" ? "#F1F6FF" : "#FFF3F4",
      color: palette.main,
      "& .MuiSvgIcon-root": {
        fontSize: theme.typography.fontSizes.sm,
        marginRight: theme.spacing(1),
      },
    };
  }
);

export const LifeEventsStartButton = styled(Button)<{
  flowType: LifeEventFlowType;
}>(({ theme, flowType }) => {
  const palette = getFlowPalette(theme, flowType);

  return {
    backgroundColor: "transparent",
    color: palette.main,
    padding: 0,
    borderRadius: 0,
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: theme.typography.fontWeights.semiBold,
    textTransform: "none",
    alignSelf: "flex-start",
    minWidth: "unset",
    "& .MuiButton-endIcon": {
      marginLeft: theme.spacing(1),
      marginTop: theme.spacing(1),
      transition: "transform 0.2s ease",
    },
    "&:hover": {
      backgroundColor: "transparent",
      "& .MuiButton-endIcon": {
        transform: "translateX(4px)",
      },
    },
  };
});

export const LifeEventsBackButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(7),
  padding: theme.spacing(1.25, 2),
  borderRadius: theme.spacing(3),
  color: theme.palette.text.tertiary,
  textTransform: "none",
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  alignSelf: "flex-start",
  "&:hover": {
    backgroundColor: theme.palette.background.light,
  },
}));

// Main Page Styled Components
export const PageContainer = styled(Box)(({ theme }) => ({
  padding: 0,
  maxWidth: "100%",
  margin: "50px 0 70px",
  width: "100%",
  backgroundColor: "#E8F1FB",
  boxSizing: "border-box",
  overflowX: "clip",
  [theme.breakpoints.down("md")]: {
    padding: 0,
  },
  "@media (max-width: 768px)": {
    margin: "50px 0 80px",
    paddingBottom: theme.spacing(10),
  },
}));

export const StepperContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  padding: theme.spacing(5, 5, 4),
  background:
    "linear-gradient(94.26deg, #1B5092 0%, #266AB7 36.89%, #1675BC 61.3%, #197087 109.99%)",
  borderRadius: 0,
  border: "1px solid rgba(255, 255, 255, 0.25)",
  boxShadow: "0 10px 30px rgba(8, 45, 84, 0.22)",
  overflow: "hidden",
  "@media (max-width: 768px)": {
    padding: theme.spacing(3, 2, 2.5),
    marginBottom: theme.spacing(3),
  },
}));

export const StepperIllustration = styled("img")(() => ({
  // height: 140,
  width: "auto",
  objectFit: "contain",
  flexShrink: 0,
  alignSelf: "flex-end",
  marginLeft: 24,
  "@media (max-width: 768px)": {
    display: "none",
  },
}));

export const LifeEventsStepperHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  "@media (max-width: 768px)": {
    marginBottom: theme.spacing(2),
  },
}));

export const LifeEventsStepperTitle = styled(Typography)(({ theme }) => ({
  color: "#FFFFFF",
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  lineHeight: 1.2,
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const LifeEventsStepperSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  color: "rgba(255, 255, 255, 0.9)",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const LifeEventsStepperRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  width: "70%",
  "@media (max-width: 768px)": {
    width: "100%",
    flexWrap: "nowrap",
    paddingBottom: theme.spacing(0.5),
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
}));

export const LifeEventsStepperItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  flex: 1,
  minWidth: 0,
  "@media (max-width: 768px)": {
    minWidth: 68,
    flex: "0 0 auto",
  },
}));

export const LifeEventsStepperIconCircle = styled(Box)<{
  state: "completed" | "active" | "inactive";
}>(({ theme, state }) => ({
  width: theme.spacing(10),
  height: theme.spacing(10),
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor:
    state === "completed"
      ? "#09C94B"
      : state === "active"
      ? "rgba(255, 255, 255, 0.22)"
      : "rgba(255, 255, 255, 0.16)",
  color:
    state === "inactive"
      ? "rgba(255, 255, 255, 0.65)"
      : state === "active"
      ? theme.palette.common.white
      : theme.palette.common.white,
  "& .MuiSvgIcon-root": {
    fontSize: theme.typography.fontSizes.xxl,
  },
  "@media (max-width: 768px)": {
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
}));

export const LifeEventsStepperLabel = styled(Typography)<{
  state: "completed" | "active" | "inactive";
}>(({ theme, state }) => ({
  marginTop: theme.spacing(3),
  fontSize: theme.typography.fontSizes.xss,
  fontWeight:
    state === "inactive"
      ? theme.typography.fontWeights.regular
      : theme.typography.fontWeights.medium,
  color:
    state === "inactive"
      ? "rgba(255, 255, 255, 0.75)"
      : theme.palette.common.white,
  textAlign: "center",
  "@media (max-width: 768px)": {
    fontSize: "9px",
  },
}));

export const LifeEventsStepperConnector = styled(Box)<{
  complete?: boolean;
}>(({ theme, complete }) => ({
  flex: 1,
  height: theme.spacing(0.5),
  borderRadius: theme.spacing(1),
  margin: `${theme.spacing(4)} ${theme.spacing(2)} 0`,
  backgroundColor: complete ? "#09C94B" : "rgba(255, 255, 255, 0.5)",
  "@media (max-width: 768px)": {
    margin: `${theme.spacing(3)} ${theme.spacing(1)} 0`,
    minWidth: 16,
  },
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(0),
  padding: theme.spacing(0),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(0, 2, 2),
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(0, 1.5, 2),
    paddingBottom: theme.spacing(10),
  },
}));

export const NavigationButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginTop: 32,
}));

export const LifeEventsStepActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

export const LifeEventsStepSecondaryButton = styled(Button)(({ theme }) => ({
  minWidth: theme.spacing(26),
  padding: theme.spacing(1.75, 3),
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  backgroundColor: theme.palette.common.white,
  color: theme.palette.text.tertiary,
  textTransform: "none",
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  "&:hover": {
    backgroundColor: theme.palette.common.white,
    borderColor: theme.palette.background.buttonbackground,
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

export const LifeEventsStepPrimaryButton = styled(Button)(({ theme }) => ({
  minWidth: theme.spacing(30),
  padding: theme.spacing(1.75, 3.5),
  borderRadius: theme.spacing(2),
  textTransform: "none",
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  "&:hover": {
    background: theme.palette.background.buttonbackground,
    color: theme.palette.background.paper,
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

// Life Event Selection Styled Components
export const LifeEventCard = styled(Card)<{ selected?: boolean }>(
  ({ selected, theme }) => ({
    cursor: "pointer",
    marginBottom: 16,
    // width: "900px",
    width: "100%",
    transition: "all 0.3s ease",
    boxShadow: "0px 6px 100px 0px #0000001A",
    background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
    "&:hover": {
      transform: "scale(1.010)",
      background:
        "linear-gradient(355deg, rgba(5, 109, 210, 0.03) 21.39%, rgba(5, 109, 210, 0.23) 183.31%)",
      border: `1px solid #0868D0`,
    },
  })
);

export const RequiredDocuments = styled(Box)(({ theme }) => ({
  marginTop: 12,
  paddingLeft: 16,
}));

export const LifeEventDescription = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

// Step Content Styled Components
export const StepContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  // minHeight: '100vh',
  width: "95%",
}));

// Premium Review Step Cards
export const PremiumReviewContainer = styled(Box)(({ theme }) => ({
  maxWidth: '1400px',
  margin: '0 auto',
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  boxShadow: 'none',
}));

export const PremiumReviewCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.background.divider}`,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  overflow: 'hidden',
  padding: theme.spacing(3),
}));

export const PremiumSectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.background.divider}`,
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
}));

export const PremiumSummaryCard = styled(Box)(({ theme }) => ({
  backgroundColor: '#DDEBFB',
  borderRadius: theme.spacing(2),
  border: 'none',
  padding: theme.spacing(2.5),
  marginTop: theme.spacing(2),
}));
export const PremiumSummaryCardForSummary = styled(Box)(({ theme }) => ({
  backgroundColor: '#187FE30D',
  borderRadius: theme.spacing(2),
  border: '1px solid #bfdbfe',
  padding: theme.spacing(5, 7.5),
  marginTop: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
}));

// Premium Review Typography Components
export const PremiumBreakdownTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(3),
}));

export const PremiumSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(2),
}));

export const PremiumPolicyCategory = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.mediumGrey,
  marginBottom: theme.spacing(0.5),
}));

export const PremiumPolicyName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const PremiumPolicyAmount = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isReduction',
})<{ isReduction?: boolean }>(({ theme, isReduction }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: isReduction ? '#dc2626' : '#6b7280',
}));

export const PremiumSummaryLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const PremiumSummaryValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const PremiumReductionValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: '#16a34a',
}));

export const PremiumTotalLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: '#1e40af',
}));

export const PremiumTotalValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  color: '#1e40af',
}));

// Premium Review Layout Components
export const PremiumPolicyRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
  paddingBottom: theme.spacing(1),
}));

export const PremiumPolicyRowWithBorder = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.background.divider}`,
}));

export const PremiumSummaryRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1.5),
  paddingBottom: theme.spacing(1),
}));

export const PremiumSummaryRowWithBorder = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1.5),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.background.divider}`,
}));
export const PremiumTotalSummaryRowWithBorder = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
}));

export const PremiumTotalRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

export const PremiumActionsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
  padding: theme.spacing(1.75, 4),
  borderTop: `1px solid ${theme.palette.background.divider}`,
  borderLeft: "none",
  borderRight: "none",
}));

export const PremiumLoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

export const PremiumPolicyDetails = styled(Box)(({ theme }) => ({
  // Base Box - no additional styles needed
}));

export const StepTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
}));

// Deletion Flow Styled Components
export const DeletionReasonCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: "#f8d7da",
  border: "1px solid #f5c6cb",
}));

export const DependentInfoCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: "#f8f9fa",
  border: "1px solid #dee2e6",
}));

export const DependentInfoSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const DependentInfoLabel = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontWeight: 500,
  color: theme.palette.text.tertiary,
}));

export const DependentInfoValue = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
}));

export const ComponentsToRemoveCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: "white",
  border: "1px solid #dee2e6",
}));

export const ComponentsTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(3),
}));

export const ComponentsDescription = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  color: theme.palette.text.primary,
}));

export const ComponentRemovalCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: "#fff5f5",
  border: "1px solid #f5c6cb",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const ComponentBulletPoint = styled(Box)(({ theme }) => ({
  width: 8,
  height: 8,
  backgroundColor: theme.palette.error.main,
  borderRadius: "50%",
}));

export const ComponentLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

export const ImportantNoticeCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "#fff3cd",
  border: "2px solid #ffeaa7",
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
}));

export const NoticeIcon = styled(Box)(({ theme }) => ({
  backgroundColor: "#f0ad4e",
  borderRadius: "50%",
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginTop: theme.spacing(0.5),
}));

export const NoticeIconText = styled(Typography)(({ theme }) => ({
  color: "white",
  fontWeight: "bold",
  fontSize: "14px",
}));

export const NoticeTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: "#856404",
  marginBottom: theme.spacing(1),
}));

export const NoticeDescription = styled(Typography)(({ theme }) => ({
  color: "#856404",
}));

// Coming Soon Styled Components
export const ComingSoonCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "#fff3cd",
  border: "1px solid #ffeaa7",
}));

export const ComingSoonTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 500,
}));

export const ComingSoonDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.tertiary,
}));

// Success Components
export const SuccessCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "#d4edda",
  border: "1px solid #c3e6cb",
}));

export const SuccessTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 500,
}));

// Error/Warning Components
export const ErrorMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.tertiary,
}));

// Dependent Management Components (Legacy - kept for backward compatibility)
export const DependentContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
  fontWeight: 600,
}));

export const DependentFormCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  backgroundColor: "white",
  overflow: "visible",
}));

export const FormRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  flexWrap: "wrap",
}));

export const FormField = styled(Box)(({ theme }) => ({
  flex: "1 1 250px",
  minWidth: "250px",
}));

export const DatePickerWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const AddDependentButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const FormTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
}));

export const FormActionButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

// -----------------------------------------------------------------------
// Success page (addition / deletion submission)
// -----------------------------------------------------------------------

export const LifeEventsSuccessPageContent = styled(Box)(({ theme }) => ({
  maxWidth: 980,
  margin: "0 auto",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const LifeEventsTitleCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  // gap: theme.spacing(3),
  backgroundColor: "transparent",
  boxShadow: "none",
  border: "none",
}));
export const LifeEventsSuccessIconOuter = styled(Box)(() => ({
  margin: "0 auto",
  width: 92,
  height: 92,
  borderRadius: "50%",
  backgroundColor: "rgba(34, 197, 94, 0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const LifeEventsSuccessIconInner = styled(Box)(() => ({
  width: 56,
  height: 56,
  borderRadius: "50%",
  backgroundColor: "#EAFBF1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid rgba(34, 197, 94, 0.35)",
  "& .MuiSvgIcon-root": {
    fontSize: 34,
    color: "#16A34A",
  },
}));

export const LifeEventsSuccessTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const LifeEventsSuccessSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const LifeEventsRequestDetailsCard = styled(Card)(({ theme }) => ({
  // marginTop: theme.spacing(5),
  textAlign: "left",
  borderRadius: theme.spacing(2),
  boxShadow: "none",
  border: "1px solid #E5E7EB",
}));

export const LifeEventsRequestDetailsHeader = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(4)} ${theme.spacing(4)}`,
}));

export const LifeEventsRequestDetailsHeaderTitle = styled(Typography)(
  ({ theme }) => ({
    fontWeight: theme.typography.fontWeights.semiBold,
    fontSize: theme.typography.fontSizes.xl,
  })
);

export const LifeEventsRequestDetailsDivider = styled(Box)(() => ({
  height: 1,
  width: "100%",
  backgroundColor: "#E5E7EB",
}));

export const LifeEventsRequestDetailsContent = styled(CardContent)(
  ({ theme }) => ({
    padding: `${theme.spacing(4)} ${theme.spacing(4)}`,
  })
);

export const LifeEventsRequestDetailsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  columnGap: theme.spacing(8),
  rowGap: theme.spacing(3),
}));

export const LifeEventsRequestDetailsField = styled(Box)(() => ({}));

export const LifeEventsRequestDetailsLabel = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
  })
);

export const LifeEventsRequestDetailsValue = styled(Typography)(
  ({ theme }) => ({
    marginTop: theme.spacing(0.5),
    fontWeight: theme.typography.fontWeights.semiBold,
  })
);

export const LifeEventsWhatNextCard = styled(Box)(({ theme }) => ({
  textAlign: "left",
  maxWidth: "100%",
  borderRadius: theme.spacing(2),
  border: "1px solid #BFDBFE",
  backgroundColor: "#EFF6FF",
  padding: `${theme.spacing(2.5)} ${theme.spacing(3)}`,
}));

export const LifeEventsWhatNextHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  "& .MuiSvgIcon-root": {
    color: "#2563EB",
  },
}));

export const LifeEventsWhatNextTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#1D4ED8",
}));

export const LifeEventsWhatNextList = styled("ol")(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  marginBottom: 0,
  paddingLeft: theme.spacing(4.5),
  color: "#1D4ED8",
}));

export const LifeEventsWhatNextListItem = styled("li")(({ theme }) => ({
  marginBottom: theme.spacing(0.75),
  "&:last-of-type": {
    marginBottom: 0,
  },
}));
export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: theme.spacing(4),
}));

export const SimpleSuccessContainer = styled(Box)(({ theme }) => ({
  minHeight: "calc(100vh - 120px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
}));

export const SimpleSuccessBanner = styled(Box)(({ theme }) => ({
  width: "100%",
  height: theme.spacing(50),
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(94.26deg, #1B5092 0%, #266AB7 36.89%, #1675BC 61.3%, #197087 109.99%)",
  marginBottom: theme.spacing(10),
}));

const simpleSuccessBannerSlideIn = keyframes`
  from {
    transform: translateX(-140%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%);
    opacity: 1;
  }
`;

export const SimpleSuccessBannerImage = styled("img")(({ theme }) => ({
  position: "absolute",
  left: "50%",
  bottom: 0,
  width: "min(540px, 62vw)",
  maxWidth: "100%",
  height: "auto",
  objectFit: "contain",
  animation: `${simpleSuccessBannerSlideIn} 0.9s ease-out forwards`,
  pointerEvents: "none",
}));

export const SimpleSuccessTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const SimpleSuccessSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
}));

export const SimpleSuccessButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.25, 3),
  textTransform: "none",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  color: theme.palette.background.buttonbackground,
  backgroundColor: "transparent",
  "&:hover": {
    backgroundColor: theme.palette.background.buttonbackground,
    color: theme.palette.common.white,
    border: `1px solid ${theme.palette.background.buttonbackground}`,
  },
}));

export const LifeEventsReturnHomeButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(3.5, 5),
  textTransform: "none",
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  color: theme.palette.background.buttonbackground,
  backgroundColor: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    backgroundColor: theme.palette.background.buttonbackground,
    color: theme.palette.background.paper,
  },
  "&.Mui-disabled": {
    border: "1px solid #DFDFDF",
    color: "#9B9B9B",
  },
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
  minWidth: 100,
}));

export const DependentsList = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

export const DependentItem = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
}));

export const DependentHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: theme.spacing(1),
}));

export const DependentInfo = styled(Box)(({ theme }) => ({}));

export const DependentActions = styled(Box)(({ theme }) => ({}));

// Premium Review Components
export const PremiumContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const SummaryCard = styled(Card)(({ theme }) => ({
  marginBottom: 24,
}));

export const PremiumCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

export const PremiumRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(1, 0),
}));

export const PremiumTotal = styled(Box)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  paddingTop: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

export const DocumentsTable = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

export const ReviewSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const ReviewTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

export const SelectedEventCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  backgroundColor: "#E3F2FD",
  border: "1px solid #BBDEFB",
}));

export const SelectedEventContent = styled(CardContent)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

export const SelectedEventText = styled(Typography)(({ theme }) => ({
  color: "#1976D2",
  fontWeight: 500,
}));

export const GMCCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const GMCAvatar = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "linear-gradient(153.11deg, #FFE168 24.4%, #CAA513 88.51%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontWeight: "bold",
}));

export const AdditionDetailsPageContainer = styled(Box)(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));
export const AdditionDetailsPageContainerForChoiceSelection = styled(Box)(({ theme }) => ({
  paddingBottom: theme.spacing(2),
  width: "100%",
  display: "flex",
  gap: theme.spacing(10),
  "@media (max-width: 768px)": {
    flexDirection: "column",
    gap: theme.spacing(3),
  },
}));

export const AdditionDetailsIntro = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const AdditionDetailsIntroTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const AdditionDetailsIntroDescription = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.text.tertiary,
  })
);

export const AdditionDetailsReasonSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const AdditionDetailsReasonLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.background.buttonbackground,
  marginBottom: theme.spacing(2),
}));

export const AdditionDetailsReasonCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  border: `1px solid #6FA7E8`,
  backgroundColor: "#DCEBFF",
  boxShadow: "none",
  padding: theme.spacing(0.5),
  marginBottom: theme.spacing(4),
}));

export const AdditionDetailsReasonContent = styled(CardContent)(
  ({ theme }) => ({
    padding: theme.spacing(2.5, 3),
  })
);

export const AdditionDetailsReasonText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#0B63C8",
}));

export const AdditionDetailsPolicyCard = styled(Card)(({ theme }) => ({
  // marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2.5),
  border: `1px solid ${theme.palette.background.divider}`,
  borderBottom: "none",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
}));

export const AdditionDetailsPolicyHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  padding: theme.spacing(3.5, 3.5, 2.5),
  borderBottom: `1px solid ${theme.palette.background.divider}`,
}));

export const AdditionDetailsPolicyTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const AdditionDetailsFormCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2.5),
  border: `1px solid ${theme.palette.background.divider}`,
  backgroundColor: theme.palette.common.white,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  overflow: "visible",
}));
export const AdditionDetailsFormCardForChoiceSelection = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2.5),
  border: `1px solid ${theme.palette.background.divider}`,
  backgroundColor: theme.palette.common.white,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  overflow: "visible",
  width: "70%",
  "@media (max-width: 768px)": {
    width: "100%",
  },
}));

export const AdditionDetailsFormCardContent = styled(CardContent)(
  ({ theme }) => ({
    padding: theme.spacing(3, 3.5),
    "&:last-child": {
      paddingBottom: theme.spacing(3.5),
    },
    "& .MuiFormControl-root": {
      width: "100%",
    },
    "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
      borderRadius: theme.spacing(1.5),
      backgroundColor: "#FFFFFF",
    },
  })
);

export const AdditionDetailsSectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2.5),
}));

export const AdditionDetailsSectionIcon = styled(Box)(({ theme }) => ({
  width: 52,
  height: 52,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginTop: theme.spacing(0.25),
  "& .MuiSvgIcon-root": {
    color: "#0B63C8",
    fontSize: 24,
  },
}));

export const AdditionDetailsSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const AdditionDetailsSectionSubtitle = styled(Typography)(
  ({ theme }) => ({
    marginTop: theme.spacing(0.75),
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.regular,
    color: "#6B7280",
  })
);

export const AdditionDetailsFormPanel = styled(Box)(({ theme }) => ({
  // border: `1px solid ${theme.palette.background.divider}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3, 3, 2.5),
  backgroundColor: theme.palette.common.white,
  paddingRight: theme.spacing(3)
}));

export const AdditionDetailsDependentRows = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2.5),
  padding: theme.spacing(3, 3, 2.5),
}));

export const AdditionDetailsDependentRow = styled(Box)(() => ({
  display: "flex",
  flexWrap: "nowrap",
  gap: "12px",
  alignItems: "flex-start",
}));

export const AdditionDetailsDependentField = styled(Box)(() => ({
  flex: "1 1 0",
  minWidth: 0,
  overflow: "hidden",
}));

export const AdditionDetailsDependentFieldLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#4B5D8A",
  marginBottom: theme.spacing(0.75),
}));

export const AdditionDetailsDependentFieldValue = styled(Box)(({ theme }) => ({
  minHeight: 46,
  border: `1px solid ${theme.palette.background.divider}`,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.25, 1.5),
  display: "flex",
  alignItems: "center",
  color: theme.palette.text.tertiary,
  fontSize: theme.typography.fontSizes.md,
  // width: "100%",
}));

// Gender is locked whenever the relationship implies it (Son, Father,
// Mother-in-law...). Rendered greyed out so it reads as non-editable.
export const AdditionDetailsDependentFieldValueDisabled = styled(
  AdditionDetailsDependentFieldValue,
)(({ theme }) => ({
  backgroundColor: theme.palette.background.calendarDay,
  color: theme.palette.text.grey,
  cursor: "not-allowed",
}));

export const AdditionDetailsDependentDeleteButton = styled(Button)(({ theme }) => ({
  color: theme.palette.error.main,
  border: `1px solid ${theme.palette.error.light}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(0.75, 1.5),
  textTransform: "none",
  minWidth: "unset",
  gap: theme.spacing(0.5),
  "&:hover": {
    backgroundColor: theme.palette.error.lighter || "#FEF2F2",
    border: `1px solid ${theme.palette.error.main}`,
  },
}));

export const AdditionDetailsDependentEditButton = styled(Button)(({ theme }) => ({
  color: theme.palette.background.buttonbackground,
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(0.75, 1.5),
  textTransform: "none",
  minWidth: "unset",
  gap: theme.spacing(0.5),
  "&:hover": {
    backgroundColor: "#EAF3FF",
    border: `1px solid ${theme.palette.background.buttonbackground}`,
  },
}));

export const AdditionDetailsDependentSaveButton = styled(IconButton)(({ theme }) => ({
  color: "#15803D",
  border: "1px solid #86EFAC",
  backgroundColor: "#F0FDF4",
  borderRadius: theme.spacing(1),
  width: 40,
  height: 40,
  marginBottom: theme.spacing(0.25),
  "&:hover": {
    backgroundColor: "#DCFCE7",
  },
}));

export const AdditionDetailsDependentRowActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const AdditionDetailsFormTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(2),
}));

export const AdditionDetailsFormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "end",
  alignItems: "center",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
  width: "100%",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

export const AdditionDetailsSecondaryButton = styled(Button)(({ theme }) => ({
  minWidth: 120,
  padding: theme.spacing(1.75, 4),
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  color: theme.palette.background.buttonbackground,
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  textTransform: "none",
  backgroundColor: theme.palette.common.white,
  "&:hover": {
    border: `1px solid ${theme.palette.background.buttonbackground}`,
    backgroundColor: theme.palette.background.buttonbackground,
    color: theme.palette.common.white,
  },
}));

export const AdditionDetailsPrimaryButton = styled(Button)(({ theme }) => ({
  minWidth: 120,
  padding: theme.spacing(1.75, 4),
  borderRadius: theme.spacing(2),
  textTransform: "none",
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.common.white,
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  backgroundColor: theme.palette.background.buttonbackground,
  "&:hover": {
    background: theme.palette.background.buttonbackground,
    color: theme.palette.common.white,
  },
   "&.Mui-disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
    color: `${theme.palette.common.white} !important`,
  },
}));

export const AdditionDetailsDocumentsSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

export const AdditionDetailsDocumentsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(2),
  marginTop: 0,
  padding: 0,
}));

export const AdditionDetailsDocumentCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5, 2.5, 2),
  backgroundColor: theme.palette.common.white,
  cursor: "pointer",
}));

export const AdditionDetailsDocumentTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(1.5),
}));

export const AdditionDetailsUploadDropzone = styled(Box)(({ theme }) => ({
  minHeight: 128,
  borderRadius: theme.spacing(1.5),
  border: "2px dashed #1E63B5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: theme.spacing(2),
  color: theme.palette.text.tertiary,
  backgroundColor: "#FCFDFF",
}));

export const AdditionDetailsUploadTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(0.75),
}));

export const AdditionDetailsUploadSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: "#6B7280",
}));

export const AdditionDetailsUploadedDocContainer = styled(Box)(({ theme }) => ({
  border: '1px solid #093F84',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '123px',
}));

export const AdditionDetailsUploadedDocContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flex: 1,
}));

export const AdditionDetailsUploadedDocIcon = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: theme.typography.fontSizes.lg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const AdditionDetailsUploadedDocInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
}));

export const AdditionDetailsUploadedDocName = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  color: "#2E2E2E",
}));

export const AdditionDetailsUploadedDocSize = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: "#2E2E2E99",
  marginTop: theme.spacing(0.25),
}));

export const AdditionDetailsUploadedDocRemoveButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.error.main,
  },
}));

export const AdditionDetailsUploadLoader = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  display: 'flex',
  justifyContent: 'center',
}));

export const AdditionDetailsMembersSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

export const AdditionDetailsMembersTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(3),
}));

export const AdditionDetailsMembersTable = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export const AdditionDetailsMembersHeaderRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.8fr",
  gap: theme.spacing(2),
  padding: theme.spacing(3, 0, 2),
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

export const AdditionDetailsMembersHeaderCell = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.palette.text.tertiary,
  })
);

export const AdditionDetailsMembersBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const AdditionDetailsMembersRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.8fr",
  gap: theme.spacing(2),
  padding: theme.spacing(3, 0),
  borderTop: `1px solid ${theme.palette.divider}`,
  alignItems: "center",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
    gap: theme.spacing(1.5),
  },
}));

export const AdditionDetailsMembersCell = styled(Box)(({ theme }) => ({
  minWidth: 0,
  [theme.breakpoints.down("md")]: {
    display: "flex",
    justifyContent: "space-between",
    gap: theme.spacing(2),
  },
}));

export const AdditionDetailsMembersCellLabel = styled(Typography)(
  ({ theme }) => ({
    display: "none",
    [theme.breakpoints.down("md")]: {
      display: "block",
      fontSize: theme.typography.fontSizes.xl,
      fontWeight: theme.typography.fontWeights.medium,
      color: theme.palette.text.tertiary,
    },
  })
);

export const FormDependentsContainer = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.background.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: "0px 10px 24px 0px #0000001A",
}));

export const AdditionDetailsMembersCellValue = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.text.tertiary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    [theme.breakpoints.down("md")]: {
      whiteSpace: "normal",
      textAlign: "right",
    },
  })
);

export const AdditionDetailsMembersActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1.5),
}));

export const AdditionDetailsMemberActionButton = styled(Button)(
  ({ theme }) => ({
    minWidth: "auto",
    padding: theme.spacing(1, 1.5),
    borderRadius: theme.spacing(1.5),
    textTransform: "none",
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.palette.text.tertiary,
    borderColor: theme.palette.divider,
  })
);

export const AdditionDetailsEmptyState = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(3, 0, 1),
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.divider,
}));

export const AdditionDetailsFooterActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: theme.spacing(2),
  marginTop: 0,
  padding: theme.spacing(1.75, 4),
  borderTop: `1px solid ${theme.palette.background.divider}`,
  borderLeft: "none",
  borderRight: "none",
  borderBottom: "none",
  borderRadius: 0,
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: theme.palette.common.white,
  zIndex: 1200,
  boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.12)",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5, 2),
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

export const AdditionDetailsFooterRightGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

// Dependent Removal Components
export const DependentSelectionCard = styled(Card)<{ selected?: boolean }>(
  ({ theme, selected }) => ({
    marginBottom: theme.spacing(4),
    cursor: "pointer",
    border: selected
      ? `2px solid ${theme.palette.error.main}`
      : `2px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.spacing(4),
    padding: theme.spacing(5),
    backgroundColor: theme.palette.common.white,
    boxShadow: selected ? "0 20px 40px rgba(239, 68, 68, 0.10)" : "none",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      borderColor: selected
        ? theme.palette.error.main
        : theme.palette.grey[300],
      boxShadow: selected
        ? "0 20px 40px rgba(239, 68, 68, 0.10)"
        : "0 14px 32px rgba(15, 23, 42, 0.08)",
    },
  })
);

export const DependentRemovalHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(3),
}));

export const RemovalComponentsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

export const RemovalComponentChip = styled(Box)(({ theme }) => ({
  display: "inline-block",
  padding: `${theme.spacing(1)} ${theme.spacing(2.5)}`,
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.text.tertiary,
  borderRadius: theme.spacing(3),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  border: `1px solid ${theme.palette.grey[100]}`,
}));

export const RadioButtonContainer = styled(Box)<{ selected?: boolean }>(
  ({ theme, selected }) => ({
    width: theme.spacing(8),
    height: theme.spacing(8),
    borderRadius: "50%",
    border: selected
      ? `2px solid ${theme.palette.error.main}`
      : `2px solid ${theme.palette.grey[400]}`,
    backgroundColor: theme.palette.common.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: theme.spacing(0.5),
    transition: "all 0.2s ease-in-out",
  })
);

export const RadioButtonCheckText = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.bold,
  lineHeight: 1,
}));

export const DependentRemovalContent = styled(Box)(({ theme }) => ({
  flex: 1,
}));

export const DependentNameText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(2),
}));

export const DependentRelationshipInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
  flexWrap: "wrap",
  "& .MuiSvgIcon-root": {
    fontSize: theme.typography.fontSizes.md,
    color: theme.palette.text.tertiary,
  },
}));

export const DependentRelationshipText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  color: theme.palette.text.tertiary,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const DependentAgeText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  color: theme.palette.text.tertiary,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const DependentMetaDot = styled(Box)(({ theme }) => ({
  width: theme.spacing(1),
  height: theme.spacing(1),
  borderRadius: "50%",
  backgroundColor: theme.palette.grey[400],
}));

export const RemovalComponentsLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  color: theme.palette.text.tertiary,
  fontWeight: theme.typography.fontWeights.regular,
  marginBottom: theme.spacing(2),
}));

export const DependentRemovalReasonCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(4),
  backgroundColor: theme.palette.error.lighter || "#FFF5F5",
  border: `1px solid ${theme.palette.error.light}`,
  borderRadius: theme.spacing(3),
  boxShadow: "none",
}));

export const DependentRemovalReasonLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.error.dark,
  marginBottom: theme.spacing(2),
}));

export const DependentRemovalReasonValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.error.main,
}));

export const DependentRemovalEmptyStateCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  backgroundColor: theme.palette.warning.light,
  border: `1px solid ${theme.palette.warning.main}`,
  borderRadius: theme.spacing(3),
}));

export const DependentRemovalEmptyStateTitle = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semiBold,
    marginBottom: theme.spacing(3),
    color: theme.palette.text.tertiary,
  })
);

export const DependentRemovalEmptyStateText = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.md,
    color: theme.palette.text.tertiary,
    "& strong": {
      color: theme.palette.text.tertiary,
    },
  })
);

export const DependentRemovalSelectionSummaryCard = styled(Card)(
  ({ theme }) => ({
    marginTop: theme.spacing(2),
    padding: theme.spacing(3),
    backgroundColor: theme.palette.success.lighter || "#ECFDF3",
    border: `1px solid ${theme.palette.success.light}`,
    borderRadius: theme.spacing(3),
    boxShadow: "none",
  })
);

export const DependentRemovalSelectionSummaryText = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.palette.success.dark,
  })
);

export const ConfirmRemovalDependentGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

export const ConfirmRemovalSectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(3),
  border: `1px solid ${theme.palette.background.divider}`,
  backgroundColor: theme.palette.common.white,
  boxShadow: "none",
  overflow: "hidden",
}));

export const ConfirmRemovalSectionHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 5),
  borderBottom: `1px solid ${theme.palette.background.divider}`,
  backgroundColor: "#f4f3f3",
}));

export const ConfirmRemovalSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const ConfirmRemovalSectionBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5),
}));

export const ConfirmRemovalInfoStack = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const ConfirmRemovalField = styled(Box)(({ theme }) => ({}));

export const ConfirmRemovalFieldLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(2),
}));

export const ConfirmRemovalFieldValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const ConfirmRemovalComponentsDescription = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.text.tertiary,
    marginBottom: theme.spacing(4),
  })
);

export const ConfirmRemovalComponentCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  padding: theme.spacing(3, 4),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2.5),
  border: `1px solid ${theme.palette.error.light}`,
  backgroundColor: theme.palette.error.lighter || "#FFF5F5",
}));

export const ConfirmRemovalComponentBullet = styled(Box)(({ theme }) => ({
  width: theme.spacing(2),
  height: theme.spacing(2),
  borderRadius: "50%",
  backgroundColor: theme.palette.error.main,
  flexShrink: 0,
}));

export const ConfirmRemovalComponentText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const ConfirmRemovalNoticeCard = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(4),
  borderRadius: theme.spacing(3),
  border: `2px solid ${theme.palette.warning.main}`,
  backgroundColor: theme.palette.warning.lighter || "#FFFBEA",
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(3),
}));

export const ConfirmRemovalNoticeIcon = styled(Box)(({ theme }) => ({
  color: theme.palette.warning.dark,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& .MuiSvgIcon-root": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const ConfirmRemovalNoticeContent = styled(Box)(({ theme }) => ({
  flex: 1,
}));

export const ConfirmRemovalNoticeTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.warning.dark,
  marginBottom: theme.spacing(2),
}));

export const ConfirmRemovalNoticeDescription = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.warning.dark,
    lineHeight: 1.6,
  })
);
//step2
export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  // background: "#f3f4f6",
  minHeight: "100vh",
  padding: "32px 48px",
  boxSizing: "border-box",
  width: "100%",
  [theme.breakpoints.down("md")]: {
    padding: "24px 24px",
  },
  "@media (max-width: 768px)": {
    padding: "20px 16px",
  },
}));

export const Header = styled(Typography)(({ theme }) => ({
  margin: "0 0 6px 0",
  fontSize: "28px",
  fontWeight: 700,
  color: "#111827",
  [theme.breakpoints.down("md")]: {
    fontSize: "22px",
  },
  "@media (max-width: 768px)": {
    fontSize: "18px",
  },
}));

export const SubHeading = styled(Typography)(() => ({
  margin: "0 0 4px 0",
  fontSize: "15px",
  fontWeight: 600,
  color: "#111827",
}));

export const Description = styled(Typography)(() => ({
  margin: 0,
  color: "#9CA3AF",
  fontSize: "13px",
  fontWeight: 400,
}));

export const RelationGrid = styled(Box)(() => ({
  display: "flex",
  gap: "12px",
  flexDirection: "column",
  width: "300px",
}));

export const RelationButton = styled(Button)(() => ({
  padding: "12px 28px",
  borderRadius: "8px",
  border: "none",
  background: "#2563EB",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  textTransform: "none",
  whiteSpace: "nowrap",
  "&:hover": {
    background: "#1D4ED8",
  },
}));

export const BackButton = styled(Button)(() => ({
  padding: "10px 20px",
  borderRadius: "8px",
  border: "1px solid #D1D5DB",
  background: "#ffffff",
  color: "#374151",
  fontSize: "15px",
  fontWeight: 500,
  textTransform: "none",
  "&:hover": {
    background: "#F9FAFB",
    borderColor: "#9CA3AF",
  },
}));

export const ChoicesContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  padding: "0",
}));

export const SectionCard = styled(Box)(() => ({
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "20px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  background: "#ffffff",
}));

export const SectionHeading = styled(Typography)(() => ({
  margin: 0,
  fontSize: "16px",
  fontWeight: 600,
  color: "#111827",
  display: "flex",
  alignItems: "center",
  gap: "8px",
}));

export const ChoiceCardsWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  padding: "8px 0 0 0",
}));

export const ChoiceCard = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "8px",
}));

export const SummaryActions = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "20px 0 0 0",
}));

// Addition Reason card — light blue bg, blue border
export const SummaryReasonCard = styled(Box)(() => ({
  border: "1px solid #BFDBFE",
  borderRadius: "12px",
  padding: "16px 20px",
  background: "#EFF6FF",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
}));

// "₹ Premium Breakdown" heading
export const SummaryHeader = styled(Typography)(() => ({
  margin: 0,
  fontSize: "18px",
  fontWeight: 500,
  color: "#111827",
  display: "flex",
  alignItems: "center",
  gap: "8px",
}));

export const ChooseBenefitsPage = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const ChooseBenefitsHeaderBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const ChooseBenefitsTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  textTransform: "capitalize",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.xl,
  },
}));

export const ChooseBenefitsSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  lineHeight: 1.6,
}));

export const ChooseBenefitsEmptyState = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  border: `1px dashed ${theme.palette.divider}`,
  backgroundColor: theme.palette.common.white,
}));

export const ChooseBenefitsSections = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const ChooseBenefitsSectionCard = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.common.white,
  boxShadow: "0 8px 24px rgba(17, 24, 39, 0.04)",
  overflow: "hidden",
}));

export const ChooseBenefitsSectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(3),
  padding: theme.spacing(4),
}));

export const ChooseBenefitsSectionHeaderLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(5),
  minWidth: 0,
}));

export const ChooseBenefitsSectionIconTile = styled(Box)<{
  variant: "compulsory" | "optional";
}>(({ theme, variant }) => ({
  width: theme.spacing(12.5),
  height: theme.spacing(1),
  borderRadius: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: variant === "compulsory" ? "#FF5A1F" : "#8A2BFF",
}));

export const ChooseBenefitsSectionHeadingBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
}));

export const ChooseBenefitsSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  // lineHeight: 1.2,
}));

export const ChooseBenefitsSectionDescription = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.text.tertiary,
    // lineHeight: 1.5,
  })
);

export const ChooseBenefitsToggleButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ theme, expanded }) => ({
  minWidth: "auto",
  width: theme.spacing(6),
  height: theme.spacing(6),
  borderRadius: theme.spacing(1.5),
  padding: 0,
  color: theme.palette.text.tertiary,
  transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
}));

export const ChooseBenefitsSectionBody = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ theme, expanded }) => ({
  display: 'grid',
  gridTemplateRows: expanded ? '1fr' : '0fr',
  overflow: 'hidden',
  pointerEvents: expanded ? 'auto' : 'none',
  transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '& > div': {
    overflow: 'hidden',
    minHeight: 0,
  },
}));

export const ChooseBenefitsChoiceCard = styled(Box)<{ selected?: boolean }>(
  ({ theme, selected }) => {
    const selectedBlue = "#2F6CF6";

    return {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      borderRadius: theme.spacing(2.5),
      border: `2px solid ${selected ? selectedBlue : theme.palette.divider}`,
      backgroundColor: selected ? "#EAF3FF" : theme.palette.common.white,
      boxShadow: selected ? "0 10px 24px rgba(37, 99, 235, 0.12)" : "none",
      padding: theme.spacing(4),
      transition:
        "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
      "&:hover": {
        borderColor: selected ? selectedBlue : "#C9D8F2",
        boxShadow: selected
          ? "0 12px 28px rgba(37, 99, 235, 0.16)"
          : "0 8px 20px rgba(17, 24, 39, 0.06)",
      },
      [theme.breakpoints.down("md")]: {
        alignItems: "stretch",
      },
    };
  }
);

export const ChooseBenefitsChoiceContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  flex: 1,
  minWidth: 0,
}));

export const ChooseBenefitsChoiceTopRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
}));

export const ChooseBenefitsChoiceTitleGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  flexWrap: "wrap",
}));

export const ChooseBenefitsChoiceTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.teritiary,
}));

export const ChooseBenefitsChoiceBadge = styled(Box)<{ selected?: boolean }>(
  ({ theme, selected }) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(0.75, 1.5),
    borderRadius: theme.spacing(1),
    backgroundColor: selected ? "rgba(37, 99, 235, 0.12)" : "#F3F4F6",
    color: selected ? "#2F6CF6" : theme.palette.text.tertiary,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    lineHeight: 1,
  })
);

export const ChooseBenefitsChoiceChevron = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.text.tertiary,
  flexShrink: 0,
}));

export const ChooseBenefitsChoiceOptions = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const ChooseBenefitsChoiceOptionRow = styled(Box)<{
  selected?: boolean;
}>(({ theme, selected }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(4),
  borderRadius: theme.spacing(2),
  border: `1px solid ${selected ? "#B9D2FF" : theme.palette.divider}`,
  backgroundColor: selected ? "#F5F9FF" : theme.palette.common.white,
  padding: theme.spacing(2.5),
  cursor: "pointer",
  transition: "border-color 0.2s ease, background-color 0.2s ease",
  "&:hover": {
    borderColor: selected ? "#7EAEFF" : "#C9D8F2",
  },
  [theme.breakpoints.down("md")]: {
    flexDirection: "row",
  },
}));

export const ChooseBenefitsChoiceOptionSelector = styled(Box)<{
  selected?: boolean;
}>(({ theme, selected }) => ({
  width: theme.spacing(7),
  height: theme.spacing(7),
  borderRadius: "50%",
  border: `2px solid ${selected ? "#2F6CF6" : "#D1D5DB"}`,
  backgroundColor: selected ? "#2F6CF6" : theme.palette.common.white,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: theme.palette.common.white,
  "& .MuiSvgIcon-root": {
    fontSize: theme.typography.fontSizes.lg,
    opacity: selected ? 1 : 0,
  },
}));

export const ChooseBenefitsChoiceOptionContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  flex: 1,
  minWidth: 0,
}));

export const ChooseBenefitsChoiceMetrics = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
}));

export const ChooseBenefitsMetric = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.75),
  minWidth: 0,
}));

export const ChooseBenefitsMetricLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  // lineHeight: 1 .4,
}));

export const ChooseBenefitsMetricValue = styled(Typography)<{
  highlight?: boolean;
}>(({ theme, highlight }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: highlight ? "#2F6CF6" : theme.palette.text.primary,
  // lineHeight: 1.3,
}));

export const ChooseBenefitsErrorText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.error.main,
}));

export const ChooseBenefitsActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    alignItems: "stretch",
    flexDirection: "column",
  },
}));

export const ChooseBenefitsActionGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

export const ChooseBenefitsContinueButton = styled(Button)(({ theme }) => ({
  alignSelf: "flex-start",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.75, 3.5),
  minWidth: theme.spacing(34),
  textTransform: "none",
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    background: theme.palette.background.buttonbackground,
    color: theme.palette.background.paper,
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

export const PremiumSummaryPage = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const PremiumSummaryReasonCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2.5),
  border: `1px solid #338CE5`,
  backgroundColor: "#338CE526",
}));

export const PremiumSummaryReasonLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.background.buttonbackground,
}));

export const PremiumSummaryReasonValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.secondary.selected,
}));

export const PremiumSummaryCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(4, 4, 3),
}));

export const PremiumSummaryCardTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const PremiumSummaryDivider = styled(Box)(({ theme }) => ({
  width: "100%",
  height: 1,
  backgroundColor: theme.palette.divider,
}));

export const PremiumSummaryContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  padding: theme.spacing(4),
}));

export const PremiumSummarySectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const PremiumSummaryBenefitCards = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const PremiumSummaryBenefitCard = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2.5),
  border: `1px solid rgba(15, 23, 42, 0.08)`,
  backgroundColor: theme.palette.common.white,
  boxShadow: "0px 8px 22px rgba(15, 23, 42, 0.08)",
  padding: theme.spacing(3, 3.5),
}));

export const PremiumSummaryBenefitCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

export const PremiumSummaryPolicyIcon = styled(Box)<{ gradient?: string }>(
  ({ theme, gradient }) => ({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.palette.common.black,
    flexShrink: 0,
    background:
      gradient || "linear-gradient(128deg, #FFD632 24.02%, #9F8007 118.24%)",
  }),
);

export const PremiumSummaryBenefitCardTitle = styled(Typography)(({ theme }) => ({
  fontSize: "26px",
  lineHeight: 1.2,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
}));

export const PremiumSummaryBenefitCardBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const PremiumSummaryBenefitInfoGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "stretch",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const PremiumSummaryBenefitSeparator = styled(Box)(({ theme }) => ({
  width: "1px",
  minHeight: "56px",
  backgroundColor: "rgba(15, 23, 42, 0.08)",
  alignSelf: "center",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

export const PremiumSummaryBenefitInfoLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  marginBottom: theme.spacing(0.5),
}));

export const PremiumSummaryBenefitInfoValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
}));

export const PremiumSummaryBenefitMembers = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.75),
}));

export const PremiumSummaryBenefitMembersLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
}));

export const PremiumSummaryBenefitMembersValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  lineHeight: 1.5,
}));

export const PremiumSummaryPolicyList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const PremiumSummaryPolicyRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-of-type": {
    borderBottom: "none",
    paddingBottom: 0,
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

export const PremiumSummaryPolicyDetails = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  minWidth: 0,
}));

export const PremiumSummaryPolicyLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));

export const PremiumSummaryPolicyType = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  opacity: 0.7,
}));

export const PremiumSummaryPolicyAmount = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  whiteSpace: "nowrap",
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const PremiumSummaryTotals = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
}));

export const PremiumSummaryTotalRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

export const PremiumSummaryTotalLabel = styled(Typography)<{
  strong?: boolean;
}>(({ theme, strong }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const PremiumSummaryTotalValue = styled(Typography)<{
  emphasize?: boolean;
  accent?: boolean;
}>(({ theme, emphasize, accent }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.regular,
  color: accent ? "#2F6CF6" : theme.palette.text.tertiary,
  whiteSpace: "nowrap",
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const PremiumSummaryMonthlyValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  whiteSpace: "nowrap",
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const PremiumSummaryNote = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: "1px solid #A7F3C0",
  backgroundColor: "#F0FDF4",
  padding: theme.spacing(3),
}));

export const PremiumSummaryNoteText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.regular,
  color: "#166534",
  "& strong": {
    fontWeight: theme.typography.fontWeights.semiBold,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const PremiumSummaryActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

export const PremiumSummaryGroupSections = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const PremiumSummaryGroupSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const PremiumSummaryGroupHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2.5),
  paddingLeft: theme.spacing(2.5),
}));

export const PremiumSummaryGroupName = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: "28px",
  lineHeight: 1.2,
  color: theme.palette.text.primary,
  [theme.breakpoints.down("md")]: {
    fontSize: "22px",
  },
  "@media (max-width: 768px)": {
    fontSize: "18px",
  },
}));

export const PremiumSummaryPlanCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'gradient',
})<{ gradient?: string }>(({ theme, gradient }) => ({
  position: 'relative',
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.common.white,
  boxShadow: "0px 10px 28px rgba(38, 38, 38, 0.12)",
  border: "1px solid rgba(15, 23, 42, 0.06)",
  overflow: "hidden",
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    background: gradient ?? '#FFE168',
  },
}));

export const PremiumSummaryPlanCardBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  padding: theme.spacing(4.5, 5),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4),
  },
}));

export const PremiumSummaryInfoGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 0,
  flexWrap: "wrap",
}));

export const PremiumSummaryInfoColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  minWidth: "160px",
  justifyContent: "center",
  [theme.breakpoints.down("md")]: {
    minWidth: "140px",
  },
}));

export const PremiumSummaryPlanLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: "26px",
  lineHeight: 1.2,
  color: theme.palette.text.primary,
  marginRight: theme.spacing(4),
  [theme.breakpoints.down("md")]: {
    fontSize: "22px",
    marginBottom: theme.spacing(2),
  },
  "@media (max-width: 768px)": {
    fontSize: "18px",
  },
}));

export const PremiumSummaryInfoLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
}));

export const PremiumSummaryInfoValue = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: "24px",
  lineHeight: 1.2,
  color: theme.palette.text.tertiary,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.xl,
  },
}));

export const PremiumSummaryInfoSeparator = styled(Box)(({ theme }) => ({
  width: "1px",
  minHeight: "46px",
  backgroundColor: "rgba(15, 23, 42, 0.10)",
  margin: theme.spacing(0, 4.5),
  alignSelf: "center",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

export const PremiumSummaryMembersLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  marginBottom: theme.spacing(1),
}));

export const PremiumSummaryMembersValue = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xl,
  lineHeight: 1.45,
  color: theme.palette.text.tertiary,
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const PremiumSummaryBackButton = styled(Button)(({ theme }) => ({
  minWidth: theme.spacing(32),
  padding: theme.spacing(1.75, 3),
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.common.white,
  color: theme.palette.text.tertiary,
  textTransform: "none",
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  "&:hover": {
    backgroundColor: theme.palette.common.white,
    borderColor: theme.palette.divider,
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
  "@media (max-width: 768px)": {
    minWidth: "unset",
    fontSize: theme.typography.fontSizes.sm,
    padding: theme.spacing(1.5, 2),
  },
}));

export const PremiumSummaryContinueButton = styled(Button)(({ theme }) => ({
  minWidth: theme.spacing(38),
  padding: theme.spacing(1.75, 3.5),
  borderRadius: theme.spacing(2),
  textTransform: "none",
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  border: `1px solid ${theme.palette.background.buttonbackground}`,
  "&:hover": {
    color: theme.palette.background.paper,
    background: theme.palette.background.buttonbackground,
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
  "@media (max-width: 768px)": {
    minWidth: "unset",
    fontSize: theme.typography.fontSizes.sm,
    padding: theme.spacing(1.5, 2),
  },
}));

export const SummaryDivider = styled("hr")(() => ({
  border: 0,
  borderTop: "1px solid #E5E7EB",
  width: "100%",
  margin: "4px 0",
}));

// "Selected Components" small gray label
export const SummaryTitle = styled(Typography)(() => ({
  margin: 0,
  fontSize: "13px",
  fontWeight: 500,
  color: "#6B7280",
}));

// Each row in the summary — space between
export const SummaryRow = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  padding: "2px 0",
}));

// Green note tag at the bottom
export const SummaryTag = styled(Box)(() => ({
  borderRadius: "10px",
  border: "1px solid #BBF7D0",
  background: "#F0FDF4",
  color: "#166534",
  fontSize: "14px",
  padding: "14px 20px",
  "& strong, & b": {
    fontWeight: 700,
  },
}));

export const UploadDocumentsReasonCard = styled(Card)<{
  flowType: LifeEventFlowType;
}>(({ theme, flowType }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2.5, 3),
  borderRadius: theme.spacing(2.5),
  border: `1px solid ${flowType === "addition" ? "#A9CCFF" : "#FFB6BE"}`,
  backgroundColor: flowType === "addition" ? "#EAF3FF" : "#FFF3F4",
  boxShadow: "none",
}));

export const UploadDocumentsReasonLabel = styled(Typography)<{
  flowType: LifeEventFlowType;
}>(({ theme, flowType }) => ({
  marginBottom: theme.spacing(1),
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color:
    flowType === "addition"
      ? theme.palette.primary.main
      : theme.palette.error.main,
}));

export const UploadDocumentsReasonValue = styled(Typography)<{
  flowType: LifeEventFlowType;
}>(({ theme, flowType }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color:
    flowType === "addition"
      ? theme.palette.primary.main
      : theme.palette.error.main,
}));

export const UploadDocumentsDependentSummaryCard = styled(Card)(
  ({ theme }) => ({
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2.5, 3),
    borderRadius: theme.spacing(2.5),
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.common.white,
    boxShadow: "none",
  })
);

export const UploadDocumentsDependentSummaryLabel = styled(Typography)(
  ({ theme }) => ({
    marginBottom: theme.spacing(1),
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.palette.text.tertiary,
  })
);

export const UploadDocumentsDependentSummaryValue = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.text.tertiary,
  })
);

export const UploadDocumentsCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(4, 3),
  borderRadius: theme.spacing(2.5),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.common.white,
  boxShadow: "none",
}));

export const UploadDocumentsSectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const UploadDocumentsRequiredDocList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const UploadDocumentsRequiredDocItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  color: theme.palette.text.tertiary,
  "& .MuiTypography-root": {
    fontSize: theme.typography.fontSizes.xl,
    color: theme.palette.text.tertiary,
  },
}));

export const UploadDocumentsRequiredDocIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#12B347",
  "& .MuiSvgIcon-root": {
    fontSize: theme.typography.fontSizes.xxl,
  },
}));

export const UploadDocumentsFileInput = styled("input")({
  display: "none",
});

export const UploadDocumentsDropzone = styled(Box)<{
  flowType: LifeEventFlowType;
}>(({ theme, flowType }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: theme.spacing(36),
  padding: theme.spacing(5, 3),
  borderRadius: theme.spacing(2.5),
  border: `2px dashed ${
    flowType === "addition"
      ? theme.palette.primary.main
      : theme.palette.error.main
  }`,
  backgroundColor: flowType === "addition" ? "#EAF3FF" : "#FFF3F4",
  cursor: "pointer",
  textAlign: "center",
  transition: "border-color 0.2s ease, background-color 0.2s ease",
  "&:hover": {
    backgroundColor: flowType === "addition" ? "#E1EEFF" : "#FFECEF",
  },
}));

export const UploadDocumentsDropzoneIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
  color: theme.palette.grey[500],
  "& .MuiSvgIcon-root": {
    fontSize: theme.spacing(8),
  },
}));

export const UploadDocumentsDropzoneTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const UploadDocumentsDropzoneSubtitle = styled(Typography)(
  ({ theme }) => ({
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.palette.grey[500],
  })
);

export const UploadDocumentsFileList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(3),
}));

export const UploadDocumentsFileItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.common.white,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
}));

export const UploadDocumentsNoticeCard = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2.5, 3),
  borderRadius: theme.spacing(2.5),
  border: "1px solid #F9C94A",
  backgroundColor: "#FFF8E0",
}));

export const UploadDocumentsNoticeText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: "#9A4D00",
  "& strong": {
    fontWeight: theme.typography.fontWeights.semiBold,
  },
}));

// ─── Choice Selection Styles ──────────────────────────────────────────────

export const ChoiceSelectionContainer = styled(Box)({
  // display: 'grid',
  // gridTemplateColumns: '2fr 1fr',
  // gap: '24px',
  padding: '0 0 24px 0',
});

export const ChoicesPanel = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const PremiumCalculatorPanel = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: "80px",
  marginTop: "-181px",
  alignSelf: "flex-start",
  zIndex: 2,
  height: "fit-content",
  width: "30%",
  [theme.breakpoints.down("lg")]: {
    position: "static",
    marginTop: 0,
    width: "100%",
  },
  "@media (max-width: 768px)": {
    position: "static",
    marginTop: 0,
    width: "100%",
    order: 2,
  },
}));

export const ChoiceSectionCard = styled(Box)(({ theme }) => ({
  borderRadius: '16px',
  backgroundColor: theme.palette.common.white,
  overflow: 'hidden',
  boxShadow: '0px 10px 24px 0px #0000001A',
  transition: 'box-shadow 0.24s ease, transform 0.24s ease, border-color 0.24s ease',
  '&:hover': {
    boxShadow: '0px 14px 30px 0px rgba(15, 23, 42, 0.10)',
  },
}));

export const ChoiceSectionHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ theme, expanded }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: '18px 22px',
  cursor: 'pointer',
  transition: 'border-color 0.24s ease, box-shadow 0.24s ease',
  background: theme.palette.common.white,
  '&:hover': {
    background: theme.palette.common.white,
  },
}));

export const ChoiceSectionContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ theme, expanded }) => ({
  display: 'grid',
  gridTemplateRows: expanded ? '1fr' : '0fr',
  overflow: 'hidden',
  pointerEvents: expanded ? 'auto' : 'none',
  transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: theme.palette.common.white,
  '& > div': {
    overflow: 'hidden',
    minHeight: 0,
  },
}));

export const ChoiceSectionIconWrapper = styled(Box)(({ theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent !important',
  marginRight: '14px',
  flexShrink: 0,
  '& img': {
    width: '48px',
    height: '48px',
  },
}));

export const ChoiceSelectionHeaderContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const ChoiceSelectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontWeight: 600,
  color: theme.palette.text.tertiary,
}));

export const ChoiceSelectionSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.tertiary,
}));

export const ChoiceSectionTitleText = styled(Typography)(({ theme }) => ({
  fontSize: '24px',
  fontWeight: 600,
  color: theme.palette.text.tertiary,
  lineHeight: 1.15,
}));

export const ChoiceSectionSubtitleText = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.tertiary,
  opacity: 0.68,
  marginTop: theme.spacing(0.5),
}));

export const ChoiceSectionHeaderContent = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  flex: 1,
});

export const ChoiceSectionArrowWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded?: boolean }>(({ theme, expanded }) => ({
  width: '28px',
  height: '28px',
  borderRadius: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  backgroundColor: 'transparent',
  color: '#111827',
  transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), color 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  flexShrink: 0,
  '& .MuiSvgIcon-root': {
    fontSize: '28px',
    fontWeight: 500,
  },
}));

export const PolicyCardWrapper = styled(Box)({
  marginBottom: '16px',
  '&:last-child': {
    marginBottom: 0,
  },
});

export const PolicyCardWithNameContainer = styled(Box)(({ theme }) => ({
  marginBottom: '16px',
  width: '100%',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '12px',
  overflow: 'hidden',
  background: theme.palette.background.paper,
  '&:last-child': {
    marginBottom: 0,
  },
}));

export const PolicyNameHeader = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  background: theme.palette.grey[50],
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export const PolicyTypeChip = styled(Box)<{ policyType: string }>(({ theme, policyType }) => ({
  padding: '4px 8px',
  borderRadius: '16px',
  fontSize: '12px',
  fontWeight: 500,
  background: policyType === 'base'
    ? theme.palette.primary.light
    : policyType === 'parental'
    ? theme.palette.secondary.light
    : theme.palette.info.light,
  color: policyType === 'base'
    ? theme.palette.primary.dark
    : policyType === 'parental'
    ? theme.palette.secondary.dark
    : theme.palette.info.dark,
}));

export const PolicyCardContent = styled(Box)(() => ({
  '& > div': {
    border: 'none !important',
    borderRadius: '0 !important',
    margin: '0 !important',
  },
}));

export const PolicySelectionWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

export const PolicyNameText = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '16px',
  color: theme.palette.text.tertiary,
}));

export const PolicyLabelText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.tertiary,
}));

// ── Dependent Removal - Modern Table Style Cards ──
export interface DependentRemovalTableCardProps {
  selected?: boolean;
}

export const DependentRemovalTableCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'selected',
})<DependentRemovalTableCardProps>(({ theme, selected }) => ({
  border: `1px solid ${selected ? '#62B1FF' : '#62B1FF'}`,
  borderRadius: theme.spacing(3), // 12px
  padding: theme.spacing(5), // 20px
  marginBottom: theme.spacing(4), // 16px
  cursor: 'pointer',
  background: 'linear-gradient(92.02deg, #FFFFFF 59.73%, #B5DAF8 174.34%)',
  boxShadow: '0px 6px 10px 0px #0000001A',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  '&:hover': {
    boxShadow: '0px 8px 14px 0px #00000022',
    transform: 'translateY(-1px)',
  },
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(4), // 16px
  minWidth: 0,
  [theme.breakpoints.down('sm')]: {
    alignItems: 'flex-start',
  },
}));

export const DependentRemovalTableGrid = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 2fr',
  gap: theme.spacing(6), // 24px
  alignItems: 'center',
  minWidth: 0,
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(4),
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
  },
}));

export const DependentRemovalTableColumn = styled(Box)(() => ({
  minWidth: 0,
}));

export const DependentRemovalTableHeader = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.tertiary,
  fontSize: '12px',
  marginBottom: theme.spacing(1), // 4px
}));

export const DependentRemovalTableValue = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '16px',
  color: theme.palette.text.primary,
  wordBreak: 'break-word',
}));

export const DependentRemovalTableSubValue = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '14px',
  color: theme.palette.text.primary,
  wordBreak: 'break-word',
}));

export const DependentRemovalFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(8), // 32px
  padding: theme.spacing(5, 0), // 20px 0
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export const DependentRemovalFooterActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3), // 12px
}));

export const DependentRemovalCheckbox = styled(Box)(({ theme }) => ({
  '& .MuiCheckbox-root': {
    color: '#1974BB',
    '&.Mui-checked': {
      color: '#1974BB',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '24px',
    },
  },
}));

// Deletion flow - Confirm & Upload components
export const DependentConfirmUploadCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

export const DependentConfirmUploadHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const DependentConfirmUploadName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semibold,
  color: theme.palette.text.primary,
}));

export const DependentConfirmUploadMeta = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
}));

export const DependentConfirmUploadWarning = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: "#FFF4E6",
  border: "1px solid #FFB020",
  borderRadius: theme.spacing(1),
}));

export const DependentConfirmUploadWarningText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#8B4513",
  marginBottom: theme.spacing(1),
}));

export const DependentConfirmUploadPoliciesList = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: "#8B4513",
}));

export const DependentConfirmUploadDocumentSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const DependentConfirmUploadDocumentTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

// New Figma-based Confirm & Upload components - Updated to match enrollment summary styling
export const ConfirmUploadDependentCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(7.5, 7.5, 8.5, 7.5),
  border: `1px solid ${theme.palette.background.divider}`,
  borderRadius: theme.spacing(2.5),
  backgroundColor: theme.palette.common.white,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
}));

export const ConfirmUploadDependentDetailInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const ConfirmUploadDependentRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4),
  alignItems: "flex-start",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: theme.spacing(2),
  },
}));

export const ConfirmUploadDependentInfo = styled(Box)(({ theme }) => ({
  flex: "1.2 1 0",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(6),
  // justifyContent: "space-between",
}));

export const ConfirmUploadDocumentSection = styled(Box)(({ theme }) => ({
  flex: "0.74 1 0",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

export const ConfirmUploadDependentName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  lineHeight: "1.3",
  marginBottom: theme.spacing(0.25),
}));

export const ConfirmUploadDependentMeta = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.mediumGrey,
  lineHeight: "1.4",
}));

export const ConfirmUploadWarningSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  // padding: theme.spacing(1.75, 2),
  width: "100%",
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.spacing(1.5),
}));

export const ConfirmUploadWarningIcon = styled(Box)(({ theme }) => ({
  color: "#EF4444",
  fontSize: "18px",
  marginTop: theme.spacing(0.25),
  flexShrink: 0,
}));

export const ConfirmUploadWarningContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

export const ConfirmUploadWarningTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
  opacity: 0.6,
  lineHeight: "1.4",
}));

export const ConfirmUploadPoliciesText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  lineHeight: "1.4",
  whiteSpace: "nowrap",
}));

export const ConfirmUploadDocumentTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
  lineHeight: "1.3",
  marginBottom: theme.spacing(1.5),
}));

export const ConfirmUploadDocumentZone = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "105px",
  padding: theme.spacing(4, 3),
  border: "1px dashed #093F84",
  borderRadius: theme.spacing(2),
  backgroundColor: "#fff",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0px 1px 4px 0px #0000001A",
  "&:hover": {
    borderColor: "#9CA3AF",
    backgroundColor: "#fff",
  },
}));

export const ConfirmUploadDocumentZoneIcon = styled(Box)(({ theme }) => ({
  fontSize: "24px",
  marginBottom: theme.spacing(1),
  color: "#64748B",
}));

export const ConfirmUploadDocumentZoneText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  textAlign: "center",
  lineHeight: "1.4",
}));

export const ConfirmUploadDocumentZoneSubtext = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.mediumGrey,
}));

export const ConfirmUploadUploadedFileCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: theme.spacing(2, 2.5),
  border: "1px solid #2F6CF6",
  borderRadius: theme.spacing(1),
  backgroundColor: "#F3F8FF",
  boxShadow: "0px 2px 6px rgba(15, 23, 42, 0.1)",
}));

export const ConfirmUploadUploadedFileInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  flex: "1 1 auto",
  minWidth: 0,
}));

export const ConfirmUploadUploadedFileText = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minWidth: 0,
}));

export const ConfirmUploadUploadedFileName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  display: "block",
  width: "100%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

export const ConfirmUploadUploadedFileSize = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.mediumGrey,
}));

export const ConfirmUploadUploadedFileRemove = styled(Box)(({ theme }) => ({
  width: theme.spacing(5),
  height: theme.spacing(5),
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: theme.palette.text.tertiary,
  "&:hover": {
    backgroundColor: "#E5ECF7",
  },
}));

export const LoadingButtonContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  width: '100%',
  whiteSpace: 'nowrap',
}));
export const MembersCovered = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(48),
}));
