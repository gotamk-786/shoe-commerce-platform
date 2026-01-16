"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import { loadState, saveState } from "@/store/persist";
import { hydrateCart } from "@/store/slices/cart-slice";
import { hydrateUser } from "@/store/slices/user-slice";
import { adminLogin } from "@/store/slices/admin-slice";

export default function Providers({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore>();
  const [ready, setReady] = useState(false);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const preloaded = loadState();
    if (preloaded?.cart) {
      storeRef.current?.dispatch(hydrateCart(preloaded.cart));
    }
    if (preloaded?.user) {
      storeRef.current?.dispatch(hydrateUser(preloaded.user));
    }
    if (preloaded?.admin?.authenticated) {
      storeRef.current?.dispatch(
        adminLogin({ name: preloaded.admin.name || "Admin" }),
      );
    }

    const unsubscribe = storeRef.current?.subscribe(() => {
      if (!storeRef.current) return;
      saveState(storeRef.current.getState());
    });

    setReady(true);

    return () => {
      unsubscribe?.();
    };
  }, []);

  if (!ready || !storeRef.current) {
    return null;
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
