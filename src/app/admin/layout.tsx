"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/admin/admin-guard";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <AdminGuard>{children}</AdminGuard>;
  }

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#0b1224] text-white">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminTopbar />
          <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#0b1224] via-[#0c142a] to-[#0b1224] p-6">
            <div className="pointer-events-none absolute -top-32 right-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.18),_transparent_65%)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.14),_transparent_65%)] blur-3xl" />
            <div className="relative z-10">{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
