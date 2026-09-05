import { Box, styled, Typography } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  minHeight: "150px",
  borderRadius: theme.spacing(2),
  flexDirection: "column",
  position: "relative",
  padding: theme.spacing(6, 5),
  justifyContent: "space-between",
  background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
  boxShadow: "0px 6px 100px 0px #0000001A",
  border: "1px solid rgba(15, 23, 42, 0.06)",
  overflow: "hidden",
  transition: "all 0.3s ease",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-20px)",
    boxShadow: "0px 6px 100px 0px #0000001A",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
}));

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const FooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
}));

export const LocationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  alignItems: "flex-start",
  color: theme.palette.text.linkColor,
}));

export const LocationImage = styled("img")(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  opacity: 0.8,
}));

export const MobileContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

export const HeaderTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.xll,
  lineHeight: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
}));

export const LocationTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: "#093F84",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  lineHeight: 1.4,
  wordBreak: "break-word",
  zIndex: 1,
  "&:hover": {
    textDecoration: "underline",
    cursor: "pointer",
  }
}));

export const MobileTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.tertiary,
}));

export const ActionButton = styled("button")(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: 10,
  background:"#093F84",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  cursor: "pointer",
  padding: 0,
  zIndex: 1,
}));

export const ActionIcon = styled("img")(({ theme }) => ({
  width: 18,
  height: 18,
}));
