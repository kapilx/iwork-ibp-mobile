import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { margin } from "@mui/system";
import { fluidCtaHover } from "../Dashboard/bannerCtaHover";

export const EmployeeDetailsContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  background: theme.palette.employeeBanner,
  overflowX: "hidden",
  color: theme.palette.common.white,
  position: "relative",
  marginTop: theme.spacing(15.5),  // desktop: header(~72px) + ~52px breathing space
  [theme.breakpoints.between("sm", "md")]: {
    marginTop: theme.spacing(11.5),  // ~92px: header(~72px) + ~20px
  },
  [theme.breakpoints.down("sm")]: {
    marginTop: theme.spacing(9.25),  // ~74px: header(~64px) + ~10px
  },
  "@media (max-width: 450px)": {
    marginTop: "48px",
  },
}));

export const EnrollmentText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xlarge,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.common.white,
  letterSpacing: "0px",
  height: "60px",
}));

export const EnrollmentTextContainer = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "overAllEnrollmentStatus" && prop !== "inProgress",
})<{
  overAllEnrollmentStatus?: string;
  inProgress?: boolean;
}>(({ theme, overAllEnrollmentStatus, inProgress }) => ({
  display:
    overAllEnrollmentStatus === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED"
      ? "none"
      : "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  ...(inProgress && {
    position: "absolute",
    right: theme.spacing(26.25),
    bottom: theme.spacing(2),
    flex: "none",
    minWidth: "90px",
    "@media (min-width: 360px) and (max-width: 450px)": {
      right: "73px",
    },
  }),
}));

export const EmployeeDetailsContent = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "1920px",
  margin: "0 auto",
  padding: theme.spacing(10, 12.5, 3.2, 10),
  display: "flex",
  alignItems: "stretch",
  justifyContent: "space-between",
  gap: theme.spacing(4),
  "@media (min-width: 1200px) and (max-width: 1360px)": {
    flexDirection: "column",
    gap: theme.spacing(4),
    padding: theme.spacing(5, 6, 3, 6),
  },
  [theme.breakpoints.down("lg")]: {
    flexDirection: "column",
    gap: theme.spacing(4),
    padding: theme.spacing(5, 6, 3, 6),
  },
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4, 4, 3, 4),
    gap: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3, 2, 2, 2),
    gap: theme.spacing(2),
  },
  [theme.breakpoints.up("xl")]: {
    maxWidth: "1600px",
    padding: theme.spacing(2, 3),
  },
}));

// export const EmployeeCollapsedContent = styled(Box)(({ theme }) => ({
//   width: "100%",
//   maxWidth: "1920px",
//   margin: "0 auto",
//   padding: theme.spacing(2.5, 10),
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "space-between",
//   gap: theme.spacing(3),
//   [theme.breakpoints.up("xl")]: {
//     maxWidth: "1600px",
//     padding: theme.spacing(2, 3),
//     // flexDirection: "column",
//     // alignItems: "flex-start",
//   },
//   height: "80px",
// }));

// export const EmployeeCollapsedTitle = styled(Typography)(({ theme }) => ({
//   fontSize: theme.typography.fontSizes.lg,
//   fontWeight: theme.typography.fontWeights.semiBold,
// }));

// export const EmployeeCollapsedButton = styled(Button)(({ theme }) => ({
//   alignSelf: "center",
//   backgroundColor: theme.palette.common.white,
//   color: theme.palette.button.primaryBlue,
//   borderRadius: theme.shape.borderRadii.medium,
//   textTransform: "none",
//   fontWeight: theme.typography.fontWeights.medium,
//   padding: theme.spacing(1.2, 3.5),
//   // boxShadow: "0px 8px 16px rgba(0,0,0,0.15)",
//   "& img": {
//     transform: "rotate(180deg)",
//   },
//   "&:hover": {
//     backgroundColor: theme.palette.button.primaryBlueHover,
//   },
// }));

export const EmployeeDetailsLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
  flex: 1,
  minWidth: 0,
}));

export const EmployeeName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.semiBold,
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
}));

export const EmployeeMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2.5),
  alignItems: "center",
}));

export const EmployeeOptionalMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(4),
  alignItems: "center",
}));

export const EmployeeMetaItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2.5),
  fontSize: theme.typography.fontSizes.md,
    // color: theme.palette.text.tertiary,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const EmployeeMetaIcon = styled("img")((isPipe: boolean) => ({
  width: 32,
  height:  32,
  display: "block",
}));

export const EmployeeNote = styled(Typography)(({ theme, addExtraMargin }: { theme: any; addExtraMargin?: boolean }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.neutral.veryLight,
  // marginTop: addExtraMargin ? theme.spacing(3) : theme.spacing(5),
}));

