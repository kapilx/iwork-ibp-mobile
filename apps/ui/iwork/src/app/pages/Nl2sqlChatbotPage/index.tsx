import { useCallback, useRef, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { DeleteOutline, Close } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import ChatInput, { ChatInputRef } from "./ChatInput/index.js";
import PredefinedQueries from "./PredefinedQueries/index.js";
import ResultsInterface from "./ResultsInterface/index.js";
import React from "react";
import {
  PageContainer,
  InputSection,
  ResultsSection,
  PageTitle,
  HeaderContainer,
  ClearChatButton,
  TooltipWrapper,
  InputSectionWrapper,
  RetryNotificationBox,
  RetryInfoIcon,
  RetryNotificationContent,
  RetryNotificationText,
  RetryCloseButton,
} from "./styles";
import {
  useNL2SQLChatbotMutation,
  selectMessages,
  selectIsLoading,
  selectLastUserMessage,
  addUserMessage,
  addAssistantMessage,
  insertAssistantMessage,
  setChatLoading,
  setLastUserMessage,
  updateMessageFeedback,
  clearMessages,
  removeLastMessage,
  setMessageResponseLoading,
  setMessageHasResponse,
  RootState,
  AppDispatch,
  environment,
} from "@ui/ui-lib";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import {
  transformNL2SQLResponse,
  createErrorMessage,
  createUserMessage,
} from "./utils/transformResponse";
import { NL2SQLApiResponse } from "./types";

export interface Nl2sqlChatbotPageProps {
  summary?: string;
}

const Nl2sqlChatbotPage = ({ summary }: Nl2sqlChatbotPageProps) => {
  const chatInputRef = useRef<ChatInputRef>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [showRetryNotification, setShowRetryNotification] = useState(false);
  const [favoriteQueries, setFavoriteQueries] = useState<string[]>([]);

  const PREDEFINED_QUERIES = environment.nl2sqlPredefinedQuestions.slice(
    0,
    environment.nl2sqlFlag.predefinedQueriesDisplayCount
  );
  const PREDEFINED_QUERIES_TITLE = "Preset Prompts :";
  const FAVORITE_QUERIES_TITLE = "Your Favorite Prompts :";

  const messages = useSelector((state: RootState) => selectMessages(state));
  const isLoading = useSelector((state: RootState) => selectIsLoading(state));
  const lastUserMessage = useSelector((state: RootState) =>
    selectLastUserMessage(state)
  );
    // Call nl2sqlChatRequests API on mount
  useEffect(() => {
    const fetchChatRequests = async () => {
      try {
        // Get user info from sessionStorage
        const userData = sessionStorage.getItem('user');
        let userId = null;
        let token = null;
        if (userData) {
          const parsed = JSON.parse(userData);
          userId = parsed.userId;
          token = parsed.accessToken?.accessToken;
          console.log('Fetched userId from sessionStorage:', userId);
        }
        const response = await axios.get(
          endPoints.nl2sqlChatRequests(userId),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        // Clear existing messages before loading chat history
        dispatch(clearMessages());
        
        // Extract favorite queries and regular messages
        const favorites: string[] = [];
        
        // Dispatch each fetched message as a user message to Redux
        if (response.data?.data && Array.isArray(response.data.data)) {
          response.data.data.forEach((msg : any) => {
            if (msg.message_author === 'user') {
              const isFavourite = msg.favourite && msg.favourite.is_favourite === 1;
              
              // Add to favorites if marked as favorite
              if (isFavourite) {
                favorites.push(msg.message);
              }
              
              dispatch(addUserMessage({
                id: msg.id?.toString() || undefined,
                content: msg.message,
                type: 'user',
                createdAt: msg.created_at,
                hasResponse: false,
                isResponseLoading: false,
                onShowResponse: true,
                isFavourite,
              }));
            }
            // Optionally handle assistant messages if present in future
          });
        }
        
        // Set favorite queries
        setFavoriteQueries(favorites);
      } catch (error) {
        console.error('Failed to fetch chat requests', error);
      }
    };
    fetchChatRequests();
  }, [dispatch]);
  const userId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) return null;
    try {
      const parsedUser = JSON.parse(storedUser);
      return typeof parsedUser?.userId === "number" ? parsedUser.userId : null;
    } catch (error) {
      return null;
    }
  }, []);

  // Memorize mutation configuration to prevent unnecessary re-renders
  const mutationConfig = useMemo(
    () => ({
      onSuccess: (data: unknown) => {
        const transformedMessage = transformNL2SQLResponse(
          data as NL2SQLApiResponse,
          lastUserMessage
        );
        dispatch(addAssistantMessage(transformedMessage));
        dispatch(setChatLoading(false));
      },
      onError: (error: Error) => {
        const errorMessage = createErrorMessage(error, lastUserMessage);
        dispatch(addAssistantMessage(errorMessage));
        dispatch(setChatLoading(false));
      },
    }),
    [lastUserMessage]
  );

  const { mutateAsync: sendNL2SQLQuery, isPending: isQueryLoading } =
    useNL2SQLChatbotMutation({
      config: mutationConfig,
    });

  const { mutateAsync: sendFeedback } = useNL2SQLChatbotMutation();

  const handleSend = useCallback(
    async (message: string) => {
      dispatch(setLastUserMessage(message));

      const userMessage = createUserMessage(message, true);
      dispatch(addUserMessage(userMessage));
      dispatch(setChatLoading(true));

      // Hide retry notification when sending a new message
      setShowRetryNotification(false);

      try {
        const payload = {
          prompt: message,
          user_id: userId ?? null,
        };
        await sendNL2SQLQuery({
          endpoint: endPoints.nl2sqlQuery,
          method: "POST",
          data: payload,
        });
      } catch (error: any) {
        // Error is already handled by the mutation config onError callback
      }
    },
    [sendNL2SQLQuery, userId]
  );

  const handleCancel = useCallback(() => {
    dispatch(setChatLoading(false));
  }, []);

  const handleFeedback = useCallback(
    async (messageId: string, feedback: "positive" | "negative") => {
      dispatch(updateMessageFeedback({ id: messageId, feedback }));
      try {
        // Get token from sessionStorage
        const userData = sessionStorage.getItem('user');
        let token = null;
        if (userData) {
          const parsed = JSON.parse(userData);
          token = parsed.accessToken?.accessToken;
        }
        await sendFeedback({
          endpoint: endPoints.nl2sqlFeedback,
          method: "POST",
          data: {
            messageId: Number(messageId),
            isValidResponse: feedback === "positive" ? 1 : 0,
            createdBy: userId,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (error) {
        console.error("Failed to send feedback", error);
      }
    },
    [dispatch, sendFeedback, userId]
  );

  const handleQueryClick = useCallback((query: string) => {
    chatInputRef.current?.setValue(query);
  }, []);

  const handleClearChat = useCallback(async () => {
    if (messages.length === 0 || isLoading || isQueryLoading) {
      return;
    }

    try {
      const userData = sessionStorage.getItem("user");
      let userId = null;
      let token = null;
      if (userData) {
        const parsed = JSON.parse(userData);
        userId = parsed.userId;
        token = parsed.accessToken?.accessToken;
      }

      if (userId) {
        await axios.put(
          endPoints.nl2sqlChatRequests(userId),
          { deactivate: true },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
      }

      dispatch(clearMessages());
    } catch (error) {
      console.error("Failed to clear chat history", error);
    }
  }, [dispatch, messages.length, isLoading, isQueryLoading]);

  // Check for orphaned user messages on mount and prefill input with retry message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.type === "user") {
        const orphanedMessage = lastMessage.content;
        dispatch(removeLastMessage());

        setTimeout(() => {
          chatInputRef.current?.setValue(orphanedMessage);
          setShowRetryNotification(true);
        }, 300);

        if (isLoading) {
          dispatch(setChatLoading(false));
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!showRetryNotification) return;

    const timer = setTimeout(() => {
      setShowRetryNotification(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [showRetryNotification]);

  const handleCloseNotification = () => {
    setShowRetryNotification(false);
  };

  const handleInputClear = useCallback(() => {
    setShowRetryNotification(false);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        const target = event.target as HTMLElement;
        const isInputField =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA";

        if (!isInputField && !isLoading && !isQueryLoading) {
          chatInputRef.current?.focus();
          setTimeout(() => {
            chatInputRef.current?.triggerSend();
          }, 50);
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isLoading, isQueryLoading]);
  const handleShowResponse = async (messageId: string, prompt: string) => {
  // mark this message as loading
  dispatch(setMessageResponseLoading({ id: messageId, loading: true }));

  try {
    const userData = sessionStorage.getItem('user');
    let userId = null;
    let token = null;
    if (userData) {
      const parsed = JSON.parse(userData);
      userId = parsed.userId;
      token = parsed.accessToken?.accessToken;
      // console.log('Fetched userId from sessionStorage:', userId);
    }
    const res = await axios.get(endPoints.nl2sqlChatResponse(messageId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    dispatch(
      insertAssistantMessage({
        message: transformNL2SQLResponse(res.data, prompt),
        afterMessageId: messageId,
      })
    );

    dispatch(setMessageHasResponse({ id: messageId }));
  } catch (e) {
    dispatch(setMessageResponseLoading({ id: messageId, loading: false }));
  }
};


  return (
    <PageContainer>
      <HeaderContainer>
        <PageTitle variant="h4">
          Conversational Access to Enterprise Data
        </PageTitle>
        <TooltipWrapper
          disabled={messages.length === 0 || isLoading || isQueryLoading}
        >
          <Tooltip
            title={
              messages.length === 0 ? "No messages to clear" : "Clear chat"
            }
            placement="auto"
          >
            <span>
              <ClearChatButton
                onClick={handleClearChat}
                disabled={messages.length === 0 || isLoading || isQueryLoading}
                aria-label="Clear chat history"
              >
                <DeleteOutline />
              </ClearChatButton>
            </span>
          </Tooltip>
        </TooltipWrapper>
      </HeaderContainer>
      <ResultsSection>
        <ResultsInterface
          messages={messages}
          isLoading={isLoading || isQueryLoading}
          onFeedback={handleFeedback}
          onShowResponse={handleShowResponse}
        />
      </ResultsSection>
      <InputSectionWrapper>
        {showRetryNotification && (
          <RetryNotificationBox>
            <RetryInfoIcon />
            <RetryNotificationContent>
              <RetryNotificationText>
                Request was interrupted. Your previous query has been restored
                in the input below. Press Enter to retry.
              </RetryNotificationText>
            </RetryNotificationContent>
            <RetryCloseButton
              size="small"
              onClick={handleCloseNotification}
              aria-label="Close notification"
            >
              <Close fontSize="small" />
            </RetryCloseButton>
          </RetryNotificationBox>
        )}
        <InputSection>
          <ChatInput
            ref={chatInputRef}
            onSend={handleSend}
            onCancel={handleCancel}
            onInputClear={handleInputClear}
            examples={PREDEFINED_QUERIES}
            isSubmitting={isLoading || isQueryLoading}
          />
          {favoriteQueries.length > 0 && (
            <PredefinedQueries
              queries={favoriteQueries}
              onQueryClick={handleQueryClick}
              title={FAVORITE_QUERIES_TITLE}
            />
          )}
          <PredefinedQueries
            queries={PREDEFINED_QUERIES}
            onQueryClick={handleQueryClick}
            title={PREDEFINED_QUERIES_TITLE}
          />
        </InputSection>
      </InputSectionWrapper>
    </PageContainer>
  );
};

export default Nl2sqlChatbotPage;