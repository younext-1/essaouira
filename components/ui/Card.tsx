import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass-premium-white rounded-[24px] overflow-hidden",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
