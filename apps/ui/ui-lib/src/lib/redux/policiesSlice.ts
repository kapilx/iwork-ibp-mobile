import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { endPoints } from "../constants";
import { axiosInstance } from "../utils";

const initialState: any = {
  policiesData: [],
  relationDependentData: [],
  loading: false,
  error: null,
};

// Combined async thunk for fetching both employee policies and relation details
export const fetchEmployeePolicies = createAsyncThunk<any>(
  "policies/fetchEmployeePolicies",
  async (_, { rejectWithValue }) => {
    try {
      const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
      const employeeId = userDetails?.id;

      // Fetch both APIs in parallel using Promise.all
      const [policiesResponse, relationsResponse] = await Promise.all([
        axiosInstance.get(endPoints.employeePolicies(employeeId)),
        axiosInstance.get(endPoints.getRelationDetails(employeeId)), //will be uncommented when multi-enrollment is enabled
      ]);

      const policiesData = policiesResponse?.data;
      const relationsData = relationsResponse?.data;

      return {
        policiesData,
        relationsData,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to fetch employee policies and relations";
      return rejectWithValue(message);
    }
  }
);

const policySlice = createSlice({
  name: "policies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeePolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeePolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.policiesData = action.payload?.policiesData?.data;
        state.relationDependentData = action.payload?.relationsData?.data;
      })
      .addCase(fetchEmployeePolicies.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Error fetching policies and relations";
      });
  },
});

export const {} = policySlice.actions;
export default policySlice.reducer;
