"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUploadsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/products");
  }, [router]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      Redirecting to product uploads...
    </div>
  );
}
