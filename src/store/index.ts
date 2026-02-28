import { combineReducers, configureStore } from "@reduxjs/toolkit";
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

const rootReducer = combineReducers(reducer);

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
