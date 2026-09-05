import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const PageRoot = styled(Box)(() => ({
  minHeight: "100vh",
  backgroundColor: "#F0F4F9",
  padding: "16px 24px",
  marginTop: "72px",
  boxSizing: "border-box",
  "@media (max-width: 768px)": {
    padding: "12px 12px",
    marginTop: "60px",
  },
}));

export const BackRow = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginBottom: 24,
}));

export const BackTitle = styled(Typography)(() => ({
  fontSize: "1.125rem",
  fontWeight: 600,
  color: "#222222",
  lineHeight: 1.3,
}));

export const PanelLayout = styled(Box)(() => ({
  display: "flex",
  gap: 20,
  alignItems: "flex-start",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    gap: 16,
  },
}));

// ─── Left Panel ───────────────────────────────────────────────────────────────

export const PreviewPanel = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  border: "1px solid #E0E0E0",
  overflow: "hidden",
  "@media (max-width: 768px)": {
    order: 1,
    width: "100%",
  },
}));

export const PreviewPanelHeader = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  borderBottom: "1px solid #E8E8E8",
}));

export const PreviewPanelTitle = styled(Typography)(() => ({
  fontWeight: 700,
  fontSize: "1.125rem",
  color: "#222222",
}));

export const PreviewPanelActions = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 24,
}));

export const ActionButton = styled("button", {
  shouldForwardProp: (prop) => prop !== "$active",
})<{ $active?: boolean }>(({ $active = true }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "none",
  border: "none",
  cursor: $active ? "pointer" : "not-allowed",
  color: $active ? "#093F84" : "#BDBDBD",
  fontSize: "0.875rem",
  fontWeight: 500,
  padding: 0,
  "&:hover": {
    textDecoration: $active ? "underline" : "none",
  },
}));

export const PreviewContent = styled(Box)(() => ({
  padding: 20,
  minHeight: 480,
}));

export const PreviewEmpty = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: 400,
  color: "text.secondary",
}));

// ─── Right Panel ──────────────────────────────────────────────────────────────

export const PropertiesPanel = styled(Box)(() => ({
  width: 300,
  flexShrink: 0,
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  border: "1px solid #E0E0E0",
  padding: 24,
  "@media (max-width: 768px)": {
    order: 2,
    width: "100%",
    boxSizing: "border-box",
  },
}));

export const PropertiesTitle = styled(Typography)(() => ({
  fontWeight: 700,
  fontSize: "1.25rem",
  color: "#222222",
  marginBottom: 20,
}));

export const FileNameRow = styled(Box)(() => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 20,
}));

export const PropertyLabel = styled(Typography)(() => ({
  fontSize: "0.75rem",
  color: "#9E9E9E",
  marginBottom: 4,
}));

export const PropertyValue = styled(Typography)(() => ({
  fontSize: "0.9375rem",
  fontWeight: 600,
  color: "#222222",
  wordBreak: "break-word",
}));

export const FileNameValue = styled(Typography)(() => ({
  fontSize: "1rem",
  fontWeight: 700,
  color: "#222222",
  wordBreak: "break-word",
}));

export const PropertyRow = styled(Box)(() => ({
  marginBottom: 20,
}));
