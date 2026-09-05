// hooks/useApiQuery.ts
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "../utils/apiRequest";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { incrementLoading, decrementLoading } from "../redux";

interface UseApiQueryProps {
  url: string;
  queryKey: any[];
  data?: any;
  enabled?: boolean;
  headers?: Record<string, string>;
  shouldShowLoader?: boolean;
  config?: Omit<UseQueryOptions<any, any, any, any>, "queryKey" | "queryFn">;
}

export const useApiQuery = ({
  url,
  queryKey,
  data,
  enabled = true,
  shouldShowLoader = false,
  headers,
  config,
}: UseApiQueryProps) => {
  const queryFn = () => {
    return apiRequest(url, { data, headers });
  };

  const queryResult = useQuery({
    queryKey,
    queryFn,
    enabled,
    ...config,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (!shouldShowLoader || !queryResult.isLoading) {
      return;
    }
    dispatch(incrementLoading());
    return () => {
      dispatch(decrementLoading());
    };
  }, [shouldShowLoader, queryResult.isLoading]);

  return queryResult;
};
