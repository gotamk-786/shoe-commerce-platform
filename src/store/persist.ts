"use client";

import { RootState } from ".";

const STORAGE_KEY = "thrifty_state";

export const loadState = (): Partial<RootState> | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch (_error) {
    return undefined;
  }
};

export const saveState = (state: RootState) => {
  if (typeof window === "undefined") return;
  try {
    const serializable = {
      cart: state.cart,
      user: state.user,
      admin: state.admin,
      compare: state.compare,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (_error) {
    // ignore
  }
};
