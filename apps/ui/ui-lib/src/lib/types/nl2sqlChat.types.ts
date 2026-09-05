export interface Message {
  id: string;
  type: "user" | "system";
  content: string;
  messageType?: "text" | "barChart" | "pieChart" | "table" | "error";
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
  feedback?: "positive" | "negative" | null;  hasResponse?: boolean;
  isResponseLoading?: boolean;
  isFavourite?: boolean;}
