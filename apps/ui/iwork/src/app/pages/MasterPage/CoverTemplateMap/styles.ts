import { Box, Divider, Typography, styled } from "@mui/material";

// Shared grid template for the mapped-covers table (header + rows must match):
// drag handle | cover | mandatory | remove.
const MAPPED_GRID_COLUMNS = "32px 1fr 120px 200px 40px";

export const WizardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const SectionContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(0.5),
}));

export const SectionSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(8),
}));

export const SectionDivider = styled(Divider)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

export const FormWrapper = styled(Box)(() => ({
  width: "100%",
}));

export const ButtonRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(5),
}));

export const TwoColumnLayout = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(3),
  alignItems: "start",
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "minmax(320px, 1fr) minmax(360px, 1.4fr)",
  },
}));

export const MappedHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(0.5),
}));

export const MappedTableHeaderRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: MAPPED_GRID_COLUMNS,
  gap: theme.spacing(2),
  alignItems: "center",
  paddingInline: theme.spacing(1.5),
  paddingBottom: theme.spacing(1),
}));

export const MappedTableHeaderCell = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 600,
}));

export const MappedScrollArea = styled(Box)(() => ({
  maxHeight: 420,
  overflowY: "auto",
}));

export const MappedRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: MAPPED_GRID_COLUMNS,
  gap: theme.spacing(2),
  alignItems: "center",
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(1),
  borderRadius: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const MappedEmptyState = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  border: `1px dashed ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
}));

export const DragHandleCell = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "grab",
}));

export const SplitLayout = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: theme.spacing(3),
  alignItems: "start",
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "1fr 1fr",
  },
}));

export const LovSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.action.hover,
}));

export const LovRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const LovActions = styled(Box)(() => ({
  display: "flex",
}));
