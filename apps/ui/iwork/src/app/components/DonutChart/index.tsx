import { formatLargeCurrency, theme, useLocalization } from "@ui/ui-lib";
import React from "react";
import ReactECharts from "echarts-for-react";
import {
  DonutChartWrapper,
  ChartWrapper,
  DonutChartFooter,
  TargetValue,
  AchievedValue,
  DividerText,
  PercentValue,
  Target,
  AchievedContainer,
  TargetContainer,
  ValueUnit,
  PercentSymbol,
  DualMetricsContainer,
  DualMetricItem,
  DualMetricValue,
  DualMetricLabel,
  DualArrowIndicator,
} from "./styles";
import { DonutGraphConfig } from "./types";

interface DonutGraphProps {
  config: DonutGraphConfig;
  onclickDonut?: () => void;
}

const EPS = 0.001;
const clamp01 = (n: number) => Math.max(0, Math.min(100, n));
const cleanPercent = (n: number) => Math.round(clamp01(n) * 1000) / 1000;

/**
 * Utility to calculate gauge size based on value length
 * @param amount - The amount to calculate size for
 * @returns The gauge size in pixels
 */
const getGaugeSize = (amount: number | string | undefined): number => {
  const str = amount ? String(amount) : "";
  // Base width: 200px, add 16px for each digit above 5
  const extra = Math.max(str.length - 5, 0) * 16;
  return Math.max(200, 200 + extra);
};

/**
 * Determines gauge color based on percentage achievement
 * @param percentage - Achievement percentage
 * @param target - Target value
 * @returns Color hex code
 */
const getGaugeColor = (percentage: number, target?: number | null): string => {
  if (!target || target === 0) return "#22C55E"; // green if no target
  if (percentage < 60) return "#EF4444"; // red
  if (percentage >= 80) return "#22C55E"; // green
  return "#FFA500"; // orange (default)
};

/**
 * Splits a formatted number string into number and unit parts
 * @param value - Formatted number string
 * @returns Object with number and unit parts
 */
const splitNumberAndUnit = (value: string) => {
  const match = value.match(/([0-9.,]+)([^\d.,]+)?/);
  return {
    number: match?.[1] ?? "",
    unit: match?.[2]?.trim() ?? "",
  };
};

/**
 * Splits a percentage string into number and symbol parts
 * @param value - Percentage string
 * @returns Object with number and symbol parts
 */
const splitPercent = (value: string) => {
  const match = value.match(/([0-9]+)%/);
  return {
    number: match?.[1] ?? "",
    symbol: "%",
  };
};

/**
 * Creates ECharts option for single gauge variant
 * @param config - Chart configuration
 * @param percent - Percentage value
 * @param gaugeColor - Color for the gauge
 * @returns ECharts option object
 */
