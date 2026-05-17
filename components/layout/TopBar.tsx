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

  let title = "موكادور";
  if (pathname === "/") title = "اكتشف موكادور";
  else if (pathname === "/profile") title = "ملفي الشخصي";
  else if (pathname === "/marketplace") title = "السوق";
  else if (pathname === "/book") title = "احجز مرشداً";
  else if (pathname === "/ai-guide") title = "مرحباً بموكادور";

  return (
    <header className="h-[48px] md:h-[56px] pt-[env(safe-area-inset-top)] w-full flex items-center justify-between px-4 bg-white border-b border-warm-border shadow-[0_1px_8px_rgba(0,0,0,0.06)] shrink-0 z-40">
      <div className="flex-1 flex items-center gap-2">
        <div className="flex bg-warm-sand rounded-lg p-1 text-xs font-medium text-text-secondary">
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
        <h1 className="text-text-primary font-bold text-[17px] md:text-lg tracking-wide font-arabic">{title}</h1>
      </div>

      <div className="flex-1 flex justify-end items-center gap-1 md:gap-2">
        <motion.button whileTap={{ scale: 0.9 }} className="hidden md:flex w-[44px] h-[44px] md:w-10 md:h-10 items-center justify-center rounded-full hover:bg-warm-sand text-text-secondary hover:text-ocean transition-colors">
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
              className="px-4 py-2 rounded-xl bg-terracotta text-white text-[13px] font-medium hover:bg-[#A83A0C] transition-colors"
            >
              تسجيل الدخول
            </motion.button>
          </SignInButton>
        )}
      </div>
    </header>
  );
}
