import React, { useMemo, useCallback, memo } from "react";
import ReactECharts from "echarts-for-react";
import { Box, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  emptyStateStyles,
  chartTitleStyle,
  tooltipStyle,
  gridStyle,
  xAxisLabelStyle,
  xAxisTextStyle,
  xAxisLineStyle,
  yAxisLabelStyle,
  yAxisTextStyle,
  yAxisLineStyle,
  splitLineStyle,
  barLabelStyle,
  barEmphasisStyle,
  animationConfig,
  tooltipFormatterStyle,
  gridConfigStyle,
  dataZoomConfigStyle,
  chartContainerWithPositionStyles,
  reactEChartsWrapperStyles,
  descriptionContainerStyles,
  descriptionTextStyles,
  descriptionIconStyles,
} from "./styles";

export interface EChartsBarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface EChartsBarChartConfig {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showValues?: boolean;
  showLabels?: boolean;
  height?: number;
  maxValue?: number;
  colorScheme?: string[];
  useLogScale?: boolean;
  maxBarsToShow?: number;
}

interface EChartsBarChartProps {
  data: EChartsBarChartData[];
  config?: EChartsBarChartConfig;
  onDataPointClick?: (data: EChartsBarChartData, index: number) => void;
  className?: string;
  testId?: string;
}

interface EChartsFormatterParams {
  name: string;
  value: number;
  dataIndex: number;
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
];

const formatLargeNumber = (value: number): string => {
  if (value === 0) return "0";

  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(1)}T`;
  } else if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(1)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(1)}K`;
  } else if (absValue >= 1) {
    return `${sign}${absValue.toFixed(2)}`;
  } else {
    return `${sign}${absValue.toFixed(4)}`;
  }
};

