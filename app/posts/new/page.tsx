"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import { useSupabase } from "@/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, X, ImagePlus, MapPin, Tag } from "lucide-react";
import Image from "next/image";

const CATEGORIES = [
  { value: "artisan", label: "🎨 حرف", color: "bg-terracotta" },
  { value: "music", label: "🎵 موسيقى", color: "bg-ocean" },
  { value: "surf", label: "🏄 تزلج", color: "bg-blue-500" },
  { value: "food", label: "🍜 طعام", color: "bg-saffron" },
  { value: "culture", label: "🏛️ ثقافة", color: "bg-purple-500" },
  { value: "other", label: "💫 أخرى", color: "bg-gray-500" },
];

export default function NewPostPage() {
  const { isSignedIn } = useUser();
  const { profile } = useProfile();
  const supabase = useSupabase();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("artisan");
  const [location, setLocation] = useState(profile?.location || "");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Only artisans can post
  if (!isSignedIn || !profile || profile.role !== "artisan") {
    return (
      <div className="flex-1 flex items-center justify-center p-8" dir="rtl">
        <div className="text-center">
          <div className="text-[48px] mb-4">🔒</div>
          <h2 className="text-text-primary text-[20px] font-bold mb-2 font-arabic">
            هذه الميزة متاحة للحرفيين فقط
          </h2>
          <p className="text-text-secondary text-[15px]">
            سجل كحرفي لمشاركة أعمالك مع المجتمع
          </p>
        </div>
      </div>
    );
  }

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const addImages = (files: FileList) => {
    const newImages = Array.from(files)
      .slice(0, 5 - images.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);

    try {
      // 1. Create post
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          author_id: profile.id,
          title: title.trim(),
          content: content.trim(),
          category,
          location: location.trim() || null,
        })
        .select()
        .single();

      if (postError || !post) throw postError;

      // 2. Upload images to Supabase Storage
      for (let i = 0; i < images.length; i++) {
        const path = `${profile.id}/${post.id}/${i}`;
        await supabase.storage.from("posts").upload(path, images[i].file);
        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
        await supabase.from("post_images").insert({
          post_id: post.id,
          url: urlData.publicUrl,
          sort_order: i,
        });
      }

      // 3. Insert tags
      if (tags.length > 0) {
        await supabase
          .from("post_tags")
          .insert(tags.map((tag) => ({ post_id: post.id, tag })));
      }

      router.push("/explore");
      router.refresh();
    } catch (err) {
      console.error("Post creation error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[700px] mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-text-primary text-[24px] font-bold mb-6 font-arabic">
        ✍️ منشور جديد
      </h1>

      <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-warm-border flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">العنوان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
            placeholder="عنوان المنشور"
            maxLength={100}
          />
        </div>

        {/* Content */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">المحتوى</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px] resize-none h-32"
            placeholder="اكتب محتوى المنشور..."
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">التصنيف</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                  category === cat.value
                    ? `${cat.color} text-white shadow-md`
                    : "bg-warm-sand border border-warm-border text-text-secondary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">
            الصور ({images.length}/5)
          </label>
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                <Image src={img.preview} alt="" fill className="object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-warm-border flex flex-col items-center justify-center text-text-muted hover:border-ocean/50 hover:text-ocean transition-colors"
              >
                <ImagePlus className="w-6 h-6 mb-1" />
                <span className="text-[11px]">إضافة</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => e.target.files && addImages(e.target.files)}
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">
            <MapPin className="w-4 h-4 inline ml-1" /> الموقع
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]"
            placeholder="المدينة القديمة، الصويرة"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">
            <Tag className="w-4 h-4 inline ml-1" /> الوسوم
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-ocean/10 text-ocean rounded-full text-[13px] flex items-center gap-1"
              >
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="flex-1 bg-warm-sand border border-warm-border rounded-xl px-4 py-2 text-text-primary text-[14px] focus:outline-none focus:border-ocean/50"
              placeholder="اكتب وسم ثم Enter"
            />
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !content.trim()}
          className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-terracotta to-saffron text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(193,68,14,0.3)] hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              نشر المنشور
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
