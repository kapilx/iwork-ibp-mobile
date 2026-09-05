import { styled } from "@mui/material/styles";
import { Box, Typography, Tabs, Tab, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import CommonButton from "../../common/Button";
import { gap } from "@mui/system";
import { theme } from "node_modules/@insurance-wellness-hub/ui-lib/src/lib/styles/Theme";

export const StyledContainer = styled("div")(({ theme }) => ({
  // position: "relative",
  // display: "flex",
  // flexDirection: "column",
  // width: "100%",
  // minHeight: "100vh",
  // alignItems: "center",
  // justifyContent: "flex-start",
  // paddingBottom: theme.spacing(8),
  // backgroundColor: theme.palette.background.loginBg,
}));
export const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  "& .MuiTabs-indicator": {
    backgroundColor: "#1F79D4",
    height: "3px",
  },
}));
export const PrimaryAuthenticationWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  marginTop: theme.spacing(3),
  cursor: "pointer",
  "&:hover": {
    opacity: 0.8,
  },
}));
export const PrimaryAuthenticationIcon = styled("img")(({ theme }) => ({}));
export const PrimaryAuthenticationText = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 500,
  color: "#399BFC",
}));
export const AuthenticationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));
export const AuthenticationWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  border: "1px solid #FFB35B",
  padding: theme.spacing(3),
  background: "#FFFCD857",
}));
export const AuthenticationHeading = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 500,
}));
export const AuthenticationSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 500,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  marginTop: theme.spacing(1),
}));
export const AuthenticationRadioWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  marginTop: theme.spacing(10),
}));
export const AuthenticationRadioOption = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
}));
export const AuthenticationRadioLabel = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 500,
  marginLeft: theme.spacing(1),
  color: theme.palette.text.primary,
}));
export const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: "none",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "#626284",
  minHeight: "72px",
  padding: theme.spacing(2),
  border: "1px solid #E6E6E6",
  borderTop: "none",
  borderLeft: "none",
  // borderRight: 'none',
  "&.Mui-selected": {
    color: "#1F79D4",
    fontWeight: 600,
    border: "none",
  },
  "&:hover": {
    backgroundColor: "rgba(31, 121, 212, 0.05)",
  },
}));

export const RightStyledTab = styled(Tab)(({ theme }) => ({
  textTransform: "none",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "#626284",
  minHeight: "72px",
  padding: theme.spacing(2),
  borderBottom: "1px solid #E6E6E6",
  borderLeft: "1px solid #E6E6E6",
  "&.Mui-selected": {
    // border: 'none',
  },
  "&:hover": {
    backgroundColor: "rgba(31, 121, 212, 0.05)",
  },
}));

export const LeftStyledTab = styled(Tab)(({ theme }) => ({
  textTransform: "none",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "#626284",
  minHeight: "72px",
  padding: theme.spacing(2),
  borderBottom: "1px solid #E6E6E6",
  borderLeft: "1px solid #E6E6E6",
  "&.Mui-selected": {
    // border: 'none',
  },
  "&:hover": {
    backgroundColor: "rgba(31, 121, 212, 0.05)",
  },
}));

export const TabIconWrapper = styled(Box)(() => ({
  width: "40px",
  height: "40px",
  "& img": {
    objectFit: "contain",
  },
}));

export const SubTitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: "18px",
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  fontWeight: theme.typography.fontWeights.regular,
  "@media (max-width: 768px)": {
    fontSize: "14px",
  },
}));
export const StyledForgotPasswordLink = styled("a")(({ theme }) => ({
  display: "block",
  fontSize: "0.875rem",
  color: "#1F79D4",
  textDecoration: "none",
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(3),
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
}));
export const LoginContainer = styled(Box)(({ theme, step }) => ({
  display: "flex",
  flexDirection: "column",
  // alignItems: step === "forgot" ? "center" : "flex-start",
  justifyContent: step === "forgot" ? "center" : "",
  width: "100%",
  maxWidth: "430px",
  height: "100%",
  minHeight: 0,
  // minHeight: "394px",
  margin: "0 auto",
  paddingBottom: theme.spacing(1),
  overflowY: "auto",
  "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus":
    {
      WebkitBoxShadow: "0 0 0 1000px transparent inset !important",
      WebkitTextFillColor: "#000 !important",
      transition: "background-color 5000s ease-in-out 0s !important",
    },
  [theme.breakpoints.down("md")]: {
    width: "100%",
    maxWidth: "440px",
    padding: theme.spacing(6),
  },
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    maxWidth: "320px",
    minHeight: "340px",
    padding: theme.spacing(4),
    "& form": {
      width: "100%",
    },
  },
  ".forgot-password-section": {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  "& input[type='password']::-ms-reveal, & input[type='password']::-ms-clear": {
    display: "none",
  },
  "& input[type='password']::-webkit-credentials-auto-fill-button": {
    visibility: "hidden",
    pointerEvents: "none",
  },
  "& input[type='password']::-webkit-textfield-decoration-container": {
    visibility: "hidden",
    pointerEvents: "none",
  },
}));

