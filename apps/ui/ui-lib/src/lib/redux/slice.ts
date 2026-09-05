import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  endPoints,
  FAILED_TO_UPDATE_CONFIG,
  PREFERENCE_SAVED_SUCCESSFULLY,
  TOAST_DEFAULT_AUTO_HIDE_DURATION,
} from "@ui/ui-lib/constants/index";
import { axiosInstance } from "../utils";
import { normalizeSmartSearchValues } from "../utils/smartSearchUtils";
import { CurrencyDisplayMode } from "../constants/currencyDisplayMode";

const CURRENCY_DISPLAY_MODES = new Set<string>(
  Object.values(CurrencyDisplayMode)
);

const normalizeCurrencyDisplayMode = (value: unknown): CurrencyDisplayMode => {
  const normalized = String(value || "").toUpperCase();
  if (CURRENCY_DISPLAY_MODES.has(normalized)) {
    return normalized as CurrencyDisplayMode;
  }
  return CurrencyDisplayMode.INDIAN;
};

// "Not chosen yet" has to stay distinguishable from INDIAN: an unset mode falls
// back to the country's numberFormat at format time, whereas an explicit INDIAN
// overrides it. Collapsing the two would make country config unreachable.
const normalizeOptionalCurrencyDisplayMode = (
  value: unknown
): CurrencyDisplayMode | null => {
  const normalized = String(value || "").toUpperCase();
  return CURRENCY_DISPLAY_MODES.has(normalized)
    ? (normalized as CurrencyDisplayMode)
    : null;
};

const initialState = {
  toastMessage: null,
  toastDuration: TOAST_DEFAULT_AUTO_HIDE_DURATION,
  loading: false,
  loadingCount: 0,
  dependencies: {},
  selectedCompany: null,
  lookupValues: {}, // Store lookup values
  resolvedLookupIds: {},
  lookupReady: false,
  uploadedFile: null,
  userDefaultConfig: {},
  systemDefaultConfig: {},
  buttonLoading: false,
  currencyDisplayMode: null as CurrencyDisplayMode | null,
  currentOpportunityType: null as string | null,
};

export const fetchUserDefaultConfig = createAsyncThunk(
  "userSlice/fetchUserDefaultConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(endPoints.getFiltersPreference);
      return response?.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch lookup values"
      );
    }
  }
);

export const updateUserDefaultConfig = createAsyncThunk(
  "userSlice/updateUserDefaultConfig",
  async (
    { entityKey, selectedFilterValues, columns }: any,
    { rejectWithValue }
  ) => {
    try {
      const filterPayload = {
        entity: entityKey,
        filterJson: selectedFilterValues ?? {},
        tableSettingJson: columns ?? [],
      };

      // 🔥 In future: Save this config to API
      const response = await axiosInstance.post(
        endPoints.saveFiltersPreference,
        filterPayload
      );

      // Return raw values only
      return {
        entityKey,
        selectedFilterValues,
        columns,
        message: response?.data?.message,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || FAILED_TO_UPDATE_CONFIG);
    }
  }
);

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

    incrementLoading: (state) => {
      state.loadingCount = (state.loadingCount ?? 0) + 1;
      state.loading = true;
    },
    decrementLoading: (state) => {
      state.loadingCount = Math.max(0, (state.loadingCount ?? 0) - 1);
      state.loading = state.loadingCount > 0;
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
    setCurrencyDisplayMode: (state, action) => {
      state.currencyDisplayMode = normalizeCurrencyDisplayMode(action.payload);
    },
    setCurrentOpportunityType: (state, action) => {
      state.currentOpportunityType = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDefaultConfig.fulfilled, (state, action) => {
        const userFilter = action?.payload?.userDefaultFilter;
        const systemFilter = action?.payload?.systemDefaultFilter;
        const persistedDisplayMode =
          userFilter?.smartSearchValues?.LOCALIZATION_PREFERENCE
            ?.currencyDisplayMode;

        state.userDefaultConfig = {
          tableDefaultSettings: userFilter?.tableDefaultSettings,
          smartSearchValues: normalizeSmartSearchValues(
            userFilter?.smartSearchValues,
            true
          ),
        };
        state.systemDefaultConfig = {
          tableDefaultSettings: systemFilter?.tableDefaultSettings,
          smartSearchValues: normalizeSmartSearchValues(
            systemFilter?.smartSearchValues,
            false
          ),
        };
        state.currencyDisplayMode =
          normalizeOptionalCurrencyDisplayMode(persistedDisplayMode);
        state.buttonLoading = false;
      })

      .addCase(fetchUserDefaultConfig.rejected, (state, action) => {
        state.buttonLoading = false;
      })
      .addCase(fetchUserDefaultConfig.pending, (state, action) => {
        state.buttonLoading = true;
      })
      .addCase(updateUserDefaultConfig.rejected, (state, action) => {
        state.buttonLoading = false;
        state.toastMessage = action?.payload;
      })
      .addCase(updateUserDefaultConfig.pending, (state, action) => {
        state.buttonLoading = true;
      })
      .addCase(updateUserDefaultConfig.fulfilled, (state, action) => {
        const { entityKey, selectedFilterValues, columns, message } =
          action.payload;

        // Ensure base structure exists
        if (!state.userDefaultConfig) {
          state.userDefaultConfig = {
            tableDefaultSettings: {},
            smartSearchValues: {},
          };
        }

        // Merge updates into state
        state.userDefaultConfig.tableDefaultSettings = {
          ...state.userDefaultConfig.tableDefaultSettings,
          [entityKey]: columns,
        };

        state.userDefaultConfig.smartSearchValues = {
          ...state.userDefaultConfig.smartSearchValues,
          [entityKey]: selectedFilterValues,
        };
        if (entityKey === "LOCALIZATION_PREFERENCE") {
          state.currencyDisplayMode = normalizeCurrencyDisplayMode(
            selectedFilterValues?.currencyDisplayMode
          );
        }
        // Callers may pass a `successMessage` in the thunk arg to override the
        // toast for a specific action. Passing an explicit `null` suppresses
        // the toast entirely — used by the Enhanced pages' Clear all, which
        // persists silently because the cleared chips are their own feedback.
        // Omitted everywhere else, so the default message is unchanged.
        const successMessageOverride = action.meta?.arg?.successMessage;
        if (successMessageOverride !== null) {
          state.toastMessage =
            successMessageOverride ?? message ?? PREFERENCE_SAVED_SUCCESSFULLY;
        }
        state.buttonLoading = false;
      });
  },
});

export const {
  setToastMessage,
  setLoading,
  incrementLoading,
  decrementLoading,
  setDependencies,
  clearDependencies,
  setSelectedCompany,
  setLookupValues,
  setResolvedLookupIds,
  setFileUploaded,
  setCurrencyDisplayMode,
  setCurrentOpportunityType,
} = userSlice.actions;

export const selectCurrentOpportunityType = (state: any) =>
  state.user.currentOpportunityType as string | null;

export default userSlice.reducer;
