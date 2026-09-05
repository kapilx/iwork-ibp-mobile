import {
  BREADCRUMB_KEYS,
  buildBreadcrumbState,
  createBreadcrumbEntry,
  DETAILS_KEYS,
  DETAILS_LABELS,
  endPoints,
  getBreadcrumbsFromState,
  getDateRange,
  Table,
  useActivityRoleVisibility,
  useBreadcrumbTrail,
  useLocalization,
  useTableController,
} from "@ui/ui-lib";
import { useEffect, useMemo } from "react";
import { TableSkeleton } from "../DashboardSkeletons";
import { myFollowUp } from "./config";
import { CellClickedEvent } from "ag-grid-community";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ALL_VALUE,
  BD_PLANNING,
  ISG_PLANNING,
  MANAGE_OPPORTUNITIES,
  MANAGE_QUOTES,
  MANAGE_RENEWAL_OPPORTUNITIES,
  OPPORTUNITY_TYPE_SO,
  RENEWAL_PLANNING,
} from "../../constants";

// BD/ISG Planning are synthetic stages; the opportunity list filters them by
// activity name alone, so the drilldown must not also pin a state/status.
const PLANNING_ACTIVITY_NAMES = [BD_PLANNING, ISG_PLANNING, RENEWAL_PLANNING];

const FOLLOW_UP_CLICKABLE_FIELDS = ["next30", "next60", "next90", "beyond90"];

