import React from "react";
import ReactECharts from "echarts-for-react";
import { alpha, useTheme } from "@mui/material/styles";
import { formatLargeCurrency } from "@ui/ui-lib";

export interface HorizontalBarChartSeries {
  key: string;
  label: string;
  color: string;
  valueFormatter?: (value: number) => string;
  labelColor?: string;
  labelFontWeight?: number;
}

export interface HorizontalBarChartItem {
  label: string;
  values: Record<string, number>;
  itemColor?: string;
  meta?: Record<string, unknown>;
}

interface TooltipSeriesParam {
  name?: string;
  value?: number | null;
  color?: string;
  seriesName?: string;
  dataIndex?: number;
}

interface TooltipPositionContext {
  point: [number, number];
  params: TooltipSeriesParam[];
  contentSize: {
    width: number;
    height: number;
  };
  viewSize: {
    width: number;
    height: number;
  };
}

interface BarLabelParam {
  value?: number;
  dataIndex?: number;
}

export interface HorizontalBarChartClickPayload {
  label: string;
  item: HorizontalBarChartItem;
  rawEvent: unknown;
}

interface BusinessPerformanceMetricComparisonViewProps {
  items: HorizontalBarChartItem[];
  series: HorizontalBarChartSeries[];
  onBarClick?: (payload: HorizontalBarChartClickPayload) => void;
  height?: string | number;
  xAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (
    item: HorizontalBarChartItem,
    params: TooltipSeriesParam[]
  ) => string;
  tooltipPosition?: (context: TooltipPositionContext) => [number, number];
  tooltipTrigger?: "item" | "axis";
  showLegend?: boolean;
  yAxisLabelWidth?: number;
  showTooltip?: boolean;
  yAxisLabelFormatter?: (item: HorizontalBarChartItem) => string;
  showZeroValueAsPlaceholder?: boolean;
}

const defaultValueFormatter = (value: number) => formatLargeCurrency(value);

const buildGradient = (baseColor: string, horizontal = false) => ({
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: horizontal ? 1 : 0,
  y2: horizontal ? 0 : 1,
  colorStops: [
    {
      offset: 0,
      color: baseColor,
    },
    {
      offset: 1,
      color: alpha(baseColor, 0.5),
    },
  ],
});

