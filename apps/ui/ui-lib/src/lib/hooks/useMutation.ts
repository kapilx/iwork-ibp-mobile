import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { apiRequest } from "../utils/apiRequest";

interface UseApiMutationProps {
  headers?: Record<string, string>;
  config?: Omit<
    UseMutationOptions<
      unknown,
      Error,
      { endpoint: string; method: Method; data: unknown },
      unknown
    >,
    "mutationFn"
  >;
}

type Method = "POST" | "PUT" | "DELETE";

export const useApiMutation = ({ headers, config }: UseApiMutationProps) => {
  const mutationFn = ({
    endpoint,
    method,
    data,
  }: {
    endpoint: string;
    method: Method;
    data?: unknown;
  }) => {
    return apiRequest(endpoint, { method, data, headers });
  };

  return useMutation({
    mutationFn,
    ...config,
  });
};
