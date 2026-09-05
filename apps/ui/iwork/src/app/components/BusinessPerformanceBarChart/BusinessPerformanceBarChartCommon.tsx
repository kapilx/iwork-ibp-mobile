import React from "react";
import { CircularProgress, Typography } from "@mui/material";
import { DonutGraphConfig } from "../DonutChart/types";
import DashboardSection from "../BusinessPerformance/common/DashboardSection";
import BusinessPerformanceMetricComparisonView, {
  HorizontalBarChartItem,
  HorizontalBarChartSeries,
} from "./BusinessPerformanceMetricComparisonView";
import { BUSINESS_PERFORMANCE_BAR_CHART_CONFIG } from "./constants";
import {
  WidgetBox,
  ChartPanel,
  NoDataContent,
  LoadingContainer,
  ErrorContainer,
} from "./styles";

export interface BusinessPerformanceBarChartProps {
  title: string;
  data?: { data?: unknown[] };
  isLoading: boolean;
  error?: unknown;
  chartsData: DonutGraphConfig[];
  onclickBar?: () => void;
  showNotApplicablePlaceholder?: boolean;
}

const BusinessPerformanceBarChartCommon: React.FC<
  BusinessPerformanceBarChartProps
> = ({
  title,
  data,
  isLoading,
  error,
  chartsData,
  onclickBar,
  showNotApplicablePlaceholder = false,
}) => {
  const includedMetrics = new Set<string>(
    Object.keys(BUSINESS_PERFORMANCE_BAR_CHART_CONFIG.metrics)
  );
  const chartItems: HorizontalBarChartItem[] = chartsData
    .filter((chart) => includedMetrics.has(chart.subtitle))
    .map((chart) => ({
      label:
        BUSINESS_PERFORMANCE_BAR_CHART_CONFIG.metrics[chart.subtitle] ||
        chart.subtitle,
      values: {
        target: chart.target || 0,
        achieved: chart.brokerageAmount || 0,
      },
    }));
  const chartItemsToRender: HorizontalBarChartItem[] = showNotApplicablePlaceholder
    ? chartItems.map((item) => ({
        ...item,
        values: {
          target: 0,
          achieved: 0,
        },
      }))
    : chartItems;
  const chartSeries: HorizontalBarChartSeries[] = showNotApplicablePlaceholder
    ? BUSINESS_PERFORMANCE_BAR_CHART_CONFIG.series.map((series) => ({
        ...series,
        valueFormatter: () => "--",
      }))
    : [...BUSINESS_PERFORMANCE_BAR_CHART_CONFIG.series];
  const noData =
    !data?.data ||
    (Array.isArray(data?.data) && data?.data.length === 0) ||
    !chartsData?.some((chart) => includedMetrics.has(chart.subtitle));

  return (
    <DashboardSection
      heading={title}
      subHeading={BUSINESS_PERFORMANCE_BAR_CHART_CONFIG.subtitle}
      hideHeader={true}
      isLoading={isLoading}
      hasError={Boolean(error)}
      hasNoData={!showNotApplicablePlaceholder && noData}
      loadingContent={
        <LoadingContainer>
          <CircularProgress />
        </LoadingContainer>
      }
      errorContent={
        <ErrorContainer>
          <Typography color="error">
            {BUSINESS_PERFORMANCE_BAR_CHART_CONFIG.errorMessage}
          </Typography>
        </ErrorContainer>
      }
      noDataContent={
        <NoDataContent>
          {BUSINESS_PERFORMANCE_BAR_CHART_CONFIG.noDataMessage}
        </NoDataContent>
      }
    >
      <WidgetBox>
        <ChartPanel>
          <BusinessPerformanceMetricComparisonView
            items={chartItemsToRender}
            series={chartSeries}
            onBarClick={() => onclickBar?.()}
            xAxisFormatter={showNotApplicablePlaceholder ? () => "--" : undefined}
            showTooltip={!showNotApplicablePlaceholder}
            showZeroValueAsPlaceholder={showNotApplicablePlaceholder}
          />
        </ChartPanel>
      </WidgetBox>
    </DashboardSection>
  );
};

export default BusinessPerformanceBarChartCommon;
