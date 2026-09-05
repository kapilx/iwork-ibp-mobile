import { Box, Typography, styled } from "@mui/material";
import { alpha } from "@mui/material/styles";

export const NudgeCardContainer = styled(Box)(({ theme }) => ({
  boxSizing: "border-box",
  width: "359px",
  // minHeight: "118px",
  background: `linear-gradient(180deg, ${alpha(
    theme.palette.common.black,
    0
  )} 0%, ${alpha(theme.palette.common.black, 0.06)} 100%)`,
  boxShadow: `0px 4px 8px ${alpha(theme.palette.common.black, 0.04)}`,
  borderRadius: theme.spacing(3),
  cursor: "pointer",
  transition: "all 0.3s ease",
  position: "relative",
  border: "1px solid transparent",
  "&::after": {
    content: '""',
    position: "absolute",
    width: "359px",
    // minHeight: "116px",
    left: "1px",
    top: "1px",

    borderRadius: theme.spacing(3),
    pointerEvents: "none",
  },
  "&:hover": {
    boxShadow: `0px 6px 12px ${alpha(theme.palette.common.black, 0.08)}`,
    transform: "translateY(-2px)",
    border: `1px solid ${theme.palette.background.lightBlueActive}`,
  },
}));

export const NudgeCardContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  padding: theme.spacing(3.75, 1, 3.75, 3.75),
  gap: theme.spacing(2.5),
  width: "337px",
  position: "relative",
  zIndex: 1,
}));

export const IconWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  padding: 0,
  width: "28px",
  height: "28px",
  minWidth: "28px",
  minHeight: "28px",
  borderRadius: theme.spacing(2.5),
  flexShrink: 0,
  "& img": {
    width: "18px",
    height: "18px",
    display: "block",
  },
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: 0,
  gap: theme.spacing(1),
  maxWidth: "291px",
  flex: "1 1 auto",
  minWidth: 0,
}));

export const NudgeTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontStyle: "normal",
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.sm,
  lineHeight: theme.spacing(4.5),
  letterSpacing: "-0.150391px",
  color: theme.palette.text.darkNavy,
  alignSelf: "stretch",
  wordBreak: "break-word",
  whiteSpace: "normal",
}));

export const InsightText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontStyle: "normal",
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
  lineHeight: theme.spacing(5),
  color: theme.palette.text.mutedSlate,
  alignSelf: "stretch",
  wordBreak: "break-word",
  whiteSpace: "normal",
}));

export const ActionText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontStyle: "normal",
  fontWeight: theme.typography.fontWeights.bold,
  fontSize: theme.typography.fontSizes.xs,
  lineHeight: theme.spacing(5),
  color: theme.palette.text.darkNavy,
  alignSelf: "stretch",
  wordBreak: "break-word",
  whiteSpace: "normal",
}));
