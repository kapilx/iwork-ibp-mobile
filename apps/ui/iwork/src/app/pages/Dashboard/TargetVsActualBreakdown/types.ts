export type BreakdownDimension = "By Quarter" | "By Business Lines" | "By SBU" | "By Branches";

export interface BreakdownBar {
  label: string;
  soActual: number;
  roActual: number;
  soTarget: number;
  roTarget: number;
}

export interface BreakdownTotal {
  actual: number;
  target: number;
}

export type BreakdownNested = Record<string, Record<string, BreakdownBar[]>>;

export type DashboardFilter = "Q1" | "YTM" | "YTD";
