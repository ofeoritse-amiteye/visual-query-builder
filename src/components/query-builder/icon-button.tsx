"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  variant?: "ghost" | "solid" | "danger";
};

export function IconButton({ label, children, className, variant = "ghost", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm transition",
        variant === "ghost" && "border-border bg-panel hover:bg-muted",
        variant === "solid" && "border-accent bg-accent text-slate-950 hover:brightness-95",
        variant === "danger" && "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
