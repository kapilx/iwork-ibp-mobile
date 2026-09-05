import {
  NL2SQLResponse,
  NL2SQLApiResponse,
  TransformedMessage,
} from "../types";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Orange
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange-Red
];

const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR:
    "It looks like you're offline or there may be an internal server error. Please try again later.",
  TIMEOUT:
    "The server is taking too long to respond. Please try again in a moment.",
  CORS_ERROR:
    "Unable to connect to the server. This might be due to network restrictions or server issues. Please try again later.",
  // HTTP status codes
  400: "Oops! Something went wrong with the information you provided. Please check and try again.",
  404: "Something went wrong. Please check and try again.",
  408: "The request took too long to process. Please check your internet connection or try again later.",
  500: "Something went wrong. Please try again later.",
  503: "The service is temporarily down. Please try again in a few moments.",
  // Generic error
  UNKNOWN_ERROR:
    "An unexpected error occurred. Please try again or contact support if the problem persists.",
} as const;

const NO_DATA_MESSAGE =
  "I couldn't find any related data in the database matching your query";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format and validate data strings
 * Removes underscores and applies capitalization
 */
const formatDataString = (
  input: string | null | undefined,
  useTitleCase: boolean = false
): string => {
  if (input === null || input === undefined) {
    return "";
  }

  const str = String(input).trim();

  if (!str || ["nil", "null", "undefined"].includes(str.toLowerCase())) {
    return "";
  }

  const withoutUnderscores = str.replace(/_/g, " ");

  if (useTitleCase) {
    return withoutUnderscores
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  } else {
    return (
      withoutUnderscores.charAt(0).toUpperCase() + withoutUnderscores.slice(1)
    );
  }
};

/**
 * Check if a value is null-like
 */
const isNullLike = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  const str = String(value).toLowerCase().trim();
  return !str || ["nil", "null", "undefined", "na", "n/a"].includes(str);
};

/**
 * Format a value for display (handles numbers, nulls, strings)
 */
