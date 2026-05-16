"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outlined" | "ghost" | "gradient";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants = {
      primary: "bg-brand-deep-ocean text-white hover:bg-brand-deep-ocean/90",
      outlined: "border-2 border-brand-dark-text/20 text-brand-dark-text hover:bg-brand-dark-text/5",
      ghost: "text-brand-dark-text hover:bg-brand-soft-gray",
      gradient: "bg-gradient-to-r from-brand-terracotta to-brand-saffron text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
