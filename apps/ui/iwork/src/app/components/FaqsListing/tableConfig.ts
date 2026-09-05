import { ColDef } from "ag-grid-community";

export interface FaqData {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

// FAQ Table Columns
// Neither this table's own setSort (a no-op, see FaqsListing/index.tsx) nor
// the backend (GetPolicyFaqsDto has no sort field; getPolicyFaqs hardcodes
// its ORDER BY) support sorting — disableSort on every column instead of
// showing misleading, non-functional sort arrows.
export const getFaqColumns = (): ColDef[] => [
  {
    headerName: "Category",
    field: "category",
    tooltipField: "category",
    headerTooltip: "Category",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    minWidth: 150,
    disableSort: true,
  },
  {
    headerName: "Question",
    field: "question",
    tooltipField: "question",
    headerTooltip: "Question",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    minWidth: 200,
    flex: 1,
    wrapText: true,
    autoHeight: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    cellStyle: {
      lineHeight: "20px",
    },
    disableSort: true,
  },
  {
    headerName: "Answer",
    field: "answer",
    tooltipField: "answer",
    headerTooltip: "Answer",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    minWidth: 300,
    flex: 1,
    wrapText: true,
    autoHeight: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    cellStyle: {
      lineHeight: "20px",
    },
    disableSort: true,
  },
];

// Breadcrumbs
export const faqBreadcrumbs = (policyId: string | undefined) => [
  {
    label: "Policies",
    path: "/policies",
  },
  {
    label: `Policy details`,
    path: `/policies/${policyId}`,
  },
  {
    label: "FAQs",
    path: `/policies/${policyId}/faqs`,
  },
];