const formatValue = (value: any): string => {
  if (isNullLike(value)) {
    return "N/A";
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return formatDataString(String(value));
};

/**
 * Create a base TransformedMessage with common fields
 */
const createBaseMessage = (
  messageType: "text" | "table" | "barChart" | "pieChart" | "error",
  content: string = ""
): Omit<TransformedMessage, "barChartData" | "pieChartData" | "tableData"> => {
  return {
    id: Date.now().toString(),
    type: "system",
    content,
    messageType,
    timestamp: new Date().toISOString(),
  };
};

// ============================================================================
// ERROR HANDLING FUNCTIONS
// ============================================================================

/**
 * Get user-friendly error message for network/client-level errors
 * Handles CORS, timeout, and network issues (status codes checked separately)
 */
const getNetworkErrorMessage = (error: any): string => {
  const errorMessage = (error?.message || String(error) || "").toLowerCase();

  // Check for CORS and fetch errors
  if (
    errorMessage.includes("failed to fetch") ||
    errorMessage.includes("cors") ||
    errorMessage.includes("cross-origin") ||
    error?.name?.toLowerCase() === "typeerror"
  ) {
    return ERROR_MESSAGES.CORS_ERROR;
  }

  // Check for timeout errors
  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  // Check for network errors
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("offline") ||
    errorMessage.includes("connection")
  ) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Extract error message from various error formats
 * PRIORITY: Backend error message > Status codes > Network errors > Generic
 */
const extractErrorMessage = (error: any): string => {
  // First priority: Backend error message from API response body
  const backendErrorMessage =
    error?.error?.message || error?.response?.data?.error?.message;
  if (backendErrorMessage) {
    return backendErrorMessage;
  }

  // Second priority: HTTP status codes
  const statusCode =
    error?.response?.status || error?.status || error?.statusCode;
  if (statusCode && statusCode in ERROR_MESSAGES) {
    return ERROR_MESSAGES[statusCode as keyof typeof ERROR_MESSAGES];
  }

  // Third priority: Network/client-level errors
  return getNetworkErrorMessage(error);
};

/**
 * Create error message TransformedMessage
 * Used by both transformNL2SQLResponse and createErrorMessage
 */
const createErrorTransformedMessage = (
  errorMessage: string
): TransformedMessage => {
  return {
    ...createBaseMessage("error", errorMessage),
    error: errorMessage,
  };
};

// ============================================================================
// API RESPONSE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Normalize API response to internal format for easier processing
 */
const normalizeResponse = (
  apiResponse: NL2SQLApiResponse
): NL2SQLResponse | null => {
  if (apiResponse.status === "failure" || !apiResponse.data) {
    return null;
  }

  const data = apiResponse.data;
  const dataFormat = data.data_format;

  if (!dataFormat) {
    return null;
  }

  return {
    user_query: data.user_query,
    sql_query: data.sql_query,
    data: data.data || [],
    data_format: dataFormat,
    graph_semantics: dataFormat.graph_semantics,
    columns: dataFormat.columns || [],
    row_count: dataFormat.row_count || 0,
    column_count: dataFormat.column_count || 0,
  };
};

/**
 * Check if the API response indicates an error state
 */
const isErrorResponse = (apiResponse: NL2SQLApiResponse): boolean => {
  return apiResponse.status === "failure" || apiResponse.error !== null;
};

/**
 * Determine the appropriate message type based on response content
 */
const determineMessageType = (
  response: NL2SQLResponse
): "text" | "table" | "barChart" | "pieChart" => {
  if (response.graph_semantics?.type) {
    switch (response.graph_semantics.type) {
      case "bar":
        return "barChart";
      case "pie-chart":
        return "pieChart";
      case "table":
      case "raw-table":
        return "table";
      case "scalar":
        return "text";
      default:
        break;
    }
  }

  // Fallback: Check if response has tabular data
  if (
    response.data &&
    Array.isArray(response.data) &&
    response.data.length > 0
  ) {
    return "table";
  }

  return "text";
};

/**
 * Format scalar data points for display
 */
const formatScalarDataPoints = (data: any[]): string => {
  return data
    .map((item, index) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        const entries = Object.entries(item);
        const formattedEntries = entries.map(([key, value]) => {
          const formattedKey = formatDataString(key, true);
          return `${formattedKey}: ${formatValue(value)}`;
        });
        return `${index + 1}. ${formattedEntries.join(", ")}`;
      } else if (Array.isArray(item)) {
        const formattedValues = item.map((value) => formatValue(value));
        return `${index + 1}. ${formattedValues.join(", ")}`;
      } else {
        return `${index + 1}. ${formatValue(item)}`;
      }
    })
    .join("\n");
};

/**
 * Transform API response to table data format
 */
const transformToTableData = (response: NL2SQLResponse) => {
  if (
    !response.data ||
    !Array.isArray(response.data) ||
    response.data.length === 0
  ) {
    return {
      headers: ["No data"],
      rows: [["No results found"]],
    };
  }

  const originalColumns = response.columns || [];
  const headers = originalColumns.map((header) =>
    formatDataString(header, true)
  );

  const rows = response.data
    .map((row) => {
      if (typeof row === "object" && row !== null && !Array.isArray(row)) {
        return originalColumns.map((column) => {
          const value = row[column];
          if (typeof value === "number") {
            return value.toLocaleString();
          }
          const stringValue = String(value ?? "");
          if (isNullLike(stringValue)) {
            return "";
          }
          return formatDataString(stringValue);
        });
      } else if (Array.isArray(row)) {
        return row.map((value) => {
          if (typeof value === "number") {
            return value.toLocaleString();
          }
          const stringValue = String(value ?? "");
          if (isNullLike(stringValue)) {
            return "";
          }
          return formatDataString(stringValue);
        });
      } else {
        const stringValue = String(row ?? "");
        if (isNullLike(stringValue)) {
          return [""];
        }
        return [formatDataString(stringValue)];
      }
    })
    .filter((row) => {
      return row.some((value) => value && String(value).trim() !== "");
    });

  return { headers, rows };
};

/**
 * Extract chart data point from a row
 */
