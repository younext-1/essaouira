import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-[20px] shadow-[0_8px_32px_rgba(13,59,94,0.08)] overflow-hidden border-l-4 border-l-brand-terracotta/80",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