const defaultTooltipFormatter = (
  item: HorizontalBarChartItem,
  params: TooltipSeriesParam[],
  seriesConfig: HorizontalBarChartSeries[]
) => {
  let tooltipHtml = `<div>
    <div style="font-weight: 700; margin-bottom: 8px; font-size: 13px; color: #111827;">${item.label}</div>`;

  params.forEach((param) => {
    if (param.value === undefined || param.value === null) {
      return;
    }

    const matchingSeries = seriesConfig.find(
      (seriesItem) => seriesItem.label === param.seriesName
    );
    const formatValue = matchingSeries?.valueFormatter ?? defaultValueFormatter;

    tooltipHtml += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
      <span style="display: inline-block; width: 10px; height: 10px; background-color: ${
        param.color
      }; margin-right: 8px; border-radius: 2px;"></span>
      <span style="color: #64748b; font-size: 12px;">${
        param.seriesName
      }: <strong style="color: #1f2937;">${formatValue(
      param.value
    )}</strong></span>
    </div>`;
  });

  tooltipHtml += `</div>`;
  return tooltipHtml;
};

const createUnifiedBarChartOption = ({
  items,
  series,
  xAxisFormatter,
  tooltipFormatter,
  tooltipPosition,
  tooltipTrigger,
  showLegend,
  yAxisLabelWidth,
  showTooltip,
  yAxisLabelFormatter,
  showZeroValueAsPlaceholder,
  theme,
}: Pick<
  BusinessPerformanceMetricComparisonViewProps,
  | "items"
  | "series"
  | "xAxisFormatter"
  | "tooltipFormatter"
  | "tooltipPosition"
  | "tooltipTrigger"
  | "showLegend"
  | "yAxisLabelWidth"
  | "showTooltip"
  | "yAxisLabelFormatter"
  | "showZeroValueAsPlaceholder"
> & {
  theme: ReturnType<typeof useTheme>;
}) => {
  const categories = items.map((item) =>
    yAxisLabelFormatter ? yAxisLabelFormatter(item) : item.label
  );

  return {
    tooltip:
      showTooltip === false
        ? { show: false }
        : {
            trigger: tooltipTrigger ?? (series.length > 1 ? "axis" : "item"),
            axisPointer: {
              type: "shadow",
            },
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.text.neutralwhite,
            borderWidth: 1,
            padding: 12,
            confine: true,
            extraCssText:
              "border-radius: 16px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);",
            textStyle: {
              color: theme.palette.text.primary,
              fontSize: 12,
            },
            formatter: (
              rawParams: TooltipSeriesParam | TooltipSeriesParam[]
            ) => {
              const params = Array.isArray(rawParams) ? rawParams : [rawParams];
              const item = items[params[0]?.dataIndex ?? 0];

              if (!item) {
                return "";
              }

              if (tooltipFormatter) {
                return tooltipFormatter(item, params);
              }

              return defaultTooltipFormatter(item, params, series);
            },
            position: tooltipPosition
              ? (
                  point: number[],
                  rawParams: TooltipSeriesParam | TooltipSeriesParam[],
                  _dom: unknown,
                  _rect: unknown,
                  size: {
                    contentSize: number[];
                    viewSize: number[];
                  }
                ) => {
                  const params = Array.isArray(rawParams)
                    ? rawParams
                    : [rawParams];

                  return tooltipPosition({
                    point: [point[0], point[1]],
                    params,
                    contentSize: {
                      width: size.contentSize[0],
                      height: size.contentSize[1],
                    },
                    viewSize: {
                      width: size.viewSize[0],
                      height: size.viewSize[1],
                    },
                  });
                }
              : undefined,
          },
    legend: showLegend
      ? {
          data: series.map((seriesItem) => seriesItem.label),
          top: 10,
          right: 20,
          textStyle: {
            color: theme.palette.text.lightGrey,
            fontSize: 12,
            fontWeight: 600,
          },
        }
      : undefined,
    grid: {
      left: "4%",
      right: series.length > 1 ? "10%" : "6%",
      bottom: "2%",
      top: showLegend ? "42px" : "16px",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.background.lightGrey,
          type: "dashed",
        },
      },
      axisLabel: {
        color: theme.palette.text.lightGrey,
        fontSize: 11,
        formatter: (value: number) =>
          xAxisFormatter ? xAxisFormatter(value) : defaultValueFormatter(value),
      },
    },
    yAxis: {
      type: "category",
      data: categories,
      triggerEvent: true,
      axisLine: {
        lineStyle: {
          color: theme.palette.text.neutralwhite,
        },
      },
      axisLabel: {
        color: theme.palette.text.linkBlue,
        fontSize: 12,
        fontWeight: 700,
        interval: 0,
        // rotate: categories.length > 3 ? 15 : 0,
        width: yAxisLabelWidth,
        overflow: yAxisLabelWidth ? "break" : undefined,
        lineHeight: yAxisLabelWidth ? 16 : undefined,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    series: series.map((seriesItem) => ({
      name: seriesItem.label,
      type: "bar",
      color: seriesItem.color,
      data: items.map((item) => ({
        value: item.values[seriesItem.key] ?? 0,
        itemStyle: {
          color: buildGradient(
            series.length === 1 && item.itemColor
              ? item.itemColor
              : seriesItem.color,
            series.length === 1
          ),
          borderRadius: series.length === 1 ? [0, 6, 6, 0] : [6, 6, 0, 0],
        },
      })),
      emphasis: {
        disabled: true,
      },
      barGap: "10%",
      barCategoryGap: "20%",
      barWidth: "auto",
      label: {
        show: true,
        position: "right",
        formatter: (params: BarLabelParam) => {
          if (showZeroValueAsPlaceholder && params.value === 0) {
            return "--";
          }
          if (!params.value) {
            return "";
          }

          const formatValue =
            seriesItem.valueFormatter ?? defaultValueFormatter;
          return formatValue(params.value);
        },
        color: seriesItem.labelColor ?? theme.palette.text.primary,
        fontSize: 10,
        fontWeight: seriesItem.labelFontWeight ?? 700,
      },
    })),
  };
};

const BusinessPerformanceMetricComparisonView: React.FC<
  BusinessPerformanceMetricComparisonViewProps
> = ({
  items,
  series,
  onBarClick,
  height = "220px",
  xAxisFormatter,
  tooltipFormatter,
  tooltipPosition,
  tooltipTrigger,
  showLegend = series.length > 1,
  yAxisLabelWidth,
  showTooltip = true,
  yAxisLabelFormatter,
  showZeroValueAsPlaceholder = false,
}) => {
  const theme = useTheme();

  return (
    <ReactECharts
      option={createUnifiedBarChartOption({
        items,
        series,
        xAxisFormatter,
        tooltipFormatter,
        tooltipPosition,
        tooltipTrigger,
        showLegend,
        yAxisLabelWidth,
        showTooltip,
        yAxisLabelFormatter,
        showZeroValueAsPlaceholder,
        theme,
      })}
      style={{ height, width: "100%" }}
      onEvents={{
        click: (event: { dataIndex?: number }) => {
          if (!onBarClick || event.dataIndex === undefined) {
            return;
          }

          const item = items[event.dataIndex];
          if (!item) {
            return;
          }

          onBarClick({
            label: item.label,
            item,
            rawEvent: event,
          });
        },
      }}
    />
  );
};

export default BusinessPerformanceMetricComparisonView;