const cleanValues = (filterValues: any) => {
  // const result = Object.entries(filterValues).filter
  return Object.fromEntries(
    Object.entries(filterValues).filter(
      ([, value]) => value !== ALL_VALUE && value !== "" && value !== null
    )
  );
};
interface MyFollowUpProps {
  filters: Record<string, string | number | { value: string; label: string }>;
  queryString: string;
  // "PLACEMENT" = the ISG activity rows over the combined SO+RO pipeline; it
  // drills into Manage Quotes with no type narrowing (spec §12.4).
  status?: "SO" | "RO" | "ALL" | "PLACEMENT";
  // When true the follow-up data can't honour the current filters (e.g. business
  // month), so it skips the fetch and renders an empty / not-applicable table.
  showNotApplicablePlaceholder?: boolean;
}
const MyFollowUp: React.FC<MyFollowUpProps> = ({
  filters,
  queryString,
  status = "ALL",
  showNotApplicablePlaceholder = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ISG-only viewers drill SO buckets into Manage Quotes (their combined
  // listing) — the SO listing is not in their menu. RO buckets keep routing to
  // the My RO page for everyone; BD and dual-role users keep the SO listing.
  const { canViewBD, canViewISG } = useActivityRoleVisibility();
  const routeToManageQuotes = canViewISG && !canViewBD;

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSort,
    summaryRowData,
  } = useTableController({
    endpoint: endPoints.myFollowUp,
    customPathParam: `${queryString.replace("?", "")}&type=${status}`,
    shouldShowLoader: false,
    enabled: !showNotApplicablePlaceholder,
    // All 18 activities (16 + BD/ISG Planning) fit on one page.
    defaultPageSize: 20,
    // customPathParam: `${queryString.replace("?", "")}`,
  });

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const roBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: DETAILS_LABELS.DASHBOARD,
            path: "/dashboard",
            key: BREADCRUMB_KEYS.DASHBOARD,
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.node.rowPinned) return;
    if (status === "ALL") return;
    const filteredValues = cleanValues(filters);
    const bucketField = event.colDef.field || "";
    const dateRange = getDateRange(bucketField);
    const { userId, owner, ...rest } = filteredValues ?? {};
    const currentFinancialYear = new Date().getFullYear().toString();
    const financialYr =
      filteredValues.financialYear?.value || currentFinancialYear;

    const period = "";
    const month = "";

    // next30 (age <= 30) also includes FUTURE-planned activities, so it sends
    // no upper bound (empty `to` is dropped; the backend applies ">= from").
    const isNext30Bucket = bucketField === "next30";

    // Synthetic BD/ISG/Renewal Planning rows are counted by opportunity
    // `createdAt` within the financial-year window (getPendingActivitiesSummary),
    // NOT by the activity/expiry date the real rows use. Drill on `createdAt`
    // with the FY floor so the drilldown list matches the count exactly.
    const followUpActivityName = event?.data?.activityName || "";
    const isPlanningRow = PLANNING_ACTIVITY_NAMES.includes(followUpActivityName);
    const fyStart = `${parseInt(financialYr)}-04-01`;
    const fyEnd = `${parseInt(financialYr) + 1}-03-31`;
    const rawBucketFrom = dateRange.from || fyStart;
    const bucketFrom = rawBucketFrom < fyStart ? fyStart : rawBucketFrom;

    const updateFilter = {
      ...rest,
      period,
      month,
      financialYear: "",
      from: bucketFrom,
      to: isNext30Bucket ? "" : dateRange.to || fyEnd,
      // NB: the date-axis field (createdAt vs expiryDate) is NOT set here — a
      // `field` key inside filters is treated as a search column. The listing
      // selects the column via useTableController's defaultFieldName
      // (ManageQuotesListing sends `createdAt` for planning drilldowns).
      viewBy: filteredValues.owner,
      ownerId: filteredValues.userId,
    };

    if (FOLLOW_UP_CLICKABLE_FIELDS.includes(event.colDef.field || "")) {
      // Placement rows are SO+RO by definition, so they always go to the combined
      // listing. SO rows go there only for ISG-only viewers, whose menu has no SO
      // listing. RO rows always go to the RO listing, ISG included (spec §12.4a).
      const isPlacement = status === "PLACEMENT";
      const toManageQuotes =
        isPlacement || (status === "SO" && routeToManageQuotes);
      const destination = toManageQuotes
        ? {
            label: MANAGE_QUOTES,
            path: `/manage-quotes`,
            key: BREADCRUMB_KEYS.MANAGE_QUOTES,
          }
        : status === "RO"
          ? {
              label: MANAGE_RENEWAL_OPPORTUNITIES,
              path: `/renewal-opportunities`,
              key: BREADCRUMB_KEYS.RENEWAL_OPPORTUNITY,
            }
          : {
              label: MANAGE_OPPORTUNITIES,
              path: `/opportunities`,
              key: BREADCRUMB_KEYS.SALES_OPPORTUNITY,
            };
      const destinationConfig = {
        ...destination,
        state: {
          fromDashboard: true,
          pendingActivities: true,
          anotherAfter: true,
          filters: {
            ...filters,
          },
        },
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: roBreadcrumb,
        crumb: destinationConfig,
        state: {
          fromDashboard: true,
          pendingActivities: true,
          another: true,
          ...(isPlacement ? { placementScrollTarget: "followUp" } : {}),
          filters: {
            ...updateFilter,
            activityName: [followUpActivityName],
            // BD/ISG Planning rows carry no status filter — the activity name is
            // the identifier; real activities still filter to Active.
            ...(isPlanningRow ? {} : { state: ["Active"] }),
            // Manage Quotes is a combined SO+RO list; narrow it to SO via its
            // Opty. Type filter (sent as the optyType query param on load). A
            // Placement drill wants both types, so it sends no narrowing.
            ...(toManageQuotes && !isPlacement
              ? { optyType: [OPPORTUNITY_TYPE_SO] }
              : {}),
          },
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
    }
  };

  const { localizationData } = useLocalization();
  const getmyFollowUpColumns = useMemo(() => {
    return myFollowUp(localizationData?.data).map((col) => ({
      ...col,
      ...(status === "ALL"
        ? {
            cellStyle: { cursor: "default" },
            ...(FOLLOW_UP_CLICKABLE_FIELDS.includes(col.field || "")
              ? { cellClass: "right-aligned-cell" }
              : {}),
          }
        : {}),
    }));
  }, [localizationData, status]);

  // First load only (loading with nothing to show yet) gets the skeleton; a
  // refetch already has rows on screen, so it keeps the grid's own loader
  // rather than collapsing the section back to placeholders.
  if (!showNotApplicablePlaceholder && loading && !rowData?.length) {
    return (
      <TableSkeleton rows={6} cols={getmyFollowUpColumns.length || 5} />
    );
  }

  return (
    <>
      <Table
        columns={getmyFollowUpColumns}
        rowData={showNotApplicablePlaceholder ? [] : rowData}
        summaryRowData={showNotApplicablePlaceholder ? [] : summaryRowData}
        freezeLastRow
        totalRows={showNotApplicablePlaceholder ? 0 : totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={showNotApplicablePlaceholder ? false : loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        onPrimaryActionClick={() => {}}
        setSort={setSort}
        components={{}}
        // title={"My Followup: "}
        height={350}
        hidePagination
      />
    </>
  );
};
export default MyFollowUp;
