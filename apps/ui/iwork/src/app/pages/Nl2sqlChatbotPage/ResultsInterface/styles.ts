import { Box, CircularProgress, Typography, styled } from "@mui/material";

export const ResultsContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  minHeight: 0, // This is crucial for flex scrolling
  maxHeight: "100%", // Ensure it doesn't exceed parent height

  // Custom scrollbar styling for webkit browsers (Chrome, Safari, Edge)
  "&::-webkit-scrollbar": {
    width: "3px",
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: "2px",
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    "&:active": {
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
  },

  // Custom scrollbar for Firefox
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0, 0, 0, 0.3) transparent",

  // For older Edge and IE
  "&": {
    msOverflowStyle: "scrollbar",
  },
})) as typeof Box;

export const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  marginBottom: theme.spacing(1),
  padding: `0 ${theme.spacing(1)}`,
})) as typeof Box;

export const LoadingContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5),
})) as typeof Box;

export const LoadingSpinner = styled(CircularProgress)(() => ({
  width: 10,
  height: 10,
})) as typeof CircularProgress;

export const LoadingText = styled(Typography)(() => ({
  variant: "body2",
  color: "#666666",
})) as typeof Typography;
