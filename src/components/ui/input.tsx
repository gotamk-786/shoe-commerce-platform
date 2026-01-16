"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  labelClassName?: string;
  hintClassName?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, hint, className, labelClassName, hintClassName, ...props }, ref) => (
    <label className="flex w-full flex-col gap-2 text-sm text-gray-700">
      {label && (
        <span className={cn("text-sm font-medium text-gray-900", labelClassName)}>{label}</span>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none transition focus:border-black/30 focus:shadow-[0_16px_50px_rgba(12,22,44,0.12)]",
          className,
        )}
        {...props}
      />
      {hint && <span className={cn("text-xs text-gray-500", hintClassName)}>{hint}</span>}
    </label>
  ),
);

Input.displayName = "Input";

export default Input;
