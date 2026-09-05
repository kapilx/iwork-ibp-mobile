import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message } from "../types/nl2sqlChat.types";

export interface Nl2sqlChatState {
  messages: Message[];
  isLoading: boolean;
  lastUserMessage: string;
}

const initialState: Nl2sqlChatState = {
  messages: [],
  isLoading: false,
  lastUserMessage: "",
};

export const nl2sqlChatSlice = createSlice({
  name: "nl2sqlChat",
  initialState,
  reducers: {
    addUserMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    addAssistantMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    insertAssistantMessage: (state, action: PayloadAction<{ message: Message; afterMessageId: string }>) => {
      const index = state.messages.findIndex((msg) => msg.id === action.payload.afterMessageId);
      if (index !== -1) {
        state.messages.splice(index + 1, 0, action.payload.message);
      } else {
        state.messages.push(action.payload.message);
      }
    },
    setChatLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLastUserMessage: (state, action: PayloadAction<string>) => {
      state.lastUserMessage = action.payload;
    },
    updateMessageFeedback: (
      state,
      action: PayloadAction<{ id: string; feedback: "positive" | "negative" }>
    ) => {
      const message = state.messages.find(
        (msg) => msg.id === action.payload.id
      );
      if (message) {
        message.feedback = action.payload.feedback;
      }
    },
    setMessageResponseLoading: (state, action: PayloadAction<{ id: string; loading: boolean }>) => {
      const message = state.messages.find((msg) => msg.id === action.payload.id);
      if (message) {
        message.isResponseLoading = action.payload.loading;
      }
    },
    setMessageHasResponse: (state, action: PayloadAction<{ id: string }>) => {
      const message = state.messages.find((msg) => msg.id === action.payload.id);
      if (message) {
        message.hasResponse = true;
        message.isResponseLoading = false;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.lastUserMessage = "";
      state.isLoading = false;
    },
    removeLastMessage: (state) => {
      if (state.messages.length > 0) {
        state.messages.pop();
      }
    },
    // Action to restore state from sessionStorage
    restoreState: (state, action: PayloadAction<Partial<Nl2sqlChatState>>) => {
      if (action.payload.messages) state.messages = action.payload.messages;
      if (action.payload.lastUserMessage !== undefined)
        state.lastUserMessage = action.payload.lastUserMessage;
      if (action.payload.isLoading !== undefined)
        state.isLoading = action.payload.isLoading;
    },
  },
});

export const {
  addUserMessage,
  addAssistantMessage,
  insertAssistantMessage,
  setChatLoading,
  setLastUserMessage,
  updateMessageFeedback,
  setMessageResponseLoading,
  setMessageHasResponse,
  clearMessages,
  removeLastMessage,
  restoreState,
} = nl2sqlChatSlice.actions;

// Selectors
export const selectMessages = (state: { nl2sqlChat: Nl2sqlChatState }) =>
  state.nl2sqlChat.messages;
export const selectIsLoading = (state: { nl2sqlChat: Nl2sqlChatState }) =>
  state.nl2sqlChat.isLoading;
export const selectLastUserMessage = (state: { nl2sqlChat: Nl2sqlChatState }) =>
  state.nl2sqlChat.lastUserMessage;

export default nl2sqlChatSlice.reducer;
