// FunnelChart.tsx

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  SalesFunnelContainer,
  ConversionCard,
  FunnelContainer,
  FunnelStage,
  StageFunnelContainer,
  ConversationCardsContainer,
  RechartsContainer,
  StageColorContainer,
  StageColor,
  StageTextContainer,
  StageEstimatedTextContainer,
  StagePremiumTextContainer,
  // StageConversionTextContainer, // commented out with Overall conversion column
  StageContainer,
  FunnelRightContainer,
  StageTextMainContainer,
  InfoIconWrapper,
  StyledInfoIcon,
} from "./styles";
import {
  formatNumberByLocalization,
  formatNumberShort,
  useLocalization,
} from "@ui/ui-lib";
import { fillColors, PERCENTAGE_ROUNDING_NOTE } from "../../../../constants";
import { NoDataContent } from "../../../../components/BusinessPerformance/styles";
import { Box, Tooltip } from "@mui/material";
import { FunnelSkeleton } from "../../../../components/DashboardSkeletons";

// Stage counts are fixed per funnel, so the first-load skeleton can match the
// real shape instead of guessing: SO/RO run 6 stages, Placement runs 12.
const PLACEMENT_STAGE_COUNT = 12;
const DEFAULT_STAGE_COUNT = 6;

// ---- Funnel geometry ------------------------------------------------------
// The chart and the stage list are two columns of the same rows, so one set of
// numbers drives both: a bar and its list row are the same height, and the
// list's header row is exactly the chart's top offset. That is what puts row N
// level with bar N, at any stage count.
//
// SERIES_TOP + 6 items x MIN_BAR_HEIGHT = 400px, which is what the original
// hardcoded 400px height gave the 5-stage funnel — so SO/RO don't move.
const SERIES_TOP = 40;
// Bar height adapts to the stage count so the funnel keeps a sensible aspect
// ratio at full width: a 6-bar SO/RO funnel gets tall bars, while the 12-bar
// Placement funnel stays compact instead of running off the page.
const TARGET_SERIES_HEIGHT = 560;
const MIN_BAR_HEIGHT = 60;
const MAX_BAR_HEIGHT = 96;
// ECharts splits the series area as sum(itemHeights) + BAR_GAP * (n - 1), so an
// item is only BAR_HEIGHT tall when the area is BAR_HEIGHT * n - BAR_GAP. Sizing
// it as BAR_HEIGHT * n makes every item BAR_GAP shorter than its row, and the
// error accumulates down the funnel — at 12 stages the last row sits a full bar
// out of line.
const BAR_GAP = 2;

const getFunnelGeometry = (itemCount: number) => {
  const barHeight = Math.min(
    MAX_BAR_HEIGHT,
    Math.max(
      MIN_BAR_HEIGHT,
      Math.floor(TARGET_SERIES_HEIGHT / Math.max(itemCount, 1))
    )
  );
  const seriesHeight = barHeight * itemCount - BAR_GAP;
  return { barHeight, seriesHeight, chartHeight: SERIES_TOP + seriesHeight };
};

const MAX_VISUAL = 500;
const MIN_VISUAL = 130;

const getFunnelWidth = (index: number, stageCount: number) =>
  MAX_VISUAL *
  Math.pow(MIN_VISUAL / MAX_VISUAL, index / Math.max(stageCount - 1, 1));

interface StageData {
  stageName: string;
  soCount: number;
  estimatedBrokerage: number;
  premium?: number | null;
}

interface SalesFunnelChartProps {
  data: StageData[];
  loading?: boolean;
  chartKey: string;
  handleFunnelClick: (params: any, chartKey: string) => void;
  // When true the funnel structure is kept but every value renders as "--"
  // (the current filters — e.g. business month — don't apply to this widget).
  showNotApplicablePlaceholder?: boolean;
}

