import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "@mui/material/styles";
import { CircularProgress } from "@mui/material";
import { BreakdownBar } from "./types";
import { TARGET_VS_ACTUAL_COPY } from "./constants";
import {
  BreakdownWidget,
  TotalOverviewCard,
  TotalOverviewLabel,
  SummaryStatsRow,
  SummaryStatBlock,
  SummaryStatLabel,
  SummaryStatValue,
  ChartFillContainer,
  TotalOverviewLegendRow,
  BreakdownPanels,
  QuarterlyPanel,
  SbuPanel,
  PanelHeader,
  PanelTitle,
  PanelSubtitleRow,
  SelectedQuarterName,
  PanelSubtitle,
  ChartContent,
  LegendRow,
  LegendItem,
  LegendDot,
  LegendText,
  NoDataText,
  LoadingContainer,
  SbuPanelContent,
  TOTAL_CARD_COLOR,
  QUARTER_ACTUAL_BAR_COLOR,
  SBU_ACTUAL_BAR_COLOR,
  RO_TARGET_COLOR,
  SO_TARGET_COLOR,
  RO_ACTUAL_COLOR,
  SO_ACTUAL_COLOR,
  RO_SBU_COLOR,
  SO_SBU_COLOR,
} from "./styles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BusinessPerformanceQuarterlyViewProps {
  quarterBars: BreakdownBar[];
  sbuBars: BreakdownBar[];
  formatValue: (value: number) => string;
  onQuarterChange?: (quarter?: string) => void;
  onTotalNavigate?: () => void;
  lockedQuarter?: string;
  resetKey?: string;
  showNotApplicablePlaceholder?: boolean;
  sbuLoading?: boolean;
}

type Theme = ReturnType<typeof useTheme>;

// ─── Shared chart helpers ─────────────────────────────────────────────────────

/** Common tooltip frame shared by all three charts. */
const buildTooltipBase = (theme: Theme) => ({
  backgroundColor: theme.palette.background.paper,
  borderColor: theme.palette.divider,
  borderWidth: 1,
  padding: 12,
  confine: false,
  extraCssText: "border-radius:16px;box-shadow:0 16px 40px rgba(15,23,42,.14);",
});

/** Tooltip row helper — one coloured swatch + label + value. */
const tooltipRow = (color: string, label: string, value: string, mb = "3px") =>
  `<div style="display:flex;align-items:center;margin-bottom:${mb};">
    <span style="display:inline-block;width:10px;height:10px;background:${color};margin-right:6px;border-radius:2px;"></span>
    <span style="color:#64748b;font-size:12px;">${label}: <strong style="color:#1f2937;">${value}</strong></span>
  </div>`;

const tooltipSection = (title: string) =>
  `<div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;">${title}</div>`;

const tooltipTitle = (label: string) =>
  `<div style="font-weight:700;margin-bottom:8px;font-size:13px;color:#111827;">${label}</div>`;

/** Target-only tooltip — shown when hovering the Target stack. */
const buildTargetTooltipHtml = (
  label: string,
  roTarget: number,
  soTarget: number,
  fv: (v: number) => string,
) => `
  ${tooltipTitle(label)}
  ${tooltipSection("Target")}
  ${tooltipRow(SO_TARGET_COLOR, "SO", fv(soTarget))}
  ${tooltipRow(RO_TARGET_COLOR, "RO", fv(roTarget), "0")}
`;

/** Achieved-only tooltip — shown when hovering the Achieved stack. */
const buildAchievedTooltipHtml = (
  label: string,
  roActual: number,
  soActual: number,
  fv: (v: number) => string,
  roActualColor: string,
  soActualColor: string,
) => `
  ${tooltipTitle(label)}
  ${tooltipSection("Achieved")}
  ${tooltipRow(soActualColor, "SO", fv(soActual))}
  ${tooltipRow(roActualColor, "RO", fv(roActual), "0")}
`;

/**
 * Builds the two visible segment series (RO bottom + SO top) for a stacked bar.
 * `dataFn` maps a bar to its value; `nullFn` returns null for the "other" category
 * position so ECharts allocates no phantom space there.
 */
