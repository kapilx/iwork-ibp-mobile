import { Box, styled } from "@mui/material";

export const SlotCounterFadeWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "inline-block",
  overflow: "hidden",
  height: 65, // adjust as needed for your digit size
  width: "auto",
  // Fade effect using mask-image for modern browsers
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%)",
  maskImage:
    "linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%)",
}));