export const TitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
  display: "flex",
  alignItems: "center",
  marginBottom: "10px",
  justifyContent: "center",
  "@media (min-width:360px) and (max-width: 768px)": {
    fontSize: "18px"
  }
}));

export const StyledButton = styled("button", {
  shouldForwardProp: (prop) => prop !== "variantType",
})<{ variantType: string }>(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.background.paper,
  padding: theme.spacing(3, 5),
  border: "none",
  borderRadius: theme.shape.borderRadii.small,
  fontSize: theme.typography.fontSizes.md,
  cursor: "pointer",
  width: "140px",
  marginTop: theme.spacing(8),
}));
export const AuthenticationRadioText = styled(Typography)(({ theme }) => ({
  fontSize: "18px",
  fontWeight: 400,
  letterSpacing: "0px",
  color: theme.palette.text.tertiary,
  opacity: 0.6,
}));
export const AuthRadioGroup = styled(Box)(() => ({
  display: "flex",
  columnGap: "25px",
}));

export const OtpVerificationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const OtpSentMessage = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 400,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  textAlign: "center",
  marginTop: theme.spacing(2),
  "& span": {
    fontWeight: 600,
    opacity: 1,
    color: theme.palette.text.primary,
  },
}));

export const OtpInputWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
}));

export const OtpInput = styled("input")(({ theme }) => ({
  width: "48px",
  height: "48px",
  fontSize: "20px",
  fontWeight: 600,
  textAlign: "center",
  border: "none",
  borderBottom: "2px solid #D1D5DC",
  backgroundColor: "transparent",
  outline: "none",
  transition: "all 0.2s ease",
  "&:focus": {
    borderBottom: "2px solid #3D9EF0",
  },
  "&:hover": {
    borderBottom: "2px solid #3D9EF0",
  },
}));

export const OtpActionsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginTop: theme.spacing(3),
  gap: theme.spacing(1),
}));

export const OtpActionText = styled(Typography)(({ theme }) => ({
  fontSize: "18px",
  fontWeight: 400,
  color: theme.palette.text.tertiary,
}));

export const OtpActionLink = styled("span")(({ theme }) => ({
  fontSize: "18px",
  color: "#399BFC",
  fontWeight: 400,
  cursor: "pointer",
  textDecoration: "none",
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const CompleteLoginButton = styled(CommonButton)(({ theme }) => ({
  width: "206px",
  margin: "0 auto",
  marginTop: theme.spacing(7),
  padding: theme.spacing(1.5),
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: 400,
}));

// export const AuthenticationSubHeading = styled(Typography)(({ theme }) => ({
//   fontSize: '14px',
//   fontWeight:500,
//   color:theme.palette.text.tertiary,
//   opacity:0.6,
// }));
export const ButtomContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  marginTop: theme.spacing(5),
}));
export const ButtonWrapper = styled(CommonButton)(({ theme }) => ({
  borderRadius: "6px",
  // marginTop: theme.spacing(5),
  width: "282px",
}));
export const AuthenticationButtonWrapper = styled(Box)(({ theme }) => ({
  maxWidth: "106px",
  margin: "0 auto",
}));
export const SupportText = styled("p")(({ theme }) => ({
  fontSize: "0.875rem",
  color: "#626284",
  textAlign: "center",
  marginTop: theme.spacing(9),
  "@media (max-width: 768px)": {
    marginTop: theme.spacing(3),
  },
  "& a": {
    color: "#1F79D4",
    textDecoration: "none",
    fontWeight: 500,
    cursor: "pointer",
    "&:hover": {
      textDecoration: "underline",
    },
  },
}));

