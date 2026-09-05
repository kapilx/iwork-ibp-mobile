import React from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PublicIcon from "@mui/icons-material/Public";
import { LocalizationConfig } from "../../utils";
import { ScopeMetricConfig } from "./types";
import {
  RootSummaryShell,
  RootSummaryRow,
  RootSummaryBody,
  LevelBadge,
  HeaderLabel,
  HeaderKpis,
  HeaderKpi,
  KpiLabel,
  KpiValue,
  MetricColumns,
  TABULAR_NAME_WIDTH,
  Chevron,
} from "./styles";

interface ScopeRootSummaryProps {
  label: string;
  metrics: ScopeMetricConfig[];
  total?: Record<string, number>;
  localization?: LocalizationConfig;
  // Values-only columns under the shared header row (config.tabularMetrics).
  tabular?: boolean;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

// Root of the drilldown ("All IIRM Holdings"): grand total across the whole
// org tree, always shown (collapsed or not). The per-level accordion stack
// (Organisation/SBU/Vertical/Branch) lives INSIDE this one as `children` —
// collapsing it hides the whole stack, matching a normal accordion.
const ScopeRootSummary: React.FC<ScopeRootSummaryProps> = ({
  label,
  metrics,
  total,
  localization,
  tabular,
  expanded,
  onToggle,
  children,
}) => (
  <RootSummaryShell data-testid="scope-root-summary">
    <RootSummaryRow onClick={onToggle} data-testid="scope-root-summary-header">
      <LevelBadge tone="blue">
        <PublicIcon />
      </LevelBadge>
      {/* Fixed width matching the accordion rows' name column — tabular uses
          the narrower TABULAR_NAME_WIDTH (StackedName), non-tabular the
          HeaderLabel(118) + gap(12) + HeaderValue(220) = 350 — so the KPI
          block lands at the exact same X as every row below it. */}
      <HeaderLabel
        large
        sx={{ width: tabular ? TABULAR_NAME_WIDTH : 350, flexShrink: 0 }}
      >
        {label}
      </HeaderLabel>
      {tabular ? (
        <MetricColumns count={metrics.length}>
          {metrics.map((metric) => (
            <KpiValue large key={metric.key}>
              {metric.format(total?.[metric.key] ?? 0, localization)}
            </KpiValue>
          ))}
        </MetricColumns>
      ) : (
        <HeaderKpis>
          {metrics.map((metric) => (
            <HeaderKpi key={metric.key}>
              <KpiLabel large>{metric.label}</KpiLabel>
              <KpiValue large>
                {metric.format(total?.[metric.key] ?? 0, localization)}
              </KpiValue>
            </HeaderKpi>
          ))}
        </HeaderKpis>
      )}
      <Chevron open={expanded}>
        <ExpandMoreIcon />
      </Chevron>
    </RootSummaryRow>
    {expanded && <RootSummaryBody>{children}</RootSummaryBody>}
  </RootSummaryShell>
);

export default ScopeRootSummary;
