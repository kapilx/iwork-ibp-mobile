import React, { useEffect, useMemo, useRef, useState } from "react";
import { BarRowsSkeleton } from "../../../components/DashboardSkeletons";
import {
  endPoints,
  useApiQuery,
  formatLargeCurrency,
  useLocalization,
} from "@ui/ui-lib";
import DashboardSection from "../../../components/BusinessPerformance/common/DashboardSection";
import { TARGET_VS_ACTUAL_COPY } from "./constants";
import { BreakdownBar } from "./types";
import { LoadingContainer, ErrorText, NoDataText, RewardsNote } from "./styles";
import BusinessPerformanceQuarterlyView from "./BusinessPerformanceQuarterlyView";

export interface TargetVsActualBreakdownProps {
  queryString?: string;
  onTotalNavigate?: () => void;
  showNotApplicablePlaceholder?: boolean;
}

const TargetVsActualBreakdownCommon: React.FC<TargetVsActualBreakdownProps> = ({
  queryString = "",
  onTotalNavigate,
  showNotApplicablePlaceholder = false,
}) => {
  const { localizationData } = useLocalization();
  const formatValue = (value: number) =>
    formatLargeCurrency(value, localizationData?.data)?.trim();

  const [selectedQuarter, setSelectedQuarter] = useState<string | undefined>();

  useEffect(() => {
    setSelectedQuarter(undefined);
  }, [queryString]);

  // useLiveData=true makes the backend aggregate achieved values straight from
  // policy/endorsement/reward — the same source the Biz Done report reads —
  // instead of the hourly performance_output ETL table, which used to leave this
  // widget disagreeing with Biz Done for up to an hour after any policy edit.
  const withLiveData = (url: string, query: string) =>
    `${url}${query}${query.startsWith("?") ? "&" : "?"}useLiveData=true`;

  const quarterlyUrl = withLiveData(
    endPoints.businessPerformanceQuarterlyData ||
      endPoints.businessPerformanceData,
    queryString
  );

  const {
    data: quarterlyData,
    isLoading,
    error,
  } = useApiQuery({
    url: quarterlyUrl,
    queryKey: ["targetVsActualQuarterlyData", quarterlyUrl],
  });

  const sbuQueryString = useMemo(() => {
    const rawQuery = queryString.startsWith("?")
      ? queryString.slice(1)
      : queryString;
    const params = new URLSearchParams(rawQuery);
    // Clicking a quarter in the chart drills into it, overriding whatever the
    // filter drawer asked for. With no click, the drawer's own `quarter` stands
    // — deleting it here used to leave the SBU breakdown showing the full year
    // while the quarterly chart above it honoured the filter.
    if (selectedQuarter) {
      params.set("quarter", selectedQuarter);
    }
    const serialized = params.toString();

    return serialized ? `?${serialized}` : "";
  }, [queryString, selectedQuarter]);

  const sbuUrl = withLiveData(
    endPoints.businessPerformanceSbuData,
    sbuQueryString
  );

  const {
    data: sbuData,
    isLoading: sbuLoading,
    error: sbuError,
  } = useApiQuery({
    url: sbuUrl,
    queryKey: ["targetVsActualSbuData", sbuUrl],
  });

  const quarterBars: BreakdownBar[] = useMemo(() => {
    const apiData = quarterlyData?.data;
    if (!apiData || !Array.isArray(apiData)) return [];
    return apiData
      .filter(
        (item: { quarter?: string }) => item.quarter?.toLowerCase() !== "total"
      )
      .map(
        (item: { quarter?: string; soAchieved?: number; roAchieved?: number; soTarget?: number; roTarget?: number }) => ({
          label: item.quarter || TARGET_VS_ACTUAL_COPY.unknownLabel,
          soActual: item.soAchieved ?? 0,
          roActual: item.roAchieved ?? 0,
          soTarget: item.soTarget ?? 0,
          roTarget: item.roTarget ?? 0,
        })
      );
  }, [quarterlyData]);

  const lockedQuarter = useMemo(() => {
    const activeQuarters = quarterBars.filter(
      (bar) => bar.soActual !== 0 || bar.roActual !== 0 || bar.soTarget !== 0 || bar.roTarget !== 0
    );
    return activeQuarters.length === 1
      ? (activeQuarters[0].label as "Q1" | "Q2" | "Q3" | "Q4")
      : undefined;
  }, [quarterBars]);

  const sbuBars: BreakdownBar[] = useMemo(() => {
    const apiData = sbuData?.data;
    if (!apiData || !Array.isArray(apiData)) return [];

    return apiData
      .filter(
        (item: { soAchieved?: number; roAchieved?: number; soTarget?: number; roTarget?: number }) =>
          (item?.soAchieved ?? 0) !== 0 ||
          (item?.roAchieved ?? 0) !== 0 ||
          (item?.soTarget ?? 0) !== 0 ||
          (item?.roTarget ?? 0) !== 0
      )
      .map(
        (item: { sbuName?: string; soAchieved?: number; roAchieved?: number; soTarget?: number; roTarget?: number }) => ({
          label: item.sbuName ?? TARGET_VS_ACTUAL_COPY.unknownLabel,
          soActual: item.soAchieved ?? 0,
          roActual: item.roAchieved ?? 0,
          soTarget: item.soTarget ?? 0,
          roTarget: item.roTarget ?? 0,
        })
      );
  }, [sbuData]);

  const previousSbuBarsRef = useRef<BreakdownBar[]>([]);
  useEffect(() => {
    if (sbuBars.length > 0) {
      previousSbuBarsRef.current = sbuBars;
    }
  }, [sbuBars]);

  const effectiveSbuBars =
    sbuLoading && sbuBars.length === 0 ? previousSbuBarsRef.current : sbuBars;

  if (isLoading) {
    return (
      <DashboardSection
        heading={TARGET_VS_ACTUAL_COPY.title}
        subHeading={TARGET_VS_ACTUAL_COPY.subtitle}
        isLoading={true}
        loadingContent={
          <LoadingContainer>
            <BarRowsSkeleton rows={4} />
          </LoadingContainer>
        }
      />
    );
  }

  if (error || sbuError) {
    return (
      <DashboardSection
        heading={TARGET_VS_ACTUAL_COPY.title}
        subHeading={TARGET_VS_ACTUAL_COPY.subtitle}
        hasError={true}
        errorContent={
          <ErrorText color="error">
            {error
              ? TARGET_VS_ACTUAL_COPY.errorQuarterlyMessage
              : TARGET_VS_ACTUAL_COPY.errorSbuMessage}
          </ErrorText>
        }
      />
    );
  }

  if (quarterBars.length === 0) {
    return (
      <DashboardSection
        heading={TARGET_VS_ACTUAL_COPY.title}
        subHeading={TARGET_VS_ACTUAL_COPY.subtitle}
        hasNoData={true}
        noDataContent={
          <NoDataText>{TARGET_VS_ACTUAL_COPY.noDataMessage}</NoDataText>
        }
      />
    );
  }

  const quarterBarsToRender = showNotApplicablePlaceholder
    ? quarterBars.map((bar) => ({
        ...bar,
        soActual: 0,
        roActual: 0,
        soTarget: 0,
        roTarget: 0,
      }))
    : quarterBars;
  const sbuBarsToRender = showNotApplicablePlaceholder
    ? (sbuBars.length > 0
        ? sbuBars
        : [{ label: TARGET_VS_ACTUAL_COPY.unknownLabel, soActual: 0, roActual: 0, soTarget: 0, roTarget: 0 }]
      ).map((bar) => ({
        ...bar,
        soActual: 0,
        roActual: 0,
        soTarget: 0,
        roTarget: 0,
      }))
    : effectiveSbuBars;
  const valueFormatter = showNotApplicablePlaceholder ? (() => "--") : formatValue;

  return (
    <DashboardSection
      heading={TARGET_VS_ACTUAL_COPY.title}
      subHeading={TARGET_VS_ACTUAL_COPY.subtitle}
    >
      <BusinessPerformanceQuarterlyView
        quarterBars={quarterBarsToRender}
        sbuBars={sbuBarsToRender}
        formatValue={valueFormatter}
        onQuarterChange={showNotApplicablePlaceholder ? undefined : setSelectedQuarter}
        onTotalNavigate={showNotApplicablePlaceholder ? undefined : onTotalNavigate}
        lockedQuarter={showNotApplicablePlaceholder ? undefined : lockedQuarter}
        resetKey={queryString}
        showNotApplicablePlaceholder={showNotApplicablePlaceholder}
        sbuLoading={sbuLoading}
      />
      <RewardsNote variant="caption">
        {TARGET_VS_ACTUAL_COPY.rewardsNote}
      </RewardsNote>
    </DashboardSection>
  );
};

export default TargetVsActualBreakdownCommon;
