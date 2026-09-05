export type MonthlySummaryIndicator = "GREEN" | "YELLOW" | "ORANGE" | "RED";

export interface MonthlySummaryMonth {
  month: string;
  marksScored: number;
  totalMarks: number;
  percentage: number;
  totalBucketScore: number;
  totalEvents: number;
  indicator: MonthlySummaryIndicator;
}

export interface MonthlySummaryTotals {
  marksScored: number;
  totalMarks: number;
  percentage: number;
  indicator: MonthlySummaryIndicator;
}

export interface MonthlySummaryData {
  orgId: number;
  year: number;
  companyId: number | null;
  months: MonthlySummaryMonth[];
  totals: MonthlySummaryTotals;
}

export interface MonthlyServiceDetailsTatBucket {
  id: string;
  label: string;
  count: number | null;
}

export interface MonthlyServiceDetailsMonth {
  id: number;
  serviceName: string;
  totalNumberOfEvents: number | null;
  scored: number | null;
  wtg: number | null;
  wtg_score: number | null;
  tatBuckets: MonthlyServiceDetailsTatBucket[];
}

export interface MonthlyServiceDetailsData {
  orgId: number;
  month: string;
  companyId: number | null;
  months: MonthlyServiceDetailsMonth[];
}

export interface ServiceScoreMonth {
  month: string; // "2024-04"
  label: string; // "Apr2024"
  scoredMarks: number;
  totalMarks: number;
  scorePercentage: number;
  indicator: MonthlySummaryIndicator;
  details: Record<string, Record<string, number>>;
}

export interface SummaryDetailsData {
  orgId: number;
  companyId: number;
  financialYear: number;
  serviceScore: ServiceScoreMonth[];
  totalServiceScore: number;
}
