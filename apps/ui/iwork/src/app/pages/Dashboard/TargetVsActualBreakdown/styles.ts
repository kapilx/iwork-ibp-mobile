import { Box, Typography } from "@mui/material";
import { alpha, keyframes, styled } from "@mui/material/styles";

export const growUp = keyframes`from{transform:scaleY(0)}to{transform:scaleY(1)}`;
export const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
export const pulseFade = keyframes`0%,100%{opacity:.35}50%{opacity:.55}`;
export const glowPulse = keyframes`0%,100%{box-shadow:0 4px 12px rgba(15,118,110,.12)}50%{box-shadow:0 6px 20px rgba(15,118,110,.22)}`;

export const TOTAL_CARD_COLOR = "#0f766e";
export const TARGET_BAR_COLOR = "#94a3b8";
export const QUARTER_ACTUAL_BAR_COLOR = "#2563eb";
export const SBU_ACTUAL_BAR_COLOR = "#7c3aed";
export const PATCH_BACKGROUND = "rgba(237,242,255,0.55)";
export const PATCH_BORDER_COLOR = "#c7d2fe";

// ─── Stacked bar chart color tokens ──────────────────────────────────────────
// Blue/Pink Target + Tan/Green Achieved
export const RO_TARGET_COLOR = "#efb7c6";  // Blue   — RO Target
export const SO_TARGET_COLOR = "#afd0f4";  // Pink   — SO Target
export const RO_ACTUAL_COLOR = "#eec58b";  // Tan    — RO Achieved
export const SO_ACTUAL_COLOR = "#acefd0";  // Green  — SO Achieved
export const RO_SBU_COLOR    = "#eec58b";  // Tan    — RO Achieved (SBU)
export const SO_SBU_COLOR    = "#acefd0";  // Green  — SO Achieved (SBU)

const buildPanelStyles = (
  color: string,
  highlighted: boolean | undefined,
  options: {
    backgroundOpacity: number;
    borderOpacity: number;
    accentOpacity: number;
    borderRadius: string;
    borderTop?: string;
  }
) => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  minWidth: 0,
  padding: "18px 22px 14px",
  minHeight: 220,
  borderRadius: options.borderRadius,
  background: alpha(color, options.backgroundOpacity),
  border: `1.5px solid ${alpha(
    color,
    highlighted ? options.borderOpacity : 0.1
  )}`,
  borderLeft: `3px solid ${alpha(
    color,
    highlighted ? options.accentOpacity : 0.2
  )}`,
  borderTop: options.borderTop,
  position: "relative",
  transition: "all .3s ease",
  overflow: "visible",
});

const buildBarItemContainerStyles = (delay: number) => ({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 5,
  padding: "8px 4px 6px",
  borderRadius: 10,
  position: "relative",
  overflow: "visible",
  animation: `${fadeIn} .4s ease both`,
  animationDelay: `${delay}ms`,
});

export const BreakdownWidget = styled(Box)({
  display: "flex",
  gap: 0,
  width: "100%",
  minHeight: 520,
  minWidth: 0,
});

export const TotalOverviewCard = styled(Box)<{
  $color: string;
  $selected?: boolean;
}>(({ $color, $selected }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0,
  width: 240,
  minWidth: 240,
  alignSelf: "stretch",
  padding: "22px 16px",
  borderRadius: "16px 0 0 16px",
  cursor: "pointer",
  background: $selected
    ? `linear-gradient(170deg, ${alpha($color, 0.12)} 0%, ${alpha(
        $color,
        0.04
      )} 100%)`
    : `linear-gradient(170deg, ${alpha($color, 0.06)} 0%, ${alpha(
        $color,
        0.015
      )} 100%)`,
  border: `1.5px solid ${alpha($color, $selected ? 0.35 : 0.15)}`,
  borderRight: "none",
  flexShrink: 0,
  animation: `${glowPulse} 4s ease-in-out infinite`,
  transition: "all .3s ease",
  "&:hover": {
    background: `linear-gradient(170deg, ${alpha($color, 0.1)} 0%, ${alpha(
      $color,
      0.03
    )} 100%)`,
    border: `1.5px solid ${alpha($color, 0.28)}`,
    borderRight: "none",
  },
}));

export const TotalOverviewLabel = styled(Typography)({
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#2563eb",
  marginBottom: 16,
});

