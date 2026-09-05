import type { PolicyDetailPolicyId } from "../HRPortalDashboardV2/types";

export interface PolicyDetailHeader {
  policyId: PolicyDetailPolicyId;
  title: string;
  status: string;
  statusTone: "success" | "warning";
}

export interface PolicyDetailStatCard {
  id: string;
  label: string;
  value: string;
  tint: string;
  iconTone: string;
  icon:
    | "users"
    | "shield"
    | "wallet"
    | "briefcase"
    | "dependents"
    | "activity"
    | "ratio"
    | "claims"
    | "average";
}

export interface PolicyDetailTab {
  id: string;
  label: string;
  active?: boolean;
}

export interface PolicySubComponentRow {
  id: string;
  name: string;
  summary: string;
  enrolled: string;
  coverage: string;
  premiumPerMonth: string;
  claims: string;
  status: string;
  dotColor: string;
}

export interface EnrollmentProgressCardData {
  enrolled: number;
  total: number;
  enrolledLabel: string;
  pendingLabel: string;
  dependentsLabel: string;
}

export interface ClaimUtilisationBreakdown {
  label: string;
  value: string;
}

export interface MonthlyTrendDatum {
  label: string;
  claims: number;
  settled: number;
}

export interface RankedMetricDatum {
  id: string;
  label: string;
  value: string;
  helper: string;
  progress: number;
  color: string;
}

export interface IcrPeriodBar {
  label: string;
  shortLabel: string;
  claimsAmount: number;
  incurredPremium: number;
  icr: number;
  isPredicted: boolean;
  claimsColor: string;
  premiumColor: string;
}

export interface PolicyDetailPageData {
  header: PolicyDetailHeader;
  primaryStats: PolicyDetailStatCard[];
  secondaryStats: PolicyDetailStatCard[];
  tabs: PolicyDetailTab[];
  subComponents: PolicySubComponentRow[];
  enrollmentProgress: EnrollmentProgressCardData;
  claimUtilisation: {
    percent: number;
    subtitle: string;
    breakdown: ClaimUtilisationBreakdown[];
  };
  icrByPeriod: {
    periods: IcrPeriodBar[];
    forecast: { expectedIcr: number; claimsAmount: string; incurredPremium: string };
  };
  monthlyTrend: MonthlyTrendDatum[];
  topHospitals: RankedMetricDatum[];
  diseaseBreakdown: RankedMetricDatum[];
}
