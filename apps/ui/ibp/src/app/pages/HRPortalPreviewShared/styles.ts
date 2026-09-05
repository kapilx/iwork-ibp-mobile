import { Box, Button, Chip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const PreviewPage = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2.5),
}));

export const PreviewSection = styled(Box)(() => ({
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 20,
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
}));

export const PreviewSectionBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

export const HeroRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const HeroTitle = styled(Typography)(() => ({
  color: "#101828",
  fontSize: 24,
  fontWeight: 600,
  lineHeight: "32px",
  letterSpacing: "-0.5px",
}));

export const HeroSubtitle = styled(Typography)(({ theme }) => ({
  color: "#6A7282",
  fontSize: 14,
  lineHeight: "20px",
  marginTop: theme.spacing(0.5),
}));

export const ActionButton = styled(Button)(() => ({
  height: 40,
  borderRadius: 16,
  textTransform: "none",
  fontSize: 14,
  fontWeight: 600,
  padding: "0 18px",
  color: "#FFFFFF",
  background: "#093F84",
  boxShadow: "none",
  "&:hover": {
    background: "#0A4A9C",
    boxShadow: "none",
  },
}));

export const StatsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("xl")]: {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const FourUpGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const StatCard = styled(Box)<{ tint: string }>(({ tint }) => ({
  background: tint,
  borderRadius: 18,
  border: "1px solid #EEF2F6",
  padding: 24,
}));

export const StatLabel = styled(Typography)(() => ({
  color: "#4A5565",
  fontSize: 12,
  lineHeight: "16px",
}));

export const StatValue = styled(Typography)(({ theme }) => ({
  color: "#101828",
  fontSize: 28,
  fontWeight: 700,
  lineHeight: "36px",
  marginTop: theme.spacing(1.5),
}));

export const SubnavBar = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  flexWrap: "wrap",
}));

export const SubnavTabs = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  flexWrap: "wrap",
}));

export const SubnavTab = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active }) => ({
  minWidth: "auto",
  textTransform: "none",
  borderRadius: 16,
  height: 34,
  padding: "0 14px",
  color: active ? "#1447E6" : "#6A7282",
  background: active ? "#FFFFFF" : "transparent",
  border: "none",
  borderBottom: active ? "2px solid #155DFC" : "2px solid transparent",
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  boxShadow: "none",
  "&:hover": {
    background: "#F8FAFC",
    boxShadow: "none",
  },
}));

export const ToolbarRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  flexWrap: "wrap",
}));

export const ToolbarFilters = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flexWrap: "wrap",
  flex: 1,
}));

export const InputLike = styled(Box)(() => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minWidth: 160,
  height: 40,
  padding: "0 14px",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  color: "#6A7282",
  fontSize: 13,
}));

export const SearchBox = styled(InputLike)(() => ({
  minWidth: 240,
  color: "#9CA3AF",
}));

export const GhostButton = styled(Button)(() => ({
  height: 40,
  borderRadius: 16,
  textTransform: "none",
  fontSize: 13,
  fontWeight: 600,
  padding: "0 16px",
  color: "#364153",
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  boxShadow: "none",
  "&:hover": {
    background: "#F9FAFB",
    boxShadow: "none",
  },
}));

export const TableShell = styled(Box)(() => ({
  border: "1px solid #EAECEF",
  borderRadius: 20,
  overflow: "hidden",
  background: "#FFFFFF",
}));

export const TableScroll = styled(Box)(() => ({
  overflowX: "auto",
}));

export const DataTable = styled("table")({
  width: "100%",
  minWidth: 1200,
  borderCollapse: "collapse",
});

export const DataTableHead = styled("thead")({
  background: "#4B6B8A",
});

export const DataTableHeaderCell = styled("th")({
  padding: "14px 16px",
  textAlign: "left",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  lineHeight: "16px",
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,0.15)",
  backgroundColor: "#4B6B8A",
});

export const DataTableCell = styled("td")({
  padding: "16px",
  color: "#101828",
  fontSize: 13,
  lineHeight: "18px",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #F2F4F7",
  verticalAlign: "middle",
});

export const RowTitle = styled(Typography)(() => ({
  color: "#101828",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: "18px",
}));

export const RowSubtitle = styled(Typography)(({ theme }) => ({
  color: "#6A7282",
  fontSize: 11,
  lineHeight: "16px",
  marginTop: theme.spacing(0.25),
}));

export const StatusChip = styled(Chip)<{
  chipbg: string;
  chipcolor: string;
  chipborder: string;
}>(({ chipbg, chipcolor, chipborder }) => ({
  height: 28,
  borderRadius: 999,
  background: chipbg,
  color: chipcolor,
  border: `1px solid ${chipborder}`,
  fontSize: 12,
  fontWeight: 600,
  "& .MuiChip-label": {
    paddingLeft: 10,
    paddingRight: 10,
  },
}));

export const IconActionButton = styled(Button)(() => ({
  minWidth: "auto",
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  color: "#4A5565",
  background: "#FFFFFF",
  boxShadow: "none",
  "&:hover": {
    background: "#F9FAFB",
    boxShadow: "none",
  },
}));

export const FooterNote = styled(Typography)(() => ({
  color: "#D1D5DC",
  fontSize: 11,
  lineHeight: "16px",
  textAlign: "center",
}));