const buildSegmentSeries = (
  fv: (v: number) => string,
  stackName: string,
  roColor: string,
  soColor: string,
  roLabelColor: string,
  roDataRaw: (number | null)[],
  soDataRaw: (number | null)[],
  fontSize: number,
  isFirstStack: boolean,
  barCategoryGap = "35%",
  barWidth = 44,
  pointOpacity?: (number | undefined)[],
) => {
  const roData = zeroize(roDataRaw, fv);
  const soData = zeroize(soDataRaw, fv);
  return [
  {
    name: `RO ${stackName}`,
    type: "bar",
    stack: stackName,
    barWidth,
    ...(isFirstStack && { barGap: "20%", barCategoryGap }),
    color: roColor,
    data: withOpacity(roData, pointOpacity),
    label: {
      show: false,
      position: "inside",
      overflow: "hidden",
      color: roLabelColor,
      fontSize,
      fontWeight: 700,
    },
    emphasis: { disabled: true },
    itemStyle: { borderRadius: [0, 0, 0, 0] },
  },
  {
    name: `SO ${stackName}`,
    type: "bar",
    stack: stackName,
    color: soColor,
    data: withOpacity(soData, pointOpacity),
    label: {
      show: false,
      position: "inside",
      overflow: "hidden",
      color: "#1e293b",
      fontSize,
      fontWeight: 700,
    },
    emphasis: { disabled: true },
    itemStyle: { borderRadius: [4, 4, 0, 0] },
  },
  ];
};

/**
 * Phantom zero-height cap series — invisible bar sitting on top of a stack.
 * ECharts renders its label at position "top" = top of the accumulated stack.
 */
const buildPhantomCap = (
  fv: (v: number) => string,
  name: string,
  stackName: string,
  // Per-position stack total; sign decides which edge the label caps.
  // null = no bar at this position (so ECharts allocates no phantom space).
  capTotals: (number | null)[],
  labelFormatter: (p: { dataIndex: number }) => string,
  pointOpacity?: (number | undefined)[],
) => ({
  name,
  type: "bar",
  stack: stackName,
  // A near-zero sliver sitting just past the end of the stack: for a positive
  // stack it goes on top (label "top"), for a negative stack it hangs below the
  // bottom (label "bottom") so the cumulative label tracks the bar's far edge.
  // A display-zero total pins the label to the baseline (value 0) so it doesn't
  // float up or animate off the axis when there's no real bar under it.
  data: capTotals.map((t, i) =>
    t === null
      ? null
      : {
          value: !/[1-9]/.test(fv(t)) ? 0 : t < 0 ? -0.001 : 0.001,
          label: {
            position: t < 0 ? "bottom" : "top",
            ...(pointOpacity ? { opacity: pointOpacity[i] ?? 1 } : {}),
          },
        },
  ),
  itemStyle: { color: "transparent", borderColor: "transparent" },
  silent: true,
  clip: false,
  label: {
    show: true,
    distance: 10,
    overflow: "none",
    formatter: labelFormatter,
    color: "#1e293b",
    fontSize: 10,
    fontWeight: 700,
  },
  emphasis: { disabled: true },
});

// ─── Chart option builders ────────────────────────────────────────────────────

