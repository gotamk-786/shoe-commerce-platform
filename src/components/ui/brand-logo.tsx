"use client";

import { cn } from "@/lib/utils";

export default function BrandLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-[#0f172a]/10 bg-[linear-gradient(145deg,#f8fafc_0%,#dbeafe_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.14)]",
        compact ? "h-10 w-10" : "h-12 w-12",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_42%)]" />
      <div className="absolute inset-x-1.5 bottom-1.5 h-3 rounded-full bg-[#14b8a6]/10 blur-md" />
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 39.4C13.9 30.3 22.9 24.4 33.4 23.9L45.1 23.2C48 23.1 50.5 25 51.2 27.8L53.3 36.1C53.9 38.6 52.5 41.2 50 41.9L38.7 45C34.8 46 30.8 46.2 26.8 45.4L13.8 42.8C10.7 42.1 9 40.8 10 39.4Z"
          fill="#0F172A"
        />
        <path
          d="M17.2 41L49.6 39.3"
          stroke="#14B8A6"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M23.9 28.2L42.2 37.5"
          stroke="#E2E8F0"
          strokeWidth="3.1"
          strokeLinecap="round"
        />
        <path
          d="M28.2 26.1L46 35.1"
          stroke="#93C5FD"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M17.6 33.1L34.8 32.2"
          stroke="#F8FAFC"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M16.8 36.4L33.3 35.8"
          stroke="#F8FAFC"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M16.8 44.8L47.8 43.1"
          stroke="#0F172A"
          strokeOpacity="0.16"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M46.8 23.8L51.2 41.7"
          stroke="#0F172A"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M40.2 23.5C41.5 18.7 46.1 15.6 51.1 16.3"
          stroke="#14B8A6"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