export const StyledAlert = styled("div")(({ theme }) => ({
  color: theme.palette.text.error,
  backgroundColor: theme.palette.background.messageBoxContainerBg,
  borderRadius: theme.shape.borderRadii.small,
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(5),
}));

export const LogoContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const Logo = styled("img")(({ theme }) => ({
  width: "170px",
  height: "auto",
  marginBottom: theme.spacing(8),
  [theme.breakpoints.down("sm")]: {
    width: "150px",
  },
}));

export const HeadingContainer = styled("div")(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
   "@media (max-width: 768px)": {
     marginBottom: theme.spacing(0),
  }
}));

export const ForgotPasswordLink = styled(Link)(({ theme }) => ({
  color: "#399BFC",
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  textDecoration: "none",
  fontFamily: theme.typography.fontFamily,
  alignSelf: "flex-start",
  textAlign: "center",
}));

export const StyledLogin = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  // paddingLeft: theme.spacing(25),
  [`@media (max-width: 1280px)`]: {
    [theme.breakpoints.down("md")]: {
      width: "100%",
      alignItems: "center",
    },
  },
}));

export const StyledTermsBlock = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3.5),
  marginTop: theme.spacing(12.5),
  justifyContent: "center",
}));

export const StyledLink = styled(Box)(({ theme }) => ({
  color: theme.palette.text.LightDark,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  // cursor: "pointer",
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xss,
  },
}));

export const StyledLoginWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  width: "100%",
  gap: theme.spacing(24),
  height: "fit-content",
  position: "relative",
  maxWidth: "1366px",
  marginLeft: "auto",
  marginRight: "auto",
  paddingTop: theme.spacing(15),
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "1px",
    backgroundColor: theme.palette.border.lightGray, // Adjust the opacity as needed
    maxWidth: "1255px",
    left: 0,
    right: 0,
    margin: "0 auto",
  },
  [`@media (max-width: 1280px)`]: {
    gap: "70px",
    "&::after": {
      margin: "36px auto ",
      maxWidth: "1165px",
      width: "calc(100% - 40px)",
    },
  },
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: theme.spacing(6),
    alignItems: "center",
    padding: theme.spacing(10, 4, 0),
    "&::after": {
      margin: "0px auto ",
      maxWidth: "1165px",
      width: "calc(100% - 40px)",
    },
  },
}));

export const StyledBanner = styled(Box)(({ theme }) => ({
  width: "60%",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "center",
  textAlign: "center",
  position: "relative",
  [`@media (max-width: 1280px)`]: {
    width: "50%",
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
    alignItems: "center",
  },
}));

export const StyledBannerContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  position: "absolute",
  top: 13,
  left: 0,
  textAlign: "left",
  maxWidth: "490px",
  [theme.breakpoints.down("md")]: {
    position: "static",
    alignItems: "center",
    textAlign: "center",
    maxWidth: "100%",
  },
}));

export const StyledBannerTitle = styled(Typography)(({ theme }) => ({
  fontSize: "42px",
  fontWeight: theme.typography.fontWeights.medium,
  marginBottom: theme.spacing(2.5),
  textAlign: "left",
  fontFamily: theme.typography.fontFamily,
  lineHeight: "52px",
  letterSpacing: "0px",
  [`@media (max-width: 1280px)`]: {
    fontSize: theme.typography.fontSizes.xxxl,
  },
  [`@media (max-width: 1120px)`]: {
    fontSize: theme.typography.fontSizes.xxll,
  },
  [theme.breakpoints.down("md")]: {
    fontSize: theme.typography.fontSizes.xxl,
    textAlign: "center",
    marginBottom: theme.spacing(1.5),
    lineHeight: "35px",
  },
}));

export const StyledBannerText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.regular,
  textAlign: "left",
  maxWidth: "298px",
  fontFamily: theme.typography.fontFamily,
  lineHeight: "24px",
  letterSpacing: "0px",
  [`@media (max-width: 1280px)`]: {
    fontSize: theme.typography.fontSizes.lg,
  },
  [`@media (max-width: 1120px)`]: {
    fontSize: theme.typography.fontSizes.md,
  },
  [theme.breakpoints.down("md")]: {
    textAlign: "center",
    maxWidth: "100%",
  },
}));

