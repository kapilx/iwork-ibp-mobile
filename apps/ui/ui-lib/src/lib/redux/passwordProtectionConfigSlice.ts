import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// See the identical comment in policiesSlice.ts — importing the concrete
// module directly (not the "../utils" barrel) breaks a circular module graph
// with "../redux" that otherwise throws "Cannot access X before
// initialization" at runtime in a real (non-dev-server) build.
import { axiosInstance } from '../utils/axiosInterceptors';
import { endPoints } from '../constants';

/**
 * Interface for password protection configuration
 */
export interface PasswordProtectionConfigState {
    configs: Record<string, boolean>; // Map of categoryKey -> enablePassword
    rawConfigs: any[]; // Full config objects from API
    loading: boolean;
    error: string | null;
    initialized: boolean;
}

const initialState: PasswordProtectionConfigState = {
    configs: {},
    rawConfigs: [],
    loading: false,
    error: null,
    initialized: false,
};

/**
 * Async thunk to fetch all password protection configurations
 * Should be called after user login
 */
export const fetchPasswordProtectionConfigs = createAsyncThunk(
    'passwordProtectionConfig/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(endPoints.getAllConfigs);
            return response?.data?.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || 'Failed to fetch password protection configurations'
            );
        }
    }
);

/**
 * Async thunk to fetch configuration for a specific category
 */
export const fetchPasswordProtectionConfigByKey = createAsyncThunk(
    'passwordProtectionConfig/fetchByKey',
    async (categoryKey: string, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(
                endPoints.getConfigByKey(categoryKey)
            );
            return response?.data?.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data || `Failed to fetch config for ${categoryKey}`
            );
        }
    }
);

export const passwordProtectionConfigSlice = createSlice({
    name: 'passwordProtectionConfig',
    initialState,
    reducers: {
        /**
         * Reset the password protection config state
         */
        resetPasswordProtectionConfig: (state) => {
            state.configs = {};
            state.rawConfigs = [];
            state.loading = false;
            state.error = null;
            state.initialized = false;
        },
        /**
         * Manually set configs (useful for testing or offline mode)
         */
        setPasswordProtectionConfigs: (state, action) => {
            state.configs = action.payload.configs || {};
            state.rawConfigs = action.payload.rawConfigs || [];
            state.initialized = true;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all configs
            .addCase(fetchPasswordProtectionConfigs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPasswordProtectionConfigs.fulfilled, (state, action) => {
                state.loading = false;
                state.configs = action.payload?.configs || {};
                state.rawConfigs = action.payload?.rawConfigs || [];
                state.initialized = true;
                state.error = null;
            })
            .addCase(fetchPasswordProtectionConfigs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.initialized = false;
            })
            // Fetch config by key
            .addCase(fetchPasswordProtectionConfigByKey.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPasswordProtectionConfigByKey.fulfilled, (state, action) => {
                state.loading = false;
                const config = action.payload;
                if (config && config.categoryKey) {
                    // Update the specific config in the state
                    state.configs[config.categoryKey] = config.enablePassword;
                    
                    // Update or add to rawConfigs array
                    const existingIndex = state.rawConfigs.findIndex(
                        (c) => c.categoryKey === config.categoryKey
                    );
                    if (existingIndex >= 0) {
                        state.rawConfigs[existingIndex] = config;
                    } else {
                        state.rawConfigs.push(config);
                    }
                }
                state.error = null;
            })
            .addCase(fetchPasswordProtectionConfigByKey.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetPasswordProtectionConfig, setPasswordProtectionConfigs } =
    passwordProtectionConfigSlice.actions;

export default passwordProtectionConfigSlice.reducer;

// Selector to check if password protection is enabled for a specific module
export const isModulePasswordProtectionEnabled = (
    state: any,
    categoryKey: string
): boolean => {
    return state.passwordProtectionConfig?.configs?.[categoryKey] ?? false;
};

// Selector to check if configs are loaded
export const isPasswordProtectionConfigInitialized = (state: any): boolean => {
    return state.passwordProtectionConfig?.initialized ?? false;
};
