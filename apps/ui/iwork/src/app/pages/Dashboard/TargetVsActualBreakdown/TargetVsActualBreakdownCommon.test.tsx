import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import TargetVsActualBreakdownCommon from "./TargetVsActualBreakdownCommon";

// Every useApiQuery call records the URL it was handed, so the assertions below
// can read exactly what the widget asks the backend for.
const requestedUrls: string[] = [];

jest.mock("@ui/ui-lib", () => ({
  endPoints: {
    businessPerformanceQuarterlyData:
      "http://x/policy/quarterly-dashboard-business-performance",
    businessPerformanceSbuData:
      "http://x/policy/quarterly-dashboard-business-performance-by-sbu-basis",
    businessPerformanceData: "http://x/policy/new-dashboard-business-performance",
  },
  useApiQuery: ({ url }: { url: string }) => {
    requestedUrls.push(url);
    return { data: { data: [] }, isLoading: false, error: null };
  },
  formatLargeCurrency: (value: number) => String(value),
  useLocalization: () => ({ localizationData: { data: {} } }),
}));

jest.mock("../../../components/BusinessPerformance/common/DashboardSection", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("./BusinessPerformanceQuarterlyView", () => ({
  __esModule: true,
  default: () => <div />,
}));

const urlFor = (endpointFragment: string) =>
  requestedUrls.find((url) => url.includes(endpointFragment));

const quarterlyUrl = () => urlFor("business-performance?");
const sbuUrl = () => urlFor("by-sbu-basis");

describe("TargetVsActualBreakdownCommon query strings", () => {
  beforeEach(() => {
    requestedUrls.length = 0;
  });

  it("forwards the filter drawer's quarter to BOTH endpoints", () => {
    render(
      <TargetVsActualBreakdownCommon queryString="?financialYear=2025&quarter=Q2" />
    );

    expect(quarterlyUrl()).toContain("quarter=Q2");
    // The regression: the SBU leg used to strip quarter, so the breakdown
    // silently showed the full year beside a quarter-filtered chart.
    expect(sbuUrl()).toContain("quarter=Q2");
  });

  it("forwards incomeType to BOTH endpoints", () => {
    render(
      <TargetVsActualBreakdownCommon queryString="?financialYear=2025&incomeType=policy" />
    );

    expect(quarterlyUrl()).toContain("incomeType=policy");
    expect(sbuUrl()).toContain("incomeType=policy");
  });

  it("keeps sending useLiveData so achieved matches the Biz Done report", () => {
    render(<TargetVsActualBreakdownCommon queryString="?financialYear=2025" />);

    expect(quarterlyUrl()).toContain("useLiveData=true");
    expect(sbuUrl()).toContain("useLiveData=true");
  });

  it("omits quarter entirely when the drawer has not set one", () => {
    render(<TargetVsActualBreakdownCommon queryString="?financialYear=2025" />);

    expect(sbuUrl()).not.toContain("quarter=");
  });
});
