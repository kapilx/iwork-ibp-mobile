// NL2SQL API Request and Response Types

export interface NL2SQLRequest {
  prompt: string;
  user_id?: number | null;
}

export interface NL2SQLApiResponse {
  status: "success" | "failure";
  data: NL2SQLResponseData | null;
  error: NL2SQLErrorData | null;
}

export interface NL2SQLResponseData {
  user_query: string;
  sql_query: string;
  data: any[];
  data_format: {
    row_count: number;
    column_count: number;
    columns: string[];
    graph_semantics: {
      type: string;
      x_axis: string | null;
      y_axis: string | null;
      title?: string;
    };
  };
}

export interface NL2SQLErrorData {
  message: string;
  code: string;
}

// Legacy interface for backward compatibility - now represents the inner data structure
export interface NL2SQLResponse {
  user_query: string;
  sql_query: string;
  data: any[];
  data_format: {
    row_count: number;
    column_count: number;
    columns: string[];
    graph_semantics: {
      type: string;
      x_axis: string | null;
      y_axis: string | null;
      title?: string;
    };
  };
  // Computed properties for easier access (will be set during transformation)
  graph_semantics?: {
    type: string;
    x_axis: string | null;
    y_axis: string | null;
    title?: string;
  };
  columns?: string[];
  row_count?: number;
  column_count?: number;
}

// Error response from external API
export interface NL2SQLError {
  error: string;
  message: string;
  status?: number;
}

// Transformed message for the UI
export interface TransformedMessage {
  id: string;
  type: "user" | "system";
  content: string;
  messageType: "text" | "table" | "barChart" | "pieChart" | "error";
  barChartData?: {
    label: string;
    value: number;
    color?: string;
  }[];
  barChartConfig?: {
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    showValues?: boolean;
    showLabels?: boolean;
    height?: number;
    maxValue?: number;
    colorScheme?: string[];
    useLogScale?: boolean;
    maxBarsToShow?: number;
    excludeOutliers?: boolean;
  };
  pieChartData?: {
    label: string;
    value: number;
    color?: string;
  }[];
  pieChartConfig?: {
    title?: string;
    showValues?: boolean;
    showLabels?: boolean;
    height?: number;
    showLegend?: boolean;
    legendPosition?: "top" | "bottom" | "left" | "right";
    colorScheme?: string[];
    innerRadius?: number;
    outerRadius?: number;
    maxBarsToShow?: number;
  };
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  tableConfig?: {
    title?: string;
    height?: number;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    enablePagination?: boolean;
    pageSize?: number;
    enableSelection?: boolean;
    enableExport?: boolean;
  };
  timestamp: string;
  error?: string;
  feedback?: "positive" | "negative" | null;
  hasResponse?: boolean;
  isResponseLoading?: boolean;
}
