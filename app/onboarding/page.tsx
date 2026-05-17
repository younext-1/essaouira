"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabase } from "@/hooks/useSupabase";
import { useProfile } from "@/lib/auth/profile-provider";

const CRAFT_CATEGORIES = [
  { value: "خشب", icon: "🪵", label: "خشب الثويا" },
  { value: "فضة", icon: "💍", label: "فضة" },
  { value: "نسيج", icon: "🧶", label: "نسيج" },
  { value: "موسيقى", icon: "🎵", label: "موسيقى" },
  { value: "تزلج", icon: "🏄", label: "تزلج شراعي" },
  { value: "طعام", icon: "🍜", label: "طعام" },
];

const INTERESTS = [
  "🎨 فنون", "🏄 تزلج", "🍜 طعام", "🎵 موسيقى",
  "🏛️ تاريخ", "📸 تصوير", "🛍️ تسوق", "🧘 استرخاء",
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = useSupabase();
  const { refreshProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"tourist" | "artisan">("tourist");
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    username: user?.username || "",
    craft: "",
    location: "الصويرة، المغرب",
    bio: "",
    whatsapp: "",
    instagram: "",
    country: "",
    interests: [] as string[],
    language: "AR",
  });
  const [saving, setSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Real-time username availability check
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const { data } = await supabase.rpc("is_username_available", { p_username: username });
      setUsernameStatus(data ? "available" : "taken");
    } catch {
      // Fallback: direct query
      const { data } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }
  }, [supabase]);

  useEffect(() => {
    const timeout = setTimeout(() => checkUsername(formData.username), 500);
    return () => clearTimeout(timeout);
  }, [formData.username, checkUsername]);

  const updateField = (key: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (usernameStatus === "taken") return;
    setSaving(true);

    try {
      // 1. Update Clerk metadata
      await user.update({
        unsafeMetadata: {
          role,
          onboarded: true,
          ...(role === "artisan" ? { craft: formData.craft } : { country: formData.country }),
        },
      });

      // 2. Update Supabase profile (webhook created it, we update with onboarding data)
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName || null,
          username: formData.username || user.id.slice(0, 12),
          role,
          is_artisan: role === "artisan",
          is_tourist: role === "tourist",
          craft_category: role === "artisan" ? formData.craft : null,
          location: formData.location || "الصويرة، المغرب",
          bio: formData.bio || null,
          whatsapp: formData.whatsapp || null,
          instagram: formData.instagram || null,
          onboarding_done: true,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_id", user.id);

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      await refreshProfile();
      router.push("/explore");
      router.refresh();
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = role === "artisan" ? 3 : 3;

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? "bg-terracotta" : "bg-warm-border"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-warm-border">
          <AnimatePresence mode="wait">
            {/* STEP 1: Role Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-text-primary text-[22px] font-bold mb-2 font-arabic text-center">
                  أهلاً وسهلاً! 👋
                </h2>
                <p className="text-text-secondary text-center text-[15px] mb-8">
                  أخبرنا عن نفسك
                </p>

                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setRole("tourist")}
                    className={`flex-1 p-6 rounded-[20px] border-2 text-center transition-all ${
                      role === "tourist"
                        ? "border-ocean bg-ocean/5 shadow-[0_4px_20px_rgba(27,108,168,0.2)]"
                        : "border-warm-border hover:border-ocean/30"
                    }`}
                  >
                    <div className="text-[40px] mb-3">🌍</div>
                    <div className="font-bold text-text-primary text-[16px]">أنا سائح</div>
                    <div className="text-text-muted text-[13px] mt-1">أستكشف الصويرة</div>
                  </button>
                  <button
                    onClick={() => setRole("artisan")}
                    className={`flex-1 p-6 rounded-[20px] border-2 text-center transition-all ${
                      role === "artisan"
                        ? "border-terracotta bg-terracotta/5 shadow-[0_4px_20px_rgba(193,68,14,0.2)]"
                        : "border-warm-border hover:border-terracotta/30"
                    }`}
                  >
                    <div className="text-[40px] mb-3">🎨</div>
                    <div className="font-bold text-text-primary text-[16px]">أنا حرفي</div>
                    <div className="text-text-muted text-[13px] mt-1">أعرض أعمالي</div>
                  </button>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-terracotta to-saffron text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(193,68,14,0.3)] hover:scale-[1.02] transition-transform active:scale-95"
                >
                  التالي ←
                </button>
              </motion.div>
            )}

            {/* STEP 2: Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <h2 className="text-text-primary text-[20px] font-bold mb-2 font-arabic">
                  {role === "artisan" ? "🎨 معلومات الحرفي" : "🌍 معلومات السائح"}
                </h2>

                <div>
                  <label className="text-text-secondary text-[14px] font-medium mb-2 block">الاسم الكامل</label>
                  <input
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                    placeholder="الاسم الكامل"
                  />
                </div>

                <div>
                  <label className="text-text-secondary text-[14px] font-medium mb-2 block">اسم المستخدم</label>
                  <input
                    value={formData.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                    placeholder="amine-craft"
                    dir="ltr"
                  />
                  {usernameStatus === "checking" && <p className="text-text-muted text-[12px] mt-1">⏳ جاري التحقق...</p>}
                  {usernameStatus === "available" && <p className="text-green-600 text-[12px] mt-1">✓ اسم المستخدم متاح</p>}
                  {usernameStatus === "taken" && <p className="text-red-500 text-[12px] mt-1">✗ اسم المستخدم مستخدم بالفعل</p>}
                </div>

                {role === "artisan" && (
                  <>
                    <div>
                      <label className="text-text-secondary text-[14px] font-medium mb-2 block">تخصصك</label>
                      <div className="flex flex-wrap gap-2">
                        {CRAFT_CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => updateField("craft", cat.value)}
                            className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                              formData.craft === cat.value
                                ? "bg-terracotta text-white shadow-md"
                                : "bg-warm-sand border border-warm-border text-text-secondary"
                            }`}
                          >
                            {cat.icon} {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-text-secondary text-[14px] font-medium mb-2 block">الموقع</label>
                      <input
                        value={formData.location}
                        onChange={(e) => updateField("location", e.target.value)}
                        className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                        placeholder="المدينة القديمة، الصويرة"
                      />
                    </div>
                  </>
                )}

                {role === "tourist" && (
                  <>
                    <div>
                      <label className="text-text-secondary text-[14px] font-medium mb-2 block">بلدك</label>
                      <input
                        value={formData.country}
                        onChange={(e) => updateField("country", e.target.value)}
                        className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                        placeholder="🇫🇷 فرنسا"
                      />
                    </div>
                    <div>
                      <label className="text-text-secondary text-[14px] font-medium mb-2 block">اهتماماتك</label>
                      <div className="flex flex-wrap gap-2">
                        {INTERESTS.map((interest) => (
                          <button
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                              formData.interests.includes(interest)
                                ? "bg-ocean text-white shadow-md"
                                : "bg-warm-sand border border-warm-border text-text-secondary"
                            }`}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(1)} className="flex-1 h-[48px] rounded-[14px] border border-warm-border text-text-secondary font-medium hover:bg-warm-sand transition-colors">
                    → رجوع
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 h-[48px] rounded-[14px] bg-gradient-to-r from-terracotta to-saffron text-white font-bold shadow-[0_8px_20px_rgba(193,68,14,0.3)] hover:scale-[1.02] transition-transform"
                  >
                    التالي ←
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Bio + Social + Submit */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <h2 className="text-text-primary text-[20px] font-bold mb-2 font-arabic">
                  ✨ اللمسات الأخيرة
                </h2>

                <div>
                  <label className="text-text-secondary text-[14px] font-medium mb-2 block">
                    نبذة قصيرة <span className="text-text-muted">({formData.bio.length}/200)</span>
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => updateField("bio", e.target.value.slice(0, 200))}
                    className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px] resize-none h-24"
                    placeholder="حكي لنا عن نفسك..."
                    maxLength={200}
                  />
                </div>

                {role === "artisan" && (
                  <>
                    <div>
                      <label className="text-text-secondary text-[14px] font-medium mb-2 block">واتساب (اختياري)</label>
                      <input
                        value={formData.whatsapp}
                        onChange={(e) => updateField("whatsapp", e.target.value)}
                        className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                        placeholder="+212 6XX XXX XXX"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-text-secondary text-[14px] font-medium mb-2 block">انستغرام (اختياري)</label>
                      <input
                        value={formData.instagram}
                        onChange={(e) => updateField("instagram", e.target.value)}
                        className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                        placeholder="@username"
                        dir="ltr"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(2)} className="flex-1 h-[48px] rounded-[14px] border border-warm-border text-text-secondary font-medium hover:bg-warm-sand transition-colors">
                    → رجوع
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 h-[52px] rounded-[14px] bg-gradient-to-r from-terracotta to-saffron text-white font-bold shadow-[0_8px_20px_rgba(193,68,14,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-60"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      "🚀 ابدأ الاستكشاف"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
