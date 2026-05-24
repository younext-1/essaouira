import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export function OutlineButton({ children, className = "", ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button 
      whileTap={{ scale: 0.98, y: 1 }}
      className={`border border-[rgba(232,227,216,0.8)] text-[#18181B] rounded-[10px] px-6 h-[44px] text-sm font-medium hover:bg-[#F5F0E8] spring-transition cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
