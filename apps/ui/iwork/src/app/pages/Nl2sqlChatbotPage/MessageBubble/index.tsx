import { memo, useState, useEffect } from "react";
import axios from "axios";
import { Typography } from "@mui/material";
import { Error as ErrorIcon, Favorite, FavoriteBorder } from "@mui/icons-material";
import {
  MessageBubbleContainer,
  UserBubble,
  SystemBubble,
  ErrorBubble,
  MessageText,
  MessageTable,
  MessageError,
  MessageChart,
  Timestamp,
  SummaryText,
  ErrorIconContainer,
  ChartErrorMessage,
  BubbleWrapper,
  TimestampFeedbackWrapper,
  FavouriteRow,
  FavouriteIconWrapper,
} from "./styles";
import EChartsBarChart from "../BarChart";
import EChartsPieChart from "../PieChart";
import DataTable from "../DataTable";
import FeedbackComponent from "./FeedbackComponent";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
// import FeedbackComponent from "./FeedbackComponent";

export interface MessageBubbleProps {
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
  timestamp?: string;
  error?: string;
  onTableRowClick?: (rowData: (string | number)[], rowIndex: number) => void;
  onTableDownload?: () => void;
  feedback?: "positive" | "negative" | null;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
  onShowResponse?: (id: string, content: string) => void;
  isResponseLoading?: boolean;
  hasResponse?: boolean;
  is_favourite?: boolean;
}

const MessageBubble = memo(
  ({
    id,
    type,
    content,
    messageType = "text",
    barChartData,
    barChartConfig,
    pieChartData,
    pieChartConfig,
    tableData,
    tableConfig,
    timestamp,
    error,
    onTableRowClick,
    onTableDownload,
    feedback,
    onFeedback,
    onShowResponse,
    isResponseLoading,
    hasResponse,
    is_favourite,
  }: MessageBubbleProps) => {
    const BubbleComponent =
      type === "user"
        ? UserBubble
        : messageType === "error"
        ? ErrorBubble
        : SystemBubble;
    const summary = messageType !== "error" ? content : null;

    const renderContent = () => {
      switch (messageType) {
        case "table":
          return tableData ? (
            <MessageTable>
              <DataTable data={tableData} config={tableConfig} />
            </MessageTable>
          ) : (
            <MessageText>No table data available</MessageText>
          );

        case "barChart":
          return barChartData && barChartData.length > 0 ? (
            <MessageChart>
              <EChartsBarChart data={barChartData} config={barChartConfig} />
            </MessageChart>
          ) : (
            <MessageText>
              {(!barChartData || barChartData.length === 0) && (
                <ChartErrorMessage>
                  Unable to render chart: No valid data available
                </ChartErrorMessage>
              )}
            </MessageText>
          );

        case "pieChart":
          return pieChartData && pieChartData.length > 0 ? (
            <MessageChart>
              <EChartsPieChart data={pieChartData} config={pieChartConfig} />
            </MessageChart>
          ) : (
            <MessageText>
              {(!pieChartData || pieChartData.length === 0) && (
                <ChartErrorMessage>
                  Unable to render chart: No valid data available
                </ChartErrorMessage>
              )}
            </MessageText>
          );

        case "error":
          return (
            <MessageError>
              <ErrorIconContainer>
                <ErrorIcon fontSize="small" />
              </ErrorIconContainer>
              <Typography variant="body2">{error || content}</Typography>
            </MessageError>
          );

        default:
          return null;
      }
    };

    // Favourite state (local, per message instance, sync with prop)
    const [isFavourite, setIsFavourite] = useState(!!is_favourite);

    // Sync local state with prop if it changes (e.g., after reload)
    useEffect(() => {
      setIsFavourite(!!is_favourite);
    }, [is_favourite]);

    const handleFavouriteClick = async (msgId: string) => {
      // Get token from sessionStorage user object (reference pattern)
      const userData = sessionStorage.getItem('user');
      let token = null;
      if (userData) {
        const parsed = JSON.parse(userData);
        token = parsed.accessToken?.accessToken;
      }
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      setIsFavourite((prev) => {
        const next = !prev;
        if (next) {
          axios.post(endPoints.addFavouritePrompt(), { messageId: msgId },
           { headers }
          )
           .catch((error) => {
            console.error("Failed to add favourite:", error);
          });
        } else {
          axios.put(endPoints.removeFavouritePrompt(), { messageId: msgId },
             { headers }
            )
             .catch((error) => {
            console.error("Failed to remove favourite:", error);
          });
        }
        return next;
      });
    };

    return (
      <MessageBubbleContainer type={type}>
        <BubbleWrapper type={type}>
          <BubbleComponent messageType={messageType}>
            {type === "user" ? (
              <FavouriteRow>
                <FavouriteIconWrapper onClick={() => handleFavouriteClick(id)}>
                  {isFavourite ? (
                    <Favorite style={{ color: "#e53935" }} fontSize="small" />
                  ) : (
                    <FavoriteBorder style={{ color: "#bdbdbd" }} fontSize="small" />
                  )}
                </FavouriteIconWrapper>
                  {summary && <SummaryText type={type}>{summary}</SummaryText>}
                  {renderContent()}
              </FavouriteRow>
            ) : (
              <>
                {summary && <SummaryText type={type}>{summary}</SummaryText>}
                {renderContent()}
              </>
            )}
          </BubbleComponent>
          {type === "system" ? (
            <TimestampFeedbackWrapper>
              {timestamp && (
                <Timestamp type={type}>
                  {new Date(timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Timestamp>
              )}
              {onFeedback && messageType !== "error" && (
                <FeedbackComponent
                  messageId={id}
                  onFeedback={onFeedback}
                  initialFeedback={feedback}
                />
              )}
            </TimestampFeedbackWrapper>
          ) : (
            timestamp && (
              <Timestamp type={type}>
                {new Date(timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Timestamp>
            )
          )}
        </BubbleWrapper>
        {type === "user" && !hasResponse && (
          <div
            style={{
              alignSelf: "flex-start",
              marginTop: 8,
              paddingLeft: 16,
              marginBottom: 8,
            }}
          >
            <button
              onClick={() => onShowResponse && onShowResponse(id, content)}
              disabled={isResponseLoading}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                borderRadius: 18,
                border: "1px solid #e0e0e0",
                background: isResponseLoading ? "#f5f5f5" : "#ffffff",
                color: isResponseLoading ? "#9e9e9e" : "#1976d2",
                cursor: isResponseLoading ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              {isResponseLoading
                ? "Loading Response..."
                : "Click here to load the response"}
            </button>
          </div>
        )}
      </MessageBubbleContainer>
    );
  }
);

export default MessageBubble;
