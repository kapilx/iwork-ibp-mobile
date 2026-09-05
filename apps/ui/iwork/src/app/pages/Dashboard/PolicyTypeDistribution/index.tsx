import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatLargeCurrency,
  formatNumberByLocalization,
  buildBreadcrumbState,
  BREADCRUMB_KEYS,
  DETAILS_LABELS,
} from "@ui/ui-lib";
import PieChart from "../Charts/PieChart";
import { fillColors } from "../../../constants";
import {
  StyledChartPane,
  StyledHoverCard,
  StyledHoverEyebrow,
  StyledHoverGrid,
  StyledHoverLabel,
  StyledHoverName,
  StyledHoverPercent,
  StyledHoverTitle,
  StyledHoverValue,
  StyledLegendCard,
  StyledLegendDot,
  StyledLegendItem,
  StyledLegendList,
  StyledLegendText,
  StyledNoData,
  StyledPieChartWrapper,
  StyledPolicyTypeContainer,
  StyledPolicyTypeLayout,
  StyledRightPane,
} from "./styles";

interface PolicyTypeData {
  iirmPolicyTypeLid: number;
  iirmPolicyType: string;
  premiumAmount: number;
  basicBrokerageAmount?: number;
  policyCount: number;
  noOfEndorsement?: number;
}

interface PolicyTypeDistributionProps {
  data?: PolicyTypeData[];
  filters?: Record<string, unknown>;
  breadcrumbs?: unknown[];
}

interface PolicyTypePieData {
  name: string;
  value: number;
  premium: number;
  brokerage: number;
  endorsementCount: number;
  itemStyle: { color: string };
}

interface PieClickParams {
  name?: string;
  data?: {
    name?: string;
  };
}

const QUARTER_DATE_RANGES: Record<
  string,
  (year: number) => { from: string; to: string }
> = {
  Q1: (year) => ({ from: `${year}-04-01`, to: `${year}-06-30` }),
  Q2: (year) => ({ from: `${year}-07-01`, to: `${year}-09-30` }),
  Q3: (year) => ({ from: `${year}-10-01`, to: `${year}-12-31` }),
  Q4: (year) => ({ from: `${year + 1}-01-01`, to: `${year + 1}-03-31` }),
};

const getQuarterDateRange = (
  quarter: string | { value: string; label: string } | null | undefined,
  financialYear: string | { value: string; label: string } | null | undefined
): { from: string; to: string } | null => {
  const normalizedQuarter = (
    typeof quarter === "object" ? quarter?.value : quarter
  )?.toUpperCase();
  const normalizedFinancialYear =
    typeof financialYear === "object" ? financialYear?.value : financialYear;
  const year = parseInt(normalizedFinancialYear ?? "", 10);

  if (
    !normalizedQuarter ||
    !QUARTER_DATE_RANGES[normalizedQuarter] ||
    Number.isNaN(year)
  ) {
    return null;
  }

  return QUARTER_DATE_RANGES[normalizedQuarter](year);
};

