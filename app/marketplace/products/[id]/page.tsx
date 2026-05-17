"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Bookmark, ArrowLeft, ShoppingBag, Image as ImageIcon } from "lucide-react";
import { GradientAvatar } from "@/components/ui/GradientAvatar";
import { createClient } from "@/lib/supabase/client";
import type { Product, Profile } from "@/lib/database.types";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: p } = await supabase.from("products").select("*").eq("id", id).single();
      if (!p) { setLoading(false); return; }
      setProduct(p as Product);

      const { data: s } = await supabase.from("profiles").select("*").eq("id", p.seller_id).single();
      setSeller(s as Profile);

      const { data: r } = await supabase.from("products").select("*").eq("seller_id", p.seller_id).neq("id", id).limit(4);
      setRelated((r as Product[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-ocean/30 border-t-ocean rounded-full animate-spin" /></div>;
  if (!product) return <div className="flex-1 flex items-center justify-center text-center p-8" dir="ltr"><div><div className="text-[48px] mb-4">😕</div><h2 className="text-text-primary text-[20px] font-bold mb-2">Product not found</h2><Link href="/marketplace" className="text-ocean hover:underline">Back to Marketplace</Link></div></div>;

  const usdPrice = (product.price_mad * 0.1).toFixed(0);
  const whatsappUrl = seller?.whatsapp ? `https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello! I would like to inquire about: ${product.title}`)}` : "#";

  return (
    <div className="flex-1 w-full max-w-[800px] mx-auto pb-24" dir="ltr">
      {/* Image */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-warm-sand">
        {product.image_url ? <Image src={product.image_url} alt={product.title} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-16 h-16 text-text-muted" /></div>}
        <Link href="/marketplace" className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center z-10"><ArrowLeft className="w-5 h-5" /></Link>
      </div>

      <div className="px-4 md:px-6">
        {/* Price */}
        <div className="flex items-baseline gap-3 mt-6 mb-2">
          <span className="text-terracotta text-[28px] font-bold">{product.price_mad} MAD</span>
          <span className="text-text-muted text-[15px]">≈ ${usdPrice}</span>
        </div>

        {/* Title */}
        <h1 className="text-text-primary text-[22px] md:text-[26px] font-bold font-display mb-4">{product.title}</h1>

        {/* Category */}
        {product.category && <span className="inline-block bg-terracotta/10 text-terracotta text-[12px] font-medium px-3 py-1 rounded-full mb-4">{product.category}</span>}

        {/* Description */}
        <p className="text-text-secondary text-[15px] leading-[1.8] mb-8 whitespace-pre-wrap">{product.description}</p>

        {/* Seller */}
        {seller && (
          <Link href={`/profile/${seller.username || seller.id}`}>
            <div className="bg-white rounded-[20px] border border-warm-border p-5 flex items-center gap-4 hover:shadow-md transition-shadow group cursor-pointer mb-6">
              <GradientAvatar src={seller.avatar_url || ""} alt={seller.full_name || ""} size={56} className="group-hover:scale-105 transition-transform" />
              <div className="flex-1 min-w-0">
                <h3 className="text-text-primary font-bold text-[16px]">{seller.full_name}</h3>
                <p className="text-text-muted text-[13px]">{seller.location}</p>
              </div>
              <span className="text-ocean text-[13px] font-medium shrink-0">View Profile →</span>
            </div>
          </Link>
        )}

        {/* CTA */}
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="block w-full">
          <motion.button whileTap={{ scale: 0.97 }} className="w-full h-[52px] rounded-[14px] bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" /> Contact Seller
          </motion.button>
        </a>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-text-primary text-[18px] font-bold mb-4">Other products from this seller</h2>
            <div className="grid grid-cols-2 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/marketplace/products/${r.id}`}>
                  <div className="bg-white rounded-[16px] border border-warm-border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative w-full aspect-square bg-warm-sand">
                      {r.image_url && <Image src={r.image_url} alt={r.title} fill className="object-cover" />}
                    </div>
                    <div className="p-3">
                      <h4 className="text-text-primary font-bold text-[13px] truncate">{r.title}</h4>
                      <span className="text-terracotta font-bold text-[14px]">{r.price_mad} MAD</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
