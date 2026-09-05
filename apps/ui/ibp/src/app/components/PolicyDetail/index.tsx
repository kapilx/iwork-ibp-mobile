import type { ReactNode } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import {
  ArrowLeft,
  BriefcaseMedical,
  CalendarDays,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Shield,
  Stethoscope,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  PORTAL_HEADER_TITLE_SX,
  PortalSelectControl,
} from "../../pages/HRPortal/controls";

import type { PolicyDetailMeta } from "../../pages/HRPortalDashboard/types";

type PolicyDetailLocationState = {
  policy?: PolicyDetailMeta;
};

type QuickInsightItem = {
  label: string;
  value: string;
  percent: number;
};

type DetailDataset = {
  policy: PolicyDetailMeta;
  policyCode: string;
  status: string;
  kpis: Array<{
    label: string;
    value: string;
    Icon: typeof Users;
    color: string;
  }>;
  subComponents: Array<{
    name: string;
    subtitle: string;
    enrolled: string;
    coverage: string;
    premium: string;
    claims: string;
    status: string;
  }>;
  enrollment: {
    enrolledPct: number;
    current: number;
    total: number;
    metrics: Array<{ label: string; value: string; Icon: typeof LogIn }>;
  };
  monthlyTrend: Array<{ month: string; claims: number; settled: number }>;
  utilisation: {
    percent: number;
    totalClaims: string;
    avgClaim: string;
    outstanding: string;
  };
  quickInsights: Array<{
    title: string;
    color: string;
    Icon: typeof Users;
    items: QuickInsightItem[];
  }>;
};