const FunnelChart: React.FC<SalesFunnelChartProps> = ({
  data,
  loading,
  chartKey,
  handleFunnelClick,
  showNotApplicablePlaceholder = false,
}) => {
  const funnelData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const baseMapped = data.map((stage, index) => {
      const percentage =
        index === 0
          ? null
          : stage.soCount === 0
          ? 0
          : data[0]?.soCount === 0
          ? null
          : stage.soCount && data[0]?.soCount
          ? (stage.soCount / data[0].soCount) * 100
          : null;

      const stageConversionPercentage =
        index === 0
          ? null
          : stage.soCount === 0
          ? 0
          : data[index - 1]?.soCount === 0
          ? null
          : (stage.soCount / data[index - 1].soCount) * 100;

      return {
        stage: stage.stageName,
        actualCount: stage.soCount,
        visualCount: getFunnelWidth(index, data.length),
        fill: fillColors[index],
        estimatedBrokerage: stage.estimatedBrokerage,
        premium: stage.premium ?? null,
        percentage,
        stageConversionPercentage,
      };
    });

    // 👇 Add one dummy item (only for shape) — one more step down the same
    // taper, so the funnel closes to a point instead of ending on a flat edge.
    const visualOnlyItem = {
      stage: "",
      actualCount: 5,
      visualCount: getFunnelWidth(data.length, data.length),
      fill: "transparent",
      estimatedBrokerage: 1000,
      premium: null,
      percentage: 34,
      stageConversionPercentage: null,
      lastIndex: true,
    };

    return [...baseMapped, visualOnlyItem];
  }, [data]);

  const funnelWithPercentages = useMemo(() => {
    const activityStage = {
      stage: "Activity",
      actualCount: null,
      visualCount: "Overall conversion",
      fill: "transparent",
      estimatedBrokerage: "Est. brokerage",
      premium: "Premium",
      percentage: null,
      count: null,
      lastIndex: false,
    };

    return [
      activityStage,
      ...funnelData.map((stage) => ({
        ...stage,
        count: stage.actualCount,
      })),
    ];
  }, [funnelData]);

  const hasData = funnelData.length > 0;

  const {
    barHeight: BAR_HEIGHT,
    seriesHeight,
    chartHeight,
  } = getFunnelGeometry(funnelData.length);

  const handleFunnelClickLevel = (params: any) => {
    handleFunnelClick(params, chartKey);
  };

  const { localizationData } = useLocalization();
  const localization = localizationData?.data;
  return (
    <SalesFunnelContainer>
      {/* Funnel Stages — hidden while loading */}
      {!loading && (
        <StageFunnelContainer>
          {funnelWithPercentages.map((stage, index) => (
            <FunnelStage key={index}>
              <div className="stage-name">{stage.stage}</div>
              <div className="stage-count">
                {showNotApplicablePlaceholder ? "--" : stage.count}
              </div>
              <div className="stage-percentage">
                {showNotApplicablePlaceholder
                  ? "--"
                  : stage.stageConversionPercentage !== null &&
                    stage.stageConversionPercentage !== undefined
                  ? `${Math.round(stage.stageConversionPercentage)}%`
                  : "--"}
              </div>
            </FunnelStage>
          ))}
        </StageFunnelContainer>
      )}

      {/* Funnel Chart */}
      <FunnelContainer>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 400,
              width: "100%",
            }}
          >
            <FunnelSkeleton
              steps={
                chartKey === "PLACEMENT"
                  ? PLACEMENT_STAGE_COUNT
                  : DEFAULT_STAGE_COUNT
              }
            />
          </div>
        ) : hasData ? (
          <RechartsContainer>
            <ReactECharts
              onEvents={{ click: handleFunnelClickLevel }}
              option={{
                tooltip: { show: false },
                series: [
                  {
                    name: "Sales Funnel",
                    type: "funnel",
                    sort: "descending",
                    left: "2%",
                    right: "2%",
                    top: SERIES_TOP,
                    width: "96%",
                    // Absolute px, not "90%": the list rows are px-sized, so the
                    // series must be too or they drift apart as stages are added.
                    height: seriesHeight,
                    minSize: "1%",
                    gap: BAR_GAP,
                    label: {
                      show: true,
                      position: "inside",
                      formatter: (params: any) => {
                        if (params.data.lastIndex) return "";
                        if (showNotApplicablePlaceholder) {
                          return `{left|--}{divider|}{right|--}`;
                        }
                        const actual =
                          params.data.actualCount
                            ?.toString()
                            .padStart(3, " ") ?? "--";
                        const percentage =
                          params.data?.percentage !== null &&
                          params.data?.percentage !== undefined &&
                          params.data?.percentage !== "--"
                            ? `${Math.round(params.data.percentage)}%`
                            : "--     ";

                        return `{left|${formatNumberByLocalization(
                          actual
                        )}}{divider|}{right|${percentage}}`;
                      },
                      rich: {
                        left: {
                          fontSize: 14,
                          color: "#1c1c1c",
                          align: "right",
                          padding: [0, 6, 0, 0],
                        },
                        divider: {
                          width: 1,
                          height: 14,
                          backgroundColor: "#1c1c1c",
                        },
                        right: {
                          fontSize: 14,
                          color: "#1c1c1c",
                          align: "left",
                          padding: [0, 0, 0, 6],
                        },
                      },
                    },

                    labelLine: { show: false },
                    itemStyle: {
                      borderWidth: 0,
                      borderRadius: 80,
                    },
                    emphasis: {
                      scale: true,
                      itemStyle: {
                        borderWidth: 0,
                        shadowBlur: 30,
                        shadowOffsetX: 2,
                        shadowOffsetY: 2,
                        shadowColor: "rgba(255, 255, 255, 1)",
                      },
                    },
                    data: funnelData.map((item, index) => ({
                      name: item.stage,
                      value: item.visualCount,
                      actualCount: item.actualCount,
                      itemStyle: { color: item.fill },
                      percentage: item.stageConversionPercentage,
                      lastIndex: index === funnelData.length - 1,
                    })),
                  },
                ],
              }}
              style={{ width: "100%", height: `${chartHeight}px` }}
            />
            <FunnelRightContainer>
              {funnelWithPercentages
                .filter((item) => !item.lastIndex)
                .map((item, index) => {
                  // index 0 is the "Activity/Premium/Est. brokerage" header
                  // row, not a real stage — nothing to navigate to there.
                  const isRealStage = index !== 0;
                  const canNavigate =
                    isRealStage && !showNotApplicablePlaceholder;
                  const handleStageNumberClick = () => {
                    if (!canNavigate) return;
                    handleFunnelClick({ data: { name: item.stage } }, chartKey);
                  };

                  return (
                    <StageContainer
                      key={index}
                      rowHeight={index === 0 ? SERIES_TOP : BAR_HEIGHT}
                    >
                      <StageColorContainer>
                        <StageColor color={item?.fill} />
                        <StageTextContainer
                          textColor={item?.fill}
                          heading={index === 0}
                        >
                          {" "}
                          {item?.stage}
                        </StageTextContainer>
                      </StageColorContainer>
                      <StageTextMainContainer>
                         <StagePremiumTextContainer
                          clickable={canNavigate}
                          heading={index === 0}
                          onClick={handleStageNumberClick}
                        >
                          {index === 0
                            ? item?.premium
                            : showNotApplicablePlaceholder
                            ? "--"
                            : item?.premium === null ||
                              item?.premium === undefined
                            ? "--"
                            : formatNumberShort(item?.premium, localization)}
                        </StagePremiumTextContainer>
                        <StageEstimatedTextContainer
                          clickable={canNavigate}
                          heading={index === 0}
                          onClick={handleStageNumberClick}
                        >
                          {index === 0
                            ? item?.estimatedBrokerage
                            : showNotApplicablePlaceholder
                            ? "--"
                            : formatNumberShort(
                                item?.estimatedBrokerage,
                                localization
                              )}
                        </StageEstimatedTextContainer>
                      {/* Overall conversion column — commented out
                      <StageConversionTextContainer>
                        {index === 0
                          ? item?.visualCount
                          : item?.percentage !== null &&
                            item?.percentage !== undefined
                          ? `${Number(item?.percentage.toFixed(2))}%`
                          : "--"}
                      </StageConversionTextContainer>
                      */}
                      </StageTextMainContainer>
                    </StageContainer>
                  );
                })}
            </FunnelRightContainer>
            <Tooltip title={PERCENTAGE_ROUNDING_NOTE} placement="right" arrow>
              <InfoIconWrapper>
                <StyledInfoIcon />
              </InfoIconWrapper>
            </Tooltip>
          </RechartsContainer>
        ) : (
          <NoDataContent>No data available for the funnel graph.</NoDataContent>
        )}
      </FunnelContainer>

      {!loading && (
        <ConversationCardsContainer>
          {funnelWithPercentages.map((stage, index) => {
            const next = funnelWithPercentages[index + 1];
            const conversion =
              next && stage.count
                ? Math.round((next?.count / stage.count) * 100)
                : null;

            return (
              <ConversionCard key={index}>
                <div className="conversion-label">Conversion to Next Stage</div>
                <div className="conversion-value">
                  {showNotApplicablePlaceholder
                    ? "--"
                    : conversion !== null
                    ? `${conversion}%`
                    : "—"}
                </div>
                {!showNotApplicablePlaceholder && conversion !== null && (
                  <div
                    className={`conversion-status ${
                      conversion > 50 ? "on-target" : "below-target"
                    }`}
                  >
                    {conversion > 50 ? "On Target" : "Below Target"}
                  </div>
                )}
              </ConversionCard>
            );
          })}
        </ConversationCardsContainer>
      )}
    </SalesFunnelContainer>
  );
};

export default FunnelChart;
