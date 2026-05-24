"use client";
import React from "react";
import { cn } from "@/lib/utils";

export function PillFilter({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-[18px] md:px-5 py-[8px] md:py-2 rounded-[24px] text-[14px] md:text-[15px] whitespace-nowrap spring-transition active-push border cursor-pointer",
        isActive 
          ? "bg-[#18181B] border-[#18181B] text-white font-medium shadow-sm" 
          : "bg-white border-[rgba(232,227,216,0.8)] text-[#71717A] hover:text-[#18181B] hover:border-[rgba(232,227,216,1)]"
      )}
    >
      {label}
    </button>
  );
}
