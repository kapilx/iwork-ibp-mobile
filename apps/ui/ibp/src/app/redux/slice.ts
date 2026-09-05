import { createSlice } from "@reduxjs/toolkit";

const TOAST_DEFAULT_AUTO_HIDE_DURATION = 3000;

interface UserState {
  toastMessage: string | null;
  toastDuration: number | null;
  loading: boolean;
  lookupValues: Record<string, unknown>;
  resolvedLookupIds: Record<string, unknown>;
  lookupReady: boolean;
}

const initialState: UserState = {
  toastMessage: null as string | null,
  toastDuration: TOAST_DEFAULT_AUTO_HIDE_DURATION,
  loading: false,
  lookupValues: {} as Record<string, unknown>,
  resolvedLookupIds: {} as Record<string, unknown>,
  lookupReady: false,
};

export const userSlice = createSlice({
  name: "userSlice",
  initialState,
  reducers: {
    setToastMessage: (state, action) => {
      if (typeof action.payload === "string") {
        state.toastMessage = action.payload;
        state.toastDuration = TOAST_DEFAULT_AUTO_HIDE_DURATION;
      } else if (action.payload && typeof action.payload === "object") {
        state.toastMessage = action.payload.message;
        if ("duration" in action.payload) {
          state.toastDuration = action.payload.duration;
        } else {
          state.toastDuration = TOAST_DEFAULT_AUTO_HIDE_DURATION;
        }
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setLookupValues: (state, action) => {
      state.lookupValues = action.payload;
      state.lookupReady = true;
    },
    setResolvedLookupIds: (state, action) => {
      state.resolvedLookupIds = action.payload;
    },
  },
});

export const {
  setToastMessage,
  setLoading,
  setLookupValues,
  setResolvedLookupIds,
} = userSlice.actions;

export default userSlice.reducer;
