import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance, endPoints } from "@ui/ui-lib";

export type CompanyTemplateFaq = {
  id: string | number;
  question: string;
  answer: string;
};

export type CompanyTemplateData = {
  id?: string | number;
  companyId?: string | number;
  config?: {
    faqs?: CompanyTemplateFaq[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type CompanyTemplateState = {
  data: CompanyTemplateData | null;
  loading: boolean;
  error: string | null;
};

const initialState: CompanyTemplateState = {
  data: null,
  loading: false,
  error: null,
};

const normalizeTemplate = (payload: any): CompanyTemplateData | null => {
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
    } as CompanyTemplateData;
  }

  return payload as CompanyTemplateData;
};

export const fetchCompanyTemplate = createAsyncThunk<
  CompanyTemplateData | null,
  string | number,
  { rejectValue: string }
>("companyTemplate/fetchCompanyTemplate", async (companyId, { rejectWithValue }) => {
  try {
    const url = endPoints.companyTemplate(companyId);
    console.log('🔴 Redux - Fetching Company Template:', {
      companyId: companyId,
      url: url
    });
    
    const response = await axiosInstance.get(url);
    return normalizeTemplate(response?.data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch company template";
    return rejectWithValue(message);
  }
});

export const fetchCompanyTemplateBySubdomain = createAsyncThunk<
  CompanyTemplateData | null,
  string,
  { rejectValue: string }
>(
  "companyTemplate/fetchCompanyTemplateBySubdomain",
  async (subdomain, { rejectWithValue }) => {
    try {
      const url = endPoints.companyTemplateBySubdomain(subdomain);
      const response = await axiosInstance.get(url);
      return normalizeTemplate(response?.data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch company template";
      return rejectWithValue(message);
    }
  }
);

const companyTemplateSlice = createSlice({
  name: "companyTemplate",
  initialState,
  reducers: {
    clearCompanyTemplate: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCompanyTemplate.fulfilled,
        (state, action: PayloadAction<CompanyTemplateData | null>) => {
          state.loading = false;
          state.data = action.payload;
        },
      )
      .addCase(fetchCompanyTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch company template";
      })
      .addCase(fetchCompanyTemplateBySubdomain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCompanyTemplateBySubdomain.fulfilled,
        (state, action: PayloadAction<CompanyTemplateData | null>) => {
          state.loading = false;
          state.data = action.payload;
        },
      )
      .addCase(fetchCompanyTemplateBySubdomain.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch company template";
      });
  },
});

export const { clearCompanyTemplate } = companyTemplateSlice.actions;
export default companyTemplateSlice.reducer;
