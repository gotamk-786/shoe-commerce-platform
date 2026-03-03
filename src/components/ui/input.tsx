"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  labelClassName?: string;
  hintClassName?: string;
};

const EyeIcon = ({ hidden }: { hidden: boolean }) => {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M3 3l18 18M10.73 5.08A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7.5a11.83 11.83 0 0 1-4.06 5.19M6.61 6.61A11.8 11.8 0 0 0 1 12.5C2.73 16.89 7 20 12 20a10.94 10.94 0 0 0 5.39-1.39M9.88 9.88A3 3 0 0 0 12 15a2.99 2.99 0 0 0 2.12-.88"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
};

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, hint, className, labelClassName, hintClassName, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === "password";
    const resolvedType = isPasswordField && showPassword ? "text" : type;

    return (
      <label className="flex w-full flex-col gap-2 text-sm text-gray-700">
        {label && (
          <span className={cn("text-sm font-medium text-gray-900", labelClassName)}>{label}</span>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={resolvedType}
            className={cn(
              "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none transition focus:border-black/30 focus:shadow-[0_16px_50px_rgba(12,22,44,0.12)]",
              isPasswordField && "pr-11",
              className,
            )}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon hidden={showPassword} />
            </button>
          )}
        </div>
        {hint && <span className={cn("text-xs text-gray-500", hintClassName)}>{hint}</span>}
      </label>
    );
  },
);

Input.displayName = "Input";

export default Input;
