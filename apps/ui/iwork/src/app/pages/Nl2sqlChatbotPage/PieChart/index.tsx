import React, { useMemo, useCallback, memo } from "react";
import ReactECharts from "echarts-for-react";
import { Box, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  emptyStateStyles,
  chartTitleStyle,
  tooltipStyle,
  pieLabelStyle,
  pieEmphasisStyle,
  animationConfig,
  reactEChartsWrapperStyles,
  descriptionContainerStyles,
  descriptionTextStyles,
  descriptionIconStyles,
  legendExampleStyles,
  legendColorBoxStyles,
  legendTextStyles,
} from "./styles.js";

export interface EChartsPieChartData {
  label: string;
  value: number;
  color?: string;
}

export interface EChartsPieChartConfig {
  title?: string;
  showValues?: boolean;
  showLabels?: boolean;
  height?: number;
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
  colorScheme?: string[];
  innerRadius?: number;
  outerRadius?: number;
  maxBarsToShow?: number;
  maxLabelLength?: number;
}

interface EChartsPieChartProps {
  data: EChartsPieChartData[];
  config?: EChartsPieChartConfig;
  onDataPointClick?: (data: EChartsPieChartData, index: number) => void;
  className?: string;
  testId?: string;
}

interface EChartsFormatterParams {
  name: string;
  value: number;
  dataIndex: number;
  percent: number;
}

const DEFAULT_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#6366F1",
];

