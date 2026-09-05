export const POLICY_DATA = {
  id: "gmc",
  name: "Group Mediclaim Policy",
  policyNo: "GHI-2025-001",
  period: "01 Apr 2025 – 31 Mar 2026",
  insurer: "HDFC Ergo",
  tpa: "MEDI-TPA-4521",
  annualPremium: "₹50L",
  policyType: "Health",
};

export const INSIGHT = {
  severity: "risk" as const,
  premiumChangePct: 4,
  changeDir: "up" as const,
  headline: "4% premium increase expected at renewal",
  reason: "ICR rose from 67% → 72% YoY, crossing the safe threshold of 70%",
  recommendation: "Implement wellness programs and tighten pre-auth controls to reduce high-value claims.",
};

export const KPIS = {
  icr: { value: 72, threshold: 70, lastYear: 67, change: 5, changeDir: "up" as const },
  incurred: { current: "₹52.6L", currentNum: 52.6, lastYear: "₹50.4L", changeStr: "+₹2.2L", changeDir: "up" as const },
  claims: { current: 2800, lastYear: 2200, change: 600, changePct: 27, changeDir: "up" as const },
  cdBalance: {
    available: "₹2 CR",
    availableNum: 2,
    required: "₹5 CR",
    requiredNum: 5,
    availablePct: 40,
  },
};

// 12-month ICR trend — Apr to Mar; null = data not yet available
export const MONTHLY_TREND = [
  { month: "Apr", current: 65,   lastYTD: 60,   lastFull: 60 },
  { month: "May", current: 72,   lastYTD: 67,   lastFull: 67 },
  { month: "Jun", current: null, lastYTD: 70,   lastFull: 70 },
  { month: "Jul", current: null, lastYTD: null, lastFull: 68 },
  { month: "Aug", current: null, lastYTD: null, lastFull: 72 },
  { month: "Sep", current: null, lastYTD: null, lastFull: 75 },
  { month: "Oct", current: null, lastYTD: null, lastFull: 73 },
  { month: "Nov", current: null, lastYTD: null, lastFull: 70 },
  { month: "Dec", current: null, lastYTD: null, lastFull: 68 },
  { month: "Jan", current: null, lastYTD: null, lastFull: 66 },
  { month: "Feb", current: null, lastYTD: null, lastFull: 65 },
  { month: "Mar", current: null, lastYTD: null, lastFull: 64 },
];

export const COMPARISON = [
  { label: "ICR %",      current: "72%",      lastYTD: "67%",      lastFull: "69%",    currentNum: 72,    lastYTDNum: 67,    lastFullNum: 69,    higherIsBad: true },
  { label: "Incurred",   current: "₹52.6L",   lastYTD: "₹50.4L",  lastFull: "₹58.2L", currentNum: 52.6,  lastYTDNum: 50.4,  lastFullNum: 58.2,  higherIsBad: true },
  { label: "Claims",     current: "2,800",    lastYTD: "2,200",    lastFull: "2,950",   currentNum: 2800,  lastYTDNum: 2200,  lastFullNum: 2950,  higherIsBad: true },
  { label: "Avg. Claim", current: "₹18,786",  lastYTD: "₹22,909", lastFull: "₹19,729", currentNum: 18786, lastYTDNum: 22909, lastFullNum: 19729, higherIsBad: true },
];

export const ENROLLMENT = {
  total: 59000,
  enrolled: 24000,
  dependents: 5000,
  inProgress: 7000,
  notEnrolled: 23000,
  deadline: "31 Dec 2025",
  daysLeft: 38,
};

export const AUTO_INSIGHTS = [
  { severity: "risk"    as const, text: "ICR at 72% has crossed the 70% safe threshold — renewal premium is at risk" },
  { severity: "risk"    as const, text: "CD balance at ₹2 CR is 60% below the ₹5 CR minimum — top up to prevent claim delays" },
  { severity: "warning" as const, text: "Claims count is up 27% YoY (2,200 → 2,800) — review top disease clusters" },
  { severity: "warning" as const, text: "Incurred value trending 4% higher than last year's same period" },
  { severity: "safe"    as const, text: "Average claim value dropped from ₹22,909 → ₹18,786 — positive sign" },
  { severity: "safe"    as const, text: "Enrollment window still open — 7,000 employees in progress" },
];