export const StyledHeader = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(4, 9),
  position: "relative",
  zIndex: 1,
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(3, 4),
  },
  "& img": {
    [theme.breakpoints.down("sm")]: {
      maxHeight: "32px",
      width: "auto",
    },
  },
}));

export const StyledLogo = styled("img")(({ theme }) => ({
  width: "78px",
  height: "50px",
  objectFit: "contain",
}));

export const StyledFaqContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xs,
    "& img": {
      width: "16px",
      height: "16px",
    },
  },
}));

export const GroupImage = styled("img")(({ theme }) => ({
  width: "548px",
  height: "507px",
  marginTop: theme.spacing(10.75),
  objectFit: "contain",
  display: "block",
  [`@media (max-width: 1280px)`]: {
    width: "450px",
  },
  [theme.breakpoints.down("md")]: {
    width: "100%",
    maxWidth: "440px",
    height: "auto",
    marginTop: theme.spacing(0),
  },
  [theme.breakpoints.down("sm")]: {
    maxWidth: "320px",
  },
}));

export const ForgotContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2.5),
  margin: "0 auto",
}));
export const ConformIcon = styled("img")(({ theme }) => ({
  // marginTop: theme.spacing(5),
  width: "48px",
  height: "48px",
}));
export const PasswordResetLinkMessage = styled(Typography)(({ theme }) => ({
  textAlign: "center",
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.tertiary,
}));
export const PasswordResetMessage = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.tertiary,
}));
export const Email = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.linkColor,
  cursor: "pointer",
}));

export const BottomText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  marginTop: "90px",
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.mediumGrey,
  "& .resend-link": {
    color: theme.palette.text.linkColor,
    fontWeight: theme.typography.fontWeights.regular,
    cursor: "pointer",
  },
}));

export const BottomContainer = styled("div")(({ theme }) => ({
  width: "100%",
  justifyContent: "center",
}));
export const GuidelinesContainer = styled("div")(({ theme }) => ({
  margin: `${theme.spacing(4)} 0`,
  width: "100%",
  maxWidth: "372px",
}));

export const GuidelinesHeading = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
}));

export const GuidelineRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1.5),
}));

export const GuidelineIcon = styled("img")(({ theme }) => ({
  width: 16,
  height: 16,
  marginRight: theme.spacing(2),
}));

export const GuidelineText = styled("span")<{ passed?: boolean }>(
  ({ theme, passed }) => ({
    fontSize: "12px",
  })
);

export const ButtomContainerVerifyOtp = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "end",
  width: "100%",
  marginTop: theme.spacing(5),
}));

// Form container styles
export const FormContainer = styled(Box)(({ theme }) => ({
  // maxWidth: "372px",
}));

// Separator styles
export const SeparatorContainer = styled("div")(({ theme }) => ({
  margin: "20px 0",
  textAlign: "center",
  color: "#666",
}));

// Loading state container
export const LoadingStateContainer = styled("div")(({ theme }) => ({
  textAlign: "center",
  padding: "20px",
  color: "#666",
}));

// Phone OTP form container
export const PhoneOTPContainer = styled("div")(({ theme }) => ({
  width: "100%",
  // maxWidth: "372px",
}));

// OTP instruction text
export const OTPInstructionText = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: "#666",
}));

// OTP label text
export const OTPLabelText = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  color: "#666",
  fontSize: "14px",
}));

// OTP TextField styles
export const OTPTextField = styled("input")(({ theme }) => ({
  width: "100%",
  padding: "12px 16px",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  fontSize: "16px",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  outline: "none",
  transition: "border-color 0.2s",
  marginBottom: theme.spacing(2),
  "&:focus": {
    borderColor: "#F97316",
  },
  "&:blur": {
    borderColor: "#D1D5DB",
  },
}));

// Phone number field styles
export const PhoneNumberField = styled("input")<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "16px",
    backgroundColor: disabled ? "#F3F4F6" : "rgba(255, 255, 255, 0.8)",
    outline: "none",
    transition: "border-color 0.2s",
    "&:focus": {
      borderColor: !disabled ? "#F97316" : "#D1D5DB",
    },
    "&:blur": {
      borderColor: "#D1D5DB",
    },
  })
);

