import axiosInstance from "./axiosInterceptors";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface NL2SQLChatbotApiOptions {
  method?: HttpMethod;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export const nl2sqlChatbotApiRequest = async (
  url: string,
  options?: NL2SQLChatbotApiOptions
): Promise<any> => {
  const {
    method = "POST",
    data,
    headers = {},
    timeout = 30000,
    retries = 3,
  } = options || {};

  // Merge default headers with custom headers
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    // "ngrok-skip-browser-warning": "69420",
  };

  const finalHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await axiosInstance({
        method: method,
        url: url,
        headers: finalHeaders,
        data: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.data;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      if (error instanceof Error && error.message.includes("HTTP 4")) {
        // Don't retry on client errors (4xx)
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Request failed after all retries");
};
