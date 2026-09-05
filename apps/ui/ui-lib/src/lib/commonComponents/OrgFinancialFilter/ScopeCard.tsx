import React from "react";
import Checkbox from "@mui/material/Checkbox";
import { LocalizationConfig } from "../../utils";
import { ScopeMetricConfig, ScopeNode } from "./types";
import {
  Card,
  CardMetric,
  CardMetricLabel,
  CardMetricValue,
  CardName,
  ScopeTone,
} from "./styles";

interface ScopeCardProps {
  node: ScopeNode;
  metrics: ScopeMetricConfig[];
  tone: ScopeTone;
  selected: boolean;
  // Several cards can be picked at this level — show a checkbox so that is
  // discoverable, since a tinted card alone reads as single-select.
  multiSelect?: boolean;
  localization?: LocalizationConfig;
  onSelect: () => void;
}

// A single drilldown card: node name + the configured KPI trio.
const ScopeCard: React.FC<ScopeCardProps> = ({
  node,
  metrics,
  tone,
  selected,
  multiSelect = false,
  localization,
  onSelect,
}) => (
  <Card
    tone={tone}
    selected={selected}
    onClick={onSelect}
    data-testid={`scope-card-${node.id}`}
  >
    <CardName>
      {multiSelect && (
        <Checkbox
          checked={selected}
          size="small"
          sx={{
            p: 0,
            mr: 0.75,
            color: "common.black",
            "&.Mui-checked": { color: "common.black" },
          }}
          tabIndex={-1}
          disableRipple
        />
      )}
      {node.name}
    </CardName>
    {metrics.map((metric) => (
      <CardMetric key={metric.key}>
        <CardMetricLabel>{metric.label}</CardMetricLabel>
        <CardMetricValue>
          {metric.format(node.metrics[metric.key] ?? 0, localization)}
        </CardMetricValue>
      </CardMetric>
    ))}
  </Card>
);

export default ScopeCard;