const DETAIL_DATA: Record<string, DetailDataset> = {
  gmc: {
    policy: {
      id: "gmc",
      name: "Group Mediclaim Policy",
      policyNo: "GMC-2025-001",
      policyPeriod: "15 Jan 26 - 14 Jan 27",
      dotColor: "#2F74D6",
      totalLives: 1250,
      sumInsured: "₹68.0L",
      netPremium: "₹24,50,000",
      activeClaims: 89,
      enrolledCount: 410,
      totalCount: 542,
      enrollmentPct: 76,
      claimUtilPct: 45,
    },
    policyCode: "GMC",
    status: "Active",
    kpis: [
      { label: "Total Lives", value: "1250", Icon: Users, color: "#2F74D6" },
      {
        label: "Net Premium",
        value: "₹24,50,000",
        Icon: TrendingUp,
        color: "#22C55E",
      },
      {
        label: "CD Balance",
        value: "₹6,90,000",
        Icon: CreditCard,
        color: "#56CFE1",
      },
      {
        label: "Claim Count",
        value: "89",
        Icon: CircleDollarSign,
        color: "#8B5CF6",
      },
      {
        label: "Policy Period",
        value: "15 Jan 26 - 14 Jan 27",
        Icon: CalendarDays,
        color: "#EAB308",
      },
    ],
    subComponents: [
      {
        name: "Base Cover",
        subtitle: "542 lives · 124 claims",
        enrolled: "542 emp",
        coverage: "₹68.0L",
        premium: "₹5.7L",
        claims: "124",
        status: "Active",
      },
      {
        name: "Top-Up Cover",
        subtitle: "312 lives · 68 claims",
        enrolled: "312 emp",
        coverage: "₹26.0L",
        premium: "₹2.2L",
        claims: "68",
        status: "Active",
      },
    ],
    enrollment: {
      enrolledPct: 76,
      current: 410,
      total: 542,
      metrics: [
        { label: "Enrolled", value: "200", Icon: UserRoundCheck },
        { label: "Pending", value: "21", Icon: Clock3 },
        { label: "Dependents", value: "224", Icon: CircleCheck },
      ],
    },
    monthlyTrend: [
      { month: "Jan", claims: 21, settled: 17 },
      { month: "Feb", claims: 24, settled: 19 },
      { month: "Mar", claims: 19, settled: 15 },
      { month: "Apr", claims: 25, settled: 21 },
      { month: "May", claims: 28, settled: 23 },
      { month: "Jun", claims: 18, settled: 13 },
      { month: "Jul", claims: 22, settled: 18 },
    ],
    utilisation: {
      percent: 45,
      totalClaims: "₹38.5 L",
      avgClaim: "₹1.6 L",
      outstanding: "₹5.07 L",
    },
    quickInsights: [
      {
        title: "Top Employees by Claim Amount",
        color: "#2F74D6",
        Icon: Users,
        items: [
          { label: "Ramesh Kumar", value: "₹1M", percent: 100 },
          { label: "Harish Verma", value: "₹950k", percent: 95 },
          { label: "Kunal Kapoor", value: "₹850k", percent: 89 },
          { label: "Alok Mishra", value: "₹750k", percent: 83 },
          { label: "Vivek Reddy", value: "₹650k", percent: 75 },
        ],
      },
      {
        title: "Top Hospitals Used",
        color: "#FF9800",
        Icon: BriefcaseMedical,
        items: [
          { label: "Apollo Hospital", value: "₹1M", percent: 100 },
          { label: "Yashoda Hospital", value: "₹950k", percent: 94 },
          { label: "Fortis Healthcare", value: "₹850k", percent: 82 },
          { label: "Max Hospital", value: "₹750k", percent: 76 },
          { label: "Sakra Hospital", value: "₹650k", percent: 69 },
        ],
      },
      {
        title: "Disease Category Breakdown",
        color: "#22C55E",
        Icon: Stethoscope,
        items: [
          { label: "Diabetes", value: "₹1M", percent: 100 },
          { label: "Hypertension", value: "₹950k", percent: 96 },
          { label: "Cardiovascular Disease", value: "₹850k", percent: 91 },
          { label: "Arthritis", value: "₹750k", percent: 84 },
          { label: "Obesity", value: "₹650k", percent: 77 },
        ],
      },
    ],
  },
  gtl: {
    policy: {
      id: "gtl",
      name: "Group Term Life",
      policyNo: "GTL-2025-002",
      policyPeriod: "15 Jan 26 - 14 Jan 27",
      dotColor: "#2F80D9",
      totalLives: 1250,
      sumInsured: "₹52.0L",
      netPremium: "₹21,80,000",
      activeClaims: 63,
      enrolledCount: 392,
      totalCount: 518,
      enrollmentPct: 75,
      claimUtilPct: 38,
    },
    policyCode: "GTL",
    status: "Active",
    kpis: [
      { label: "Total Lives", value: "1250", Icon: Users, color: "#2F74D6" },
      {
        label: "Net Premium",
        value: "₹21,80,000",
        Icon: TrendingUp,
        color: "#22C55E",
      },
      {
        label: "CD Balance",
        value: "₹5,10,000",
        Icon: CreditCard,
        color: "#56CFE1",
      },
      {
        label: "Claim Count",
        value: "63",
        Icon: CircleDollarSign,
        color: "#8B5CF6",
      },
      {
        label: "Policy Period",
        value: "15 Jan 26 - 14 Jan 27",
        Icon: CalendarDays,
        color: "#EAB308",
      },
    ],
    subComponents: [
      {
        name: "Base Life Cover",
        subtitle: "518 lives · 63 claims",
        enrolled: "518 emp",
        coverage: "₹52.0L",
        premium: "₹4.9L",
        claims: "63",
        status: "Active",
      },
      {
        name: "Voluntary Cover",
        subtitle: "227 lives · 19 claims",
        enrolled: "227 emp",
        coverage: "₹18.0L",
        premium: "₹1.4L",
        claims: "19",
        status: "Active",
      },
    ],
    enrollment: {
      enrolledPct: 75,
      current: 392,
      total: 518,
      metrics: [
        { label: "Enrolled", value: "185", Icon: UserRoundCheck },
        { label: "Pending", value: "18", Icon: Clock3 },
        { label: "Dependents", value: "189", Icon: CircleCheck },
      ],
    },
    monthlyTrend: [
      { month: "Jan", claims: 17, settled: 13 },
      { month: "Feb", claims: 19, settled: 16 },
      { month: "Mar", claims: 12, settled: 10 },
      { month: "Apr", claims: 18, settled: 15 },
      { month: "May", claims: 21, settled: 18 },
      { month: "Jun", claims: 10, settled: 8 },
      { month: "Jul", claims: 14, settled: 11 },
    ],
    utilisation: {
      percent: 38,
      totalClaims: "₹24.1 L",
      avgClaim: "₹1.2 L",
      outstanding: "₹3.84 L",
    },
    quickInsights: [
      {
        title: "Top Employees by Claim Amount",
        color: "#2F74D6",
        Icon: Users,
        items: [
          { label: "Sneha Rao", value: "₹820k", percent: 100 },
          { label: "Amit Joshi", value: "₹760k", percent: 92 },
          { label: "Geeta Mehra", value: "₹690k", percent: 83 },
          { label: "Nikhil Shah", value: "₹610k", percent: 74 },
          { label: "Rohan Das", value: "₹560k", percent: 68 },
        ],
      },
      {
        title: "Top Hospitals Used",
        color: "#FF9800",
        Icon: BriefcaseMedical,
        items: [
          { label: "Apollo Hospital", value: "₹840k", percent: 100 },
          { label: "Aster CMI", value: "₹720k", percent: 86 },
          { label: "Fortis", value: "₹640k", percent: 76 },
          { label: "Manipal", value: "₹590k", percent: 70 },
          { label: "Kauvery", value: "₹510k", percent: 61 },
        ],
      },
      {
        title: "Disease Category Breakdown",
        color: "#22C55E",
        Icon: Stethoscope,
        items: [
          { label: "Cardiac", value: "₹840k", percent: 100 },
          { label: "Cancer", value: "₹730k", percent: 87 },
          { label: "Stroke", value: "₹610k", percent: 73 },
          { label: "Respiratory", value: "₹540k", percent: 64 },
          { label: "Renal", value: "₹460k", percent: 55 },
        ],
      },
    ],
  },
  gpa: {
    policy: {
      id: "gpa",
      name: "Group Personal Accident",
      policyNo: "GPA-2025-003",
      policyPeriod: "15 Jan 26 - 14 Jan 27",
      dotColor: "#22C55E",
      totalLives: 1250,
      sumInsured: "₹47.0L",
      netPremium: "₹18,20,000",
      activeClaims: 41,
      enrolledCount: 365,
      totalCount: 486,
      enrollmentPct: 75,
      claimUtilPct: 31,
    },
    policyCode: "GPA",
    status: "Active",
    kpis: [
      { label: "Total Lives", value: "1250", Icon: Users, color: "#2F74D6" },
      {
        label: "Net Premium",
        value: "₹18,20,000",
        Icon: TrendingUp,
        color: "#22C55E",
      },
      {
        label: "CD Balance",
        value: "₹4,40,000",
        Icon: CreditCard,
        color: "#56CFE1",
      },
      {
        label: "Claim Count",
        value: "41",
        Icon: CircleDollarSign,
        color: "#8B5CF6",
      },
      {
        label: "Policy Period",
        value: "15 Jan 26 - 14 Jan 27",
        Icon: CalendarDays,
        color: "#EAB308",
      },
    ],
    subComponents: [
      {
        name: "Accident Cover",
        subtitle: "486 lives · 41 claims",
        enrolled: "486 emp",
        coverage: "₹47.0L",
        premium: "₹3.8L",
        claims: "41",
        status: "Active",
      },
      {
        name: "Disability Rider",
        subtitle: "203 lives · 12 claims",
        enrolled: "203 emp",
        coverage: "₹16.0L",
        premium: "₹1.2L",
        claims: "12",
        status: "Active",
      },
    ],
    enrollment: {
      enrolledPct: 75,
      current: 365,
      total: 486,
      metrics: [
        { label: "Enrolled", value: "174", Icon: UserRoundCheck },
        { label: "Pending", value: "14", Icon: Clock3 },
        { label: "Dependents", value: "177", Icon: CircleCheck },
      ],
    },
    monthlyTrend: [
      { month: "Jan", claims: 11, settled: 9 },
      { month: "Feb", claims: 14, settled: 11 },
      { month: "Mar", claims: 8, settled: 6 },
      { month: "Apr", claims: 13, settled: 10 },
      { month: "May", claims: 15, settled: 12 },
      { month: "Jun", claims: 7, settled: 5 },
      { month: "Jul", claims: 9, settled: 7 },
    ],
    utilisation: {
      percent: 31,
      totalClaims: "₹16.8 L",
      avgClaim: "₹0.9 L",
      outstanding: "₹2.48 L",
    },
    quickInsights: [
      {
        title: "Top Employees by Claim Amount",
        color: "#2F74D6",
        Icon: Users,
        items: [
          { label: "Rahul Dev", value: "₹640k", percent: 100 },
          { label: "Mehul Jain", value: "₹590k", percent: 92 },
          { label: "Priya Sen", value: "₹520k", percent: 81 },
          { label: "Asha Pillai", value: "₹470k", percent: 73 },
          { label: "Mohan Iyer", value: "₹420k", percent: 66 },
        ],
      },
      {
        title: "Top Hospitals Used",
        color: "#FF9800",
        Icon: BriefcaseMedical,
        items: [
          { label: "Fortis", value: "₹620k", percent: 100 },
          { label: "Apollo", value: "₹580k", percent: 94 },
          { label: "KIMS", value: "₹490k", percent: 79 },
          { label: "Aster", value: "₹430k", percent: 69 },
          { label: "Narayana", value: "₹390k", percent: 63 },
        ],
      },
      {
        title: "Disease Category Breakdown",
        color: "#22C55E",
        Icon: Stethoscope,
        items: [
          { label: "Fracture", value: "₹620k", percent: 100 },
          { label: "Head Injury", value: "₹560k", percent: 90 },
          { label: "Burns", value: "₹470k", percent: 76 },
          { label: "Trauma", value: "₹430k", percent: 69 },
          { label: "Sprain", value: "₹380k", percent: 61 },
        ],
      },
    ],
  },
};

