"use client";

import { ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import { loadState, saveState } from "@/store/persist";
import { hydrateCart } from "@/store/slices/cart-slice";
import { hydrateUser } from "@/store/slices/user-slice";
import { adminLogin } from "@/store/slices/admin-slice";

export default function Providers({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());

  useEffect(() => {
    const preloaded = loadState();
    if (preloaded?.cart) {
      store.dispatch(hydrateCart(preloaded.cart));
    }
    if (preloaded?.user) {
      store.dispatch(hydrateUser(preloaded.user));
    }
    if (preloaded?.admin?.authenticated) {
      store.dispatch(
        adminLogin({ name: preloaded.admin.name || "Admin" }),
      );
    }

    const unsubscribe = store.subscribe(() => {
      saveState(store.getState());
    });

    return () => {
      unsubscribe();
    };
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
