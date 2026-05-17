"use client";

import { motion } from "framer-motion";

export const SparkleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--color-ocean, #1B6CA8)" />
        <stop offset="100%" stopColor="var(--color-terracotta, #C1440E)" />
      </linearGradient>
    </defs>
    <path 
      d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" 
      fill="url(#sparkleGrad)" 
    />
  </svg>
);

export function TypingIndicator() {
  return (
    <div className="w-full flex items-start gap-4 mb-8">
      <div className="shrink-0 mt-0.5">
        <SparkleIcon />
      </div>
      <div className="flex gap-1.5 items-center h-6">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          className="w-1.5 h-1.5 bg-text-muted rounded-full"
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          className="w-1.5 h-1.5 bg-text-muted rounded-full"
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          className="w-1.5 h-1.5 bg-text-muted rounded-full"
        />
      </div>
    </div>
  );
}
