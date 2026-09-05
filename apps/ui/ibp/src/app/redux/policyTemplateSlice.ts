import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance, endPoints } from "@ui/ui-lib";
import type { RootState } from "./store";

export type PolicyTemplateInfoPoint = {
  id: string | number;
  text?: string;
  label?: string;
  value?: string;
  [key: string]: unknown;
};

export type PolicyTemplateComponentInfoPoints = {
  componentId?: string | number;
  label?: string;
  infoPoints?: PolicyTemplateInfoPoint[];
};
export type PolicyTemplateFaq = {
  id?: string | number;
  question?: string;
  answer?: string;
  category?: string;
  sequencenumber?: number | string;
  [key: string]: unknown;
};

export type PolicyTemplateData = {
  id?: string | number;
  companyId?: string | number;
  policyId?: string | number;
  config?: {
    compulsory?: PolicyTemplateComponentInfoPoints[];
    optional?: PolicyTemplateComponentInfoPoints[];
    flex?: PolicyTemplateComponentInfoPoints[];
    infoPoints?: PolicyTemplateInfoPoint[];
    faqs?: PolicyTemplateFaq[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type PolicyTemplateState = {
  data: PolicyTemplateData | null;
  byPolicyId: Record<string, PolicyTemplateData>;
  loading: boolean;
  error: string | null;
};

const initialState: PolicyTemplateState = {
  data: null,
  byPolicyId: {},
  loading: false,
  error: null,
};

const normalizeTemplate = (payload: any): PolicyTemplateData | null => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return payload.length ? normalizeTemplate(payload[0]) : null;
  }

  if (payload.data) {
    return normalizeTemplate(payload.data);
  }

  if (payload.attributes) {
    return {
      id: payload.id,
      ...payload.attributes,
    } as PolicyTemplateData;
  }

  return payload as PolicyTemplateData;
};

const getPolicyIdFromState = (state: RootState): string | number | null => {
  const policiesData = state.policyData?.policiesData;
  const employeePolicies = policiesData?.employeePolicies ?? [];
  const enrolledPolicies = policiesData?.enrolledPolicies ?? [];

  const firstPolicy =
    employeePolicies?.[0] ?? enrolledPolicies?.[0] ?? null;

  return firstPolicy?.policyId ?? null;
};

export const fetchPolicyTemplate = createAsyncThunk<
  PolicyTemplateData[],
  string | number | Array<string | number> | null | undefined,
  { state: RootState; rejectValue: string }
>("policyTemplate/fetchPolicyTemplate", async (policyIdsArg, { getState, rejectWithValue }) => {
  try {
    const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
    const companyId = userDetails?.companyId;
    const fallbackPolicyId = getPolicyIdFromState(getState());

    const policyIds: Array<string | number> = Array.isArray(policyIdsArg)
      ? policyIdsArg
      : policyIdsArg
        ? [policyIdsArg]
        : fallbackPolicyId
          ? [fallbackPolicyId]
          : [];

    // Normalize and dedupe multiple policy IDs to fetch all templates.
    const uniquePolicyIds = Array.from(
      new Set(
        policyIds
          .map((policyId) => (policyId == null ? "" : String(policyId)))
          .filter(Boolean),
      ),
    );

    if (!companyId || uniquePolicyIds.length === 0) {
      return rejectWithValue("Missing companyId or policyId");
    }

    const templates = await Promise.all(
      uniquePolicyIds.map(async (policyId) => {
        const url = endPoints.policyTemplate(companyId, policyId);
        const response = await axiosInstance.get(url);
        return normalizeTemplate(response?.data);
      }),
    );

    return templates.filter(Boolean) as PolicyTemplateData[];
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch policy template";
    return rejectWithValue(message);
  }
});

const policyTemplateSlice = createSlice({
  name: "policyTemplate",
  initialState,
  reducers: {
    clearPolicyTemplate: (state) => {
      state.data = null;
      state.byPolicyId = {};
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolicyTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPolicyTemplate.fulfilled,
        (state, action: PayloadAction<PolicyTemplateData[]>) => {
          state.loading = false;
          const templates = action.payload ?? [];
          templates.forEach((template) => {
            const policyId = template?.policyId;
            if (policyId != null) {
              state.byPolicyId[String(policyId)] = template;
            }
          });

          state.data = templates.length > 0 ? templates[0] : state.data;
        },
      )
      .addCase(fetchPolicyTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch policy template";
      });
  },
});

export const { clearPolicyTemplate } = policyTemplateSlice.actions;
export default policyTemplateSlice.reducer;
