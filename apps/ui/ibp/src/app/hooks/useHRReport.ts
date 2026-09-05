import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { endPoints } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";

export type HRReportState<T> = {
  data: T[];
  total: number | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
};

/**
 * Generic hook for all HR Analytics report calls.
 *
 * POST /hr-module/generate/:reportKey[?limit=X&page=Y]
 * Response envelope: { data: { data: T[], count?: number } }
 *
 * Uses @tanstack/react-query for automatic caching, deduplication and
 * stale-while-revalidate — same pattern as useApiQuery.
 * staleTime: 30s means identical key+params within 30s return from cache
 * without a network request. Explicit refetch() always bypasses the cache.
 */
export function useHRReport<T>(
  reportKey: string,
  params: Record<string, unknown>,
  enabled = true,
  queryParams?: Record<string, string | number>
): HRReportState<T> {
  const url = useMemo(() => {
    if (!queryParams) return endPoints.generateHRReports + reportKey;
    const qs = Object.entries(queryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return `${endPoints.generateHRReports}${reportKey}?${qs}`;
  }, [reportKey, JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: raw, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [reportKey, params, queryParams],
    queryFn: () =>
      apiRequest(url, { method: "POST", data: params }) as Promise<{
        data?: { data?: T[]; count?: number };
      }>,
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  return {
    data: raw?.data?.data ?? [],
    total: raw?.data?.count ?? null,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}