function PolicyTypeDistribution({
  data,
  filters,
  breadcrumbs,
}: PolicyTypeDistributionProps) {
  const navigate = useNavigate();
  const [hoveredSlice, setHoveredSlice] = useState<PolicyTypePieData | null>(
    null
  );

  const handleSliceClick = (clickedName: string) => {
    if (!clickedName) return;

    const { userId, owner, quarter, financialYear, ...restFilters } =
      (filters ?? {}) as Record<string, unknown>;

    const quarterValue = typeof quarter === "object" ? quarter?.value : quarter;
    const isSpecificQuarter =
      quarterValue &&
      quarterValue !== "ALL" &&
      QUARTER_DATE_RANGES[quarterValue?.toUpperCase()];

    let dateOverride: Record<string, unknown> = {};
    if (isSpecificQuarter) {
      const dateRange = getQuarterDateRange(quarter, financialYear);
      if (dateRange) {
        dateOverride = { from: dateRange.from, to: dateRange.to };
      }
    } else if (financialYear) {
      dateOverride = { financialYear };
    }

    const destinationConfig = {
      label: DETAILS_LABELS.POLICY,
      path: "/policies",
      key: BREADCRUMB_KEYS.POLICY,
    };

    const destinationState = buildBreadcrumbState({
      breadcrumbs: breadcrumbs ?? [],
      crumb: destinationConfig,
      state: {
        filters: {
          ...restFilters,
          ...(userId !== undefined ? { ownerId: userId } : {}),
          ...(owner !== undefined ? { viewBy: owner } : {}),
          ...dateOverride,
          iirmPolicyType: { label: clickedName, value: clickedName },
        },
        formDashboard: true,
      },
    });

    navigate("/policies", { state: destinationState });
  };

  const pieData = useMemo<PolicyTypePieData[]>(() => {
    if (!data?.length) return [];

    return [...data]
      .filter((item) => item.policyCount > 0 && item.iirmPolicyType != null)
      .sort(
        (firstItem, secondItem) =>
          secondItem.policyCount - firstItem.policyCount
      )
      .map((item, index) => ({
        name: item.iirmPolicyType,
        value: item.policyCount,
        premium: item.premiumAmount ?? 0,
        brokerage: item.basicBrokerageAmount ?? 0,
        endorsementCount: item.noOfEndorsement ?? 0,
        itemStyle: {
          color: fillColors[index] ?? fillColors[index % fillColors.length],
        },
      }));
  }, [data]);

  const totalPolicyCount = useMemo(
    () =>
      pieData.reduce(
        (runningTotal, pieItem) => runningTotal + pieItem.value,
        0
      ),
    [pieData]
  );

  const activeSlice = hoveredSlice ?? pieData[0] ?? null;

  if (pieData.length === 0) {
    return (
      <StyledPolicyTypeContainer>
        <StyledNoData>No data available</StyledNoData>
      </StyledPolicyTypeContainer>
    );
  }

  const hoveredPercentage =
    activeSlice && totalPolicyCount > 0
      ? ((activeSlice.value / totalPolicyCount) * 100).toFixed(2)
      : "0.00";

  return (
    <StyledPolicyTypeContainer>
      <StyledPolicyTypeLayout>
        <StyledChartPane>
          <StyledPieChartWrapper>
            <PieChart
              data={pieData}
              width={700}
              height={400}
              pieCenter={["52%", "42%"]}
              pieRadius="54%"
              pieLabelFormatter="{b}"
              pieLabelFontSize={10}
              pieLabelOverflow="break"
              pieLabelWidth={140}
              pieLabelEdgeDistance={20}
              pieLabelLineLength={24}
              pieLabelLineLength2={42}
              showAllLabels={true}
              hideLabelOverlap={false}
              showLegend={false}
              highlightedSliceName={hoveredSlice?.name ?? null}
              dimmedOpacity={0.62}
              emphasisScale={true}
              emphasisScaleSize={5}
              emphasisShadowBlur={0}
              emphasisShadowColor="transparent"
              emphasisBorderWidth={2}
              emphasisBorderColor="#FFFFFF"
              seriesName="Policy Types"
              showTooltip={false}
              onEvents={{
                click: (params: PieClickParams) => {
                  const clickedName = params?.name ?? params?.data?.name;
                  if (clickedName) {
                    handleSliceClick(clickedName);
                  }
                },
                mouseover: (params: { data?: PolicyTypePieData }) => {
                  if (params?.data) {
                    setHoveredSlice(params.data);
                  }
                },
                globalout: () => {
                  setHoveredSlice(null);
                },
              }}
            />
          </StyledPieChartWrapper>
        </StyledChartPane>

        <StyledRightPane>
          <StyledHoverCard>
            {activeSlice && (
              <>
                <StyledHoverTitle>
                  <div>
                    <StyledHoverEyebrow>Policy Type</StyledHoverEyebrow>
                    <StyledHoverName>{activeSlice.name}</StyledHoverName>
                  </div>
                  <StyledHoverPercent>{hoveredPercentage}%</StyledHoverPercent>
                </StyledHoverTitle>

                <StyledHoverGrid>
                  <StyledHoverLabel>Policy Count</StyledHoverLabel>
                  <StyledHoverValue>
                    {formatNumberByLocalization(activeSlice.value)}
                  </StyledHoverValue>
                  <StyledHoverLabel>Premium</StyledHoverLabel>
                  <StyledHoverValue>
                    {formatLargeCurrency(activeSlice.premium)}
                  </StyledHoverValue>
                  <StyledHoverLabel>Brokerage</StyledHoverLabel>
                  <StyledHoverValue>
                    {formatLargeCurrency(activeSlice.brokerage)}
                  </StyledHoverValue>
                  <StyledHoverLabel>
                    Inception/Endorsement Count
                  </StyledHoverLabel>
                  <StyledHoverValue>
                    {formatNumberByLocalization(activeSlice.endorsementCount)}
                  </StyledHoverValue>
                </StyledHoverGrid>
              </>
            )}
          </StyledHoverCard>

          <StyledLegendCard>
            <StyledLegendList>
              {pieData.map((item) => (
                <StyledLegendItem
                  key={item.name}
                  $active={activeSlice?.name === item.name}
                  onMouseEnter={() => setHoveredSlice(item)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <StyledLegendDot
                    $color={item.itemStyle.color}
                    $active={activeSlice?.name === item.name}
                  />
                  <StyledLegendText $active={activeSlice?.name === item.name}>
                    {item.name}
                  </StyledLegendText>
                </StyledLegendItem>
              ))}
            </StyledLegendList>
          </StyledLegendCard>
        </StyledRightPane>
      </StyledPolicyTypeLayout>
    </StyledPolicyTypeContainer>
  );
}

export default PolicyTypeDistribution;
