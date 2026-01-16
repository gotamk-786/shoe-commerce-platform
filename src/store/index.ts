import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cart-slice";
import userReducer from "./slices/user-slice";
import uiReducer from "./slices/ui-slice";
import adminReducer from "./slices/admin-slice";
import compareReducer from "./slices/compare-slice";

const reducer = {
  cart: cartReducer,
  user: userReducer,
  ui: uiReducer,
  admin: adminReducer,
  compare: compareReducer,
};

export const makeStore = (preloadedState?: any) =>
  configureStore({
    reducer,
    preloadedState,
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
