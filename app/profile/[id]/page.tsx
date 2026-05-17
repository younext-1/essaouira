"use client";

import { useRef, useState, useEffect, use } from "react";
import { motion, useScroll, useTransform, useInView, animate } from "framer-motion";
import Image from "next/image";
import { MapPin, MessageCircle, Phone, Store, CheckCircle2, Share2, ChevronDown, ChevronUp, Star } from "lucide-react";
import { DarkCard } from "@/components/ui/DarkCard";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileStat, Specialty, Service, PortfolioItem, Review } from "@/lib/database.types";

interface ProfileData {
  profile: Profile;
  stats: ProfileStat[];
  specialties: Specialty[];
  services: Service[];
  portfolio: PortfolioItem[];
  reviews: Review[];
}

function CountUpStat({ value, suffix, label }: { value: string, suffix: string, label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const num = parseFloat(value);

  useEffect(() => {
    if (isInView && !isNaN(num)) {
      const controls = animate(0, num, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (v) => setCount(v)
      });
      return controls.stop;
    }
  }, [isInView, num]);

  const displayCount = Number.isInteger(num) ? Math.floor(count) : count.toFixed(1);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center p-2 flex-1">
      <div className="text-[20px] md:text-[22px] font-bold text-terracotta" dir="ltr">
        {displayCount}{suffix}
      </div>
      <div className="text-text-muted text-[10px] md:text-[11px] whitespace-pre-wrap text-center leading-tight mt-1">
        {label}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="text-text-primary text-[18px] font-display font-bold mb-4 flex items-center"
    >
      {children}
    </motion.h2>
  );
}

const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// Loading skeleton for profile
function ProfileSkeleton() {
  return (
    <div className="w-full min-h-screen bg-warm-white pb-[100px]" dir="ltr">
      <div className="w-full h-[280px] md:h-[400px] animate-shimmer rounded-b-[40px]" />
      <div className="px-6 mt-16 mb-8 flex flex-col items-center">
        <div className="w-40 h-6 animate-shimmer rounded-full mb-3" />
        <div className="w-24 h-4 animate-shimmer rounded-full" />
      </div>
      <div className="mx-4 h-20 animate-shimmer rounded-[16px] mb-8" />
      <div className="px-4 space-y-4">
        <div className="w-full h-32 animate-shimmer rounded-[16px]" />
        <div className="w-full h-32 animate-shimmer rounded-[16px]" />
      </div>
    </div>
  );
}

