// styles.ts
import { Box, Typography, Link } from "@mui/material";
import { styled } from "@mui/system";

// Styled Components
export const Container = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: `${theme.spacing(5)} ${theme.spacing(6)}`,
  backgroundColor: "#cde1f8ff",
  borderRadius: theme.shape.borderRadius,
  position: "relative",
}));

export const Heading = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.primary,
}));

export const Grid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),

  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
}));

export const KPIItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  zIndex: 1,
}));

export const Value = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.primary.main,
}));

export const Label = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.primary.main,
}));

export const InfoText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(3),
}));

export const CustomDivider = styled(Box)(({ theme }) => ({
  height: "1px",
  backgroundColor: theme.palette.divider,
  width: "calc(100% - 280px)",
}));

export const Footer = styled(Box)(({ theme }) => ({
  // display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(3),
  display: "none",
}));

export const FooterLinks = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(4),
}));

export const FooterLinkStyled = styled(Link)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  textDecoration: "none",
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.secondary.selected,
  cursor: "pointer",
}));

export const HeadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const ContainerBackgroundImage = styled("img")(({ theme }) => ({
  width: "300px",
  height: "auto",
  borderRadius: theme.shape.borderRadius,
  position: "absolute",
  right: "0",
  bottom: "0",
  pointerEvents: "none",
}));