export const EmployeeOptionalNote = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.neutral.veryLight,
    fontWeight: theme.typography.fontWeights.regular,

}));
export const EmployeeActionButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "compactWidth",
})<{ compactWidth?: boolean }>(({ theme, compactWidth }) => ({
  width: compactWidth ? "233px" : "248px",
  height: "50px",
  alignSelf: "flex-start",
  backgroundColor: "#FFBF2E",
  color: "#000000",
  borderRadius: "6px",
  textTransform: "none",
  fontSize: "16px",
  fontWeight: 500,
  padding: theme.spacing(1.875, 2.5),
  boxShadow: "0px 4px 6px 0px #00000033",
  "&:hover": {
    backgroundColor: "#E6AB29",
  },
  "& img": {
    transform: "rotate(180deg)",
  },
}));

export const InProgressActionButton = styled(EmployeeActionButton)(({ theme }) => ({
  alignSelf: "flex-end",
  maxWidth: "210px",
  right: 45,
  gap:theme.spacing(1.5),
  minWidth: "250px"
}));
export const EnrolledActionButton = styled(EmployeeActionButton)(({ theme }) => ({
  alignSelf: "flex-end",
  maxWidth: "210px",
  gap:theme.spacing(1.5),
  minWidth: "250px",
  justifyContent: "space-between", // text left, arrow right
}));

// secondary CTA below "View Enrolment" — #00F3AE with the wellness banner's fluid hover
export const EnrolledWellnessButton = styled(EmployeeActionButton)(({ theme }) => ({
  alignSelf: "flex-end",
  maxWidth: "210px",
  minWidth: "250px",
  gap: theme.spacing(1.5),
  justifyContent: "space-between", // text left, arrow right
  backgroundColor: "#00F3AE",
  color: "#053D2C",
  ...fluidCtaHover({ hover: "#2BF6BE", glow: "rgba(0,243,174,.55)" }),
}));

export const EmployeeDetailsRight = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isEnrolled" && prop !== "isInProgress",
})<{ isEnrolled?: boolean; isInProgress?: boolean }>(
  ({ isEnrolled, isInProgress }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
);

export const EmployeeInfoCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: "transparent",
  borderRadius: 0,
  padding: 0,
  position: "relative",
  border: "none",
  boxShadow: "none",
  gap: theme.spacing(2),
  maxWidth: "100%",
}));

export const EmployeeIllustrationWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "inProgress",
})<{ inProgress?: boolean }>(({ theme, inProgress }) => ({
  display: "flex",
  alignItems: inProgress ? "flex-end" : "flex-start",
  position: "relative",
  gap: inProgress ? theme.spacing(3) : "6px",
  marginTop: inProgress ? theme.spacing(0) : theme.spacing(4),
}));

export const CounterBox = styled(Box)(({ theme }) => ({
  width: "233px",
  height: "187px",
  borderRadius: "20px",
  background: "linear-gradient(180deg, #2F64A9 0%, #144584 100%)",
  boxShadow: "0px 4px 4px 0px #00000040 inset",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(2),
}));

export const CounterBoxSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "center",
}));
export const HorizontalDivider = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "502px",
  height: "0px",
  border: "1px solid #000000",
  borderRadius: "2px",
}));

export const EmployeeInfoText = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 500,
  color: theme.palette.common.white,
  textAlign: "center",
  lineHeight: 1.4,
}));

export const InProgressInfoText = styled(EmployeeInfoText)(() => ({
  textAlign: "left",
  maxWidth: "175px",
  position: "absolute",
  left: "15%",
  bottom: "10%",
  "@media (min-width: 360px) and (max-width: 450px)": {
    left: "25%",
  },
  "@media (max-width: 399px)": {
    left: "35%",
    maxWidth: "28%",
  },
}));

export const EnrolledInfoText = styled(EmployeeInfoText)(({ theme }) => ({
  textAlign: "center",
  maxWidth: "280px",
  // marginRight: 60,
}));

export const EnrolledContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
  maxWidth: "100%",
  "@media (min-width: 720px) and (max-width: 1360px)": {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(4),
    marginTop: 0,
  },
  "@media (min-width: 1024px) and (max-width: 1360px)":{
       marginRight:"200px"
   }

}));

