import React from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { formatNumberShort, useLocalization } from "@ui/ui-lib";

type EChartsOption = echarts.EChartsOption;

interface PieChartData {
  value: number;
  name: string;
  premium?: number;
  brokerage?: number;
  endorsementCount?: number;
  itemStyle?: echarts.ItemStyleOption;
}

interface PieChartProps {
  data: PieChartData[];
  width?: number;
  height?: number;
  title?: string;
  subTitle?: string;
  seriesName?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  tooltipFormatter?: (params: {
    data: PieChartData;
    value: number;
    name: string;
    percent: number;
  }) => string;
  tooltipPosition?: (context: {
    point: [number, number];
    contentSize: { width: number; height: number };
    viewSize: { width: number; height: number };
  }) => [number, number];
  pieCenter?: [string, string];
  pieRadius?: string | [string, string];
  showTooltip?: boolean;
  pieLabelFormatter?: string;
  pieLabelFontSize?: number;
  pieLabelOverflow?: "none" | "truncate" | "break" | "breakAll";
  hideLabelOverlap?: boolean;
  pieLabelWidth?: number;
  showAllLabels?: boolean;
  showLegend?: boolean;
  pieLabelEdgeDistance?: number;
  pieLabelLineLength?: number;
  pieLabelLineLength2?: number;
  highlightedSliceName?: string | null;
  dimmedOpacity?: number;
  emphasisScale?: boolean;
  emphasisScaleSize?: number;
  emphasisShadowBlur?: number;
  emphasisShadowColor?: string;
  emphasisBorderWidth?: number;
  emphasisBorderColor?: string;
}

function PieChart({
  data,
  width = 400,
  height = 300,
  title = "",
  subTitle = "",
  seriesName = "Data",
  onEvents,
  tooltipFormatter,
  tooltipPosition,
  pieCenter = ["50%", "40%"],
  pieRadius = "50%",
  showTooltip = true,
  pieLabelFormatter = "{b}: {c} ({d}%)",
  pieLabelFontSize = 12,
  pieLabelOverflow = "none",
  hideLabelOverlap = false,
  pieLabelWidth,
  showAllLabels = false,
  showLegend = true,
  pieLabelEdgeDistance = 10,
  pieLabelLineLength = 18,
  pieLabelLineLength2 = 28,
  highlightedSliceName = null,
  dimmedOpacity = 0.28,
  emphasisScale = true,
  emphasisScaleSize = 8,
  emphasisShadowBlur = 10,
  emphasisShadowColor = "black",
  emphasisBorderWidth = 0,
  emphasisBorderColor = "transparent",
}: PieChartProps) {
  const { localizationData } = useLocalization();
  const localization = localizationData?.data;

  const chartData = highlightedSliceName
    ? data.map((item) => ({
        ...item,
          itemStyle: {
            ...item.itemStyle,
            opacity: item.name === highlightedSliceName ? 1 : dimmedOpacity,
          },
        }))
    : data;

  const option: EChartsOption = {
    title: {
      text: title,
      subtext: subTitle,
      left: "left",
    },
    tooltip: {
      show: showTooltip,
      trigger: "item",
      formatter: (params: {
        data: PieChartData;
        value: number;
        name: string;
        percent: number;
      }) => {
        if (tooltipFormatter) {
          return tooltipFormatter(params);
        }
        const dataItem = params.data as PieChartData;
        const premiumText = dataItem.premium
          ? `Premium: ${formatNumberShort(dataItem.premium, localization)}<br/>`
          : "";
        const brokerageText = dataItem.brokerage
          ? `Brokerage: ${formatNumberShort(
              dataItem.brokerage,
              localization
            )}<br/>`
          : "";
        return `${premiumText}${brokerageText}Count: ${dataItem.value}`;
      },
      position: tooltipPosition
        ? (
            point: number[],
            _params: unknown,
            _dom: unknown,
            _rect: unknown,
            size: { contentSize: number[]; viewSize: number[] }
          ) =>
            tooltipPosition({
              point: [point[0], point[1]],
              contentSize: {
                width: size.contentSize[0],
                height: size.contentSize[1],
              },
              viewSize: {
                width: size.viewSize[0],
                height: size.viewSize[1],
              },
            })
        : undefined,
    },
    legend: showLegend
      ? {
          orient: "horizontal",
          left: "center",
          bottom: "10%",
        }
      : undefined,
    series: [
      {
        name: seriesName,
        type: "pie",
        radius: pieRadius,
        center: pieCenter,
        avoidLabelOverlap: showAllLabels ? true : hideLabelOverlap,
        data: chartData,
        emphasis: {
          scale: emphasisScale,
          scaleSize: emphasisScaleSize,
          itemStyle: {
            shadowBlur: emphasisShadowBlur,
            shadowOffsetX: 0,
            shadowColor: emphasisShadowColor,
            borderWidth: emphasisBorderWidth,
            borderColor: emphasisBorderColor,
          },
        },
        label: {
          show: true,
          formatter: pieLabelFormatter,
          fontSize: pieLabelFontSize,
          overflow: pieLabelOverflow,
          width: pieLabelWidth,
          alignTo: showAllLabels ? "edge" : undefined,
          edgeDistance: showAllLabels ? pieLabelEdgeDistance : undefined,
          bleedMargin: showAllLabels ? 4 : undefined,
        },
        labelLayout: showAllLabels
          ? {
              hideOverlap: false,
              moveOverlap: "shiftY",
            }
          : undefined,
        labelLine: {
          show: true,
          length: pieLabelLineLength,
          length2: pieLabelLineLength2,
          smooth: false,
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: `${width}px`, height: `${height}px` }}
      opts={{ renderer: 'canvas' }}
      onEvents={onEvents}
    />
  );
}

export default PieChart;