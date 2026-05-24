import React from "react";

export function DarkInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`bg-white border border-[rgba(232,227,216,0.8)] rounded-[12px] text-[#18181B] px-4 py-3 placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#CA8A04] focus:ring-1 focus:ring-[#CA8A04] transition-all hover:border-[#18181B]/20 ${className}`}
      {...props}
    />
  );
}