export default function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.4]);
  const [showSticky, setShowSticky] = useState(false);
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setShowSticky(latest > 350);
    });
  }, [scrollY]);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      
      // Try by username first, then by id
      let profileQuery = supabase.from("profiles").select("*").eq("username", id).single();
      let { data: profile, error } = await profileQuery;
      
      if (error || !profile) {
        const res = await supabase.from("profiles").select("*").eq("id", id).single();
        profile = res.data;
        error = res.error;
      }

      if (!profile) {
        setLoading(false);
        return;
      }

      const [statsRes, specsRes, servicesRes, portfolioRes, reviewsRes] = await Promise.all([
        supabase.from("profile_stats").select("*").eq("profile_id", profile.id).order("sort_order"),
        supabase.from("specialties").select("*").eq("profile_id", profile.id).order("sort_order"),
        supabase.from("services").select("*").eq("profile_id", profile.id).order("sort_order"),
        supabase.from("portfolio_items").select("*").eq("profile_id", profile.id).order("sort_order"),
        supabase.from("reviews").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }),
      ]);

      setData({
        profile: profile as Profile,
        stats: (statsRes.data ?? []) as ProfileStat[],
        specialties: (specsRes.data ?? []) as Specialty[],
        services: (servicesRes.data ?? []) as Service[],
        portfolio: (portfolioRes.data ?? []) as PortfolioItem[],
        reviews: (reviewsRes.data ?? []) as Review[],
      });
      setLoading(false);
    }

    fetchProfile();
  }, [id]);

  if (loading) return <ProfileSkeleton />;
  if (!data) {
    return (
      <div className="w-full min-h-screen bg-warm-white flex items-center justify-center" dir="ltr">
        <div className="text-center">
          <h2 className="text-text-primary text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-text-muted">We couldn&apos;t find this profile</p>
        </div>
      </div>
    );
  }

  const { profile, stats, specialties, services, portfolio, reviews } = data;

  return (
    <div className="w-full min-h-screen bg-warm-white pb-[100px] overflow-x-hidden relative" dir="ltr">
      
      {/* SECTION 1: HERO COVER */}
      <div className="relative w-full h-[280px] md:h-[400px] bg-warm-white">
        <div className="absolute inset-0 rounded-b-[40px] md:rounded-b-[60px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <motion.div style={{ y: y1, opacity }} className="w-full h-full relative bg-warm-sand">
            {profile.cover_url ? (
              <Image src={profile.cover_url} alt="Cover" fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-ocean to-seafoam" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
          </motion.div>
        </div>

        <div className="absolute top-4 md:top-8 right-4 left-4 flex justify-end items-center z-10 pt-[env(safe-area-inset-top)]">
          <button className="h-[42px] px-5 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 text-white transition-all shadow-lg group">
            <Share2 className="w-[18px] h-[18px] mr-2 transition-transform group-hover:scale-110" />
            <span className="text-[14px] font-medium tracking-wide">Share</span>
          </button>
        </div>

        <div className="absolute -bottom-[50px] md:-bottom-[70px] left-1/2 -translate-x-1/2 md:translate-x-0 md:left-12 z-20">
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="relative">
            <div className="relative w-[100px] h-[100px] md:w-[140px] md:h-[140px] rounded-full p-1.5 md:p-2 bg-warm-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
              <div className="w-full h-full rounded-full overflow-hidden relative bg-warm-sand border border-warm-border">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.full_name || ""} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-ocean flex items-center justify-center text-white text-3xl font-bold">
                    {(profile.full_name || profile.username || "?")[0]}
                  </div>
                )}
              </div>
              {profile.verified && (
                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-gradient-to-tr from-ocean to-seafoam rounded-full p-1.5 shadow-md border-[2px] md:border-[3px] border-warm-white">
                  <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Info Name */}
      <div className="px-6 md:px-12 mt-16 md:mt-24 mb-8 relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-text-primary text-[28px] md:text-[36px] font-bold leading-tight font-display tracking-tight">
              {profile.full_name || profile.username}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-y-2 gap-x-3 mt-2">
              {profile.title && (
                <span className="bg-terracotta/10 text-terracotta px-3 py-1 rounded-full text-[14px] md:text-[15px] font-bold">
                  {profile.title}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5 text-text-secondary text-[14px] md:text-[15px] font-medium">
                  <MapPin className="w-4 h-4 text-ocean" /> {profile.location}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECTION 2: STATS */}
      {stats.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-4 md:mx-8 bg-white rounded-[16px] grid grid-cols-2 md:flex border border-warm-border shadow-[0_4px_20px_rgba(0,0,0,0.06)] mb-8 overflow-hidden">
          {stats.map((stat, i) => (
            <div key={stat.id} className={`flex-1 flex justify-center py-3 md:py-3 ${i % 2 === 0 ? 'border-r border-warm-border md:border-none' : ''} ${i < 2 ? 'border-b border-warm-border md:border-none' : ''} ${i !== stats.length - 1 ? 'md:border-r md:border-warm-border' : ''}`}>
              <CountUpStat value={stat.value} suffix={stat.suffix} label={stat.label} />
            </div>
          ))}
        </motion.div>
      )}

      <div className="max-w-[800px] mx-auto">
        {/* SECTION 3: ABOUT */}
        {profile.bio && (
          <section className="px-4 md:px-8 mb-10">
            <SectionTitle>My Story</SectionTitle>
            <motion.div layout className="relative">
              <p className={`text-text-secondary text-[15px] leading-[1.8] ${!expandedAbout ? 'line-clamp-3' : ''}`}>
                {profile.bio}
              </p>
              <button onClick={() => setExpandedAbout(!expandedAbout)} className="flex items-center gap-1 mt-2 text-ocean text-[13px] font-medium">
                {expandedAbout ? (<>Show Less <ChevronUp className="w-4 h-4" /></>) : (<>Read More <ChevronDown className="w-4 h-4" /></>)}
              </button>
            </motion.div>
          </section>
        )}

        {/* SECTION 4: SPECIALTIES */}
        {specialties.length > 0 && (
          <section className="mb-10 w-full overflow-hidden">
            <div className="px-4 md:px-8"><SectionTitle>My Specialties</SectionTitle></div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 md:px-8 pb-4 snap-x snap-mandatory">
              {specialties.map((spec, i) => (
                <motion.div key={spec.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-medium transition-all ${spec.is_active ? 'bg-terracotta text-white shadow-[0_4px_12px_rgba(193,68,14,0.3)]' : 'border border-warm-border bg-warm-sand text-text-secondary hover:border-terracotta/50'}`}>
                  <span className="text-[16px]">{spec.icon}</span> {spec.label}
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: PORTFOLIO */}
        {portfolio.length > 0 && (
          <section className="mb-10 w-full overflow-hidden">
            <div className="px-4 md:px-8"><SectionTitle>Featured Works</SectionTitle></div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 md:px-8 pb-6 snap-x snap-mandatory">
              {portfolio.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.1 }} whileTap={{ scale: 0.96 }} className="snap-start shrink-0 w-[220px] h-[280px] rounded-[20px] overflow-hidden relative group cursor-pointer border border-warm-border shadow-[0_2px_16px_rgba(26,26,46,0.07)]">
                  {item.image_url && <Image src={item.image_url} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {item.price_mad && (
                    <div className="absolute top-3 left-3 bg-saffron text-white text-[12px] font-bold px-3 py-1 rounded-full shadow-lg">
                      {item.price_mad} MAD
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 left-4">
                    <h3 className="text-white font-bold text-[16px] mb-1">{item.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: SERVICES */}
        {services.length > 0 && (
          <section className="mb-10 px-4 md:px-8">
            <SectionTitle>My Services</SectionTitle>
            <div className="flex flex-col gap-4">
              {services.map((service, i) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-[16px] p-4 border border-warm-border shadow-[0_2px_16px_rgba(26,26,46,0.07)] flex flex-col md:flex-row gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-[50px] h-[50px] rounded-full bg-terracotta flex items-center justify-center shrink-0 shadow-sm text-[24px]">{service.icon}</div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-text-primary font-bold text-[15px]">{service.title}</h3>
                      <p className="text-text-secondary text-[13px] mt-1 mb-2 leading-relaxed">{service.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-text-muted text-[12px]">
                        {service.duration && <span className="flex items-center gap-1">⏱️ {service.duration}</span>}
                        {service.price && <span className="flex items-center gap-1">💰 {service.price}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end shrink-0 mt-2 md:mt-0 pt-4 md:pt-0 border-t border-warm-border border-dashed md:border-none">
                    <button className="w-full md:w-auto border border-terracotta text-terracotta hover:bg-terracotta hover:text-white text-[13px] font-medium px-6 py-2 rounded-full transition-colors text-center">Order →</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 7: REVIEWS */}
        {reviews.length > 0 && (
          <section className="mb-12 w-full overflow-hidden">
            <div className="px-4 md:px-8"><SectionTitle>Client Reviews</SectionTitle></div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 md:px-8 pb-6 snap-x snap-mandatory">
              {reviews.map((review, i) => (
                <motion.div key={review.id} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="snap-start shrink-0 w-[260px] bg-white rounded-[16px] p-5 border border-warm-border shadow-[0_2px_16px_rgba(26,26,46,0.07)] flex flex-col">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= review.stars ? 'fill-saffron text-saffron' : 'text-warm-border'}`} />
                    ))}
                  </div>
                  <p className="text-text-primary italic text-[14px] leading-relaxed mb-4 flex-1">&quot;{review.text}&quot;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-warm-sand flex items-center justify-center text-[14px] text-text-primary">{(review.author_name || "?")[0]}</div>
                    <span className="text-text-primary text-[13px] font-medium flex items-center gap-1.5">{review.author_name} {review.flag && <span>{review.flag}</span>}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 8: LOCATION */}
        <section className="mb-12 px-4 md:px-8">
          <SectionTitle>Visit my Workshop</SectionTitle>
          <DarkCard className="overflow-hidden p-0 border border-warm-border">
            <div className="w-full h-[160px] relative bg-warm-sand flex items-center justify-center">
              <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop" alt="Map" fill className="object-cover opacity-60" />
              <div className="absolute inset-0 bg-white/20" />
              <div className="z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-ocean animate-bounce">
                <MapPin className="w-6 h-6 text-ocean" />
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-text-primary font-medium text-[15px] mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-ocean"/>{profile.location || "Essaouira"}</h3>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-[14px]">
                  <span className="text-text-secondary">Monday - Saturday</span>
                  <span className="text-text-primary font-medium flex items-center gap-2">9:00 - 18:00 <span className="text-seafoam">✅</span></span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-text-secondary">Sunday</span>
                  <span className="text-text-primary font-medium flex items-center gap-2">Closed <span className="text-terracotta">❌</span></span>
                </div>
              </div>
              <a href="#" className="w-full py-3 rounded-xl border border-ocean text-ocean font-medium flex items-center justify-center gap-2 hover:bg-ocean hover:text-white transition-colors">
                <MapPin className="w-4 h-4" /> Get Directions
              </a>
            </div>
          </DarkCard>
        </section>

        {/* SECTION 9: CONTACT */}
        <section className="mb-12 px-4 md:px-8 flex flex-col gap-3">
          {profile.whatsapp && (
            <a href={profile.whatsapp} target="_blank" rel="noreferrer" className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-terracotta to-saffron text-white font-bold text-[16px] flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(193,68,14,0.3)] hover:scale-[1.02] transition-transform active:scale-95">
              <MessageCircle className="w-5 h-5" /> Message me directly
            </a>
          )}
          <button className="w-full h-[52px] rounded-[14px] border border-ocean bg-white text-ocean font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-ocean hover:text-white transition-colors active:scale-95">
            <Phone className="w-5 h-5" /> Call me
          </button>
          <button className="w-full h-[52px] rounded-[14px] border border-ocean bg-white text-ocean font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-ocean hover:text-white transition-colors active:scale-95">
            <Store className="w-5 h-5" /> Visit my Shop
          </button>
        </section>

        {/* SECTION 10: SOCIAL */}
        <section className="mb-12 px-4 md:px-8 flex justify-center gap-4">
          {profile.instagram && (
            <a href={profile.instagram} className="w-[44px] h-[44px] rounded-full bg-warm-sand border border-warm-border flex items-center justify-center text-text-muted hover:text-terracotta hover:border-terracotta/30 transition-all">
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {profile.whatsapp && (
            <a href={profile.whatsapp} className="w-[44px] h-[44px] rounded-full bg-warm-sand border border-warm-border flex items-center justify-center text-text-muted hover:text-terracotta hover:border-terracotta/30 transition-all">
              <MessageCircle className="w-5 h-5" />
            </a>
          )}
          {profile.facebook && (
            <a href={profile.facebook} className="w-[44px] h-[44px] rounded-full bg-warm-sand border border-warm-border flex items-center justify-center text-text-muted hover:text-terracotta hover:border-terracotta/30 transition-all">
              <Facebook className="w-5 h-5" />
            </a>
          )}
        </section>

        {/* Custom HTML Section */}
        {profile.custom_html_enabled && profile.custom_html && (
          <section className="mb-12 px-4 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-text-primary text-[18px] font-display font-bold mb-2 flex items-center">My Custom Page</h2>
              <p className="text-text-muted text-[12px] mb-4">✨ Crafted by {profile.full_name}</p>
              <div className="rounded-2xl overflow-hidden border border-warm-border">
                <iframe
                  srcDoc={profile.custom_html}
                  className="w-full min-h-[400px]"
                  sandbox="allow-scripts allow-popups"
                  onLoad={(e) => {
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      if (iframe.contentWindow) {
                        iframe.style.height = iframe.contentWindow.document.body.scrollHeight + "px";
                      }
                    } catch {}
                  }}
                  title={`${profile.full_name} custom profile`}
                />
              </div>
            </motion.div>
          </section>
        )}

        <div className="h-10"></div>
      </div>

      {/* STICKY CTA */}
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: showSticky ? 0 : 100, opacity: showSticky ? 1 : 0 }} transition={{ type: "spring", bounce: 0.3 }} className="fixed bottom-[80px] md:bottom-6 right-4 left-4 md:left-auto md:w-[300px] z-50 pointer-events-none flex justify-center md:justify-end">
        <a href={profile.whatsapp || "#"} target="_blank" rel="noreferrer" className="pointer-events-auto shadow-2xl shadow-terracotta/30 bg-gradient-to-r from-terracotta to-saffron text-white px-6 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform w-full md:w-auto">
          <MessageCircle className="w-5 h-5" /> Message me now
        </a>
      </motion.div>
    </div>
  );
}
