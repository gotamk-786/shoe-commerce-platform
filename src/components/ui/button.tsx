"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft";
  icon?: ReactNode;
  full?: boolean;
};

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-black text-white hover:shadow-[0_18px_40px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] px-5 py-3 focus-visible:outline-black",
  ghost:
    "bg-white text-black border border-black/10 hover:border-black/20 hover:-translate-y-[1px] px-5 py-3 backdrop-blur focus-visible:outline-black",
  soft:
    "bg-gray-100 text-black hover:bg-gray-200 hover:-translate-y-[1px] px-5 py-3 border border-transparent focus-visible:outline-black",
};

export default function Button({
  children,
  variant = "primary",
  icon,
  full,
  className,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={cn(base, variants[variant], full && "w-full", className)}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  );
}
