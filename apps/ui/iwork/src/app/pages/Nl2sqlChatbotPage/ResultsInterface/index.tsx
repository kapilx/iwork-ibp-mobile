import { useRef, useEffect, useMemo, memo } from "react";
import MessageBubble from "../MessageBubble/index.js";
import {
  ResultsContainer,
  LoadingContainer,
  LoadingContent,
  LoadingSpinner,
  LoadingText,
} from "./styles.js";
import { Message } from "@ui/ui-lib";

// Re-export for backward compatibility
export type { Message };

export interface ResultsInterfaceProps {
  messages: Message[];
  isLoading?: boolean;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
  onShowResponse?: (messageId: string, message: string) => void; // NEW
}

const ResultsInterface = memo(
  ({ messages, isLoading = false, onFeedback, onShowResponse }: ResultsInterfaceProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousLastMessageIdRef = useRef<string>();

    const scrollToBottom = () => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    };
    const visibleMessages = useMemo(() => {
      const MAX_MESSAGES = 50;

      if (messages.length <= MAX_MESSAGES) {
        return messages;
      }

      const lastMessages = messages.slice(-MAX_MESSAGES);
      let firstUserIndex = -1;
      for (let i = 0; i < lastMessages.length; i++) {
        if (lastMessages[i].type === "user") {
          firstUserIndex = i;
          break;
        }
      }

      const startIndex = firstUserIndex >= 0 ? firstUserIndex : 0;

      return lastMessages.slice(startIndex);
    }, [messages]);

    useEffect(() => {
      const lastMessage = messages[messages.length - 1];
      const prevLastMessageId = previousLastMessageIdRef.current;
      const lastMessageId = lastMessage?.id;
      const hasNewLastMessage = lastMessageId && lastMessageId !== prevLastMessageId;

      if (hasNewLastMessage || isLoading) {
        const timeoutId = setTimeout(() => {
          scrollToBottom();
        }, 100);

        previousLastMessageIdRef.current = lastMessageId;

        return () => clearTimeout(timeoutId);
      }
      previousLastMessageIdRef.current = lastMessageId;
      return undefined;
    }, [messages, isLoading]);

    return (
      <ResultsContainer ref={containerRef}>
        {visibleMessages.map((message) => (
          <MessageBubble
            key={message.id}
            id={message.id}
            type={message.type}
            content={message.content}
            messageType={message.messageType}
            barChartData={message.barChartData}
            barChartConfig={message.barChartConfig}
            pieChartData={message.pieChartData}
            pieChartConfig={message.pieChartConfig}
            tableData={message.tableData}
            tableConfig={message.tableConfig}
            timestamp={message.timestamp}
            error={message.error}
            feedback={message.feedback}
            onFeedback={onFeedback}
            hasResponse={typeof message.hasResponse === 'boolean' ? message.hasResponse : false}
            isResponseLoading={typeof message.isResponseLoading === 'boolean' ? message.isResponseLoading : false}
            onShowResponse={onShowResponse}
            is_favourite={typeof message.isFavourite === 'boolean' ? message.isFavourite : message.isFavourite === 1}
          />
        ))}
        {isLoading && (
          <LoadingContainer>
            <LoadingContent>
              <LoadingSpinner />
              <LoadingText>Processing your query...</LoadingText>
            </LoadingContent>
          </LoadingContainer>
        )}
      </ResultsContainer>
    );
  }
);

export default ResultsInterface;
