import React from "react";
import { SxProps, Theme } from "@mui/material";

// Empty state styles
export const emptyStateStyles: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  color: "#6B7280",
  fontSize: "14px",
  fontWeight: 500,
  minHeight: "200px",
};

export const chartWrapperStyles: SxProps<Theme> = {
  width: "100%",
  height: "100%",
  minHeight: "200px",
};

// Chart title style
export const chartTitleStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: "#111827",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

// Tooltip style
export const tooltipStyle = {
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  borderColor: "transparent",
  borderRadius: "6px",
  textStyle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  padding: [8, 12],
  extraCssText:
    "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);",
};

// Pie label style
export const pieLabelStyle = {
  fontSize: 10,
  fontWeight: 600,
  color: "#1F2937",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: 1.3,
  overflow: "break",
  width: 150,
  textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  textAlign: "left",
};

// Pie emphasis style (hover effects)
export const pieEmphasisStyle = {
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowColor: "rgba(0, 0, 0, 0.2)",
  scale: true,
  scaleSize: 5,
};

export const animationConfig = {
  animation: true,
  animationDuration: 1000,
  animationEasing: "cubicOut",
  animationDelay: (idx: number) => idx * 100,
  animationDurationUpdate: 500,
  animationEasingUpdate: "cubicInOut",
};

export const reactEChartsWrapperStyles: React.CSSProperties = {
  width: "100%",
  padding: "5px 0px",
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  overflow: "hidden",
  position: "relative",
  height: "100%",
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
  lineHeight: "1.8",
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
};

export const descriptionIconStyles: SxProps<Theme> = {
  marginTop: "3px",
  fontSize: "16px",
  color: "#3B82F6",
  flexShrink: 0,
};

export const legendExampleStyles: SxProps<Theme> = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 6px",
  backgroundColor: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "4px",
  marginLeft: "4px",
  marginRight: "4px",
  verticalAlign: "middle",
};

export const legendColorBoxStyles: SxProps<Theme> = {
  width: "12px",
  height: "12px",
  backgroundColor: "#3B82F6",
  borderRadius: "2px",
};

export const legendTextStyles: SxProps<Theme> = {
  fontSize: "11px",
  color: "#374151",
  fontWeight: 500,
};