// Field container
export const FieldContainer = styled("div")(({ theme }) => ({
  marginBottom: "16px",
}));

// Field label
export const FieldLabel = styled("label")(({ theme }) => ({
  display: "block",
  marginBottom: "8px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 500,
}));

// Resend OTP container
export const ResendOTPContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px",
  gap: "4px",
}));

// Resend OTP text
export const ResendOTPText = styled("span")(({ theme }) => ({
  color: "#666",
  fontSize: "14px",
}));

// Back to login container
export const BackToLoginContainer = styled("div")(({ theme }) => ({
  textAlign: "center",
  marginTop: "20px",
}));

// Clickable link style
export const ClickableLink = styled(ForgotPasswordLink)(({ theme }) => ({
  cursor: "pointer",
}));

// Resend OTP link with dynamic styling
export const ResendOTPLink = styled(ForgotPasswordLink)<{
  disabled?: boolean;
  disabledColor?: string;
  activeColor?: string;
}>(({ theme, disabled, disabledColor, activeColor }) => ({
  color: disabled
    ? disabledColor || "#999"
    : activeColor || theme.palette.background.DarkBlue,
  cursor: disabled ? "not-allowed" : "pointer",
  textDecoration: "underline",
  fontSize: "14px",
  margin: 0,
}));

export const PowerText = styled("span")(({ theme }) => ({
  margin: theme.spacing(0, 3),
}));

export const CaptchaContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "372px",
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

export const LoginFlowShell = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.6fr) minmax(420px, 520px)",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #2D5FA9 0%, #23559F 48%, #1E4B8E 100%)",
  overflowX: "hidden",
  overflowY: "auto",
  // 769–1024px: tablet — narrower card so hero gets more room
  "@media (min-width: 769px) and (max-width: 1024px)": {
    gridTemplateColumns: "1fr 360px",
    minHeight: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
  },
  // 1025–1280px: larger tablet / small laptop
  "@media (min-width: 1025px) and (max-width: 1280px)": {
    gridTemplateColumns: "1fr 440px",
    minHeight: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
  },
  // ≤768px: stacked — hero banner on top, login card below
  "@media (max-width: 768px)": {
    display: "flex",
    flexDirection: "column",
    overflowX: "hidden",
    overflowY: "auto",
    minHeight: "100dvh",
  },
}));

export const LoginFlowHero = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  minHeight: "100vh",
  padding: theme.spacing(8, 10),
  overflow: "hidden",
  // 769–1024px: tablet
  "@media (min-width: 769px) and (max-width: 1024px)": {
    minHeight: "100vh",
    padding: theme.spacing(4, 4, 3),
  },
  // 1025–1280px: larger tablet / small laptop
  "@media (min-width: 1025px) and (max-width: 1280px)": {
    minHeight: "100vh",
    padding: theme.spacing(5, 6, 4),
  },
  // ≤768px: fixed banner height, card slides up below
  "@media (max-width: 768px)": {
    minHeight: "380px",
    height: "380px",
    flexShrink: 0,
    padding: 0,
    alignItems: "flex-start",
  },
}));

export const LoginFlowCurve = styled("img")(() => ({
  position: "absolute",
  inset: 0,
  height: "100%",
  opacity: 1,
  top: "26px",
  objectFit: "cover",
  objectPosition: "center top",
  // ≤768px: flush with top, scale to fill
  "@media (max-width: 768px)": {
    top: 0,
    objectFit: "cover",
    objectPosition: "left top",
    width: "100%",
  },
  // 769–1024px: tall narrow column, cover from top
  "@media (min-width: 769px) and (max-width: 1024px)": {
    top: 0,
    objectFit: "cover",
    width: "100%",
    objectPosition: "center top",
  },
 
}));

