import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice";
// import permissionsReducer from "./permissionSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    // permissions: permissionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

export const hellotest = "store";
