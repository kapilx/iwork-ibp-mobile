import { styled, Box, Typography, InputBase, Chip, Button, Divider } from "@mui/material";

// ─── Search bar ─────────────────────────────────────────────────────────────

export const SearchSectionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const SearchInputWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2, 3),
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0px 2px 6px 0px #2626260D",
  "&:focus-within": {
    borderColor: "#3EA0F1",
    boxShadow: "0px 2px 8px 0px #3EA0F120",
  },
}));

export const SearchInput = styled(InputBase)(({ theme }) => ({
  flex: 1,
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.md || "16px",
  fontWeight: theme.typography.fontWeights?.regular || 400,
  color: theme.palette.text.primary,
  "& input::placeholder": {
    color: theme.palette.text.tertiary || "#9CA3AF",
    opacity: 1,
  },
}));

export const SearchIconWrapper = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  color: "#9CA3AF",
  flexShrink: 0,
}));

// ─── Filter chips ────────────────────────────────────────────────────────────

export const FilterRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const FilterLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.sm || "15px",
  fontWeight: theme.typography.fontWeights?.medium || 500,
  color: theme.palette.text.tertiary || "#6B7280",
  lineHeight: "100%",
}));

export const ChipsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

interface FilterChipProps {
  active?: boolean;
}

export const FilterChip = styled(Chip)<FilterChipProps>(({ theme, active }) => ({
  borderRadius: theme.spacing(5),
  height: "34px",
  cursor: "pointer",
  border: active ? "1.5px solid #3EA0F1" : `1.5px solid ${theme.palette.divider}`,
  backgroundColor: active ? "#EBF5FF" : theme.palette.background.paper,
  "&:hover": {
    backgroundColor: active ? "#DCF0FF" : "#F3F4F6",
  },
  "& .MuiChip-label": {
    padding: theme.spacing(0, 3),
    color: active ? "#3EA0F1" : "#374151",
    fontWeight: active
      ? theme.typography.fontWeights?.semiBold || 600
      : theme.typography.fontWeights?.regular || 400,
    fontSize: theme.typography.fontSizes?.sm || "15px",
    fontFamily: theme.typography.fontFamily,
  },
}));

// ─── Results meta ────────────────────────────────────────────────────────────

export const ResultsCountText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.regular || 400,
  fontSize: theme.typography.fontSizes?.sm || "15px",
  color: theme.palette.text.tertiary || "#9CA3AF",
  lineHeight: "100%",
}));

export const TicketsListWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

// ─── Compact ticket card ─────────────────────────────────────────────────────

interface CompactCardProps {
  statusColor?: string;
  selected?: boolean;
}

export const CompactTicketCard = styled(Box)<CompactCardProps>(
  ({ theme, statusColor = "#3EA0F1", selected }) => ({
    borderLeft: `4px solid ${selected ? "#093F84" : statusColor}`,
    backgroundColor: selected ? "#EBF4FF" : theme.palette.background.paper,
    borderRadius: `0 ${theme.spacing(1.5)} ${theme.spacing(1.5)} 0`,
    boxShadow: selected
      ? "0px 4px 14px 0px #3EA0F130"
      : "0px 2px 6px 0px #2626261A",
    transition: "box-shadow 0.2s ease, background-color 0.15s ease",
    overflow: "hidden",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: selected ? "#EBF4FF" : "#F9FAFB",
      boxShadow: "0px 4px 12px 0px #2626261F",
    },
  })
);

export const CompactRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  padding: theme.spacing(3, 4),
  userSelect: "none",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: theme.spacing(1),
  },
}));

export const CompactRowTop = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  flex: 1,
  minWidth: 0,
  [theme.breakpoints.down("md")]: {
    flex: "unset",
    width: "100%",
    justifyContent: "space-between",
  },
}));

export const CompactRowBottom = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexShrink: 0,
  [theme.breakpoints.down("md")]: {
    width: "100%",
    justifyContent: "space-between",
  },
}));

export const TicketIdText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.semiBold || 600,
  fontSize: theme.typography.fontSizes?.md || "16px",
  color: theme.palette.text.primary,
  lineHeight: "100%",
  minWidth: "120px",
  flexShrink: 0,
}));

export const CompactMetaText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.regular || 400,
  fontSize: theme.typography.fontSizes?.sm || "15px",
  color: theme.palette.text.primary || "#6B7280",
  lineHeight: "100%",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const CompactDate = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.regular || 400,
  fontSize: theme.typography.fontSizes?.sm || "15px",
  color: theme.palette.text.tertiary || "#9CA3AF",
  lineHeight: "100%",
  flexShrink: 0,
  whiteSpace: "nowrap",
}));

interface StatusBadgeProps {
  statusColor?: string;
  bgColor?: string;
}

export const StatusBadge = styled(Box)<StatusBadgeProps>(
  ({ statusColor = "#3EA0F1", bgColor = "#EBF5FF" }) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "20px",
    backgroundColor: bgColor,
    color: statusColor,
    fontSize: "15px",
    fontWeight: 500,
    lineHeight: "1.5",
    whiteSpace: "nowrap",
    flexShrink: 0,
  })
);

// ─── Ticket Detail Panel (right side) ────────────────────────────────────────

export const DetailPanelContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  maxHeight: "calc(100vh - 120px)",
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  boxShadow: "0px 5px 10px 0px #2626261A",
  overflow: "hidden",
}));

export const DetailPanelHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(4, 5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  gap: theme.spacing(3),
  flexWrap: "wrap",
}));

export const DetailPanelHeaderLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

