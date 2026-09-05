import { Box, Card, CardContent, IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { display } from "@mui/system";

export const StyledBenefitCard = styled(Card)(({ theme }) => ({
  // backgroundColor: theme.palette.background.paper,
  // boxShadow: "0px 10px 24px rgba(0, 0, 0, 0.1)",
  borderRadius: "8px",
  cursor: "default",
  border: "1px solid #FFFFFF",
  background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
  boxShadow: "0px 6px 100px 0px #00000033",


  // "&:hover": {
  //   "& .benefit-title": {
  //     "&::after": {
  //       width: "100%",
  //     },
  //   },
  //   "& .arrow-button": {
  //     width: 180,
  //     paddingLeft: theme.spacing(2),
  //     paddingRight: theme.spacing(2),
  //     display: "flex",
  //     justifyContent: "center",
  //     alignItems: "center",
  //     gap: theme.spacing(1.5),
  //     "& .view-details-text": {
  //       opacity: 1,
  //       maxWidth: 140,
  //       marginLeft: theme.spacing(1),
  //     },
  //   },
  // },
  transition: "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 320ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  transform: "translateZ(0)",
  willChange: "transform, box-shadow",
  "&:hover": {
    transform: "scale(1.010)",
    background: "linear-gradient(355deg, rgba(5, 109, 210, 0.03) 21.39%, rgba(5, 109, 210, 0.23) 183.31%)",
    "& .card-header::after": {
      width: "100%",
    },
    "& .arrow-button:not(.is-disabled)": {
      background: "#093F84",
      "& svg": {
        color: "#FFFFFF", 
      },
      "& .view-details-text": {
        color: "#FFFFFF",
      },
    },
  },
}));

export const CardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(5),
  gap: theme.spacing(5),
  flexWrap: "wrap",
  position: "relative",
  maxWidth:"fit-content",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: "-15px",
    left: 0,
    width: 0,
    height: "2px",
    backgroundColor: "#093F84",
    transition: "width 0.4s linear",
  },
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));
export const PolicyIcon = styled(Box)<{ gradient?: string }>(
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
      gradient || "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)",
  }),
);
export const BenefitTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.neutral.tertiary,
  fontFamily: theme.typography.fontFamily,
  position: "relative",
  display: "inline-block",
  // "&::after": {
  //   content: '""',
  //   position: "absolute",
  //   bottom: 0,
  //   left: 0,
  //   width: 0,
  //   height: "3px",
  //   backgroundColor: theme.palette.text.lightBlue,
  //   transition: "width 0.5s ease-in-out",
  // },
}));

export const PolicyPeriodBadge = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: theme.spacing(1.5, 3),
  backgroundColor: theme.palette.background.paper,
  border: `1.5px solid ${theme.palette.neutral.tableBorder}`,
  borderRadius: "24px",
  width: "fit-content",
}));

export const PolicyPeriodText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  fontFamily: theme.typography.fontFamily,
}));

export const CardFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-end",
  // width: "20%",
  marginTop: theme.spacing(3),
}));

export const ArrowButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$disabled",
})<{ $disabled?: boolean }>(({ theme, $disabled }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 180,
  height: 40,
  minWidth: 40,
  borderRadius: 6,
  overflow: "hidden",
  cursor: $disabled ? "not-allowed" : "pointer",
  border: $disabled ? "1px solid #DFDFDF" : `1px solid #093F84`,
  background: "transparent",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  gap: theme.spacing(1.5),
  opacity: $disabled ? 0.7 : 1,
  "& svg": {
    fontSize: theme.typography.fontSizes.xl,
    flexShrink: 0,
    color: $disabled ? "#9B9B9B" : "#093F84",
  },

  "& .view-details-text": {
    opacity: 1,
    maxWidth: 140,
    whiteSpace: "nowrap",
    overflow: "hidden",
    color: $disabled ? "#9B9B9B" : "#093F84",
  },

  "&:hover": {
    background: "#093F84",
    "& svg": {
      color: "#FFFFFF",
    },
    "& .view-details-text": {
      color: "#FFFFFF",
    },
  },
}));

export const ViewDetailsText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: "#093F84",
  fontFamily: theme.typography.fontFamily,
}));

export const FeaturesGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: theme.spacing(5),
  columnGap: theme.spacing(7.5),
}));
export const FeaturesGridEnrolledPolicies = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: theme.spacing(5),
  columnGap: theme.spacing(7.5),
  marginTop: theme.spacing(4),
}));

export const SummaryGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(6),
  marginBottom: theme.spacing(5),
  marginTop: theme.spacing(5),
}));

export const SummaryItem = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: 4,
}));

export const SummaryLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  letterSpacing: "1px",
  textTransform: "none",
  color: theme.palette.text.tertiary,
  opacity: 0.6,
}));

export const SummaryValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.neutral.tertiary,
}));

export const FeatureItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2.5),
}));

export const CheckIconWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 20,
  marginTop: 2,
  "& svg": {
    fontSize: theme.typography.fontSizes.xl,
    color: theme.palette.text.green,
  },
}));

export const FeatureText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
  lineHeight: 1.5,
  fontFamily: theme.typography.fontFamily,
}));

export const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  height: "100%",
  borderRadius: "0px !important",
  padding: theme.spacing(6, 5),
  [theme.breakpoints.between("sm", "md")]: {
    flexDirection: "column",
  },
}));
