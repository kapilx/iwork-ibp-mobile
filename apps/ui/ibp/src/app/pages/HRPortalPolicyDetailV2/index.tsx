import { Box, Typography } from "@mui/material";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartTooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  ChevronDown,
  Download,
  HeartPulse,
  IndianRupee,
  type LucideIcon,
  Shield,
  Users,
  UserRoundPlus,
  Wallet,
  X,
} from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getCurrencySymbolPrefix, useLocalization } from "@ui/ui-lib";
import { POLICY_DETAIL_PAGE_DATA, isPolicyDetailPolicyId } from "./constants";
import {
  DetailHeaderBar,
  DetailStatCard,
  DetailStatLabel,
  DetailStatValue,
  DetailTabButton,
  DetailTabsRow,
  GaugeInner,
  GaugeRing,
  HeaderIdentity,
  LegendItem,
  Dot,
  MiniMetricCard,
  MiniStatus,
  PolicyIconBadge,
  PolicyTitle,
  PreviewPage,
  PreviewSection,
  PreviewSectionBody,
  ProgressBar,
  ProgressTrack,
  RankedList,
  RankedRow,
  RankedRowHeader,
  SectionTitle,
  SimpleTable,
  SimpleTableCell,
  SimpleTableHeaderCell,
  SmallGhostButton,
  StatCardHeader,
  StatIconBadge,
  StatTripletGrid,
  StatsGridSix,
  StatsGridThree,
  StatusBadge,
  TrendLegend,
  TwoColumnGrid,
} from "./styles";
import type { PolicyDetailStatCard } from "./types";

const iconMap: Record<PolicyDetailStatCard["icon"], LucideIcon> = {
  users: Users,
  shield: Shield,
  wallet: Wallet,
  briefcase: BriefcaseBusiness,
  dependents: UserRoundPlus,
  activity: Activity,
  ratio: HeartPulse,
  claims: Wallet,
  average: IndianRupee,
};

const statusDotColor = {
  success: "#12B76A",
  warning: "#F79009",
};

const getLinePoints = (values: number[], width: number, height: number) => {
  const max = Math.max(...values, 1);
  const stepX = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / max) * (height - 12) - 6;
      return `${x},${y}`;
    })
    .join(" ");
};