export const DetailTicketId = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.semiBold || 700,
  fontSize: "18px",
  color: "#093F84",
  lineHeight: "100%",
}));

export const DetailCategoryTag = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.sm || "14px",
  fontWeight: theme.typography.fontWeights?.regular || 400,
  color: theme.palette.text.tertiary || "#6B7280",
  lineHeight: "100%",
}));

export const BackButton = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#6B7280",
  width: 32,
  height: 32,
  borderRadius: "50%",
  flexShrink: 0,
  "&:hover": {
    background: "#F3F4F6",
    color: "#374151",
  },
  transition: "all 0.15s",
}));

export const DetailPanelBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

export const DetailMetaGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: theme.spacing(4),
}));

export const DetailMetaItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const DetailMetaLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: "12px",
  fontWeight: 500,
  color: "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  lineHeight: "100%",
}));

export const DetailMetaValue = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.md || "15px",
  fontWeight: theme.typography.fontWeights?.regular || 400,
  color: theme.palette.text.primary,
  lineHeight: "1.4",
}));

export const DetailSectionLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: "12px",
  fontWeight: 600,
  color: "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  lineHeight: "100%",
  marginBottom: theme.spacing(2),
}));

export const DetailDescriptionBox = styled(Box)(({ theme }) => ({
  background: "#F8FAFC",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  border: `1px solid ${theme.palette.divider}`,
}));

export const DetailDescriptionText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.md || "15px",
  fontWeight: theme.typography.fontWeights?.regular || 400,
  color: theme.palette.text.primary,
  lineHeight: "1.75",
}));

export const DetailDivider = styled(Divider)(({ theme }) => ({
  borderColor: theme.palette.divider,
}));

export const NoTicketSelected = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  minHeight: "280px",
  gap: theme.spacing(3),
  padding: theme.spacing(6),
  textAlign: "center",
  color: "#9CA3AF",
}));

export const NoTicketIcon = styled(Box)(() => ({
  fontSize: "48px",
  lineHeight: 1,
  opacity: 0.4,
}));

export const NoTicketText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.md || "16px",
  fontWeight: theme.typography.fontWeights?.regular || 400,
  color: "#9CA3AF",
}));

// ─── Expanded detail section (kept for backward compat) ──────────────────────

export const ExpandedContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 4, 5, 4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const ExpandedDivider = styled(Divider)(({ theme }) => ({
  borderColor: theme.palette.divider,
  marginBottom: theme.spacing(1),
}));

export const ExpandedFieldsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
}));

export const FieldItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

export const FieldLabel = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.regular || 400,
  fontSize: theme.typography.fontSizes?.sm || "15px",
  color: theme.palette.text.tertiary || "#9CA3AF",
  lineHeight: "100%",
}));

export const FieldValue = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.regular || 400,
  fontSize: theme.typography.fontSizes?.md || "16px",
  color: theme.palette.text.primary,
  lineHeight: "1.4",
}));

export const DescriptionText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.regular || 400,
  fontSize: theme.typography.fontSizes?.md || "16px",
  lineHeight: "1.7",
}));

// ─── Documents ───────────────────────────────────────────────────────────────

export const DocumentsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

export const DocumentChip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2.5),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  backgroundColor: "#F8FAFC",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#EBF5FF",
    borderColor: "#3EA0F1",
  },
}));

export const DocumentName = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.sm || "15px",
  fontWeight: theme.typography.fontWeights?.regular || 400,
  color: "#374151",
  lineHeight: "100%",
  maxWidth: "180px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

// ─── Empty / loading ─────────────────────────────────────────────────────────

export const EmptyStateWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(10, 4),
  gap: theme.spacing(3),
}));

export const EmptyStateText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights?.medium || 500,
  fontSize: theme.typography.fontSizes?.lg || "16px",
  color: theme.palette.text.tertiary || "#9CA3AF",
  textAlign: "center",
}));

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationBar = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  paddingTop: theme.spacing(3),
  borderTop: `1px solid ${theme.palette.divider}`,
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

export const PaginationInfo = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.sm || "15px",
  color: theme.palette.text.tertiary || "#9CA3AF",
}));

export const PageButtonsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface PageBtnProps {
  active?: boolean;
}

export const PageBtn = styled(Button)<PageBtnProps>(({ theme, active }) => ({
  minWidth: "36px",
  height: "36px",
  padding: theme.spacing(0, 1.5),
  borderRadius: theme.spacing(1),
  border: active ? "1.5px solid #3EA0F1" : `1px solid ${theme.palette.divider}`,
  backgroundColor: active ? "#EBF5FF" : "transparent",
  color: active ? "#3EA0F1" : "#374151",
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes?.sm || "15px",
  fontWeight: active
    ? theme.typography.fontWeights?.semiBold || 600
    : theme.typography.fontWeights?.regular || 400,
  textTransform: "none",
  "&:hover": {
    backgroundColor: active ? "#DCF0FF" : "#F3F4F6",
    border: active ? "1.5px solid #3EA0F1" : `1px solid #9CA3AF`,
  },
  "&:disabled": {
    color: "#D1D5DB",
    borderColor: "#E5E7EB",
    backgroundColor: "transparent",
  },
}));

// ─── ChevronWrapper (kept for any remaining usages) ──────────────────────────

export const ChevronWrapper = styled(Box)<{ expanded?: boolean }>(({ expanded }) => ({
  display: "flex",
  alignItems: "center",
  color: "#9CA3AF",
  flexShrink: 0,
  transition: "transform 0.2s ease",
  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
}));
