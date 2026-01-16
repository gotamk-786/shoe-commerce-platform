import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AdminState = {
  authenticated: boolean;
  name: string | null;
};

const initialState: AdminState = {
  authenticated: false,
  name: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    adminLogin: (state, action: PayloadAction<{ name: string }>) => {
      state.authenticated = true;
      state.name = action.payload.name;
    },
    adminLogout: (state) => {
      state.authenticated = false;
      state.name = null;
    },
  },
});

export const { adminLogin, adminLogout } = adminSlice.actions;
export default adminSlice.reducer;
