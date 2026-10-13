"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean; full?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-[linear-gradient(100deg,var(--color-primary),var(--color-violet))] hover:shadow-[var(--shadow-glow)] active:translate-y-px",
  secondary: "bg-surface text-ink border border-line hover:border-primary hover:text-primary",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-line-soft",
  danger: "bg-stage-rejected-soft text-stage-rejected hover:bg-stage-rejected hover:text-white",
  dark: "bg-ink text-white hover:bg-ink-2 active:translate-y-px",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-10 px-4 text-sm gap-2 rounded-[var(--radius-sm)]",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-[var(--radius-md)]",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", loading, full, disabled, children, ...p }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
        variants[variant], sizes[size], full && "w-full", className
      )}
      {...p}
    >
      {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;
