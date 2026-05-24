"use client";

import { Compass, Search, Bot, User, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";

export function BottomNav() {
  const pathname = usePathname();
  const { cartItemsCount } = useCart();

  // Hide BottomNav inside dashboard and auth pages
  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up")
  ) {
    return null;
  }

  const navItems = [
    { name: "Explore", href: "/", icon: Compass },
    { name: "Search", href: "/search", icon: Search },
    { name: "AI Guide", href: "/chat", icon: Bot },
    { name: "Cart", href: "/cart", icon: ShoppingBag, badge: true },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="w-full fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-warm-border pb-[env(safe-area-inset-bottom)] shadow-lg transition-all duration-300">
      <div className="flex items-center justify-around h-[64px] px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className="relative flex-1 flex flex-col items-center justify-center gap-1 h-full min-w-[44px] min-h-[44px] select-none"
            >
              <motion.div whileTap={{ scale: 0.9 }} className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-[#CA8A04]" : "text-text-secondary"}`} />
                {item.badge && cartItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1C1917] text-[8px] font-bold text-white shadow-sm ring-2 ring-white">
                    {cartItemsCount}
                  </span>
                )}
              </motion.div>
              <span className={`text-[9.5px] tracking-wide transition-colors duration-300 ${isActive ? "text-[#CA8A04] font-bold" : "text-text-secondary font-medium"}`}>
                {item.name}
              </span>
              
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-[#CA8A04]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