const extractChartDataPoint = (
  row: any,
  xAxis: string,
  yAxis: string,
  columns?: string[]
): { label: string; value: number } | null => {
  let label: string;
  let value: number;

  if (typeof row === "object" && row !== null && !Array.isArray(row)) {
    const xValue = row[xAxis];
    const yValue = row[yAxis];
    if (
      xValue === null ||
      xValue === undefined ||
      yValue === null ||
      yValue === undefined
    ) {
      return null;
    }
    label = String(xValue);
    value = Number(yValue);
  } else if (Array.isArray(row)) {
    const xIndex = columns?.indexOf(xAxis) ?? 0;
    const yIndex = columns?.indexOf(yAxis) ?? 1;
    const xValue = row[xIndex];
    const yValue = row[yIndex];
    if (
      xValue === null ||
      xValue === undefined ||
      yValue === null ||
      yValue === undefined
    ) {
      return null;
    }
    label = String(xValue);
    value = Number(yValue);
  } else {
    return null;
  }

  if (isNaN(value) || !label || label.trim() === "" || isNullLike(label)) {
    return null;
  }

  return {
    label: formatDataString(label),
    value,
  };
};

/**
 * Transform API response to chart data format
 */
const transformToChartData = (response: NL2SQLResponse) => {
  if (
    !response.data ||
    !Array.isArray(response.data) ||
    response.data.length === 0
  ) {
    return [];
  }

  const xAxis = response.graph_semantics?.x_axis;
  const yAxis = response.graph_semantics?.y_axis;

  if (!xAxis || !yAxis) {
    return [];
  }

  // Check if we need to aggregate data (for pie charts with categorical y-axis)
  const needsAggregation =
    response.graph_semantics?.type === "pie-chart" &&
    response.data.some((row) => {
      const yValue =
        typeof row === "object" && row !== null && !Array.isArray(row)
          ? row[yAxis]
          : Array.isArray(row)
          ? row[response.columns?.indexOf(yAxis) ?? 1]
          : row;
      return isNaN(Number(yValue));
    });

  if (needsAggregation) {
    const aggregatedData = new Map<string, number>();

    response.data.forEach((row) => {
      let label: string;

      if (typeof row === "object" && row !== null && !Array.isArray(row)) {
        const xValue = row[xAxis];
        if (xValue === null || xValue === undefined) return;
        label = String(xValue);
      } else if (Array.isArray(row)) {
        const xIndex = response.columns?.indexOf(xAxis) ?? 0;
        const xValue = row[xIndex];
        if (xValue === null || xValue === undefined) return;
        label = String(xValue);
      } else {
        if (row === null || row === undefined) return;
        label = String(row);
      }

      if (!label || label.trim() === "" || isNullLike(label)) return;

      const formattedLabel = formatDataString(label);
      aggregatedData.set(
        formattedLabel,
        (aggregatedData.get(formattedLabel) || 0) + 1
      );
    });

    return Array.from(aggregatedData.entries()).map(
      ([label, count], index) => ({
        label,
        value: count,
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      })
    );
  }

  // For numeric y-axis values
  const result = response.data
    .map((row, index) => {
      const dataPoint = extractChartDataPoint(
        row,
        xAxis,
        yAxis,
        response.columns
      );
      if (!dataPoint) return null;

      return {
        ...dataPoint,
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      };
    })
    .filter(
      (item): item is { label: string; value: number; color: string } =>
        item !== null
    );

  return result.length > 0 ? result : [];
};

// ============================================================================
// MAIN EXPORTED FUNCTIONS
// ============================================================================

/**
 * Transform NL2SQL API response to UI Message format
 */