export const SummaryStatsRow = styled(Box)({
  display: "flex",
  gap: 18,
  justifyContent: "center",
  width: "100%",
  marginBottom: 0,
});

export const SummaryStatBlock = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
});

export const SummaryStatLabel = styled(Typography)({
  fontSize: "0.54rem",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
});

export const SummaryStatValue = styled(Typography)<{ $color: string }>(
  ({ $color }) => ({
    fontSize: "1rem",
    fontWeight: 900,
    color: $color,
    lineHeight: 1,
    whiteSpace: "nowrap",
  })
);

export const TotalBarsArea = styled(Box)({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: 20,
  flex: 1,
  width: "100%",
  paddingTop: 0,
  cursor: "pointer",
});

export const TotalBarColumn = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 6,
  flex: 1,
});

export const TotalBar = styled(Box)<{
  $height: number;
  $color: string;
  $delay: number;
}>(({ $height, $color, $delay }) => ({
  width: "100%",
  maxWidth: 56,
  height: $height,
  borderRadius: "10px 10px 4px 4px",
  background: `linear-gradient(180deg, ${$color} 0%, ${alpha(
    $color,
    0.5
  )} 100%)`,
  transformOrigin: "bottom",
  animation: `${growUp} 0.9s cubic-bezier(.22,1,.36,1) both`,
  animationDelay: `${$delay}ms`,
  boxShadow: `0 4px 16px ${alpha($color, 0.25)}`,
  transition: "transform .3s, box-shadow .3s",
  "&:hover": {
    transform: "scaleY(1) scaleX(1.05)",
    boxShadow: `0 6px 24px ${alpha($color, 0.35)}`,
  },
}));

export const TotalBarValue = styled(Typography)<{ $color: string }>(
  ({ $color }) => ({
    fontSize: "0.8rem",
    fontWeight: 900,
    color: $color,
    lineHeight: 1,
    textAlign: "center",
  })
);

export const TotalBarLabel = styled(Typography)({
  fontSize: "0.65rem",
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

// Stacked bar wrapper — children stack bottom-to-top via column-reverse
export const StackedBarGroup = styled(Box)({
  display: "flex",
  flexDirection: "column-reverse",
  alignItems: "center",
  width: "100%",
  maxWidth: 56,
});

// A single segment inside a stacked bar (no individual gradient, flat color)
export const StackedBarSegment = styled(Box)<{
  $height: number;
  $color: string;
  $delay: number;
  $position: "bottom" | "middle" | "top";
}>(({ $height, $color, $delay, $position }) => ({
  width: "100%",
  height: $height,
  background: `linear-gradient(180deg, ${$color} 0%, ${alpha($color, 0.55)} 100%)`,
  borderRadius:
    $position === "bottom"
      ? "0 0 4px 4px"
      : $position === "top"
      ? "10px 10px 0 0"
      : 0,
  transformOrigin: "bottom",
  animation: `${growUp} 0.9s cubic-bezier(.22,1,.36,1) both`,
  animationDelay: `${$delay}ms`,
  boxShadow: $position === "top" ? `0 4px 12px ${alpha($color, 0.2)}` : "none",
}));

export const BreakdownPanels = styled(Box)({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 0,
  position: "relative",
});

export const QuarterlyPanel = styled(Box)<{
  $color: string;
  $highlighted?: boolean;
}>(({ $color, $highlighted }) =>
  buildPanelStyles($color, $highlighted, {
    backgroundOpacity: 0.05,
    borderOpacity: 0.2,
    accentOpacity: 0.5,
    borderRadius: "0 16px 0 0",
  })
);

export const SbuPanel = styled(Box)<{
  $color: string;
  $highlighted?: boolean;
}>(({ $color, $highlighted }) =>
  buildPanelStyles($color, $highlighted, {
    backgroundOpacity: 0.03,
    borderOpacity: 0.25,
    accentOpacity: 0.6,
    borderRadius: "0 0 16px 0",
    borderTop: "none",
  })
);

export const SelectedQuarterOverlay = styled("svg")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  zIndex: 2,
  borderRadius: "0 0 16px 0",
  overflow: "hidden",
});

export const PanelHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
  flexWrap: "wrap",
  gap: 8,
  position: "relative",
  zIndex: 3,
});

