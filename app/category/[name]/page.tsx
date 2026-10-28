'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import ProductCard from '@/components/ProductCard';
import { ArrowLeft, Loader2, Sparkles, SlidersHorizontal, MapPin, ShieldCheck, Tag } from 'lucide-react';
import Link from 'next/link';

interface CategoryPageProps {
  params: Promise<{ name: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  // Decode URL safe category string (e.g., 'leather-goods' -> 'Leather Goods', 'Cosmetics%20&%20Oils' -> 'Cosmetics & Oils')
  const rawName = resolvedParams.name;
  const decodedName = decodeURIComponent(rawName)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Sorting state
  const [sortBy, setSortBy] = useState('newest');
  const [priceMax, setPriceMax] = useState<number>(3000);

  // Products in this category from mock dataset
  const { data: products = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['category-products', decodedName],
    queryFn: async () => {
      const search = decodedName.toLowerCase();
      return MOCK_PRODUCTS.filter((p: any) => {
        const cat = p.category;
        const catName = (cat?.name || '').toLowerCase();
        const catNameAr = (cat?.name_ar || '').toLowerCase();
        const catNameFr = (cat?.name_fr || '').toLowerCase();
        const catSlug = (cat?.slug || '').toLowerCase();
        const tags = (p.tags || []).map((t: string) => t.toLowerCase());

        if (
          catName.includes(search) ||
          catNameAr.includes(search) ||
          catNameFr.includes(search) ||
          catSlug.includes(search)
        ) {
          return true;
        }

        // Semantic matching
        if ((search.includes('wood') || search.includes('thuya')) && (catName.includes('wood') || tags.includes('wood') || tags.includes('thuya'))) return true;
        if ((search.includes('oil') || search.includes('cosmetic') || search.includes('argan')) && (catName.includes('oil') || tags.includes('argan'))) return true;
        if ((search.includes('rug') || search.includes('carpet') || search.includes('tapestr')) && (catName.includes('rug') || tags.includes('rug'))) return true;
        if ((search.includes('surf') || search.includes('water') || search.includes('gear')) && (catName.includes('surf') || tags.includes('surf'))) return true;
        if (search.includes('leather') && (catName.includes('leather') || tags.includes('leather'))) return true;
        if ((search.includes('culinary') || search.includes('cooking') || search.includes('food')) && (catName.includes('culinary') || tags.includes('culinary'))) return true;
        if ((search.includes('tour') || search.includes('excursion')) && (catName.includes('excursion') || tags.includes('tour'))) return true;
        if ((search.includes('pottery') || search.includes('ceramic')) && (catName.includes('pottery') || tags.includes('pottery'))) return true;

        return false;
      });
    },
  });

