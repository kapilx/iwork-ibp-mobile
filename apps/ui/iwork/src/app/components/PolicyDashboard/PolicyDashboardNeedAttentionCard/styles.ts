// PolicyDashboardNeedAttentionCard.styles.ts
import { Box, Link, styled, Typography } from "@mui/material";

interface LeftContentContainerProps {
  hasData?: boolean;
}

export const CardWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasData",
})<LeftContentContainerProps>(({ theme, hasData }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  borderRadius: 4,
  background: `linear-gradient(132.28deg, #FFFFFF 26.19%, #EBEBEB 119.73%)`,
  padding:
    theme.spacing(3.5) +
    " " +
    theme.spacing(0) +
    " " +
    theme.spacing(3) +
    " " +
    theme.spacing(7.5),
  width: "49%",
  gap: hasData ? theme.spacing(4) : 0,
  height: hasData ? "auto" : "174px",
  boxShadow: `0px 2px 4px 0px ${theme.palette.neutral.dark}26`,
  "@media (max-width: 1099px)": {
    width: "100%",
  },
  // maxWidth: "608px",
}));

export const LeftContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const TitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
}));

export const AttentionRow = styled(Box)(({ theme, lastRow }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  fontSize: theme.typography.fontSizes.sm,
  paddingBottom: theme.spacing(2),
  borderBottom: lastRow
    ? 0
    : `0.5px solid ${theme.palette.neutral.grayishBlue}`,
}));

export const RightImage = styled(Box)(() => ({
  opacity: 1,
  img: {
    height: "150px",
  },
}));

export const StyledConfigureContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(4),
  alignItems: "center",
  justifyContent: "center",
}));

export const StyledConfigureTextContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  textAlign: "center",
  gap: theme.spacing(2),
}));

export const ConfigureText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  lineHeight: "20px",
  textAlign: "center",
}));

export const LeftContentContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasData",
})<LeftContentContainerProps>(({ theme, hasData }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: hasData ? "space-between" : "flex-end",
  width: "100%",
  gap: hasData ? theme.spacing(6) : theme.spacing(26),
}));

export const LinkActions = styled(Link)(({ theme, count }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  "&:hover": {
    textDecoration: "none",
  },
  cursor: count === 0 ? "not-allowed" : "pointer",
  color: theme.palette.button.secondary,
}));
