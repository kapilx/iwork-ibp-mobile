import { createSlice } from "@reduxjs/toolkit";
// import { TOAST_DEFAULT_AUTO_HIDE_DURATION } from "../constants";

const TOAST_DEFAULT_AUTO_HIDE_DURATION = 3000; // Default duration for toast messages

const initialState = {
  toastMessage: null,
  toastDuration: TOAST_DEFAULT_AUTO_HIDE_DURATION,
  loading: false,
  dependencies: {},
  selectedCompany: null,
  lookupValues: {}, // Store lookup values
  resolvedLookupIds: {},
  lookupReady: false,
  uploadedFile: null,
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
        state.toastDuration =
          action.payload.duration ?? TOAST_DEFAULT_AUTO_HIDE_DURATION;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setDependencies: (state, action) => {
      state.dependencies = {
        ...state.dependencies,
        [action.payload.fieldName]: action.payload.value,
      };
    },
    clearDependencies: (state) => {
      state.dependencies = {};
    },
    setSelectedCompany: (state, action) => {
      state.selectedCompany = action.payload;
    },
    setLookupValues: (state, action) => {
      state.lookupValues = action.payload;
      state.lookupReady = true;
    },
    setResolvedLookupIds: (state, action) => {
      state.resolvedLookupIds = action.payload;
    },
    setFileUploaded: (state, action) => {
      state.uploadedFile = action.payload;
    },
  },
});

export const {
  setToastMessage,
  setLoading,
  setDependencies,
  clearDependencies,
  setSelectedCompany,
  setLookupValues,
  setResolvedLookupIds,
  setFileUploaded,
} = userSlice.actions;

export default userSlice.reducer;
