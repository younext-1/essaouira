"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import { useSupabase } from "@/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, User, FileText, Briefcase } from "lucide-react";

type Tab = "basic" | "markdown" | "services";

export default function EditProfilePage() {
  const { user: clerkUser } = useUser();
  const { profile, refreshProfile } = useProfile();
  const supabase = useSupabase();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Basic info form
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  // Markdown
  const [profileMd, setProfileMd] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setTitle(profile.title || "");
      setLocation(profile.location || "");
      setBio(profile.bio || "");
      setWhatsapp(profile.whatsapp || "");
      setInstagram(profile.instagram || "");
      setFacebook(profile.facebook || "");
      setTiktok(profile.tiktok || "");
      setProfileMd(profile.profile_md || "");
    }
  }, [profile]);

  if (!clerkUser || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ocean/30 border-t-ocean rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: "basic" as Tab, label: "المعلومات الأساسية", icon: User },
    { key: "markdown" as Tab, label: "ملف MD", icon: FileText },
    { key: "services" as Tab, label: "الخدمات والأعمال", icon: Briefcase },
  ];

  const showSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const saveBasicInfo = async () => {
    setSaving(true);
    try {
      // 1. Update Clerk metadata
      await clerkUser.update({
        firstName: fullName.split(" ")[0],
        lastName: fullName.split(" ").slice(1).join(" "),
      });

      // 2. Update Supabase profile
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
          title: title || null,
          location: location || null,
          bio: bio || null,
          whatsapp: whatsapp || null,
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_id", clerkUser.id);

      await refreshProfile();
      showSuccess();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const saveMarkdown = async () => {
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          profile_md: profileMd,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_id", clerkUser.id);

      showSuccess();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[800px] mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-[24px] font-bold font-arabic">
          ✏️ تعديل الملف الشخصي
        </h1>
        {success && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-green-600 text-[14px] font-medium bg-green-50 px-4 py-2 rounded-full"
          >
            ✓ تم الحفظ
          </motion.span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-ocean text-white shadow-md"
                  : "bg-warm-sand border border-warm-border text-text-secondary hover:bg-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-warm-border">
        {/* TAB 1: Basic Info */}
        {activeTab === "basic" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">الاسم الكامل</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">اسم المستخدم</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">التخصص</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="حرفي خشب الثويا"
                />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">الموقع</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="المدينة القديمة، الصويرة"
                />
              </div>
            </div>

            <div>
              <label className="text-text-secondary text-[14px] font-medium mb-2 block">
                نبذة <span className="text-text-muted">({bio.length}/200)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px] resize-none h-24"
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">واتساب</label>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} dir="ltr"
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="+212 6XX XXX XXX" />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">انستغرام</label>
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} dir="ltr"
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="@username" />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">فيسبوك</label>
                <input value={facebook} onChange={(e) => setFacebook(e.target.value)} dir="ltr"
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="facebook.com/page" />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">تيك توك</label>
                <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} dir="ltr"
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="@username" />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={saveBasicInfo}
              disabled={saving}
              className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-terracotta to-saffron text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(193,68,14,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-60 mt-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  حفظ المعلومات
                </span>
              )}
            </motion.button>
          </div>
        )}

        {/* TAB 2: Markdown */}
        {activeTab === "markdown" && (
          <div className="flex flex-col gap-4">
            <p className="text-text-secondary text-[14px]">
              اكتب وصفاً مفصلاً لملفك الشخصي بصيغة Markdown
            </p>
            <textarea
              value={profileMd}
              onChange={(e) => setProfileMd(e.target.value)}
              className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary font-mono text-[14px] focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 resize-none min-h-[400px]"
              placeholder="# عنوان&#10;&#10;اكتب هنا..."
              dir="auto"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={saveMarkdown}
              disabled={saving}
              className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-ocean to-blue-500 text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(27,108,168,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  حفظ الملف
                </span>
              )}
            </motion.button>
          </div>
        )}

        {/* TAB 3: Services & Portfolio */}
        {activeTab === "services" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-text-primary text-[18px] font-bold mb-2 font-arabic">
              إدارة الخدمات والأعمال
            </h3>
            <p className="text-text-secondary text-[14px] max-w-sm">
              قريباً: إضافة وتعديل الخدمات وعرض الأعمال مباشرة من هنا
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
