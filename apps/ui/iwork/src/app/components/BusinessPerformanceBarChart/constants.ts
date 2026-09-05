export const BUSINESS_PERFORMANCE_BAR_CHART_CONFIG = {
  subtitle: "Performance metrics with target vs achieved comparison",
  errorMessage: "Failed to load business performance data",
  noDataMessage: "No data available for the chart.",
  metrics: {
    "New Business": "New Business",
    Retention: "Retention",
  } as Record<string, string>,
  series: [
    {
      key: "target",
      label: "Target",
      color: "#94a3b8",
      labelColor: "#64748b",
      labelFontWeight: 600,
    },
    {
      key: "achieved",
      label: "Achieved",
      color: "#2563eb",
    },
  ],
} as const;
