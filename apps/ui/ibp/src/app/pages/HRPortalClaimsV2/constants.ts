import { CLAIMS } from "../../mock-data/hr-portal/claims";
import type { ClaimsKpi, ClaimsTab } from "./types";

export const CLAIMS_TABS: ClaimsTab[] = [
  { id: "all", label: "All Claims", active: true },
  { id: "intimate", label: "Submit Claim" },
  { id: "process", label: "Process Claim" },
  { id: "insights", label: "Insights" },
  { id: "procedure", label: "Claim Procedure" },
];

export const CLAIMS_KPIS: ClaimsKpi[] = [
  { id: "total", label: "Total Claims", value: "25", tint: "#EFF6FF" },
  { id: "paid", label: "Paid", value: "08", tint: "#F0FDF4" },
  { id: "outstanding", label: "Outstanding", value: "07", tint: "#FFF7ED" },
  { id: "rejected", label: "Rejected", value: "03", tint: "#FEF2F2" },
  { id: "closed", label: "Closed", value: "04", tint: "#F5F3FF" },
  { id: "denied", label: "Denied", value: "03", tint: "#FEF3C7" },
];

export const CLAIMS_ROWS = CLAIMS.slice(0, 10);
