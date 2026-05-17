"use client";

import { Compass, ShoppingBag, MessageSquare, Edit } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import Image from "next/image";

export function NarrowSidebar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const { profile } = useProfile();

  const navItems = [
    { name: "Explore", path: "/", icon: Compass },
    { name: "Marketplace", path: "/marketplace", icon: ShoppingBag },
    { name: "AI Guide", path: "/ai-guide", icon: MessageSquare },
  ];

  const displayName = profile?.full_name || user?.fullName || user?.username || "Guest";
  const profileLink = profile?.username
    ? `/profile/${profile.username}`
    : profile?.id
    ? `/profile/${profile.id}`
    : "/sign-in";

  return (
    <aside className="w-[240px] h-screen bg-white flex flex-col py-6 shadow-sm">
      <div className="px-6 mb-10 flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ocean">
          <path d="M2 12h4l2-3 4 6 2-3h4" />
        </svg>
        <h1 className="font-display font-bold text-xl text-ocean tracking-wide">Mogador Connect</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-warm-sand text-ocean border-l-4 border-terracotta font-medium"
                    : "text-text-secondary hover:text-ocean hover:bg-warm-sand"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </motion.div>
            </Link>
          );
        })}

        {/* Artisan-only: Edit Profile */}
        {isSignedIn && profile?.role === "artisan" && (
          <Link href="/profile/edit">
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === "/profile/edit"
                  ? "bg-warm-sand text-ocean border-l-4 border-terracotta font-medium"
                  : "text-text-secondary hover:text-ocean hover:bg-warm-sand"
              }`}
            >
              <Edit className="w-5 h-5" />
              <span>Edit Profile</span>
            </motion.div>
          </Link>
        )}
      </nav>
      
      <div className="mt-auto px-4 flex flex-col gap-4">
        <Link href="/book">
          <button className="w-full bg-terracotta text-white rounded-xl py-3 font-medium shadow-md hover:bg-[#A83A0C] hover:shadow-lg transition-all duration-300">
            Book a Guide
          </button>
        </Link>
        
        <div className="border-t border-warm-border pt-4 flex items-center gap-3 px-2">
          {isSignedIn ? (
            <>
              <Link href={profileLink}>
                <div className="w-10 h-10 rounded-full bg-ocean flex items-center justify-center text-white font-medium cursor-pointer hover:opacity-80 transition-opacity overflow-hidden relative">
                  {user?.imageUrl ? (
                    <Image src={user.imageUrl} alt={displayName} fill className="object-cover" />
                  ) : (
                    displayName[0]?.toUpperCase() || "?"
                  )}
                </div>
              </Link>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-text-primary truncate">{displayName}</span>
                <Link href={profileLink} className="text-xs text-text-muted hover:text-ocean transition-colors">
                  View Profile
                </Link>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-0 h-0 hidden",
                    userButtonTrigger: "w-8 h-8",
                  },
                }}
              />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="w-full flex items-center gap-3 text-text-secondary hover:text-ocean transition-colors">
                <div className="w-10 h-10 rounded-full bg-warm-sand border border-warm-border flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">تسجيل الدخول</span>
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </aside>
  );
}
