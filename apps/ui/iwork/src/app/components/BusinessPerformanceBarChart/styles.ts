import { Box, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET BOX
// ═══════════════════════════════════════════════════════════════════════════════
export const WidgetBox = styled(Box)({
  display: "flex",
  gap: 0,
  width: "100%",
  minHeight: 260,
  minWidth: 0,
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHART CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════
export const ChartPanel = styled(Box)<{ $c?: string }>(
  ({ $c = "#0f766e" }) => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minWidth: 0,
    padding: "14px 16px 10px",
    minHeight: 260,
    borderRadius: "16px",
    background: "#ffffff",
    border: `1.5px solid ${alpha($c, 0.1)}`,
    borderLeft: `3px solid ${alpha($c, 0.3)}`,
    position: "relative",
    transition: "all .3s ease",
    overflow: "visible",
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// NO DATA & LOADING
// ═══════════════════════════════════════════════════════════════════════════════
export const NoDataContent = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(5),
  color: "#888",
  fontSize: "16px",
}));

export const LoadingContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "60px 0",
  width: "100%",
});

export const ErrorContainer = styled(Box)({
  textAlign: "center",
  padding: "40px 0",
  width: "100%",
});

export const PlaceholderContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 260,
});

export const PlaceholderValue = styled(Typography)({
  fontSize: "32px",
  fontWeight: 700,
  color: "#64748b",
  lineHeight: 1,
});