const EChartsPieChart: React.FC<EChartsPieChartProps> = memo(
  ({ data, config = {}, onDataPointClick, className, testId }) => {
    const {
      title = "Pie Chart",
      showValues = true,
      showLabels = true,
      height = 200,
      showLegend = true,
      legendPosition = "bottom",
      colorScheme = DEFAULT_COLORS,
      innerRadius = 0,
      outerRadius = "60%",
      maxBarsToShow = 20,
      maxLabelLength = 50,
    } = config;

    const adjustedOuterRadius = useMemo(() => {
      if (showLabels || showValues) {
        return typeof outerRadius === "string"
          ? `${parseInt(outerRadius.replace(/%/g, "")) - 10}%`
          : outerRadius;
      }
      return outerRadius;
    }, [outerRadius, showLabels, showValues]);

    const isValidData = useMemo(() => {
      return (
        data &&
        Array.isArray(data) &&
        data.length > 0 &&
        data.every(
          (item) =>
            typeof item.label === "string" &&
            typeof item.value === "number" &&
            !isNaN(item.value) &&
            item.value > 0
        )
      );
    }, [data]);
    const chartData = useMemo(() => {
      if (!isValidData) return [];

      const filteredData = data.filter((item) => {
        if (
          !item.label ||
          item.label.trim() === "" ||
          ["nil", "null", "undefined", "na", "n/a"].includes(
            item.label.toLowerCase()
          )
        ) {
          return false;
        }
        if (isNaN(item.value) || item.value <= 0) {
          return false;
        }
        return true;
      });

      const limitedData = filteredData.slice(0, maxBarsToShow);

      return limitedData.map((item, index) => ({
        name: item.label,
        value: item.value,
        itemStyle: {
          color: item.color || colorScheme[index % colorScheme.length],
        },
      }));
    }, [data, colorScheme, isValidData, maxBarsToShow]);

    const dynamicHeight = useMemo(() => {
      const titleSpacing = 30;
      const baseHeight = height + titleSpacing;

      if (!showLegend || legendPosition !== "bottom") {
        return baseHeight;
      }

      if (chartData.length > 8) {
        return baseHeight + 120;
      }

      const legendItemsPerRow = 4;
      const legendRows = Math.ceil(chartData.length / legendItemsPerRow);
      const legendHeight = legendRows * 35 + 80;

      return Math.max(baseHeight, baseHeight + legendHeight);
    }, [height, showLegend, legendPosition, chartData.length]);

    const tooltipFormatter = useCallback((params: EChartsFormatterParams) => {
      const { name, value, percent } = params;
      return `${name}: ${value.toLocaleString()} (${percent.toFixed(1)}%)`;
    }, []);
    const truncateText = (text: string, maxLength: number = 15): string => {
      if (!text || text.length <= maxLength) {
        return text;
      }

      const words = text.split(" ");
      if (words.length > 1) {
        let truncated = "";
        for (const word of words) {
          if ((truncated + word).length <= maxLength) {
            truncated += (truncated ? " " : "") + word;
          } else {
            break;
          }
        }
        if (truncated.length > 0) {
          return truncated + "...";
        }
      }

      return text.substring(0, maxLength - 3) + "...";
    };

    const labelFormatter = useCallback(
      (params: EChartsFormatterParams) => {
        const { name, value } = params;

        if (showValues && showLabels) {
          const truncatedName = truncateText(name, 20);
          return `${truncatedName}: ${value.toLocaleString()}`;
        } else if (showValues) {
          return value.toLocaleString();
        } else if (showLabels) {
          return truncateText(name, maxLabelLength);
        }
        return "";
      },
      [showValues, showLabels, maxLabelLength]
    );
    const handleDataPointClick = useCallback(
      (params: any) => {
        if (onDataPointClick && params.dataIndex !== undefined) {
          const originalData = data[params.dataIndex];
          onDataPointClick(originalData, params.dataIndex);
        }
      },
      [onDataPointClick, data]
    );

    if (!isValidData) {
      return (
        <Box
          sx={{
            ...emptyStateStyles,
            height: dynamicHeight,
          }}
          className={className}
          data-testid={testId}
          role="img"
          aria-label="No data available for pie chart"
        >
          No data available
        </Box>
      );
    }

    // Memoized ECharts option configuration
    const option = useMemo(
      () => ({
        title: {
          text: title,
          left: "center",
          textStyle: chartTitleStyle,
        },
        tooltip: {
          trigger: "item",
          formatter: tooltipFormatter,
          ...tooltipStyle,
        },
          grid: {
            left: legendPosition === "left" ? "20%" : "5%",
            right: legendPosition === "right" ? "20%" : "5%",
            top: legendPosition === "top" ? "20%" : "15%",
            bottom: legendPosition === "bottom" ? "25%" : "5%",
            containLabel: false,
          },
        legend: {
          show: showLegend,
          orient:
            legendPosition === "top" || legendPosition === "bottom"
              ? "horizontal"
              : "vertical",
          left:
            legendPosition === "left"
              ? "left"
              : legendPosition === "right"
              ? "right"
              : "center",
          top:
            legendPosition === "top"
              ? "top"
              : legendPosition === "bottom"
              ? "bottom"
              : "middle",
          data: chartData.map((item) => item.name),
          textStyle: {
            fontSize: 12,
            color: "#374151",
            overflow: "break",
            ellipsis: false,
            width: 150,
            lineHeight: 1.4,
          },
          itemGap: 15,
          itemWidth: 18,
          itemHeight: 14,
          padding: [10, 10, 30, 20],
          margin: [10, 10, 15, 10],
          ...(chartData.length > 8 && {
            type: "scroll",
            pageButtonItemGap: 5,
            pageButtonGap: 10,
            pageButtonPosition: "end",
            pageFormatter: "{current}/{total}",
            pageIconColor: "#3B82F6",
            pageIconInactiveColor: "#9CA3AF",
            pageIconSize: 12,
            pageTextStyle: {
              color: "#6B7280",
              fontSize: 10,
            },
          }),
        },
        series: [
          {
            type: "pie",
            radius: [innerRadius, adjustedOuterRadius],
            center: [
              "50%",
              legendPosition === "bottom" ? "45%" : "55%",
            ],
            data: chartData,
            label: {
              show: showLabels || showValues,
              formatter: labelFormatter,
              textStyle: pieLabelStyle,
              position: "outside",
              distanceToLabelLine: 5,
              alignTo: "none",
              bleedMargin: 5,
              overflow: "break",
              ellipsis: false,
              minAngle: 10,
              maxAngle: 180,
            },
            labelLine: {
              show: showLabels || showValues,
              length: 20,
              length2: 15,
              smooth: true,
              lineStyle: {
                color: "#D1D5DB",
                width: 1,
              },
            },
            emphasis: {
              itemStyle: pieEmphasisStyle,
              label: {
                show: true,
                fontSize: 11,
                fontWeight: "bold",
              },
              scale: true,
              scaleSize: 10,
            },
            ...animationConfig,
          },
        ],
        ...animationConfig,
      }),
      [
        title,
        showValues,
        showLabels,
        showLegend,
        legendPosition,
        innerRadius,
        adjustedOuterRadius,
        chartData,
        tooltipFormatter,
        labelFormatter,
      ]
    );

    const hasScrollableLegend = chartData.length > 8;
    const hasClickHandler = !!onDataPointClick;

    return (
      <>
        <ReactECharts
          option={option}
          style={reactEChartsWrapperStyles}
          opts={{
            renderer: "canvas",
            height: dynamicHeight,
          }}
          onEvents={{
            click: handleDataPointClick,
          }}
          notMerge={true}
          lazyUpdate={true}
        />
        <Box sx={descriptionContainerStyles}>
          <Box sx={descriptionTextStyles}>
            <InfoOutlinedIcon sx={descriptionIconStyles} />
            <Typography
              component="span"
              sx={{ fontSize: "12px", lineHeight: "1.8" }}
            >
              Hover over slices to see detailed values and percentages.
              {showLegend && (
                <>
                  {" "}
                  Click on legend items{" "}
                  <Box component="span" sx={legendExampleStyles}>
                    <Box sx={legendColorBoxStyles} />
                    <Typography component="span" sx={legendTextStyles}>
                      Category
                    </Typography>
                  </Box>{" "}
                  to show or hide categories from the chart.
                </>
              )}
              {hasScrollableLegend &&
                " Use the legend controls to navigate through multiple categories."}
              {hasClickHandler && " Click on any slice to view more details."}
            </Typography>
          </Box>
        </Box>
      </>
    );
  }
);

export default EChartsPieChart;
