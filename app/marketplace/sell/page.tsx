"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import { useSupabase } from "@/hooks/useSupabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, X, ImagePlus, Save } from "lucide-react";
import Image from "next/image";

const CATEGORIES = ["Thuya Wood", "Silver", "Weaving", "Spices", "Pottery", "Other"];

export default function SellProductPage() {
  const { isSignedIn } = useUser();
  const { profile } = useProfile();
  const supabase = useSupabase();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Thuya Wood");
  const [priceMad, setPriceMad] = useState("");
  const [inStock, setInStock] = useState(true);
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSignedIn || !profile || profile.role !== "artisan") {
    return (
      <div className="flex-1 flex items-center justify-center p-8" dir="ltr">
        <div className="text-center">
          <div className="text-[48px] mb-4">🔒</div>
          <h2 className="text-text-primary text-[20px] font-bold mb-2">Available for Artisans Only</h2>
          <p className="text-text-secondary text-[15px]">Register as an artisan to sell your products</p>
        </div>
      </div>
    );
  }

  const handleImageSelect = (files: FileList) => {
    const file = files[0];
    if (file) setImage({ file, preview: URL.createObjectURL(file) });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !priceMad) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (image) {
        const path = `${profile.id}/${Date.now()}`;
        await supabase.storage.from("products").upload(path, image.file);
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      await supabase.from("products").insert({
        seller_id: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        price_mad: parseFloat(priceMad),
        category,
        image_url: imageUrl,
        in_stock: inStock,
      });

      router.push("/marketplace");
      router.refresh();
    } catch (err) {
      console.error("Product creation error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[700px] mx-auto px-4 py-8" dir="ltr">
      <h1 className="text-text-primary text-[24px] font-bold mb-6 font-arabic">🛍️ Sell a New Product</h1>

      <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-warm-border flex flex-col gap-5">

        {/* Image */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">Product Image</label>
          {image ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden group">
              <Image src={image.preview} alt="" fill className="object-cover" />
              <button onClick={() => { URL.revokeObjectURL(image.preview); setImage(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full h-48 rounded-xl border-2 border-dashed border-warm-border flex flex-col items-center justify-center text-text-muted hover:border-ocean/50 hover:text-ocean transition-colors">
              <ImagePlus className="w-8 h-8 mb-2" /><span className="text-[13px]">Click to add image</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files && handleImageSelect(e.target.files)} />
        </div>

        {/* Title */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">Product Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]" placeholder="Carved Thuya Box" maxLength={100} />
        </div>

        {/* Description */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px] resize-none h-24" placeholder="Product description..." maxLength={300} />
        </div>

        {/* Category */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all ${category === cat ? "bg-terracotta text-white shadow-md" : "bg-warm-sand border border-warm-border text-text-secondary"}`}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="text-text-secondary text-[14px] font-medium mb-2 block">Price (MAD)</label>
          <input type="number" value={priceMad} onChange={(e) => setPriceMad(e.target.value)} className="w-full bg-warm-sand border border-warm-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 text-[15px]" placeholder="350" dir="ltr" />
          {priceMad && <p className="text-text-muted text-[12px] mt-1 text-left" dir="ltr">≈ ${(parseFloat(priceMad) * 0.1).toFixed(0)} USD</p>}
        </div>

        {/* In stock */}
        <div className="flex items-center justify-between bg-warm-sand rounded-xl px-4 py-3 border border-warm-border">
          <span className="text-text-primary text-[14px] font-medium">In Stock</span>
          <button onClick={() => setInStock(!inStock)} className={`w-12 h-7 rounded-full transition-colors relative ${inStock ? "bg-green-500" : "bg-gray-300"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${inStock ? "left-6" : "left-1"}`} />
          </button>
        </div>

        {/* Submit */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting || !title.trim() || !priceMad} className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-terracotta to-saffron text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(193,68,14,0.3)] hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
          {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Publish Product</span>}
        </motion.button>
      </div>
    </div>
  );
}
