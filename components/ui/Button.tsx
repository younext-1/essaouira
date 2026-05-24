import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outlined" | "ghost" | "gradient";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants = {
      primary: "bg-[#18181B] text-white hover:bg-[#18181B]/90", // Charcoal Ink
      outlined: "border border-[rgba(232,227,216,0.45)] text-[#18181B] hover:bg-[#F5F0E8]",
      ghost: "text-[#71717A] hover:text-[#18181B] hover:bg-[#F5F0E8]",
      gradient: "bg-accent-gradient text-white hover-lift",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[10px] px-6 h-[44px] font-medium spring-transition active-push cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA8A04] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
