import { Box, styled, Typography } from "@mui/material";
import BackGround from "../../assets/svgs/background-for-insurance-card.svg";

export const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'containerStyles',
})<{ containerStyles?: React.CSSProperties }>(
  ({ theme, containerStyles }) => ({
    display: "flex",
    width: "325px",
    minHeight: "325px",
    border: `1px solid ${theme.palette.border.main}`,
    borderRadius: theme.spacing(4),
    ...containerStyles,
    flexDirection: "column",
    padding: theme.spacing(6, 6, 3, 6),
    justifyContent: "space-between",
    boxShadow: theme.shadows[14],
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      background: `url(${BackGround}) no-repeat center center`,
      backgroundSize: "cover",
      opacity: 0.4,
      zIndex: 0,
    },
  })
);

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flexWrap: "wrap",
  gap: theme.spacing(8),
}));

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(10),
}));

export const FooterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
}));

export const ShieldContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(-4),
  right: theme.spacing(1),
  zIndex: 1,
}));

export const CommonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const HeaderTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isExpired',
})<{ isExpired: boolean }>(
  ({ theme, isExpired }) => ({
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeights.medium,
    fontSize: theme.typography.fontSizes.xl,
    color: isExpired
      ? theme.palette.text.StrokeGrey
      : theme.palette.text.ternary,
  })
);

export const CommonTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
}));

export const FooterTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.labelColor,
}));

export const CommonNumberTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
}));

export const FooterTypographyClaims = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
}));