export const LoginFlowBoy = styled("img")(({ theme }) => ({
  position: "absolute",
  left: "8%",
  bottom: 0,
  width: "28%",
  maxWidth: "260px",
  minWidth: "180px",
  objectFit: "contain",
  objectPosition: "bottom",
  zIndex: 1,
  // 769–1024px: width-based to prevent text overlap in narrow hero column
  "@media (min-width: 769px) and (max-width: 1024px)": {
    width: "32%",
    maxWidth: "160px",
    minWidth: "unset",
    height: "auto",
    left: "2%",
    objectFit: "contain",
    objectPosition: "bottom left",
  },
  // 1025–1280px: can use taller height-based sizing
  "@media (min-width: 1025px) and (max-width: 1280px)": {
    width: "30%",
    maxWidth: "220px",
    minWidth: "unset",
    height: "auto",
    left: "3%",
    objectFit: "contain",
    objectPosition: "bottom left",
  },
  // ≤768px: fixed height so head is never clipped by hero boundary
  "@media (max-width: 768px)": {
    width: "auto",
    minWidth: "unset",
    height: "350px",
    maxHeight: "350px",
    left: "0%",
    objectFit: "contain",
    objectPosition: "bottom left",
  },
}));

export const LoginFlowHeroContent = styled(Box)(({ theme }) => ({
  position: "relative",
  zIndex: 2,
  maxWidth: "520px",
  marginLeft: "32%",
  color: "#FFFFFF",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  alignItems: "flex-start",
  justifyContent: "center",
  // 769–1024px: text starts after boy (boy is 34% = left 2% + width 32%)
  "@media (min-width: 769px) and (max-width: 1024px)": {
    marginLeft: "38%",
    maxWidth: "calc(62% - 24px)",
    gap: theme.spacing(2),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  // 1025–1280px: wider hero, text after boy (boy is 33% = left 3% + width 30%)
  "@media (min-width: 1025px) and (max-width: 1280px)": {
    marginLeft: "38%",
    maxWidth: "calc(62% - 40px)",
    gap: theme.spacing(2.5),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  // ≤768px: centered across the full hero width, above the boy
  "@media (max-width: 768px)": {
    position: "absolute",
    left: "105px",
    right: 0,
    top: "40px",
    bottom: "40px",
    marginLeft: "55px",
    maxWidth: "100%",
    gap: theme.spacing(1.5),
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    textAlign: "center",
    pointerEvents: "none",
  },
}));

export const LoginFlowHeroTitle = styled(Typography)(({ theme }) => ({
  fontSize: "64px",
  fontWeight: 400,
  lineHeight: 1.2,
  color: "#FFFFFF",
  animation: "heroSlideIn 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
  "@keyframes heroSlideIn": {
    from: { opacity: 0, transform: "translateX(40px)" },
    to: { opacity: 1, transform: "translateX(0)" },
  },
  // 769–1280px
  "@media (min-width: 769px) and (max-width: 1280px)": {
    fontSize: "36px",
    lineHeight: "44px",
  },
  // ≤768px
  "@media (max-width: 768px)": {
    fontSize: "22px",
    lineHeight: "30px",
  },
}));

export const LoginFlowHeroDots = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "sticky",
  bottom: theme.spacing(2.5),
  left: 0,
  width: "60%",
  gap: theme.spacing(2),
  // 769–1024px: align with text column start
  "@media (min-width: 769px) and (max-width: 1024px)": {
    // position: "absolute",
    // bottom: theme.spacing(4),
    left: "38%",
    width: "auto",
    justifyContent: "flex-start",
  },
  // 1025–1280px: align with text column start
  "@media (min-width: 1025px) and (max-width: 1280px)": {
    // position: "absolute",
    bottom: theme.spacing(5),
    left: "38%",
    width: "auto",
    justifyContent: "flex-start",
  },
  // ≤768px: centered horizontally at the bottom of the hero
  "@media (max-width: 768px)": {
    position: "absolute",
    bottom: theme.spacing(3),
    left: 0,
    right: 0,
    width: "100%",
    justifyContent: "center",
    marginTop: 0,
  },
}));

export const LoginFlowHeroDot = styled("span", {
  shouldForwardProp: (prop) => prop !== "$active",
})<{ $active?: boolean }>(({ $active }) => ({
  width: $active ? "22px" : "14px",
  height: "6px",
  borderRadius: "999px",
  backgroundColor: $active ? "#FFFFFF" : "rgba(255, 255, 255, 0.55)",
  transition: "all 0.2s ease",
}));

