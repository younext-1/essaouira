import React from "react";

export function DarkInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`bg-white border border-warm-border rounded-[12px] text-text-primary px-[14px] py-[14px] placeholder:text-text-muted focus:outline-none focus:border-ocean focus:ring-1 focus:ring-ocean transition-colors ${className}`}
      {...props}
    />
  );
}
