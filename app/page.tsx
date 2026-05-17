"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Compass, ShoppingBag, Bot, Calendar, ChevronLeft, Star, MapPin, Image as ImageIcon } from "lucide-react";
import { GradientAvatar } from "@/components/ui/GradientAvatar";
import { createClient } from "@/lib/supabase/client";
import type { PostWithCounts, Profile } from "@/lib/database.types";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function LandingPage() {
  const [artisans, setArtisans] = useState<Profile[]>([]);
  const [latestPosts, setLatestPosts] = useState<PostWithCounts[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("profiles").select("*").eq("is_artisan", true).eq("verified", true).limit(6).then(({ data }) => setArtisans((data as Profile[]) ?? []));
    supabase.from("posts_with_counts").select("*").order("created_at", { ascending: false }).limit(3).then(({ data }) => setLatestPosts((data as PostWithCounts[]) ?? []));
  }, []);

  return (
    <div className="w-full min-h-full overflow-x-hidden" dir="rtl">

      {/* ── HERO ── */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ocean via-ocean/90 to-seafoam" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=1600')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-warm-white via-transparent to-transparent" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.8 }} className="relative z-10 px-6 max-w-2xl">
          <span className="inline-block bg-white/15 backdrop-blur-md border border-white/20 text-white text-[13px] font-medium px-4 py-1.5 rounded-full mb-6">🌊 الصويرة، المغرب</span>
          <h1 className="font-display text-white text-[42px] md:text-[56px] font-bold leading-[1.15] mb-4 drop-shadow-lg">
            اكتشف <span className="text-saffron">موكادور</span>
          </h1>
          <p className="text-white/90 text-[16px] md:text-[18px] leading-relaxed mb-8 max-w-md mx-auto">
            تواصل مع الحرفيين المحليين واستمتع بثقافة الصويرة الأصيلة
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/explore" className="inline-flex items-center justify-center gap-2 bg-white text-ocean font-bold text-[15px] px-8 py-3.5 rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:scale-[1.03] transition-transform">
              <Compass className="w-5 h-5" /> استكشف الآن
            </Link>
            <Link href="/book" className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-[15px] px-8 py-3.5 rounded-[14px] hover:bg-white/25 transition-colors">
              <Calendar className="w-5 h-5" /> احجز مرشداً
            </Link>
          </div>
        </motion.div>

        <div className="absolute bottom-0 w-full">
          <svg viewBox="0 0 1440 120" className="w-full h-auto translate-y-1 fill-warm-white" preserveAspectRatio="none">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </div>
      </section>

      {/* ── WHAT IS MOGADOR ── */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 md:py-20">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-text-primary text-[28px] md:text-[32px] font-bold text-center mb-12">
          ماذا ستجد في <span className="text-terracotta">موكادور كونكت</span>؟
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🎨", title: "تواصل مع الحرفيين", desc: "اكتشف أمهر الحرفيين في الصويرة وتواصل معهم مباشرة", color: "from-terracotta/10 to-saffron/10" },
            { icon: "🌊", title: "اكتشف التجارب", desc: "تزلج، موسيقى كناوة، طعام مغربي أصيل وتجارب لا تُنسى", color: "from-ocean/10 to-seafoam/10" },
            { icon: "🛍️", title: "تسوق الأصالة", desc: "منتجات يدوية أصيلة من خشب الثويا والفضة والنسيج المغربي", color: "from-purple-500/10 to-pink-500/10" },
          ].map((card, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.15 }}
              className={`bg-gradient-to-br ${card.color} rounded-[24px] p-8 border border-warm-border hover:shadow-lg transition-shadow text-center`}>
              <div className="text-[48px] mb-4">{card.icon}</div>
              <h3 className="text-text-primary font-bold text-[18px] mb-2">{card.title}</h3>
              <p className="text-text-secondary text-[14px] leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURED ARTISANS ── */}
      {artisans.length > 0 && (
        <section className="w-full bg-gradient-to-b from-warm-sand/50 to-warm-white py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-text-primary text-[24px] md:text-[28px] font-bold">⭐ حرفيون مميزون</h2>
              <Link href="/explore" className="text-ocean text-[14px] font-medium flex items-center gap-1 hover:gap-2 transition-all">
                عرض الكل <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-4">
              {artisans.map((a, i) => (
                <Link key={a.id} href={`/profile/${a.username || a.id}`}>
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                    className="shrink-0 w-[200px] bg-white rounded-[20px] border border-warm-border p-5 text-center hover:shadow-lg transition-shadow group cursor-pointer">
                    <GradientAvatar src={a.avatar_url || ""} alt={a.full_name || ""} size={72} className="mx-auto mb-3 group-hover:scale-105 transition-transform" />
                    <h4 className="text-text-primary font-bold text-[15px] mb-1 truncate">{a.full_name}</h4>
                    <p className="text-text-muted text-[12px] mb-2 truncate">{a.title}</p>
                    <div className="flex items-center justify-center gap-1 text-saffron text-[12px]">
                      <Star className="w-3.5 h-3.5 fill-current" /> <span>4.9</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── LATEST POSTS ── */}
      {latestPosts.length > 0 && (
        <section className="w-full max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-text-primary text-[24px] md:text-[28px] font-bold">📰 أحدث المنشورات</h2>
            <Link href="/explore" className="text-ocean text-[14px] font-medium flex items-center gap-1 hover:gap-2 transition-all">
              عرض الكل <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestPosts.map((post, i) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[20px] border border-warm-border overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="relative w-full h-[180px] bg-warm-sand">
                    {post.cover_image ? (
                      <Image src={post.cover_image} alt={post.title || ""} fill className="object-cover group-hover:scale-[1.03] transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-text-muted" /></div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-terracotta text-[11px] font-medium px-3 py-1 rounded-full">{post.category}</div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-text-primary font-bold text-[15px] mb-1 line-clamp-1">{post.title}</h4>
                    <p className="text-text-secondary text-[13px] line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-2">
                      <GradientAvatar src={post.avatar_url || ""} alt={post.full_name || ""} size={24} />
                      <span className="text-text-muted text-[12px]">{post.full_name}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── AI GUIDE PROMO ── */}
      <section className="w-full bg-gradient-to-br from-ocean/5 to-seafoam/10 py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="text-[56px] mb-4">🤖</div>
            <h2 className="font-display text-text-primary text-[28px] md:text-[32px] font-bold mb-4">
              اسأل مرشدنا الذكي عن الصويرة
            </h2>
            <p className="text-text-secondary text-[16px] mb-8 max-w-md mx-auto">أفضل الأماكن، المطاعم، الحرفيين — دليلك الشخصي على مدار الساعة</p>
            <div className="bg-white rounded-[20px] border border-warm-border p-6 max-w-md mx-auto mb-8 text-right">
              <div className="bg-ocean/10 text-ocean rounded-[14px] px-4 py-2.5 mb-3 text-[14px] inline-block">أين أجد أفضل حرفيي الخشب؟</div>
              <div className="bg-warm-sand rounded-[14px] px-4 py-2.5 text-[14px] text-text-primary leading-relaxed">
                أنصحك بزيارة سوق الحدادين في المدينة القديمة! ستجد هناك أمين الخشبي — حرفي ثويا محترف بخبرة 12 سنة 🪵
              </div>
            </div>
            <Link href="/ai-guide" className="inline-flex items-center gap-2 bg-ocean text-white font-bold text-[15px] px-8 py-3.5 rounded-[14px] shadow-[0_8px_20px_rgba(27,108,168,0.3)] hover:scale-[1.03] transition-transform">
              <Bot className="w-5 h-5" /> ابدأ المحادثة
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="w-full max-w-3xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Compass, label: "استكشف", href: "/explore", color: "text-ocean" },
            { icon: ShoppingBag, label: "تسوق", href: "/marketplace", color: "text-terracotta" },
            { icon: Calendar, label: "احجز", href: "/book", color: "text-saffron" },
            { icon: Bot, label: "اسأل AI", href: "/ai-guide", color: "text-seafoam" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="bg-white rounded-[16px] border border-warm-border p-5 text-center hover:shadow-md transition-shadow group cursor-pointer">
                  <Icon className={`w-8 h-8 ${item.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                  <span className="text-text-primary font-medium text-[14px]">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full bg-gradient-to-b from-warm-sand/50 to-warm-sand py-12 border-t border-warm-border">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ocean">
              <path d="M2 12h4l2-3 4 6 2-3h4" />
            </svg>
            <span className="font-display font-bold text-xl text-ocean">Mogador Connect</span>
          </div>
          <p className="text-text-muted text-[14px] mb-6">تواصل مع روح الصويرة</p>
          <div className="flex items-center justify-center gap-6 mb-8 text-[14px]">
            <Link href="/explore" className="text-text-secondary hover:text-ocean transition-colors">استكشف</Link>
            <Link href="/marketplace" className="text-text-secondary hover:text-ocean transition-colors">السوق</Link>
            <Link href="/ai-guide" className="text-text-secondary hover:text-ocean transition-colors">المرشد الذكي</Link>
            <Link href="/book" className="text-text-secondary hover:text-ocean transition-colors">احجز</Link>
          </div>
          <p className="text-text-muted text-[12px]">Proudly made in Essaouira 🌊</p>
        </div>
      </footer>
    </div>
  );
}
