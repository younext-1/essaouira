import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export function OutlineButton({ children, className = "", ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button 
      whileTap={{ scale: 0.96 }}
      className={`border border-[#555] text-white rounded-[20px] px-4 py-1.5 text-sm font-medium hover:bg-white/5 transition-colors ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
