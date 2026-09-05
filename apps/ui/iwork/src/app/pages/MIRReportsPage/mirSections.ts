export type ColType = "text" | "checkbox";

export interface MirColumn {
  label: string;
  editable?: boolean;
  type?: ColType; // defaults to "text"
}

export interface MirTable {
  id: string; // unique across all tables — used as state key prefix
  caption?: string; // sub-section heading / note
  columns: MirColumn[];
  rows: (string | boolean)[][]; // populated from API; empty here
  asFields?: boolean; // render columns as standalone labeled inputs (row 0) instead of a table
}

export interface MirSection {
  id: string;
  title: string;
  tables: MirTable[];
  footer?: string; // e.g. §10 Total Service Score
  hasSummary?: boolean; // render the per-section Section Summary box
}

const col = (label: string): MirColumn => ({ label });
const crm = (label: string): MirColumn => ({ label, editable: true });
const check = (label: string): MirColumn => ({ label, editable: true, type: "checkbox" });

export const MIR_SECTIONS: MirSection[] = [
  {
    id: "s1",
    title: "Critical Issues Needing Your Immediate Attention",
    hasSummary: true,
    tables: [
      {
        id: "s1t1",
        columns: [
          col("Policy Type"),
          col("No. of Policies"),
          col("Incep. Premium"),
          crm("Remarks"),
          crm("Action"),
        ],
        rows: [],
      },
    ],
  },
  {
    id: "s2",
    title: "Claim Documentation",
    hasSummary: true,
    tables: [
      {
        id: "s2t1",
        columns: [col("Issues"), crm("Details"), crm("Remarks"), crm("Action")],
        rows: [],
      },
    ],
  },
  {
    id: "s3",
    title: "Renewals Due in 3 Months",
    hasSummary: true,
    tables: [
      {
        id: "s3t1",
        columns: [col("Policy"), col("Renewal Date"), col("Premium"), col("Opportunity Activity")],
        rows: [],
      },
    ],
  },
  {
    id: "s4",
    title: "Claims",
    hasSummary: true,
    tables: [
      {
        id: "s4t1",
        caption: "Policy to Claim Status",
        columns: [
          col("Type (Policy + number)"),
          col("Start of Month (No / Value)"),
          col("Received (No / Value)"),
          col("Paid (No / Value)"),
          col("End of Month (No / Value)"),
          crm("Remarks"),
        ],
        rows: [],
      },
      {
        id: "s4t2",
        caption: "Claim Analysis",
        columns: [
          col("Type (Policy + number)"),
          col("Incep. Premium"),
          col("Premium YTD"),
          col("Claims YTD"),
          col("Loss Ratio"),
          crm("Remarks"),
        ],
        rows: [],
      },
      {
        id: "s4t3",
        caption: "Claim Aging Analysis (Reimbursement only)",
        columns: [
          col("Type (Policy + number)"),
          col("Outstanding"),
          col(">45 Days (No / Value)"),
          col(">30 Days (No / Value)"),
          col(">15 Days (No / Value)"),
          col("<15 Days (No / Value)"),
        ],
        rows: [],
      },
      {
        id: "s4t4",
        caption: "Issues on Claims >30 & <45 Days (Reimbursement only)",
        columns: [
          col("Claim Reference"),
          col("Type (Policy + number)"),
          col("Claim Amount"),
          col("Claims Date"),
          crm("Reason for Pendancy"),
        ],
        rows: [],
      },
    ],
  },
  {
    id: "s5",
    title: "Risk Matrix",
    hasSummary: true,
    tables: [
      {
        id: "s5t1",
        caption: "Financial · Liabilities · People · Property",
        columns: [
          col("Risk"),
          col("Risk Type"),
          check("Exposure"),
          check("Cover"),
          check("Adequacy"),
          crm("Remarks"),
        ],
        rows: [],
      },
    ],
  },
  {
    id: "s6",
    title: "Portfolio Detail",
    hasSummary: true,
    tables: [
      {
        id: "s6t1",
        caption: "Premium figures without service tax",
        columns: [
          col("Type (Policy + number)"),
          col("Renewal Date"),
          col("Incep. Premium"),
          col("Sum Insured"),
          col("Premium YTD"),
          col("Claim YTD"),
          col("Insurer"),
        ],
        rows: [],
      },
    ],
  },
  {
    id: "s7",
    title: "Policy Insurer Details",
    hasSummary: true,
    tables: [
      {
        id: "s7t1",
        columns: [col("Type (Policy + number)"), col("Insurer Name"), col("Insurer Branch"), col("Contact Person")],
        rows: [],
      },
    ],
  },
  {
    id: "s8",
    title: "Head Count",
    hasSummary: true,
    tables: [
      {
        id: "s8t1",
        caption: "Health Policies",
        columns: [
          col("Type (Policy + number)"),
          col("Current Count"),
          col("Additions"),
          col("Deletions"),
          col("Current Total"),
          col("Premium YTD"),
        ],
        rows: [],
      },
      {
        id: "s8t2",
        caption: "Non-Health Policies",
        columns: [
          col("Type (Policy + number)"),
          col("Current Count"),
          col("Additions"),
          col("Deletions"),
          col("Current Total"),
          col("Premium YTD"),
        ],
        rows: [],
      },
    ],
  },
  {
    id: "s9",
    title: "Cash Deposit Account",
    hasSummary: true,
    tables: [
      {
        id: "s9t1",
        caption: "One row per CD account",
        columns: [
          col("CD Account"),
          col("Insurer"),
          col("Opening Balance"),
          col("Total Credits"),
          col("Total Debits"),
          col("Closing Balance"),
          col("Status"),
          col("Linked Policies"),
        ],
        rows: [],
      },
    ],
  },
  {
    id: "s10",
    title: "Our Service Tracker",
    hasSummary: true,
    tables: [
      {
        id: "s10t1",
        columns: [
          col("Service Name"),
          col("No. of Requests"),
          col("0–7 Days"),
          col("8–10 Days"),
          col("11–21 Days"),
          col("22–30 Days"),
          col("31–45 Days"),
          col("46+ Days"),
          col("Scored"),
          col("Total Marks"),
          col("Weighted Score"),
          col("WTG"),
        ],
        rows: [],
      },
    ],
  },
  {
    id: "s11",
    title: "Other Activities",
    hasSummary: true,
    tables: [
      {
        id: "s11t1",
        columns: [crm("Special Initiatives"), crm("Monthly Meeting Issues"), crm("Other Issues")],
        rows: [],
        asFields: true,
      },
    ],
  },
  {
    id: "s12",
    title: "Current Month Plan",
    hasSummary: true,
    tables: [
      {
        id: "s12t1",
        caption: "Documentation · Claims · Meetings · Others · Renewals",
        columns: [col("Category"), crm("Timelines"), crm("Responsibility"), crm("Remarks")],
        rows: [],
      },
    ],
  },
];

// §13 is a single MIR-level free-text box, handled separately on the page.
export const COMPANY_OPTIONS = [
  { value: "acme", label: "Acme Corp Pvt Ltd" },
  { value: "teamlease", label: "Teamlease Midland Group" },
  { value: "globex", label: "Globex Industries Ltd" },
];

export type MirStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Published"
  | "Acknowledged";

export interface PastReport {
  id: string;
  company: string;
  period: string; // "MMM YYYY"
  status: MirStatus;
  owner: string;
  generatedOn: string;
}
