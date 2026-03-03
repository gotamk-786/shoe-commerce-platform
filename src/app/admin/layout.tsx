"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/admin/admin-guard";
import AdminSidebar, { SidebarContent } from "@/components/admin/sidebar";
import AdminTopbar from "@/components/admin/topbar";
import { useAppDispatch } from "@/store/hooks";
import { adminLogout } from "@/store/slices/admin-slice";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow || "";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  if (isLogin) {
    return <AdminGuard>{children}</AdminGuard>;
  }

  return (
    <AdminGuard>
      <div className="admin-shell flex min-h-screen bg-[#0b1224] text-white">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar onMenuToggle={() => setMobileSidebarOpen((value) => !value)} />
          <main className="relative flex-1 overflow-hidden bg-gradient-to-b from-[#0b1224] via-[#0c142a] to-[#0b1224] p-4 md:p-6">
            <div className="pointer-events-none absolute -top-32 right-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.18),_transparent_65%)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.14),_transparent_65%)] blur-3xl" />
            <div className="relative z-10">{children}</div>
          </main>
        </div>
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/50 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          >
            <div className="h-full" onClick={(e) => e.stopPropagation()}>
              <SidebarContent
                pathname={pathname}
                onLogout={() => dispatch(adminLogout())}
                onNavigate={() => setMobileSidebarOpen(false)}
                className="h-full w-[85%] max-w-xs"
              />
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