export const transformNL2SQLResponse = (
  apiResponse: NL2SQLApiResponse,
  userPrompt: string
): TransformedMessage => {
  // Handle error responses
  if (isErrorResponse(apiResponse)) {
    const errorMessage =
      apiResponse.error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    return createErrorTransformedMessage(errorMessage);
  }

  // Normalize the response for easier processing
  const response = normalizeResponse(apiResponse);
  if (!response) {
    return createErrorTransformedMessage(ERROR_MESSAGES.UNKNOWN_ERROR);
  }

  // Use backend id if available
  const backendId = getMessageIdFromApi(apiResponse);

  // Determine feedback for UI (thumbs up/down)
  let feedback: "positive" | "negative" | null = null;
  if (
    apiResponse.data &&
    typeof apiResponse.data === 'object' &&
    'feedback' in apiResponse.data &&
    apiResponse.data.feedback &&
    typeof apiResponse.data.feedback === 'object' &&
    apiResponse.data.feedback !== null &&
    'is_valid_response' in apiResponse.data.feedback
  ) {
    const fb = apiResponse.data.feedback as { is_valid_response?: number };
    if (typeof fb.is_valid_response === 'number') {
      feedback = fb.is_valid_response === 1 ? "positive" : fb.is_valid_response === 0 ? "negative" : null;
    }
  }

  // Handle empty data case
  if (
    !response.data ||
    !Array.isArray(response.data) ||
    response.data.length === 0
  ) {
    return {
      ...createBaseMessage("text", NO_DATA_MESSAGE),
      id: backendId,
      feedback,
    };
  }

  // Handle scalar type with data
  if (
    response.graph_semantics?.type?.toLowerCase() === "scalar" &&
    response.data.length > 0
  ) {
    return {
      ...createBaseMessage("text", formatScalarDataPoints(response.data)),
      id: backendId,
      feedback,
    };
  }

  // Determine message type and create content
  const messageType = determineMessageType(response);
  const baseMessage = { ...createBaseMessage(messageType), id: backendId, feedback };

  // Add specific data based on message type
  switch (messageType) {
    case "table":
      return {
        ...baseMessage,
        tableData: transformToTableData(response),
        tableConfig: {
          title: "Query Results",
          height: 400,
          enableSorting: true,
          enableFiltering: true,
          enablePagination: true,
          pageSize: 10,
          enableSelection: false,
          enableExport: true,
        },
      };

    case "barChart": {
      const chartData = transformToChartData(response);
      if (!chartData || chartData.length === 0) {
        return {
          ...createBaseMessage("text", NO_DATA_MESSAGE),
        };
      }
      return {
        ...baseMessage,
        barChartData: chartData,
        barChartConfig: {
          title:
            formatDataString(response.graph_semantics?.title, true) ||
            "Data Visualization",
          xAxisLabel:
            formatDataString(response.graph_semantics?.x_axis, true) ||
            "Categories",
          yAxisLabel:
            formatDataString(response.graph_semantics?.y_axis, true) ||
            "Values",
          showValues: true,
          showLabels: true,
          height: 400,
          excludeOutliers: chartData.length > 4,
          maxBarsToShow: 50,
        },
      };
    }

    case "pieChart": {
      const pieData = transformToChartData(response);
      if (!pieData || pieData.length === 0) {
        return {
          ...createBaseMessage("text", NO_DATA_MESSAGE),
        };
      }
      return {
        ...baseMessage,
        pieChartData: pieData,
        pieChartConfig: {
          title:
            formatDataString(response.graph_semantics?.title, true) ||
            "Data Distribution",
          showValues: true,
          showLabels: true,
          height: 250,
          showLegend: true,
          legendPosition: "bottom",
          maxBarsToShow: 20,
        },
      };
    }

    default:
      return baseMessage;
  }
};

/**
 * Create error message for network/client-level failures
 * Called from mutation's onError callback when request fails at network level
 */
export const createErrorMessage = (
  error: any,
  userPrompt?: string
): TransformedMessage => {
  const errorMessage = extractErrorMessage(error);
  return createErrorTransformedMessage(errorMessage);
};

/**
 * Create user message
 */
export const createUserMessage = (prompt: string,hasResponse: boolean = false): TransformedMessage => {
  return {
    ...createBaseMessage("text", prompt),
    type: "user",
    hasResponse,
  };
};

// Helper: Use backend id if available, else fallback to generated id
function getMessageIdFromApi(apiResponse: NL2SQLApiResponse): string {
  // Try to extract id from backend response (e.g., data.id or data.message_id)
  if (apiResponse?.data && (apiResponse.data.id || apiResponse.data.message_id)) {
    return String(apiResponse.data.id || apiResponse.data.message_id);
  }
  // Fallback: Use timestamp-based id
  return Date.now().toString();
}