export const PanelTitle = styled(Typography)({
  fontSize: "0.9rem",
  fontWeight: 800,
  color: "#334155",
});

export const PanelSubtitleRow = styled(Box)({
  display: "flex",
  alignItems: "baseline",
  gap: 8,
});

export const SelectedQuarterName = styled(Typography)<{ $color: string }>(
  ({ $color }) => ({
    fontSize: "1rem",
    fontWeight: 900,
    color: $color,
    lineHeight: 1,
  })
);

export const PanelSubtitle = styled(Typography)({
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "#94a3b8",
});

export const RewardsNote = styled(Typography)({
  display: "block",
  marginTop: "8px",
  padding: "0 10px",
  color: "#5d5f61",
  fontStyle: "italic",
  fontWeight:"bold",
  fontSize:"16px",
});

export const ChartContent = styled(Box)({
  position: "relative",
  zIndex: 3,
  flex: 1,
  minWidth: 0,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "visible",
});

// Fixed min height so the SBU panel keeps the same footprint across the
// loading / chart / no-data states and doesn't jump ("dance").
export const SbuPanelContent = styled(Box)({
  minHeight: 330,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
});

export const ChartItemsRow = styled(Box)({
  display: "flex",
  alignItems: "stretch",
  gap: 6,
  flex: 1,
  minWidth: 0,
  width: "100%",
  minHeight: 140,
  padding: "8px 0",
  overflow: "visible",
});

export const QuarterBarItemContainer = styled(Box)<{
  $delay: number;
  $selected: boolean;
  $color: string;
}>(({ $delay, $selected, $color }) => ({
  ...buildBarItemContainerStyles($delay),
  cursor: "pointer",
  background: $selected ? alpha($color, 0.03) : "transparent",
  border: "2px solid transparent",
  transform: $selected ? "translateY(-3px)" : "translateY(0)",
  transition: "all .25s cubic-bezier(.34,1.2,.64,1)",
  zIndex: $selected ? 4 : 3,
  "&:hover": {
    transform: $selected ? "translateY(-3px)" : "translateY(-2px)",
    background: $selected ? alpha($color, 0.06) : alpha($color, 0.05),
  },
}));

export const DisabledQuarterBarItemContainer = styled(QuarterBarItemContainer)({
  cursor: "not-allowed",
  opacity: 0.52,
});

export const SbuBarItemContainer = styled(Box)<{ $delay: number }>(
  ({ $delay }) => buildBarItemContainerStyles($delay)
);

export const BarSection = styled(Box)({
  position: "relative",
  width: "100%",
  minWidth: 0,
  overflow: "visible",
  "&:hover": { zIndex: 50 },
});

export const BarsRow = styled(Box)({
  display: "flex",
  alignItems: "flex-end",
  gap: 5,
  width: "100%",
  minWidth: 0,
  justifyContent: "center",
  height: 120,
  overflow: "visible",
});

export const SingleBarWrapper = styled(Box)({
  width: "38%",
  maxWidth: 36,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  height: "100%",
  position: "relative",
  "&:hover": { zIndex: 30 },
});

export const BarFill = styled(Box)<{
  $height: number;
  $color: string;
  $delay: number;
  $upcoming?: boolean;
}>(({ $height, $color, $delay, $upcoming }) => ({
  position: "relative",
  overflow: "visible",
  width: "100%",
  height: $height,
  borderRadius: "6px 6px 2px 2px",
  background: $upcoming
    ? `repeating-linear-gradient(135deg,${alpha($color, 0.06)},${alpha(
        $color,
        0.06
      )} 3px,${alpha($color, 0.14)} 3px,${alpha($color, 0.14)} 6px)`
    : `linear-gradient(180deg,${$color} 0%,${alpha($color, 0.5)} 100%)`,
  border: $upcoming ? `1.5px dashed ${alpha($color, 0.18)}` : "none",
  transformOrigin: "bottom",
  animation: $upcoming
    ? `${growUp} .6s cubic-bezier(.22,1,.36,1) both, ${pulseFade} 2.5s ease-in-out infinite`
    : `${growUp} .7s cubic-bezier(.22,1,.36,1) both`,
  animationDelay: `${$delay}ms`,
  transition: "transform .25s, box-shadow .25s",
  boxShadow: $upcoming ? "none" : `0 2px 10px ${alpha($color, 0.18)}`,
  ...(!$upcoming && {
    "&:hover": {
      transform: "scaleY(1) scaleX(1.12)",
      boxShadow: `0 -4px 18px ${alpha($color, 0.28)}`,
    },
  }),
}));

