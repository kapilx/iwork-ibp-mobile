import { renderHook, act } from "@testing-library/react";
import useTableController from "./useTableController";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../constants";
import { useApiQuery } from "./useApiQuery";

jest.mock("../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
  },
}));

// Mock useApiQuery
jest.mock("./useApiQuery");

const mockedUseApiQuery = useApiQuery as jest.Mock;

describe("useTableController hook", () => {
  const endpoint = "/mock-endpoint";

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should initialize with default state and call useApiQuery with correct url", () => {
    mockedUseApiQuery.mockReturnValue({
      data: { data: { data: [], count: 0, summary: { total: 0 } } },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useTableController({ endpoint, searchFieldName: "name" }),
    );

    expect(result.current.pageSize).toBe(PAGE_SIZE);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.searchTerm).toBe("");
    expect(result.current.loading).toBe(false);
    expect(result.current.rowData).toEqual([]);
    expect(result.current.totalRows).toBe(0);
    expect(result.current.summaryRowData).toEqual({ total: 0 });
    expect(result.current.PAGE_SIZE_OPTIONS).toEqual(PAGE_SIZE_OPTIONS);
    expect(result.current.error).toBeNull();

    // Check the URL called in useApiQuery includes page and limit
    const calledUrl = mockedUseApiQuery.mock.calls[0][0].url;
    expect(calledUrl).toContain(`page=1`);
    expect(calledUrl).toContain(`limit=${PAGE_SIZE}`);
    expect(calledUrl).toContain(endpoint);
  });

  it("should debounce searchTerm changes and update debouncedSearchTerm after 500ms", () => {
    mockedUseApiQuery.mockReturnValue({
      data: { data: { data: [], count: 0 } },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useTableController({ endpoint, searchFieldName: "name" }),
    );

    act(() => {
      result.current.setSearchTerm("hello");
    });

    expect(result.current.searchTerm).toBe("hello");

    // debouncedSearchTerm should not update immediately
    expect(mockedUseApiQuery.mock.calls[0][0].queryKey.includes("hello")).toBe(
      false,
    );

    // Fast-forward 500ms to debounce timer
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // After debounce timer, the URL should be updated (triggering useApiQuery)
    const lastCall =
      mockedUseApiQuery.mock.calls[mockedUseApiQuery.mock.calls.length - 1][0];

    expect(mockedUseApiQuery).toHaveBeenCalledTimes(3);
  });

  it("should reset currentPage to 1 when smartSearch changes", () => {
    mockedUseApiQuery.mockReturnValue({
      data: { data: { data: [], count: 0 } },
      isLoading: false,
      error: null,
    });

    const { result, rerender } = renderHook(
      ({ smartSearch }) =>
        useTableController({ endpoint, searchFieldName: "name" }),
      { initialProps: { smartSearch: {} } },
    );

    // Change smartSearch state using setSmartSearch
    act(() => {
      result.current.setSmartSearch({ name: "abc" });
    });

    // currentPage resets to 1 when smartSearch changes
    expect(result.current.currentPage).toBe(1);
  });

  it("should build correct search query param for smartSearch object", () => {
    mockedUseApiQuery.mockReturnValue({
      data: { data: { data: [], count: 0 } },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useTableController({ endpoint, searchFieldName: "companyName" }),
    );

    act(() => {
      result.current.setSmartSearch({
        companyName: "ACME",
        from: "2023-01-01",
        to: "2023-12-31",
        status: ["active", "pending"],
        period: { value: "Q1" },
      });
    });

    // Because of debounce, advance timers so that useApiQuery call is updated
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Extract URL called in useApiQuery
    const lastCall =
      mockedUseApiQuery.mock.calls[mockedUseApiQuery.mock.calls.length - 1][0];
    const url = lastCall.url;

    // Check presence of searchBy param for companyName
    expect(url).toContain("&searchBy=ACME");

    // Check presence of from/to dates and field=expiryDate
    expect(url).toContain("&from=2023-01-01");
    expect(url).toContain("&to=2023-12-31");
    expect(url).toContain("&field=expiryDate");

    // Check presence of array status formatted properly
    expect(url).toContain("status:[active,pending]");

    // Check presence of period param
    expect(url).toContain("Q1");
  });

  it("should build correct sort query param and update URL accordingly", () => {
    mockedUseApiQuery.mockReturnValue({
      data: { data: { data: [], count: 0 } },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useTableController({ endpoint, searchFieldName: "companyName" }),
    );

    act(() => {
      result.current.setSort([{ colId: "name", sort: "asc" }]);
    });

    // The URL should contain the sort param as &sort=name:ASC
    const lastCall =
      mockedUseApiQuery.mock.calls[mockedUseApiQuery.mock.calls.length - 1][0];
    const url = lastCall.url;
    expect(url).toContain("&sort=name:ASC");

    // Reset sort and check sort param is removed
    act(() => {
      result.current.setSort([]);
    });

    const lastCallAfterReset =
      mockedUseApiQuery.mock.calls[mockedUseApiQuery.mock.calls.length - 1][0];
    expect(lastCallAfterReset.url).not.toContain("&sort=");
  });

  it("should append customPathParam to url if provided", () => {
    mockedUseApiQuery.mockReturnValue({
      data: { data: { data: [], count: 0 } },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useTableController({
        endpoint,
        searchFieldName: "companyName",
        customPathParam: "extraParam=123",
      }),
    );

    const lastCall =
      mockedUseApiQuery.mock.calls[mockedUseApiQuery.mock.calls.length - 1][0];
    const url = lastCall.url;

    expect(url).toContain("&extraParam=123");
  });

  it("should call onError callback when error occurs", () => {
    const mockError = new Error("Network error");
    const mockOnError = jest.fn();

    mockedUseApiQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    renderHook(() => useTableController({ endpoint, onError: mockOnError }));

    // onError should be called once after error appears
    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it("should update pageSize and currentPage correctly", () => {
    mockedUseApiQuery.mockReturnValue({
      data: { data: { data: [], count: 0 } },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() =>
      useTableController({ endpoint, searchFieldName: "name" }),
    );

    act(() => {
      result.current.setPageSize(20);
    });
    expect(result.current.pageSize).toBe(20);

    act(() => {
      result.current.setCurrentPage(5);
    });
    expect(result.current.currentPage).toBe(5);
  });
});
