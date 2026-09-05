import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useTheme } from "@mui/material/styles";

type EChartsOption = echarts.EChartsOption;

const INDICATOR_COLORS: Record<string, string> = {
  GREEN: "#4CAF50",
  YELLOW: "#FFEB3B",
  ORANGE: "#FF7104",
  RED: "#F44336",
};

interface ServiceScoreScatterChartProps {
  // Month labels, e.g. ["Apr2026", "May2026", ...] — one per point, index-matched to `yAxis`.
  xAxis: string[];
  // Score percentage per month (10-100 range), index-matched to `xAxis`.
  yAxis: number[];
  indicator?: string[];
  width?: number | string;
  height?: number;
  title?: string;
}

function ServiceScoreScatterChart({
  xAxis,
  yAxis,
  indicator,
  width = "100%",
  height = 360,
  title = "Service Score",
}: ServiceScoreScatterChartProps) {
  const theme = useTheme();

  const spacedXAxis = xAxis.map((label) =>
    label.replace(/^([A-Za-z]+)(\d+)$/, "$1 $2")
  );

  const option: EChartsOption = {
    textStyle: {
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.text.primary,
    },
    tooltip: {
      trigger: "item",
      textStyle: { fontFamily: theme.typography.fontFamily },
      formatter: (params: any) =>
        `${params.name}<br/>Score: ${params.value}%`,
    },
    grid: {
      left: "6%",
      right: "4%",
      top: "6%",
      bottom: "24%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: spacedXAxis,
      name: "Period",
      nameLocation: "middle",
      nameGap: 55,
      nameTextStyle: { fontSize: 13 },
      axisLabel: { rotate: 45, margin: 12, fontSize: 12 },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      name: "Score (%)",
      nameLocation: "middle",
      nameGap: 40,
      min: 0,
      max: 100,
      interval: 10,
      nameTextStyle: { fontSize: 13 },
      axisLabel: { formatter: "{value}%", fontSize: 12 },
      axisLine: { show: true },
      splitLine: { show: false },
    },
    series: [
      {
        name: title,
        type: "scatter",
        symbolSize: 10,
        data: yAxis.map((value, i) => ({
          value,
          itemStyle: {
            color:
              INDICATOR_COLORS[indicator?.[i] ?? ""] ??
              theme.palette.primary.main,
          },
        })),
      },
    ],
  };

  return (
    <div
      style={{
        position: "relative",
        width: typeof width === "number" ? `${width}px` : width,
        height: `${height}px`,
      }}
    >
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}

export default ServiceScoreScatterChart;
