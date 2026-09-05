import {
  BREADCRUMB_KEYS,
  buildBreadcrumbState,
  createBreadcrumbEntry,
  DETAILS_LABELS,
  endPoints,
  getBreadcrumbsFromState,
  Table,
  useLocalization,
  useTableController,
} from "@ui/ui-lib";
import { useMemo, useRef } from "react";
import { brokerageToCollect } from "./config";
import { TableSkeleton } from "../DashboardSkeletons";
import { CellClickedEvent } from "ag-grid-community";
import { ALL_VALUE, BIZ_DONE_REPORT } from "../../constants";
import { useLocation, useNavigate } from "react-router-dom";
import {
  endOfMonth,
  format,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";

const BROKERAGE_FIELDS = {
  CURRENT_MONTH: "currentMonth",
  LAST_MONTH: "lastMonth",
  PRIOR_TO_THAT: "priorToThat",
} as const;

type BrokerageField = (typeof BROKERAGE_FIELDS)[keyof typeof BROKERAGE_FIELDS];

const CLICKABLE_FIELDS: BrokerageField[] = Object.values(BROKERAGE_FIELDS);

const DATE_FORMAT = "yyyy-MM-dd";

/** Indian FY: April 1 of `year` → March 31 of `year + 1`. */
const getFinancialYearRange = (year: number): { start: Date; end: Date } => ({
  start: new Date(year, 3, 1),
  end: endOfMonth(new Date(year + 1, 2)),
});

/**
 * Returns the from/to date range for drilldown to biz done report.
 * The backend classifies columns relative to CURRENT_DATE, so:
 *   - currentMonth  = current calendar month
 *   - lastMonth     = previous calendar month
 *   - priorToThat   = everything in the selected FY that's neither of the above
 *
 * We use the selected FY to bound priorToThat so past FYs don't give wrong dates.
 */
const getBrokerageMonthRange = (
  field: BrokerageField,
  financialYear?: number | string
): { from: string; to: string } => {
  const today = new Date();

  const fyYear = financialYear
    ? Number(
        typeof financialYear === "object"
          ? (financialYear as any).value
          : financialYear
      ) || null
    : null;

  const defaultFyYear =
    today >= new Date(today.getFullYear(), 3, 1)
      ? today.getFullYear()
      : today.getFullYear() - 1;

  const { start: fyStart, end: fyEnd } = getFinancialYearRange(
    fyYear ?? defaultFyYear
  );

  switch (field) {
    case BROKERAGE_FIELDS.CURRENT_MONTH:
      return {
        from: format(startOfMonth(today), DATE_FORMAT),
        to: format(endOfMonth(today), DATE_FORMAT),
      };
    case BROKERAGE_FIELDS.LAST_MONTH: {
      const lastMonth = subMonths(today, 1);
      return {
        from: format(startOfMonth(lastMonth), DATE_FORMAT),
        to: format(endOfMonth(lastMonth), DATE_FORMAT),
      };
    }
    case BROKERAGE_FIELDS.PRIOR_TO_THAT: {
      // "Prior to that" = everything in the FY before lastMonth's start.
      // Cap at fyEnd so a past FY selection doesn't bleed into a future range.
      const dayBeforeLastMonth = subDays(startOfMonth(subMonths(today, 1)), 1);
      const toDate = dayBeforeLastMonth < fyEnd ? dayBeforeLastMonth : fyEnd;
      return {
        from: format(fyStart, DATE_FORMAT),
        to: format(toDate, DATE_FORMAT),
      };
    }
  }
};

const cleanValues = (filterValues: any) =>
  Object.fromEntries(
    Object.entries(filterValues).filter(
      ([, value]) => value !== ALL_VALUE && value !== "" && value !== null
    )
  );

interface BrokerageToCollectProps {
  filters: Record<string, string | number | { value: string; label: string }>;
  queryString: string;
}

const BrokerageToCollect: React.FC<BrokerageToCollectProps> = ({
  filters,
  queryString,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasLoadedOnceRef = useRef(false);
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
    endpoint: endPoints.brokerageToCollect,
    customPathParam: queryString.replace("?", ""),
    // useTableController defaults shouldShowLoader to true, which increments the
    // global loadingCount and blanks the whole dashboard behind Layout's
    // BlockingLoaderOverlay. This table already renders its own in-grid loader
    // (`loading` prop below), so keep the wait local to this section.
    shouldShowLoader: false,
  });

  const { localizationData } = useLocalization();
  const getBrokerageToCollectColumns = useMemo(
    () => brokerageToCollect(localizationData?.data),
    [localizationData]
  );

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

    const field = event.colDef.field ?? "";
    if (!CLICKABLE_FIELDS.includes(field as BrokerageField)) return;

    const filteredValues = cleanValues(filters);
    const { userId, owner, financialYear: fyFilter, ...rest } = filteredValues ?? {};

    // Resolve FY value — may be stored as a plain string/number or as {value, label}
    const resolvedFyYear = fyFilter
      ? String(typeof fyFilter === "object" ? (fyFilter as any).value : fyFilter)
      : null;

    // Always compute the column-specific date range using the selected FY for context.
    // getBrokerageMonthRange is FY-aware:
    //   - currentMonth / lastMonth → exact calendar-month boundaries (same regardless of FY)
    //   - priorToThat → FY start up to day before last-month start (capped at FY end)
    // Passing these from/to dates to biz done gives an exact match with what the
    // brokerage column showed.  The backend (streamPolicyReport) uses from/to when
    // both are present, so they take precedence over financialYear — which is still
    // included so the FY dropdown prefills correctly in the biz done report.
    const dateRange = getBrokerageMonthRange(field as BrokerageField, fyFilter);

    const updateFilter = {
      ...rest,
      period: "",
      month: "",
      // Always pass column-specific from/to so biz done data matches the clicked column.
      // Keep financialYear (if selected) so the dropdown stays prefilled.
      ...(resolvedFyYear ? { financialYear: fyFilter } : { financialYear: "" }),
      from: dateRange.from,
      to: dateRange.to,
      owner: filteredValues.owner,
      userId: filteredValues.userId,
    };

    const destinationConfig = {
      label: BIZ_DONE_REPORT,
      path: `/biz-done-report`,
      key: BREADCRUMB_KEYS.BIZ_DONE_REPORT,
    };
    const destinationState = buildBreadcrumbState({
      breadcrumbs: roBreadcrumb,
      crumb: destinationConfig,
      state: {
        fromDashboard: true,
        fromBrokerageToCollect: true,
        insurerId: event?.data?.insurerId,
        insurerName: event?.data?.insurerName,
        from: dateRange.from,
        to: dateRange.to,
        filters: updateFilter,
      },
    });

    navigate(destinationConfig.path, { state: destinationState });
  };

  // First load only. `!rowData?.length` alone isn't enough: sorting/paging/
  // searching all change useTableController's query key, so React Query briefly
  // reports `loading` with no data for every not-yet-cached combination — not
  // just the very first load. Without a latch, that flips this back to the
  // skeleton on every fresh sort click, unmounting the grid and resetting its
  // ag-grid-internal sort-arrow state even though the refetch is correctly
  // sorted underneath. Once the first load has completed, stay mounted and let
  // the grid's own in-grid loader handle every later refetch.
  hasLoadedOnceRef.current ||= !loading;
  if (loading && !hasLoadedOnceRef.current) {
    return (
      <TableSkeleton rows={4} cols={getBrokerageToCollectColumns.length || 6} />
    );
  }

  return (
    <>
      <Table
        columns={getBrokerageToCollectColumns}
        rowData={rowData}
        summaryRowData={summaryRowData}
        freezeLastRow
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        onPrimaryActionClick={() => {}}
        setSort={setSort}
        components={{}}
        // title={"Brokerage To Collect: "}
        height={350}
      />
    </>
  );
};
export default BrokerageToCollect;
