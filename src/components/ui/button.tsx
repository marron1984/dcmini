import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-lift active:scale-[0.98]",
  secondary: "bg-slate-100 text-ink hover:bg-slate-200 active:scale-[0.98]",
  outline:
    "border border-slate-300 bg-white text-ink hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 active:scale-[0.98]",
  ghost: "text-ink hover:bg-slate-100 active:scale-[0.98]",
  danger: "bg-red-600 text-white shadow-soft hover:bg-red-700 active:scale-[0.98]",
  success: "bg-emerald-600 text-white shadow-soft hover:bg-emerald-700 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-14 px-8 text-lg",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
