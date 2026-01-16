"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pill inline-flex items-center gap-1 text-xs font-medium text-gray-600",
        className,
      )}
    >
      {children}
    </span>
  );
}
