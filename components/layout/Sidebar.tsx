"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, User, BotMessageSquare, Store } from "lucide-react";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const LogoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 12c3-3 6-3 9 0s6 3 9 0" />
    <path d="M2 17c3-3 6-3 9 0s6 3 9 0" />
    <path d="M21 6.5a5 5 0 0 1-7.5-3.5 5 5 0 0 0 7.5 3.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Explore", href: "/", icon: Compass },
    { name: "My Profile", href: "/profile", icon: User },
    { name: "AI Guide", href: "/ai-guide", icon: BotMessageSquare },
    { name: "Marketplace", href: "/marketplace", icon: Store },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[280px] bg-brand-deep-ocean bg-zellige text-brand-off-white h-screen fixed left-0 top-0 p-8 z-50">
      <div className="flex items-center gap-3 mb-12">
        <div className="bg-brand-saffron text-brand-deep-ocean p-1.5 rounded-xl shadow-lg">
          <LogoIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display leading-tight tracking-wide">
          Mogador<br />Connect
        </h1>
      </div>

      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300",
                isActive ? "text-brand-saffron font-medium bg-white/5" : "text-brand-off-white/70 hover:text-brand-off-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-white/5 rounded-2xl border-b-2 border-brand-saffron"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-6">
        <Button variant="gradient" className="w-full py-4 text-sm tracking-wide">
          Book a Guide
        </Button>

        <div className="flex items-center gap-3 px-2">
          <Avatar 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop" 
            alt="User" 
            size="md" 
            showStatus 
          />
          <div className="flex flex-col">
            <span className="font-medium text-sm">Amine</span>
            <span className="text-xs text-brand-off-white/60">Local Explorer</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
