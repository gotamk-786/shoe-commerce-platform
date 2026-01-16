"use client";

import { useAppSelector } from "@/store/hooks";

export default function AdminTopbar() {
  const admin = useAppSelector((state) => state.admin);
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0b1224]/90 px-6 py-4 text-white backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">Admin Panel</p>
        <p className="text-lg font-semibold text-white">Welcome back{admin.name ? `, ${admin.name}` : ""}</p>
      </div>
      <div className="flex gap-3 text-sm text-white/80">
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Secure</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Live Preview</span>
      </div>
    </header>
  );
}
