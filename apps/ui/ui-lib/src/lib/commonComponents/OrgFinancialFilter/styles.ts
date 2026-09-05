// Styled components for the Org + Financial-period drilldown filter.
// Self-contained (explicit tints) so nothing here leaks into shared theming.

import { styled, keyframes } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

export type ScopeTone = "blue" | "teal" | "purple" | "orange";

const vsCardIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const vsSectionIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Positional tones (step 1..4): blue/teal are always organisation/sbu;
// purple/orange belong to WHICHEVER fork level (vertical or branch) sits at
// position 3/4 — assigned by index in index.tsx (STEP_TONES[idx]), not by
// level identity, so switching View-by between Vertical/Branch keeps each
// slot's color fixed instead of the color following the level around.
// Whole accordion, closed: soft top-down wash per level.
export const TONE_BG_CLOSED: Record<ScopeTone, string> = {
  blue: "linear-gradient(180deg, #EDF4FF -25%, #FFFFFF 85%)",
  teal: "linear-gradient(180deg, #D6FAE8 -25%, #FFFFFF 85%)",
  purple: "linear-gradient(180deg, #f4eaffb3 -25%, #FFFFFF 85%)",
  orange: "linear-gradient(180deg, #FBDFC4 -25%, #FFFFFF 85%)",
};
// Closed accordion shell background: bolder stop position than TONE_BG_CLOSED
// so more color shows through behind the accent border/shadow treatment.
export const TONE_BG_CLOSED_ACCENT: Record<ScopeTone, string> = {
  blue: "linear-gradient(180deg, #EDF4FF -60%, #FFFFFF 70%)",
  teal: "linear-gradient(180deg, #D6FAE8 -60%, #FFFFFF 70%)",
  purple: "linear-gradient(180deg, #f4eaffb3 -60%, #FFFFFF 70%)",
  orange: "linear-gradient(180deg, #FBDFC4 -60%, #FFFFFF 70%)",
};
// Whole accordion, expanded: same family, lighter top-down wash.
export const TONE_BG: Record<ScopeTone, string> = {
  blue: "linear-gradient(180deg, #F5F8FF 0%, #FFFFFF 60%)",
  teal: "linear-gradient(180deg, #F0FBF8 0%, #FFFFFF 60%)",
  purple: "linear-gradient(180deg, #F8F5FF 0%, #FFFFFF 60%)",
  orange: "linear-gradient(180deg, #FFF7F0 0%, #FFFFFF 60%)",
};
// Selected CARD (inside an expanded accordion): vivid diagonal gradient +
// matching accent border/glow — distinct from the accordion's own background.
export const TONE_CARD_SELECTED_BG: Record<ScopeTone, string> = {
  blue: "linear-gradient(135deg, #EDF4FF 0%, #7BBFF6 140%)",
  teal: "linear-gradient(135deg, #D6FAE8 0%, #81D4CC 140%)",
  purple: "linear-gradient(135deg, #f4eaffb3 0%, #ddb7ffb3 140%)",
  orange: "linear-gradient(135deg, #FBDFC4 0%, #FFA24A 140%)",
};
// Default (unselected) leaf card inside an accordion.
export const TONE_CARD_BG: Record<ScopeTone, string> = {
  blue: "linear-gradient(160deg, #FFFFFF 55%, #EDF4FF 130%)",
  teal: "linear-gradient(160deg, #FFFFFF 55%, #D6FAE8 130%)",
  purple: "linear-gradient(160deg, #FFFFFF 55%, #f4eaffb3 130%)",
  orange: "linear-gradient(160deg, #FFFFFF 55%, #FBDFC4 130%)",
};
export const TONE_ACCENT: Record<ScopeTone, string> = {
  blue: "#7BBFF6",
  teal: "#81D4CC",
  purple: "#ddb7ffb3",
  orange: "#FFA24A",
};
export const TONE_BORDER: Record<ScopeTone, string> = {
  blue: "#CBD9FF",
  teal: "#B8ECE0",
  purple: "#DCCBFF",
  orange: "#FFD9B8",
};
export const TONE_BADGE: Record<ScopeTone, string> = {
  blue: "#3B6FF5",
  teal: "#12A594",
  purple: "#7C3AED",
  orange: "#F5811F",
};

export const ScopeSectionHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const ScopeTitle = styled(Typography)`
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
`;

export const AccordionStack = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

// Root summary ("All <org>") sitting above the drilldown stack — plain, no
// card treatment, so it reads as a section header rather than another tile.
export const RootSummaryShell = styled(Box)`
  margin-bottom: 14px;
`;

export const RootSummaryRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
`;

// No horizontal padding: the nested AccordionStack's own AccordionHeaderRows
// already carry 20px left/right padding, so adding more here would double it
// and push their KPI columns out of line with RootSummaryRow's.
export const RootSummaryBody = styled(Box)`
  padding-top: 6px;
`;

export const Breadcrumb = styled(Box)`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #e7ecff;
  font-size: 14px;
  color: #5a5a5a;
