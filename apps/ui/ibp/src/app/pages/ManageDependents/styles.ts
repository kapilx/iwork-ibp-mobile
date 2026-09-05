import { Box, Button, IconButton, styled, Typography } from "@mui/material";

/* ---------- Page shell ---------- */

export const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100%",
  marginTop: "69px",
  alignSelf: "flex-start",
  [theme.breakpoints.between("sm", "md")]: { marginTop: "72px" },
  [theme.breakpoints.down("sm")]: { marginTop: "60px" },
}));

export const BlueStrip = styled(Box)(({ theme }) => ({
  height: "160px",
  background: theme.palette.background.DarkBlue,
  [theme.breakpoints.down("md")]: { height: "120px", marginTop: "-10px" },
  [theme.breakpoints.down("sm")]: { height: "100px", marginTop: "-10px" },
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "0 24px",
  position: "relative",
  top: "-100px",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
  width: "95%",
  [theme.breakpoints.down("md")]: { padding: "0 20px", top: "-80px" },
  [theme.breakpoints.down("sm")]: { padding: "0 16px", top: "-60px" },
}));

export const PageHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
}));

export const BackButton = styled(IconButton)(() => ({
  padding: 8,
  color: "#ffffff",
  "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
}));

export const PageTitle = styled(Typography)(({ theme }) => ({
  color: "#ffffff",
  fontSize: theme.typography.fontSizes.xll,
  fontWeight: theme.typography.fontWeights.bold,
  [theme.breakpoints.down("sm")]: { fontSize: theme.typography.fontSizes.xl },
}));

/* ---------- Info banner ---------- */

export const InfoBanner = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  padding: theme.spacing(2.5, 3),
  backgroundColor: "#EFF6FF",
  border: "1px solid #BFDBFE",
  borderRadius: theme.spacing(2),
  boxShadow: "0px 6px 18px 0px #0000000D",
}));

export const InfoBannerIcon = styled(Box)(() => ({
  display: "flex",
  color: "#2563EB",
  flexShrink: 0,
  "& svg": { fontSize: 26 },
  marginTop: 2,
}));

export const InfoBannerText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  lineHeight: 1.6,
  color: "#1E3A8A",
  "& b": { fontWeight: theme.typography.fontWeights.semiBold },
}));

/* ---------- Dashboard grid ---------- */

export const DashboardGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  // gridTemplateColumns: "1.7fr 1fr",
  gap: theme.spacing(4),
  alignItems: "start",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

export const SectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.spacing(3),
  boxShadow: "0px 10px 24px 0px #0000001A",
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  [theme.breakpoints.down("sm")]: { padding: theme.spacing(3) },
}));

/* keeps the form visible while scrolling the (potentially long) summary list */
export const StickyColumn = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: "88px",
  [theme.breakpoints.down("md")]: { position: "static", top: "auto" },
}));

/* ---------- Summary section ---------- */

export const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: "1px solid #0000001A",
}));

export const SectionTitleRow = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#0F172A",
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#0F172A",
}));

export const CountChip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: theme.spacing(0.5, 1.5),
  backgroundColor: "#EEF2FF",
  color: "#4338CA",
  borderRadius: 999,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  "& svg": { fontSize: 18 },
}));

export const DependentsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: theme.spacing(2.5),
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

export const DependentCard = styled(Box)(({ theme }) => ({
  position: "relative",
  border: "1px solid #E2E8F0",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2.5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  transition: "box-shadow .18s ease, border-color .18s ease, transform .18s ease",
  "&:hover": {
    boxShadow: "0px 10px 22px 0px #0F172A14",
    borderColor: "#C7D2FE",
    transform: "translateY(-2px)",
  },
}));

export const DepCardTop = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
}));

export const DepAvatar = styled(Box)(({ theme }) => ({
  width: 44,
  height: 44,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#E0E7FF",
  color: "#4338CA",
  flexShrink: 0,
  fontWeight: theme.typography.fontWeights.bold,
  "& svg": { fontSize: 24 },
}));

export const DepName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#0F172A",
  lineHeight: 1.2,
  wordBreak: "break-word",
}));

export const DepRelationChip = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignSelf: "flex-start",
  padding: theme.spacing(0.25, 1.25),
  marginTop: 2,
  backgroundColor: "#F1F5F9",
  color: "#475569",
  borderRadius: 999,
  fontSize: "12px",
  fontWeight: theme.typography.fontWeights.medium,
}));

export const DepMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  borderTop: "1px dashed #E2E8F0",
}));

export const DepMetaItem = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#64748B",
  "& svg": { fontSize: 16 },
}));

export const DepMetaText = styled(Typography)(({ theme }) => ({
  fontSize: "13px",
  color: "#334155",
  fontWeight: theme.typography.fontWeights.regular,
}));

export const CardActionsGroup = styled(Box)(() => ({
  position: "absolute",
  top: 10,
  right: 10,
  display: "flex",
  alignItems: "center",
  gap: 6,
}));

export const EditIconButton = styled(IconButton)(() => ({
  width: 32,
  height: 32,
  color: "#2563EB",
  backgroundColor: "#EFF6FF",
  "&:hover": { backgroundColor: "#DBEAFE" },
  "& svg": { fontSize: 18 },
}));

export const DeleteIconButton = styled(IconButton)(() => ({
  width: 32,
  height: 32,
  color: "#DC2626",
  backgroundColor: "#FEF2F2",
  "&:hover": { backgroundColor: "#FEE2E2" },
  "& svg": { fontSize: 18 },
  "&.Mui-disabled": { opacity: 0.5 },
}));

/* ---------- Empty state ---------- */

export const EmptyState = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(6, 3),
}));

export const EmptyIcon = styled(Box)(({ theme }) => ({
  width: 72,
  height: 72,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#F1F5F9",
  color: "#94A3B8",
  marginBottom: theme.spacing(0.5),
  "& svg": { fontSize: 36 },
}));

export const EmptyTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#334155",
}));

export const EmptySubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: "#94A3B8",
  maxWidth: 320,
}));

/* ---------- Rules / "good to know" card ---------- */

export const RulesGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(3),
}));

export const RulesGroupTitle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#0F172A",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(1.5),
  "& svg": { fontSize: 18, color: "#2563EB" },
}));

export const EligibilityItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: theme.spacing(1.25, 0),
  borderBottom: "1px dashed #E2E8F0",
  "&:last-of-type": { borderBottom: "none" },
}));

export const EligibilityName = styled(Typography)(({ theme }) => ({
  fontSize: "13px",
  fontWeight: theme.typography.fontWeights.semiBold,
  color: "#334155",
}));

export const EligibilityMeta = styled(Typography)(() => ({
  fontSize: "12px",
  color: "#64748B",
}));

export const RuleItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: theme.spacing(0.75, 0),
  color: "#334155",
  fontSize: "13px",
  lineHeight: 1.5,
  "& svg": {
    fontSize: 17,
    color: "#16A34A",
    flexShrink: 0,
    marginTop: 1,
  },
}));

/* ---------- Form card ---------- */

export const FormCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#0F172A",
  paddingBottom: theme.spacing(2),
  borderBottom: "1px solid #0000001A",
  "& svg": { color: "#2563EB" },
}));

export const FormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
}));

export const SubmitActionButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.sm,
  borderRadius: theme.shape.borderRadii.small,
  padding: theme.spacing(0.8, 2),
  boxShadow: "none",
  width: 120,
  height: 36,
}));

export const FormHint = styled(Typography)(({ theme }) => ({
  fontSize: "12px",
  color: "#94A3B8",
  marginTop: theme.spacing(0.5),
}));