export const BarGroupTooltipContainer = styled(Box)<{ $arrowOffset: number }>(
  ({ $arrowOffset }) => ({
    position: "fixed",
    background: "#ffffff",
    color: "#111827",
    padding: "10px 12px",
    borderRadius: 14,
    minWidth: 132,
    width: "max-content",
    whiteSpace: "nowrap",
    zIndex: 100,
    border: "1px solid #e5e7eb",
    pointerEvents: "none",
    animation: `${fadeIn} .12s ease both`,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
    "&::after": {
      content: '""',
      position: "absolute",
      top: "100%",
      left: $arrowOffset,
      transform: "translateX(-50%)",
      border: "6px solid transparent",
      borderTopColor: "#ffffff",
    },
  })
);

export const TooltipRow = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
});

export const TooltipLabel = styled(Typography)({
  fontSize: "0.64rem",
  fontWeight: 700,
  color: "#1f2937",
  display: "flex",
  alignItems: "center",
  gap: 6,
});

export const TooltipDot = styled(Box)<{ $color: string }>(({ $color }) => ({
  width: 7,
  height: 7,
  borderRadius: "50%",
  backgroundColor: $color,
  flexShrink: 0,
  boxShadow: `0 0 0 3px ${alpha($color, 0.16)}`,
}));

export const TooltipValue = styled(Typography)<{ $color?: string }>(
  ({ $color }) => ({
    fontSize: "0.72rem",
    fontWeight: 800,
    color: $color || "#111827",
    textAlign: "right",
    letterSpacing: "-0.01em",
  })
);

export const TooltipDivider = styled(Box)({
  borderTop: "1px solid #e5e7eb",
  paddingTop: 6,
  marginTop: 2,
});

export const BarValuesColumn = styled(Box)({
  display: "flex",
  justifyContent: "center",
  gap: 4,
  width: "100%",
  minWidth: 0,
  minHeight: 30,
  alignItems: "center",
  flexDirection: "column",
});

export const BarValue = styled(Typography)<{ $color: string }>(
  ({ $color }) => ({
    fontSize: "0.68rem",
    fontWeight: 700,
    color: $color,
    textAlign: "center",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    minWidth: 38,
    flex: "0 0 auto",
  })
);

export const BarLabel = styled(Typography)<{ $dimmed?: boolean }>(
  ({ $dimmed }) => ({
    fontSize: "0.72rem",
    fontWeight: 700,
    color: $dimmed ? "#cbd5e1" : "#334155",
    textAlign: "center",
    lineHeight: 1.2,
    minHeight: "2.4em",
    width: "100%",
    minWidth: 0,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    overflowWrap: "anywhere",
  })
);

export const LegendRow = styled(Box)({
  display: "flex",
  gap: 14,
  justifyContent: "flex-end",
  marginTop: 8,
  position: "relative",
  zIndex: 3,
});

export const LegendItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 5,
});

export const LegendDot = styled(Box)<{ $color: string }>(({ $color }) => ({
  width: 10,
  height: 10,
  borderRadius: 3,
  backgroundColor: $color,
}));

export const LegendText = styled(Typography)({
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "#64748b",
});

// ─── Total Overview chart container ──────────────────────────────────────────
// Fills remaining card height via flex; ReactECharts uses position:absolute inside.
export const ChartFillContainer = styled(Box)({
  flex: 1,
  width: "100%",
  minHeight: "260px",
  position: "relative",
});

// Legend row variant for the Total Overview card (centered, wrapping)
export const TotalOverviewLegendRow = styled(Box)({
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  justifyContent: "center",
  marginTop: 8,
  position: "relative",
  zIndex: 3,
});

export const LoadingContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  padding: "60px 0",
});

export const ErrorText = styled(Typography)({
  textAlign: "center",
  padding: "40px 0",
});

export const NoDataText = styled(Typography)({
  textAlign: "center",
  padding: "40px 0",
  color: "#888",
});

export const PlaceholderContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 360,
});

export const PlaceholderValue = styled(Typography)({
  fontSize: "32px",
  fontWeight: 700,
  color: "#64748b",
  lineHeight: 1,
});
