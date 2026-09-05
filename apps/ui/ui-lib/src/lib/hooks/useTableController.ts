import { useState, useEffect } from "react";
import { GENERIC_ERROR, PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../constants";
import { useApiQuery } from "./useApiQuery";
import { setToastMessage } from "../redux";
import { useDispatch } from "react-redux";

type sortModel = {
  colId: string;
  sort: "asc" | "desc";
};

/**
 * Pure query-string builder extracted from useTableController's internal
 * getSearchQueryParam, so callers that need the exact same "&search=...&
 * financialYear=...&..." shape the live listing sends (e.g. a "Generate
 * Report" export that must match what's currently on screen) can reuse it
 * instead of hand-rolling a second, drift-prone implementation.
 */
export const buildSmartSearchQueryString = (
  smartSearch: Record<string, any>,
  options: {
    searchFieldName?: string;
    fieldParam?: string;
    defaultFieldName?: string;
  } = {}
): string => {
  const { searchFieldName, fieldParam, defaultFieldName = "createdAt" } =
    options;
  let filterValues = Object.entries(smartSearch || {}).filter(
    ([_, value]) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      // multiselect fields hold [] when nothing is picked
      !(Array.isArray(value) && value.length === 0)
  );

  if (filterValues.length === 0) {
    return "";
  }

  let from = "&from=";
  let to = "&to=";
  let search = "&search=";
  let searchBy = "&searchBy=";
  let period = "&period=";
  let financialYear = "&financialYear=";
  let quarter = "&quarter=";
  let month = "&month=";
  let ownerId = "&ownerId=";
  let viewBy = "&viewBy=";
  let openTatOnly = "&openTatOnly=";
  let renewalPeriod = "&renewalPeriod=";
  let fromFunnel = "&fromFunnel=";
  let insurerId = "&insurerId=";
  let insurerBranchId = "&insurerBranchId=";
  let branchViewBy = "&branchViewBy=";
  let businessMonth = "&businessMonth=";

  // Iterate through the filter values and construct the search query
  // If the key is "from" or "to", append the value to the respective variable and remove it from the filterValues array

  filterValues.forEach(([key, value]) => {
    const val = typeof value === "object" ? (value as any).value : value;
    if (val === "all" || val === "ALL") return;
    if (key === "from") {
      from += `${val}`;
    } else if (key === "to") {
      to += `${val}`;
    } else if (key === "period") {
      period += `${val}`;
    } else if (key === "financialYear") {
      financialYear += `${val}`;
    } else if (key === "quarter") {
      quarter += `${val}`;
    } else if (key === "month") {
      month += `${val}`;
    } else if (key === "ownerId") {
      ownerId += `${val}`;
    } else if (key === "viewBy") {
      viewBy += `${val}`;
    } else if (key === "openTatOnly") {
      openTatOnly += `${val}`;
    } else if (key === "renewalPeriod") {
      renewalPeriod += `${val}`;
    } else if (key === "fromFunnel") {
      fromFunnel += `${val}`;
    } else if (key === "insurerId") {
      insurerId += `${val}`;
    } else if (key === "insurerBranchId") {
      insurerBranchId += `${val}`;
    } else if (key === "branchViewBy") {
      branchViewBy += `${val}`;
    } else if (key === "businessMonth") {
      businessMonth += `${val}`;
    }
  });
  // Filter out "from" and "to" from the filterValues array
  filterValues = filterValues.filter(
    ([key]) =>
      key !== "from" &&
      key !== "to" &&
      key !== "period" &&
      key !== "financialYear" &&
      key !== "quarter" &&
      key !== "month" &&
      key !== "ownerId" &&
      key !== "viewBy" &&
      key !== "openTatOnly" &&
      key !== "renewalPeriod" &&
      key !== "fromFunnel" &&
      key !== "insurerId" &&
      key !== "insurerBranchId" &&
      key !== "branchViewBy" &&
      key !== "businessMonth"
  );

  search = `&search=${filterValues
    .map(([key, rawValue]) => {
      const value = Array.isArray(rawValue)
        ? rawValue
        : typeof rawValue === "object" && rawValue !== null
        ? (rawValue as any).value
        : rawValue;

      if (key === searchFieldName) {
        searchBy += encodeURIComponent(String(value).trim());
        return "";
      } else if (key === "period") {
        // Special case for "period"
        return `${value}`;
      } else {
        if (Array.isArray(value)) {
          return `${key}:[${value
            .map((v: any) =>
              encodeURIComponent(
                v && typeof v === "object" && "value" in v ? v.value : v
              )
            )
            .join(",")}]`;
        } else {
          return `${key}:[${encodeURIComponent(value)}]`;
        }
      }
    })
    .filter((item) => item !== "")
    .join(",")}`;
  return (
    (search !== "&search=" ? search : "") +
    (searchBy !== "&searchBy=" ? searchBy : "") +
    (from === "&from=" || to === "&to" ? "" : (fieldParam ? "" : `&field=${defaultFieldName}`)) +
    (from !== "&from=" ? from : "") +
    (to !== "&to=" ? to : "") +
    (period !== "&period=" ? period : "") +
    (financialYear !== "&financialYear=" ? financialYear : "") +
    (quarter !== "&quarter=" ? quarter : "") +
    (month !== "&month=" ? month : "") +
    (ownerId !== "&ownerId=" ? ownerId : "") +
    (viewBy !== "&viewBy=" ? viewBy : "") +
    (openTatOnly !== "&openTatOnly=" ? openTatOnly : "") +
    (renewalPeriod !== "&renewalPeriod=" ? renewalPeriod : "") +
    (fromFunnel !== "&fromFunnel=" ? fromFunnel : "") +
    (insurerId !== "&insurerId=" ? insurerId : "") +
    (insurerBranchId !== "&insurerBranchId=" ? insurerBranchId : "") +
    (branchViewBy !== "&branchViewBy=" ? branchViewBy : "") +
    (businessMonth !== "&businessMonth=" ? businessMonth : "")
  );
};

/**
 * Same column-settings shape Table's own "Save View" builds from a live
 * columnOrder, extracted so callers persisting filters (e.g. Reset) can
 * reuse it and stay in sync instead of re-deriving the shape separately.
 */
export const buildColumnSettingsPayload = (columnOrder?: any[]) =>
  columnOrder?.map((item, index) => ({
    name: item.field,
    index,
    hide: item?.hide || false,
  }));

const useTableController = ({
  endpoint,
  customPathParam,
  searchFieldName,
  defaultPageSize = PAGE_SIZE,
  enabled = true,
  defaultFieldName = "createdAt",
  entityKey,
  shouldShowLoader = true,
  fieldParam,
}: {
  endpoint: string;
  customPathParam?: string;
  searchFieldName?: string;
  defaultPageSize?: number;
  enabled?: boolean;
  defaultFieldName?: string;
  entityKey?: string;
  shouldShowLoader?: boolean;
  fieldParam?: string;
}) => {
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sort, setSort] = useState<sortModel[]>([]);
  const [stringifySort, setStringifySort] = useState<string>("");
  const [smartSearch, setSmartSearch] = useState({});
  // Typed any[] (not the inferred never[]) so setColumnOrder is assignable to
  // Table's `Dispatch<SetStateAction<any[]>>` prop.
  const [columnOrder, setColumnOrder] = useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [smartSearch]);

  useEffect(() => {
    if (sort.length > 0) {
      const sortString = sort
        .map((s) => `${s.colId}:${s.sort.toUpperCase()}`)
        .join(",");
      setStringifySort(sortString);
    } else {
      setStringifySort("");
    }
  }, [sort]);

  // Sorting reorders the whole result set, so the current page no longer refers
  // to the same slice. Keyed on the serialised sort rather than the array so an
  // equal-but-new array from the grid does not reset the page.
  useEffect(() => {
    setCurrentPage(1);
  }, [stringifySort]);

  /**
   * Constructs a search query string based on the provided `smartSearch` object.
   * Filters out undefined, null, or empty values from the `smartSearch` object
   * and generates query parameters for search, date range, and search field.
   *
   * @returns {string} A query string containing search parameters. The string may include:
   * - `&search=`: A comma-separated list of key-value pairs for search filters.
   * - `&searchBy=`: A specific search field value if it matches the `searchFieldName`.
   * - `&field=createdAt`: Added if a date range (`from` or `to`) is specified.
   * - `&from=`: The starting date for the date range.
   * - `&to=`: The ending date for the date range.
   * If no valid filters are provided, an empty string is returned.
   */
  const getSearchQueryParam = () =>
    buildSmartSearchQueryString(smartSearch, {
      searchFieldName,
      fieldParam,
      defaultFieldName,
    });

  const getSortQueryParam = () => {
    return stringifySort ? `&sort=${stringifySort}` : "";
  };

  const customParamString = customPathParam ? `&${customPathParam}` : "";
  const fieldParamString = fieldParam ? `&field=${fieldParam}` : "";

  const fullUrl = `${endpoint}?page=${currentPage}&limit=${pageSize}${customParamString}${fieldParamString}${getSearchQueryParam()}${getSortQueryParam()}`;

  const { data, isLoading, isFetching, error, refetch } = useApiQuery({
    url: fullUrl,
    queryKey: ["tableData", fullUrl],
    shouldShowLoader: shouldShowLoader,
    enabled,
  });

  const loading = isLoading || isFetching;

  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      const saveApiResponse = error?.response?.data;
      dispatch(
        setToastMessage(
          saveApiResponse?.message ?? error?.message ?? GENERIC_ERROR
        )
      );
    }
  }, [error]);

  return {
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    loading,
    rowData: data?.data?.data || data?.data || [],
    totalRows: data?.data?.count || data?.count || 0,
    summaryRowData: data?.data?.summary || data?.data,
    searchTerm,
    setSearchTerm,
    PAGE_SIZE_OPTIONS,
    overallData: data?.data || {},
    setSort,
    setSmartSearch,
    error,
    refetch,
    setColumnOrder,
    columnOrder,
  };
};

export default useTableController;
