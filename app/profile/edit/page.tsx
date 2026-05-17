"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import { useSupabase } from "@/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, User, FileText, Briefcase, Code, Upload, Eye } from "lucide-react";

type Tab = "basic" | "markdown" | "services" | "customhtml";

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

  // Custom HTML
  const [customHtml, setCustomHtml] = useState("");
  const [customHtmlEnabled, setCustomHtmlEnabled] = useState(false);
  const [customHtmlFilename, setCustomHtmlFilename] = useState("");
  const htmlInputRef = useRef<HTMLInputElement>(null);

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
      setCustomHtml(profile.custom_html || "");
      setCustomHtmlEnabled(profile.custom_html_enabled || false);
      setCustomHtmlFilename(profile.custom_html_filename || "");
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
    { key: "basic" as Tab, label: "Basic Info", icon: User },
    { key: "markdown" as Tab, label: "MD Profile", icon: FileText },
    { key: "services" as Tab, label: "Services & Works", icon: Briefcase },
    { key: "customhtml" as Tab, label: "🎨 Page Customization", icon: Code },
  ];

  const handleHtmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setCustomHtml(content);
    setCustomHtmlFilename(file.name);
    setCustomHtmlEnabled(true);
  };

  const saveCustomHtml = async () => {
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          custom_html: customHtml,
          custom_html_enabled: customHtmlEnabled,
          custom_html_filename: customHtmlFilename || null,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_id", clerkUser!.id);
      showSuccess();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

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
    <div className="flex-1 w-full max-w-[800px] mx-auto px-4 py-8" dir="ltr">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-[24px] font-bold">
          ✏️ Edit Profile
        </h1>
        {success && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-green-600 text-[14px] font-medium bg-green-50 px-4 py-2 rounded-full"
          >
            ✓ Saved
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
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">Username</label>
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
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="Thuya Wood Artisan"
                />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="Medina, Essaouira"
                />
              </div>
            </div>

            <div>
              <label className="text-text-secondary text-[14px] font-medium mb-2 block">
                Bio <span className="text-text-muted">({bio.length}/200)</span>
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
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">WhatsApp</label>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} dir="ltr"
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="+212 6XX XXX XXX" />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">Instagram</label>
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} dir="ltr"
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="@username" />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">Facebook</label>
                <input value={facebook} onChange={(e) => setFacebook(e.target.value)} dir="ltr"
                  className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
                  placeholder="facebook.com/page" />
              </div>
              <div>
                <label className="text-text-secondary text-[14px] font-medium mb-2 block">TikTok</label>
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
                  Save Info
                </span>
              )}
            </motion.button>
          </div>
        )}

        {/* TAB 2: Markdown */}
        {activeTab === "markdown" && (
          <div className="flex flex-col gap-4">
            <p className="text-text-secondary text-[14px]">
              Write a detailed description for your profile in Markdown format
            </p>
            <textarea
              value={profileMd}
              onChange={(e) => setProfileMd(e.target.value)}
              className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary font-mono text-[14px] focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 resize-none min-h-[400px]"
              placeholder="# Title&#10;&#10;Write here..."
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
                  Save Profile
                </span>
              )}
            </motion.button>
          </div>
        )}

        {/* TAB 3: Services & Portfolio */}
        {activeTab === "services" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-text-primary text-[18px] font-bold mb-2">Manage Services & Works</h3>
            <p className="text-text-secondary text-[14px] max-w-sm">Coming soon: Add and edit services and showcase works directly from here</p>
          </div>
        )}

        {/* TAB 4: Custom HTML */}
        {activeTab === "customhtml" && (
          <div className="flex flex-col gap-5">
            <p className="text-text-secondary text-[14px]">Upload an HTML file to customize the bottom section of your profile page</p>

            {/* Toggle */}
            <div className="flex items-center justify-between bg-warm-sand rounded-xl px-4 py-3 border border-warm-border">
              <span className="text-text-primary text-[14px] font-medium">Enable Customization</span>
              <button onClick={() => setCustomHtmlEnabled(!customHtmlEnabled)} className={`w-12 h-7 rounded-full transition-colors relative ${customHtmlEnabled ? "bg-ocean" : "bg-gray-300"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${customHtmlEnabled ? "left-6" : "left-1"}`} />
              </button>
            </div>

            {/* Upload */}
            <div onClick={() => htmlInputRef.current?.click()} className="border-2 border-dashed border-warm-border rounded-xl p-8 text-center cursor-pointer hover:border-ocean/50 transition-colors">
              <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-primary text-[14px] font-medium mb-1">Click to upload HTML file</p>
              <p className="text-text-muted text-[12px]">Supports: .html, .htm</p>
              {customHtmlFilename && <p className="text-ocean text-[13px] mt-2">📄 {customHtmlFilename}</p>}
            </div>
            <input ref={htmlInputRef} type="file" accept=".html,.htm" hidden onChange={handleHtmlUpload} />

            {/* Preview */}
            {customHtml && (
              <div>
                <h4 className="text-text-primary text-[14px] font-medium mb-2 flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</h4>
                <div className="rounded-xl overflow-hidden border border-warm-border">
                  <iframe srcDoc={customHtml} className="w-full min-h-[400px]" sandbox="allow-scripts" title="Custom HTML Preview" />
                </div>
              </div>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={saveCustomHtml} disabled={saving}
              className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-60">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Save Customization</span>}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