export const HRPortalPolicyDetailV2 = () => {
  const navigate = useNavigate();
  const { policyId } = useParams();

  if (!isPolicyDetailPolicyId(policyId)) {
    return <Navigate to="/hr-portal/dashboard" replace />;
  }

  const data = POLICY_DETAIL_PAGE_DATA[policyId];
  const enrolledPercent = Math.round(
    (data.enrollmentProgress.enrolled / data.enrollmentProgress.total) * 100
  );
  const claimsTrendPoints = getLinePoints(
    data.monthlyTrend.map((item) => item.claims),
    560,
    140
  );
  const settledTrendPoints = getLinePoints(
    data.monthlyTrend.map((item) => item.settled),
    560,
    140
  );

  return (
    <PreviewPage>
      <PreviewSection>
        <PreviewSectionBody sx={{ py: 1.5 }}>
          <DetailHeaderBar>
            <HeaderIdentity>
              <SmallGhostButton
                startIcon={<ArrowLeft size={14} />}
                onClick={() => navigate("/hr-portal/dashboard")}
              >
                Back
              </SmallGhostButton>
              <Box sx={{ width: 1, height: 20, background: "#E5E7EB" }} />
              <PolicyIconBadge>
                <Shield size={16} color="#2B7FFF" />
              </PolicyIconBadge>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PolicyTitle>{data.header.title}</PolicyTitle>
                <StatusBadge tone={data.header.statusTone}>
                  <Dot color={statusDotColor[data.header.statusTone]} />
                  {data.header.status}
                </StatusBadge>
              </Box>
            </HeaderIdentity>

            <Box sx={{ display: "flex", gap: 1 }}>
              <SmallGhostButton startIcon={<Download size={14} />}>
                Export
              </SmallGhostButton>
              <SmallGhostButton startIcon={<X size={14} />}>
                Cancel
              </SmallGhostButton>
            </Box>
          </DetailHeaderBar>
        </PreviewSectionBody>

        <Box
          sx={{
            borderTop: "1px solid #F2F4F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
          }}
        >
          <DetailTabsRow sx={{ flex: 1 }}>
            {data.tabs.map((tab) => (
              <DetailTabButton key={tab.id} active={tab.active}>
                {tab.label}
              </DetailTabButton>
            ))}
          </DetailTabsRow>
          <SmallGhostButton endIcon={<ChevronDown size={12} />}>
            Group Health Insurance
          </SmallGhostButton>
        </Box>
      </PreviewSection>

      <StatsGridThree sx={{ px: 3 }}>
        {data.primaryStats.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <DetailStatCard key={item.id} tint={item.tint}>
              <StatCardHeader>
                <StatIconBadge tone={item.iconTone}>
                  <Icon size={20} color="#2563EB" />
                </StatIconBadge>
                <Box>
                  <DetailStatLabel>{item.label}</DetailStatLabel>
                  <DetailStatValue sx={{ mt: 0 }}>{item.value}</DetailStatValue>
                </Box>
              </StatCardHeader>
            </DetailStatCard>
          );
        })}
      </StatsGridThree>

      <StatsGridSix sx={{ px: 3 }}>
        {data.secondaryStats.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <DetailStatCard key={item.id} tint={item.tint}>
              <StatCardHeader>
                <StatIconBadge tone={item.iconTone}>
                  <Icon size={14} color="#4F46E5" />
                </StatIconBadge>
                <DetailStatLabel>{item.label}</DetailStatLabel>
              </StatCardHeader>
              <DetailStatValue sx={{ fontSize: 20, lineHeight: "24px", mt: 1 }}>
                {item.value}
              </DetailStatValue>
            </DetailStatCard>
          );
        })}
      </StatsGridSix>

      <PreviewSection>
        <PreviewSectionBody>
          <SectionTitle>Policy Sub-Components</SectionTitle>
          <Box sx={{ overflowX: "auto", mt: 2 }}>
            <SimpleTable>
              <thead>
                <tr>
                  <SimpleTableHeaderCell>Sub-Component</SimpleTableHeaderCell>
                  <SimpleTableHeaderCell>Enrolled</SimpleTableHeaderCell>
                  <SimpleTableHeaderCell>Coverage</SimpleTableHeaderCell>
                  <SimpleTableHeaderCell>Premium/Mo</SimpleTableHeaderCell>
                  <SimpleTableHeaderCell>Claims</SimpleTableHeaderCell>
                  <SimpleTableHeaderCell>Status</SimpleTableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {data.subComponents.map((row) => (
                  <tr key={row.id}>
                    <SimpleTableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                        }}
                      >
                        <Dot color={row.dotColor} />
                        <Box>
                          <Typography
                            sx={{
                              color: "#101828",
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 600,
                              lineHeight: "20px",
                            }}
                          >
                            {row.name}
                          </Typography>
                          <Typography
                            sx={{
                              color: "#6A7282",
                              fontSize: 15, lineHeight: 1.7,
                              lineHeight: "16px",
                            }}
                          >
                            {row.summary}
                          </Typography>
                        </Box>
                      </Box>
                    </SimpleTableCell>
                    <SimpleTableCell>{row.enrolled}</SimpleTableCell>
                    <SimpleTableCell>{row.coverage}</SimpleTableCell>
                    <SimpleTableCell>{row.premiumPerMonth}</SimpleTableCell>
                    <SimpleTableCell>
                      <Typography
                        sx={{ color: "#2563EB", fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}
                      >
                        {row.claims}
                      </Typography>
                    </SimpleTableCell>
                    <SimpleTableCell>
                      <MiniStatus>{row.status}</MiniStatus>
                    </SimpleTableCell>
                  </tr>
                ))}
              </tbody>
            </SimpleTable>
          </Box>
        </PreviewSectionBody>
      </PreviewSection>

      <TwoColumnGrid>
        <PreviewSection>
          <PreviewSectionBody>
            <SectionTitle>Enrollment Progress</SectionTitle>
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Typography sx={{ color: "#6A7282", fontSize: 15, lineHeight: 1.7 }}>
                  Enrolled members
                </Typography>
                <Typography
                  sx={{ color: "#101828", fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700 }}
                >
                  {data.enrollmentProgress.enrolled}/
                  {data.enrollmentProgress.total}
                </Typography>
              </Box>
              <ProgressTrack sx={{ mt: 2 }}>
                <ProgressBar progress={enrolledPercent} />
              </ProgressTrack>
              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography sx={{ color: "#9CA3AF", fontSize: 15, lineHeight: 1.7 }}>
                  0%
                </Typography>
                <Typography
                  sx={{ color: "#12B76A", fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}
                >
                  {enrolledPercent}% enrolled
                </Typography>
                <Typography sx={{ color: "#9CA3AF", fontSize: 15, lineHeight: 1.7 }}>
                  100%
                </Typography>
              </Box>
            </Box>

            <StatTripletGrid sx={{ mt: 3 }}>
              <MiniMetricCard tint="#ECFDF3">
                <Typography sx={{ color: "#6A7282", fontSize: 15, lineHeight: 1.7 }}>
                  Enrolled
                </Typography>
                <Typography
                  sx={{ color: "#12B76A", fontSize: 28, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 700 }}
                >
                  {data.enrollmentProgress.enrolledLabel}
                </Typography>
              </MiniMetricCard>
              <MiniMetricCard tint="#F8FAFC">
                <Typography sx={{ color: "#6A7282", fontSize: 15, lineHeight: 1.7 }}>
                  Pending
                </Typography>
                <Typography
                  sx={{ color: "#667085", fontSize: 28, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 700 }}
                >
                  {data.enrollmentProgress.pendingLabel}
                </Typography>
              </MiniMetricCard>
              <MiniMetricCard tint="#EFF6FF">
                <Typography sx={{ color: "#6A7282", fontSize: 15, lineHeight: 1.7 }}>
                  Dependents
                </Typography>
                <Typography
                  sx={{ color: "#2563EB", fontSize: 28, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 700 }}
                >
                  {data.enrollmentProgress.dependentsLabel}
                </Typography>
              </MiniMetricCard>
            </StatTripletGrid>
          </PreviewSectionBody>
        </PreviewSection>

        <PreviewSection>
          <PreviewSectionBody>
            <SectionTitle>Claim Utilisation</SectionTitle>
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: "180px minmax(0, 1fr)",
                gap: 3,
                alignItems: "center",
                "@media (max-width: 720px)": {
                  gridTemplateColumns: "1fr",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <GaugeRing progress={data.claimUtilisation.percent}>
                  <GaugeInner>
                    <Box>
                      <Typography
                        sx={{ color: "#3B82F6", fontSize: 32, lineHeight: 1.2, letterSpacing: "-0.5px", fontWeight: 700 }}
                      >
                        {data.claimUtilisation.percent}%
                      </Typography>
                      <Typography sx={{ color: "#9CA3AF", fontSize: 15, lineHeight: 1.7 }}>
                        {data.claimUtilisation.subtitle}
                      </Typography>
                    </Box>
                  </GaugeInner>
                </GaugeRing>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {data.claimUtilisation.breakdown.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      borderBottom: "1px solid #F2F4F7",
                      pb: 1,
                    }}
                  >
                    <Typography sx={{ color: "#9CA3AF", fontSize: 15, lineHeight: 1.7 }}>
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{ color: "#364153", fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </PreviewSectionBody>
        </PreviewSection>
      </TwoColumnGrid>

      {/* Incurred Claims Ratio by Period */}
      <PreviewSection>
        <PreviewSectionBody>
          <SectionTitle>Incurred Claims Ratio by Period</SectionTitle>
          <Box sx={{ mt: 2.5, display: "flex", gap: 2, alignItems: "flex-start" }}>
            {/* Chart */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.icrByPeriod.periods.map((p) => ({
                    shortLabel: p.shortLabel,
                    label: p.label,
                    claimsAmount: p.claimsAmount,
                    incurredPremium: p.incurredPremium,
                    icr: p.icr,
                    isPredicted: p.isPredicted,
                    claimsColor: p.claimsColor,
                    premiumColor: p.premiumColor,
                  }))}
                  margin={{ top: 4, right: 4, left: 0, bottom: 28 }}
                  barCategoryGap="28%"
                  barGap={3}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}L`}
                    width={40}
                  />
                  <XAxis
                    dataKey="shortLabel"
                    axisLine={false}
                    tickLine={false}
                    height={44}
                    tick={(tickProps: Record<string, unknown>) => {
                      const { x, y, payload } = tickProps as { x: number; y: number; payload: { value: string } };
                      const isPred = payload.value === "Forecast";
                      const period = data.icrByPeriod.periods.find((p) => p.shortLabel === payload.value);
                      return (
                        <g>
                          <text x={x} y={y + 10} textAnchor="middle" fill={isPred ? "#7C3AED" : "#9CA3AF"} fontSize={11} fontWeight={isPred ? 700 : 400}>
                            {payload.value}
                          </text>
                          <text x={x} y={y + 24} textAnchor="middle" fill={period?.claimsColor ?? "#9CA3AF"} fontSize={10} fontWeight={600}>
                            {`ICR: ${period?.icr ?? 0}%`}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <RechartTooltip
                    cursor={{ fill: "rgba(107,142,245,0.06)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload as typeof data.icrByPeriod.periods[0];
                      return (
                        <Box sx={{ bgcolor: "#1F2937", px: 1.5, py: 1, borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.18)", minWidth: 160 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#fff", mb: 0.5 }}>{d.label?.replace(/\n/g, " ")}</Typography>
                          <Typography sx={{ fontSize: 12, color: d.claimsColor, fontWeight: 700 }}>ICR: {d.icr}%</Typography>
                          <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>Claims: ₹{d.claimsAmount}L</Typography>
                          <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>Premium: ₹{d.incurredPremium}L</Typography>
                        </Box>
                      );
                    }}
                  />
                  <Bar dataKey="claimsAmount" maxBarSize={28} name="Claims Amount" shape={(props: Record<string, unknown>) => {
                    const bx = props.x as number; const by = props.y as number;
                    const bw = props.width as number; const bh = props.height as number;
                    const idx = props.index as number;
                    const item = data.icrByPeriod.periods[idx];
                    if (item?.isPredicted) {
                      return <g><rect x={bx} y={by} width={bw} height={bh} rx={3} fill={item.claimsColor} fillOpacity={0.7} /><rect x={bx} y={by} width={bw} height={bh} rx={3} fill="none" stroke={item.claimsColor} strokeWidth={1.5} strokeDasharray="4 2" /></g>;
                    }
                    return <rect x={bx} y={by} width={bw} height={bh} rx={3} fill={item?.claimsColor ?? "#2563EB"} />;
                  }}>
                    {data.icrByPeriod.periods.map((p) => <Cell key={p.shortLabel} fill={p.claimsColor} />)}
                  </Bar>
                  <Bar dataKey="incurredPremium" maxBarSize={28} name="Incurred Premium" shape={(props: Record<string, unknown>) => {
                    const bx = props.x as number; const by = props.y as number;
                    const bw = props.width as number; const bh = props.height as number;
                    const idx = props.index as number;
                    const item = data.icrByPeriod.periods[idx];
                    if (item?.isPredicted) {
                      return <g><rect x={bx} y={by} width={bw} height={bh} rx={3} fill={item.premiumColor} fillOpacity={0.7} /><rect x={bx} y={by} width={bw} height={bh} rx={3} fill="none" stroke={item.premiumColor} strokeWidth={1.5} strokeDasharray="4 2" /></g>;
                    }
                    return <rect x={bx} y={by} width={bw} height={bh} rx={3} fill={item?.premiumColor ?? "#93C5FD"} />;
                  }}>
                    {data.icrByPeriod.periods.map((p) => <Cell key={p.shortLabel} fill={p.premiumColor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: "#2563EB" }} />
                  <Typography sx={{ fontSize: 12, color: "#6B7280" }}>Claims Amount</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: "#93C5FD" }} />
                  <Typography sx={{ fontSize: 12, color: "#6B7280" }}>Incurred Premium</Typography>
                </Box>
              </Box>
            </Box>

            {/* Forecast panel */}
            <Box sx={{ flexShrink: 0, width: 168, borderRadius: "10px", border: "1px solid #EDE9FE", bgcolor: "#FAF8FF", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 14, height: 14, borderRadius: 2, border: "1.5px dashed #7C3AED", bgcolor: "#EDE9FE" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#7C3AED", letterSpacing: "0.07em" }}>FORECAST</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, mb: 0.25 }}>Expected ICR</Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#7C3AED", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{data.icrByPeriod.forecast.expectedIcr}%</Typography>
              </Box>
              <Box sx={{ width: "100%", height: "1px", bgcolor: "#EDE9FE" }} />
              <Box>
                <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, mb: 0.25 }}>Claims Amount</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{data.icrByPeriod.forecast.claimsAmount}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, mb: 0.25 }}>Incurred Premium</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{data.icrByPeriod.forecast.incurredPremium}</Typography>
              </Box>
            </Box>
          </Box>
        </PreviewSectionBody>
      </PreviewSection>

      <PreviewSection>
        <PreviewSectionBody>
          <SectionTitle>Monthly Claim Trend</SectionTitle>
          <TrendLegend>
            <LegendItem>
              <Dot color="#3B82F6" />
              <Typography sx={{ color: "#6A7282", fontSize: 15, lineHeight: 1.7 }}>
                Claims
              </Typography>
            </LegendItem>
            <LegendItem>
              <Dot color="#10B981" />
              <Typography sx={{ color: "#6A7282", fontSize: 15, lineHeight: 1.7 }}>
                Settled
              </Typography>
            </LegendItem>
          </TrendLegend>

          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 620 }}>
              <svg width="100%" height="180" viewBox="0 0 620 180" role="img">
                {[0, 1, 2, 3].map((line) => (
                  <line
                    key={line}
                    x1="40"
                    y1={24 + line * 32}
                    x2="600"
                    y2={24 + line * 32}
                    stroke="#EEF2F6"
                    strokeWidth="1"
                  />
                ))}
                <polyline
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  points={claimsTrendPoints}
                  transform="translate(40,8)"
                />
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  points={settledTrendPoints}
                  transform="translate(40,8)"
                />
                {data.monthlyTrend.map((item, index) => {
                  const stepX = 560 / Math.max(data.monthlyTrend.length - 1, 1);
                  const x = 40 + index * stepX;

                  return (
                    <text
                      key={item.label}
                      x={x}
                      y="166"
                      fontSize="10"
                      fill="#9CA3AF"
                      textAnchor="middle"
                    >
                      {item.label}
                    </text>
                  );
                })}
              </svg>
            </Box>
          </Box>
        </PreviewSectionBody>
      </PreviewSection>

      <TwoColumnGrid>
        <PreviewSection>
          <PreviewSectionBody>
            <SectionTitle>Top Hospitals Used</SectionTitle>
            <RankedList sx={{ mt: 3 }}>
              {data.topHospitals.map((item, index) => (
                <RankedRow key={item.id}>
                  <RankedRowHeader>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          background: item.color,
                          color: "#FFFFFF",
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography sx={{ color: "#364153", fontSize: 15, lineHeight: 1.7 }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ color: "#9CA3AF", fontSize: 15, lineHeight: 1.7 }}>
                        {item.value}
                      </Typography>
                      <Typography
                        sx={{
                          color: item.color,
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                        }}
                      >
                        {item.helper}
                      </Typography>
                    </Box>
                  </RankedRowHeader>
                  <ProgressTrack sx={{ height: 6 }}>
                    <ProgressBar progress={item.progress} color={item.color} />
                  </ProgressTrack>
                </RankedRow>
              ))}
            </RankedList>
          </PreviewSectionBody>
        </PreviewSection>

        <PreviewSection>
          <PreviewSectionBody>
            <SectionTitle>Disease Category Breakdown</SectionTitle>
            <RankedList sx={{ mt: 3 }}>
              {data.diseaseBreakdown.map((item) => (
                <RankedRow key={item.id}>
                  <RankedRowHeader>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Dot color={item.color} />
                      <Typography sx={{ color: "#364153", fontSize: 15, lineHeight: 1.7 }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ color: "#9CA3AF", fontSize: 15, lineHeight: 1.7 }}>
                        {item.value}
                      </Typography>
                      <Typography
                        sx={{ color: "#364153", fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}
                      >
                        {item.helper}
                      </Typography>
                    </Box>
                  </RankedRowHeader>
                  <ProgressTrack sx={{ height: 8 }}>
                    <ProgressBar progress={item.progress} color={item.color} />
                  </ProgressTrack>
                </RankedRow>
              ))}
            </RankedList>
          </PreviewSectionBody>
        </PreviewSection>
      </TwoColumnGrid>
    </PreviewPage>
  );
};

export default HRPortalPolicyDetailV2;