const formatTooltipNumber = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const calculateSimpleScale = (
  data: EChartsBarChartData[],
  useLogScale: boolean
) => {
  if (!data.length) return { min: 0, max: 100 };

  const values = data.map((item) => item.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  if (useLogScale && minValue > 0) {
    return {
      min: Math.pow(10, Math.floor(Math.log10(minValue))),
      max: Math.pow(10, Math.ceil(Math.log10(maxValue))),
    };
  }

  return {
    min: Math.min(0, minValue * 0.9),
    max: maxValue * 1.1,
  };
};

const EChartsBarChart: React.FC<EChartsBarChartProps> = memo(
  ({ data, config = {}, onDataPointClick, className, testId }) => {
    const {
      title = "Bar Chart",
      xAxisLabel = "Categories",
      yAxisLabel = "Values",
      showValues = true,
      height = 400,
      colorScheme = DEFAULT_COLORS,
      maxValue,
      useLogScale = false,
      maxBarsToShow = 100,
    } = config;
    const isValidData = useMemo(() => {
      return (
        data &&
        Array.isArray(data) &&
        data.length > 0 &&
        data.every(
          (item) =>
            typeof item.label === "string" &&
            typeof item.value === "number" &&
            !isNaN(item.value)
        )
      );
    }, [data]);

    const processedData = useMemo(() => {
      if (!isValidData) return [];

      const sortedData = [...data].sort((a, b) => b.value - a.value);

      return sortedData.slice(0, maxBarsToShow);
    }, [data, isValidData, maxBarsToShow]);

    const chartData = useMemo(() => {
      if (!isValidData) return [];

      return processedData.map((item, index) => ({
        name: item.label,
        value: item.value,
        itemStyle: {
          color: item.color || colorScheme[index % colorScheme.length],
        },
      }));
    }, [processedData, colorScheme, isValidData]);

    const scaleConfig = useMemo(() => {
      if (maxValue !== undefined) return { min: 0, max: maxValue };
      if (!isValidData) return { min: 0, max: 100 };
      return calculateSimpleScale(processedData, useLogScale);
    }, [processedData, maxValue, useLogScale, isValidData]);

    const tooltipFormatter = useCallback(
      (params: EChartsFormatterParams[]) => {
        const data = params[0];
        const originalLabel = processedData[data.dataIndex]?.label || data.name;
        const formattedValue = formatTooltipNumber(data.value);
        const maxWidth = tooltipFormatterStyle.maxWidth;
        const wordWrap = tooltipFormatterStyle.wordWrap;
        return `<div style="max-width: ${maxWidth}; word-wrap: ${wordWrap};">
        <strong>${originalLabel}</strong><br/>
        Value: ${formattedValue}
      </div>`;
      },
      [processedData]
    );

    const labelFormatter = useCallback((params: EChartsFormatterParams) => {
      return formatLargeNumber(params.value);
    }, []);

    const handleDataPointClick = useCallback(
      (params: any) => {
        if (onDataPointClick && params.dataIndex !== undefined) {
          const originalData = processedData[params.dataIndex];
          onDataPointClick(originalData, params.dataIndex);
        }
      },
      [onDataPointClick, processedData]
    );

    if (!isValidData) {
      return (
        <Box
          sx={{
            ...emptyStateStyles,
            height: height,
          }}
          className={className}
          data-testid={testId}
          role="img"
          aria-label="No data available for bar chart"
        >
          No data available
        </Box>
      );
    }

    const option = useMemo(
      () => ({
        title: {
          text: title,
          left: "center",
          textStyle: chartTitleStyle,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "none",
          },
          formatter: tooltipFormatter,
          ...tooltipStyle,
          confine: true,
          appendToBody: true,
        },
        grid: {
          ...gridStyle,
          ...gridConfigStyle,
        },
        dataZoom: [
          {
            ...dataZoomConfigStyle,
            show: processedData.length > 10,
            end:
              processedData.length > 10
                ? (10 / processedData.length) * 100
                : 100,
            minSpan:
              processedData.length > 10
                ? (10 / processedData.length) * 100
                : 100,
            maxSpan:
              processedData.length > 10
                ? (10 / processedData.length) * 100
                : 100,
          },
        ],
        xAxis: {
          type: "category",
          data: processedData.map((item) =>
            item.label.length > 10
              ? `${item.label.substring(0, 10)}...`
              : item.label
          ),
          name: xAxisLabel,
          nameLocation: "middle",
          nameGap: 80,
          nameTextStyle: {
            ...xAxisLabelStyle,
          },
          axisLabel: {
            textStyle: {
              ...xAxisTextStyle,
              fontSize: processedData.length > 15 ? 9 : 10,
            },
            rotate: processedData.length > 8 ? 45 : 0,
            interval: processedData.length > 15 ? "auto" : 0,
            margin: 8,
          },
          axisLine: {
            lineStyle: xAxisLineStyle,
          },
        },
        yAxis: {
          type: useLogScale ? "log" : "value",
          name: yAxisLabel,
          nameLocation: "middle",
          nameGap: 70,
          nameTextStyle: yAxisLabelStyle,
          axisLabel: {
            formatter: (value: number) => formatLargeNumber(value),
            textStyle: yAxisTextStyle,
          },
          axisLine: {
            lineStyle: yAxisLineStyle,
          },
          splitLine: {
            lineStyle: splitLineStyle,
          },
          min: scaleConfig.min,
          max: scaleConfig.max,
          ...(useLogScale && { logBase: 10 }),
        },
        series: [
          {
            type: "bar",
            data: chartData,
            barWidth: "90%",
            barCategoryGap: "2%",
            label: {
              show: showValues,
              position: "top",
              formatter: labelFormatter,
              textStyle: {
                ...barLabelStyle,
                fontSize: 10,
              },
              distance: 8,
              rotate: 0,
            },
            emphasis: {
              itemStyle: barEmphasisStyle,
            },
            ...animationConfig,
          },
        ],
        ...animationConfig,
      }),
      [
        title,
        xAxisLabel,
        yAxisLabel,
        showValues,
        processedData,
        chartData,
        scaleConfig,
        tooltipFormatter,
        labelFormatter,
      ]
    );

    const hasSlider = processedData.length > 10;
    const hasClickHandler = !!onDataPointClick;

    return (
      <>
        <Box
          sx={{
            ...chartContainerWithPositionStyles,
            height: height,
          }}
          className={className}
          data-testid={testId}
          role="img"
          aria-label={`Bar chart showing ${processedData.length} data points${
            data.length > maxBarsToShow
              ? ` (showing top ${maxBarsToShow} of ${data.length} total, sorted high to low)`
              : " (sorted high to low)"
          }`}
        >
          <ReactECharts
            option={option}
            style={reactEChartsWrapperStyles}
            opts={{
              renderer: "canvas",
              height: height,
            }}
            onEvents={{
              click: handleDataPointClick,
            }}
            notMerge={true}
            lazyUpdate={true}
          />
        </Box>
        <Box sx={descriptionContainerStyles}>
          <Typography sx={descriptionTextStyles}>
            <InfoOutlinedIcon sx={descriptionIconStyles} />
            <span>
              Hover over bars to see detailed values.
              {hasSlider &&
                " Use the slider below the chart to navigate through different data points."}
              {hasClickHandler && " Click on any bar to view more details."}
            </span>
          </Typography>
        </Box>
      </>
    );
  }
);

export default EChartsBarChart;
