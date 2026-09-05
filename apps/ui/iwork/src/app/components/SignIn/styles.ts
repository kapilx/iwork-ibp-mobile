import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { Button } from "@ui/ui-lib";

export const SignInStyledContainer = styled("div")(({ theme }) => ({
  display: "flex",
  backgroundColor: theme.palette.neutral.veryLight,
  // paddingTop: theme.spacing(10),
  // paddingLeft: theme.spacing(1),
  width: "100%",

  [theme.breakpoints.down("md")]: {
    flexDirection: "column-reverse",
  },
}));

export const ImageSection = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
}));

export const StyledImage = styled("img")(({ theme }) => ({
  height: "auto",
  borderTopLeftRadius: theme.shape.borderRadii.large,
}));

export const LoginContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  width: "40%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: "460px",
  margin: "0 auto",

  [theme.breakpoints.down("md")]: {
    width: "100%",
    padding: theme.spacing(0, 5),
    height: "calc(100vh - 31px)",
  },
}));
export const TitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.primary.main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.xll,
  },
}));

export const SignInStyledButton = styled(Button, {
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

export const ButtomContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
}));
export const StyledAlert = styled("div")(({ theme }) => ({
  color: theme.palette.text.error,
  backgroundColor: theme.palette.background.messageBoxContainerBg,
  borderRadius: theme.shape.borderRadii.small,
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(5),
}));
export const FullScreenBlock = styled("div")(({ theme }) => ({
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 2000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(6),
}));
export const FullScreenCard = styled("div")(({ theme }) => ({
  width: "100%",
  maxWidth: "560px",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadii.large,
  boxShadow: theme.shadows[4],
  padding: theme.spacing(8),
  textAlign: "center",
}));
export const FullScreenTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(4),
}));
export const FullScreenMessage = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(6),
}));
export const FullScreenButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.background.paper,
  padding: theme.spacing(2.5, 6),
  borderRadius: theme.shape.borderRadii.small,
}));
export const SecondaryButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2.5, 6),
  borderRadius: theme.shape.borderRadii.small,
  "&:hover": {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
  },
}));
export const LogoContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const Logo = styled("img")(({ theme }) => ({
  width: "170px", // Adjust the logo size to fit well
  height: "auto",
  marginBottom: theme.spacing(8),

  [theme.breakpoints.down("sm")]: {
    width: "150px", // Adjust logo size for smaller screens
  },
}));

export const BrandRibbon = styled("div")`
  width: 100%;
  background-color: #ffbf00;
  color: #000;
  padding: 4px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  z-index: 10;
`;

export const SubtitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  color: "#666666",
  marginTop: theme.spacing(2.5),
}));

export const HeadingContainer = styled("div")(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(8),
}));

export const ForgotPasswordLink = styled(Link)(({ theme }) => ({
  marginTop: theme.spacing(4),
  color: theme.palette.primary.main,
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.sm,
  textDecoration: "underline",
}));

export const CaptchaContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(25),
  marginBottom: theme.spacing(5),
  display: "flex",
  justifyContent: "flex-start",
  marginLeft: "90px",
  minHeight: "65px",
  width: "100%",
}));
