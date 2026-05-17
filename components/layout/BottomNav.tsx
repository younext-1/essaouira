"use client";

import { Compass, ShoppingBag, Bot, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "اكتشف", href: "/", icon: Compass },
    { name: "السوق", href: "/marketplace", icon: ShoppingBag },
    { name: "المرشد", href: "/ai-guide", icon: Bot },
    { name: "ملفي", href: "/profile", icon: User },
  ];

  return (
    <div className="w-full z-50 md:hidden bg-white/92 backdrop-blur-[20px] saturate-[180%] border-t border-warm-border shrink-0 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[64px] px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} className="relative flex-1 flex flex-col items-center justify-center gap-1 h-full min-w-[44px] min-h-[44px]">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? "text-terracotta" : "text-text-muted"}`} />
              </motion.div>
              <span className={`text-[10px] transition-colors duration-300 ${isActive ? "text-terracotta font-medium" : "text-text-muted"}`}>
                {item.name}
              </span>
              
              {isActive && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-terracotta" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
