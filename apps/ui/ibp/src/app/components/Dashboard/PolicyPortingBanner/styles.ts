import { Box, Button, Typography, styled, keyframes } from "@mui/material";
import { fluidCtaHover } from "../bannerCtaHover";

/**
 * POLICY PORTING / CLUB EVEXIA BANNER — mirrors the Wellness banner layout
 * (illustration left, text block + CTA side by side on the right) but in the
 * illustration's cream + indigo palette. Stacks vertically on mobile.
 */

const floatIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(1.01); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const ambientFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
`;

export const PortingBannerWrapper = styled(Box)(() => ({
  width: "100%",
}));

export const PortingCard = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "stretch",
  width: "100%",
  height: 200,
  borderRadius: theme.spacing(4),
  overflow: "hidden",
  border: "1px solid #E7DEEA",
  background: "#FCF6F1", // matches the illustration's cream background
  "@media (max-width: 768px)": {
    flexDirection: "column",
    height: "auto",
  },
}));

// left column — width tuned to the illustration's content, clipping the empty
// cream / wave tail so the text sits right beside the figures
export const PortingImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  flex: "0 0 340px",
  maxWidth: "340px",
  height: "60%",
  overflow: "hidden",
  [theme.breakpoints.down("md")]: {
    flex: "0 0 280px",
    maxWidth: "280px",
  },
  "@media (max-width: 768px)": {
    flex: "1 1 auto",
    maxWidth: "100%",
    width: "100%",
    height: "auto",
  },
}));

export const PortingImage = styled("img")(() => ({
  position: "absolute",
  height: "150%",
  top: "-25%", // vertically centre the over-height image
  left: "2%",
  width: "auto",
  animation: `${floatIn} .8s ease-out both, ${ambientFloat} 7s ease-in-out 1s infinite`,
  "@media (max-width: 768px)": {
    position: "static",
    width: "100%",
    height: "auto",
    top: "auto",
    left: "auto",
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
}));

// soft indigo gradient tint over the illustration, fading out toward the content
export const PortingOverlay = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  zIndex: 1,
  pointerEvents: "none",
  background:
    "linear-gradient(105deg, rgba(61,59,110,0.16) 0%, rgba(61,59,110,0.07) 45%, rgba(252,246,241,0) 80%)",
  "@media (max-width: 768px)": {
    display: "none",
  },
}));

export const PortingContent = styled(Box)(({ theme }) => ({
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(4),
  padding: theme.spacing(0, 8, 0, 4),
  zIndex: 2,
  [theme.breakpoints.down("lg")]: {
    padding: theme.spacing(0, 5, 0, 3),
    gap: theme.spacing(3),
  },
  "@media (max-width: 768px)": {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(3),
    padding: theme.spacing(4),
  },
}));

export const PortingText = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  textAlign: "left",
  minWidth: 0,
}));

export const PortingTitle = styled(Typography)(({ theme }) => ({
  fontSize: "22px",
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#34315E",
  paddingBottom: theme.spacing(1.5),
}));

export const PortingDescription = styled(Typography)(({ theme }) => ({
  // never below 15px — keep `md` (16px) on every breakpoint
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "22px",
  color: "#5E5C7E",
}));

export const PortingButton = styled(Button)(({ theme }) => ({
  flexShrink: 0,
  textTransform: "none",
  padding: theme.spacing(1.5, 3),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  background: "#3D3B6E",
  color: "#FFFFFF",
  border: "1px solid #3D3B6E",
  borderRadius: theme.spacing(2),
  width: "max-content",
  ...fluidCtaHover({ hover: "#4D4A87", glow: "rgba(61,59,110,.55)" }),
}));
