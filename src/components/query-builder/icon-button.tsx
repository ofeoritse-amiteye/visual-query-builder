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
        "icon-button-shell inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm transition duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        "hover:-translate-y-0.5 active:translate-y-0",
        variant === "ghost" && "border-border/85 bg-panel/80 text-ink shadow-sm hover:border-accent/45 hover:bg-muted/80 hover:text-accent",
        variant === "solid" && "border-accentSoft/50 bg-accentDeep text-white shadow-[0_8px_20px_rgb(var(--accent-deep)/0.28)] hover:bg-accent",
        variant === "danger" && "border-danger/35 bg-danger/10 text-danger hover:border-danger/60 hover:bg-danger/15",
        className
      )}
      {...props}
    >
      {children}
      <span className="icon-button-tooltip">{label}</span>
    </button>
  );
}
