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
  backgroundColor: "white",
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
  background: "linear-gradient(100.91deg, #1B5092 0%, #266AB7 33%, #1675BC 66%, #197087 100%)",
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
  height:"109px",
  position: "absolute",
  top: "4%",
  left: "40px",
  objectFit: "cover",
  transformOrigin: "bottom center",
  animation: `${swingAnimation} 1.5s ease-in-out infinite`,
}));

export const CloseButton = styled("button")(({ theme }) => ({
  position: "absolute",
  top: "16px",
  right: "20px",
  backgroundColor: "transparent",
  border: "none",
  color: "white",
  fontSize: theme.typography.fontSizes.xxl,
  cursor: "pointer",
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadii.small,
  zIndex: 2,
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
}));

export const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: "white",
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
  fontSize: theme.typography.fontSizes.md,
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

export const OptionsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  width: "100%",
  marginBottom: theme.spacing(3),
  "@media (max-width: 420px)": {
    flexDirection: "column",
    gap: theme.spacing(2),
    alignItems: "stretch",
  },
}));

export const AlternateAuthLink = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.lightGradientBlue,
  cursor: "pointer",
  textAlign: "center",
  width: "100%",
  marginTop: theme.spacing(4.5),
  "&:hover": {
    textDecoration: "underline",
  },
}));
