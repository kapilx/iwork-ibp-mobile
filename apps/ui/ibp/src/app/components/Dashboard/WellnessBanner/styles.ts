import { Box, Button, Typography, styled, keyframes } from "@mui/material";
import { fluidCtaHover } from "../bannerCtaHover";

/**
 * WELLNESS BANNER — illustrated banner styled after the Life Events banner.
 * Flex row: the illustration sits on the left, the content (text block + CTA
 * side by side) on the right. They are siblings, so they never overlap.
 * Stacks vertically on mobile.
 */

const floatIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(1.01); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const ambientFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
`;

// full-width within BenefitsSectionContainer so the banner's left/right edges
// line up with the Claim Summary card directly above it
export const WellnessBannerWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(6),
  [theme.breakpoints.down("sm")]: {
    marginTop: theme.spacing(4),
  },
}));

export const WellnessCard = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "stretch",
  width: "100%",
  height: 200,
  borderRadius: theme.spacing(4),
  overflow: "hidden",
  border: "1px solid #C2DBA0",
  background: "#DDEDC6", // matches the recolored illustration background exactly
  "@media (max-width: 768px)": {
    flexDirection: "column",
    height: "auto",
  },
}));

// left column — width tuned to the illustration's content (~380px), clipping
// the empty green / wave tail so the text sits right beside the figures
export const WellnessImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  flex: "0 0 380px",
  maxWidth: "380px",
  height: "100%",
  overflow: "hidden",
  [theme.breakpoints.down("md")]: {
    flex: "0 0 300px",
    maxWidth: "300px",
  },
  "@media (max-width: 768px)": {
    flex: "1 1 auto",
    maxWidth: "100%",
    width: "100%",
    height: "auto",
  },
}));

export const WellnessImage = styled("img")(() => ({
  // scaled up beyond the card height and anchored left; the box crops the
  // top/bottom slightly
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

// soft green gradient tint over the illustration, fading out toward the content
export const WellnessOverlay = styled(Box)(() => ({
  position: "absolute",
  inset: 0,
  zIndex: 1,
  pointerEvents: "none",
  background:
    "linear-gradient(105deg, rgba(74,110,40,0.32) 0%, rgba(126,166,84,0.16) 45%, rgba(221,237,198,0) 80%)",
  "@media (max-width: 768px)": {
    display: "none",
  },
}));

// right half — text block and CTA side by side, vertically centred
export const WellnessContent = styled(Box)(({ theme }) => ({
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

// title + description, stacked, left-aligned
export const WellnessText = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  textAlign: "left",
  minWidth: 0,
}));

export const WellnessTitle = styled(Typography)(({ theme }) => ({
  fontSize: "22px",
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#2E4D1F",
  paddingBottom: theme.spacing(1.5),
}));

export const WellnessDescription = styled(Typography)(({ theme }) => ({
  // never below 15px — keep `md` (16px) on every breakpoint
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  lineHeight: "22px",
  color: "#3F5D2C",
}));

export const WellnessButton = styled(Button)(({ theme }) => ({
  flexShrink: 0,
  textTransform: "none",
  padding: theme.spacing(1.5, 3),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  background: "#2E4D1F",
  color: "#FFFFFF",
  border: "1px solid #2E4D1F",
  borderRadius: theme.spacing(2),
  width: "max-content",
  ...fluidCtaHover({ hover: "#37601F", glow: "rgba(46,77,31,.5)" }),
}));