const buildTotalOverviewChartOption = (
  totals: { roActual: number; soActual: number; roTarget: number; soTarget: number },
  fv: (v: number) => string,
  showPlaceholder: boolean,
  theme: Theme,
) => {
  const totalTarget = totals.roTarget + totals.soTarget;
  const totalActual = totals.roActual + totals.soActual;

  return {
    tooltip: showPlaceholder
      ? { show: false }
      : {
          ...buildTooltipBase(theme),
          trigger: "item",
          // Total Overview uses a single stack "bars" for both columns,
          // so seriesName cannot distinguish them — use dataIndex instead:
          // index 0 = "Target" column, index 1 = "Achieved" column.
          formatter: (params: any) => {
            const isTarget = params.dataIndex === 0;
            return isTarget
              ? buildTargetTooltipHtml("Target", totals.roTarget, totals.soTarget, fv)
              : buildAchievedTooltipHtml("Achieved", totals.roActual, totals.soActual, fv, RO_ACTUAL_COLOR, SO_ACTUAL_COLOR);
          },
        },
    legend: { show: false },
    grid: { left: "6%", right: "6%", bottom: "14%", top: "22%", containLabel: true },
    xAxis: {
      type: "category",
      data: ["Target", "Achieved"],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#1e293b", fontWeight: 700, fontSize: 12 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: theme.palette.background.lightGrey, type: "dashed" } },
      axisLabel: { show: false },
    },
    series: [
      // Single stack "bars" — null at the opposing position so each bar is centered
      // under its own x-axis label with no phantom space from the other group.
      ...buildSegmentSeries(
        fv, "bars", RO_TARGET_COLOR, SO_TARGET_COLOR, "#ffffff",
        [totals.roTarget, null], [totals.soTarget, null],
        11, true, "50%",
      ),
      buildPhantomCap(fv, "_tCap", "bars", [totalTarget, null],
        () => showPlaceholder ? "--" : fv(totalTarget)),
      ...buildSegmentSeries(
        fv, "bars", RO_ACTUAL_COLOR, SO_ACTUAL_COLOR, "#ffffff",
        [null, totals.roActual], [null, totals.soActual],
        11, false,
      ),
      buildPhantomCap(fv, "_aCap", "bars", [null, totalActual],
        () => showPlaceholder ? "--" : fv(totalActual)),
    ],
  };
};

/**
 * Per-index opacity array to fade non-selected quarters. Full opacity for the
 * selected quarter, dimmed for the rest; undefined when nothing is selected
 * (so bars render at normal opacity and the view fully reverts).
 */
const DIMMED_OPACITY = 0.3;
const dimFor = (bars: BreakdownBar[], selected?: string) =>
  selected
    ? bars.map((b) => (b.label === selected ? 1 : DIMMED_OPACITY))
    : undefined;

// A value that formats to all-zeros (e.g. "0.00 L") must draw no bar — otherwise a
// sub-threshold value auto-scales the axis and renders a misleading full-height column.
// ponytail: string test reuses the locale formatter, no hardcoded lakh threshold.
const zeroize = (data: (number | null)[], fv: (v: number) => string) =>
  data.map((v) => (v !== null && !/[1-9]/.test(fv(v)) ? 0 : v));

/** Wrap bar values in per-point itemStyle so each column can carry its own opacity. */
const withOpacity = (data: (number | null)[], opacities?: (number | undefined)[]) =>
  opacities
    ? data.map((v, i) => ({ value: v, itemStyle: { opacity: opacities[i] ?? 1 } }))
    : data;