`;

export const BreadcrumbPrefix = styled("span")`
  color: #909090;
  margin-right: 2px;
`;

export const BreadcrumbChip = styled("button")`
  border: 1px solid #d3defc;
  background: #f2f6ff;
  color: #3b6ff5;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  padding: 6px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #e7eeff;
    border-color: #3b6ff5;
  }
`;

export const AccordionShell = styled(Box, {
  shouldForwardProp: (p) => p !== "tone" && p !== "expanded",
})<{ tone: ScopeTone; expanded: boolean }>`
  position: relative;
  border-radius: 8px;
  border: 1px solid ${({ tone, expanded }) => (expanded ? TONE_BORDER[tone] : TONE_ACCENT[tone])};
  background: ${({ tone, expanded }) => (expanded ? TONE_BG[tone] : TONE_BG_CLOSED_ACCENT[tone])};
  box-shadow: ${({ tone, expanded }) => (expanded ? `0 8px 24px -12px ${TONE_ACCENT[tone]}` : "none")};
  overflow: hidden;
  transition: background 0.3s ease, border-color 0.25s ease, box-shadow 0.3s ease;
  animation: ${vsSectionIn} 0.35s ease both;

  &:hover {
    border-color: ${({ tone }) => TONE_ACCENT[tone]};
  }

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background: ${({ tone }) => TONE_BG_CLOSED[tone]};
    opacity: ${({ expanded }) => (expanded ? 1 : 0)};
    transition: opacity 0.25s ease;
    pointer-events: none;
  }
`;

export const AccordionHeaderRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
`;

export const LevelBadge = styled(Box, {
  shouldForwardProp: (p) => p !== "tone",
})<{ tone: ScopeTone }>`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ tone }) => TONE_BADGE[tone]};
  background: ${({ tone }) => `${TONE_BADGE[tone]}1A`};
  flex-shrink: 0;
  & svg {
    font-size: 20px;
  }
`;

export const HeaderLabel = styled(Typography, {
  shouldForwardProp: (p) => p !== "large",
})<{ large?: boolean }>`
  font-size: ${({ large }) => (large ? "18px" : "15px")};
  font-weight: ${({ large }) => (large ? 700 : 600)};
  color: #1a1a1a;
  /* Fixed label column so the selected values line up across rows. */
  min-width: 95px;
  flex-shrink: 0;
`;

export const HeaderHint = styled(Typography)`
  font-size: 13px;
  font-weight: 400;
  color: #747474;
  /* Fill the row so the chevron stays at the far right while drilling. */
  flex: 1;
  min-width: 0;
`;

// `large` is used by both ScopeAccordion's collapsed selected-node header and
// ScopeRootSummary's root row, so the two line up visually.
// Fixed (not flexible) width: a name column that stretches to fill leftover
// space puts the KPI block at a different X on every row (depends on
// container width and everything else in the row), so it can never line up
// with ScopeRootSummary's row, which has no equivalent value text to stretch.
// A fixed width — same on both — guarantees identical KPI alignment instead.
export const HeaderValue = styled(Typography, {
  shouldForwardProp: (p) => p !== "large",
})<{ large?: boolean }>`
  font-size: ${({ large }) => (large ? "18px" : "15px")};
  font-weight: 700;
  color: #1a1a1a;
  width: 220px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// KPI set shown in a collapsed (selected) header. Single row, wrapping only
// when the header genuinely runs out of width; fills the space between the
// fixed name column and the chevron so wrapping happens as late as possible.
export const HeaderKpis = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 40px;
  row-gap: 4px;
  margin-right: 8px;
  flex: 1;
  min-width: 0;
`;

export const HeaderKpi = styled(Box)`
  display: flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
  /* Uniform floor so each metric occupies the same column X on every row —
     keeps cross-row alignment without a fixed grid. */
  min-width: 150px;
`;

export const MetricsHeaderRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 10px;
  border-bottom: 1px solid #e7e9ee;
`;

export const TABULAR_NAME_WIDTH = 240;

export const MetricsHeaderSpacer = styled(Box)`
  width: ${34 + 12 + TABULAR_NAME_WIDTH}px;
  flex-shrink: 0;
`;

// Same width as Chevron's icon so the grids share their right edge too.
export const MetricsHeaderEndSpacer = styled(Box)`
  width: 24px;
  flex-shrink: 0;
`;

export const MetricColumns = styled(Box, {
  shouldForwardProp: (p) => p !== "count",
})<{ count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ count }) => count}, 1fr);
  column-gap: 12px;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin-right: 8px;
`;

export const MetricColLabel = styled(Typography)`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a94a6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StackedName = styled(Box)`
  width: ${TABULAR_NAME_WIDTH}px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const KpiLabel = styled(Typography, {
  shouldForwardProp: (p) => p !== "large",
})<{ large?: boolean }>`
  font-size: ${({ large }) => (large ? "13px" : "12px")};
  color: #747474;
`;

export const KpiValue = styled(Typography, {
  shouldForwardProp: (p) => p !== "large",
})<{ large?: boolean }>`
  font-size: ${({ large }) => (large ? "16px" : "14px")};
  font-weight: 700;
  color: #1a1a1a;
`;

