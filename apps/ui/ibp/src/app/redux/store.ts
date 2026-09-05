import { configureStore } from "@reduxjs/toolkit";
import { permissionsReducer, policyReducer } from "@ui/ui-lib";
import userReducer from "./slice";
import portalConfigReducer from "./portalConfigSlice";
import companyTemplateReducer from "./companyTemplateSlice";
import policyTemplateReducer from "./policyTemplateSlice";
import tcReducer from "./tcSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    permissions: permissionsReducer,
    policyData: policyReducer,
    portalConfig: portalConfigReducer,
    companyTemplate: companyTemplateReducer,
    policyTemplate: policyTemplateReducer,
    tc: tcReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
