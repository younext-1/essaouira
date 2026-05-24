'use client';

import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center bg-warm-white px-4 py-20">
      <div className="max-w-md w-full bg-white border border-warm-border/50 rounded-[32px] p-8 md:p-10 shadow-xl text-center relative overflow-hidden">
        
        {/* Coastal Decorative Glowing shapes */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-terracotta/5 rounded-full filter blur-xl" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-ocean/5 rounded-full filter blur-xl" />

        <div className="relative z-10">
          
          {/* Pulsing Compass Logo */}
          <div className="w-16 h-16 rounded-full bg-warm-sand/50 border border-warm-border/60 flex items-center justify-center text-terracotta mx-auto mb-6 shadow-inner animate-pulse">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>

          {/* Bilingual Titles */}
          <span className="text-3xl font-display font-black text-text-primary block mb-2">404</span>
          <h1 className="text-xl font-display font-bold text-text-primary mb-3">Page Not Found / الصفحة غير موجودة</h1>
          
          <p className="text-sm text-text-secondary leading-relaxed mb-8">
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. قد يكون الرابط خاطئاً أو تم نقل الصفحة.
            <br />
            <span className="text-xs text-text-muted mt-2 block">
              Sorry, we could not find the page you are looking for. It may have been moved or deleted.
            </span>
          </p>

          {/* Return Home Action button */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-accent-gradient hover:shadow-lg text-white font-semibold py-3.5 px-6 rounded-full transition-all hover:scale-102 active:scale-98 font-arabic"
          >
            <span>العودة للرئيسية / Return Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

        </div>

      </div>
    </div>
  );
}
