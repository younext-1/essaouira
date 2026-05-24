"use client";

import { Share, MoreVertical } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";

export function TopBar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [lang, setLang] = useState("EN");

  let title = "Mogador";
  if (pathname === "/") title = "Discover Mogador";
  else if (pathname === "/profile") title = "My Profile";
  else if (pathname.startsWith("/profile/edit")) title = "Edit Profile";
  else if (pathname === "/marketplace") title = "Marketplace";
  else if (pathname === "/book") title = "Book a Guide";
  else if (pathname === "/ai-guide") title = "AI Guide";

  return (
    <header className="h-[48px] md:h-[56px] pt-[env(safe-area-inset-top)] w-full flex items-center justify-between px-4 bg-white border-b border-[rgba(232,227,216,0.8)] shadow-[0_1px_8px_rgba(0,0,0,0.06)] shrink-0 z-40">
      <div className="flex-1 flex items-center gap-2">
        <div className="flex bg-[#F5F0E8] rounded-lg p-1 text-xs font-medium text-[#71717A]">
          {["EN", "FR", "AR"].map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-1 rounded-md transition-colors ${lang === l ? "bg-white text-ocean shadow-sm" : "hover:text-ocean"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex justify-center">
        <h1 className="text-[#18181B] font-bold text-[17px] md:text-lg tracking-wide font-arabic">{title}</h1>
      </div>

      <div className="flex-1 flex justify-end items-center gap-1 md:gap-2">
        <motion.button whileTap={{ scale: 0.9 }} className="hidden md:flex w-[44px] h-[44px] md:w-10 md:h-10 items-center justify-center rounded-full hover:bg-[#F5F0E8] text-[#71717A] hover:text-ocean transition-colors">
          <Share className="w-5 h-5" />
        </motion.button>

        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 ring-2 ring-terracotta/30",
              },
            }}
          />
        ) : (
          <SignInButton mode="modal">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="px-4 py-2 rounded-xl bg-[#CA8A04] text-white text-[13px] font-medium hover:bg-[#A83A0C] transition-colors"
            >
              Sign In
            </motion.button>
          </SignInButton>
        )}
      </div>
    </header>
  );
}
