"use client";
import React from "react";
import { motion } from "framer-motion";

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
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-[18px] md:px-5 py-[8px] md:py-2 rounded-[24px] text-[14px] md:text-[15px] whitespace-nowrap transition-all duration-300 border ${
        isActive 
          ? "bg-terracotta border-terracotta text-white font-medium shadow-[0_4px_12px_rgba(193,68,14,0.25)]" 
          : "bg-white border-warm-border text-text-secondary hover:text-text-primary hover:border-warm-border"
      }`}
    >
      {label}
    </motion.button>
  );
}