export const Chevron = styled(Box, {
  shouldForwardProp: (p) => p !== "open",
})<{ open: boolean }>`
  /* Now that HeaderValue/HeaderKpis are fixed-width (for cross-row alignment)
     instead of stretching to fill the row, nothing else pushes the chevron
     to the far edge — do it here instead, in every row consistently. */
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: #747474;
  transform: rotate(${({ open }) => (open ? 180 : 0)}deg);
  transition: transform 0.25s ease;
`;

export const AccordionBody = styled(Box)`
  padding: 4px 20px 20px;
`;

export const ViewByRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const ViewByLabel = styled(Typography)`
  font-size: 13px;
  color: #747474;
`;

export const TabsRow = styled(Box)`
  display: inline-flex;
  background: #eef0f4;
  border-radius: 8px;
  padding: 3px;
`;

export const TabButton = styled("button", {
  shouldForwardProp: (p) => p !== "active" && p !== "tone",
})<{ active: boolean; tone: ScopeTone }>`
  border: none;
  cursor: pointer;
  padding: 6px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  background: ${({ active }) => (active ? "#FFFFFF" : "transparent")};
  color: ${({ active, tone }) => (active ? TONE_BADGE[tone] : "#5a5a5a")};
  box-shadow: ${({ active }) =>
    active ? "0 1px 3px rgba(0,0,0,0.12)" : "none"};
  transition: all 0.2s ease;
`;

export const CardsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  @media (max-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const Card = styled(Box, {
  shouldForwardProp: (p) => p !== "tone" && p !== "selected",
})<{ tone: ScopeTone; selected: boolean }>`
  border: 1px solid ${({ tone, selected }) => (selected ? TONE_ACCENT[tone] : "#E7E9EE")};
  background: ${({ tone, selected }) => (selected ? TONE_CARD_SELECTED_BG[tone] : TONE_CARD_BG[tone])};
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  box-shadow: ${({ tone, selected }) => (selected ? `0 6px 16px -6px ${TONE_ACCENT[tone]}` : "none")};
  opacity: 1;
  transition: transform 0.25s ease-out, opacity 0.25s ease-out, box-shadow 0.25s ease,
  border-color 0.2s ease, background 0.25s ease;
  animation: ${vsCardIn} 0.35s ease-out backwards;
  animation-delay:310ms;
  &:hover {
    transform: translateY(-2px);
    border-color: ${({ tone }) => TONE_ACCENT[tone]};
    background: ${({ tone }) => TONE_CARD_SELECTED_BG[tone]};
    box-shadow: ${({ tone }) => `0 6px 16px -6px ${TONE_ACCENT[tone]}`};
  }
`;

export const CardName = styled(Typography)`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 14px;
`;

export const CardMetric = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
`;

export const CardMetricLabel = styled(Typography)`
  font-size: 13px;
  color: #747474;
`;

export const CardMetricValue = styled(Typography)`
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
`;

export const EmptyState = styled(Box)`
  padding: 24px;
  text-align: center;
  color: #909090;
  font-size: 14px;
`;

export const ScopeFooter = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
`;

export const StaleHint = styled(Typography)`
  margin-right: auto;
  font-size: 13px;
  color: #b7791f;
`;

export const ResetLink = styled("button")`
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #3b6ff5;
  padding: 8px 4px;
`;

// ---- Period popover (FY / quarter / month / date range) --------------------

export const TimelineButton = styled("button")`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  background: #262626;
  cursor: pointer;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  transition: background 0.2s ease;

  &:hover {
    background: #1a1a1a;
  }
`;

export const CalendarIcon = styled(CalendarTodayOutlinedIcon)`
  font-size: 16px;
  color: #ffffff;
`;

export const PopoverBody = styled(Box)`
  padding: 20px;
  width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PopoverGrid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

export const FieldLabel = styled(Typography)`
  font-size: 13px;
  color: #5a5a5a;
  margin-bottom: 6px;
`;

export const PopoverFooter = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
`;

export const DateFieldWrap = styled(Box)`
  & .MuiInputBase-root {
    border-radius: 8px;
  }
`;

// DynamicForm's grid defaults (60px column gap, 32px row gap) are sized for
// full-page filter drawers; inside a 420px popover they force every two-up row
// to wrap. Tighten them here rather than in the shared styles.
export const PeriodFormWrap = styled(Box)`
  /* MUI Grid sizes items with flex percentages, and DynamicForm's own item sx
     forces width:100%/flex-basis:auto on top — inside a fixed-width popover the
     two-up rows overflowed and the date fields overlapped. Drive the layout
     with CSS grid instead: one cell per field, gridItemSx spans the ones that
     should be full width. */
  & .MuiGrid-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 16px;
    row-gap: 16px;
    width: 100%;
    margin: 0;
  }
  & .MuiGrid-item {
    padding: 0 !important;
    max-width: none !important;
    flex-basis: auto !important;
    min-width: 0;
  }
`;
