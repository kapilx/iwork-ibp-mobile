import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance, endPoints, environment } from "@ui/ui-lib";
import { PortalConfigurationResponseData } from "../types";
import { getSubdomainFromUrl } from "../utils/companyConfig";

const PORTAL_CONFIG_STORAGE_KEY = "ibp_portal_configuration";

const readCachedPortalConfig = (): PortalConfigurationResponseData | null => {
  try {
    const cached = sessionStorage.getItem(PORTAL_CONFIG_STORAGE_KEY);
    return cached ? (JSON.parse(cached) as PortalConfigurationResponseData) : null;
  } catch (error) {
    console.warn("Unable to read cached portal configuration", error);
    return null;
  }
};

const persistPortalConfig = (config: PortalConfigurationResponseData | null) => {
  try {
    if (config) {
      sessionStorage.setItem(PORTAL_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else {
      sessionStorage.removeItem(PORTAL_CONFIG_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Unable to persist portal configuration", error);
  }
};

export interface PortalConfigState {
  data: PortalConfigurationResponseData | null;
  loading: boolean;
  error: string | null;
}

const initialState: PortalConfigState = {
  data: readCachedPortalConfig(),
  loading: false,
  error: null,
};

export const fetchPortalConfiguration = createAsyncThunk<
  PortalConfigurationResponseData,
  number | string,
  { rejectValue: string }
>("portalConfig/fetchPortalConfiguration", async (companyId, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(
      endPoints.portalConfigurationByCompany(companyId)
    );

    const portalConfig: PortalConfigurationResponseData =
      response?.data?.data ?? response?.data ?? null;

    if (!portalConfig) {
      throw new Error("Portal configuration not found");
    }

    let passwordRules = null;
    let dependentRelationConfig = null;
    try {
      // Must match how every other caller resolves the tenant. Deriving it here
      // as hostname.split('.')[0] sent "localhost" as the subdomain in local dev,
      // so this call failed and dependentRelationConfig was cached as null.
      const subdomain = getSubdomainFromUrl();
      if (subdomain) {
        const authConfigResponse = await axiosInstance.get(
          endPoints.companyAuthConfigBySubdomain(subdomain)
        );
        const authCompanyConfig = authConfigResponse?.data?.data?.companyConfig;
        dependentRelationConfig = authCompanyConfig?.dependentRelationConfig ?? null;
        if (environment.featureFlag.FF_PASSWORD_RULES) {
          passwordRules = authCompanyConfig?.passwordRules ?? null;
        }
      }
    } catch {
      // passwordRules / dependentRelationConfig are optional — do not fail the whole fetch
    }

    const configWithRules: PortalConfigurationResponseData = {
      ...portalConfig,
      passwordRules,
      dependentRelationConfig,
    };

    persistPortalConfig(configWithRules);
    return configWithRules;
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to fetch portal configuration";
    return rejectWithValue(message);
  }
});

const portalConfigSlice = createSlice({
  name: "portalConfig",
  initialState,
  reducers: {
    clearPortalConfiguration: (state) => {
      state.data = null;
      state.error = null;
      persistPortalConfig(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortalConfiguration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPortalConfiguration.fulfilled,
        (state, action: PayloadAction<PortalConfigurationResponseData>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchPortalConfiguration.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch portal configuration";
      });
  },
});

export const { clearPortalConfiguration } = portalConfigSlice.actions;
export default portalConfigSlice.reducer;
