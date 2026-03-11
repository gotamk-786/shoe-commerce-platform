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
        "inline-flex flex-col items-center justify-center rounded-[26px] border border-[#0f172a]/10 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-3 py-2 shadow-[0_14px_36px_rgba(15,23,42,0.1)]",
        compact ? "min-w-[108px]" : "min-w-[150px]",
        className,
      )}
    >
      <svg
        viewBox="0 0 210 78"
        className={compact ? "h-10 w-[92px]" : "h-14 w-[132px]"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M29 55C34 42 45.8 33.4 59.8 32.6L114.3 29.5C120.5 29.1 126.1 33.2 127.7 39.2L131.3 53C132.6 58.2 129.5 63.6 124.3 64.9L96.5 72C89.8 73.7 82.8 74 76 72.8L38.6 66.2C29.9 64.7 26.3 61.8 29 55Z"
          fill="#89A66A"
        />
        <path
          d="M67 66.1C71.9 58.9 79.7 54.1 88.4 53.6L155.5 49.7C161.4 49.4 166.7 53.2 168.2 58.8L170.1 66.1C171.2 70.1 168.8 74.3 164.8 75.4L153.3 78.4C149.5 79.4 145.6 79.6 141.7 79L91.2 71.8C84.1 70.8 75.5 68.5 67 66.1Z"
          fill="#D6C9A6"
          transform="translate(0 -12)"
        />
        <path
          d="M47 34.5C54.1 26.4 64.3 20.6 75.7 19.8L144 15.8C151.1 15.4 157.2 20.4 158.1 27.4L159.1 34.5"
          stroke="#89A66A"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path d="M74 25L67 31" stroke="#89A66A" strokeWidth="8" strokeLinecap="round" />
        <path d="M89 24L82 31.5" stroke="#89A66A" strokeWidth="8" strokeLinecap="round" />
        <path d="M104 23.5L97 31.5" stroke="#89A66A" strokeWidth="8" strokeLinecap="round" />
        <path d="M118 23L111 31.5" stroke="#89A66A" strokeWidth="8" strokeLinecap="round" />
        <path d="M24 53C28.1 44.5 34.8 38.1 43.1 34.7" stroke="#89A66A" strokeWidth="8" strokeLinecap="round" />
        <circle cx="15" cy="44" r="5" fill="#89A66A" />
        <circle cx="9.5" cy="52.5" r="4.5" fill="#89A66A" />
        <circle cx="20.5" cy="53.5" r="4.5" fill="#89A66A" />
        <circle cx="16" cy="61" r="4" fill="#89A66A" />
      </svg>
      <div className={cn("text-center leading-none", compact ? "-mt-1" : "-mt-2")}>
        <div
          className={cn(
            "font-semibold uppercase tracking-[0.14em] text-[#89A66A]",
            compact ? "text-[10px]" : "text-sm",
          )}
        >
          Thrifty Shoes
        </div>
        {!compact && (
          <div className="pt-1 text-[9px] font-medium tracking-[0.18em] text-[#0f172a]/70">
            Curated. Restored. Ready.
          </div>
        )}
      </div>
    </div>
  );
}
