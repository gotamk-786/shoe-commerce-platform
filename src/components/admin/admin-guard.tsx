"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const admin = useAppSelector((state) => state.admin);
  const forceAdmin = process.env.NEXT_PUBLIC_FORCE_ADMIN === "true";
  const isLoggedIn = admin.authenticated || forceAdmin;

  useEffect(() => {
    if (!isLoggedIn && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [isLoggedIn, pathname, router]);

  if (!isLoggedIn && pathname !== "/admin/login") {
    return null;
  }

  return <>{children}</>;
}
