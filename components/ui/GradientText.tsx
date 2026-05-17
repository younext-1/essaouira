import React from "react";

export function GradientText({ children, className = "", as: Component = "span" }: { children: React.ReactNode; className?: string; as?: any }) {
  return (
    <Component className={`text-accent-gradient ${className}`}>
      {children}
    </Component>
  );
}
