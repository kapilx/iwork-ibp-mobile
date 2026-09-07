import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { FeatureKey, featurePermissionMap } from "../rbac/permissionMap";
// `import type` guarantees this is elided at build time (it's used only as a
// type annotation below) rather than relying on the bundler to infer that —
// a real runtime import here would close a direct cycle with store.ts, which
// imports this file for permissionsReducer.
import type { RootState } from "./store";

export interface PermissionsState {
  roleId: number | null;
  roleName: string | null;
  access: Record<string, any> | null;
}

const initialState: PermissionsState = {
  roleId: null,
  roleName: null,
  access: null,
};

export const fetchPermissions = createAsyncThunk(
  "permissions/fetch",
  async () => {
    const data = await apiRequest(endPoints.permissions);

    if (data?.status === 200) {
      return {
        roleId: data.data.roleId || null,
        roleName: data.data.roleName || null,
        access: data.data.access || {},
      };
    }
    return {
      roleId: null,
      roleName: null,
      access: {},
    };
  }
);

const permissionsSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    resetPermissions: (state) => {
      state.roleId = null;
      state.roleName = null;
      state.access = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPermissions.fulfilled, (state, action) => {
      state.roleId = action.payload.roleId;
      state.roleName = action.payload.roleName;
      state.access = action.payload.access;
    });
  },
});

export const selectPermissions = (state: RootState) =>
  state.permissions?.access ?? null;

export const selectRoleId = (state: RootState) =>
  state.permissions?.roleId ?? null;

export const selectRoleName = (state: RootState) =>
  state.permissions?.roleName ?? null;

export const selectHasPermission =
  (feature: FeatureKey) => (state: RootState) => {
    const perms = state.permissions?.access;
    if (!perms) return false;
    const config = featurePermissionMap[feature];
    if (!config) return true;

    return Boolean(perms?.[config.scope]?.[config.category]?.[config.action]);
  };

export const { resetPermissions } = permissionsSlice.actions;

export default permissionsSlice.reducer;
