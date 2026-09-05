import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  PreviewPage,
  PreviewSection,
  PreviewSectionBody,
} from "../HRPortalPreviewShared/styles";

export { PreviewPage, PreviewSection, PreviewSectionBody };

export const DetailHeaderBar = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const HeaderIdentity = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  flexWrap: "wrap",
}));

export const SmallGhostButton = styled(Button)(() => ({
  height: 32,
  borderRadius: 16,
  textTransform: "none",
  padding: "0 14px",
  border: "1px solid #E5E7EB",
  color: "#4A5565",
  background: "#FFFFFF",
  fontSize: 12,
  fontWeight: 500,
  boxShadow: "none",
  "&:hover": {
    background: "#F9FAFB",
    boxShadow: "none",
  },
}));

export const PolicyIconBadge = styled(Box)(() => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(59,130,246,0.09)",
}));

export const PolicyTitle = styled(Typography)(() => ({
  color: "#101828",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: "20px",
}));

export const StatusBadge = styled(Box)<{ tone: "success" | "warning" }>(
  ({ tone }) => ({
    height: 20,
    borderRadius: 999,
    padding: "0 8px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: tone === "success" ? "#ECFDF3" : "#FFF7ED",
    color: tone === "success" ? "#027A48" : "#C2410C",
    fontSize: 10,
    fontWeight: 600,
    lineHeight: "15px",
  })
);

export const StatsGridThree = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const StatsGridSix = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: theme.spacing(1.5),
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const DetailStatCard = styled(Box)<{ tint: string }>(({ tint }) => ({
  background: tint,
  border: "1px solid #F3F4F6",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
}));

export const StatCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const StatIconBadge = styled(Box)<{ tone: string }>(({ tone }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: tone,
  flexShrink: 0,
}));

export const DetailStatLabel = styled(Typography)(() => ({
  color: "#99A1AF",
  fontSize: 12,
  lineHeight: "16px",
}));

export const DetailStatValue = styled(Typography)(({ theme }) => ({
  color: "#101828",
  fontSize: 20,
  fontWeight: 700,
  lineHeight: "28px",
  marginTop: theme.spacing(0.75),
}));

export const DetailTabsRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  flexWrap: "wrap",
  minHeight: 44,
}));

export const DetailTabButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active }) => ({
  minWidth: "auto",
  height: 44,
  padding: "0 18px",
  borderRadius: 0,
  borderBottom: active ? "2px solid #2563EB" : "2px solid transparent",
  textTransform: "none",
  color: active ? "#2563EB" : "#4A5565",
  fontSize: 12,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    background: "#F8FAFC",
    boxShadow: "none",
  },
}));

export const SectionTitle = styled(Typography)(() => ({
  color: "#101828",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: "20px",
}));

export const SimpleTable = styled("table")({
  width: "100%",
  borderCollapse: "collapse",
});

export const SimpleTableHeaderCell = styled("th")({
  padding: "12px 12px",
  textAlign: "left",
  color: "#6A7282",
  fontSize: 10,
  fontWeight: 600,
  lineHeight: "16px",
  textTransform: "uppercase",
  borderBottom: "1px solid #E5E7EB",
});

export const SimpleTableCell = styled("td")({
  padding: "16px 12px",
  color: "#101828",
  fontSize: 12,
  lineHeight: "18px",
  borderBottom: "1px solid #F2F4F7",
  verticalAlign: "middle",
});

export const MiniStatus = styled(Box)(() => ({
  height: 24,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 10px",
  background: "#ECFDF3",
  color: "#027A48",
  border: "1px solid #ABEFC6",
  fontSize: 11,
  fontWeight: 600,
}));

export const TwoColumnGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(2),
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const ProgressTrack = styled(Box)(() => ({
  width: "100%",
  height: 10,
  borderRadius: 999,
  background: "#E5E7EB",
  overflow: "hidden",
}));

export const ProgressBar = styled(Box)<{ progress: number; color?: string }>(
  ({ progress, color = "#10B981" }) => ({
    width: `${progress}%`,
    height: "100%",
    background: color,
    borderRadius: 999,
  })
);

export const StatTripletGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: theme.spacing(1.5),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const MiniMetricCard = styled(Box)<{ tint: string }>(({ tint }) => ({
  borderRadius: 16,
  background: tint,
  padding: 16,
  textAlign: "center",
}));

export const GaugeRing = styled(Box)<{ progress: number }>(({ progress }) => ({
  width: 132,
  height: 132,
  borderRadius: "50%",
  background: `conic-gradient(#3B82F6 0 ${progress}%, #E5E7EB ${progress}% 100%)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const GaugeInner = styled(Box)(() => ({
  width: 96,
  height: 96,
  borderRadius: "50%",
  background: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxShadow: "inset 0 0 0 1px #F3F4F6",
}));

export const TrendLegend = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const LegendItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
}));

export const Dot = styled(Box)<{ color: string }>(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: color,
}));

export const RankedList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const RankedRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.75),
}));

export const RankedRowHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
}));
