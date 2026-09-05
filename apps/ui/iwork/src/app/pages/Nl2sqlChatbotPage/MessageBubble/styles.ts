import { Box, Typography, IconButton, styled } from "@mui/material";

export const MessageBubbleContainer = styled(Box)<{ type: "user" | "system" }>(
  ({ theme, type }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: type === "user" ? "flex-end" : "flex-start",
    marginBottom: theme.spacing(2),
    padding: `0 ${theme.spacing(2)}`,
  })
);

export const BubbleWrapper = styled(Box)<{ type: "user" | "system" }>(
  ({ theme, type }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: type === "user" ? "flex-end" : "flex-start",
    width: type === "user" ? "75%" : "80%",
    gap: theme.spacing(0.75),
  })
);

export const TimestampFeedbackWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(2),
  paddingLeft: theme.spacing(1),
  paddingTop: theme.spacing(1),
}));

export const UserBubble = styled(Box)<{
  messageType?: "text" | "table" | "barChart" | "pieChart" | "error";
}>(({ theme }) => ({
  maxWidth: "100%",
  background: "linear-gradient(135deg, #FFCA5F 0%, #FFF8DD 100%)",
  color: "#825905",
  borderRadius: "18px 18px 6px 18px",
  padding: theme.spacing(1, 5.5),
  boxShadow:
    "0 4px 12px rgba(255, 202, 95, 0.25), 0 2px 6px rgba(255, 202, 95, 0.15)",
  position: "relative",
  border: "1px solid rgba(130, 89, 5, 0.2)",
  marginBottom: theme.spacing(1),
}));

export const SystemBubble = styled(Box)<{
  messageType?: "text" | "table" | "barChart" | "pieChart" | "error";
}>(({ theme, messageType }) => {
  const isVisualizationType =
    messageType === "table" ||
    messageType === "barChart" ||
    messageType === "pieChart";

  return {
    width: isVisualizationType ? "100%" : "auto",
    maxWidth: isVisualizationType ? "none" : "100%",
    background: "linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)",
    color: "#2d3748",
    borderRadius: "20px 20px 20px 6px",
    padding: theme.spacing(2.5, 3),
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)",
    border: "1px solid rgba(102, 126, 234, 0.1)",
    position: "relative",
    overflow: "hidden",
  };
});

export const ErrorBubble = styled(Box)<{
  messageType?: "text" | "table" | "barChart" | "pieChart" | "error";
}>(({ theme }) => ({
  maxWidth: "100%",
  background: "linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fee2e2 100%)",
  color: "#991b1b",
  borderRadius: "20px 20px 20px 6px",
  padding: theme.spacing(2.5, 3),
  boxShadow:
    "0 4px 12px rgba(185, 28, 28, 0.1), 0 2px 6px rgba(185, 28, 28, 0.06)",
  border: "1px solid rgba(185, 28, 28, 0.15)",
  position: "relative",
}));

export const MessageText = styled(Typography)(({ theme }) => ({
  fontSize: "15px",
  lineHeight: 1.6,
  wordWrap: "break-word",
  whiteSpace: "pre-wrap",
  fontWeight: 400,
  letterSpacing: "0.01em",
})) as typeof Typography;

export const MessageTable = styled(Box)(({ theme }) => ({
  width: "100%",
  overflow: "hidden",
  margin: theme.spacing(1, 0),
  "& .MuiTableContainer-root": {
    borderRadius: theme.shape.borderRadius,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #E8F4FD",
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    minWidth: 0,
    scrollBehavior: "smooth",
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: "20px",
      background:
        "linear-gradient(to left, rgba(255,255,255,0.8), transparent)",
      pointerEvents: "none",
      zIndex: 1,
    },
  },
  "& .MuiTable-root": {
    width: "max-content",
    minWidth: "600px",
  },
  "& .MuiTableCell-root": {
    fontSize: "13px",
    padding: theme.spacing(1.25),
    borderColor: "#E8F4FD",
    color: "#2C3E50",
    whiteSpace: "nowrap",
    minWidth: "150px",
    maxWidth: "400px",
    overflow: "visible",
    wordBreak: "break-word",
    "&:hover": {
      backgroundColor: "rgba(30, 136, 229, 0.04)",
    },
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    fontSize: "12px",
    fontWeight: 600,
    color: "#1E88E5",
    backgroundColor: "#F3F7FF",
    position: "sticky",
    top: 0,
    zIndex: 1,
    whiteSpace: "nowrap",
    overflow: "visible",
    textOverflow: "unset",
    minWidth: "150px",
    maxWidth: "none",
    width: "auto",
  },
  "& .MuiTableContainer-root::-webkit-scrollbar": {
    height: "10px",
  },
  "& .MuiTableContainer-root::-webkit-scrollbar-track": {
    backgroundColor: "#f1f1f1",
    borderRadius: "5px",
    margin: "0 4px",
  },
  "& .MuiTableContainer-root::-webkit-scrollbar-thumb": {
    backgroundColor: "#1E88E5",
    borderRadius: "5px",
    "&:hover": {
      backgroundColor: "#1565C0",
    },
  },
  "& > div": {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0, // Allow shrinking
  },
  // Fix ag-grid header text overflow issues
  "& .ag-header-cell-text": {
    overflow: "visible !important",
    textOverflow: "unset !important",
    whiteSpace: "nowrap !important",
    width: "auto !important",
  },
  "& .ag-header-cell": {
    overflow: "visible !important",
    minWidth: "150px !important",
    maxWidth: "none !important",
  },
  "& .ag-header-cell-label": {
    overflow: "visible !important",
    textOverflow: "unset !important",
    whiteSpace: "nowrap !important",
  },
  "& .no-text-overflow": {
    overflow: "visible !important",
    textOverflow: "unset !important",
    whiteSpace: "nowrap !important",
  },
  "& th": {
    overflow: "visible !important",
    textOverflow: "unset !important",
    whiteSpace: "nowrap !important",
    minWidth: "150px !important",
  },
  "& .MuiTableCell-head": {
    overflow: "visible !important",
    textOverflow: "unset !important",
    whiteSpace: "nowrap !important",
  },
}));