  // Client-side quick filter & sort for high-fidelity responsiveness
  const filteredProducts = products.filter((p) => {
    return Number(p.price) <= priceMax;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Dynamically resolve gorgeous premium visual background gradients and tags for categories
  const getCategoryHeroTheme = (catName: string) => {
    const nameLower = catName.toLowerCase();
    if (nameLower.includes('wood') || nameLower.includes('thuya')) {
      return {
        bg: 'from-[#3E2723] to-[#1A0C08]', // warm walnut brown
        accent: '#D7CCC8',
        tagline: 'Authentic Thuya and Lemon woodcraft, hand-sculpted in the Medina cliffside workshops.',
        badge: 'Medina Woodcraft'
      };
    }
    if (nameLower.includes('oil') || nameLower.includes('cosmetic')) {
      return {
        bg: 'from-[#2E7D32] to-[#0A2F1D]', // deep olive green
        accent: '#C8E6C9',
        tagline: '100% Pure, cold-pressed cosmetic Argan oil and botanicals certified organic.',
        badge: 'Vetted Botanicals'
      };
    }
    if (nameLower.includes('leather')) {
      return {
        bg: 'from-[#4E342E] to-[#270F0A]', // chestnut tan leather
        accent: '#D7CCC8',
        tagline: 'Hand-tanned and stitched bags, shoes, and saddles utilizing ancient Medina practices.',
        badge: 'Moroccan Tanning'
      };
    }
    if (nameLower.includes('surf') || nameLower.includes('board')) {
      return {
        bg: 'from-[#0277BD] to-[#002E4E]', // oceanic blue
        accent: '#B3E5FC',
        tagline: 'Bespoke custom surf boards and windsurfing equipment designed for Sidi Kaouki beaches.',
        badge: 'Coastal Surfing'
      };
    }
    if (nameLower.includes('rug') || nameLower.includes('carpet')) {
      return {
        bg: 'from-[#C62828] to-[#420505]', // rich terracotta crimson
        accent: '#FFCDD2',
        tagline: 'Ancient hand-woven Berber carpets and custom rugs crafted by local village collectives.',
        badge: 'Berber Weaving'
      };
    }
    return {
      bg: 'from-[#18181B] to-[#030712]', // elegant default dark indigo
      accent: '#18181B',
      tagline: 'Curated artisanal mastercraft products, fully inspected for fair trade and quality.',
      badge: 'Verified Craft'
    };
  };

  const theme = getCategoryHeroTheme(decodedName);

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] pb-20" >

      {/* 1. Category Hero Banner */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${theme.bg} text-white px-4 py-16 md:py-20 text-center select-none`}>
        {/* Subtle mesh background glows */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 rounded-full bg-white/5 filter blur-3xl" />
        <div className="absolute top-1/3 right-0 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 filter blur-3xl" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Link>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white font-bold text-[9px] tracking-widest rounded-lg uppercase">
              <Sparkles className="w-3 h-3" />
              {theme.badge}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3" >
              {decodedName}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed mt-3 font-light">
              {theme.tagline}
            </p>
          </div>

          <div className="flex justify-center items-center gap-4 pt-2 text-[10px] text-gray-300 font-semibold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-[#10B981]" /> Inspected for Authenticity
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-[#10B981]" /> Direct-to-Artisan Trade
            </span>
          </div>
        </div>
      </section>

      {/* 2. Products Grid Shelves */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 3 COLS: Category Filters Sidebar */}
          <div className="lg:col-span-3 rounded-2xl border border-[rgba(232,227,216,0.45)] bg-white p-5 shadow-sm space-y-6 md:sticky md:top-28 select-none">
            <div className="border-b border-[rgba(232,227,216,0.45)] pb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#18181B] uppercase tracking-wider">
                <SlidersHorizontal className="h-4 w-4 text-[#18181B]" />
                Refine Shelf
              </span>
              <span className="text-[10px] font-bold text-[#71717A]">
                {filteredProducts.length} Items
              </span>
            </div>

            {/* Sorter select */}
            <div className="space-y-2">
              <span className="block text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                Sort Products
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-gray-250 bg-white px-3 py-2 text-xs font-bold text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#18181B]"
              >
                <option value="newest">Newest Listed</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>

            {/* Max price filter */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest">
                <span>Budget Max</span>
                <span className="text-[#18181B] font-bold">{priceMax} DH</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#18181B]"
              />
              <div className="flex justify-between text-[9px] text-[#71717A] font-bold">
                <span>0 DH</span>
                <span>5000 DH</span>
              </div>
            </div>
          </div>

          {/* RIGHT 9 COLS: Product list */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Loader overlay */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[rgba(232,227,216,0.45)] h-96 animate-pulse p-4 flex flex-col justify-between">
                    <div className="aspect-square bg-gray-200 rounded-xl mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 bg-gray-200 rounded" />
                      <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error Callout */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm select-none">
                <h3 className="font-bold text-lg mb-2" >Connection Error</h3>
                <p className="text-xs leading-normal">{error instanceof Error ? error.message : 'Failed to query category products.'}</p>
              </div>
            )}

            {/* Empty Catalog alert */}
            {!isLoading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-20 px-4 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl max-w-md mx-auto shadow-sm select-none">
                <Tag className="w-12 h-12 text-[#71717A] mx-auto mb-4 animate-bounce" />
                <h3 className="font-bold text-lg text-[#18181B] mb-1" >Shelf is Empty</h3>
                <p className="text-xs text-[#71717A] mb-6 leading-relaxed font-light">
                  There are no products matching your selected price budget in "{decodedName}" right now.
                </p>
                <button
                  onClick={() => setPriceMax(3000)}
                  className="text-xs font-bold text-[#18181B] border-b border-[#18181B] hover:text-[#18181B] hover:border-[#18181B] pb-0.5 spring-transition cursor-pointer"
                >
                  Reset Budget Limit
                </button>
              </div>
            )}

            {/* Responsive Products Grid */}
            {!isLoading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
