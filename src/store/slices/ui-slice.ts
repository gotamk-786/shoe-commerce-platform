import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  cartOpen: boolean;
};

const initialState: UiState = {
  cartOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleCart: (state, action: PayloadAction<boolean | undefined>) => {
      state.cartOpen = action.payload ?? !state.cartOpen;
    },
  },
});

export const { toggleCart } = uiSlice.actions;
export default uiSlice.reducer;
