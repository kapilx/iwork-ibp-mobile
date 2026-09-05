import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance, endPoints } from "@ui/ui-lib";
import { RootState } from "./store";

export type TcSection = {
  id: number;
  title: string;
  content: string;
  sequenceNumber: number;
};

export type TcData = {
  id: number;
  documentId: string;
  version: number;
  effectiveDate: string;
  isActive: boolean;
  introductionText: string;
  sections: TcSection[];
};

type TcState = {
  data: TcData | null;
  loading: boolean;
  error: string | null;
};

const initialState: TcState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchTermsAndConditions = createAsyncThunk<
  TcData | null,
  void,
  { rejectValue: string }
>("tc/fetchTermsAndConditions", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(endPoints.getTermsAndConditions);
    return response?.data?.data?.data ?? null;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch terms and conditions";
    return rejectWithValue(message);
  }
});

const tcSlice = createSlice({
  name: "tc",
  initialState,
  reducers: {
    clearTc: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTermsAndConditions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTermsAndConditions.fulfilled,
        (state, action: PayloadAction<TcData | null>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchTermsAndConditions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch terms and conditions";
      });
  },
});

export const { clearTc } = tcSlice.actions;
export default tcSlice.reducer;
