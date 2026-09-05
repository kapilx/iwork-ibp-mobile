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
  maxWidth: "600px",
  maxHeight: "80vh",
  overflowX: "hidden",
  overflowY: "auto",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  position: "relative",
  "@media (max-width: 480px)": {
    width: "95%",
    maxHeight: "90vh",
  },
}));

const slideIn = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const HeaderImage = styled("img")(({ theme }) => ({
  width: "100%",
  position: "absolute",
  top: "20.5%",
  zIndex: 999,
  objectFit: "cover",
  animation: `${slideIn} 0.8s ease-out forwards`,
}));
export const BlueHeader = styled(Box)(({ theme }) => ({
  height: "184px",
  position: "relative",
  background: "linear-gradient(100.91deg, #1B5092 0%, #266AB7 33%, #1675BC 66%, #197087 100%)",
  "@media (max-width: 480px)": {
    height: "140px",
  },
  "@media (max-width: 420px)": {
    height: "120px",
  },
}));

export const CloseButton = styled("button")(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1),
  right: theme.spacing(3),
  backgroundColor: "transparent",
  border: "none",
  color: theme.palette.text.secondary,
  fontSize: theme.typography.fontSizes.xll,
  cursor: "pointer",
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
}));

export const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  position: "relative",
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(11, 4, 5, 4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: theme.spacing(2.5),
  "@media (max-width: 480px)": {
    padding: theme.spacing(6, 3, 4, 3),
    gap: theme.spacing(2),
  },
  "@media (max-width: 420px)": {
    padding: theme.spacing(4, 2, 3, 2),
    gap: theme.spacing(1.5),
  },
}));

export const Icon = styled("div")(({ theme }) => ({
  width: "80px",
  height: "80px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(1),
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xxl,
  fontWeight: theme.typography.fontWeights.medium,
  lineHeight: "30px",
  letterSpacing: "0px",
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(1),
  maxWidth: "500px",
  "@media (max-width: 768px)": {
    fontSize: "22px",
    lineHeight: "28px",
  },
  "@media (max-width: 480px)": {
    fontSize: "20px",
    lineHeight: "26px",
    marginBottom: theme.spacing(0.5),
  },
  "@media (max-width: 420px)": {
    fontSize: "18px",
    lineHeight: "24px",
  },
  "@media (max-width: 360px)": {
    fontSize: "16px",
    lineHeight: "22px",
  },
}));

export const Description = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "24px",
  color: theme.palette.text.tertiary,
  letterSpacing: "0px",
  marginBottom: theme.spacing(6),
  maxWidth: "480px",
  "@media (max-width: 480px)": {
    marginBottom: theme.spacing(3),
    fontSize: "14px",
    lineHeight: "22px",
  },
  "@media (max-width: 420px)": {
    marginBottom: theme.spacing(2),
    fontSize: "13px",
  },
}));

export const MetaInfo = styled(Title)(({ theme }) => ({
  // Exact same typography as the main title, per UI requirement.
  marginBottom: theme.spacing(2),
  maxWidth: "520px",
  wordBreak: "break-word",
  fontSize: theme.typography.fontSizes.xl,
  "@media (max-width: 480px)": {
    fontSize: "16px",
    marginBottom: theme.spacing(1),
  },
  "@media (max-width: 420px)": {
    fontSize: "14px",
  },
}));

export const ButtonWrapper = styled(Box)(({ theme }) => ({
  "& .MuiButton-root": {
    borderRadius: theme.spacing(6),
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    letterSpacing: "0px",
    color: theme.palette.primary.main,
    padding: theme.spacing(2.5, 6),
    textTransform: "none",
    "&:hover": {
      backgroundColor: theme.palette.background.covers,
    },
  },
  "@media (max-width: 480px)": {
    width: "100%",
    "& .MuiButton-root": {
      width: "100%",
      fontSize: "14px",
      padding: theme.spacing(2, 4),
    },
  },
  "@media (max-width: 420px)": {
    "& .MuiButton-root": {
      fontSize: "13px",
      padding: theme.spacing(1.5, 3),
    },
  },
}));
export const ConfirmationPageIcon = styled("img")(({ theme }) => ({
  width: "432px",
  maxWidth: "100%",
  marginBottom: theme.spacing(2.75),
  "@media (max-width: 480px)": {
    width: "85%",
    marginBottom: theme.spacing(1.5),
  },
  "@media (max-width: 420px)": {
    width: "80%",
    marginBottom: theme.spacing(1),
  },
}));
// Legacy styles (keeping for backwards compatibility)
export const TitleWrapper = styled(Box)(({ theme }) => ({
  maxWidth: 806,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(5),
  marginBottom: theme.spacing(13.75),
}));

export const FeaturesTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  marginBottom: theme.spacing(6.25),
}));

export const FeaturesGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, 270px)",
  gap: theme.spacing(7.5),
  marginBottom: theme.spacing(10),
  justifyContent: "center",
}));
export const RefId = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontStyle: "italic",
}));

export const FeatureCard = styled(Box)(({ theme }) => ({
  background: "linear-gradient(332.35deg, #FFBCC4 -0.87%, #FFD8BB 108.17%)",
  width: "270px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: theme.spacing(4),
  padding: theme.spacing(7.5, 2.25),
  color: theme.palette.text.primary,
  boxShadow: "0px 16px 24px 0px #FBE0D7",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  textAlign: "center",
}));