export const EnrolledTextGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const EnrolledIllustrationWrapper = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  width: "100%",
  "@media (min-width: 720px) and (max-width: 1360px)": {
    width: "auto",
    flex: "0 0 auto",
  },
}));
export const LoaderComponent = styled(Box)(() => ({
 minHeight:"300px",
  display: 'flex', 
  alignItems: 'center',
  justifyContent: 'center',
}));
export const EmployeeIllustration = styled("img", {
  shouldForwardProp: (prop) => prop !== "inProgress" && prop !== "isEnrolled",
})<{ inProgress?: boolean; isEnrolled?: boolean }>(({ inProgress, isEnrolled }) => ({
  height: "auto",
  position: "relative",
  left: inProgress ? "0px" : "0px",
  top: "0px",
  width: isEnrolled ? "100%" : "auto",
  minWidth: isEnrolled ? "min(444px, 100%)" : "auto",
  ...(inProgress && {
    "@media (min-width: 360px) and (max-width: 450px)": {
      left: "37px",
    },
  }),
  ...(isEnrolled && {
    "@media (min-width: 720px) and (max-width: 1360px)": {
      minWidth: "min(300px, 100%)",
    },
  }),
}));
export const SlotWrapperSpan = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 500,
  color: theme.palette.common.white,
  textAlign: "center",
}));

export const StepperContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 0,
  width: "100%",
  maxWidth: "900px",
  marginTop: theme.spacing(5.5),
  marginLeft: theme.spacing(-2.5),
  flexShrink: 0,
  "@media (min-width: 1025px) and (max-width: 1360px)": {
    maxWidth: "100%",
    marginLeft: 0,
  },
  [theme.breakpoints.down("lg")]: {
    maxWidth: "100%",
    marginLeft: theme.spacing(-8),
    overflowX: "auto",
    paddingBottom: theme.spacing(1),
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": { display: "none" },
  },
  [theme.breakpoints.down("md")]: {
    marginLeft: "-10px",
    marginTop: theme.spacing(3),
  },
  [theme.breakpoints.down("sm")]: {
    marginLeft: "-10px",
    marginTop: theme.spacing(2),
  },
  "@media (max-width: 600px)": {
    display: "flex",
    flexWrap: "nowrap",
    width: "100%",
    maxWidth: "100%",
    marginLeft: 0,
    gap: 0,
    overflowX: "visible",
    paddingBottom: 0,
  },
}));

export const StepWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2.5),
  position: "relative",
  minWidth: "110px",
  flexShrink: 0,
  "@media (min-width: 1025px) and (max-width: 1360px)": {
    flex: "1 1 0",
    minWidth: 0,
  },
  [theme.breakpoints.down("md")]: {
    minWidth: "100px",
  },
  [theme.breakpoints.down("sm")]: {
    minWidth: "90px",
  },
  "@media (max-width: 600px)": {
    flex: "1 1 0",
    minWidth: 0,
    width: "auto",
    gap: theme.spacing(0.5),
  },
}));

export const StepIconContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "customIcon",
})<{ completed?: boolean; customIcon?: boolean }>(
  ({ theme, completed, customIcon }) => ({
    width: "47px",
    height: "47px",
    borderRadius: "50%",
    backgroundColor: customIcon
      ? "transparent"
      : completed
      ? "#1CC673"
      : theme.palette.common.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    position: "relative",
    "@media (max-width: 600px)": {
      width: "28px",
      height: "28px",
    },
  }),
);

export const StepIcon = styled("img")(() => ({
  width: "47px",
  height: "47px",
  "@media (max-width: 600px)": {
    width: "28px",
    height: "28px",
  },
}));

export const StepLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.common.white,
  textAlign: "center",
  whiteSpace: "normal",
  wordBreak: "break-word",
  maxWidth: "100px",
  lineHeight: 1.3,
  "@media (min-width: 1025px) and (max-width: 1360px)": {
    whiteSpace: "nowrap",
    maxWidth: "none",
  },
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xs,
    maxWidth: "90px",
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: "11px",
    maxWidth: "80px",
  },
  "@media (max-width: 600px)": {
    fontSize: "8px",
    maxWidth: "100%",
    lineHeight: 1.15,
  },
}));

export const StepConnector = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "23.5px",
  left: "calc(50% + 24px)",
  width: "calc(110px - 47px - 4px)",
  height: "2px",
  backgroundColor: theme.palette.common.white,
  zIndex: 1,
  "@media (min-width: 1025px) and (max-width: 1360px)": {
    width: "calc(100% - 47px - 4px)",
  },
  [theme.breakpoints.down("md")]: {
    left: "calc(50% + 24px)",
    width: "calc(100px - 47px - 4px)",
  },
  [theme.breakpoints.down("sm")]: {
    left: "calc(50% + 24px)",
    width: "calc(90px - 47px - 4px)",
  },
  "@media (max-width: 600px)": {
    top: "14px",
    left: "calc(50% + 14px)",
    width: "calc(100% - 20px)",
  },
}));

export const EmployeeNoteDivider = styled(Box)(({ theme }) => ({
  width: "1px",
  color: theme.palette.background.paper,
  opacity: 0.6,
}));
