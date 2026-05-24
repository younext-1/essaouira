import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export function GradientButton({ children, className = "", ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button 
      whileTap={{ scale: 0.98, y: 1 }}
      className={`bg-accent-gradient text-white rounded-[10px] h-[44px] px-6 font-medium flex items-center justify-center hover-lift cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
