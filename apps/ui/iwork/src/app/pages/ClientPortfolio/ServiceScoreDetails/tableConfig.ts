import {
  formatNumberByLocalization,
  formatNumberInputByLocalization,
} from "@ui/ui-lib";

export const rowData = [
  {
    serviceName: "Endorsement",
    noOfPolicies: "2/5",
    scored: 1.6,
    wtg_score: 4,
    wtg: 4,
    tatBuckets: [
      { id: "tat1", label: "0–5 days", count: 3 },
      { id: "tat2", label: "6–10 days", count: 1 },
      { id: "tat3", label: "11–15 days", count: 0 },
      { id: "tat4", label: "16–20 days", count: 0 },
      { id: "tat5", label: "21–25 days", count: 0 },
      { id: "tat6", label: "26–30 days", count: 0 },
      { id: "tat7", label: "31–35 days", count: 0 },
      { id: "tat8", label: "36–40 days", count: 0 },
      { id: "tat9", label: "41–45 days", count: 0 },
      { id: "tat10", label: ">45 days", count: 0 },
      { id: "tat11", label: ">45 days", count: 0 },
      { id: "tat12", label: ">45 days", count: 0 },
      { id: "tat13", label: ">45 days", count: 0 },
    ],
  },
  {
    serviceName: "Health Claims",
    noOfPolicies: "0/0",
    scored: 0,
    wtg_score: 10,
    wtg: 10,
    tatBuckets: [
      { id: "tat1", label: "0–7 days", count: 4 },
      { id: "tat2", label: "8–15 days", count: 2 },
    ],
  },
  {
    serviceName: "Non Health Claims",
    noOfPolicies: "0/0",
    scored: 0,
    wtg_score: 10,
    wtg: 10,
    tatBuckets: [{ id: "tat1", label: "0–7 days", count: 0 }],
  },
];

// Helper: show "--" for null/undefined/""
const showDash = (v: any) => (v == null || v === "" ? "--" : v);

// Build a non-zero number of TAT columns even before data arrives (default 6)
function getMaxTat(rows: any[], fallback = 6) {
  const n =
    rows?.reduce(
      (max: number, r: any) => Math.max(max, r?.tatBuckets?.length || 0),
      0
    ) || 0;
  return n || fallback;
}

// Build a map of header labels for each tatN (first non-empty label found)
function getTatLabelMap(rows: any[], maxTat: number): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 0; i < maxTat; i++) {
    const id = `tat${i + 1}`;
    let label = "";
    for (const r of rows || []) {
      const found = r?.tatBuckets?.find((b: any) => b?.id === id);
      if (found?.label) {
        label = String(found.label);
        break;
      }
    }
    map[id] = label; // empty if nothing found
  }
  return map;
}

export function columnDefs(rows: any[]) {
  const maxTat = getMaxTat(rows);
  const tatLabelMap = getTatLabelMap(rows, maxTat);

  const tatCols = Array.from({ length: maxTat }, (_, i) => {
    const id = `tat${i + 1}`;
    const headerLabel = tatLabelMap[id];
    const headerText =
      headerLabel && headerLabel.trim().length > 0
        ? `TAT ${i + 1}\n(${headerLabel})`
        : `TAT ${i + 1}`;

    const getBucket = (p: any) =>
      p.data?.tatBuckets?.find((x: any) => x.id === id);

    return {
      headerName: headerText,
      colId: id,
      // render header on two lines
      wrapHeaderText: true,
      autoHeaderHeight: true,
      headerClass: "right-aligned-header tat-two-line",

      // cell value: COUNT only (label is in header now)
      valueGetter: (p: any) => {
        const b = getBucket(p);
        return b?.count ?? null;
      },
      valueFormatter: ({ value }: { value: any }) =>
        value == null ? "--" : formatNumberByLocalization(value),

      // tooltip can still show "count (label)"
      tooltipValueGetter: (p: any) => {
        const b = getBucket(p);
        if (!b || b.count == null) return "--";
        const label = showDash(b.label);
        return label === "--"
          ? `${b.count}`
          : `${formatNumberByLocalization(b.count)} (${label})`;
      },
      cellClass: "right-aligned-cell",
      sortable: false,
      minWidth: 120,
      width: 150,
      maxWidth: 250,
    };
  });
  const dashFormatter = ({ value }: { value: any }) =>
    showDash(formatNumberInputByLocalization(value));

  return [
    {
      headerName: "Service name",
      field: "serviceName",
      tooltipField: "serviceName",
      headerTooltip: "Service name",
      valueFormatter: ({ value }: { value: any }) =>
        value != null ? value : "--",
      tooltipValueGetter: ({ value }: { value: any }) =>
        value != null ? value : "--",
      pinned: "left",
      minWidth: 250,
      maxWidth: 350,
      // rowData is entirely prop-driven, no live paginated fetch backs this
      // table — matching the tatCols above, which already set sortable:false.
      sortable: false,
    },
    {
      headerName: "No. of request",
      valueGetter: (p: any) => p.data?.totalNumberOfEvents,
      headerTooltip: "No. of request",
      valueFormatter: dashFormatter,
      tooltipValueGetter: dashFormatter,
      cellClass: "right-aligned-cell",
      headerClass: "right-aligned-header",
      width: 150,
      maxWidth: 250,
      sortable: false,
    },
    ...tatCols,
    {
      headerName: "Scored",
      field: "scored",
      headerTooltip: "Scored",
      valueFormatter: dashFormatter,
      tooltipValueGetter: dashFormatter,
      cellClass: "right-aligned-cell",
      headerClass: "right-aligned-header",
      width: 100,
      maxWidth: 250,
      sortable: false,
    },
    {
      headerName: "Total marks",
      field: "totalMarks",
      headerTooltip: "Total marks",
      valueFormatter: dashFormatter,
      tooltipValueGetter: dashFormatter,
      cellClass: "right-aligned-cell",
      headerClass: "right-aligned-header",
      width: 120,
      maxWidth: 250,
      sortable: false,
    },
    {
      headerName: "Max. weightage ",
      field: "wtg",
      headerTooltip: "WTG",
      valueFormatter: dashFormatter,
      tooltipValueGetter: dashFormatter,
      cellClass: "right-aligned-cell",
      headerClass: "right-aligned-header",
      width: 150,
      maxWidth: 250,
      sortable: false,
    },
    {
      headerName: "Weighted scored",
      field: "wtg_score",
      headerTooltip: "Weighted scored",
      cellClass: "right-aligned-cell",
      headerClass: "right-aligned-header",
      valueFormatter: dashFormatter,
      tooltipValueGetter: dashFormatter,
      width: 150,
      maxWidth: 250,
      sortable: false,
    },
  ];
}
