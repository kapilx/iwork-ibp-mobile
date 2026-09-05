import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import { Button } from "@ui/ui-lib";

export const PasswordResetStyledContainer = styled("div")(({ theme }) => ({
  display: "flex",
  backgroundColor: theme.palette.neutral.veryLight,
  // paddingTop: theme.spacing(10),
  // paddingLeft: theme.spacing(1),
  width: "100%",
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
}));
export const TitleContainer = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.primary.main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const PasswordResetStyledButton = styled(Button, {
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
  marginTop: theme.spacing(5),
  transition: "background 0.2s, color 0.2s, cursor 0.2s",
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground || "#e0e0e0",
    color: theme.palette.action.disabled || "#bdbdbd",
    cursor: "not-allowed",
  },
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

export const CaptchaContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(5),
  marginBottom: theme.spacing(5),
  display: "flex", 
  justifyContent: "flex-start",
  marginLeft: "90px",
  minHeight: "65px",
  width: "100%", 
}));