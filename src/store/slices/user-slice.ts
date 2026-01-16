import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile } from "@/lib/types";

type UserState = {
  token: string | null;
  profile: UserProfile | null;
};

const initialState: UserState = {
  token: null,
  profile: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    hydrateUser: (_state, action: PayloadAction<UserState>) => action.payload,
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: UserProfile }>,
    ) => {
      state.token = action.payload.token;
      state.profile = action.payload.user;
      if (typeof window !== "undefined") {
        localStorage.setItem("thrifty_token", action.payload.token);
      }
    },
    updateProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.profile = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("thrifty_token");
      }
    },
  },
});

export const { hydrateUser, setCredentials, updateProfile, logout } =
  userSlice.actions;
export default userSlice.reducer;
