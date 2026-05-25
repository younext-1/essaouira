"use client";

import { Search, User, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";

// Custom AliExpress-style checkmark badge/logo
function AliExpressHomeIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg 
        viewBox="0 0 24 24" 
        className="w-5.5 h-5.5" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M12 2L4 5V11C4 16.55 7.38 21.74 12 23C16.62 21.74 20 16.55 20 11V5L12 2Z" 
          fill="#E61E42"
        />
        <path 
          d="M9 12L11 14L15.5 9.5" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg 
      viewBox="0 0 24 24" 
      className="w-5.5 h-5.5" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 2.5L4.5 5.25V11C4.5 16.1 7.7 20.8 12 22C16.3 20.8 19.5 16.1 19.5 11V5.25L12 2.5Z" 
        stroke="#71717A"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path 
        d="M9 12L11 14L15.5 9.5" 
        stroke="#71717A" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

  const items = [
    {
      name: "Home",
      href: "/",
      customIcon: (active: boolean) => <AliExpressHomeIcon active={active} />,
    },
    {
      name: "Shop",
      href: "/search",
      icon: Search,
    },
    {
      name: "Cart",
      href: "/cart",
      icon: ShoppingCart,
      badge: true,
    },
    {
      name: "Account",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <div className="w-full fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-150 pb-[env(safe-area-inset-bottom)] shadow-lg transition-all duration-300">
      <div className="flex items-center justify-around h-[64px] px-1 max-w-lg mx-auto select-none">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full min-w-[44px] select-none"
            >
              <motion.div whileTap={{ scale: 0.9 }} className="relative flex items-center justify-center h-6">
                {item.customIcon ? (
                  item.customIcon(isActive)
                ) : IconComponent ? (
                  <IconComponent 
                    className={`w-5.5 h-5.5 stroke-[2.2] transition-colors duration-200 ${
                      isActive ? "text-[#E61E42]" : "text-text-secondary"
                    }`} 
                  />
                ) : null}
                
                {item.badge && cartItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#E61E42] text-[8px] font-black text-white shadow-sm ring-1 ring-white">
                    {cartItemsCount}
                  </span>
                )}
              </motion.div>
              
              <span 
                className={`text-[9px] tracking-wide mt-0.5 transition-colors duration-200 font-sans ${
                  isActive ? "text-[#E61E42] font-black" : "text-text-secondary font-semibold"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

