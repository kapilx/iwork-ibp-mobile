import { Box, Skeleton, styled } from "@mui/material";

// The page container aligns flex children to flex-start, so any section
// wrapper must claim width:100% itself or it shrinks to its content.
export const PolicySectionWrapper = styled("div")({
  width: "100%",
});

export const BizDownReportEnhancedContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "18px 24px",
  gap: "20px",
  ".clickable-cell": {
    cursor: "pointer",
    color: "#1976d2",
    textDecoration: "underline",
  },
});

// Keeps the hidden SmartSearch mounted (wires formMethods into the query
// layer) without rendering it — the visible fields live in the toolbar/drawer.
export const HiddenSearchWrapper = styled(Box)({
  display: "none",
});

export const KpiSkeletonRow = styled(Box)({
  display: "flex",
  gap: "16px",
});

export const KpiSkeleton = styled(Skeleton)({
  flex: 1,
  borderRadius: "8px",
});
