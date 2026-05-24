'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Sparkles, Store, ArrowRight, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_CATEGORIES = [
  { name: 'Artisanal Wood', icon: '🪵', slug: 'Artisanal Wood', desc: 'Thuya wood crafts' },
  { name: 'Cosmetics & Oils', icon: '🌿', slug: 'Cosmetics & Oils', desc: 'Organic Argan oil' },
  { name: 'Surf Gear', icon: '🏄‍♂️', slug: 'Surf Gear', desc: 'Custom surfboards' },
  { name: 'Leather Goods', icon: '💼', slug: 'Leather Goods', desc: 'Moroccan hand-tanned' },
  { name: 'Moroccan Rugs', icon: '✨', slug: 'Moroccan Rugs', desc: 'Hand-woven rugs' },
  { name: 'Pottery & Ceramic', icon: '🏺', slug: 'Pottery & Ceramic', desc: 'Medina clay pottery' }
];

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Live Query lookup
  const { data: results = [], isLoading } = useQuery<any[]>({
    queryKey: ['live-autocomplete', searchTerm],
    queryFn: async () => {
      const cleanTerm = searchTerm.trim();
      if (!cleanTerm) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(name, slug)')
        .ilike('name', `%${cleanTerm}%`)
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.trim().length > 0,
    staleTime: 1000 * 30, // 30s cache
  });

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    onClose();
  };

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/category/${encodeURIComponent(categorySlug)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Search Header Area */}
      <header className="w-full border-b border-[rgba(232,227,216,0.45)] bg-white/50 px-4 py-4 md:py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand / Icon */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0 select-none">
            <Sparkles className="h-5 w-5 text-[#18181B]" />
            <span className="font-extrabold text-sm text-[#18181B] tracking-wider uppercase" >
              Mogador
            </span>
          </div>

          {/* Core Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#71717A]">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#18181B]" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products, sellers, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-[rgba(232,227,216,0.8)] bg-[#F5F0E8]/50 py-3 pl-12 pr-4 text-sm font-semibold text-[#18181B] placeholder-gray-400 focus:border-[#18181B] focus:bg-white focus:outline-none spring-transition shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-4 flex items-center text-[#71717A] hover:text-[#18181B]"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </form>

          {/* Close Action Button */}
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8E3D8] hover:bg-gray-200 text-[#71717A] hover:text-[#18181B] active:scale-95 spring-transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 w-full overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 5 COLS: Quick Category Hub */}
          <div className="md:col-span-5 space-y-6">
            <div>
              <span className="text-[10px] font-extrabold text-[#18181B] uppercase tracking-widest block">Discovery Hub</span>
              <h2 className="text-lg font-bold text-[#18181B] mt-0.5" >
                Browse Categories
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="flex items-center gap-3.5 w-full text-left p-3 rounded-2xl glass-premium-white border-[rgba(232,227,216,0.45)] hover:border-[#18181B] hover:shadow-md spring-transition group cursor-pointer"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-[#F5F0E8] flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block font-bold text-xs text-[#18181B] truncate group-hover:text-[#18181B] transition-colors">
                      {cat.name}
                    </span>
                    <span className="block text-[10px] text-[#71717A] font-semibold truncate">
                      {cat.desc}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#18181B] group-hover:translate-x-1 spring-transition" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT 7 COLS: Live Results & Suggestions */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Case A: User hasn't typed anything yet */}
            {!searchTerm.trim() && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-extrabold text-[#71717A] uppercase tracking-widest block">Curated Searches</span>
                  <h2 className="text-lg font-bold text-[#18181B] mt-0.5" >
                    Popular Right Now
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {['Thuya Wood Box', 'Argan Hair Oil', 'Berber Carpet', 'Sidi Kaouki Surfboard', 'Leather Tote Bag', 'Traditional Slippers'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-150 bg-white hover:border-[#18181B] hover:text-[#18181B] text-xs font-bold text-[#71717A] spring-transition cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Helpful Tip Box */}
                <div className="rounded-2xl bg-indigo-50/50 border border-[#18181B]/10 p-5 space-y-2">
                  <h4 className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> Smart Buying Guarantee
                  </h4>
                  <p className="text-[11px] text-[#71717A] leading-relaxed font-light">
                    Every merchant is vetted for fair trade and product authenticity. Your orders are securely held in escrow until successfully inspected.
                  </p>
                </div>
              </div>
            )}

            {/* Case B: User has typed and we have matching results */}
            {searchTerm.trim() && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-150 pb-2.5">
                  <span className="text-[10px] font-extrabold text-[#18181B] uppercase tracking-widest">
                    Matching Shelf
                  </span>
                  <span className="text-[10px] font-bold text-[#71717A]">
                    {results.length} Matches
                  </span>
                </div>

                {results.length > 0 ? (
                  <div className="space-y-3">
                    {results.map((product) => {
                      const cover = product.images && product.images.length > 0
                        ? product.images[0]
                        : product.image_url || '/placeholder.jpg';
                      
                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 p-3 rounded-2xl border border-[rgba(232,227,216,0.45)] hover:border-[#18181B] hover:shadow-md spring-transition bg-white group"
                        >
                          <div className="h-14 w-14 rounded-xl border border-gray-150 overflow-hidden bg-[#F5F0E8] shrink-0">
                            <img
                              src={cover}
                              alt={product.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-[#18181B] uppercase">
                              {product.category}
                            </span>
                            <h4 className="font-extrabold text-sm text-[#18181B] truncate mt-0.5 group-hover:text-[#18181B] transition-colors" >
                              {product.name}
                            </h4>
                            {product.stores && (
                              <p className="text-[10px] text-[#71717A] font-semibold mt-0.5 flex items-center gap-1">
                                <Store className="h-3 w-3" /> by {product.stores.name}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-[#18181B]">
                              {product.price} DH
                            </span>
                          </div>
                        </Link>
                      );
                    })}

                    <button
                      onClick={handleSearchSubmit}
                      className="w-full mt-4 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#18181B] hover:bg-[#18181B]/90 text-xs font-bold text-white shadow-md active:scale-95 spring-transition cursor-pointer"
                    >
                      View All Search Results
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  !isLoading && (
                    <div className="text-center py-16 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl p-6">
                      <Search className="h-10 w-10 text-gray-300 mx-auto mb-3 animate-pulse" />
                      <h4 className="font-extrabold text-sm text-[#18181B]" >No matches found</h4>
                      <p className="text-[11px] text-[#71717A] mt-1 max-w-xs mx-auto leading-relaxed">
                        We couldn't find any products matching "{searchTerm}". Try checking your spelling or explore the categories.
                      </p>
                    </div>
                  )
                )}

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 bg-white border border-[rgba(232,227,216,0.45)] rounded-3xl">
                    <Loader2 className="h-8 w-8 animate-spin text-[#18181B]" />
                    <p className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mt-3">Searching catalogs...</p>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}
