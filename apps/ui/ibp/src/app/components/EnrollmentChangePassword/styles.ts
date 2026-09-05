import {
  Box,
  styled,
  Typography,
  keyframes,
  TextField,
  Button,
  IconButton,
} from "@mui/material";

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
  maxHeight: "90vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  position: "relative",
  [theme.breakpoints.down("sm")]: {
    width: "95%",
    maxHeight: "95vh",
  },
}));

export const BlueHeader = styled(Box)(({ theme }) => ({
  height: "109px",
  position: "relative",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: theme.palette.background.DarkBlue,
  flexShrink: 0,
  [theme.breakpoints.down("sm")]: {
    height: "80px",
  },
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
  backgroundColor: "white",
  position: "relative",
  flex: 1,
  overflowY: "auto",
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(12),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(6),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(4, 3),
    gap: theme.spacing(2),
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.medium,
  lineHeight: "28px",
  letterSpacing: "0px",
  color: theme.palette.text.secondary,
}));

export const Description = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "24px",
  color: theme.palette.text.mediumGrey,
  letterSpacing: "0px",
  marginBottom: theme.spacing(7.25),
  [theme.breakpoints.down("sm")]: {
    marginBottom: theme.spacing(2),
  },
}));

export const OptionsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  width: "100%",
  marginBottom: theme.spacing(3),
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

export const FieldLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
  marginBottom: theme.spacing(1),
  "& span": {
    color: theme.palette.text.error,
  },
}));

export const PasswordField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    "& fieldset": {
      borderColor: theme.palette.neutral.light,
    },
    "&:hover fieldset": {
      borderColor: theme.palette.neutral.lightMedium,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.text.lightGradientBlue,
    },
  },
  "& .MuiInputBase-input": {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.palette.text.LightDark,
    padding: theme.spacing(2.5, 0, 2.5, 3.5),
    "&::placeholder": {
      color: theme.palette.neutral.lightMedium,
      opacity: 1,
    },
  },
}));

export const ValidationText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.lightOrange,
  background: theme.palette.background.azurBlue,
  padding: theme.spacing(3.75, 0, 3.75, 5),
  borderRadius: theme.spacing(1),
  marginTop: theme.spacing(0.5),
}));

export const VisibilityIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  "& svg": {
    color: theme.palette.text.azurBlue,
    fontSize: theme.typography.fontSizes.xl,
  },
  "&:hover": {
    backgroundColor: "rgba(61, 158, 240, 0.08)",
  },
}));
export const ValidationSpanText = styled("span")(({ theme }) => ({
  color: theme.palette.text.tertiary,
}));

export const ValidationRequirementItem = styled("span")<{ $failing?: boolean }>(
  ({ theme, $failing }) => ({
    color: $failing ? theme.palette.text.error : theme.palette.text.tertiary,
    fontWeight: $failing
      ? theme.typography.fontWeights.semiBold
      : theme.typography.fontWeights.regular,
    transition: "color 0.2s",
  })
);
export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

export const CancelButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.25, 4),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.background.DarkBlue,
  border: `1px solid ${theme.palette.background.DarkBlue}`,
  borderRadius: theme.spacing(3),
  textTransform: "none",
  minWidth: "120px",
  "&:hover": {
    backgroundColor: theme.palette.button.secondaryHover,
    border: `1px solid ${theme.palette.button.secondary}`,
  },
}));

export const UpdateButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.25, 10),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.secondary,
  background: theme.palette.background.DarkBlue,
  borderRadius: theme.spacing(3),
  textTransform: "none",
  minWidth: "120px",
  "&:hover": {
    background: theme.palette.background.DarkBlue,
    opacity: 0.9,
  },
}));
