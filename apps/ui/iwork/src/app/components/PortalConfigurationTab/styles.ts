import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { colors } from "@ui/ui-lib/styles/Theme/colors";

export const Container = styled(Box)(({ theme }) => ({
  margin: theme.spacing(2),
  minHeight: "350px",
}));

export const Heading = styled("h2")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));

export const CardsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  marginTop: theme.spacing(12),
  width: "100%",
  flexWrap: "wrap",
}));

export const Card = styled(Box)(({ theme }) => ({
  minWidth: "250px",
  minHeight: "250px",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  transition: "all 0.2s ease",
  padding: theme.spacing(4),
}));

export const CardIconTextContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  alignItems: "center",
  marginBottom: theme.spacing(4),
}));

export const CardTextContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const CardIcon = styled("img")(({ theme }) => ({
  width: "50px",
  height: "50px",
  flexShrink: 0,
  backgroundColor: colors.background.lightBlueActive,
  borderRadius: theme.spacing(2),
}));

export const CardTitle = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
  textAlign: "left",
}));

export const CardSubtitle = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.light,
  color: theme.palette.text.primary,
  textAlign: "left",
}));

export const CardButton = styled("button")<{
  backgroundColor?: string;
}>(({ theme, backgroundColor }) => ({
  padding: theme.spacing(2, 4),
  backgroundColor: backgroundColor || theme.palette.background.paper,
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  cursor: "pointer",
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.5, // Optional: add visual feedback
    backgroundColor: theme.palette.action.disabledBackground, // Optional
    color: theme.palette.action.disabled, // Optional
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2.5),
  justifyContent: "center",
  alignItems: "center",
  marginTop: theme.spacing(2),
}));

export const CardInfoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  minHeight: "65px",
}));

export const CardInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const CardInfoLabel = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.light,
  color: theme.palette.text.primary,
}));

export const CardInfoValue = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.primary,
}));
