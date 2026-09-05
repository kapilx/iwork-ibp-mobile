import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { nl2sqlChatbotApiRequest } from "../utils/nl2sqlChatbotApiRequest";

interface UseNL2SQLChatbotMutationProps {
  config?: Omit<
    UseMutationOptions<
      unknown,
      Error,
      { endpoint: string; method: "POST" | "PUT" | "DELETE"; data: unknown },
      unknown
    >,
    "mutationFn"
  >;
}

export const useNL2SQLChatbotMutation = ({
  config,
}: UseNL2SQLChatbotMutationProps = {}) => {
  const mutationFn = ({
    endpoint,
    method,
    data,
  }: {
    endpoint: string;
    method: "POST" | "PUT" | "DELETE" | "GET";
    data?: unknown;
  }) => {
    return nl2sqlChatbotApiRequest(endpoint, { method, data });
  };

  return useMutation({
    mutationFn,
    ...config,
  });
};

// Specialized hook for NL2SQL API
export const useNL2SQLMutation = (
  config?: UseNL2SQLChatbotMutationProps["config"]
) => {
  return useNL2SQLChatbotMutation({
    config: {
      ...config,
      onError: (error) => {
        console.error("NL2SQL API Error:", error);
        config?.onError?.(error);
      },
    },
  });
};