const buildQuarterlyChartOption = (
  bars: BreakdownBar[],
  fv: (v: number) => string,
  showPlaceholder: boolean,
  theme: Theme,
  selectedQuarter?: string,
) => ({
  tooltip: showPlaceholder
    ? { show: false }
    : {
        ...buildTooltipBase(theme),
        trigger: "item",
        formatter: (params: any) => {
          const bar = bars[params.dataIndex];
          if (!bar) return "";
          const isTarget = (params.seriesName as string).toLowerCase().includes("target");
          return isTarget
            ? buildTargetTooltipHtml(bar.label, bar.roTarget, bar.soTarget, fv)
            : buildAchievedTooltipHtml(bar.label, bar.roActual, bar.soActual, fv, RO_ACTUAL_COLOR, SO_ACTUAL_COLOR);
        },
      },
  legend: { show: false },
  grid: { left: "2%", right: "2%", bottom: "4%", top: "18%", containLabel: true },
  xAxis: {
    type: "category",
    data: bars.map((b) => b.label),
    axisLine: { lineStyle: { color: theme.palette.divider } },
    axisTick: { show: false },
    axisLabel: { color: theme.palette.text.primary, fontWeight: 700, fontSize: 13 },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: theme.palette.background.lightGrey, type: "dashed" } },
    axisLabel: {
      color: theme.palette.text.lightGrey,
      fontSize: 11,
      formatter: (v: number) => (showPlaceholder ? "--" : fv(v)),
    },
  },
  series: (() => {
    const dim = dimFor(bars, selectedQuarter);
    return [
      ...buildSegmentSeries(
        fv, "target", RO_TARGET_COLOR, SO_TARGET_COLOR, "#ffffff",
        bars.map((b) => b.roTarget), bars.map((b) => b.soTarget),
        10, true, "35%", 44, dim,
      ),
      buildPhantomCap(fv, "_tCap", "target", bars.map((b) => b.roTarget + b.soTarget),
        (p) => {
          const bar = bars[p.dataIndex];
          if (!bar) return "";
          const total = bar.roTarget + bar.soTarget;
          return showPlaceholder ? "" : fv(total);
        }, dim),
      ...buildSegmentSeries(
        fv, "achieved", RO_ACTUAL_COLOR, SO_ACTUAL_COLOR, "#ffffff",
        bars.map((b) => b.roActual), bars.map((b) => b.soActual),
        10, false, "35%", 44, dim,
      ),
      buildPhantomCap(fv, "_aCap", "achieved", bars.map((b) => b.roActual + b.soActual),
        (p) => {
          const bar = bars[p.dataIndex];
          if (!bar) return "";
          const total = bar.roActual + bar.soActual;
          return showPlaceholder ? "" : fv(total);
        }, dim),
    ];
  })(),
});

const buildSbuChartOption = (
  bars: BreakdownBar[],
  fv: (v: number) => string,
  showPlaceholder: boolean,
  theme: Theme,
) => ({
  tooltip: showPlaceholder
    ? { show: false }
    : {
        ...buildTooltipBase(theme),
        trigger: "item",
        formatter: (params: any) => {
          const bar = bars[params.dataIndex];
          if (!bar) return "";
          const isTarget = (params.seriesName as string).toLowerCase().includes("target");
          return isTarget
            ? buildTargetTooltipHtml(bar.label, bar.roTarget, bar.soTarget, fv)
            : buildAchievedTooltipHtml(bar.label, bar.roActual, bar.soActual, fv, RO_SBU_COLOR, SO_SBU_COLOR);
        },
      },
  legend: { show: false },
  grid: { left: "2%", right: "2%", bottom: "4%", top: "18%", containLabel: true },
  xAxis: {
    type: "category",
    data: bars.map((b) => b.label),
    axisLine: { lineStyle: { color: theme.palette.divider } },
    axisTick: { show: false },
    axisLabel: {
      color: theme.palette.text.primary,
      fontWeight: 700,
      fontSize: 12,
      interval: 0,
      overflow: "break",
      width: 80,
    },
  },
  // Linear scale with auto min/max — mirrors Excel's dynamic axis behaviour.
  // No hard min: achieved values can be negative, so let ECharts extend the axis
  // below zero rather than clipping negative bars at the baseline.
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: theme.palette.background.lightGrey, type: "dashed" } },
    axisLabel: {
      color: theme.palette.text.lightGrey,
      fontSize: 11,
      formatter: (v: number) => (showPlaceholder ? "--" : fv(v)),
    },
  },
  series: [
    ...buildSegmentSeries(
      fv, "target", RO_TARGET_COLOR, SO_TARGET_COLOR, "#ffffff",
      bars.map((b) => b.roTarget), bars.map((b) => b.soTarget),
      10, true, "35%", 30,
    ),
    buildPhantomCap(fv, "_tCap", "target", bars.map((b) => b.roTarget + b.soTarget),
      (p) => {
        const bar = bars[p.dataIndex];
        if (!bar) return "";
        const total = bar.roTarget + bar.soTarget;
        return showPlaceholder ? "" : fv(total);
      }),
    ...buildSegmentSeries(
      fv, "achieved", RO_SBU_COLOR, SO_SBU_COLOR, "#ffffff",
      bars.map((b) => b.roActual), bars.map((b) => b.soActual),
      10, false, "35%", 30,
    ),
    buildPhantomCap(fv, "_aCap", "achieved", bars.map((b) => b.roActual + b.soActual),
      (p) => {
        const bar = bars[p.dataIndex];
        if (!bar) return "";
        const total = bar.roActual + bar.soActual;
        return showPlaceholder ? "" : fv(total);
      }),
  ].map((s) => ({ ...s, cursor: "default" })),
});