function buildTrendPoints(
  values: number[],
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x =
        paddingX +
        (index * (width - paddingX * 2)) / Math.max(values.length - 1, 1);
      const y =
        height - paddingY - ((value - min) / range) * (height - paddingY * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function DetailCard({
  children,
  sx = {},
}: {
  children: ReactNode;
  sx?: Record<string, unknown>;
}) {
  return (
    <Box
      sx={{
        background: "#FFFFFF",
        border: "1px solid #D9E6F3",
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function MetricKpi({
  label,
  value,
  Icon,
  color,
}: {
  label: string;
  value: string;
  Icon: typeof Users;
  color: string;
}) {
  return (
    <Box
      sx={{
        px: 3,
        py: 3,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: 120,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "16px",
          background: color,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.28)",
        }}
      >
        <Icon size={22} />
      </Box>
      <Box>
        <Typography sx={{ color: "#667085", fontSize: 12, mb: 0.75 }}>
          {label}
        </Typography>
        <Typography
          sx={{
            color: "#1d2939",
            fontSize: label === "Policy Period" ? 17 : 22,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function QuickInsightCard({
  title,
  color,
  Icon,
  items,
}: {
  title: string;
  color: string;
  Icon: typeof Users;
  items: QuickInsightItem[];
}) {
  return (
    <DetailCard sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.05, mb: 2.2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "9px",
            background: `${color}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color={color} />
        </Box>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.15 }}>
        {items.map((item) => (
          <Box key={item.label}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.75,
              }}
            >
              <Typography sx={{ fontSize: 11.5, color: "#4B5563" }}>
                {item.label}
              </Typography>
              <Typography
                sx={{ fontSize: 11.5, color: "#111827", fontWeight: 600 }}
              >
                {item.value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "#EBEEF2",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${item.percent}%`,
                  height: "100%",
                  background: color,
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </DetailCard>
  );
}

export function PolicyDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const routeState = location.state as PolicyDetailLocationState | null;
  const policyId = params.policyId ?? routeState?.policy?.id ?? "gmc";
  const dataset = DETAIL_DATA[policyId] ?? DETAIL_DATA.gmc;
  const policy = routeState?.policy ?? dataset.policy;
  const policyOptions = ["GMC", "GTL", "GPA"];

  const claimLine = buildTrendPoints(
    dataset.monthlyTrend.map((point) => point.claims),
    420,
    152,
    24,
    18
  );
  const settledLine = buildTrendPoints(
    dataset.monthlyTrend.map((point) => point.settled),
    420,
    152,
    24,
    18
  );

  return (
    <Box
      sx={{
        mx: -3,
        mt: -0.25,
        minHeight: "calc(100% + 12px)",
        background: "#EAF4FF",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 26,
          background: "#EAF4FF",
        }}
      >
        <Box
          sx={{
            overflow: "hidden",
            background:
              "linear-gradient(90deg, rgba(23,94,183,1) 0%, rgba(25,125,193,1) 100%)",
          }}
        >
          <Box
            sx={{
              px: 3,
              minHeight: 64,
              display: "flex",
              alignItems: "center",
              gap: 1.4,
            }}
          >
            <Box
              onClick={() => navigate(-1)}
              sx={{
                height: 34,
                px: 1.2,
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.8)",
                color: "#FFFFFF",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
                fontSize: 10.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} />
              Back
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                sx={{
                  color: "#FFFFFF",
                  ...PORTAL_HEADER_TITLE_SX,
                }}
              >
                {policy.name}
              </Typography>

              <Box
                sx={{
                  px: 1.2,
                  height: 20,
                  borderRadius: 999,
                  background: "#E9F9EE",
                  color: "#0F9D58",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.45,
                  fontSize: 9,
                  fontWeight: 600,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#0F9D58",
                  }}
                />
                {dataset.status}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            height: 50,
            borderBottom: "1px solid #D7E5F3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            background: "#FFFFFF",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.45,
              height: "100%",
              color: "#2F74D6",
              fontSize: 11.5,
              fontWeight: 600,
              borderBottom: "2px solid #2F74D6",
            }}
          >
            <Shield size={12} />
            Overview
          </Box>

          <PortalSelectControl
            value={dataset.policyCode}
            onChange={(value) =>
              navigate(`/hr-portal/policies/${value.toLowerCase()}`, {
                replace: true,
              })
            }
            options={policyOptions}
            width={136}
            height={30}
            fontSize={11}
            borderRadius="8px"
          />
        </Box>
      </Box>

      <Box
        sx={{
          px: 3,
          py: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        <DetailCard
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            overflow: "hidden",
            background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
            border: "1px solid #FFF",
            boxShadow: "0 6px 100px 0 rgba(0, 0, 0, 0.10)",
          }}
        >
          {dataset.kpis.map((kpi, index) => (
            <Box
              key={kpi.label}
              sx={{
                borderLeft: index === 0 ? "none" : "1px solid #E8EFF7",
              }}
            >
              <MetricKpi {...kpi} />
            </Box>
          ))}
        </DetailCard>

        <DetailCard sx={{ p: 3 }}>
          <Typography
            sx={{ color: "#111827", fontSize: 13, fontWeight: 600, mb: 1.75 }}
          >
            Policy Sub-Components
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "2.1fr 1.2fr 1.3fr 1.35fr 1.1fr 0.9fr",
              gap: 1.6,
              pb: 1.2,
              borderBottom: "1px solid #EBF1F7",
            }}
          >
            {[
              "Sub-Component",
              "Enrolled",
              "Coverage",
              "Premium/MO",
              "Claims",
              "Status",
            ].map((header) => (
              <Typography
                key={header}
                sx={{ color: "#7B8794", fontSize: 10.5 }}
              >
                {header}
              </Typography>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.55,
              pt: 1.5,
            }}
          >
            {dataset.subComponents.map((row, index) => (
              <Box
                key={row.name}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2.1fr 1.2fr 1.3fr 1.35fr 1.1fr 0.9fr",
                  gap: 1.6,
                  alignItems: "center",
                  minHeight: 52,
                }}
              >
                <Box>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.55 }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: index === 0 ? "#22C55E" : "#2F74D6",
                      }}
                    />
                    <Typography
                      sx={{ color: "#111827", fontSize: 13, fontWeight: 600 }}
                    >
                      {row.name}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ color: "#7B8794", fontSize: 10.5, mt: 0.45 }}
                  >
                    {row.subtitle}
                  </Typography>
                </Box>
                <Typography sx={{ color: "#111827", fontSize: 12 }}>
                  {row.enrolled}
                </Typography>
                <Typography sx={{ color: "#111827", fontSize: 12 }}>
                  {row.coverage}
                </Typography>
                <Typography sx={{ color: "#111827", fontSize: 12 }}>
                  {row.premium}
                </Typography>
                <Typography sx={{ color: "#2F74D6", fontSize: 12 }}>
                  {row.claims}
                </Typography>
                <Box
                  sx={{
                    width: "fit-content",
                    px: 1.05,
                    py: 0.35,
                    borderRadius: 999,
                    background: "#E9F9EE",
                    color: "#16A34A",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {row.status}
                </Box>
              </Box>
            ))}
          </Box>
        </DetailCard>

        <DetailCard sx={{ p: 3 }}>
          <Typography
            sx={{ color: "#111827", fontSize: 13, fontWeight: 600, mb: 1.85 }}
          >
            Enrollment Progress
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 0.7,
            }}
          >
            <Typography sx={{ color: "#7B8794", fontSize: 11 }}>
              Enrolled Members
            </Typography>
            <Typography
              sx={{ color: "#12B981", fontSize: 13, fontWeight: 600 }}
            >
              {dataset.enrollment.enrolledPct}% enrolled
            </Typography>
            <Typography sx={{ color: "#12B981", fontSize: 12 }}>
              {dataset.enrollment.current} / {dataset.enrollment.total}
            </Typography>
          </Box>
          <Box
            sx={{
              width: "100%",
              height: 10,
              borderRadius: "999px",
              background: "#DDE7F1",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${dataset.enrollment.enrolledPct}%`,
                height: "100%",
                background: "#12C48B",
                borderRadius: "999px",
              }}
            />
          </Box>
          <Box
            sx={{
              mt: 0.45,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Typography sx={{ color: "#7B8794", fontSize: 10 }}>0%</Typography>
            <Typography sx={{ color: "#7B8794", fontSize: 10 }}>
              100%
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 2.25,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              alignItems: "center",
            }}
          >
            {dataset.enrollment.metrics.map((metric, index) => (
              <Box
                key={metric.label}
                sx={{
                  px: 2.8,
                  py: 0.3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  borderLeft: index === 0 ? "none" : "1px solid #E8EFF7",
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    border: "1px solid #EEF3F8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B7280",
                  }}
                >
                  <metric.Icon size={17} />
                </Box>
                <Box>
                  <Typography sx={{ color: "#7B8794", fontSize: 11.5 }}>
                    {metric.label}
                  </Typography>
                  <Typography
                    sx={{ color: "#111827", fontSize: 24, fontWeight: 600 }}
                  >
                    {metric.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </DetailCard>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 0.98fr",
            gap: 2,
          }}
        >
          <DetailCard sx={{ p: 3 }}>
            <Typography
              sx={{ color: "#111827", fontSize: 13, fontWeight: 600, mb: 1.7 }}
            >
              Monthly Claim Trend
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.9, mb: 1.35 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#2F74D6",
                  }}
                />
                <Typography sx={{ color: "#7B8794", fontSize: 10.5 }}>
                  Claims
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#12B981",
                  }}
                />
                <Typography sx={{ color: "#7B8794", fontSize: 10.5 }}>
                  Settled
                </Typography>
              </Box>
            </Box>

            <Box sx={{ position: "relative", height: 210 }}>
              <Box
                sx={{
                  position: "absolute",
                  inset: "8px 8px 30px 34px",
                  display: "grid",
                  gridTemplateRows: "repeat(4, 1fr)",
                  zIndex: 1,
                }}
              >
                {[0, 1, 2, 3].map((line) => (
                  <Box key={line} sx={{ borderTop: "1px solid #EEF3F8" }} />
                ))}
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 10,
                  bottom: 28,
                  width: 28,
                  display: "grid",
                  gridTemplateRows: "repeat(5, 1fr)",
                  alignItems: "center",
                  zIndex: 1,
                }}
              >
                {[30, 22.5, 15, 7.5, 0].map((value) => (
                  <Typography
                    key={value}
                    sx={{ color: "#5A6472", fontSize: 10, textAlign: "left" }}
                  >
                    {value}
                  </Typography>
                ))}
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  inset: "0 0 30px 34px",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 420 152"
                  preserveAspectRatio="none"
                  style={{ overflow: "visible", pointerEvents: "none" }}
                >
                  <polyline
                    fill="none"
                    stroke="#2F74D6"
                    strokeWidth="4"
                    points={claimLine}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    fill="none"
                    stroke="#12B981"
                    strokeWidth="4"
                    points={settledLine}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {dataset.monthlyTrend.map((point, index) => {
                    const claimValues = dataset.monthlyTrend.map(
                      (item) => item.claims
                    );
                    const settledValues = dataset.monthlyTrend.map(
                      (item) => item.settled
                    );
                    const claimCoords = buildTrendPoints(
                      claimValues,
                      420,
                      152,
                      24,
                      18
                    )
                      .split(" ")
                      [index].split(",");
                    const settledCoords = buildTrendPoints(
                      settledValues,
                      420,
                      152,
                      24,
                      18
                    )
                      .split(" ")
                      [index].split(",");
                    return (
                      <g key={point.month}>
                        <circle
                          cx={claimCoords[0]}
                          cy={claimCoords[1]}
                          r="5.5"
                          fill="#2F74D6"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        <circle
                          cx={settledCoords[0]}
                          cy={settledCoords[1]}
                          r="5.5"
                          fill="#12B981"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  inset: "0 8px 30px 34px",
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  zIndex: 3,
                }}
              >
                {dataset.monthlyTrend.map((point) => (
                  <Tooltip
                    key={point.month}
                    title={
                      <Box sx={{ p: 0.5 }}>
                        <Typography
                          sx={{ fontSize: 11, fontWeight: 600, mb: 0.5 }}
                        >
                          {point.month}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            mb: 0.3,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "2px",
                              background: "#2F74D6",
                              flexShrink: 0,
                            }}
                          />
                          <Typography sx={{ fontSize: 10.5 }}>
                            Claims: {point.claims}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "2px",
                              background: "#12B981",
                              flexShrink: 0,
                            }}
                          />
                          <Typography sx={{ fontSize: 10.5 }}>
                            Settled: {point.settled}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    placement="top"
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: "#1e293b",
                          "& .MuiTooltip-arrow": { color: "#1e293b" },
                          borderRadius: "8px",
                          px: 1.5,
                          py: 1,
                        },
                      },
                    }}
                  >
                    <Box
                      sx={{ width: "100%", height: "100%", cursor: "pointer" }}
                    />
                  </Tooltip>
                ))}
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  left: 34,
                  right: 8,
                  bottom: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  zIndex: 1,
                }}
              >
                {dataset.monthlyTrend.map((point) => (
                  <Typography
                    key={point.month}
                    sx={{
                      color: "#3F4652",
                      fontSize: 10,
                      textAlign: "center",
                    }}
                  >
                    {point.month}
                  </Typography>
                ))}
              </Box>
            </Box>
          </DetailCard>

          <DetailCard sx={{ p: 3 }}>
            <Typography
              sx={{ color: "#111827", fontSize: 13, fontWeight: 600, mb: 1.75 }}
            >
              Claim Utilisation
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "144px 1fr",
                gap: 2.4,
                alignItems: "center",
                minHeight: 180,
              }}
            >
              <Box
                sx={{
                  width: 116,
                  height: 116,
                  mx: "auto",
                  borderRadius: "50%",
                  background: `conic-gradient(#2F74D6 0 ${dataset.utilisation.percent}%, #E7EEF6 ${dataset.utilisation.percent}% 100%)`,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 12,
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    sx={{ color: "#2F74D6", fontSize: 26, fontWeight: 600 }}
                  >
                    {dataset.utilisation.percent}%
                  </Typography>
                  <Typography
                    sx={{ color: "#7B8794", fontSize: 9.5, lineHeight: 1.25 }}
                  >
                    of premium
                    <br />
                    utilised
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 1.25,
                  minHeight: 142,
                }}
              >
                {[
                  ["Total Claims", dataset.utilisation.totalClaims],
                  ["Avg Claim", dataset.utilisation.avgClaim],
                  ["Outstanding", dataset.utilisation.outstanding],
                ].map(([label, value]) => (
                  <Box
                    key={label}
                    sx={{
                      height: 48,
                      px: 1.75,
                      borderRadius: "8px",
                      background: "#FFFFFF",
                      border: "1px solid #EEF3F8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ color: "#4F5B68", fontSize: 11.5 }}>
                      {label}
                    </Typography>
                    <Typography
                      sx={{ color: "#111827", fontSize: 12.5, fontWeight: 600 }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </DetailCard>
        </Box>

        <Box>
          <Typography
            sx={{ color: "#111827", fontSize: 18, fontWeight: 600, mb: 0.9 }}
          >
            Quick Insights
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 2,
              pb: 1.6,
            }}
          >
            {dataset.quickInsights.map((insight) => (
              <QuickInsightCard key={insight.title} {...insight} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default PolicyDetail;
