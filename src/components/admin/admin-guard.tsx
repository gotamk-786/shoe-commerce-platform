"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.user.profile);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [isAdmin, pathname, router]);

  if (!isAdmin && pathname !== "/admin/login") {
    return null;
  }

  return <>{children}</>;
}
