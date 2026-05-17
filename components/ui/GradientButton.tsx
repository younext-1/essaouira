import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export function GradientButton({ children, className = "", ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button 
      whileTap={{ scale: 0.96 }}
      className={`bg-accent-gradient text-white rounded-[10px] h-[44px] px-6 font-medium flex items-center justify-center transition-opacity hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