export const LoginFlowCardArea = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(5, 5),
   marginLeft: "-32px",
  // 769–1024px: tighter padding inside 360px card column
  "@media (min-width: 769px) and (max-width: 1024px)": {
    padding: theme.spacing(3, 2),
     marginLeft: "-32px",
    alignItems: "center",
    justifyContent: "center",
  },
  // 1025–1280px: standard padding inside 440px card column
  "@media (min-width: 1025px) and (max-width: 1280px)": {
    padding: theme.spacing(4, 3),
     marginLeft: "-32px",
    alignItems: "center",
    justifyContent: "center",
  },
  // ≤768px: no padding — card is a full-width bottom sheet
  "@media (max-width: 768px)": {
    padding: 0,
    width: "100%",
    marginLeft: 0,
    backgroundColor: "transparent",
    alignItems: "flex-start",
    flex: "1 0 auto",
  },
}));

export const LoginFlowCard = styled(Box)(({ theme }) => ({
  width: "100%",
  minWidth: "unset",
  maxWidth: "100%",
  height: "100%",
  maxHeight: "100vh",
  backgroundColor: "#FFFFFF",
  borderRadius: "16px",
  boxShadow: "0 24px 64px rgba(10, 35, 78, 0.18)",
  padding: theme.spacing(6, 5),
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
  zIndex: 3,
  // 769–1024px: compact card inside 360px column
  "@media (min-width: 769px) and (max-width: 1024px)": {
    minWidth: "unset",
    width: "100%",
    height: "auto",
    maxHeight: "calc(100vh - 64px)",
    borderRadius: "16px",
    padding: theme.spacing(4, 3),
  },
  // 1025–1280px: standard card inside 440px column
  "@media (min-width: 1025px) and (max-width: 1280px)": {
    minWidth: "unset",
    width: "100%",
    maxHeight: "calc(100vh - 80px)",
    borderRadius: "16px",
    padding: theme.spacing(5, 4),
    overflowY: "auto",
  },
  // ≤768px: full-width bottom sheet with rounded top corners
  "@media (max-width: 768px)": {
    minWidth: "unset",
    width: "100%",
    maxWidth: "100%",
    borderRadius: "24px 24px 0 0",
    padding: theme.spacing(4, 3, 2),
    height: "auto",
    maxHeight: "none",
    flex: "1 0 auto",
    overflowY: "visible",
    boxShadow: "0 -4px 24px rgba(10, 35, 78, 0.14)",
  },
}));

export const LoginFlowFormStack = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
  "@media (max-width: 768px)": {
    minHeight: "unset",
    gap : theme.spacing(1),
  },
}));

export const LoginFlowFieldLabel = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 400,
  fontStyle: "normal",
  fontFamily: "Figtree, sans-serif",
  lineHeight: "100%",
  letterSpacing: "0px",
  color: "#1E2861B3!important",
  marginBottom: theme.spacing(1),
}));

export const LoginFlowTextField = styled(TextField)(({ theme }) => ({
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
  marginTop: "5px",
  // border: "0px",
  padding: "0px",

  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",

    // remove default border
    "& .MuiOutlinedInput-notchedOutline": {
       border: "1px solid #999999",
    },

    // remove hover border
    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: "1px solid #999999",
    },

    // remove focus border
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "1px solid #999999",
    },
  },

  "& .MuiOutlinedInput-input": {
    padding: "10px",
  },
}));

export const LoginFlowPrimaryButton = styled(CommonButton)(({ theme }) => ({
  width: "282px",
  height: "48px",
  marginTop: theme.spacing(4),
  borderRadius: "8px",
  "@media (max-width: 768px)": {
    width: "100%",
  },
}));

export const LoginFlowSecondaryButton = styled(CommonButton)(({ theme }) => ({
  width: "282px",
  height: "40px",
  margin: "0 auto",
  marginTop: theme.spacing(1),
  borderRadius: "8px",
  backgroundColor: "transparent !important",
  border: "1px solid #093F84 !important",
  "@media (max-width: 768px)": {
    width: "100%",
  },

  "&.Mui-disabled": {
    opacity: 0.5,
    border: "1px solid #093F84 !important",
    color: "#093F84",
    cursor: "not-allowed",
  },
}));

