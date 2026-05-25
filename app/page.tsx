'use client';

import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Compass, Sparkles, Loader2, ArrowRight, Store as StoreIcon, ShieldCheck, HeartHandshake, MapPin, ChevronRight, ShoppingCart } from 'lucide-react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

// Category names must match names seeded in migration 013 (categories table)
const CATEGORIES = [
  'All',
  'Rugs & Tapestries',
  'Wood Carvings',
  'Oils & Cosmetics',
  'Excursions & Guided Tours',
  'Surf & Water Sports Lessons',
  'Culinary Arts & Cooking Classes',
];

export default function HomePage() {
  const { isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'menu'>('grid');

  const categoryParam = searchParams.get('category') || 'All';

  // Synchronize URL query parameter with selectedCategory state
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  // 1. Fetch Products
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts({
    category: selectedCategory === 'All' ? null : selectedCategory,
  });

  // 2. Fetch Vetted Stores
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['vetted-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*, profiles(full_name), products(id, name, price, images, thumbnail_url)')
        .limit(6);
      if (error) throw error;
      return data || [];
    }
  });

  // 3. SuperDeals Live countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 9, minutes: 50, seconds: 21 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 9, minutes: 50, seconds: 21 }; // Looping countdown
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Slice products for deals boxes
  const bundleDealsProducts = products ? products.slice(0, 3) : [];
  const superDealsProducts = products ? products.slice(3, 6) : [];

  return (
    <div className="w-full min-h-screen bg-[#F5F5F0] select-none pb-16">
      
      {/* ========================================================
          MOBILE-ONLY REDESIGNED HOMEPAGE (ALIEXPRESS APP STYLE)
          ======================================================== */}
      <div className="md:hidden w-full flex flex-col gap-3.5 px-3 pt-3 select-none">
        
        {/* 4. Split deals container: Bundle Deals & Free items */}
        <div className="grid grid-cols-2 gap-3.5 select-none">
          
          {/* Left Panel: Bundle Deals */}
          <div className="bg-[#FAF5FF] rounded-2xl border border-[#F3E8FF] p-3 flex flex-col justify-between shadow-xs min-h-[175px]">
            <div className="w-full">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E9D5FF] pb-1.5 mb-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs">🎁</span>
                  <span className="text-[11px] font-black text-[#1C1917] tracking-tight">Bundle deals</span>
                </div>
                <span className="text-[9px] font-black text-[#E61E42]">3 from 29 DH</span>
              </div>
              {/* Grid items */}
              <div className="grid grid-cols-3 gap-1.5">
                {bundleDealsProducts.length > 0 ? (
                  bundleDealsProducts.map((p) => {
                    const img = p.images && p.images.length > 0 ? p.images[0] : p.thumbnail_url || '/placeholder.jpg';
                    return (
                      <Link key={p.id} href={`/product/${p.id}`} className="flex flex-col items-center gap-1 active:scale-95 transition-all">
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-white border border-[#F3E8FF] shadow-xs">
                          <img src={img} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-black text-[#E61E42] truncate max-w-full">{p.price} DH</span>
                      </Link>
                    );
                  })
                ) : (
                  [1,2,3].map(i => <div key={i} className="aspect-square bg-gray-150 rounded-lg animate-pulse animate-shimmer" />)
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Free Items */}
          <div className="bg-[#FFF5F5] rounded-2xl border border-[#FEE2E2] p-3 flex flex-col justify-between shadow-xs min-h-[175px]">
            <div className="w-full">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#FCA5A5] pb-1.5 mb-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs">🎉</span>
                  <span className="text-[11px] font-black text-[#1C1917] tracking-tight">Free items</span>
                </div>
                <span className="text-[9px] font-black text-[#E61E42]">Buy 1 get 2</span>
              </div>
              {/* Grid items */}
              <div className="grid grid-cols-3 gap-1.5">
                {superDealsProducts.length > 0 ? (
                  superDealsProducts.map((p) => {
                    const img = p.images && p.images.length > 0 ? p.images[0] : p.thumbnail_url || '/placeholder.jpg';
                    return (
                      <Link key={p.id} href={`/product/${p.id}`} className="flex flex-col items-center gap-1 active:scale-95 transition-all">
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-white border border-[#FEE2E2] shadow-xs">
                          <img src={img} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-black text-[#E61E42] truncate max-w-full">Free</span>
                      </Link>
                    );
                  })
                ) : (
                  [1,2,3].map(i => <div key={i} className="aspect-square bg-gray-150 rounded-lg animate-pulse animate-shimmer" />)
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 5. More to Love Gallery Section on mobile */}
        <div className="w-full mt-2.5">
          <div className="text-center pb-2 select-none">
            <h2 className="text-lg font-black text-[#1C1917] tracking-tight uppercase">
              More to love
            </h2>
            <div className="w-12 h-[2.5px] bg-[#E61E42] rounded-full mx-auto mt-1" />
          </div>

          {/* High-density grid of product cards */}
          {!productsLoading && !productsError && products && products.length > 0 && (
            <div className="grid grid-cols-2 gap-3.5 mt-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================
          DESKTOP-ONLY HOMEPAGE (ORIGINAL LAYOUT)
          ======================================================== */}
      <div className="hidden md:block">
        
        {/* 1. AliExpress-Style Tilted Hero Slide Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="w-full rounded-[24px] bg-[#FAF8EE] border border-warm-border p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[300px] md:min-h-[360px] shadow-sm">
            
            {/* Subtle decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#CA8A04]/5 filter blur-2xl" />
            
            {/* Left Text Column */}
            <div className="max-w-md space-y-4 md:space-y-6 text-center md:text-left z-10">
              <h1 className="font-bold text-4xl md:text-5xl text-[#1C1917] tracking-tight leading-[1.15]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Medina Upgrade <br />
                <span className="text-[#CA8A04] font-normal italic">Boost your aesthetic</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#44403C] font-light max-w-sm">
                Discover verified Thuya cedarwood, pure cosmetic Argan elixir, and custom hand-stitched Medina leather goods.
              </p>
              <div className="pt-2">
                <Link 
                  href="/search"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#1C1917] text-white text-xs font-bold hover:bg-[#CA8A04] hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
                >
                  Shop now
                </Link>
              </div>
            </div>

            {/* Right Floating Tilted Image Showcase (Matches AliExpress Screenshot) */}
            <div className="relative w-full md:w-[480px] h-[240px] md:h-[280px] mt-8 md:mt-0 flex items-center justify-center select-none">
              
              {/* Tilted Card 1 (Scale/Thuya box item) */}
              <div className="absolute left-6 top-8 w-44 md:w-52 aspect-[4/3] bg-white border border-warm-border rounded-2xl p-2.5 shadow-md rotate-[-8deg] hover:rotate-[-4deg] transition-all duration-500 z-10 group/tilt1 cursor-pointer">
                <div className="w-full h-full rounded-xl bg-[#FAFAF7] overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1546213290-e1b492ab3eee?w=300"
                    alt="Craft miniature"
                    className="w-full h-full object-cover group-hover/tilt1:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute bottom-2 left-2 rounded bg-[#1C1917] text-[8.5px] font-extrabold text-white px-2 py-0.5 shadow-sm">
                    186.00 DH
                  </span>
                </div>
              </div>

              {/* Tilted Card 2 (Bowl/Argan cosmetic oil item) */}
              <div className="absolute right-6 top-4 w-44 md:w-52 aspect-[4/3] bg-white border border-warm-border rounded-2xl p-2.5 shadow-md rotate-[6deg] hover:rotate-[2deg] transition-all duration-500 z-20 group/tilt2 cursor-pointer">
                <div className="w-full h-full rounded-xl bg-[#FAFAF7] overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300"
                    alt="Cosmetic miniature"
                    className="w-full h-full object-cover group-hover/tilt2:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute bottom-2 left-2 rounded bg-[#C1440E] text-[8.5px] font-extrabold text-white px-2 py-0.5 shadow-sm">
                    604.00 DH
                  </span>
                </div>
              </div>
              
            </div>
          </div>
        </section>

        {/* 2. Today's Deals Split Section (AliExpress Today's deals Box Style) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 select-none">
          
          {/* Deal Section Heading */}
          <div className="text-center pb-5 select-none">
            <h2 className="text-xl md:text-2xl font-black text-[#1C1917] tracking-tight uppercase" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Today's deals
            </h2>
          </div>

          {/* Dual Panel Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
            
            {/* LEFT: Bundle Deals Box (3+ items from 29 DH) */}
            <div className="bg-white rounded-3xl border border-warm-border p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-warm-border/50 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1C1917]">Bundle deals</h3>
                    <span className="rounded-full bg-[#CA8A04] text-white text-[9px] font-black px-2.5 py-0.5 uppercase tracking-wider">
                      3+ from 29.00 DH
                    </span>
                  </div>
                  <Link href="/search" className="text-xs font-bold text-gray-400 hover:text-[#CA8A04] flex items-center gap-0.5">
                    See More <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* 3 mini cards side by side */}
                <div className="grid grid-cols-3 gap-3">
                  {bundleDealsProducts.length > 0 ? (
                    bundleDealsProducts.map((p) => {
                      const imgCover = p.images && p.images.length > 0 ? p.images[0] : p.thumbnail_url || '/placeholder.jpg';
                      return (
                        <Link 
                          key={p.id}
                          href={`/product/${p.id}`}
                          className="group/bundle bg-[#F5F5F0]/50 hover:bg-[#F5F5F0] rounded-2xl border border-warm-border/60 p-2 text-center flex flex-col items-center justify-between transition-colors shadow-sm"
                        >
                          <div className="h-16 w-full rounded-xl overflow-hidden bg-white mb-2">
                            <img src={imgCover} alt={p.name} className="h-full w-full object-cover group-hover/bundle:scale-105 transition-transform" />
                          </div>
                          <span className="text-[10px] font-black text-red-500">{p.price} DH</span>
                        </Link>
                      );
                    })
                  ) : (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: SuperDeals Box (Live countdown timer) */}
            <div className="bg-white rounded-3xl border border-warm-border p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-warm-border/50 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1C1917]">SuperDeals</h3>
                    
                    {/* Countdown pill */}
                    <div className="flex items-center gap-1 bg-red-500 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      <span>Ends in:</span>
                      <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <Link href="/search" className="text-xs font-bold text-gray-400 hover:text-[#CA8A04] flex items-center gap-0.5">
                    See More <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* 3 mini cards side-by-side */}
                <div className="grid grid-cols-3 gap-3">
                  {superDealsProducts.length > 0 ? (
                    superDealsProducts.map((p) => {
                      const imgCover = p.images && p.images.length > 0 ? p.images[0] : p.thumbnail_url || '/placeholder.jpg';
                      return (
                        <Link 
                          key={p.id}
                          href={`/product/${p.id}`}
                          className="group/super bg-[#F5F5F0]/50 hover:bg-[#F5F5F0] rounded-2xl border border-warm-border/60 p-2 text-center flex flex-col items-center justify-between transition-colors shadow-sm"
                        >
                          <div className="h-16 w-full rounded-xl overflow-hidden bg-white mb-2">
                            <img src={imgCover} alt={p.name} className="h-full w-full object-cover group-hover/super:scale-105 transition-transform" />
                          </div>
                          <span className="text-[10px] font-black text-red-500">{p.price} DH</span>
                        </Link>
                      );
                    })
                  ) : (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. Main Product Catalog Section ("More to Love" Style) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Gallery Title */}
          <div className="text-center pb-6 select-none">
            <h2 className="text-2xl font-black text-[#1C1917] tracking-tight uppercase" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              More to love
            </h2>
            <p className="text-xs text-text-secondary mt-1 font-light">
              Discover verified Moroccan hand-craft secrets direct from local Medina ateliers.
            </p>
          </div>

          {/* Category Filter scroll row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 select-none shrink-0 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 border cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-sm'
                    : 'bg-white hover:bg-white/80 text-text-secondary border-warm-border hover:border-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading Skeletons */}
          {productsLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="bg-white rounded-2xl p-3 border border-warm-border h-[260px] flex flex-col justify-between animate-pulse shadow-sm"
                >
                  <div className="w-full h-1/2 rounded-xl bg-gray-100 mb-2" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-gray-100 rounded" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  </div>
                  <div className="w-full h-6 bg-gray-100 rounded-lg mt-3" />
                </div>
              ))}
            </div>
          )}

          {/* Database Connection Error Callout */}
          {productsError && !productsLoading && (
            <div className="mt-8 p-8 bg-red-50 border border-red-100 text-red-800 rounded-3xl text-center max-w-xl mx-auto shadow-sm">
              <h3 className="font-bold text-lg mb-2">Database Syncing Offline</h3>
              <p className="text-xs mb-4 leading-relaxed">{productsError instanceof Error ? productsError.message : 'Failed to query database records.'}</p>
              <p className="text-[10px] text-red-500 font-extrabold tracking-wider uppercase">
                Please verify that the Supabase migration script has run successfully.
              </p>
            </div>
          )}

          {/* Empty Catalog State */}
          {!productsLoading && !productsError && (!products || products.length === 0) && (
            <div className="text-center py-16 px-4 bg-white border border-warm-border rounded-3xl max-w-md mx-auto mt-8 shadow-sm">
              <Compass className="w-10 h-10 text-gray-300 mx-auto mb-4 animate-bounce" />
              <h3 className="font-bold text-base text-[#1C1917] mb-1">No items found</h3>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed font-light">
                We couldn't find any premium products matching your category selections at this moment.
              </p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-xs font-bold text-[#CA8A04] border-b border-[#CA8A04] hover:text-[#1C1917] hover:border-[#1C1917] pb-0.5 transition-all cursor-pointer bg-transparent"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Product Cards High-Density commercial grid */}
          {!productsLoading && !productsError && products && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-8 animate-in fade-in duration-300">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Sticky Bottom Sign In banner on mobile */}
      {!isSignedIn && (
        <div className="fixed bottom-[64px] inset-x-0 z-40 md:hidden bg-[#FFF0F2] border-t border-[#FCA5A5] py-2.5 px-4 flex items-center justify-between select-none shadow-md animate-in slide-in-from-bottom duration-300">
          <span className="text-[11.5px] font-bold text-[#E61E42]">
            Sign in to see personalized deals
          </span>
          <SignInButton mode="modal">
            <button className="px-4 py-1.5 bg-[#E61E42] text-white text-[11px] font-black rounded-full shadow-sm hover:bg-[#D91B3D] transition-colors active-push cursor-pointer">
              Sign in
            </button>
          </SignInButton>
        </div>
      )}

    </div>
  );
}