const createSingleGaugeOption = (
  config: DonutGraphConfig,
  percent: number,
  gaugeColor: string,
  textColor: string,
  fontWeight: string | number = "500"
) => ({
  series: [
    {
      type: "gauge",
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      progress: {
        show: true,
        width: 12,
        itemStyle: {
          color: gaugeColor,
        },
        roundCap: true,
      },
      axisLine: {
        lineStyle: {
          width: 12,
          color: [[1, "#e5e7eb"]],
        },
      },
      pointer: {
        show: true,
        length: "70%",
        width: 3,
        itemStyle: {
          color: "#111827",
          shadowColor: "#00000040",
          shadowBlur: 4,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 16,
        fontWeight: fontWeight,
        color: textColor,
        offsetCenter: [0, "60%"],
        formatter: () => config.subtitle ?? "",
      },
      data: [{ value: percent }],
      title: { show: false },
    },
    {
      type: "pie",
      radius: ["0%", "7%"],
      center: ["50%", "50%"],
      data: [
        {
          value: 1,
          itemStyle: {
            color: "#111827",
          },
          label: { show: false },
          labelLine: { show: false },
        },
      ],
      silent: true,
      hoverAnimation: false,
    },
  ],
});

/**
 * Creates ECharts option for dual gauge variant with two arrows
 * @param config - Chart configuration
 * @param primaryPercent - Primary percentage value
 * @param secondaryPercent - Secondary percentage value
 * @param primaryColor - Primary gauge color
 * @param secondaryColor - Secondary gauge color
 * @returns ECharts option object
 */
const createDualGaugeOption = (
  config: DonutGraphConfig,
  targetPercent: number,
  achievedPercent: number,
  targetColor: string,
  achievedColor: string
) => ({
  series: [
    {
      type: "gauge",
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      radius: "85%",
      axisLine: {
        lineStyle: {
          width: 12,
          color: [[1, "#e5e7eb"]],
        },
      },
      axisLabel: { show: false }, // hide numbers
      axisTick: { show: false }, // hide ticks
      splitLine: { show: false }, // hide divider lines
      pointer: {
        show: false,
        length: "65%",
        width: 3,
        itemStyle: {
          color: targetColor,
        },
      },
      progress: {
        show: true,
        width: 12,
        overlap: true,
        roundCap: true,
        itemStyle: { color: targetColor },
      },
      data: [{ value: targetPercent }],
      detail: { show: false },
    },
    {
      type: "gauge",
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      radius: "85%",
      axisLine: {
        lineStyle: {
          width: 12,
          opacity: 0,
        },
      },
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      pointer: {
        show: true,
        length: "65%",
        width: 3,
        itemStyle: {
          color: achievedColor,
        },
      },
      progress: {
        show: true,
        width: 12,
        overlap: true,
        roundCap: true,
        itemStyle: { color: achievedColor },
      },
      data: [{ value: achievedPercent }],
      detail: {
        valueAnimation: true,
        fontSize: 16,
        fontWeight: "500",
        color: "#000",
        offsetCenter: [0, "60%"],
        formatter: () => config.subtitle ?? "",
      },
    },
    {
      type: "pie",
      radius: ["0%", "6%"],
      center: ["50%", "50%"],
      data: [
        {
          value: 1,
          itemStyle: { color: "#111827" },
          label: { show: false },
          labelLine: { show: false },
        },
      ],
      silent: true,
      hoverAnimation: false,
    },
  ],
});

/**
 * Renders the dual gauge variant footer for Premium chart
 * @param config - Chart configuration
 * @param localizationData - Localization data
 * @param primaryColor - Primary gauge color
 * @param secondaryColor - Secondary gauge color
 * @returns JSX element for dual gauge footer
 */
const renderDualGaugeFooter = (
  config: DonutGraphConfig,
  localizationData: any,
  primaryColor: string,
  secondaryColor: string
) => {
  const {
    target,
    brokerageAmount,
    primaryLabel = "Target",
    secondaryLabel = "Collected",
  } = config;

  const formattedTarget =
    typeof target === "number"
      ? formatLargeCurrency(target, localizationData?.data).trim()
      : "N/A";

  const formattedBrokerage =
    typeof brokerageAmount === "number"
      ? formatLargeCurrency(brokerageAmount, localizationData?.data).trim()
      : "--";

  const targetValueParts = splitNumberAndUnit(formattedTarget);
  const brokerageValueParts = splitNumberAndUnit(formattedBrokerage);

  return (
    <DonutChartFooter>
      <DualMetricsContainer>
        <DualMetricItem>
          <DualArrowIndicator $color={primaryColor} />
          <DualMetricValue $color={primaryColor}>
            {targetValueParts.number}
            {targetValueParts.unit && (
              <ValueUnit>{targetValueParts.unit}</ValueUnit>
            )}
          </DualMetricValue>
          <DualMetricLabel>{primaryLabel}</DualMetricLabel>
        </DualMetricItem>
        <DualMetricItem>
          <DualArrowIndicator $color={secondaryColor} />
          <DualMetricValue $color={secondaryColor}>
            {brokerageValueParts.number}
            {brokerageValueParts.unit && (
              <ValueUnit>{brokerageValueParts.unit}</ValueUnit>
            )}
          </DualMetricValue>
          <DualMetricLabel>{secondaryLabel}</DualMetricLabel>
        </DualMetricItem>
      </DualMetricsContainer>
    </DonutChartFooter>
  );
};

/**
 * Renders the single gauge variant footer (existing logic)
 * @param config - Chart configuration
 * @param localizationData - Localization data
 * @param gaugeColor - Gauge color
 * @returns JSX element for single gauge footer
 */
const renderSingleGaugeFooter = (
  config: DonutGraphConfig,
  localizationData: any,
  gaugeColor: string
) => {
  const { count, target, brokerageAmount, primaryLabel, secondaryLabel } =
    config;

  const formattedTarget =
    typeof target === "number"
      ? formatLargeCurrency(target, localizationData?.data).trim()
      : "NA";

  const achievedValue =
    brokerageAmount !== undefined
      ? formatLargeCurrency(
          Number(brokerageAmount),
          localizationData?.data
        ).trim()
      : "";

  const achievedPercent =
    typeof brokerageAmount === "number" &&
    typeof target === "number" &&
    target > 0
      ? `${Math.round((brokerageAmount / target) * 100)}%`
      : "--";

  const achievedValueParts = splitNumberAndUnit(achievedValue.trim());
  const targetValueParts = splitNumberAndUnit(formattedTarget);
  const achievedPercentParts = splitPercent(achievedPercent);

  return (
    <DonutChartFooter>
      <TargetContainer>
        <TargetValue>
          {formattedTarget === "NA" ? (
            "N/A"
          ) : (
            <>
              {targetValueParts.number}
              {targetValueParts.unit && (
                <ValueUnit>{targetValueParts.unit}</ValueUnit>
              )}
            </>
          )}
        </TargetValue>
        <Target>{primaryLabel || "Target"}</Target>
      </TargetContainer>
      <TargetContainer>
        <AchievedContainer>
          <AchievedValue>
            {achievedValueParts.number}
            {achievedValueParts.unit && (
              <ValueUnit>{achievedValueParts.unit}</ValueUnit>
            )}
          </AchievedValue>
          <DividerText></DividerText>
          <PercentValue $color={gaugeColor}>
            {achievedPercent === "--" ? (
              "--"
            ) : (
              <>
                {achievedPercentParts.number}
                {achievedPercentParts.symbol && (
                  <PercentSymbol $color={gaugeColor}>
                    {achievedPercentParts.symbol}
                  </PercentSymbol>
                )}
              </>
            )}
          </PercentValue>
        </AchievedContainer>
        <Target>{secondaryLabel || "Achieved"}</Target>
      </TargetContainer>
    </DonutChartFooter>
  );
};

/**
 * DonutChart component with single and dual gauge variants
 * @param props - Component props containing chart configuration
 * @returns JSX element for the donut chart
 */
const DonutChart: React.FC<DonutGraphProps> = ({ config, onclickDonut }) => {
  const { localizationData } = useLocalization();

  if (!config) {
    return <div data-testid="no-config-error">Oops! No config provided.</div>;
  }

  const {
    subtitle,
    count,
    target,
    brokerageAmount,
    variant = "single",
    primaryColor = "red", // Blue for target
    secondaryColor = "#22C55E", // Green for achieved
  } = config;

  // Handle dual gauge variant (for Premium chart)
  if (variant === "dual") {
    const gaugeSize = getGaugeSize(Math.max(target || 0, brokerageAmount || 0));

    // For dual variant, we show target and brokerage amount side by side
    const maxValue = Math.max(target || 0, brokerageAmount || 0);

    const rawTargetPct =
      typeof target === "number" && maxValue > 0
        ? (target / maxValue) * 100
        : 0;

    const rawAchievedPct =
      typeof brokerageAmount === "number" && maxValue > 0
        ? (brokerageAmount / maxValue) * 100
        : 0;

    let targetPercent = cleanPercent(rawTargetPct);
    let achievedPercent = cleanPercent(rawAchievedPct);

    let tColor = primaryColor;
    let aColor = secondaryColor;

    if (
      achievedPercent + EPS >= targetPercent ||
      achievedPercent + EPS >= 100
    ) {
      tColor = aColor;
      targetPercent = achievedPercent;
    }

    const option = createDualGaugeOption(
      config,
      targetPercent,
      achievedPercent,
      tColor,
      aColor
    );

    return (
      <DonutChartWrapper data-testid="donut-chart-dual">
        <ChartWrapper gaugeSize={gaugeSize}>
          <ReactECharts
            option={option}
            style={{ width: "170px", height: "170px" }}
            notMerge
            lazyUpdate
          />
        </ChartWrapper>
        {renderSingleGaugeFooter(config, localizationData, "black")}
      </DonutChartWrapper>
    );
  }

  // Handle single gauge variant (existing logic for other charts)
  const percent =
    typeof brokerageAmount === "number" &&
    typeof target === "number" &&
    target > 0
      ? Math.min((brokerageAmount / target) * 100, 100)
      : 100;

  const gaugeValue = brokerageAmount !== undefined ? brokerageAmount : count;
  const gaugeSize = getGaugeSize(gaugeValue);

  const achievedPercentValue =
    typeof brokerageAmount === "number" &&
    typeof target === "number" &&
    target > 0
      ? (brokerageAmount / target) * 100
      : 0;

  const gaugeColor = getGaugeColor(achievedPercentValue, target);
  const isClickableChart = ["Total", "New Business", "Retention", "Mined"].includes(subtitle ?? "");
  const textColor =
    isClickableChart ? theme.palette.button.secondary : "#000";
  const fontWeight =
    isClickableChart ? theme.typography.fontWeightBold : "500";
  const option = createSingleGaugeOption(
    config,
    percent,
    gaugeColor,
    textColor,
    fontWeight
  );

  function handleTotalGraphClick(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
    if (isClickableChart) {
      onclickDonut?.();
    }
  }

  return (
    <DonutChartWrapper
      data-testid="donut-chart-single"
      isTotalGraph={isClickableChart}
    >
      <ChartWrapper
        gaugeSize={gaugeSize}
        onClick={handleTotalGraphClick}
        isTotalGraph={isClickableChart}
      >
        <ReactECharts
          option={option}
          style={{ width: "170px", height: "170px" }}
          notMerge
          lazyUpdate
        />
      </ChartWrapper>
      {renderSingleGaugeFooter(config, localizationData, gaugeColor)}
    </DonutChartWrapper>
  );
};

export default DonutChart;
