"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { adminLogout } from "@/store/slices/admin-slice";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  return (
    <aside className="flex h-full w-64 flex-col gap-4 border-r border-white/5 bg-[#0f172a] text-white">
      <div className="px-4 pb-4 pt-6">
        <div className="text-lg font-semibold">Thrifty Admin</div>
        <p className="text-sm text-white/70">Control center</p>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-white/10",
              pathname === link.href ? "bg-white/10 text-white" : "text-white/80",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        className="mx-2 mb-4 rounded-xl border border-white/20 px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10"
        onClick={() => dispatch(adminLogout())}
      >
        Logout
      </button>
    </aside>
  );
}
