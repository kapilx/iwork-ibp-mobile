import React from "react";
import { SxProps, Theme } from "@mui/material";

// Container and wrapper styles
export const emptyStateStyles: SxProps<Theme> = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9CA3AF",
  fontSize: "16px",
  fontWeight: 500,
};

export const chartContainerStyles: SxProps<Theme> = {
  width: "100%",
  padding: "2%",
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  overflow: "hidden",
  position: "relative",
};

export const chartWrapperStyles: React.CSSProperties = {
  height: "100%",
  width: "100%",
};

// ECharts configuration styles
export const chartTitleStyle = {
  fontSize: 18,
  fontWeight: 600,
  color: "#1F2937",
};

export const tooltipStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderColor: "#E5E7EB",
  borderWidth: 1,
  textStyle: {
    color: "#374151",
    fontSize: 12,
  },
  padding: [10, 15],
  extraCssText: "max-width: 350px; word-wrap: break-word; white-space: normal;",
};

export const gridStyle = {
  left: "8%",
  right: "8%",
  bottom: "25%",
  top: "20%",
  containLabel: true,
};

export const xAxisLabelStyle = {
  fontSize: 12,
  color: "#6B7280",
};

export const xAxisTextStyle = {
  color: "#374151",
};

export const xAxisLineStyle = {
  color: "#E5E7EB",
};

export const yAxisLabelStyle = {
  fontSize: 12,
  color: "#6B7280",
};

export const yAxisTextStyle = {
  color: "#6B7280",
};

export const yAxisLineStyle = {
  color: "#E5E7EB",
};

export const splitLineStyle = {
  color: "#F3F4F6",
};

export const barLabelStyle = {
  color: "#374151",
  fontSize: 10,
  fontWeight: 500,
  fontFamily: "monospace",
};

export const barEmphasisStyle = {
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowColor: "rgba(0, 0, 0, 0.5)",
};

export const animationConfig = {
  animation: true,
  animationDuration: 1000,
  animationEasing: "cubicOut" as const,
};

export const dataZoomStyle = {
  cursor: "pointer",
  "&:hover": {
    cursor: "pointer",
  },
};

export const tooltipFormatterStyle = {
  maxWidth: "300px",
  wordWrap: "break-word" as const,
};

export const gridConfigStyle = {
  bottom: "25%",
  top: "20%",
  right: "12%",
  left: "15%",
};

export const dataZoomConfigStyle = {
  type: "slider" as const,
  xAxisIndex: [0],
  start: 0,
  bottom: "8%",
  height: 15,
  handleStyle: {
    color: "#3B82F6",
    borderColor: "#3B82F6",
    borderWidth: 1,
  },
  textStyle: {
    color: "#6B7280",
    fontSize: 10,
  },
  emphasis: {
    handleStyle: {
      color: "#2563EB",
      borderColor: "#2563EB",
      borderWidth: 2,
    },
  },
};

export const chartContainerWithPositionStyles: SxProps<Theme> = {
  ...chartContainerStyles,
  position: "relative",
  overflow: "hidden",
  "& .echarts-for-react": {
    ...dataZoomStyle,
  },
  "& .echarts-for-react canvas": {
    cursor: "pointer",
  },
  "& .echarts-for-react *": {
    cursor: "pointer",
  },
};

export const reactEChartsWrapperStyles: React.CSSProperties = {
  ...chartWrapperStyles,
  height: "100%",
  width: "100%",
};

export const descriptionContainerStyles: SxProps<Theme> = {
  padding: "8px 16px",
  backgroundColor: "#F9FAFB",
  borderRadius: "0 0 8px 8px",
  marginTop: "8px",
};

export const descriptionTextStyles: SxProps<Theme> = {
  fontSize: "12px",
  color: "#6B7280",
  lineHeight: "1.5",
  display: "flex",
  alignItems: "flex-start",
  gap: "4px",
};

export const descriptionIconStyles: SxProps<Theme> = {
  fontSize: "16px",
  color: "#3B82F6",
  marginTop: "1px",
};
