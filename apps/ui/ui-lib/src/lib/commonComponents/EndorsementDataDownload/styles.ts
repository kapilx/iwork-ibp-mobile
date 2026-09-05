import { Box, styled } from "@mui/material";

export const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
}));

export const IconWrapper = styled("img")<{enableDownloadIcon: boolean}>(({ theme, enableDownloadIcon }) => ({
  width: "24px",
  height: "24px",
  marginRight: theme.spacing(4),
  opacity: enableDownloadIcon ? 1 : 0.3,
  cursor: enableDownloadIcon ? "pointer" : "not-allowed",
  pointerEvents: enableDownloadIcon ? "auto" : "none",
}));
