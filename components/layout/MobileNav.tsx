"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, User, BotMessageSquare, Store, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Explore", href: "/", icon: Compass },
    { name: "Guide", href: "/ai-guide", icon: BotMessageSquare },
    { name: "Add", href: "#", icon: PlusCircle, isMain: true },
    { name: "Shop", href: "/marketplace", icon: Store },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full glass-nav z-50 flex justify-around items-end pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.isMain) {
          return (
            <button key={item.name} className="flex flex-col items-center gap-1 p-2 -translate-y-4">
              <div className="bg-gradient-to-tr from-brand-terracotta to-brand-saffron text-white p-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform">
                <item.icon className="w-7 h-7" />
              </div>
            </button>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 p-3 transition-colors",
              isActive ? "text-brand-deep-ocean" : "text-brand-dark-text/50 hover:text-brand-dark-text"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="mobile-active"
                className="absolute -top-2 w-8 h-1 bg-brand-terracotta rounded-b-full"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <item.icon className={cn("w-6 h-6", isActive && "fill-brand-deep-ocean/10")} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
