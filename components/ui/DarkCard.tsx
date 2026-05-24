import React from "react";
import { cn } from "@/lib/utils";

export function DarkCard({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "bg-[#18181B] text-white rounded-[24px] border border-[rgba(232,227,216,0.1)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden", 
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
