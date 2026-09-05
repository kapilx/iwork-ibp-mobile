import { Box, Typography, styled, IconButton } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";

export const PageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 55px)",
  width: "calc(100% - 100px)",
  margin: "0 auto",
  padding: theme.spacing(0, 4),
  gap: theme.spacing(2),
})) as typeof Box;

export const SummaryContainer = styled(Typography)(({ theme }) => ({
  color: "#666666",
})) as typeof Typography;

export const PageTitle = styled(Typography)(({ theme }) => ({
  textAlign: "center",
  fontSize: "21px",
  borderRadius: theme.spacing(1),
  color: "#334155",
  position: "relative",
  flex: 1,
})) as typeof Typography;

export const ResultsSection = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: "hidden",
  marginBottom: theme.spacing(2),
  minHeight: 0,
})) as typeof Box;

export const InputSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
})) as typeof Box;

export const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  position: "relative",
  padding: theme.spacing(3, 0, 3, 0),
  borderBottom: "1px solid #e2e8f0",
})) as typeof Box;

export const TooltipWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "disabled",
})<{ disabled?: boolean }>(({ disabled, theme }) => ({
  position: "absolute",
  right: theme.spacing(1),
  top: "50%",
  transform: "translateY(-50%)",
  display: "inline-flex",
  padding: theme.spacing(1),
})) as any;

export const ClearChatButton = styled(IconButton)(({ theme }) => ({
  color: "#64748b",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  padding: theme.spacing(1.2),
  borderRadius: "12px",
  background: "linear-gradient(145deg, #ffffff, #f8fafc)",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  "&:hover:not(:disabled)": {
    color: "#ef4444",
    background: "linear-gradient(145deg, #fef2f2, #fee2e2)",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
    transform: "scale(1.15) rotate(-5deg)",
  },
  "&:active:not(:disabled)": {
    transform: "scale(1.05)",
    boxShadow: "0 1px 2px rgba(239, 68, 68, 0.2)",
  },
  "&:disabled": {
    color: "#cbd5e1",
    background: "linear-gradient(145deg, #ffffff, #f8fafc)",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
    opacity: 1,
    cursor: "not-allowed",
  },
  "& .MuiSvgIcon-root": {
    fontSize: "1.5rem",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
  },
  "&:hover:not(:disabled) .MuiSvgIcon-root": {
    filter: "drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))",
  },
})) as typeof IconButton;

export const InputSectionWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  marginTop: theme.spacing(1),
})) as typeof Box;

export const RetryNotificationBox = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: "calc(100% + 12px)",
  left: 0,
  justifyContent: "center",
  width: "fit-content",
  maxWidth: "100%",
  backgroundColor: "#e3f2fd",
  border: "1px solid #90caf9",
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(2, 2.5),
  boxShadow: "0 4px 12px rgba(33, 150, 243, 0.15)",
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(1.5),
  animation: "slideDown 0.3s ease-out, fadeOut 0.3s ease-out 5.7s forwards",
  zIndex: 10,
  "@keyframes slideDown": {
    from: {
      opacity: 0,
      transform: "translateY(10px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
  "@keyframes fadeOut": {
    from: {
      opacity: 1,
    },
    to: {
      opacity: 0,
    },
  },
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: "-8px",
    left: "24px",
    width: 0,
    height: 0,
    borderLeft: "8px solid transparent",
    borderRight: "8px solid transparent",
    borderTop: "8px solid #90caf9",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    bottom: "-7px",
    left: "25px",
    width: 0,
    height: 0,
    borderLeft: "7px solid transparent",
    borderRight: "7px solid transparent",
    borderTop: "7px solid #e3f2fd",
  },
})) as typeof Box;

export const RetryInfoIcon = styled(InfoOutlined)(({ theme }) => ({
  color: "#1976d2",
  fontSize: "20px",
  marginTop: "1px",
  flexShrink: 0,
})) as any;

export const RetryNotificationContent = styled(Box)(() => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
})) as typeof Box;

export const RetryNotificationText = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  color: "#1565c0",
  fontWeight: 500,
  lineHeight: 1.5,
})) as typeof Typography;

export const RetryCloseButton = styled(IconButton)(({ theme }) => ({
  padding: "4px",
  color: "#1976d2",
  marginTop: "-3px",
  marginRight: "-8px",
  "&:hover": {
    backgroundColor: "rgba(25, 118, 210, 0.08)",
  },
})) as typeof IconButton;
