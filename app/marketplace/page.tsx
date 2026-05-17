"use client";

import { useState, useEffect } from "react";
import { DarkCard } from "@/components/ui/DarkCard";
import { PillFilter } from "@/components/ui/PillFilter";
import { DarkInput } from "@/components/ui/DarkInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { GradientText } from "@/components/ui/GradientText";
import { Search, ShoppingCart, Bookmark, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";
import type { Product } from "@/lib/database.types";

interface LocalProduct extends Product {
  saved: boolean;
}

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("الكل");
  const categories = ["الكل", "خشب الثويا", "فضة", "نسيج", "توابل", "فخار"];
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { isSignedIn } = useUser();
  const { profile } = useProfile();
  const authClient = useSupabase();
  const user = isSignedIn ? profile : null;

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .order("created_at", { ascending: false });

      if (activeCategory !== "الكل") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;

      // Get user's bookmarked products (using bookmarks table with product_id pattern)
      let savedIds: string[] = [];
      if (user) {
        const { data: bookmarks } = await supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", user.id);
        savedIds = bookmarks?.map((b: { post_id: string }) => b.post_id) ?? [];
      }

      setProducts(
        (data as Product[] ?? []).map((p) => ({
          ...p,
          saved: savedIds.includes(p.id),
        }))
      );
      setLoading(false);
    }

    fetchProducts();
  }, [activeCategory, user]);

  const toggleSave = async (productId: string) => {
    setProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, saved: !p.saved } : p)
    );

    if (!user) return;
    const product = products.find(p => p.id === productId);
    if (product?.saved) {
      await authClient.from("bookmarks").delete().eq("post_id", productId).eq("user_id", user.id);
    } else {
      await authClient.from("bookmarks").insert({ post_id: productId, user_id: user.id });
    }
  };

  const filteredProducts = searchQuery
    ? products.filter(p => p.title.includes(searchQuery) || p.description?.includes(searchQuery))
    : products;

  return (
    <div className="w-full flex flex-col p-4 max-w-6xl mx-auto pb-32" dir="rtl">
      
      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
          <Search className="w-5 h-5" />
        </div>
        <DarkInput 
          placeholder="ابحث عن منتجات..." 
          className="w-full pl-4 pr-12"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-6 w-full border-b border-warm-border mb-6">
        {categories.map((cat) => (
          <PillFilter 
            key={cat} 
            label={cat} 
            isActive={activeCategory === cat} 
            onClick={() => setActiveCategory(cat)} 
          />
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-white rounded-[16px] border border-warm-border overflow-hidden">
              <div className="w-full aspect-[4/3] animate-shimmer" />
              <div className="p-4 space-y-2">
                <div className="w-3/4 h-4 animate-shimmer rounded-full" />
                <div className="w-1/2 h-3 animate-shimmer rounded-full" />
                <div className="w-1/3 h-5 animate-shimmer rounded-full mt-4" />
              </div>
            </div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <p className="text-text-muted text-[16px]">لا توجد منتجات</p>
          </div>
        ) : (
          filteredProducts.map((product, i) => (
            <Link key={product.id} href={`/marketplace/products/${product.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <DarkCard className="h-full flex flex-col">
                  <div className="relative w-full aspect-[4/3] bg-warm-sand">
                    {product.image_url && (
                      <Image src={product.image_url} alt={product.title} fill className="object-cover rounded-t-[16px]" />
                    )}
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(product.id); }}
                      className="absolute top-3 left-3 bg-white/80 backdrop-blur-md p-2 rounded-full border border-warm-border/50"
                    >
                      <Bookmark className={`w-4 h-4 ${product.saved ? "fill-terracotta text-terracotta" : "text-text-primary"}`} />
                    </button>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-text-primary font-bold text-[15px] mb-1 leading-tight line-clamp-2">{product.title}</h3>
                    <p className="text-text-muted text-[13px] mb-4">{product.description || ""}</p>
                    
                    <div className="mt-auto">
                      <GradientText className="text-[18px] font-bold block mb-4">{product.price_mad} درهم</GradientText>
                      <GradientButton className="w-full h-[40px] text-[14px]">عرض المنتج</GradientButton>
                    </div>
                  </div>
                </DarkCard>
              </motion.div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Cart */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 left-8 w-[56px] h-[56px] rounded-full bg-gradient-to-br from-ocean to-terracotta flex items-center justify-center shadow-[0_8px_20px_rgba(27,108,168,0.3)] z-50"
      >
        <ShoppingCart className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-saffron text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-warm-white">
          0
        </div>
      </motion.button>

      {/* Floating Sell Button (artisan only) */}
      {user?.role === "artisan" && (
        <Link href="/marketplace/sell" className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-gradient-to-br from-terracotta to-saffron text-white shadow-[0_8px_24px_rgba(193,68,14,0.4)] flex items-center justify-center z-40 hover:scale-110 transition-transform">
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
