import { Box, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const FOOTER_GRADIENT = "linear-gradient(90deg, #2F64A9 0%, #144584 100%)";

export const FooterContainer = styled("footer")(() => ({
  width: "100%",
  borderTop: "2px solid transparent",
  borderBottom: "2px solid transparent",
  borderImage: `${FOOTER_GRADIENT} 1`,
  boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.08)",
  marginTop: "auto",
}));

export const FooterInner = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "stretch",
  width: "100%",
  [theme.breakpoints.down(768)]: {
    flexDirection: "column",
  },
}));

export const LogoSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2, 6),
  [theme.breakpoints.down(768)]: {
    justifyContent: "flex-start",
    padding: theme.spacing(1.5, 3),
  },
}));

export const SectionDivider = styled(Box)(({ theme }) => ({
  width: "1px",
  flexShrink: 0,
  backgroundColor: "rgba(0, 0, 0, 0.12)",
  [theme.breakpoints.down(768)]: {
    width: "100%",
    height: "1px",
  },
}));

export const ContentSection = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(4),
  background: FOOTER_GRADIENT,
  padding: theme.spacing(2.5, 8),
  [theme.breakpoints.down(768)]: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: theme.spacing(2.5, 4),
    gap: theme.spacing(2),
  },
}));

export const FooterTextStack = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: theme.spacing(0.75),
  [theme.breakpoints.down(768)]: {
    alignItems: "flex-start",
    textAlign: "left",
  },
}));

export const FooterLinks = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "4px",
  flexShrink: 0,
}));

export const IndiaImage = styled("img")(() => ({
  height: "clamp(56px, 6vw, 84px)",
  width: "auto",
}));

export const FooterText = styled(Typography)(() => ({
  fontSize: "15px",
  lineHeight: 1.5,
  color: "#FFFFFF",
}));

export const FooterCompanyName = styled(Typography)(({ theme }) => ({
  fontSize: "15px",
  lineHeight: 1.5,
  fontWeight: theme.typography.fontWeights.bold,
  color: "#FFFFFF",
}));

export const FooterSubText = styled(Typography)(({ theme }) => ({
  fontSize: "15px",
  lineHeight: 1.5,
  textAlign: "center",
  color: "rgba(255, 255, 255, 0.85)",
  [theme.breakpoints.down(768)]: {
    textAlign: "left",
  },
}));

export const FooterLink = styled(Link)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: theme.typography.fontWeights.bold,
  color: "#FFC83D",
  cursor: "pointer",
  textDecoration: "underline",
  textDecorationThickness: "2px",
  textUnderlineOffset: "3px",
  whiteSpace: "nowrap",
  "&:hover": {
    textDecoration: "underline",
    color: "#FFD970",
  },
}));

export const FooterCopyright = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
  textAlign: "right",
  [theme.breakpoints.between("sm", "md")]: {
    textAlign: "left",
  },
  [theme.breakpoints.down("sm")]: {
    textAlign: "left",
  },
}));
