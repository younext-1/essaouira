"use client";

import { useAuthModal } from "@/store/useAuthModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function SignInModal() {
  const { isOpen, close } = useAuthModal();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="bg-white w-full max-w-sm rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-warm-border text-center"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="text-[48px] mb-4">🌊</div>

            <h2 className="text-text-primary text-[22px] font-bold mb-2 font-arabic">
              انضم إلى موكادور كونيكت
            </h2>
            <p className="text-text-secondary text-[15px] mb-8 leading-relaxed">
              سجل دخولك للتفاعل مع الحرفيين والمجتمع
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/sign-in" onClick={close}>
                <button className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-terracotta to-saffron text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(193,68,14,0.3)] hover:scale-[1.02] transition-transform active:scale-95">
                  تسجيل الدخول
                </button>
              </Link>

              <Link href="/sign-up" onClick={close}>
                <button className="w-full h-[48px] rounded-[14px] border-2 border-ocean text-ocean font-bold text-[15px] hover:bg-ocean hover:text-white transition-colors">
                  إنشاء حساب
                </button>
              </Link>

              <button
                onClick={close}
                className="text-text-muted text-[14px] hover:text-text-secondary transition-colors mt-2"
              >
                متابعة كزائر
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
