import { Box, styled, Typography, keyframes } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 9999,
}));

export const ModalContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  width: "90%",
  maxWidth: "760px",
  maxHeight: "80vh",
  overflow: "hidden",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  position: "relative",
}));

export const BlueHeader = styled(Box)(({ theme }) => ({
  height: "109px",
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(100.91deg, #1F79D4 21.94%, #3EA0F1 71.2%)",
}));

const swingAnimation = keyframes`
  0% {
    transform: rotate(-15deg);
  }
  50% {
    transform: rotate(40deg);
  }
  100% {
    transform: rotate(-15deg);
  }
`;

export const HeaderImage = styled("img")(({ theme }) => ({
  width: "76px",
  height: "109px",
  position: "absolute",
  top: "4%",
  left: theme.spacing(10),
  objectFit: "cover",
  transformOrigin: "bottom center",
  animation: `${swingAnimation} 1.5s ease-in-out infinite`,
}));

export const CloseButton = styled("button")(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(4),
  right: theme.spacing(5),
  backgroundColor: "transparent",
  border: "none",
  color: theme.palette.text.secondary,
  fontSize: theme.typography.fontSizes.xxl,
  cursor: "pointer",
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  zIndex: 2,
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
}));

export const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  position: "relative",
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(7.5, 16, 10, 16),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  "@media (max-width: 768px)": {
    padding: theme.spacing(5, 8, 6, 8),
  },
  "@media (max-width: 480px)": {
    padding: theme.spacing(4, 3, 5, 3),
  },
  "@media (max-width: 420px)": {
    padding: theme.spacing(3, 2, 4, 2),
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  lineHeight: "28px",
  letterSpacing: "0px",
  color: theme.palette.text.secondary,
  paddingLeft: theme.spacing(12),
  "@media (max-width: 480px)": {
    fontSize: "15px",
    paddingLeft: theme.spacing(10),
  },
  "@media (max-width: 420px)": {
    fontSize: "13px",
    paddingLeft: theme.spacing(8),
  },
}));

export const Description = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "24px",
  color: theme.palette.text.mediumGrey,
  letterSpacing: "0px",
  marginBottom: theme.spacing(7.25),
  "@media (max-width: 480px)": {
    marginBottom: theme.spacing(3),
    fontSize: "14px",
  },
  "@media (max-width: 420px)": {
    marginBottom: theme.spacing(2),
    fontSize: "13px",
    textAlign: "center",
  },
}));

export const TitleSpan = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  letterSpacing: "0px",
}));

export const AlternateAuthLink = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.lightGradientBlue,
  cursor: "pointer",
  textAlign: "center",
  width: "100%",
  marginTop: theme.spacing(4.5),
  marginBottom: theme.spacing(5.5),
  "@media (max-width: 480px)": {
    fontSize: "14px",
    marginTop: theme.spacing(2.5),
    marginBottom: theme.spacing(3),
  },
  "@media (max-width: 420px)": {
    fontSize: "13px",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2.5),
  },
}));

export const OtpInputContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  justifyContent: "center",
  marginBottom: theme.spacing(4.5),
  "@media (max-width: 480px)": {
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(3),
  },
  "@media (max-width: 420px)": {
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
}));

export const OtpInput = styled("input")(({ theme }) => ({
  width: "48px",
  height: "56px",
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.medium,
  textAlign: "center",
  border: "none",
  borderBottom: `2px solid ${theme.palette.neutral.light}`,
  borderRadius: "0",
  outline: "none",
  transition: "all 0.2s ease",
  backgroundColor: "transparent",
  color: theme.palette.text.primary,
  paddingBottom: theme.spacing(1),

  "&:not(:placeholder-shown)": {
    borderBottomColor: theme.palette.text.lightGradientBlue,
  },

  "&::placeholder": {
    color: theme.palette.neutral.light,
  },

  "@media (max-width: 480px)": {
    width: "42px",
    height: "50px",
    fontSize: "20px",
  },
  "@media (max-width: 420px)": {
    width: "36px",
    height: "44px",
    fontSize: "18px",
  },
  "@media (max-width: 360px)": {
    width: "32px",
    height: "40px",
    fontSize: "16px",
  },
}));