// OTP Loading Spinner
export const OtpSpinner = styled("div")({
  width: "24px",
  height: "24px",
  border: "2px solid #f3f3f3",
  borderTop: "2px solid #1976d2",
  borderRadius: "50%",
  animation: "otpSpin 1s linear infinite",

  "@keyframes otpSpin": {
    "0%": {
      transform: "rotate(0deg)",
    },
    "100%": {
      transform: "rotate(360deg)",
    },
  },
});

export const LoginFlowDividerText = styled(Typography)(({ theme }) => ({
  fontSize: "18px",
  color: "#303030",
  textAlign: "center",
  marginTop: theme.spacing(1),
  "@media (max-width: 768px)": {
    fontSize: "14px",
  },
}));

export const LoginMethodCards = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  // marginBottom: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const LoginMethodCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$selected",
})<{ $selected?: boolean }>(({ theme, $selected }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  borderRadius: "16px",
  border: $selected ? "1.5px solid #52A5FF" : "1px solid #E6EAF2",
  boxShadow: $selected
    ? "0 12px 26px rgba(31, 121, 212, 0.16)"
    : "0 12px 26px rgba(15, 23, 42, 0.08)",
  padding: theme.spacing(2),
  cursor: "pointer",
  backgroundColor: $selected ? "rgba(82, 165, 255, 0.07)" : "#FFFFFF",
  transition: "all 0.2s ease",
}));

export const LoginMethodCardInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: 0,
  "@media (max-width: 400px)": {
    gap: theme.spacing(1),
  },
}));

export const LoginMethodCardIcon = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$variant",
})<{ $variant?: "password" | "otp" }>(({ $variant }) => ({
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: $variant === "password" ? "#2E8B57" : "#EE6D2E",
  fontSize: "22px",
  flexShrink: 0,
  "@media (max-width: 400px)": {
    width: "30px",
    height: "30px",
    "& img": {
      width: "30px !important",
      height: "30px !important",
    },
  },
}));

export const LoginMethodCardTitle = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 500,
  color: "#1F2937",
  "@media (max-width: 400px)": {
    fontSize: "14px",
  },
}));

export const LoginMethodCardSelectionIcon = styled("img")(() => ({
  width: "40px",
  height: "40px",
  objectFit: "contain",
  flexShrink: 0,
  "@media (max-width: 400px)": {
    width: "30px",
    height: "30px",
  },
}));

export const LoginFlowInlineAction = styled(Typography)(({ theme }) => ({
  fontSize: "18px",
  color: "#2E83FF",
  textAlign: "center",
  cursor: "pointer",
  marginTop: "24px",
  "@media (max-width: 768px)": {
    fontSize: "14px",
    marginTop: "16px",
  },
}));

// Full-page login header styles
export const LoginPageContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
}));

export const LoginPageHeader = styled(Box)<{
  addJustifyContent?: boolean;
}>(({ theme, addJustifyContent }) => ({
  display: "flex",
  justifyContent: addJustifyContent ? "space-between" : "flex-end",
  alignItems: "center",
  padding: theme.spacing(2, 4),
  backgroundColor: "white",
  position: "relative",
  zIndex: 10,
}));

export const LoginPageLogo = styled("img")(({ theme }) => ({
  height: "40px",
  cursor: "pointer",
  objectFit: "contain",
}));

export const LoginPageActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4),
  marginLeft: "auto",
}));

export const LoginPageSupportButton = styled(Box)(({ theme }) => ({
  // backgroundColor: "#E6E6E6",
  color: "black",
  padding: theme.spacing(2, 2),
  // minHeight: "35.55px",
  fontSize: "14px",
  cursor: "pointer",
  minWidth: "92px",
  textAlign: "center",
  borderRadius: "4px",
  border: '1px solid #d9d9d9'
}));

export const LoginPageHomeButton = styled(Box)(({ theme }) => ({
  backgroundColor: "#FF6B35",
  color: "white",
  padding: theme.spacing(2, 2),
  borderRadius: "4px",
  fontSize: "14px",
  cursor: "pointer",
  minWidth: "92px",
  textAlign: "center",
  // minHeight: "35.55px",
  "&:hover": {
    backgroundColor: "#E55A2B",
  },
}));
