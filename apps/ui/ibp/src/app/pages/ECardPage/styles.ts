import { Box, IconButton, Typography, Select, styled } from "@mui/material";

export const PageWrapper = styled(Box)(() => ({
  width: "100%",
  backgroundColor: "#F5F6F8",
  height: "100vh",
  paddingTop: "54px",
  boxSizing: "border-box",
  overflow: "hidden",
}));

export const PreviewCard = styled(Box)({
  width: "100%",
  height: "100%",
  margin: "0 auto",
  backgroundColor: "#EBF6FF",
  boxShadow: "0px 4px 20px rgba(18, 40, 76, 0.12)",
  border: "1px solid #E8E8E8",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const PreviewHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderBottom: "1px solid #E8E8E8",
  background: "#FFF",
}));

export const PreviewTitleGroup = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "4px",
});

export const PreviewTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: "24px",
  fontWeight: 600,
  [theme.breakpoints.up("md")]: {
    fontSize: "28px",
  },
}));

export const PreviewTitleEcards = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: "24px",
  fontWeight: 600,
  cursor: "pointer",
  [theme.breakpoints.up("md")]: {
    fontSize: "28px",
  },
}));

export const PreviewBody = styled(Box)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "row",
  overflow: "hidden",
  [theme.breakpoints.down(768)]: {
    flexDirection: "column",
    overflowY: "auto",
  },
}));

export const MemberPanel = styled(Box)(({ theme }) => ({
  width: "260px",
  minWidth: "260px",
  display: "flex",
  flexDirection: "column",
  background: "#FFFFFF",
  borderRight: "1px solid #E8E8E8",
  overflow: "hidden",
  [theme.breakpoints.down(768)]: {
    display: "none",
  },
}));

export const MobileSelectorsPanel = styled(Box)(({ theme }) => ({
  display: "none",
  [theme.breakpoints.down(768)]: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "12px",
    background: "#FFFFFF",
    borderBottom: "1px solid #E8E8E8",
    flexShrink: 0,
  },
}));

export const MobileSelectorRow = styled(Box)({
  display: "flex",
  flexDirection: "column",
});

export const MemberPanelHeader = styled(Typography)({
  fontSize: "13px",
  fontWeight: 600,
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: "16px 16px 10px",
  borderBottom: "1px solid #F0F0F0",
});

export const PolicySelectorWrapper = styled(Box)({
  padding: "10px 12px",
  borderBottom: "1px solid #F0F0F0",
});

export const PolicySelectorLabel = styled(Typography)({
  fontSize: "10px",
  fontWeight: 600,
  color: "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "4px",
});

export const PolicySelect = styled(Select)({
  width: "100%",
  fontSize: "13px",
  fontWeight: 500,
  color: "#1F2937",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#E5E7EB",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#093F84",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#093F84",
  },
  "& .MuiSelect-select": {
    padding: "6px 10px",
  },
});

export const SinglePolicyLabel = styled(Box)({
  padding: "10px 12px",
  borderBottom: "1px solid #F0F0F0",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const SinglePolicyLabelTitle = styled(Typography)({
  fontSize: "10px",
  fontWeight: 600,
  color: "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
});

export const SinglePolicyLabelValue = styled(Typography)({
  fontSize: "13px",
  fontWeight: 600,
  color: "#093F84",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const MemberTpaId = styled(Typography)({
  fontSize: "10px",
  fontWeight: 400,
  color: "#9CA3AF",
  lineHeight: "1.2",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const MemberList = styled(Box)({
  flex: 1,
  overflowY: "auto",
  padding: "8px 0",
});

export const MemberItem = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  cursor: "pointer",
  background: selected ? "#EBF4FF" : "transparent",
  borderLeft: selected ? "3px solid #093F84" : "3px solid transparent",
  transition: "background 0.15s",
  "&:hover": {
    background: selected ? "#EBF4FF" : "#F5F9FF",
    "& .ecard-download-btn": {
      opacity: 1,
    },
  },
  ...(selected && {
    "& .ecard-download-btn": {
      opacity: 1,
    },
  }),
}));

export const MemberRadio = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
  width: "18px",
  height: "18px",
  minWidth: "18px",
  borderRadius: "50%",
  border: selected ? "5px solid #093F84" : "2px solid #C4C4C4",
  background: "#FFF",
  boxSizing: "border-box",
  transition: "border 0.15s",
}));

export const MemberInfo = styled(Box)({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "1px",
  overflow: "hidden",
});

export const MemberName = styled(Typography)<{ selected?: boolean }>(({ selected }) => ({
  fontSize: "14px",
  fontWeight: selected ? 600 : 400,
  color: selected ? "#093F84" : "#1F2937",
  lineHeight: "1.3",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const MemberRelationRow = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

export const MemberRelationTag = styled(Typography)({
  fontSize: "11px",
  fontWeight: 500,
  color: "#6B7280",
  lineHeight: "1.2",
});

export const CardTypeLabel = styled(Typography)<{ cardtype: "family" | "individual" }>(
  ({ cardtype }) => ({
    fontSize: "10px",
    fontWeight: 600,
    lineHeight: "1",
    padding: "2px 5px",
    borderRadius: "4px",
    display: "inline-block",
    ...(cardtype === "family"
      ? { background: "#EBF4FF", color: "#1D6ABA" }
      : { background: "#F0FDF4", color: "#166534" }),
  })
);

export const PreviewPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  [theme.breakpoints.down(768)]: {
    minHeight: "480px",
  },
}));

export const CenteredState = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
});

export const DocumentPreviewWrapper = styled(Box)({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const BackArrowButton = styled(IconButton)({
  color: "#093F84",
  padding: 0,
  "&:hover": {
    backgroundColor: "transparent",
  },
});

export const PlaceholderContainer = styled(Box)({
  width: "100%",
  maxWidth: "1286px",
});

export const MemberDownloadButton = styled(IconButton)({
  padding: "4px",
  marginLeft: "auto",
  flexShrink: 0,
  color: "#093F84",
  borderRadius: "6px",
  opacity: 0,
  transition: "opacity 0.15s, background 0.15s",
  "&:hover": {
    backgroundColor: "#D6E9FF",
  },
  "&.Mui-disabled": {
    opacity: 0.3,
    color: "#6B7280",
  },
});