export const MessageError = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  "& .MuiTypography-root": {
    color: "#991b1b",
    fontSize: "15px",
    fontWeight: 500,
    flex: 1,
    lineHeight: 1.5,
    letterSpacing: "0.01em",
    marginTop: "2px", // Align text with icon
  },
}));

export const ErrorIconContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#dc2626",
  marginTop: "2px",
  flexShrink: 0,
  backgroundColor: "rgba(220, 38, 38, 0.1)",
  borderRadius: "50%",
  width: "24px",
  height: "24px",
  "& .MuiSvgIcon-root": {
    fontSize: "16px",
  },
}));

export const MessageChart = styled(Box)(({ theme }) => ({
  minWidth: "60%",
  "& .MuiTypography-root": {
    fontSize: "13px",
    color: "#666666",
  },
}));

export const ChartLabel = styled(Typography)(({ theme }) => ({
  fontSize: "13px",
  color: "#666666",
  marginBottom: theme.spacing(1),
}));

export const ChartPlaceholder = styled(Box)(({ theme }) => ({
  height: 200,
  background: "linear-gradient(135deg, #F8F9FA 0%, #F5F3EE 100%)",
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px dashed #E8F4FD",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
}));

export const Timestamp = styled(Typography)<{ type: "user" | "system" }>(
  ({ theme, type }) => ({
    fontSize: "11px",
    color: type === "user" ? "rgba(130, 89, 5, 0.65)" : "#9ca3af",
    paddingLeft: type === "user" ? theme.spacing(1) : 0,
    paddingRight: theme.spacing(1),
    textAlign: type === "user" ? "right" : "left",
    fontWeight: 500,
    letterSpacing: "0.02em",
  })
);

export const SummaryText = styled(MessageText)<{ type: "user" | "system" }>(
  ({ theme, type }) => ({
    fontWeight: 400,
    marginBottom: type === "system" ? theme.spacing(2) : 0,
    padding: theme.spacing(2, 2, 2.5),
  })
);

// Additional styles for chart and table integration
export const ChartContainer = styled(Box)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  "& > div": {
    borderRadius: theme.shape.borderRadius,
  },
}));

export const TableContainer = styled(Box)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  "& > div": {
    borderRadius: theme.shape.borderRadius,
  },
}));

// Feedback component styles
export const FeedbackContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: theme.spacing(1),
}));

export const FeedbackButton = styled(IconButton)<{
  isActive: boolean;
  feedbackType: "positive" | "negative";
}>(({ theme, isActive, feedbackType }) => ({
  padding: theme.spacing(0.5),
  minWidth: "auto",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  transition: "all 0.2s ease-in-out",
  backgroundColor: isActive
    ? feedbackType === "positive"
      ? "rgba(76, 175, 80, 0.1)"
      : "rgba(244, 67, 54, 0.1)"
    : "transparent",
  border: isActive
    ? `1px solid ${
        feedbackType === "positive"
          ? "rgba(76, 175, 80, 0.3)"
          : "rgba(244, 67, 54, 0.3)"
      }`
    : "1px solid rgba(0, 0, 0, 0.1)",
  "&:hover": {
    backgroundColor: isActive
      ? feedbackType === "positive"
        ? "rgba(76, 175, 80, 0.15)"
        : "rgba(244, 67, 54, 0.15)"
      : "rgba(0, 0, 0, 0.05)",
    transform: "scale(1.05)",
  },
  "& .MuiSvgIcon-root": {
    fontSize: "16px",
    color: isActive
      ? feedbackType === "positive"
        ? "#4CAF50"
        : "#F44336"
      : "#666666",
  },
}));

// Error message for chart rendering failures
export const ChartErrorMessage = styled(Box)(({ theme }) => ({
  color: "#f56565",
  fontSize: "14px",
  marginTop: "8px",
}));

// Row for favourite icon and content
export const FavouriteRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  width: "100%",
}));

export const FavouriteIconWrapper = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  marginRight: 8,
  cursor: "pointer",
}));