import React from "react";
import BusinessPerformanceBarChartCommon, {
  BusinessPerformanceBarChartProps,
} from "./BusinessPerformanceBarChartCommon";

const BusinessPerformanceBarChart: React.FC<
  BusinessPerformanceBarChartProps
> = (props) => {
  return <BusinessPerformanceBarChartCommon {...props} />;
};

export default BusinessPerformanceBarChart;
