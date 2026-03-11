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
        "relative overflow-hidden rounded-[22px] border border-black/10 bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_58%,#38bdf8_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.18)]",
        compact ? "h-10 w-10" : "h-12 w-12",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_40%)]" />
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11 39.5C14.5 30.8 22.7 25 32.4 24.4L42.3 23.8C45.6 23.6 48.7 25.9 49.5 29.1L51.1 35.2C51.8 38.1 50.1 41.1 47.2 41.8L37.4 44.3C34.4 45.1 31.2 45.2 28.2 44.7L15 42.4C11.7 41.8 10.2 40.7 11 39.5Z"
          fill="#F8FAFC"
        />
        <path
          d="M18 40.4L47.8 38.8"
          stroke="#0F172A"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M25.6 27.4L40.2 38.7"
          stroke="#FB7185"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M29.6 25.7L44.6 37.1"
          stroke="#FDBA74"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M18.2 32.7L35.9 32"
          stroke="#F8FAFC"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M17.1 36L33.8 35.4"
          stroke="#F8FAFC"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M17.4 44.5L47 42.7"
          stroke="#38BDF8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M45.3 24.5L49.5 41.8"
          stroke="#0F172A"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
