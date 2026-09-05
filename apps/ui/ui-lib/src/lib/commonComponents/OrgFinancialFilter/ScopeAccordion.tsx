import React from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CircularProgress } from "@mui/material";
import { LocalizationConfig } from "../../utils";
import { ScopeMetricConfig, ScopeNode } from "./types";
import {
  AccordionShell,
  AccordionHeaderRow,
  AccordionBody,
  LevelBadge,
  HeaderLabel,
  HeaderHint,
  HeaderValue,
  HeaderKpis,
  HeaderKpi,
  KpiLabel,
  KpiValue,
  MetricColumns,
  StackedName,
  Chevron,
  ScopeTone,
} from "./styles";

interface ScopeAccordionProps {
  tone: ScopeTone;
  icon: React.ReactNode;
  label: string;
  hint: string;
  // When set, the section is collapsed to its picked node + KPIs.
  selectedNode?: ScopeNode;
  // Fresh metric values for the picked node are still being fetched — show a
  // small spinner in place of the KPI values instead of misleading blanks/0s.
  metricsLoading?: boolean;
  metrics: ScopeMetricConfig[];
  localization?: LocalizationConfig;
  // Values-only columns under the shared header row (config.tabularMetrics).
  tabular?: boolean;
  expanded: boolean;
  // Role-locked level: header still shows the picked node + KPIs, but the
  // section can't be expanded (no chevron, no click).
  disabled?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

// One hierarchy level. Header shows the level name + hint while drilling, and
// folds to the picked node's name + the configured KPI trio once selected.
const ScopeAccordion: React.FC<ScopeAccordionProps> = ({
  tone,
  icon,
  label,
  hint,
  selectedNode,
  metricsLoading = false,
  metrics,
  localization,
  tabular,
  expanded,
  disabled = false,
  onToggle,
  children,
}) => (
  <AccordionShell tone={tone} expanded={expanded}>
    <AccordionHeaderRow
      onClick={disabled ? undefined : onToggle}
      sx={disabled ? { cursor: "default" } : undefined}
      data-testid={`scope-header-${label}`}
    >
      <LevelBadge tone={tone}>{icon}</LevelBadge>
      {!(tabular && selectedNode) && (
        <HeaderLabel>{selectedNode ? `${label}:` : label}</HeaderLabel>
      )}
      {selectedNode ? (
        tabular ? (
          <>
            <StackedName>
              <KpiLabel>{label}:</KpiLabel>
              <HeaderValue large sx={{ width: "auto" }}>
                {selectedNode.name}
              </HeaderValue>
            </StackedName>
            <MetricColumns count={metrics.length}>
              {metricsLoading ? (
                <CircularProgress size={14} />
              ) : (
                metrics.map((metric) => (
                  <KpiValue large key={metric.key}>
                    {metric.format(
                      selectedNode.metrics[metric.key] ?? 0,
                      localization
                    )}
                  </KpiValue>
                ))
              )}
            </MetricColumns>
          </>
        ) : (
          <>
            <HeaderValue large>{selectedNode.name}</HeaderValue>
            <HeaderKpis>
              {metricsLoading ? (
                <CircularProgress size={16} />
              ) : (
                metrics.map((metric) => (
                  <HeaderKpi key={metric.key}>
                    <KpiLabel large>{metric.label}</KpiLabel>
                    <KpiValue large>
                      {metric.format(
                        selectedNode.metrics[metric.key] ?? 0,
                        localization
                      )}
                    </KpiValue>
                  </HeaderKpi>
                ))
              )}
            </HeaderKpis>
          </>
        )
      ) : (
        <HeaderHint>{hint}</HeaderHint>
      )}
      {/* Chevron keeps its slot when disabled (visibility, not removal) so
          tabular metric columns stay aligned with the other rows. */}
      <Chevron
        open={expanded}
        sx={disabled ? { visibility: "hidden" } : undefined}
      >
        <ExpandMoreIcon />
      </Chevron>
    </AccordionHeaderRow>
    {expanded && <AccordionBody>{children}</AccordionBody>}
  </AccordionShell>
);

export default ScopeAccordion;