// ─── Component ────────────────────────────────────────────────────────────────

const BusinessPerformanceQuarterlyView: React.FC<BusinessPerformanceQuarterlyViewProps> = ({
  quarterBars,
  sbuBars,
  formatValue,
  onQuarterChange,
  onTotalNavigate,
  showNotApplicablePlaceholder = false,
  sbuLoading = false,
  lockedQuarter,
  resetKey,
}) => {
  const theme = useTheme();

  const totals = useMemo(() => {
    if (quarterBars.length === 0) return { soActual: 0, roActual: 0, soTarget: 0, roTarget: 0 };
    return quarterBars.reduce(
      (acc, bar) => ({
        soActual: acc.soActual + bar.soActual,
        roActual: acc.roActual + bar.roActual,
        soTarget: acc.soTarget + bar.soTarget,
        roTarget: acc.roTarget + bar.roTarget,
      }),
      { soActual: 0, roActual: 0, soTarget: 0, roTarget: 0 },
    );
  }, [quarterBars]);

  const totalActual = totals.soActual + totals.roActual;
  const totalTarget = totals.soTarget + totals.roTarget;
  const achP = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const vari = totalActual - totalTarget;

  const [selectedQuarter, setSelectedQuarter] = React.useState<string | undefined>();

  // A new filter run invalidates any drill-in: the parent clears its own copy
  // of the selection, so the highlight here has to go with it.
  React.useEffect(() => {
    setSelectedQuarter(undefined);
  }, [resetKey]);

  // When the filters already narrow the data to a single quarter, that quarter
  // is the view — the SBU call carries it either way, so a click cannot change
  // anything and the highlight simply reflects the filter.
  const activeQuarter = lockedQuarter ?? selectedQuarter;

  const handleQuarterClick = (params: { name?: string }) => {
    if (showNotApplicablePlaceholder || lockedQuarter || !params.name) return;
    const next = params.name === selectedQuarter ? undefined : params.name;
    setSelectedQuarter(next);
    onQuarterChange?.(next);
  };

  const botSubtitle = activeQuarter
    ? TARGET_VS_ACTUAL_COPY.sbuBreakdownTitle
    : TARGET_VS_ACTUAL_COPY.overallSbuBreakdownTitle;

  const totalOption = useMemo(
    () => buildTotalOverviewChartOption(totals, formatValue, showNotApplicablePlaceholder, theme),
    [totals, formatValue, showNotApplicablePlaceholder, theme],
  );
  const quarterOption = useMemo(
    () => buildQuarterlyChartOption(quarterBars, formatValue, showNotApplicablePlaceholder, theme, activeQuarter),
    [quarterBars, formatValue, showNotApplicablePlaceholder, theme, activeQuarter],
  );
  const sbuOption = useMemo(
    () => buildSbuChartOption(sbuBars, formatValue, showNotApplicablePlaceholder, theme),
    [sbuBars, formatValue, showNotApplicablePlaceholder, theme],
  );

  const sharedLegend = (roColor: string, soColor: string) => (
    <LegendRow>
      <LegendItem><LegendDot $color={SO_TARGET_COLOR} /><LegendText>SO Target</LegendText></LegendItem>
      <LegendItem><LegendDot $color={RO_TARGET_COLOR} /><LegendText>RO Target</LegendText></LegendItem>
      <LegendItem><LegendDot $color={soColor} /><LegendText>SO Achieved</LegendText></LegendItem>
      <LegendItem><LegendDot $color={roColor} /><LegendText>RO Achieved</LegendText></LegendItem>
    </LegendRow>
  );

  return (
    <BreakdownWidget>
      {/* ── Left: Total Overview card ── */}
      <TotalOverviewCard
        $color={TOTAL_CARD_COLOR}
        $selected={false}
        onClick={showNotApplicablePlaceholder ? undefined : onTotalNavigate}
      >
        <TotalOverviewLabel>{TARGET_VS_ACTUAL_COPY.totalOverviewLabel}</TotalOverviewLabel>

        <SummaryStatsRow>
          <SummaryStatBlock>
            <SummaryStatLabel>{TARGET_VS_ACTUAL_COPY.achievementLabel}</SummaryStatLabel>
            <SummaryStatValue $color={TOTAL_CARD_COLOR}>
              {showNotApplicablePlaceholder ? "--" : `${achP}%`}
            </SummaryStatValue>
          </SummaryStatBlock>
          <SummaryStatBlock>
            <SummaryStatLabel>{TARGET_VS_ACTUAL_COPY.varianceLabel}</SummaryStatLabel>
            <SummaryStatValue $color={vari >= 0 ? "#15803d" : "#dc2626"}>
              {showNotApplicablePlaceholder ? "--" : `${vari >= 0 ? "+" : ""}${formatValue(vari)}`}
            </SummaryStatValue>
          </SummaryStatBlock>
        </SummaryStatsRow>

        <ChartFillContainer>
          <ReactECharts
            option={totalOption}
            notMerge={true}
            style={{ position: "absolute", inset: 0, height: "100%", width: "100%" }}
          />
        </ChartFillContainer>

        <TotalOverviewLegendRow>
          <LegendItem><LegendDot $color={SO_TARGET_COLOR} /><LegendText>SO Target</LegendText></LegendItem>
          <LegendItem><LegendDot $color={RO_TARGET_COLOR} /><LegendText>RO Target</LegendText></LegendItem>
          <LegendItem><LegendDot $color={SO_ACTUAL_COLOR} /><LegendText>SO Achieved</LegendText></LegendItem>
          <LegendItem><LegendDot $color={RO_ACTUAL_COLOR} /><LegendText>RO Achieved</LegendText></LegendItem>
        </TotalOverviewLegendRow>
      </TotalOverviewCard>

      {/* ── Right: charts ── */}
      <BreakdownPanels>
        <QuarterlyPanel $color={QUARTER_ACTUAL_BAR_COLOR} $highlighted={false}>
          <PanelHeader>
            <PanelTitle>{TARGET_VS_ACTUAL_COPY.quarterlyPerformanceTitle}</PanelTitle>
          </PanelHeader>
          <ChartContent>
            <ReactECharts
              option={quarterOption}
              notMerge={true}
              style={{ height: "280px", width: "100%" }}
              onEvents={{ click: handleQuarterClick }}
            />
          </ChartContent>
          {sharedLegend(RO_ACTUAL_COLOR, SO_ACTUAL_COLOR)}
        </QuarterlyPanel>

        <SbuPanel $color={SBU_ACTUAL_BAR_COLOR} $highlighted={false}>
          <PanelHeader>
            <PanelSubtitleRow>
              {activeQuarter && (
                <SelectedQuarterName $color={SBU_ACTUAL_BAR_COLOR}>
                  {activeQuarter}
                </SelectedQuarterName>
              )}
              <PanelSubtitle>{botSubtitle}</PanelSubtitle>
            </PanelSubtitleRow>
          </PanelHeader>
          <SbuPanelContent>
            {sbuLoading && !showNotApplicablePlaceholder ? (
              <LoadingContainer>
                <CircularProgress />
              </LoadingContainer>
            ) : sbuBars.length > 0 || showNotApplicablePlaceholder ? (
              <>
                <ChartContent>
                  <ReactECharts
                    option={sbuOption}
                    style={{ height: "280px", width: "100%" }}
                  />
                </ChartContent>
                {sharedLegend(RO_SBU_COLOR, SO_SBU_COLOR)}
              </>
            ) : (
              <NoDataText>{TARGET_VS_ACTUAL_COPY.noSbuDataMessage}</NoDataText>
            )}
          </SbuPanelContent>
        </SbuPanel>
      </BreakdownPanels>
    </BreakdownWidget>
  );
};

export default BusinessPerformanceQuarterlyView;
