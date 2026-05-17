import React from "react";

export function DarkCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[20px] shadow-[0_2px_16px_rgba(26,26,46,0.07)] border border-warm-border overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(26,26,46,0.12)] ${className}`}>
      {children}
    </div>
  );
}
