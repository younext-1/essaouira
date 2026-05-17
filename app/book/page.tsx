"use client";

import { useState, useEffect } from "react";
import { DarkCard } from "@/components/ui/DarkCard";
import { DarkInput } from "@/components/ui/DarkInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { GradientAvatar } from "@/components/ui/GradientAvatar";
import { Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import type { Profile } from "@/lib/database.types";

interface GuideDisplay {
  id: string;
  name: string;
  specialty: string;
  rating: string;
  available: boolean;
  avatar: string;
}

export default function BookGuidePage() {
  const [selectedGuide, setSelectedGuide] = useState<GuideDisplay | null>(null);
  const [guides, setGuides] = useState<GuideDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { isSignedIn } = useUser();
  const { profile } = useProfile();
  const user = isSignedIn ? profile : null;

  useEffect(() => {
    async function fetchGuides() {
      const supabase = createClient();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, title, avatar_url, is_artisan")
        .eq("is_artisan", true)
        .not("avatar_url", "is", null);

      if (profiles) {
        // Get average rating from reviews for each profile
        const guideList: GuideDisplay[] = await Promise.all(
          (profiles as Profile[]).map(async (p) => {
            const { data: reviews } = await supabase
              .from("reviews")
              .select("stars")
              .eq("profile_id", p.id);

            const avg = reviews && reviews.length > 0
              ? (reviews.reduce((sum: number, r: { stars: number }) => sum + r.stars, 0) / reviews.length).toFixed(1)
              : "5.0";

            return {
              id: p.id,
              name: p.full_name || p.username || "",
              specialty: p.title || "Local Guide",
              rating: avg,
              available: true,
              avatar: p.avatar_url || "",
            };
          })
        );
        setGuides(guideList);
      }
      setLoading(false);
    }

    fetchGuides();
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGuide) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("guide_bookings").insert({
      tourist_id: user.id,
      guide_id: selectedGuide.id,
      date: bookingDate,
      time: bookingTime || null,
      notes: bookingNotes || null,
    });

    setSubmitting(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setSelectedGuide(null);
        setSuccess(false);
        setBookingDate("");
        setBookingTime("");
        setBookingNotes("");
      }, 2000);
    }
  };

  return (
    <div className="w-full flex flex-col p-4 max-w-4xl mx-auto pb-32" dir="ltr">
      
      <div className="flex flex-col gap-4">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-white rounded-[16px] border border-warm-border p-4 flex items-center gap-4">
              <div className="w-[60px] h-[60px] rounded-full animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 animate-shimmer rounded-full" />
                <div className="w-24 h-3 animate-shimmer rounded-full" />
              </div>
            </div>
          ))
        ) : guides.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-[16px]">No guides available at the moment</p>
          </div>
        ) : (
          guides.map((guide, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={guide.id}
            >
              <DarkCard className="p-4 flex items-center gap-4">
                <div className="relative">
                  <GradientAvatar src={guide.avatar} alt={guide.name} size={60} />
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${guide.available ? "bg-green-500" : "bg-red-400"}`} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-text-primary font-bold text-[16px] mb-1">{guide.name}</h3>
                  <p className="text-text-muted text-[13px] mb-1">{guide.specialty}</p>
                  <div className="flex items-center gap-1 text-saffron">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[13px] font-bold mt-0.5">{guide.rating}</span>
                  </div>
                </div>

                <GradientButton 
                  onClick={() => setSelectedGuide(guide)}
                  className="h-[36px] px-4 text-[13px] rounded-full shrink-0"
                >
                  Book
                </GradientButton>
              </DarkCard>
            </motion.div>
          ))
        )}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[24px] p-6 relative shadow-2xl border border-warm-border"
            >
              <button 
                onClick={() => setSelectedGuide(null)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {success ? (
                <div className="text-center py-8">
                  <div className="text-[48px] mb-4">✅</div>
                  <h2 className="text-text-primary font-bold text-xl mb-2">Booking Successful!</h2>
                  <p className="text-text-secondary">The guide will contact you shortly</p>
                </div>
              ) : (
                <>
                  <h2 className="text-text-primary font-bold text-xl mb-6 font-arabic text-center">Book a Tour</h2>
                  
                  <div className="flex items-center gap-4 mb-6 p-3 bg-warm-sand rounded-[16px] border border-warm-border">
                    <GradientAvatar src={selectedGuide.avatar} alt={selectedGuide.name} size={48} />
                    <div>
                      <h3 className="text-text-primary font-bold">{selectedGuide.name}</h3>
                      <p className="text-text-muted text-sm">{selectedGuide.specialty}</p>
                    </div>
                  </div>

                  <form onSubmit={handleBooking} className="flex flex-col gap-4">
                    <div>
                      <label className="text-text-secondary text-sm font-medium mb-2 block">Date</label>
                      <DarkInput type="date" className="w-full text-left" value={bookingDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBookingDate(e.target.value)} required />
                    </div>
                    
                    <div>
                      <label className="text-text-secondary text-sm font-medium mb-2 block">Time</label>
                      <DarkInput type="time" className="w-full text-left" value={bookingTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBookingTime(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-text-secondary text-sm font-medium mb-2 block">Additional Notes</label>
                      <textarea 
                        className="bg-warm-sand border border-warm-border rounded-[12px] text-text-primary px-[14px] py-[14px] placeholder:text-text-muted focus:outline-none focus:border-ocean/50 transition-colors w-full resize-none h-24"
                        placeholder="Any special requests?"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                      />
                    </div>

                    <GradientButton className="w-full h-[52px] text-[16px] mt-4" disabled={submitting || !user}>
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : !user ? "Sign In to Book" : "Confirm Booking"}
                    </GradientButton>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
