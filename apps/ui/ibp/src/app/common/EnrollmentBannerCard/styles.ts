import { Box, Button, Typography } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

const PERIMETER = 4000;

const borderRun = keyframes`
  from {
    stroke-dashoffset: ${PERIMETER};
  }
  to {
    stroke-dashoffset: 0;
  }
`;

export const EnrollmentBannerCardWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "1920px",
  margin: "0 auto",
  position: "relative",
  [theme.breakpoints.up("xl")]: {
    maxWidth: "1600px",
    padding: theme.spacing(4, 6),
  },
}));

export const BorderAnimationSvg = styled("svg")({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  zIndex: 4, // Changed from 1 to 4 to make border visible

  "& *": {
    pointerEvents: "none",
  },
  "& rect": {
    fill: "none",
    stroke: "#000",
    strokeWidth: 5,
    strokeDasharray: `80 ${PERIMETER}`,
    strokeDashoffset: PERIMETER,
    animation: `${borderRun} 4s linear infinite`,
    filter: "drop-shadow(0 0 8px rgba(0, 0, 0, 0.6))",
    strokeLinecap: "round",
  },
});

export const EnrollmentBannerContentBanner = styled(Box, {
  shouldForwardProp: (prop) => prop !== "background",
})<{ background: string, border?: string }>(({ theme, background, border }) => ({
  borderRadius: "12px",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(3),
  padding: theme.spacing(11, 7.5, 11, 10),
  background,
  boxShadow: theme.shadows[10],
  position: "relative",
  zIndex: 2,
  border: border ? `1px solid ${border}` : "none",
  [theme.breakpoints.between("sm", "lg")]: {
    padding: theme.spacing(6, 4),
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(4, 3),
    gap: theme.spacing(2),
  },
  // 360–768px: stack button below text
  "@media (max-width: 768px)": {
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

export const EnrollmentBannerText = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.75),
  color: theme.palette.text.secondary,
}));

export const EnrollmentBannerHeader = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.semiBold,
  [theme.breakpoints.between("sm", "lg")]: {
    fontSize: theme.typography.fontSizes.xl,
  },
  [theme.breakpoints.down("sm")]: {
    fontSize: theme.typography.fontSizes.lg,
  },
}));

export const EnrollmentBannerSubheader = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  opacity: 0.85,
}));

export const EnrollmentBannerButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  color: theme.palette.neutral.dark,
  borderRadius: "4px",
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.medium,
  padding: theme.spacing(2.5, 5),
  flexShrink: 0,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2, 3),
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(2, 3),
  },
}));
